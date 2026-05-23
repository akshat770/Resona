const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Spotify OAuth setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// UPDATED: Added missing scope for liked songs modification
router.get("/spotify", (req, res) => {
  const scopes = [
    "user-read-email",
    "user-read-private",
    "user-read-recently-played",   // FOR RECENT TRACKS
    "user-library-read",           // FOR LIKED SONGS
    "user-library-modify",         // ADDED: FOR ADDING/REMOVING LIKED SONGS
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming"
  ];
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, "state123");
  console.log("🎵 Redirecting to Spotify with scopes:", scopes.join(', '));
  res.redirect(authorizeURL);
});

// ✅ FIXED: Route name matches Spotify redirect URI
router.get("/spotify/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorization code");

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    spotifyApi.setAccessToken(accessToken);

    const me = await spotifyApi.getMe();

    // Issue JWT with all necessary data
    const token = jwt.sign(
      {
        id: me.body.id,
        email: me.body.email,
        displayName: me.body.display_name,
        accessToken,
        refreshToken,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const frontend = process.env.FRONTEND_URI || "https://resona-mauve.vercel.app";
    const url = new URL(`${frontend}/dashboard`);
    url.searchParams.set("token", token);
    
    console.log("🎯 Redirecting to:", url.toString());
    res.redirect(url.toString());
  } catch (err) {
    console.error("❌ Spotify authentication failed:", err);
    res.status(500).send("Spotify authentication failed");
  }
});

// Verify JWT
router.get("/verify", (req, res) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URI || "https://resona-mauve.vercel.app");

  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  if (!token) return res.status(401).json({ ok: false });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ ok: false });
  }
});

module.exports = router;
