import React, { useEffect, useState } from "react";
import "./App.css";

const HISTORY_KEY = "clipfind-upload-history";

const History = () => {
  const [items, setItems] = useState([]);

  return (
    <div className="history-page">
      <div className="history-header">
        <p className="aitext">UPLOAD HISTORY</p>
        <h1>Your recent clips</h1>
        <p>Review the clips you’ve uploaded and revisit their saved details.</p>
      </div>

      {items.length === 0 ? (
        <div className="history-empty">
          <p>No uploads yet.</p>
          <span>Start by uploading a clip and it will appear here.</span>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-card-preview">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.originalname || item.filename} />
                ) : (
                  <div className="history-card-placeholder">🎬</div>
                )}
              </div>
              <div className="history-card-details">
                <div className="history-card-topline">
                  <h3>{item.originalname || item.filename}</h3>
                  <span className="history-badge">Saved</span>
                </div>
                <p className="history-meta">
                  {new Date(item.uploadedAt).toLocaleString()} • {(item.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="history-filename">{item.filename}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
