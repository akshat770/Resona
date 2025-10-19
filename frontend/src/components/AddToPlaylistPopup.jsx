import { useState } from "react";
import api from "../api/axios";
import { useToast } from "./ToastProvider";

export default function AddToPlaylistPopup({ isOpen, onClose, track, playlists }) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleAddToPlaylist = async (playlistId, playlistName) => {
    if (!track) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt");
      await api.post(`/spotify/playlist/${playlistId}/tracks`,
        { tracks: [track.uri] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(`Added "${track.name}" to ${playlistName}`, "success");
      onClose();
    } catch (error) {
      showToast("Failed to add to playlist", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt");
      
      // Create new playlist
      const createRes = await api.post("/spotify/create-playlist",
        { name: newPlaylistName, description: "Created with Resona" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add track to the new playlist
      await api.post(`/spotify/playlist/${createRes.data.id}/tracks`,
        { tracks: [track.uri] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(`Created "${newPlaylistName}" and added "${track.name}"`, "success");
      setNewPlaylistName("");
      setIsCreatingNew(false);
      onClose();
    } catch (error) {
      showToast("Failed to create playlist", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Add to playlist</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <img 
              src={track.album?.images?.[0]?.url || "/placeholder.png"} 
              alt={track.name} 
              className="w-10 h-10 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{track.name}</p>
              <p className="text-gray-400 text-sm truncate">
                {track.artists?.map(a => a.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80">
          {/* Create New Playlist */}
          <div className="p-4 border-b border-gray-700">
            {!isCreatingNew ? (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center gap-3 w-full p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <span className="text-white font-medium">Create playlist</span>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="My Playlist #1"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPlaylistName("");
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!newPlaylistName.trim() || loading}
                    className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Playlists */}
          <div className="p-2">
            {playlists.map(playlist => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                disabled={loading}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <img
                  src={playlist.images?.[0]?.url || "/placeholder.png"}
                  alt={playlist.name}
                  className="w-10 h-10 rounded"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-medium truncate">{playlist.name}</p>
                  <p className="text-gray-400 text-sm">{playlist.tracks?.total || 0} songs</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
