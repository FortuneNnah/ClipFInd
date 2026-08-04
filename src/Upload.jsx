import React, { useRef, useState } from "react";
import "./App.css";

const API_URL = "https://clipfind-backend.onrender.com/api";
const HISTORY_KEY = "clipfind-upload-history";

const Upload = () => {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [uploadStatuses, setUploadStatuses] = useState({});
  const [movieResults, setMovieResults] = useState({});
  const [processingText, setProcessingText] = useState("AI is identifying movie...");
 
  const fileSizeLimit = 25 * 1024 * 1024;

  const createHistoryItem = (file, movieResult) => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    originalname: file.name,
    filename: file.name,
    title: movieResult?.title || file.name,
    year: movieResult?.year || null,
    director: movieResult?.director || null,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  });

  const saveHistoryItem = (file, movieResult) => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const nextHistory = [
        createHistoryItem(file, movieResult),
        ...(Array.isArray(parsed) ? parsed : []),
      ];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Unable to save upload history:", error);
    }
  };

  const hasActiveUpload = Object.values(uploadStatuses).some(
    (status) => status?.uploading || status?.processing
  );

  const handleclick = () => {
    if (hasActiveUpload) return;
    fileInputRef.current?.click();
  };

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );

    setUploadStatuses((prev) => {
      const next = { ...prev };
      delete next[indexToRemove];
      return next;
    });

    setMovieResults((prev) => {
      const next = { ...prev };
      delete next[indexToRemove];
      return next;
    });
  };

  // Poll the backend every 3 seconds
  const pollJob = (jobId, index, file) => {
    console.log("Started polling job:", jobId);

    const interval = setInterval(async () => {
      try {
        console.log("Checking job:", jobId);

        const res = await fetch(`${API_URL}/job/${jobId}`);
        const data = await res.json();

        console.log("Job response:", data);

        if (data.status === "processing") {
          setUploadStatuses((prev) => ({
            ...prev,
            [index]: {
              ...prev[index],
              uploading: false,
              processing: true,
              uploaded: false,
              progress: 100,
            },
          }));

          return;
        }

        if (data.status === "completed") {
          clearInterval(interval);

          console.log("Movie identified:", data.result);

          setMovieResults((prev) => ({
            ...prev,
            [index]: data.result,
          }));

          setUploadStatuses((prev) => ({
            ...prev,
            [index]: {
              ...prev[index],
              uploading: false,
              processing: false,
              uploaded: true,
              completed: true,
              progress: 100,
            },
          }));

          if (file) {
            saveHistoryItem(file, data.result);
          }

          return;
        }

        if (data.status === "failed") {
          clearInterval(interval);

          console.error("Movie identification failed.");

          setUploadStatuses((prev) => ({
            ...prev,
            [index]: {
              ...prev[index],
              uploading: false,
              processing: false,
              uploaded: false,
              error: "Unable to identify movie.",
            },
          }));
        }
      } catch (error) {
        clearInterval(interval);

        console.error("Polling error:", error);

        setUploadStatuses((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            uploading: false,
            processing: false,
            error: "Unable to check processing status",
          },
        }));
      }
    }, 3000);
  };

  // Upload one video
  const uploadSingle = (file, index) => {
    return new Promise((resolve) => {
      setUploadStatuses((prev) => ({
        ...prev,
        [index]: {
          uploading: true,
          processing: false,
          uploaded: false,
          progress: 0,
        },
      }));

      const form = new FormData();
      form.append("video", file);

      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${API_URL}/upload`);

      // Upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round(
            (event.loaded / event.total) * 100
          );

          setUploadStatuses((prev) => ({
            ...prev,
            [index]: {
              ...prev[index],
              uploading: true,
              processing: false,
              progress,
            },
          }));
        }
      };

      // Upload finished
      xhr.onload = () => {
        console.log("Upload status:", xhr.status);
        console.log("Upload response:", xhr.responseText);

        if (xhr.status === 202) {
          try {
            const data = JSON.parse(xhr.responseText || "{}");

            console.log("Job created:", data.jobId);

            if (data.jobId) {
              // AI processing has started
              setUploadStatuses((prev) => ({
                ...prev,
                [index]: {
                  uploading: false,
                  processing: true,
                  uploaded: false,
                  progress: 100,
                },
              }));

              setProcessingText("AI is identifying movie...");

              setTimeout(() => {
                setProcessingText("Analyzing scenes...")
              },2000)
              setTimeout(() => {
                setProcessingText("Almost done...")
              },3500)

              // Start polling
              pollJob(data.jobId, index, file);

              resolve();
              return;
            }

            console.error("No jobId returned from backend.");

            setUploadStatuses((prev) => ({
              ...prev,
              [index]: {
                uploading: false,
                processing: false,
                error: "No job ID returned",
              },
            }));
          } catch (error) {
            console.error("Invalid server response:", error);

            setUploadStatuses((prev) => ({
              ...prev,
              [index]: {
                uploading: false,
                processing: false,
                error: "Invalid server response",
              },
            }));
          }
        } else {
          console.error(
            "Upload failed:",
            xhr.status,
            xhr.responseText
          );

          setUploadStatuses((prev) => ({
            ...prev,
            [index]: {
              uploading: false,
              processing: false,
              error: `Upload failed (${xhr.status})`,
            },
          }));
        }

        resolve();
      };

      // Network error
      xhr.onerror = () => {
        console.error("Upload network error");

        setUploadStatuses((prev) => ({
          ...prev,
          [index]: {
            uploading: false,
            processing: false,
            error: "Upload error",
          },
        }));

        resolve();
      };

      xhr.send(form);
    });
  };

  const handleUploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Skip files that are already completed
      if (uploadStatuses[i]?.completed) {
        continue;
      }

      // Check file size
      if (file.size > fileSizeLimit) {
        setUploadStatuses((prev) => ({
          ...prev,
          [i]: {
            uploading: false,
            processing: false,
            error: "File too large",
          },
        }));

        continue;
      }

      await uploadSingle(file, i);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  return (
    <>
      <main className="upload-container">
        <div className="heading">
          <p className="aitext">
            AI · POWERED SCENE RECOGNITION
          </p>

          <h1>Found a Scene?</h1>

          <h2>
            We'll <span className="clip">Find</span> the Movie.
          </h2>

          <p>
            Upload any movie clip and our AI identifies it instantly —
            title, cast, director, and more.
          </p>
        </div>

        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="upload-area-inner">
            <div className="drag-icon" aria-hidden="true">
              ⬇
            </div>

            <p className="dragtxt">
              Drag & drop your clip here
            </p>
            
            <p className="Or">or</p>

            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              id="fileInput"
              multiple
              onChange={handleInputChange}
            />

            <button
              onClick={handleclick}
              type="button"
              className="uploadBtn"
              id="uploadBtn"
            >
              Browse Files
            </button>

            <p className="note">
              Supports video files * Max 25MB per file
            </p>
          </div>
        </div>

        <div className="file-list">
          {files.length > 0 ? (
            <>
              <div className="file-items-container">
                {files.map((file, index) => {
                  const isOverLimit = file.size > fileSizeLimit;

                  const fileSize = (
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2);

                  const status = uploadStatuses[index] || {};

                  return (
                    <div
                      key={index}
                      className={`file-item ${isOverLimit ? "error" : ""
                        }`}
                    >
                      {/* <div className="file-item-icon">
                        🎬
                      </div> */}

                      <div className="file-item-details">
                        <span
                          className="file-name"
                          title={file.name}
                        >
                          {file.name}
                        </span>

                        <span
                          className={`file-size ${isOverLimit ? "error" : ""
                            }`}
                        >
                          {isOverLimit ? (
                            <>
                              <span className="error-badge">
                                ⚠️ Exceeds 25MB
                              </span>

                              <span className="file-size-value">
                                {fileSize} MB
                              </span>
                            </>
                          ) : (
                            <span className="file-size-value">
                              {fileSize} MB
                            </span>
                          )}
                        </span>

                        <div className="upload-status">
                          {status.uploading && (
                            <span className="status uploading">
                              Uploading…
                            </span>
                          )}

                          {status.processing && (
                            <span className="status processing">
                              {processingText}
                            </span>
                          )}

                          {status.completed && (
                            <span className="status uploaded">
                              ✔ Movie identified
                            </span>
                          )}

                          {status.error && (
                            <span className="status error">
                              {status.error}
                            </span>
                          )}
                        </div>

                        {status.uploading && (
                          <div className="progress-wrapper">
                            <div className="progress-bar">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${status.progress}%`,
                                }}
                              />
                            </div>

                            <span className="progress-label">
                              {status.progress}%
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() =>
                          handleRemoveFile(index)
                        }
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* FILE ACTIONS */}
              <div className="file-list-header">
                <h3>
                  {files.length} file
                  {files.length !== 1 ? "s" : ""} selected
                </h3>

                <div className="file-list-actions">
                  <button
                    type="button"
                    className="uploadAllBtn"
                    onClick={handleUploadAll}
                    disabled={hasActiveUpload}
                  >
                    {hasActiveUpload ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </div>

              {/* MOVIE RESULTS */}
              {Object.keys(movieResults).length > 0 && (
                <div className="upload-result-container">

                  <div className="result-header">
                    <div>
                      <h3>Movie Identified</h3>

                      <p>
                        Here's what we found from your clip.
                      </p>
                    </div>
                  </div>

                  <div className="movie-results-list">

                    {Object.entries(movieResults).map(
                      ([index, movie]) => {
                        const posterUrl =
                          typeof movie.poster_path === "string" && movie.poster_path.trim()
                            ? movie.poster_path
                            : typeof movie.poster === "string" && movie.poster.trim()
                              ? movie.poster
                              : "";

                        return (
                          <div className="movie-result" key={index}>
                            <div className="movie-result-icon">
                              {posterUrl ? (
                                <img
                                  src={posterUrl}
                                  alt={movie.title ? `${movie.title} poster` : "Movie poster"}
                                />
                              ) : (
                                "🎬"
                              )}
                            </div>
                            <div className="movie-result-info">
                              <h3>{movie.title}</h3>

                              {movie.year && (
                                <p>
                                  <strong>Year:</strong>{" "}
                                  {movie.year}
                                </p>
                              )}

                              {movie.director && (
                                <p>
                                  <strong>Director:</strong>{" "}
                                  {movie.director}
                                </p>
                              )}

                              {movie.genre && (
                                <p>
                                  <strong>Genre:</strong>{" "}
                                  {movie.genre}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}

                  </div>

                </div>
              )}
            </>
          ) : (
            <p className="no-files">
              No files selected
            </p>
          )}
        </div>
      </main>
    </>
  );
};

export default Upload;

