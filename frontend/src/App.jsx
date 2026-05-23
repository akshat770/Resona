import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { PlayerProvider } from "./context/PlayerContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SpotifyPlayer from "./components/SpotifyPlayer";
import PreviewPlayer from "./components/PreviewPlayer";
import playbackService from "./services/playbackService";
import ToastProvider from "./components/ToastProvider";

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handlePlayerReady = (deviceId) => {
    console.log('Global player ready with device ID:', deviceId);
    playbackService.setDeviceId(deviceId);
    setPlayerReady(true);
    setIsPremium(true);
  };

  return (
    <ToastProvider>
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
          </Routes>

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
    </ToastProvider>
  );
}
