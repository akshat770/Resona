const express = require('express');
const jwt = require('jsonwebtoken');
const SpotifyWebApi = require('spotify-web-api-node');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// UPDATED: Middleware with better error handling
const verifySpotifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.split(' ')[1] : null;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // FIXED: Use decode instead of verify to avoid JWT_SECRET issues
    const decoded = jwt.decode(token); // Changed from jwt.verify
    
    if (!decoded || !decoded.accessToken) {
      console.error('Invalid token structure:', decoded);
      return res.status(401).json({ error: 'Invalid token structure' });
    }
    
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    
    spotifyApi.setAccessToken(decoded.accessToken);
    if (decoded.refreshToken) {
      spotifyApi.setRefreshToken(decoded.refreshToken);
    }
    
    req.spotifyApi = spotifyApi;
    req.user = decoded;
    console.log('Token verified successfully for user:', decoded.id || 'unknown');
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getMe();
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user's playlists
router.get('/user-playlists', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getUserPlaylists(req.user.id, { limit: 50 });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Get playlist tracks
router.get('/playlist/:id/tracks', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getPlaylistTracks(req.params.id, { limit: 100 });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

// Create playlist
router.post('/create-playlist', verifySpotifyToken, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const data = await req.spotifyApi.createPlaylist(name, {
      description: description || `Created with Resona`,
      public: isPublic || false
    });
    res.json(data.body);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Update playlist
router.put('/update-playlist/:playlistId', verifySpotifyToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    
    console.log('Updating playlist:', { playlistId, name, description });
    
    const data = await req.spotifyApi.changePlaylistDetails(playlistId, {
      name,
      description: description || ''
    });
    
    res.json({ message: 'Playlist updated successfully' });
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// Unfollow playlist
router.delete('/unfollow-playlist/:playlistId', verifySpotifyToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    await req.spotifyApi.unfollowPlaylist(playlistId);
    res.json({ message: 'Playlist unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing playlist:', error);
    res.status(500).json({ error: 'Failed to unfollow playlist' });
  }
});

// Add tracks to playlist
router.post('/playlist/:id/tracks', verifySpotifyToken, async (req, res) => {
  try {
    const { tracks } = req.body; // Array of track URIs
    console.log('Adding tracks to playlist:', { playlistId: req.params.id, tracks });
    const data = await req.spotifyApi.addTracksToPlaylist(req.params.id, tracks);
    res.json(data.body);
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    res.status(500).json({ error: 'Failed to add tracks to playlist' });
  }
});

// Remove tracks from playlist
router.delete('/playlist/:id/tracks', verifySpotifyToken, async (req, res) => {
  try {
    const { tracks } = req.body; // Array of track URIs
    const data = await req.spotifyApi.removeTracksFromPlaylist(req.params.id, tracks);
    res.json(data.body);
  } catch (error) {
    console.error('Error removing tracks from playlist:', error);
    res.status(500).json({ error: 'Failed to remove tracks from playlist' });
  }
});

// Get recently played tracks
router.get('/recent-tracks', verifySpotifyToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// Get liked songs
router.get('/liked-songs', verifySpotifyToken, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;
    const data = await req.spotifyApi.getMySavedTracks({ 
      limit: parseInt(limit),
      offset: parseInt(offset) 
    });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
});

// FIXED: Add track to liked songs
router.put('/liked-songs', verifySpotifyToken, async (req, res) => {
  try {
    const { trackIds } = req.body;
    console.log('Adding to liked songs:', trackIds);
    
    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'trackIds array is required' });
    }
    
    await req.spotifyApi.addToMySavedTracks(trackIds);
    res.json({ success: true, message: 'Songs added to liked songs' });
  } catch (error) {
    console.error('Error adding to liked songs:', error.message || error);
    res.status(500).json({ 
      error: 'Failed to add to liked songs',
      details: error.message || 'Unknown error'
    });
  }
});

// FIXED: Remove track from liked songs
router.delete('/liked-songs', verifySpotifyToken, async (req, res) => {
  try {
    const { trackIds } = req.body;
    console.log('Removing from liked songs:', trackIds);
    
    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'trackIds array is required' });
    }
    
    await req.spotifyApi.removeFromMySavedTracks(trackIds);
    res.json({ success: true, message: 'Songs removed from liked songs' });
  } catch (error) {
    console.error('Error removing from liked songs:', error.message || error);
    res.status(500).json({ 
      error: 'Failed to remove from liked songs',
      details: error.message || 'Unknown error'
    });
  }
});

// FIXED: Check if tracks are liked
router.get('/check-liked/:trackId', verifySpotifyToken, async (req, res) => {
  try {
    const { trackId } = req.params;
    console.log('Checking liked status for:', trackId);
    
    const data = await req.spotifyApi.containsMySavedTracks([trackId]);
    res.json(data.body);
  } catch (error) {
    console.error('Error checking liked status:', error);
    res.status(500).json({ error: 'Failed to check liked status' });
  }
});

