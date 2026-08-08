import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Upload from "./Upload";
import Header from "./Header";
import History from "./History";
import "./App.css";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </>
  );
}

export default App;
