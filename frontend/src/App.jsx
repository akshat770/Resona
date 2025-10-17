import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LikedSongs from "./pages/LikedSongs";
import { PlayerProvider } from "./context/PlayerContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SpotifyPlayer from "./components/SpotifyPlayer";
import PreviewPlayer from "./components/PreviewPlayer";
import playbackService from "./services/playbackService";

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const spotifyAccessToken = payload.accessToken;
        setAccessToken(spotifyAccessToken);
        setIsAuthenticated(true);
        playbackService.setAccessToken(spotifyAccessToken);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem("jwt");
      }
    }
  }, []);

  // Handle player ready - single instance for entire app
  const handlePlayerReady = (deviceId) => {
    console.log('Global player ready with device ID:', deviceId);
    playbackService.setDeviceId(deviceId);
    setPlayerReady(true);
    setIsPremium(true); // If web player works, user has Premium
  };

  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard 
                  playerReady={playerReady}
                  isPremium={isPremium}
                  setAccessToken={setAccessToken}
                  setIsPremium={setIsPremium}
                  setIsAuthenticated={setIsAuthenticated}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/liked" 
            element={
              <ProtectedRoute>
                <LikedSongs 
                  playerReady={playerReady}
                  isPremium={isPremium}
                />
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* Single Shared Player for Entire App */}
        {accessToken && isAuthenticated && (
          isPremium ? (
            <SpotifyPlayer
              accessToken={accessToken}
              onPlayerReady={handlePlayerReady}
            />
          ) : (
            <PreviewPlayer />
          )
        )}
      </BrowserRouter>
    </PlayerProvider>
  );
}
