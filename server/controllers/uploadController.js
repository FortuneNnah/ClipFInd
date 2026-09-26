import Job from '../models/Job.js';
import { identifyVideoWithGemini } from '../services/geminiService.js';
import { downloadSocialVideo } from '../utils/downloadSocialVideo.js'; 
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from 'ffprobe-static';
import path from 'path';

const __dirname = path.resolve();
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}


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


export const uploadFromUrl = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: "No URL provided" });
    }

    // 1. Create the Database Job Immediately
    const newJob = new Job({ status: "processing" });
    await newJob.save();
    
    // 2. Respond to Postman/Frontend instantly
    res.status(202).json({ message: "URL processing started", jobId: newJob._id });

   // 3. Process the video in the background
    let downloadedFilePath = null;
    try {
      //  Download the video
      downloadedFilePath = await downloadSocialVideo(videoUrl, UPLOAD_DIR);

      if (!downloadedFilePath) {
         throw new Error("Download completed but file was not found.");
      }

      // Send the newly downloaded file to Gemini
      const result = await identifyVideoWithGemini(downloadedFilePath);

      // Update the MongoDB job with the final movie data
      await Job.findByIdAndUpdate(newJob._id, { status: "completed", result });

    } catch (error) {
      console.error("Background URL AI failed:", error);
      let customErrorMessage = "Failed to process the social media link.";
      
      if (error.status === 503 || (error.message && error.message.includes("high demand"))) {
        customErrorMessage = "We are currently experiencing high demand. Please try again later.";
      }

      await Job.findByIdAndUpdate(newJob._id, { 
        status: "failed", 
        result: { error: customErrorMessage } 
      });
    } finally {
      //  Always delete the temporary file from the server
      if (downloadedFilePath) cleanupFiles(downloadedFilePath);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to initiate URL job" });
  }
};


export { uploadVideo };