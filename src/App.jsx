import React, { useEffect, useState } from "react";
import Upload from "./Upload";
import Header from "./Header";
import History from "./History";

function App() {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === "undefined") return "upload";
    return window.location.hash === "#history" ? "history" : "upload";
  });

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(window.location.hash === "#history" ? "history" : "upload");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleNavigate = (view) => {
    setActiveView(view);
    window.location.hash = view === "history" ? "#history" : "#home";
  };

  return (
    <>
      <Header activeView={activeView} onNavigate={handleNavigate} />
      {activeView === "history" ? <History /> : <Upload />}
    </>
  );
}

export default App;
