import { useState } from 'react';
import api from '../api/axios';
import { useToast } from './ToastProvider';

export default function AIPlaylistGenerator({ isOpen, onClose, onPlaylistGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [songCount, setSongCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a playlist prompt', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await api.post('/spotify/generate-ai-playlist', {
        prompt: prompt.trim(),
        songCount: songCount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGeneratedPlaylist(response.data);
      setShowPreview(true);
      showToast('AI playlist generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating playlist:', error);
      showToast(error.response?.data?.error || 'Failed to generate playlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlaylist = async () => {
    if (!generatedPlaylist) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      
      // Create playlist on Spotify
      const createResponse = await api.post('/spotify/create-playlist', {
        name: generatedPlaylist.name,
        description: generatedPlaylist.description,
        isPublic: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const playlistId = createResponse.data.id;
      
      // Add tracks to the playlist
      const trackUris = generatedPlaylist.tracks.map(track => track.uri);
      await api.post(`/spotify/playlist/${playlistId}/tracks`, {
        tracks: trackUris
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast(`Saved "${generatedPlaylist.name}" to your Spotify!`, 'success');
      onPlaylistGenerated(createResponse.data);
      handleClose();
    } catch (error) {
      console.error('Error saving playlist:', error);
      showToast('Failed to save playlist to Spotify', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPrompt('');
    setSongCount(20);
    setGeneratedPlaylist(null);
    setShowPreview(false);
    onClose();
  };

  const handlePlayTrack = (track) => {
    // You can integrate this with your existing playTrack function
    console.log('Playing track:', track.name);
  };

  if (!isOpen) return null;

  return (
    // FIXED: Added padding bottom to avoid web player overlap
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 pb-28">
      {/* FIXED: Reduced height and max-width for better fit */}
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* FIXED: Reduced padding and made header more compact */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                AI Playlist Generator
              </h2>
              <p className="text-gray-400 text-sm">Powered by Gemini AI</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content area - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!showPreview ? (
            /* Generation Form - FIXED: Reduced spacing and made more compact */
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Describe your perfect playlist
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Upbeat pop songs for a road trip', 'Chill indie music for studying'..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of songs (10-50)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={songCount}
                      onChange={(e) => setSongCount(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-white font-mono text-lg min-w-[3ch]">{songCount}</span>
                  </div>
                </div>

                {/* FIXED: Made examples more compact */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Try these examples:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      "Energetic workout music with heavy bass",
                      "Relaxing acoustic songs for rainy days",
                      "90s nostalgic hits for millennials",
                      "Electronic dance music for parties",
                      "Top 10 phonks for gym",
                      "Best Radiohead songs",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setPrompt(example)}
                        className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors border border-gray-600 hover:border-purple-500"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FIXED: Fixed button at bottom with proper spacing */}
              <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating AI Playlist...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Generate AI Playlist
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Playlist Preview - FIXED: Made more compact */
            <div className="flex flex-col h-full">
              {/* FIXED: Reduced padding for preview header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{generatedPlaylist.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{generatedPlaylist.description}</p>
                    <p className="text-gray-500 text-sm">{generatedPlaylist.tracks.length} tracks</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Generate New
                    </button>
                    <button
                      onClick={handleSavePlaylist}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                        </svg>
                      )}
                      Save to Spotify
                    </button>
                  </div>
                </div>
              </div>

              {/* FIXED: Track List - More compact spacing */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {generatedPlaylist.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg group transition-colors"
                    >
                      <span className="text-gray-400 text-sm font-mono w-6 text-center">
                        {index + 1}
                      </span>
                      <img
                        src={track.album?.images?.[0]?.url || '/placeholder.png'}
                        alt={track.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{track.name}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {track.artists?.map(a => a.name).join(', ')}
                        </p>
                        {track.aiReason && (
                          <p className="text-purple-400 text-xs mt-0.5 italic line-clamp-1">
                            {track.aiReason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className="p-1.5 rounded-full hover:bg-green-400/30 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
