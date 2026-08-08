import Job from '../models/Job.js';
import { identifyVideoWithGemini } from '../services/geminiService.js'; 
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobePath.path);

// Keep the duration check so people don't upload massive files
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

// Streamlined cleanup: Only needs to delete the video!
const cleanupFiles = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted temporary video from Render disk: ${filePath}`);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};

const uploadVideo = async (req, res) => {
  let videoPath = null;

  try {
    // 1. File Validation
    if (!req.file) {
      return res.status(400).json({ error: "Missing File", message: "Please select a video file." });
    }

    const filename = req.file.filename;
    videoPath = req.file.path; 

    // 2. Duration Check
    const duration = await getVideoDuration(videoPath);
    if (duration > 180) {
      cleanupFiles(videoPath); 
      return res.status(400).json({ error: "File Too Large", message: "Your clip is over 3 minutes. Please trim it." });
    }

    // 3. Create and Save Pending Job
    const newJob = new Job({
      filename,
      status: 'processing',
      result: null
    });
    await newJob.save();

    // 4. Respond immediately to the frontend
    res.status(202).json({ message: "Processing started", jobId: newJob._id });

    // 5. Background AI Processing with Gemini
    console.log('Deploying Gemini Vision Matcher...');
    identifyVideoWithGemini(videoPath)
      .then(async (bestMatch) => {
        if (bestMatch && !bestMatch.director) bestMatch.director = "Unknown";
        
        await Job.findByIdAndUpdate(newJob._id, {
          result: bestMatch,
          status: bestMatch?.foundMatch ? 'completed' : 'failed'
        });
        console.log(`Job ${newJob._id} completed processing.`);
      })
      .catch(async (err) => {
        console.error("Background AI failed:", err);
        await Job.findByIdAndUpdate(newJob._id, { status: 'failed', error: "AI Analysis Failed" }).catch(() => {});
      })
      .finally(() => {
        // Automatically wipes the video off the server right after AI processing!
        cleanupFiles(videoPath);
      });

  } catch (error) {
    console.error("Critical Upload Failure:", error);
    cleanupFiles(videoPath);
    if (!res.headersSent) {
      res.status(502).json({ error: "Processing Error", message: "Please try again." });
    }
  }
};

export { uploadVideo };