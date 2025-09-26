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
    
    console.log("TokenHandler - Current URL:", window.location.href);
    console.log("TokenHandler - Token found:", !!token);
    
    if (token) {
      localStorage.setItem('jwt', token);
      console.log("TokenHandler - Token stored, current localStorage:", localStorage.getItem('jwt'));
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force a small delay to ensure ProtectedRoute re-runs
      setTimeout(() => {
        console.log("TokenHandler - After cleanup, localStorage:", localStorage.getItem('jwt'));
      }, 100);
    }
  }, []);

  return children;
}

export default function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <TokenHandler>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
          </Routes>
        </TokenHandler>
      </BrowserRouter>
    </PlayerProvider>
  );
}
