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
        
        // Check if token is still valid and get user premium status
        checkUserPremiumStatus(token);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem("jwt");
      }
    }
  }, []);

  const checkUserPremiumStatus = async (token) => {
    try {
      const response = await fetch('/api/spotify/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setIsPremium(userData.product === 'premium');
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      // Default to free user if check fails
      setIsPremium(false);
    }
  };

  // Handle player ready - single instance for entire app
  const handlePlayerReady = (deviceId, isActivated) => {
    console.log('Global player ready:', { deviceId, isActivated });
    playbackService.setAccessToken(accessToken);
    playbackService.setDeviceId(deviceId);
    
    if (isActivated) {
      setPlayerReady(true);
      setIsPremium(true); // If web player works, user has Premium
    } else {
      console.warn('Device activation failed');
      setPlayerReady(false);
    }
  };

  // Handle authentication state changes
  const handleAuthChange = (token, premium = false) => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const spotifyAccessToken = payload.accessToken;
        
        setAccessToken(spotifyAccessToken);
        setIsAuthenticated(true);
        setIsPremium(premium);
        playbackService.setAccessToken(spotifyAccessToken);
      } catch (error) {
        console.error('Invalid token:', error);
        handleLogout();
      }
    } else {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setAccessToken(null);
    setIsAuthenticated(false);
    setIsPremium(false);
    setPlayerReady(false);
    localStorage.removeItem("jwt");
    
    // Clean up playback service
    playbackService.setAccessToken(null);
    playbackService.setDeviceId(null);
  };

  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login onAuthChange={handleAuthChange} />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard 
                  playerReady={playerReady}
                  isPremium={isPremium}
                  onAuthChange={handleAuthChange}
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
                  onAuthChange={handleAuthChange}
                />
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* SINGLE PLAYER INSTANCE FOR ENTIRE APP */}
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
