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

  // ADDED: Update playlist function
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

      // Update playlists list
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

  // ADDED: Delete playlist function
  const deletePlaylist = async () => {
    if (!confirm(`Are you sure you want to unfollow "${playlist.name}"?`)) return;

    setLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      await api.delete(`/spotify/unfollow-playlist/${playlist.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update playlists list
      if (setPlaylists) {
        setPlaylists(prev => prev.filter(p => p.id !== playlist.id));
      }
      
      showToast(`Unfollowed "${playlist.name}"`, "success");
      onClose(); // Close popup after deletion
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast("Failed to unfollow playlist", "error");
    } finally {
      setLoading(false);
    }
  };

  // ADDED: Remove track from playlist
  const removeTrackFromPlaylist = async (trackUri, trackName, trackIndex) => {
    const token = localStorage.getItem("jwt");
    try {
      await api.delete(`/spotify/playlist/${playlist.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { tracks: [{ uri: trackUri }] }
      });
      
      // Update local tracks state
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* FIXED: Made popup more compact */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pb-28">
        <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-700">
          {/* FIXED: More compact header with edit functionality */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={playlist.images?.[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                {editingPlaylist ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingPlaylist.name}
                      onChange={(e) => setEditingPlaylist({
                        ...editingPlaylist,
                        name: e.target.value
                      })}
                      className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-white text-lg font-bold placeholder-white/60"
                      placeholder="Playlist name"
                    />
                    <input
                      type="text"
                      value={editingPlaylist.description || ''}
                      onChange={(e) => setEditingPlaylist({
                        ...editingPlaylist,
                        description: e.target.value
                      })}
                      className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-blue-200 text-sm placeholder-blue-200/60"
                      placeholder="Description (optional)"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-white truncate">{playlist.name}</h1>
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
            
            <div className="flex items-center gap-2">
              {editingPlaylist ? (
                <>
                  <button
                    onClick={updatePlaylist}
                    disabled={loading || !editingPlaylist.name.trim()}
                    className="text-green-400 hover:text-green-300 p-1 disabled:opacity-50"
                    title="Save changes"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingPlaylist(null)}
                    className="text-gray-400 hover:text-gray-300 p-1"
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
                      className="text-white/80 hover:text-white p-1"
                      title="Edit playlist"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                    <button
                      onClick={deletePlaylist}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Unfollow playlist"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </>
                )
              )}
              
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* FIXED: More compact controls bar */}
          <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700 flex-shrink-0">
            <button
              onClick={playPlaylist}
              disabled={tracks.length === 0}
              className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>

            {/* ADDED: Manage button */}
            <button
              onClick={() => setShowManager(!showManager)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {showManager ? 'Hide' : 'Manage'}
            </button>

            {/* Currently Playing Info - More compact */}
            {currentlyPlaying && (
              <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1.5 bg-gray-700 rounded-lg border border-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="text-sm">
                  <p className="text-white font-medium text-xs">Now Playing</p>
                  <p className="text-gray-400 truncate max-w-32 text-xs">{currentlyPlaying.name}</p>
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
              <span className="text-xs text-gray-400 hidden sm:block">
                {isPremium 
                  ? (playerReady ? 'Premium Ready' : 'Connecting...')
                  : 'Preview Mode'
                }
              </span>
            </div>
          </div>

          {/* FIXED: Content area with proper scrolling */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-300 text-sm">Loading playlist...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="bg-red-600 text-white p-3 rounded-lg text-sm">
                  {error}
                </div>
              </div>
            ) : (
              <>
                {/* MOBILE VIEW: More compact */}
                <div className="block lg:hidden p-4 space-y-1">
                  {tracks.map((item, index) => (
                    <div
                      key={`${item.track.id}-${index}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-800 active:bg-gray-750 rounded-lg transition-colors cursor-pointer group"
                      onClick={() => playTrack(item.track, index)}
                    >
                      <img
                        src={item.track.album.images[0]?.url || "/placeholder.png"}
                        alt={item.track.name}
                        className="w-10 h-10 rounded"
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
                        <p className="text-gray-500 text-xs">
                          {item.track.album.name}
                        </p>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {Math.floor(item.track.duration_ms / 60000)}:
                        {Math.floor((item.track.duration_ms % 60000) / 1000)
                          .toString()
                          .padStart(2, '0')}
                      </div>
                      {/* ADDED: Remove button - only show when managing */}
                      {showManager && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromPlaylist(item.track.uri, item.track.name, index);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove from playlist"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* DESKTOP VIEW: More compact table */}
                <div className="hidden lg:block p-4">
                  {tracks.map((item, index) => (
                    <div
                      key={`${item.track.id}-${index}`}
                      className={`grid grid-cols-12 gap-4 px-3 py-2 hover:bg-gray-800 rounded-lg group transition-colors cursor-pointer ${
                        currentlyPlaying?.id === item.track.id ? 'bg-gray-800 border-l-4 border-green-400' : ''
                      }`}
                      onClick={() => playTrack(item.track, index)}
                    >
                      <div className="col-span-1 flex items-center">
                        <span className="text-gray-400 group-hover:hidden text-sm">
                          {index + 1}
                        </span>
                        <div className="hidden group-hover:block text-white hover:text-green-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>

                      <div className="col-span-7 flex items-center gap-2">
                        <img
                          src={item.track.album.images[0]?.url || "/placeholder.png"}
                          alt={item.track.name}
                          className="w-8 h-8 rounded"
                        />
                        <div className="min-w-0">
                          <p className={`font-medium truncate text-sm ${
                            currentlyPlaying?.id === item.track.id ? 'text-green-400' : 'text-white'
                          }`}>
                            {item.track.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.track.artists.map(a => a.name).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center">
                        <p className="text-gray-400 text-sm truncate">
                          {item.track.album.name}
                        </p>
                      </div>

                      <div className="col-span-1 flex items-center justify-between">
                        <p className="text-gray-400 text-sm">
                          {Math.floor(item.track.duration_ms / 60000)}:
                          {Math.floor((item.track.duration_ms % 60000) / 1000)
                            .toString()
                            .padStart(2, '0')}
                        </p>
                        
                        {/* ADDED: Remove button - only show when managing */}
                        {showManager && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTrackFromPlaylist(item.track.uri, item.track.name, index);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                            title="Remove from playlist"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {tracks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">This playlist is empty</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
