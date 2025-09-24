const router = require('express').Router();
const auth = require('../middlewares/auth.js');
const User = require('../models/User.js');
const axios = require('axios');

// Get current Spotify profile
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.spotifyAccessToken) return res.status(400).json({ message: 'Connect Spotify first' });

  const r = await axios.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${user.spotifyAccessToken}` }
  });
  res.json(r.data);
});

// Get user playlists
router.get('/playlists', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const r = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${user.spotifyAccessToken}` }
  });
  res.json(r.data);
});

// Get liked songs
router.get('/liked', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const r = await axios.get('https://api.spotify.com/v1/me/tracks', {
    headers: { Authorization: `Bearer ${user.spotifyAccessToken}` }
  });
  res.json(r.data);
});

// Start playback on Web Playback SDK device
router.put('/player/play', auth, async (req, res) => {
  const { device_id, uris } = req.body;
  const user = await User.findById(req.user.id);
  await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, { uris }, {
    headers: { Authorization: `Bearer ${user.spotifyAccessToken}` }
  });
  res.sendStatus(204);
});

module.exports = router;
