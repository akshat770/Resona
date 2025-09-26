const express = require('express');
const jwt = require('jsonwebtoken');
const SpotifyWebApi = require('spotify-web-api-node');
const router = express.Router();

// Middleware to verify JWT and extract Spotify tokens
const verifySpotifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.split(' ')[1] : null;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create Spotify API instance with user's tokens
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    
    spotifyApi.setAccessToken(decoded.accessToken);
    if (decoded.refreshToken) {
      spotifyApi.setRefreshToken(decoded.refreshToken);
    }
    
    req.spotifyApi = spotifyApi;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getMe();
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user's playlists
router.get('/user-playlists', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getUserPlaylists(req.user.id, { limit: 20 });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Get recently played tracks
router.get('/recent-tracks', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getMyRecentlyPlayedTracks({ limit: 20 });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// Get liked songs
router.get('/liked-songs', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getMySavedTracks({ limit: 50 });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
});

module.exports = router;
