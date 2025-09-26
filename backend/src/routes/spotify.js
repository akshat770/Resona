const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

router.get('/spotify', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state123');
  res.redirect(authorizeURL);
});

router.get('/spotify/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);

    // send JWT or redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${data.body['access_token']}`);
  } catch (err) {
    console.error('Spotify callback error:', err.body || err.message);
    res.status(403).json({ error: err.body || err.message });
  }
});

module.exports = router;
