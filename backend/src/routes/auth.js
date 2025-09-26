const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Login route with ALL required scopes
router.get("/login", (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-recently-played',   // FOR RECENT TRACKS
    'user-library-read',           // FOR LIKED SONGS
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming'
  ];

  const state = 'some-state-of-my-choice';
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  
  console.log("🎵 Auth URL with scopes:", authorizeURL);
  res.redirect(authorizeURL);
});

// Callback route
router.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error("❌ Spotify auth error:", error);
    return res.redirect(`${process.env.FRONTEND_URI}/?error=${error}`);
  }

  try {
    // Exchange code for tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    console.log("✅ Tokens received successfully");

    // Set tokens for API calls
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // Get user profile
    const userProfile = await spotifyApi.getMe();
    const spotifyUser = userProfile.body;

    console.log("✅ User profile fetched:", spotifyUser.id);

    // Save/update user in database
    let user = await User.findOne({ spotifyId: spotifyUser.id });
    
    if (!user) {
      user = new User({
        spotifyId: spotifyUser.id,
        email: spotifyUser.email,
        displayName: spotifyUser.display_name,
        profileImage: spotifyUser.images?.[0]?.url || null,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpires: new Date(Date.now() + expires_in * 1000)
      });
      await user.save();
      console.log("✅ New user created");
    } else {
      // Update existing user's tokens
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpires = new Date(Date.now() + expires_in * 1000);
      await user.save();
      console.log("✅ Existing user updated");
    }

    // Create JWT with proper payload
    const jwtPayload = {
      id: user._id,
      spotifyId: spotifyUser.id,
      accessToken: access_token,
      refreshToken: refresh_token,
      email: spotifyUser.email,
      displayName: spotifyUser.display_name
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redirect with token
    const frontend = process.env.FRONTEND_URI;
    const redirectUrl = `${frontend}/dashboard?token=${token}`;
    
    console.log("🎯 Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Callback error:", error);
    res.redirect(`${process.env.FRONTEND_URI}/?error=auth_failed`);
  }
});

// Verify JWT token
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if token is expired
    if (user.tokenExpires && user.tokenExpires < new Date()) {
      console.log("🔄 Token expired, attempting refresh...");
      
      try {
        spotifyApi.setRefreshToken(user.refreshToken);
        const data = await spotifyApi.refreshAccessToken();
        
        // Update tokens
        user.accessToken = data.body.access_token;
        user.tokenExpires = new Date(Date.now() + data.body.expires_in * 1000);
        await user.save();
        
        console.log("✅ Token refreshed successfully");
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        return res.status(401).json({ error: 'Token refresh failed' });
      }
    }

    res.json({ 
      message: 'Token valid', 
      user: {
        id: user._id,
        spotifyId: user.spotifyId,
        email: user.email,
        displayName: user.displayName
      }
    });

  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
