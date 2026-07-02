import Job from '../models/Job.js';
import { extractFrames } from '../utils/extractFrames.js';
import fs from 'fs';
import path from 'path';


const uploadVideo = async (req, res) => {
  

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const Frames_dir = path.join(path.resolve(), 'frames');

    await extractFrames(req.file.path, Frames_dir);
    const frames = fs.readdirSync(Frames_dir);
    const filename = req.file.filename;
    const newJob = new Job({ filename, frames });
    await newJob.save();
    res.status(201).json({ message: "Video uploaded successfully", jobId: newJob._id });

  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { uploadVideo };