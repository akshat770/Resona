import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function PlaylistManager({ 
  playlists, 
  setPlaylists, 
  onPlaylistSelect, 
  onCreatePlaylist 
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      const response = await api.post('/spotify/create-playlist', {
        name: newPlaylistName,
        description: newPlaylistDescription,
        public: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newPlaylist = response.data;
      setPlaylists([newPlaylist, ...playlists]);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsCreating(false);
      onCreatePlaylist?.(newPlaylist);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlaylist = async (playlist) => {
    setIsLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      await api.put(`/spotify/update-playlist/${playlist.id}`, {
        name: playlist.name,
        description: playlist.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylists(playlists.map(p => 
        p.id === playlist.id ? { ...p, name: playlist.name, description: playlist.description } : p
      ));
      setEditingPlaylist(null);
    } catch (error) {
      console.error('Error updating playlist:', error);
      alert('Failed to update playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlaylist = async (playlistId) => {
    if (!confirm('Are you sure you want to unfollow this playlist?')) return;

    setIsLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      await api.delete(`/spotify/unfollow-playlist/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylists(playlists.filter(p => p.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to unfollow playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylistTracks = async (playlist) => {
    setSelectedPlaylist(playlist);
    setIsLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      const response = await api.get(`/spotify/playlist/${playlist.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylistTracks(response.data.items || []);
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      setPlaylistTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeTrackFromPlaylist = async (trackUri, index) => {
    if (!selectedPlaylist) return;

    const token = localStorage.getItem("jwt");
    try {
      await api.delete(`/spotify/playlist/${selectedPlaylist.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          tracks: [{ uri: trackUri }]
        }
      });

      // Update local state
      setPlaylistTracks(playlistTracks.filter((_, i) => i !== index));
      
      // Update playlist track count
      setPlaylists(playlists.map(p => 
        p.id === selectedPlaylist.id 
          ? { ...p, tracks: { ...p.tracks, total: (p.tracks?.total || 1) - 1 } }
          : p
      ));
    } catch (error) {
      console.error('Error removing track:', error);
      alert('Failed to remove track from playlist');
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Button when viewing playlist tracks */}
      {selectedPlaylist && (
        <button
          onClick={() => {
            setSelectedPlaylist(null);
            setPlaylistTracks([]);
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Playlists
        </button>
      )}

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            {selectedPlaylist ? `Managing: ${selectedPlaylist.name}` : 'Manage Playlists'}
          </h3>
          {!selectedPlaylist && (
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Create Playlist
            </button>
          )}
        </div>

        {isCreating && !selectedPlaylist && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400"
              />
              <textarea
                placeholder="Description (optional)"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 h-20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={createPlaylist}
                  disabled={!newPlaylistName.trim() || isLoading}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Tracks View */}
        {selectedPlaylist ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <p className="text-gray-400 mb-4">{playlistTracks.length} tracks</p>
            {playlistTracks.map((item, index) => (
              <div
                key={`${item.track.id}-${index}`}
                className="flex items-center justify-between bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={item.track.album.images?.[0]?.url || "/placeholder.png"}
                    alt={item.track.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.track.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {item.track.artists.map(a => a.name).join(", ")}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.floor(item.track.duration_ms / 60000)}:
                    {Math.floor((item.track.duration_ms % 60000) / 1000)
                      .toString().padStart(2, '0')}
                  </span>
                </div>
                
                <button
                  onClick={() => removeTrackFromPlaylist(item.track.uri, index)}
                  className="text-red-400 hover:text-red-300 p-1 ml-2"
                  title="Remove from playlist"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            ))}
            {playlistTracks.length === 0 && (
              <p className="text-gray-400 text-center py-8">This playlist is empty</p>
            )}
          </div>
        ) : (
          /* Playlist List */
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center justify-between bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => loadPlaylistTracks(playlist)}
                >
                  <img
                    src={playlist.images?.[0]?.url || "/placeholder.png"}
                    alt={playlist.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    {editingPlaylist?.id === playlist.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingPlaylist.name}
                          onChange={(e) => setEditingPlaylist({
                            ...editingPlaylist,
                            name: e.target.value
                          })}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                        />
                        <input
                          type="text"
                          value={editingPlaylist.description || ''}
                          onChange={(e) => setEditingPlaylist({
                            ...editingPlaylist,
                            description: e.target.value
                          })}
                          placeholder="Description"
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-white truncate">{playlist.name}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {playlist.tracks?.total || 0} songs
                          {playlist.description && ` • ${playlist.description}`}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingPlaylist?.id === playlist.id ? (
                    <>
                      <button
                        onClick={() => updatePlaylist(editingPlaylist)}
                        disabled={isLoading}
                        className="text-green-400 hover:text-green-300 p-1"
                        title="Save changes"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingPlaylist(null)}
                        className="text-gray-400 hover:text-gray-300 p-1"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlaylist({
                            id: playlist.id,
                            name: playlist.name,
                            description: playlist.description || ''
                          });
                        }}
                        className="text-gray-400 hover:text-white p-1"
                        title="Edit playlist"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(playlist.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Unfollow playlist"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
