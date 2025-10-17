const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

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

// Remove liked songs
router.delete('/spotify/liked-songs', async (req, res) => {
  try {
    const { trackIds } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
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
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error removing liked songs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create playlist
router.post('/spotify/create-playlist', async (req, res) => {
  try {
    const { name, description, public: isPublic } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Get user profile first to get user ID
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
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
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update playlist
router.put('/spotify/update-playlist/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
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

    if (response.ok) {
      res.status(200).json({ message: 'Playlist updated successfully' });
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow/Delete playlist
router.delete('/spotify/unfollow-playlist/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
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
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error unfollowing playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get playlist tracks
router.get('/spotify/playlist/:playlistId/tracks', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const tracks = await response.json();
      res.status(200).json(tracks);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add tracks to playlist
router.post('/spotify/playlist/:playlistId/tracks', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { uris } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris })
    });

    if (response.ok) {
      const result = await response.json();
      res.status(200).json(result);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove tracks from playlist
router.delete('/spotify/playlist/:playlistId/tracks', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { tracks } = req.body; // Array of { uri: "spotify:track:id" }
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tracks })
    });

    if (response.ok) {
      const result = await response.json();
      res.status(200).json(result);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (error) {
    console.error('Error removing tracks from playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
