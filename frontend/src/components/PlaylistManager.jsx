import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function PlaylistManager({ isOpen, onClose, onPlaylistCreated }) {
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    const token = localStorage.getItem("jwt");
    setIsCreating(true);

    try {
      const response = await api.post("/spotify/create-playlist", {
        name: playlistName.trim(),
        description: description.trim() || `Created with Resona on ${new Date().toLocaleDateString()}`,
        isPublic
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onPlaylistCreated(response.data);
      setPlaylistName('');
      setDescription('');
      setIsPublic(false);
      onClose();
    } catch (err) {
      console.error("Error creating playlist:", err);
      alert("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Create New Playlist</h2>
        
        <form onSubmit={createPlaylist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Playlist Name *
            </label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your playlist..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Make playlist public
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !playlistName.trim()}
              className="flex-1 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
