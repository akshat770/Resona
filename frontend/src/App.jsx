import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LikedSongs from "./pages/LikedSongs";
import { PlayerProvider } from "./context/PlayerContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Create TokenHandler component:
function TokenHandler({ children }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('jwt', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return children;
}

export default function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={
            <TokenHandler>
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </TokenHandler>
          } />
          <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </PlayerProvider>
  );
}
