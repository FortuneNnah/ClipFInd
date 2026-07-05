import Job from '../models/Job.js';
import { extractFrames } from '../utils/extractFrames.js';
import { recognizeCelebrities } from '../services/rekognition.js';
import { searchMoviesByCelebrity } from '../services/tmdb.js';
import fs from 'fs';
import path from 'path';


const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filename = req.file.filename;

    const Frames_dir = path.join(path.resolve(), 'frames');

    //  extract frames
    await extractFrames(req.file.path, Frames_dir);

    // read frames
    const frames = fs.readdirSync(Frames_dir);

    // loop through frames 
      const celebrityResults = [];
      for (const frame of frames) {
        const framePath = path.join(Frames_dir, frame);
        const result = await recognizeCelebrities(framePath);
        celebrityResults.push(...result);
      }

      //  search TMDB once
      const uniqueNames = [...new Set(celebrityResults.map(c => c.name))];
      const movieResults = [];
      for (const name of uniqueNames) {
        const movies = await searchMoviesByCelebrity(name);
        movieResults.push({ name, movies });
      }

      // save everything to Job
      const newJob = new Job({ 
        filename, 
        frames, 
        celebrities: celebrityResults,
        movies: movieResults 
      });
      await newJob.save();
   

    res.status(201).json({ 
      message: "Video uploaded successfully", 
      jobId: newJob._id,
    });

  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { uploadVideo };