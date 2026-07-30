import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import jobRouter from './routes/job.js';
import uploadRouter from './routes/upload.js';

const __dirname = path.resolve();
const Frames_dir = path.join(__dirname, 'frames');

if (!fs.existsSync(Frames_dir)) fs.mkdirSync(Frames_dir, { recursive: true });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/frames', express.static(Frames_dir));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected '))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api', jobRouter);
app.use('/api', uploadRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));