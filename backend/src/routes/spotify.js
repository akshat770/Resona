const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

async function verifyJWT(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1] || req.query.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id);
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Spotify login
router.get("/login", verifyJWT, (req, res) => {
  const scopes = [
    "user-read-email",
    "user-library-read",
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public",
  ];
  const url = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(url);
});

// Spotify callback
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const user = await User.findById(req.query.userId);
    user.spotifyAccessToken = data.body.access_token;
    user.spotifyRefreshToken = data.body.refresh_token;
    await user.save();
    const frontend = process.env.FRONTEND_URI || "http://localhost:5173";
    res.redirect(`${frontend}/dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Spotify auth failed" });
  }
});

// Get playlists
router.get("/playlists", verifyJWT, async (req, res) => {
  if (!req.user.spotifyAccessToken) return res.status(400).json({ error: "Connect Spotify first" });
  spotifyApi.setAccessToken(req.user.spotifyAccessToken);
  try {
    const data = await spotifyApi.getUserPlaylists(req.user.spotifyId || undefined);
    res.json(data.body.items);
  } catch {
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// Get liked songs
router.get("/liked", verifyJWT, async (req, res) => {
  if (!req.user.spotifyAccessToken) return res.status(400).json({ error: "Connect Spotify first" });
  spotifyApi.setAccessToken(req.user.spotifyAccessToken);
  try {
    const data = await spotifyApi.getMySavedTracks({ limit: 10 });
    res.json(data.body.items);
  } catch {
    res.status(500).json({ error: "Failed to fetch liked songs" });
  }
});

module.exports = router;
