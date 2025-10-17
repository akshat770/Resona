import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import playbackService from "../services/playbackService";
import SpotifyPlayer from "../components/SpotifyPlayer";
import PreviewPlayer from "../components/PreviewPlayer";

export default function LikedSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        setLoading(true);
        
        // Set up access token for playback
        const payload = JSON.parse(atob(token.split('.')[1]));
        const spotifyAccessToken = payload.accessToken;
        setAccessToken(spotifyAccessToken);
        playbackService.setAccessToken(spotifyAccessToken);

        // Check user profile for Premium status
        const profileRes = await api.get("/spotify/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsPremium(profileRes.data.product === 'premium');

        // Fetch liked songs
        const response = await api.get("/spotify/liked-songs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSongs(response.data.items || []);
        
      } catch (err) {
        console.error("Error fetching liked songs:", err);
        setError("Failed to load liked songs");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, []);

  // UPDATED: Handle device activation properly
  const handlePlayerReady = (deviceId, isActivated) => {
    console.log('Player ready with device ID:', deviceId, 'activated:', isActivated);
    playbackService.setAccessToken(accessToken);
    playbackService.setDeviceId(deviceId);
    
    if (isActivated) {
      console.log('Device ready for playback');
      setPlayerReady(true);
      setIsPremium(true);
    } else {
      console.warn('Device activation failed');
      setPlayerReady(false);
    }
  };

  const removeLikedSong = async (trackId) => {
    const token = localStorage.getItem("jwt");
    try {
      await api.delete("/spotify/liked-songs", {
        headers: { Authorization: `Bearer ${token}` },
        data: { trackIds: [trackId] }
      });
      
      // Remove from local state
      setSongs(songs.filter(item => item.track.id !== trackId));
    } catch (err) {
      console.error("Error removing liked song:", err);
      alert("Failed to remove song");
    }
  };

  // UPDATED: Gate playback until device is ready
  const playTrack = async (track) => {
    if (!track) return;
    
    // For Premium users, wait until device is ready
    if (isPremium && !playerReady) {
      console.warn("Player not ready yet. Please wait a moment...");
      return;
    }
    
    console.log('Playing track from liked songs:', {
      name: track.name,
      uri: track.uri,
      preview_url: track.preview_url,
      isPremium
    });
    
    // Set currently playing immediately for UI feedback
    setCurrentlyPlaying(track);
    
    // Play the track
    await playbackService.playTrack(track.uri, track.preview_url);
  };

  const playAllLikedSongs = async () => {
    if (songs.length > 0) {
      // Play first song
      await playTrack(songs[0].track);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your liked songs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-600 to-gray-900 p-8">
        <div className="flex items-center gap-6">
          <div className="w-60 h-60 bg-gradient-to-br from-purple-600 to-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-200">Playlist</p>
            <h1 className="text-6xl font-bold mb-4">Liked Songs</h1>
            <p className="text-gray-300">{songs.length} songs</p>
            <p className="text-gray-400 text-sm mt-2">
              {isPremium ? 'Full playback available' : '30-second previews'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 py-6 flex items-center gap-6">
        <button
          onClick={playAllLikedSongs}
          disabled={songs.length === 0 || (isPremium && !playerReady)}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black rounded-full w-14 h-14 flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        
        <Link 
          to="/dashboard"
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Dashboard
        </Link>

        {/* Currently Playing Info */}
        {currentlyPlaying && (
          <div className="flex items-center gap-3 ml-4 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="text-sm">
              <p className="text-white font-medium">Now Playing</p>
              <p className="text-gray-400 truncate max-w-64">{currentlyPlaying.name}</p>
            </div>
          </div>
        )}

        {/* Player Status */}
        <div className="flex items-center gap-2 ml-auto">
          <div className={`w-2 h-2 rounded-full ${
            isPremium 
              ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
              : 'bg-blue-400'
          }`}></div>
          <span className="text-sm text-gray-400">
            {isPremium 
              ? (playerReady ? 'Premium Player Ready' : 'Activating Player...')
              : 'Preview Mode'
            }
          </span>
        </div>
      </div>

      {/* Songs List */}
      <div className="px-8 pb-24">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {songs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <p className="text-gray-400 text-lg">No liked songs found</p>
            <p className="text-gray-500 text-sm mt-2">Start liking songs to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-gray-400 text-sm font-medium border-b border-gray-800">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-3">Album</div>
              <div className="col-span-2">Date Added</div>
              <div className="col-span-1">Duration</div>
            </div>

            {/* Songs */}
            {songs.map((item, index) => (
              <div
                key={item.track.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-800 rounded-lg group transition-colors ${
                  currentlyPlaying?.id === item.track.id ? 'bg-gray-800 border-l-4 border-green-400' : ''
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {currentlyPlaying?.id === item.track.id ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-green-400 animate-pulse"></div>
                        <div className="w-0.5 h-2 bg-green-400 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-0.5 h-3 bg-green-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-400 group-hover:hidden text-sm">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => playTrack(item.track)}
                        disabled={isPremium && !playerReady}
                        className="hidden group-hover:block text-white hover:text-green-400 transition-colors disabled:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                <div className="col-span-5 flex items-center gap-3">
                  <img
                    src={item.track.album.images[0]?.url || "/placeholder.png"}
                    alt={item.track.name}
                    className="w-10 h-10 rounded"
                  />
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${
                      currentlyPlaying?.id === item.track.id ? 'text-green-400' : 'text-white'
                    }`}>
                      {item.track.name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {item.track.artists.map(a => a.name).join(", ")}
                    </p>
                  </div>
                  {!isPremium && item.track.preview_url && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      30s
                    </span>
                  )}
                  {!isPremium && !item.track.preview_url && (
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                      No Preview
                    </span>
                  )}
                </div>

                <div className="col-span-3 flex items-center">
                  <p className="text-gray-400 text-sm truncate">
                    {item.track.album.name}
                  </p>
                </div>

                <div className="col-span-2 flex items-center">
                  <p className="text-gray-400 text-sm">
                    {new Date(item.added_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="col-span-1 flex items-center justify-between">
                  <p className="text-gray-400 text-sm">
                    {Math.floor(item.track.duration_ms / 60000)}:
                    {Math.floor((item.track.duration_ms % 60000) / 1000)
                      .toString()
                      .padStart(2, '0')}
                  </p>
                  
                  <button
                    onClick={() => removeLikedSong(item.track.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1"
                    title="Remove from liked songs"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
