import { useState } from 'react';
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
        p.id === playlist.id ? { ...p, ...playlist } : p
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
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    setIsLoading(true);
    const token = localStorage.getItem("jwt");

    try {
      await api.delete(`/spotify/unfollow-playlist/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylists(playlists.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create New Playlist */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Manage Playlists</h3>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Create Playlist
          </button>
        </div>

        {isCreating && (
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

        {/* Playlist List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center justify-between bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
            >
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => onPlaylistSelect?.(playlist)}
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
                      onClick={() => setEditingPlaylist({
                        id: playlist.id,
                        name: playlist.name,
                        description: playlist.description || ''
                      })}
                      className="text-gray-400 hover:text-white p-1"
                      title="Edit playlist"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                    {playlist.owner?.id && (
                      <button
                        onClick={() => deletePlaylist(playlist.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete playlist"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
