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
      
      const createResponse = await api.post('/spotify/create-playlist', {
        name: generatedPlaylist.name,
        description: generatedPlaylist.description,
        isPublic: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const playlistId = createResponse.data.id;
      
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
    console.log('Playing track:', track.name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      {/* FIXED: Smaller size and proper centering */}
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[75vh] flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Playlist Generator</h2>
                <p className="text-gray-400 text-xs">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!showPreview ? (
            /* Generation Form */
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Prompt Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Describe your perfect playlist
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., 'Upbeat pop songs for a road trip', 'Top 10 phonk songs for gym'..."
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-colors text-sm"
                      rows={3}
                    />
                  </div>

                  {/* Song Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of songs: <span className="text-purple-400 font-mono">{songCount}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">10</span>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={songCount}
                        onChange={(e) => setSongCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(songCount-10)/40*100}%, #374151 ${(songCount-10)/40*100}%, #374151 100%)`
                        }}
                      />
                      <span className="text-gray-400 text-xs">50</span>
                    </div>
                  </div>

                  {/* Example Prompts - Smaller grid */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Try these examples:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "Energetic workout music with heavy bass",
                        "Relaxing acoustic songs for rainy days",
                        "Top 10 phonk songs for gym",
                        "Best Radiohead deep cuts",
                        "Chill lo-fi hip hop for studying",
                        "Upbeat indie pop for road trips"
                      ].map((example, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(example)}
                          className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 hover:text-white transition-colors border border-gray-600 hover:border-purple-500"
                        >
                          "{example}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
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
            </>
          ) : (
            /* Playlist Preview */
            <>
              {/* Preview Header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white line-clamp-1">{generatedPlaylist.name}</h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{generatedPlaylist.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{generatedPlaylist.tracks.length} tracks generated</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    >
                      New
                    </button>
                    <button
                      onClick={handleSavePlaylist}
                      disabled={loading}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-medium text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {loading ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                        </svg>
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  <div className="space-y-1">
                    {generatedPlaylist.tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg group transition-colors"
                      >
                        <span className="text-gray-400 font-mono text-xs w-6 text-center flex-shrink-0">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <img
                          src={track.album?.images?.[0]?.url || '/placeholder.png'}
                          alt={track.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate text-sm">{track.name}</p>
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
                          className="p-1 rounded-full hover:bg-green-400/30 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
