const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Spotify login
router.get("/login", requireAuth, (req, res) => {
  const scopes = [
    "user-read-email",
    "user-library-read",
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public",
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Spotify callback
router.get("/callback", requireAuth, async (req, res) => {
  const { code } = req.query;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);

    req.user.spotifyAccessToken = data.body.access_token;
    req.user.spotifyRefreshToken = data.body.refresh_token;
    await req.user.save();

    res.redirect("http://localhost:5173/dashboard");
  } catch (err) {
    res.status(500).json({ error: "Spotify auth failed" });
  }
});

// Get liked songs
router.get("/liked", requireAuth, async (req, res) => {
  spotifyApi.setAccessToken(req.user.spotifyAccessToken);

  try {
    const data = await spotifyApi.getMySavedTracks({ limit: 10 });
    res.json(data.body.items);
  } catch {
    res.status(500).json({ error: "Failed to fetch liked songs" });
  }
});

// Get playlists
router.get("/playlists", requireAuth, async (req, res) => {
  spotifyApi.setAccessToken(req.user.spotifyAccessToken);

  try {
    const data = await spotifyApi.getUserPlaylists(req.user.spotifyId);
    res.json(data.body.items);
  } catch {
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

module.exports = router;
