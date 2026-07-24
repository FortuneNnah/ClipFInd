import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  filename: String,
  status: {
    type: String,
    default: 'processing'
  },
  frames: [String],
  movies: [Object],      
  result: Object,        
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Job', jobSchema);