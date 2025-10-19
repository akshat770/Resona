import { useEffect, useState } from "react";
import api from "../api/axios";
import playbackService from "../services/playbackService";

export default function PlaylistPopup({ isOpen, onClose, playlist, playerReady, isPremium }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

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

  if (!isOpen || !playlist) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* MOBILE-RESPONSIVE POPUP */}
      <div className="fixed inset-2 lg:inset-4 bg-gray-900 rounded-xl lg:rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl border border-gray-700">
        {/* MOBILE-RESPONSIVE HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 lg:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <img
              src={playlist.images?.[0]?.url || "/placeholder.png"}
              alt={playlist.name}
              className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-white">{playlist.name}</h1>
              <p className="text-blue-200 text-sm lg:text-base">
                {tracks.length} songs • {playlist.owner?.display_name || 'Unknown'}
              </p>
              {playlist.description && (
                <p className="text-blue-100 text-xs lg:text-sm mt-1 hidden lg:block">{playlist.description}</p>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* MOBILE-RESPONSIVE CONTROLS BAR */}
        <div className="bg-gray-800 px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-3 lg:gap-4 border-b border-gray-700">
          <button
            onClick={playPlaylist}
            disabled={tracks.length === 0}
            className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          {/* Currently Playing Info */}
          {currentlyPlaying && (
            <div className="hidden lg:flex items-center gap-3 ml-4 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-sm">
                <p className="text-white font-medium">Now Playing</p>
                <p className="text-gray-400 truncate max-w-40">{currentlyPlaying.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading playlist...</p>
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW: Simplified List */}
              <div className="block lg:hidden p-4 space-y-2">
                {tracks.map((item, index) => (
                  <div
                    key={`${item.track.id}-${index}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 active:bg-gray-750 rounded-lg transition-colors cursor-pointer"
                    onClick={() => playTrack(item.track, index)}
                  >
                    <img
                      src={item.track.album.images[0]?.url || "/placeholder.png"}
                      alt={item.track.name}
                      className="w-12 h-12 rounded"
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
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Table Layout */}
              <div className="hidden lg:block p-6">
                {tracks.map((item, index) => (
                  <div
                    key={`${item.track.id}-${index}`}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-800 rounded-lg group transition-colors cursor-pointer ${
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

                    <div className="col-span-8 flex items-center gap-3">
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
                    </div>

                    <div className="col-span-2 flex items-center">
                      <p className="text-gray-400 text-sm truncate">
                        {item.track.album.name}
                      </p>
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      <p className="text-gray-400 text-sm">
                        {Math.floor(item.track.duration_ms / 60000)}:
                        {Math.floor((item.track.duration_ms % 60000) / 1000)
                          .toString()
                          .padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
