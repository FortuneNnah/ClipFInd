import Job from '../models/Job.js';
import { identifyVideoWithGemini, identifyUrlWithGemini } from '../services/geminiService.js';
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

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

const cleanupFiles = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};

// Platform detector
const isYouTube = (url) => url.includes('youtube.com') || url.includes('youtu.be');
const isTikTok = (url) => url.includes('tiktok.com');
const isTwitter = (url) => url.includes('twitter.com') || url.includes('x.com');

// Direct file upload handler
const uploadVideo = async (req, res) => {
  let videoPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing File", message: "Please select a video file." });
    }

    const filename = req.file.filename;
    videoPath = req.file.path;

    const duration = await getVideoDuration(videoPath);
    if (duration > 180) {
      cleanupFiles(videoPath);
      return res.status(400).json({ error: "File Too Large", message: "Your clip is over 3 minutes. Please trim it." });
    }

    const newJob = new Job({
      filename,
      status: 'processing',
      result: null
    });
    await newJob.save();

    res.status(202).json({ message: "Processing started", jobId: newJob._id });

    console.log('Deploying Gemini Vision Matcher...');
    identifyVideoWithGemini(videoPath)
      .then(async (bestMatch) => {
        if (bestMatch && !bestMatch.director) bestMatch.director = "Unknown";
        await Job.findByIdAndUpdate(newJob._id, {
          result: bestMatch,
          status: bestMatch?.foundMatch ? 'completed' : 'failed'
        });
        console.log(`Job ${newJob._id} completed.`);
      })
      .catch(async (err) => {
        console.error("Background AI failed:", err);
        await Job.findByIdAndUpdate(newJob._id, { status: 'failed' });
      })
      .finally(() => {
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

// Social media URL handler
export const uploadFromUrl = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: "No URL provided" });
    }

    const newJob = new Job({ status: "processing" });
    await newJob.save();

    res.status(202).json({ message: "URL processing started", jobId: newJob._id });

    // Route by platform
    if (isYouTube(videoUrl)) {
      // YouTube — send directly to Gemini
      console.log('[ROUTER] YouTube detected — sending to Gemini directly');
      identifyUrlWithGemini(videoUrl)
        .then(async (result) => {
          if (result && !result.director) result.director = "Unknown";
          await Job.findByIdAndUpdate(newJob._id, {
            result,
            status: result?.foundMatch ? 'completed' : 'failed'
          });
          console.log(`YouTube Job ${newJob._id} completed.`);
        })
        .catch(async (err) => {
          console.error("Gemini YouTube failed:", err);
          await Job.findByIdAndUpdate(newJob._id, { status: 'failed' });
        });

    } else {
      // TikTok, Twitter/X and others — download first then send to Gemini
      console.log(`[ROUTER] ${isTikTok(videoUrl) ? 'TikTok' : isTwitter(videoUrl) ? 'Twitter/X' : 'Other'} detected — downloading first`);
      
      let downloadedFilePath = null;
      downloadSocialVideo(videoUrl, UPLOAD_DIR)
        .then(async (filePath) => {
          downloadedFilePath = filePath;
          const result = await identifyVideoWithGemini(filePath);
          if (result && !result.director) result.director = "Unknown";
          await Job.findByIdAndUpdate(newJob._id, {
            result,
            status: result?.foundMatch ? 'completed' : 'failed'
          });
          console.log(`URL Job ${newJob._id} completed.`);
        })
        .catch(async (err) => {
          console.error("Download/Gemini failed:", err);
          await Job.findByIdAndUpdate(newJob._id, {
            status: 'failed',
            result: { error: "Failed to process this link." }
          });
        })
        .finally(() => {
          if (downloadedFilePath) cleanupFiles(downloadedFilePath);
        });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to initiate URL job" });
  }
};

export { uploadVideo };