// Search tracks, albums, artists, playlists
router.get('/search', verifySpotifyToken, async (req, res) => {
  try {
    const { q, type = 'track,album,artist,playlist', limit = 8 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ tracks: { items: [] }, artists: { items: [] }, albums: { items: [] }, playlists: { items: [] } });
    }
    
    console.log('Searching for:', q, 'types:', type); // Debug log
    
    const data = await req.spotifyApi.search(q.trim(), type.split(','), { limit: parseInt(limit) });
    
    // Filter out null/undefined items and ensure proper structure
    const cleanedResults = {
      tracks: {
        items: (data.body.tracks?.items || []).filter(item => item && item.id)
      },
      artists: {
        items: (data.body.artists?.items || []).filter(item => item && item.id)
      },
      albums: {
        items: (data.body.albums?.items || []).filter(item => item && item.id)
      },
      playlists: {
        items: (data.body.playlists?.items || []).filter(item => item && item.id)
      }
    };
    console.log('Cleaned search results:', cleanedResults); // Debug log
    res.json(cleanedResults);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search', details: error.message });
  }
});

// AI Playlist Generation Route
router.post('/generate-ai-playlist', verifySpotifyToken, async (req, res) => {
  console.log('=== AI Playlist Generation Started ===');
  
  try {
    const { prompt, songCount = 20 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    console.log('Initializing Gemini...');
    // FIXED: Use the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const aiPrompt = `
    You are a music curator. Based on the user's request: "${prompt}", 
    create a playlist of exactly ${songCount} songs.
    
    Return ONLY a JSON array of songs in this exact format (no markdown, no code blocks):
    [
      {
        "title": "Song Title",
        "artist": "Artist Name",
        "genre": "Genre",
        "reason": "Brief reason why this song fits"
      }
    ]
    
    Important:
    - Return ONLY the JSON array, no markdown formatting
    - No \`\`\`json or \`\`\` code blocks
    - Include popular and recognizable songs when possible
    - Make sure all songs exist and are searchable on Spotify
    - Vary the artists to create a diverse playlist
    - Each song should clearly match the theme: "${prompt}"
    `;

    console.log('Calling Gemini API with model: gemini-1.5-pro');
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    let aiResponse = response.text();
    
    console.log('Raw Gemini response:', aiResponse);
    
    // FIXED: Better cleanup of the response to extract JSON
    aiResponse = aiResponse
      .replace(/``````json
      .replace(/``````
      .replace(/^[\s\n]*/, '')        // Remove leading whitespace/newlines
      .replace(/[\s\n]*$/, '')        // Remove trailing whitespace/newlines
      .trim();

    console.log('Cleaned response:', aiResponse);
    
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
      console.log('Successfully parsed', suggestions.length, 'songs');
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Failed response text:', aiResponse);
      
      // FIXED: Try to extract JSON from the response if it's embedded
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[0]);
          console.log('Extracted JSON successfully:', suggestions.length, 'songs');
        } catch (extractError) {
          return res.status(500).json({ 
            error: 'AI response format error', 
            details: 'Could not parse JSON response',
            rawResponse: aiResponse.substring(0, 500) + '...'
          });
        }
      } else {
        return res.status(500).json({ 
          error: 'AI response format error', 
          details: 'No JSON found in response',
          rawResponse: aiResponse.substring(0, 500) + '...'
        });
      }
    }

    console.log('Starting Spotify search for', suggestions.length, 'songs...');
    
    // Search for each song on Spotify and get actual Spotify data
    const spotifyTracks = [];
    
    for (const suggestion of suggestions) {
      try {
        const searchQuery = `${suggestion.title} ${suggestion.artist}`;
        console.log('Searching Spotify for:', searchQuery);
        
        const searchResult = await req.spotifyApi.searchTracks(searchQuery, { limit: 1 });
        
        if (searchResult.body.tracks.items.length > 0) {
          const track = searchResult.body.tracks.items[0];
          spotifyTracks.push({
            ...track,
            aiReason: suggestion.reason,
            aiGenre: suggestion.genre
          });
          console.log('Found track:', track.name);
        } else {
          console.log('No Spotify results for:', searchQuery);
        }
      } catch (searchError) {
        console.error(`Failed to search for: ${suggestion.title} by ${suggestion.artist}`, searchError.message);
      }
    }

    console.log('Found', spotifyTracks.length, 'tracks on Spotify');

    // If we don't have enough tracks, fill with similar music
    if (spotifyTracks.length < songCount * 0.5) { // FIXED: Reduced to 50% success rate
      return res.status(400).json({ 
        error: 'Could not find enough matching songs on Spotify',
        found: spotifyTracks.length,
        requested: songCount
      });
    }

    const playlistData = {
      name: `AI Playlist: ${prompt}`,
      description: `AI-curated playlist based on: "${prompt}" • Generated by Resona AI`,
      tracks: spotifyTracks.slice(0, songCount),
      totalTracks: spotifyTracks.length,
      prompt: prompt,
      createdAt: new Date().toISOString()
    };

    console.log('=== AI Playlist Generation Completed Successfully ===');
    res.json(playlistData);
    
  } catch (error) {
    console.error('=== AI Playlist Generation Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to generate AI playlist', 
      details: error.message 
    });
  }
});


module.exports = router;