import Job from '../models/Job.js';

const getJob = async (req, res) => {
    try {
      const id = req.params.id;

      const job = await Job.findById(id).select('-frames -__v -movies -filename');
      
      if (!job) {
        return res.status(404).json({ 
          error: "Not Found", 
          message: "This processing job does not exist. Check your ID." 
        });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Database Retrieval Error:", error);
      res.status(500).json({ 
        error: "Database Error", 
        message: "We encountered an issue retrieving your results." 
      });
    }
  };

export { getJob };