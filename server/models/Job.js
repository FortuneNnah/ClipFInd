import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    filename: String,
    status: {
        type: String,
        default: 'pending'
    },
    frames: [String],
    transcript: String,
    celebrities: [
        {
            name: String,
            confidence: Number,
            urls: [String]
        }
    ],
    result: {
        title: String,
        year: String,
        cast: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Job', jobSchema);