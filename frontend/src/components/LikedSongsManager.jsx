import { useState } from 'react';
import api from '../api/axios';

export default function LikedSongsManager({ songs, setSongs, onSongSelect, playlists = [] }) {
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [sortBy, setSortBy] = useState('added_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSongSelection = (songId) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const selectAllSongs = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map(item => item.track.id)));
    }
  };

  const removeSelectedSongs = async () => {
    if (selectedSongs.size === 0) return;
    
    if (!confirm(`Remove ${selectedSongs.size} songs from liked songs?`)) return;

    const token = localStorage.getItem("jwt");
    try {
      await api.delete("/spotify/liked-songs", {
        headers: { Authorization: `Bearer ${token}` },
        data: { trackIds: Array.from(selectedSongs) }
      });

      setSongs(songs.filter(item => !selectedSongs.has(item.track.id)));
      setSelectedSongs(new Set());
      setIsSelecting(false);
    } catch (error) {
      console.error("Error removing songs:", error);
      alert("Failed to remove songs");
    }
  };

  const addToPlaylist = async (playlistId) => {
    if (selectedSongs.size === 0) return;

    const token = localStorage.getItem("jwt");
    const trackUris = songs
      .filter(item => selectedSongs.has(item.track.id))
      .map(item => item.track.uri);

    try {
      await api.post(`/spotify/playlist/${playlistId}/tracks`, {
        uris: trackUris
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Added ${selectedSongs.size} songs to playlist`);
      setSelectedSongs(new Set());
      setIsSelecting(false);
    } catch (error) {
      console.error("Error adding to playlist:", error);
      alert("Failed to add songs to playlist");
    }
  };

  // Filter and sort songs
  const filteredSongs = songs
    .filter(item => 
      item.track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.track.artists.some(artist => 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.track.name.toLowerCase();
          bVal = b.track.name.toLowerCase();
          break;
        case 'artist':
          aVal = a.track.artists[0]?.name.toLowerCase() || '';
          bVal = b.track.artists[0]?.name.toLowerCase() || '';
          break;
        case 'album':
          aVal = a.track.album.name.toLowerCase();
          bVal = b.track.album.name.toLowerCase();
          break;
        case 'added_at':
          aVal = new Date(a.added_at);
          bVal = new Date(b.added_at);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Return object with selection methods for parent to use
  const selectionMethods = {
    isSelecting,
    selectedSongs,
    filteredSongs,
    toggleSongSelection
  };

  // Expose selection methods to parent component
  if (onSongSelect && typeof onSongSelect === 'function') {
    onSongSelect(selectionMethods);
  }

  return (
    <div className="space-y-4">
      {/* MOBILE-RESPONSIVE MANAGEMENT CONTROLS */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              onClick={() => {
                setIsSelecting(!isSelecting);
                if (isSelecting) setSelectedSongs(new Set());
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                isSelecting 
                  ? 'bg-blue-500 hover:bg-blue-400 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {isSelecting ? 'Exit Selection' : 'Select Songs'}
            </button>

            {isSelecting && (
              <>
                <button
                  onClick={selectAllSongs}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {selectedSongs.size === filteredSongs.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-gray-400 text-sm">
                  {selectedSongs.size} selected
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm w-full sm:w-48"
            />

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="added_at">Date Added</option>
                <option value="name">Song Name</option>
                <option value="artist">Artist</option>
                <option value="album">Album</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-gray-400 hover:text-white p-2"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <svg 
                  className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE-RESPONSIVE BULK ACTIONS */}
        {isSelecting && selectedSongs.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={removeSelectedSongs}
              className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto"
            >
              Remove {selectedSongs.size} Song{selectedSongs.size !== 1 ? 's' : ''}
            </button>
            
            {playlists.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addToPlaylist(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm w-full sm:w-auto"
              >
                <option value="">Add to Playlist...</option>
                {playlists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Songs Stats */}
      <div className="text-gray-400 text-sm">
        Showing {filteredSongs.length} of {songs.length} songs
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Selection info for parent component */}
      {isSelecting && (
        <div className="text-sm text-gray-400">
          Click on songs in the list below to select them
        </div>
      )}
    </div>
  );
}
