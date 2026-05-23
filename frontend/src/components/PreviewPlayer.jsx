import { useState, useEffect } from 'react';
import playbackService from '../services/playbackService';

export default function PreviewPlayer() {
  const [previewState, setPreviewState] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const preview = playbackService.getCurrentPreview();
      setPreviewState(preview);
      if (preview && preview.url) {
        setCurrentTime(preview.currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    playbackService.togglePreview();
  };

  const stopPreview = () => {
    playbackService.stopPreview();
    setPreviewState(null);
  };

  // UPDATED: Only show player when there's actually a preview URL
  if (!previewState?.url) {
    return null; // Don't render anything when no preview is active
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds);
    const secs = Math.floor((seconds % 1) * 60);
    return `0:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-800 to-blue-900 border-t border-blue-700 p-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        
        {/* Preview Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Preview Mode</p>
            <p className="text-blue-200 text-xs">30-second preview • Upgrade for full tracks</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="bg-white text-blue-600 rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-all shadow-lg"
          >
            {previewState.isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button 
            onClick={stopPreview}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs text-blue-200">{formatTime(currentTime)}</span>
          <div className="w-24 bg-blue-700 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all"
              style={{ width: `${(currentTime / 30) * 100}%` }}
            />
          </div>
          <span className="text-xs text-blue-200">0:30</span>
        </div>
      </div>
    </div>
  );
}
