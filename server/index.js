import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const __dirname = path.resolve();
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ status: 'ok' });
});

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ success: true, filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

// accept multiple files in one request under field name 'videos'
app.post('/upload-multiple', upload.array('videos', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const files = req.files.map((f) => ({ filename: f.filename, path: `/uploads/${f.filename}`, originalname: f.originalname }));
  res.json({ success: true, files });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
