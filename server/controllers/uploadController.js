import Job from '../models/Job.js';
import { extractFrames } from '../utils/extractFrames.js';
import { searchByDialogue } from '../services/tmdb.js'; 
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobePath.path);

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

// Cleanup function to wipe local files immediately after use
const cleanupFiles = (filePath, Frames_dir) => {
  try {
    const audioPath = filePath.replace(/\.[^/.]+$/, '.wav');
    const compressedPath = filePath.replace(/\.[^/.]+$/, '_compressed.mp3');

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
    if (fs.existsSync(Frames_dir)) {
      fs.rmSync(Frames_dir, { recursive: true, force: true });
      console.log(`Successfully deleted temporary frames folder: ${Frames_dir}`);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};

const uploadVideo = async (req, res) => {
  let videoPath = null;
  let Frames_dir = null;

  try {
    // File Validation
    if (!req.file) {
      return res.status(400).json({ 
        error: "Missing File", 
        message: "Please select a video file to upload." 
      });
    }

    const filename = req.file.filename;
    const originalFilename = req.file.originalname;
    videoPath = req.file.path; 

    // Duration Check
    const duration = await getVideoDuration(videoPath);
    console.log(`Uploaded video duration: ${duration} seconds`);

    if (duration > 180) {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      return res.status(400).json({ 
        error: "File Too Large", 
        message: "Your clip is over 3 minutes. Please trim it and try again." 
      });
    }

    // Setup Temp Frames Directory
    const uploadId = Date.now();
    Frames_dir = path.join(path.resolve(), 'frames', `upload-${uploadId}`);
    fs.mkdirSync(Frames_dir, { recursive: true });

    // Extract Frames
    await extractFrames(videoPath, Frames_dir, duration);
    const frames = fs.readdirSync(Frames_dir);
    console.log("Frames found:", frames.length);

    const framePaths = frames.map(frame => path.join(Frames_dir, frame));

    //  Create and Save Pending Job
    const newJob = new Job({
      filename,
      frames: [],
      status: 'processing',
      result: null
    });
    await newJob.save();

  
    res.status(202).json({
      message: "Processing started",
      jobId: newJob._id
    });

    
    console.log('Deploying Streamlined Visual Matcher...');
    searchByDialogue("", [], originalFilename, framePaths)
      .then(async (matchResults) => {
        const bestMatch = (matchResults && matchResults.length > 0) ? matchResults[0] : null;
        
        if (bestMatch && !bestMatch.director) {
          bestMatch.director = "Unknown";
        }
        
        await Job.findByIdAndUpdate(newJob._id, {
          movies: matchResults || [],
          result: bestMatch,
          status: bestMatch ? 'completed' : 'failed'
        });
        console.log(`Job ${newJob._id} completed processing.`);
      })
      .catch(async (err) => {
        console.error("Background AI failed:", err.message || err);
        
        const failureReason = err.code === 'ECONNRESET' || err.name === 'APIConnectionError'
          ? "Network error. Please check your internet connection and try again."
          : (err.message || "AI Analysis Failed");

        await Job.findByIdAndUpdate(newJob._id, { 
          status: 'failed',
          error: failureReason 
        }).catch(() => {});
      })
      .finally(() => {
        cleanupFiles(videoPath, Frames_dir);
      });

  } catch (error) {
    console.error("Critical Upload Failure:", error);
    if (videoPath || Frames_dir) {
      cleanupFiles(videoPath, Frames_dir);
    }

    if (!res.headersSent) {
      res.status(502).json({ 
        error: "Processing Error", 
        message: "The AI analysis engine is currently unavailable. Please try again in a moment."  
      });
    }
  }
};

export { uploadVideo };