import { useEffect, useState } from "react";
import api from "../api/axios";
import playbackService from "../services/playbackService";
import { useToast } from "../components/ToastProvider";

export default function PlaylistPopup({ isOpen, onClose, playlist, playerReady, isPremium, playlists = [], setPlaylists }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showManager, setShowManager] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && playlist) {
      fetchPlaylistTracks();
    }
  }, [isOpen, playlist]);

  const fetchPlaylistTracks = async () => {
    const token = localStorage.getItem("jwt");
    if (!token || !playlist) return;

    try {
      setLoading(true);
      const response = await api.get(`/spotify/playlist/${playlist.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTracks(response.data.items || []);
    } catch (err) {
      console.error("Error fetching playlist tracks:", err);
      setError("Failed to load playlist tracks");
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (track, trackIndex = null) => {
    if (!track) return;
    setCurrentlyPlaying(track);
    
    if (trackIndex !== null) {
      const trackUris = tracks.map(item => item.track.uri);
      await playbackService.playTrack(track.uri, track.preview_url, trackUris, trackIndex);
    } else {
      await playbackService.playTrack(track.uri, track.preview_url);
    }
  };

  const playPlaylist = async () => {
    if (tracks.length > 0) {
      const trackUris = tracks.map(item => item.track.uri);
      await playbackService.playTrack(tracks[0].track.uri, tracks[0].track.preview_url, trackUris, 0);
      setCurrentlyPlaying(tracks[0].track);
    }
  };

  const updatePlaylist = async () => {
    if (!editingPlaylist) return;
    
    setLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      await api.put(`/spotify/update-playlist/${playlist.id}`, {
        name: editingPlaylist.name,
        description: editingPlaylist.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (setPlaylists) {
        setPlaylists(prev => prev.map(p => 
          p.id === playlist.id ? { ...p, name: editingPlaylist.name, description: editingPlaylist.description } : p
        ));
      }
      
      setEditingPlaylist(null);
      showToast("Playlist updated successfully", "success");
    } catch (error) {
      console.error('Error updating playlist:', error);
      showToast("Failed to update playlist", "error");
    } finally {
      setLoading(false);
    }
  };

  const deletePlaylist = async () => {
    if (!confirm(`Are you sure you want to unfollow "${playlist.name}"?`)) return;

    setLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      await api.delete(`/spotify/unfollow-playlist/${playlist.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (setPlaylists) {
        setPlaylists(prev => prev.filter(p => p.id !== playlist.id));
      }
      
      showToast(`Unfollowed "${playlist.name}"`, "success");
      onClose();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast("Failed to unfollow playlist", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeTrackFromPlaylist = async (trackUri, trackName, trackIndex) => {
    const token = localStorage.getItem("jwt");
    try {
      await api.delete(`/spotify/playlist/${playlist.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { tracks: [{ uri: trackUri }] }
      });
      
      setTracks(tracks.filter((_, index) => index !== trackIndex));
      showToast(`Removed "${trackName}" from playlist`, "success");
    } catch (error) {
      console.error("Error removing track:", error);
      showToast("Failed to remove track", "error");
    }
  };

  if (!isOpen || !playlist) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* FIXED: Added bottom padding to avoid web player overlap */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pb-32">
        <div className="bg-gray-800 rounded-2xl w-full max-w-3xl h-[70vh] flex flex-col shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={playlist.images?.[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                {editingPlaylist ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editingPlaylist.name}
                      onChange={(e) => setEditingPlaylist({
                        ...editingPlaylist,
                        name: e.target.value
                      })}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-white text-lg font-bold placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white/50"
                      placeholder="Playlist name"
                    />
                    <input
                      type="text"
                      value={editingPlaylist.description || ''}
                      onChange={(e) => setEditingPlaylist({
                        ...editingPlaylist,
                        description: e.target.value
                      })}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-blue-200 text-sm placeholder-blue-200/60 focus:outline-none focus:ring-1 focus:ring-white/50"
                      placeholder="Description (optional)"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg font-bold text-white truncate">{playlist.name}</h1>
                    <p className="text-blue-200 text-sm">
                      {tracks.length} songs • {playlist.owner?.display_name || 'Unknown'}
                    </p>
                    {playlist.description && (
                      <p className="text-blue-100 text-xs mt-1 line-clamp-1">{playlist.description}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {editingPlaylist ? (
                <>
                  <button
                    onClick={updatePlaylist}
                    disabled={loading || !editingPlaylist.name.trim()}
                    className="text-green-400 hover:text-green-300 p-1 rounded-full hover:bg-white/10 disabled:opacity-50 transition-colors"
                    title="Save changes"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingPlaylist(null)}
                    className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-white/10 transition-colors"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </>
              ) : (
                showManager && (
                  <>
                    <button
                      onClick={() => setEditingPlaylist({
                        name: playlist.name,
                        description: playlist.description || ''
                      })}
                      className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Edit playlist"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                    <button
                      onClick={deletePlaylist}
                      className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Unfollow playlist"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </>
                )
              )}
              
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-gray-700 px-4 py-3 flex items-center justify-between border-b border-gray-600 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={playPlaylist}
                disabled={tracks.length === 0}
                className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>

              <button
                onClick={() => setShowManager(!showManager)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
              >
                {showManager ? 'Hide' : 'Manage'}
              </button>

              {currentlyPlaying && (
                <div className="hidden lg:flex items-center gap-2 ml-4 px-2 py-1 bg-gray-600 rounded-lg border border-gray-500">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-white font-medium text-xs">Playing</p>
                    <p className="text-gray-300 truncate max-w-32 text-xs">{currentlyPlaying.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isPremium 
                  ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
                  : 'bg-blue-400'
              }`}></div>
              <span className="text-xs text-gray-300 hidden sm:block">
                {isPremium 
                  ? (playerReady ? 'Ready' : 'Connecting...')
                  : 'Preview'
                }
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-300">Loading playlist...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-red-400 font-semibold">{error}</p>
                  <button onClick={fetchPlaylistTracks} className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            ) : tracks.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <h3 className="text-white text-lg font-bold mb-2">This playlist is empty</h3>
                  <p className="text-gray-400 mb-3">Add some tracks to get started</p>
                  <p className="text-gray-500 text-sm">Use the search or browse to find music</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="block lg:hidden p-4 space-y-2">
                  {tracks.map((item, index) => (
                    <div
                      key={`${item.track.id}-${index}`}
                      className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors cursor-pointer border border-gray-600 hover:border-gray-500"
                      onClick={() => playTrack(item.track, index)}
                    >
                      <img
                        src={item.track.album.images[0]?.url || "/placeholder.png"}
                        alt={item.track.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate text-sm ${
                          currentlyPlaying?.id === item.track.id ? 'text-green-400' : 'text-white'
                        }`}>
                          {item.track.name}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {item.track.artists.map(a => a.name).join(", ")}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {item.track.album.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-gray-400 text-xs">
                          {Math.floor(item.track.duration_ms / 60000)}:
                          {Math.floor((item.track.duration_ms % 60000) / 1000)
                            .toString()
                            .padStart(2, '0')}
                        </span>
                        {!isPremium && item.track.preview_url && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">30s</span>
                        )}
                        {!isPremium && !item.track.preview_url && (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">No Preview</span>
                        )}
                        {showManager && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTrackFromPlaylist(item.track.uri, item.track.name, index);
                            }}
                            className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-400/10 transition-colors"
                            title="Remove from playlist"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block p-4">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-gray-400 text-sm font-medium border-b border-gray-700 mb-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Title</div>
                    <div className="col-span-3">Album</div>
                    <div className="col-span-2">Duration</div>
                  </div>

                  <div className="space-y-1">
                    {tracks.map((item, index) => (
                      <div
                        key={`${item.track.id}-${index}`}
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

                        <div className="col-span-6 flex items-center gap-3">
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

                        <div className="col-span-2 flex items-center justify-between">
                          <p className="text-gray-400 text-sm">
                            {Math.floor(item.track.duration_ms / 60000)}:
                            {Math.floor((item.track.duration_ms % 60000) / 1000)
                              .toString()
                              .padStart(2, '0')}
                          </p>
                          
                          {showManager && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTrackFromPlaylist(item.track.uri, item.track.name, index);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1 rounded-full hover:bg-red-400/10"
                              title="Remove from playlist"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
