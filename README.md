# 🎬 ClipFind

ClipFind is an AI-powered movie search platform inspired by the concept of "Shazam for movies." Users can upload video clips and the system analyzes frames to identify the movie title, cast, release year, and streaming availability.

## 📋 Table of Contents

- [Project Vision](#project-vision)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Future Roadmap](#future-roadmap)

## 🎯 Project Vision

People constantly encounter movie scenes online through various platforms:
- TikTok edits
- Instagram reels
- YouTube shorts
- Twitter/X clips
- Memes and fan edits

Most of the time, users don't know which movie these scenes are from. **ClipFind** solves this problem by allowing users to upload clips directly and instantly discover:

- Movie title
- Release year
- Cast and crew
- Director
- Genre
- Streaming availability

## ✨ Features

### Current Features
- ✅ Drag & drop video upload
- ✅ Custom file upload UI with visual feedback
- ✅ Video file preview support
- ✅ Multiple file upload support (up to 50 files per request)
- ✅ Responsive upload interface
- ✅ Modern React-based frontend
- ✅ Frame extraction from videos (1 frame per second)
- ✅ File size validation (6MB limit per file)
- ✅ Sequential and parallel upload handling
- ✅ Upload status tracking for each file
- ✅ Error handling and user feedback

### Planned Features
- 🔜 AI-powered movie identification using frame analysis
- 🔜 Frame-by-frame analysis with scene recognition
- 🔜 Audio fingerprinting technology
- 🔜 Subtitle and dialogue matching
- 🔜 Actor recognition and face detection
- 🔜 Streaming platform discovery
- 🔜 Watchlists and saved searches
- 🔜 Similar movie recommendations

## 🛠 Tech Stack

### Frontend
- **React** 19.2.6 - UI library
- **Vite** 8.0.12 - Build tool and dev server
- **JavaScript (ES Modules)** - Modern JavaScript
- **CSS3** - Styling with responsive design
- **React Hooks** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** 4.18.2 - Web framework
- **Multer** 1.4.5 - File upload middleware
- **Fluent-FFmpeg** 2.1.3 - FFmpeg wrapper for frame extraction
- **FFmpeg Static** 5.3.0 - Bundled FFmpeg binary
- **CORS** 2.8.5 - Cross-Origin Resource Sharing

### Development Tools
- **ESLint** 10.3.0 - Code linting
- **Vite React Plugin** 6.0.1 - React integration for Vite

## 📦 Prerequisites

Before running this project, ensure you have installed:

- **Node.js** 14+ (LTS recommended)
- **npm** 6+ or **yarn**
- **FFmpeg** (automatically bundled via ffmpeg-static)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ClipFind
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## 📁 Project Structure

```
ClipFind/
├── public/                 # Static files served to clients
├── server/                 # Backend Express application
│   ├── index.js           # Main server entry point
│   ├── package.json       # Backend dependencies
│   ├── frames/            # Extracted video frames (output)
│   ├── uploads/           # Uploaded video files (temporary)
│   └── utils/
│       └── extractFrames.js  # FFmpeg frame extraction utility
├── src/                   # Frontend React application
│   ├── App.jsx            # Main App component
│   ├── App.css            # Application styles
│   ├── Upload.jsx         # File upload component
│   ├── main.jsx           # React entry point
│   └── assets/            # Images and static assets
├── index.html             # HTML entry point
├── vite.config.js         # Vite configuration
├── eslint.config.js       # ESLint configuration
├── package.json           # Frontend dependencies and scripts
└── README.md              # Project documentation
```

## ▶️ Running the Application

### Development Mode

#### Terminal 1 - Start Backend Server

```bash
cd server
npm start
```

The backend server will start on `http://localhost:4000`

**Expected Output:**
```
Server running on port 4000
```

#### Terminal 2 - Start Frontend Dev Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite suggests)

### Production Build

```bash
# Build frontend
npm run build

# Preview the build
npm run preview
```

The optimized production build will be in the `dist/` directory.

## 📡 API Documentation

### Upload Endpoints

#### Single File Upload

**Endpoint:** `POST /upload`

**Description:** Upload a single video file for frame extraction.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body Parameter:** `video` (file)
- **Max File Size:** 6MB

**Response (Success):**
```json
{
  "success": true,
  "filename": "1718555123456-sample_video.mp4",
  "path": "/uploads/1718555123456-sample_video.mp4",
  "originalname": "sample_video.mp4",
  "size": 5242880,
  "frames": ["frame-001.png", "frame-002.png", "frame-003.png"]
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

#### Multiple File Upload

**Endpoint:** `POST /upload-multiple`

**Description:** Upload multiple video files at once (up to 50 files per request).

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body Parameter:** `videos` (files)
- **Max Files:** 50
- **Max File Size:** 6MB per file

**Response (Success):**
```json
{
  "success": true,
  "files": [
    {
      "filename": "1718555123456-video1.mp4",
      "originalname": "video1.mp4",
      "size": 5242880
    },
    {
      "filename": "1718555123457-video2.mp4",
      "originalname": "video2.mp4",
      "size": 3145728
    }
  ]
}
```

#### Health Check

**Endpoint:** `GET /`

**Description:** Check if the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

#### Serve Extracted Frames

**Endpoint:** `GET /frames/<filename>`

**Description:** Access extracted frame images.

**Example:** `http://localhost:4000/frames/frame-001.png`

## 💻 Development Guide

### Frontend Development

The frontend is built with React and uses Vite for fast development and hot module replacement (HMR).

**Key Components:**

- **App.jsx** - Main application wrapper
- **Upload.jsx** - Handles file uploads, drag-and-drop, and upload management

**Key Features:**
- Real-time upload status tracking
- Drag-and-drop file selection
- Multiple file support
- Error handling and user feedback

### Backend Development

The backend uses Express.js with middleware for CORS and JSON parsing.

**Key Files:**

- **index.js** - Server setup and route handlers
- **utils/extractFrames.js** - FFmpeg integration for frame extraction

**Key Features:**
- File upload handling with Multer
- Automatic directory creation for uploads and frames
- Frame extraction at 1 frame per second
- Error handling and logging

### Code Quality

Run ESLint to check code quality:

```bash
npm run lint
```

## 🗂️ File Upload Workflow

1. **User selects/drags files** → Files added to upload queue
2. **Upload initiated** → Files sent to backend `/upload` endpoint
3. **Backend processes** → Video stored, FFmpeg extracts frames
4. **Frames generated** → Stored in `server/frames/` directory
5. **Response sent** → Frontend receives frame filenames and upload status
6. **User sees results** → Upload marked as complete/failed

## 📝 Configuration Files

### vite.config.js
Configures Vite build tool and React plugin integration.

### eslint.config.js
Defines linting rules for code quality.

### package.json (Root)
Frontend dependencies and build scripts.

### server/package.json
Backend dependencies.

## 🐛 Troubleshooting

### Port Already in Use

If port 4000 or 5173 is already in use:

**For Backend:**
```bash
# Kill process on port 4000 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

### FFmpeg Issues

If frame extraction fails, ensure `ffmpeg-static` is properly installed:

```bash
cd server
npm install ffmpeg-static --save
```

### CORS Errors

The backend has CORS enabled. If you see CORS errors, check that:
- Backend is running on `http://localhost:4000`
- Frontend is correctly configured to hit the backend URL

### Upload Fails

Common issues:
- File exceeds 6MB limit
- Backend not running
- Network connectivity issues

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vite.dev)
- [Express.js Guide](https://expressjs.com)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Multer Documentation](https://github.com/expressjs/multer)

## 🚦 Future Roadmap

### Phase 1: Frame Analysis (In Progress)
- [ ] Integrate AI model for frame analysis
- [ ] Movie database integration
- [ ] Scene matching algorithm

### Phase 2: Enhanced Features
- [ ] Audio fingerprinting
- [ ] Actor recognition
- [ ] Streaming platform integration

### Phase 3: User Experience
- [ ] User authentication
- [ ] Watchlist functionality
- [ ] Search history
- [ ] Recommendations

### Phase 4: Mobile & Extensions
- [ ] React Native mobile app
- [ ] Browser extension
- [ ] API for third-party developers

## 📄 License

This project is private and proprietary. Please contact the maintainers for licensing information.

## 👥 Contributing

For contribution guidelines and procedures, please contact the project maintainers.

## 📧 Support

For questions, bug reports, or feature requests, please open an issue in the project repository.

---

**Last Updated:** June 2026  
**Version:** 0.0.1
* FFmpeg<br>
* Supabase
