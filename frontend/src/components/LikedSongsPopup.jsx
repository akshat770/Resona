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

  const playTrack = async (track, trackIndex = null) => {
    if (!track) return;
    setCurrentlyPlaying(track);
    
    if (trackIndex !== null) {
      const trackUris = songs.map(item => item.track.uri);
      await playbackService.playTrack(track.uri, track.preview_url, trackUris, trackIndex);
    } else {
      await playbackService.playTrack(track.uri, track.preview_url);
    }
  };

  const playAllLikedSongs = async () => {
    if (songs.length > 0) {
      const trackUris = songs.map(item => item.track.uri);
      await playbackService.playTrack(songs[0].track.uri, songs[0].track.preview_url, trackUris, 0);
      setCurrentlyPlaying(songs[0].track);
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
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-3 pb-32">
        <div className="bg-gray-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-green-600 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Liked Songs</h1>
                <p className="text-purple-200 text-sm">
                  {songs.length} songs • {isPremium ? 'Full playback' : '30s previews'}
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
          <div className="bg-gray-700 px-4 py-3 flex items-center justify-between border-b border-gray-600 flex-shrink-0">
            <div className="flex items-center gap-3">
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
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                {showManager ? 'Hide Manager' : 'Manage Songs'}
              </button>

              {/* Currently Playing Info */}
              {currentlyPlaying && (
                <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-2 bg-gray-600 rounded-xl border border-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-white font-medium text-xs">Now Playing</p>
                    <p className="text-gray-300 truncate max-w-40 text-xs">{currentlyPlaying.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Player Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isPremium 
                  ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
                  : 'bg-blue-400'
              }`}></div>
              <span className="text-xs text-gray-300 hidden sm:block">
                {isPremium 
                  ? (playerReady ? 'Premium Ready' : 'Connecting...')
                  : 'Preview Mode'
                }
              </span>
            </div>
          </div>

          {/* Manager Section */}
          {showManager && (
            <div className="px-4 py-3 border-b border-gray-600 flex-shrink-0 bg-gray-750">
              <LikedSongsManager
                songs={songs}
                setSongs={setSongs}
                onSongSelect={() => {}}
                playlists={playlists}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-300 text-lg">Loading your liked songs...</p>
                  <p className="text-gray-400 text-sm mt-1">Fetching your music collection</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-red-400 text-lg font-semibold">{error}</p>
                  <button onClick={fetchLikedSongs} className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            ) : songs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-500 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <h3 className="text-white text-2xl font-bold mb-2">No liked songs yet</h3>
                  <p className="text-gray-400 text-lg mb-4">Start liking songs to build your collection</p>
                  <p className="text-gray-500 text-sm">Use the heart button on any song to add it here</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block lg:hidden overflow-y-auto h-full">
                  <div className="p-4 space-y-2">
                    {songs.map((item, index) => (
                      <div
                        key={item.track.id}
                        className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors cursor-pointer border border-gray-600 hover:border-gray-500"
                        onClick={() => playTrack(item.track, index)}
                      >
                        <img
                          src={item.track.album.images[0]?.url || "/placeholder.png"}
                          alt={item.track.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            currentlyPlaying?.id === item.track.id ? 'text-green-400' : 'text-white'
                          }`}>{item.track.name}</p>
                          <p className="text-gray-400 text-sm truncate">
                            {item.track.artists.map(a => a.name).join(", ")}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(item.added_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isPremium && item.track.preview_url && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">30s</span>
                          )}
                          {!isPremium && !item.track.preview_url && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">No Preview</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLikedSong(item.track.id);
                            }}
                            className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block overflow-y-auto h-full">
                  <div className="p-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-gray-400 text-sm font-medium border-b border-gray-700 mb-2">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Title</div>
                      <div className="col-span-3">Album</div>
                      <div className="col-span-2">Date Added</div>
                      <div className="col-span-1">Duration</div>
                    </div>

                    {/* Songs List */}
                    <div className="space-y-1">
                      {songs.map((item, index) => (
                        <div
                          key={item.track.id}
                          className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-700 rounded-xl group transition-colors cursor-pointer border border-transparent hover:border-gray-600 ${
                            currentlyPlaying?.id === item.track.id ? 'bg-gray-700 border-green-400' : ''
                          }`}
                          onClick={() => playTrack(item.track, index)}
                        >
                          <div className="col-span-1 flex items-center">
                            {currentlyPlaying?.id === item.track.id ? (
                              <div className="w-5 h-5 flex items-center justify-center">
                                <div className="flex gap-0.5">
                                  <div className="w-0.5 h-4 bg-green-400 animate-pulse"></div>
                                  <div className="w-0.5 h-3 bg-green-400 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-0.5 h-3.5 bg-green-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="text-gray-400 group-hover:hidden text-sm">
                                  {index + 1}
                                </span>
                                <div className="hidden group-hover:block text-white hover:text-green-400 transition-colors">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold truncate ${
                                currentlyPlaying?.id === item.track.id ? 'text-green-400' : 'text-white'
                              }`}>
                                {item.track.name}
                              </p>
                              <p className="text-sm text-gray-400 truncate">
                                {item.track.artists.map(a => a.name).join(", ")}
                              </p>
                            </div>
                            {!isPremium && item.track.preview_url && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full flex-shrink-0">
                                30s
                              </span>
                            )}
                            {!isPremium && !item.track.preview_url && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full flex-shrink-0">
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
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1 rounded-full hover:bg-red-400/10"
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
