const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
};

function createSpotifyApi() {
  return new SpotifyWebApi(spotifyConfig);
}

// Start Spotify auth for the logged-in user.
// Expects Authorization: Bearer <jwt>
router.get("/login", requireAuth, (req, res) => {
  const spotifyApi = createSpotifyApi();
  const scopes = [
    "user-read-email",
    "user-library-read",
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public"
  ];

  // Use the JWT itself as state so callback can identify the user without sessions.
  const token = req.headers["authorization"].split(" ")[1];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, token, true);
  res.redirect(authorizeURL);
});

// Spotify callback: spotify returns code & state (our JWT)
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!state) return res.status(400).send("Missing state");

  // verify state (JWT) to get user id
  let decoded;
  try {
    decoded = jwt.verify(state, process.env.JWT_SECRET);
  } catch (e) {
    console.error("Invalid state token:", e);
    return res.status(400).send("Invalid state");
  }

  const userId = decoded.id;
  const spotifyApi = createSpotifyApi();

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    // tokens
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    const expiresIn = data.body.expires_in; // seconds

    // set tokens and fetch user's spotify id
    spotifyApi.setAccessToken(accessToken);
    const me = await spotifyApi.getMe();

    // persist to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    user.spotifyAccessToken = accessToken;
    user.spotifyRefreshToken = refreshToken;
    user.spotifyExpiresAt = Date.now() + (expiresIn * 1000);
    user.spotifyId = me.body.id;
    await user.save();

    // Redirect to frontend dashboard (you may want to include a success flag)
    const FRONTEND = process.env.FRONTEND_URI || "http://localhost:5173";
    return res.redirect(`${FRONTEND}/dashboard`);
  } catch (err) {
    console.error("Spotify callback error:", err);
    return res.status(500).send("Spotify auth failed");
  }
});

// Helper to ensure we set a valid access token from DB and refresh if expired.
async function ensureSpotifyApiForUser(user) {
  const spotifyApi = createSpotifyApi();

  // if no access token saved
  if (!user.spotifyAccessToken) throw new Error("No spotify token");

  // refresh if expired (simple strategy)
  if (user.spotifyExpiresAt && Date.now() > user.spotifyExpiresAt - 60*1000) {
    // refresh
    spotifyApi.setRefreshToken(user.spotifyRefreshToken);
    const refreshed = await spotifyApi.refreshAccessToken();
    user.spotifyAccessToken = refreshed.body.access_token;
    user.spotifyExpiresAt = Date.now() + (refreshed.body.expires_in * 1000);
    await user.save();
  }

  spotifyApi.setAccessToken(user.spotifyAccessToken);
  return spotifyApi;
}

// Get liked songs (requires Authorization header token)
router.get("/liked", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const spotifyApi = await ensureSpotifyApiForUser(user);
    const data = await spotifyApi.getMySavedTracks({ limit: 20 });
    return res.json(data.body.items);
  } catch (err) {
    console.error("Failed to fetch liked songs:", err);
    return res.status(500).json({ error: "Failed to fetch liked songs" });
  }
});

// Get playlists
router.get("/playlists", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const spotifyApi = await ensureSpotifyApiForUser(user);
    const data = await spotifyApi.getUserPlaylists(user.spotifyId || user.id, { limit: 50 });
    return res.json(data.body.items);
  } catch (err) {
    console.error("Failed to fetch playlists:", err);
    return res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

module.exports = router;
