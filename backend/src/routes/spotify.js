const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const requireAuth = require("../middleware/auth");
const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Connect Spotify
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
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    req.user.spotifyAccessToken = data.body.access_token;
    req.user.spotifyRefreshToken = data.body.refresh_token;
    req.user.spotifyExpiresAt = Date.now() + data.body.expires_in * 1000;

    spotifyApi.setAccessToken(data.body.access_token);
    const profile = await spotifyApi.getMe();
    req.user.spotifyId = profile.body.id;
    await req.user.save();

    res.redirect(`${process.env.FRONTEND_URI || "https://resona-mauve.vercel.app"}/dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Spotify authentication failed" });
  }
});

// Helper: refresh token
async function refreshSpotifyToken(user) {
  if (!user.spotifyRefreshToken) return false;
  spotifyApi.setRefreshToken(user.spotifyRefreshToken);
  try {
    const data = await spotifyApi.refreshAccessToken();
    user.spotifyAccessToken = data.body.access_token;
    user.spotifyExpiresAt = Date.now() + data.body.expires_in * 1000;
    await user.save();
    spotifyApi.setAccessToken(user.spotifyAccessToken);
    return true;
  } catch {
    return false;
  }
}

// Playlists
router.get("/playlists", requireAuth, async (req, res) => {
  try {
    if (!req.user.spotifyAccessToken) return res.status(400).json({ error: "Spotify not connected" });

    if (req.user.spotifyExpiresAt && Date.now() > req.user.spotifyExpiresAt) {
      const refreshed = await refreshSpotifyToken(req.user);
      if (!refreshed) return res.status(401).json({ error: "Spotify token expired" });
    }

    spotifyApi.setAccessToken(req.user.spotifyAccessToken);
    const data = await spotifyApi.getUserPlaylists(req.user.spotifyId || undefined);
    res.json(data.body.items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// Liked songs
router.get("/liked", requireAuth, async (req, res) => {
  try {
    if (!req.user.spotifyAccessToken) return res.status(400).json({ error: "Spotify not connected" });

    if (req.user.spotifyExpiresAt && Date.now() > req.user.spotifyExpiresAt) {
      const refreshed = await refreshSpotifyToken(req.user);
      if (!refreshed) return res.status(401).json({ error: "Spotify token expired" });
    }

    spotifyApi.setAccessToken(req.user.spotifyAccessToken);
    const data = await spotifyApi.getMySavedTracks({ limit: 10 });
    res.json(data.body.items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch liked songs" });
  }
});

module.exports = router;
