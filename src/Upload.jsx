import React, { useRef, useState } from "react";
import "./App.css";

const Upload = () => {

    const fileInputRef = useRef(null);

    const [files, setFiles] = useState([]);

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
    }

    const handleRemoveFile = (indexToRemove) => {
        setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    };
    const fileSizeLimit = 5 * 1024 *1024;
  return (
    <div className="container">
      <div className="heading">
        <h1>Upload Files</h1>
        <p>Upload your clips of movies here</p>
      </div>
      <div className="upload-area" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="upload-area-inner">
          <div className="drag-icon" aria-hidden="true">⬇</div>
          <p className="dragtxt">Drag & Drop Files</p>
          <p className="Or">or</p>
          <input type="file" accept="video/*" ref={fileInputRef} id="fileInput" multiple onChange={handleInputChange} />
          <button onClick={handleclick} type="button" className="uploadBtn" id="uploadBtn" value="Browse files">Browse files</button>
          <p className="note">Supports all file types * Max 5MB per file</p>
        </div>
      </div>

      <div className="file-list">
        {files.length > 0 ? (
          <>
            <div className="file-list-header">
              <h3>{files.length} file{files.length !== 1 ? 's' : ''} selected</h3>
              <span className="total-size">
                {(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="file-items-container">
              {files.map((file, index) => {
                const isOverLimit = file.size > fileSizeLimit;
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                return (
                  <div key={index} className={`file-item ${isOverLimit ? 'error' : ''}`}>
                    <div className="file-item-icon">
                      🎬
                    </div>
                    <div className="file-item-details">
                      <span className="file-name" title={file.name}>{file.name}</span>
                      <span className={`file-size ${isOverLimit ? 'error' : ''}`}>
                        {isOverLimit ? (
                          <>
                            <span className="error-badge">⚠️ Exceeds 5MB</span>
                            <span className="file-size-value">{fileSize} MB</span>
                          </>
                        ) : (
                          <span className="file-size-value">{fileSize} MB</span>
                        )}
                      </span>
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
          </>
        ) : (
          <p className="no-files">No files selected</p>
        )}
      </div>
    </div>
  );
};
export default Upload;
