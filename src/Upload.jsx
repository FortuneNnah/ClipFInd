import React, { useRef, useState } from "react";
import "./App.css";

const Upload = () => {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [uploadStatuses, setUploadStatuses] = useState({});

  const handleclick = () => {
    fileInputRef.current.click();
  };

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = null; // Clear the input value to allow re-uploading the same file if needed
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
      prevFiles.filter((_, index) => index !== indexToRemove),
    );
    setUploadStatuses((prev) => {
      const next = { ...prev };
      delete next[indexToRemove];
      return next;
    });
  };
  const fileSizeLimit = 6 * 1024 * 1024;

  const uploadSingle = (file, index) => {
    return new Promise((resolve) => {
      setUploadStatuses((s) => ({
        ...s,
        [index]: { uploading: true, progress: 0 },
      }));

      const form = new FormData();
      form.append("video", file);
      const xhr = new XMLHttpRequest();

      xhr.open("POST", "http://localhost:4000/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadStatuses((s) => ({
            ...s,
            [index]: {
              ...s[index],
              uploading: true,
              progress,
            },
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText || "{}");
          if (data.success) {
            setUploadStatuses((s) => ({
              ...s,
              [index]: {
                uploading: false,
                uploaded: true,
                progress: 100,
                filename: data.filename,
              },
            }));
            resolve();
            return;
          }
          setUploadStatuses((s) => ({
            ...s,
            [index]: {
              uploading: false,
              error: data.message || "Upload failed",
              progress: s[index]?.progress ?? 0,
            },
          }));
        } else {
          setUploadStatuses((s) => ({
            ...s,
            [index]: {
              uploading: false,
              error: `Upload failed (${xhr.status})`,
              progress: s[index]?.progress ?? 0,
            },
          }));
        }
        resolve();
      };

      xhr.onerror = () => {
        setUploadStatuses((s) => ({
          ...s,
          [index]: {
            uploading: false,
            error: "Upload error",
            progress: s[index]?.progress ?? 0,
          },
        }));
        resolve();
      };

      xhr.send(form);
    });
  };

  const handleUploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // skip if already uploaded
      if (uploadStatuses[i] && uploadStatuses[i].uploaded) continue;
      // skip files over limit
      if (f.size > fileSizeLimit) {
        setUploadStatuses((s) => ({
          ...s,
          [i]: { uploading: false, error: "File too large" },
        }));
        continue;
      }
      // await each upload sequentially
      await uploadSingle(f, i);
    }
    fileInputRef.current.value = null; // reset file input after all uploads attempted
  };
  return (
    <div className="upload-container">
      <div className="heading">
        <p className="aitext">AI · POWERED SCENE RECOGNITION</p>
        <h1>Found a Scene? </h1>
        <h2>We'll <span className="clip">Find</span> the Movie.</h2>
        <p>Upload any movie clip and our AI identifies it instantly — title, cast, director, and more.</p>
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
          <p className="dragtxt">Drag & drop your clip here</p>
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
            value="Browse files"
          >
            Browse files
          </button>
          <p className="note">Supports all file types * Max 6MB per file</p>
        </div>
      </div>

      <div className="file-list">
        {files.length > 0 ? (
          <>
            <div className="file-items-container">
              {files.map((file, index) => {
                const isOverLimit = file.size > fileSizeLimit;
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                const status = uploadStatuses[index] || {};
                return (
                  <div
                    key={index}
                    className={`file-item ${isOverLimit ? "error" : ""}`}
                  >
                    <div className="file-item-icon">🎬</div>
                    <div className="file-item-details">
                      <span className="file-name" title={file.name}>
                        {file.name}
                      </span>
                      <span
                        className={`file-size ${isOverLimit ? "error" : ""}`}
                      >
                        {isOverLimit ? (
                          <>
                            <span className="error-badge">⚠️ Exceeds 5MB</span>
                            <span className="file-size-value">
                              {fileSize} MB
                            </span>
                          </>
                        ) : (
                          <span className="file-size-value">{fileSize} MB</span>
                        )}
                      </span>
                      <div className="upload-status">
                        {status.uploading && (
                          <span className="status uploading">Uploading…</span>
                        )}
                        {status.uploaded && (
                          <span className="status uploaded">Uploaded</span>
                        )}
                        {status.error && (
                          <span className="status error">{status.error}</span>
                        )}
                      </div>
                      {(status.uploading || status.uploaded || status.error) && (
                        <div
                          className={`progress-wrapper ${
                            status.uploaded
                              ? "success"
                              : status.error
                              ? "error"
                              : ""
                          }`}
                        >
                          {status.uploading ? (
                            <>
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
                            </>
                          ) : status.uploaded ? (
                            <div className="upload-result success">
                              <span className="result-icon">✔</span>
                              <span>Uploaded</span>
                            </div>
                          ) : (
                            <div className="upload-result error">
                              <span className="result-icon">✕</span>
                              <span>{status.error || "Upload failed"}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => handleRemoveFile(index)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="file-list-header">
              <h3>
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="uploadAllBtn"
                  onClick={handleUploadAll}
                >
                  Upload All
                </button>
                <span className="total-size">
                  {(
                    files.reduce((sum, file) => sum + file.size, 0) /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="no-files">No files selected</p>
        )}
      </div>
    </div>
  );
};
export default Upload;
