const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require('jsonwebtoken'); // Make sure you have this

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// ADDED: Helper function to extract access token from JWT
function getSpotifyTokenFromJWT(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('No authorization header');
    
    const jwtToken = authHeader.replace('Bearer ', '');
    const decoded = jwt.decode(jwtToken); // Decode without verification for now
    
    return decoded.accessToken; // This should match how you store it in JWT
  } catch (error) {
    console.error('Error extracting token from JWT:', error);
    return null;
  }
}

router.get('/spotify', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-modify-public', 'playlist-modify-private', 'user-library-modify', 'user-library-read'];
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

// FIXED: Remove liked songs
router.delete('/spotify/liked-songs', async (req, res) => {
  try {
    const { trackIds } = req.body;
    const accessToken = getSpotifyTokenFromJWT(req);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }
    
    console.log('Removing liked songs:', trackIds);
    
    const response = await fetch('https://api.spotify.com/v1/me/tracks', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: trackIds })
    });

    if (response.ok) {
      res.status(200).json({ message: 'Songs removed successfully' });
    } else {
      const error = await response.json();
      console.error('Spotify API error:', error);
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error removing liked songs:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// FIXED: Create playlist
router.post('/spotify/create-playlist', async (req, res) => {
  try {
    const { name, description, public: isPublic } = req.body;
    const accessToken = getSpotifyTokenFromJWT(req);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }
    
    console.log('Creating playlist:', { name, description });
    
    // Get user profile first
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!profileResponse.ok) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    
    const profile = await profileResponse.json();
    
    const response = await fetch(`https://api.spotify.com/v1/users/${profile.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: description || '',
        public: isPublic || false
      })
    });

    if (response.ok) {
      const playlist = await response.json();
      res.status(200).json(playlist);
    } else {
      const error = await response.json();
      console.error('Spotify API error:', error);
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// FIXED: Update playlist
router.put('/spotify/update-playlist/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const accessToken = getSpotifyTokenFromJWT(req);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }
    
    console.log('Updating playlist:', { playlistId, name, description });
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: description || ''
      })
    });

    console.log('Spotify API response status:', response.status);

    if (response.ok || response.status === 200) {
      res.status(200).json({ message: 'Playlist updated successfully' });
    } else {
      const error = await response.json();
      console.error('Spotify API error:', error);
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// FIXED: Unfollow playlist
router.delete('/spotify/unfollow-playlist/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const accessToken = getSpotifyTokenFromJWT(req);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok || response.status === 200) {
      res.status(200).json({ message: 'Playlist unfollowed successfully' });
    } else {
      const error = await response.json();
      console.error('Spotify API error:', error);
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error unfollowing playlist:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
