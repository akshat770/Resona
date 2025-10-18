import { useEffect, useState } from "react";
import api from "../api/axios";
import playbackService from "../services/playbackService";
import LikedSongsManager from "./LikedSongsManager";

export default function LikedSongsPopup({ isOpen, onClose, playerReady, isPremium, playlists = [] }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLikedSongs();
    }
  }, [isOpen]);

  const fetchLikedSongs = async () => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
      setLoading(true);
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

  const removeLikedSong = async (trackId) => {
    const token = localStorage.getItem("jwt");
    try {
      await api.delete("/spotify/liked-songs", {
        headers: { Authorization: `Bearer ${token}` },
        data: { trackIds: [trackId] }
      });
      setSongs(songs.filter(item => item.track.id !== trackId));
    } catch (err) {
      console.error("Error removing liked song:", err);
      alert("Failed to remove song");
    }
  };

  const playTrack = async (track) => {
    if (!track) return;
    setCurrentlyPlaying(track);
    await playbackService.playTrack(track.uri, track.preview_url);
  };

  const playAllLikedSongs = async () => {
    if (songs.length > 0) {
      await playTrack(songs[0].track);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="fixed inset-4 bg-gray-900 rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-green-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Liked Songs</h1>
              <p className="text-purple-200">
                {songs.length} songs • {isPremium ? 'Full playback' : '30-second previews'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-800 px-6 py-4 flex items-center gap-4 border-b border-gray-700">
          <button
            onClick={playAllLikedSongs}
            disabled={songs.length === 0}
            className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black rounded-full w-12 h-12 flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <button
            onClick={() => setShowManager(!showManager)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showManager ? 'Hide Manager' : 'Manage Songs'}
          </button>

          {/* Currently Playing Info */}
          {currentlyPlaying && (
            <div className="flex items-center gap-3 ml-4 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-sm">
                <p className="text-white font-medium">Now Playing</p>
                <p className="text-gray-400 truncate max-w-40">{currentlyPlaying.name}</p>
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
                ? (playerReady ? 'Premium Player Ready' : 'Connecting...')
                : 'Preview Mode'
              }
            </span>
          </div>
        </div>

        {/* Manager Section */}
        {showManager && (
          <div className="px-6 py-4 border-b border-gray-700">
            <LikedSongsManager
              songs={songs}
              setSongs={setSongs}
              onSongSelect={() => {}}
              playlists={playlists}
            />
          </div>
        )}

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading your liked songs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-600 text-white p-4 rounded-lg">
                {error}
              </div>
            </div>
          ) : songs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <p className="text-gray-400 text-lg">No liked songs found</p>
                <p className="text-gray-500 text-sm mt-2">Start liking songs to see them here</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-gray-400 text-sm font-medium border-b border-gray-800 mb-4">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-3">Album</div>
                <div className="col-span-2">Date Added</div>
                <div className="col-span-1">Duration</div>
              </div>

              {/* Songs */}
              <div className="space-y-1">
                {songs.map((item, index) => (
                  <div
                    key={item.track.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-800 rounded-lg group transition-colors cursor-pointer ${
                      currentlyPlaying?.id === item.track.id ? 'bg-gray-800 border-l-4 border-green-400' : ''
                    }`}
                    onClick={() => playTrack(item.track)}
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
                          <div className="hidden group-hover:block text-white hover:text-green-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLikedSong(item.track.id);
                        }}
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}
