const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
    filename: String,
    status: {
        type: String,
        default: 'pending'
    },
    frames: [String],
    transcript: String,
    celebrities: [String],
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

module.exports = mongoose.model('Job', jobSchema);