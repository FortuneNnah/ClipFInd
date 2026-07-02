const Job = require('../models/Job');

const uploadVideo = async (req, res) => {
  try {
        if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
    }

    const filename = req.file.filename;

    const newJob = new Job ({
        filename,
    });
    await newJob.save();
    res.status(201).json({message: "Video uploaded successfully", jobId: newJob._id});

  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = { uploadVideo };