import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LikedSongs from "./pages/LikedSongs";
import { PlayerProvider } from "./context/PlayerContext";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </PlayerProvider>
  );
}


