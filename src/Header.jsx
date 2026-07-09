import React from "react";
import "./App.css";

const Header = ({ activeView, onNavigate }) => {
  return (
    <div className="header-container">
      <div className="logo">
        <h1>
          <span className="clip">Clip</span>
          <span className="find">Find</span>
        </h1>
      </div>
      <div className="navlinks">
        <button
          type="button"
          className={`nav-link ${activeView === "upload" ? "active" : ""}`}
          onClick={() => onNavigate("upload")}
        >
          Upload clip
        </button>
        <button
          type="button"
          className={`nav-link ${activeView === "history" ? "active" : ""}`}
          onClick={() => onNavigate("history")}
        >
          History
        </button>
      </div>
    </div>
  );
};

export default Header;