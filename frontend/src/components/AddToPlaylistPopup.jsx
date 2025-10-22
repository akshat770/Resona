import { useState } from "react";
import api from "../api/axios";
import { useToast } from "./ToastProvider";

export default function AddToPlaylistPopup({ isOpen, onClose, track, playlists, setPlaylists }) {
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

      // Update playlists list if setPlaylists is provided
      if (setPlaylists) {
        setPlaylists(prev => [createRes.data, ...prev]);
      }
      
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 pb-32">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
              Add to Playlist
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          {/* Track Info */}
          <div className="flex items-center gap-3 mt-4 p-3 bg-gray-700 rounded-lg">
            <img 
              src={track.album?.images?.[0]?.url || "/placeholder.png"} 
              alt={track.name} 
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{track.name}</p>
              <p className="text-gray-300 text-sm truncate">
                {track.artists?.map(a => a.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Create New Playlist */}
          <div className="p-4 border-b border-gray-700">
            {!isCreatingNew ? (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-700 rounded-xl transition-colors border border-gray-600 hover:border-purple-500"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Create New Playlist</p>
                  <p className="text-gray-400 text-sm">Make a custom playlist</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPlaylistName("");
                    }}
                    className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!newPlaylistName.trim() || loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      "Create & Add"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Playlists */}
          <div className="p-4">
            {playlists?.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <p className="text-gray-400 font-medium">No playlists found</p>
                <p className="text-gray-500 text-sm mt-1">Create your first playlist above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                    disabled={loading}
                    className="flex items-center gap-3 w-full p-3 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 border border-gray-700 hover:border-gray-600"
                  >
                    <img
                      src={playlist.images?.[0]?.url || "/placeholder.png"}
                      alt={playlist.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white font-semibold truncate">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks?.total || 0} songs</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}