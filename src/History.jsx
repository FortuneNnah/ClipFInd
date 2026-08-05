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
            const details = item.uploadedAt ? new Date(item.uploadedAt) : null;
            const yearofrelease = item.year || item.release_date ? (item.year || item.release_date).split("-")[0] : "Year unavailable";
            const director = item.director || "Director unavailable";
            const genre = Array.isArray(item.genre) ? item.genre.join(', ') : item.genre || "Genre unavailable";
            const type = item.type || "Type unavailable";

            return (
              <article className="history-card" key={item.id}>
                {item.poster || item.poster_path ? (
                  <div className="history-card-thumb">
                    <img
                      src={item.poster || item.poster_path}
                      alt={item.title ? `${item.title} poster` : "Movie poster"}
                    />
                  </div>
                ) : (
                  <div className="history-card-thumb history-card-thumb-fallback" />
                )}
                <div className="history-card-body">
                  <div className="history-card-main">
                    <div className="history-card-title-group">
                      <h3>{item.title || item.originalname || item.filename}</h3>
                    </div>
                    <button
                      type="button"
                      className="history-delete-button"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete ${item.title || item.originalname || item.filename}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="history-meta-row">
                    <span className="history-meta-pill"><strong>Year:</strong> {yearofrelease}</span>
                    <span className="history-meta-pill"><strong>Director:</strong> {director}</span>
                    <span className="history-meta-pill"><strong>Type:</strong> {type}</span>
                    <span className="history-meta-pill"><strong>Genre:</strong> {genre}</span>
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
