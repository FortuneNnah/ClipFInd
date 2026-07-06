import Job from '../models/Job.js';
import { extractFrames } from '../utils/extractFrames.js';
import { recognizeCelebrities } from '../services/rekognition.js';
import { searchMoviesByCelebrity } from '../services/tmdb.js';
import { findBestMatch } from '../services/movieMatcher.js';
import fs from 'fs';
import path from 'path';


const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filename = req.file.filename;

    // create unique folder FIRST
    const uploadId = Date.now();
    const Frames_dir = path.join(path.resolve(), 'frames', `upload-${uploadId}`);
    fs.mkdirSync(Frames_dir, { recursive: true });

    // then extract frames into that folder
    await extractFrames(req.file.path, Frames_dir);

    // then read frames
    const frames = fs.readdirSync(Frames_dir);


    // recognize celebrities in each frame  
    const celebrityResults = [];
    for (const frame of frames) {
      const framePath = path.join(Frames_dir, frame);
      const result = await recognizeCelebrities(framePath);
      celebrityResults.push(...result);
    }

      //  search TMDB once
      const uniqueNames = [...new Set(
        celebrityResults
          .filter(c => c.confidence > 50)
          .map(c => c.name)
      )];
      const movieResults = [];
      for (const name of uniqueNames) {
        const movies = await searchMoviesByCelebrity(name);
        movieResults.push({ name, movies });
      }
      const bestMatch = findBestMatch(movieResults);
      console.log('Best Match:', bestMatch);


      // save everything to Job
      const newJob = new Job({ 
        filename, 
        frames, 
        celebrities: celebrityResults,
        movies: movieResults,
        result: bestMatch 
      });
      await newJob.save();
   

    res.status(201).json({ 
      message: "Video uploaded successfully", 
      jobId: newJob._id,
      bestMatch
    });

  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { uploadVideo };