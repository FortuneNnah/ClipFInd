import React, { useEffect, useState } from "react";
import "./App.css";

const HISTORY_KEY = "clipfind-upload-history";

const History = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Unable to load history:", error);
      setItems([]);
    }
  }, []);

  const handleDelete = (id) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextItems));
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <p className="aitext">UPLOAD HISTORY</p>
        <h1>Your uploaded clips</h1>
        <p>Review your uploads by name, date, and time, and remove anything you no longer need.</p>
      </div>

      {items.length === 0 ? (
        <div className="history-empty">
          <h2>No uploads yet</h2>
          <p>Upload a clip to start building your history.</p>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => {
            const uploadedAt = item.uploadedAt ? new Date(item.uploadedAt) : null;
            const dateLabel = uploadedAt ? uploadedAt.toLocaleDateString() : "Date unavailable";
            const timeLabel = uploadedAt ? uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time unavailable";

            return (
              <article className="history-card" key={item.id}>
                <div className="history-card-details">
                  <div className="history-card-main">
                    <div>
                      <h3>{item.title || item.originalname || item.filename}</h3>
                      <p className="history-file-name">{item.originalname || item.filename}</p>
                    </div>
                    <button
                      type="button"
                      className="history-delete-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="history-meta-row">
                    <span>{dateLabel}</span>
                    <span>{timeLabel}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
