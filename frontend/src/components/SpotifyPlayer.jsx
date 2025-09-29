// frontend/src/components/SpotifyPlayer.jsx
import { useState, useEffect, useRef } from 'react';

export default function SpotifyPlayer({ accessToken, onPlayerReady }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Resona Web Player',
        getOAuthToken: (cb) => { cb(accessToken); },
        volume: 0.5
      });

      playerRef.current = spotifyPlayer;

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setPlayer(spotifyPlayer);
        onPlayerReady(device_id);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player!
      spotifyPlayer.connect();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken, onPlayerReady]);

  const togglePlay = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const nextTrack = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const previousTrack = () => {
    if (player) {
      player.previousTrack();
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPosition = percent * duration;
    
    if (player) {
      player.seek(newPosition);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 text-center text-gray-400">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Select a song to start playing</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Current Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xs">
            <div className="relative group">
              <img
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.name}
                className="w-14 h-14 rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg"></div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate text-sm">
                {currentTrack.name}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            
            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={previousTrack}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              
              <button 
                onClick={togglePlay}
                className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-all duration-150 shadow-lg hover:shadow-xl"
              >
                {isPlaying ? (
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
                onClick={nextTrack}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-gray-400 min-w-[2.5rem] text-right">
                {formatTime(position)}
              </span>
              
              <div 
                className="flex-1 bg-gray-600 rounded-full h-1 cursor-pointer group"
                onClick={handleSeek}
              >
                <div 
                  className="bg-green-400 h-1 rounded-full transition-all duration-100 relative group-hover:bg-green-300"
                  style={{ width: `${(position / duration) * 100}%` }}
                >
                  <div className="absolute -right-1.5 -top-1.5 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                </div>
              </div>
              
              <span className="text-xs text-gray-400 min-w-[2.5rem]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 flex-1 justify-end max-w-xs">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                {volume === 0 ? (
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                ) : volume < 0.3 ? (
                  <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                ) : volume < 0.7 ? (
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                ) : (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                )}
              </svg>
            </button>
            
            <div className="relative group w-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none 
                         [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 
                         [&::-webkit-slider-thumb]:bg-white 
                         [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-moz-range-thumb]:w-3 
                         [&::-moz-range-thumb]:h-3 
                         [&::-moz-range-thumb]:bg-white 
                         [&::-moz-range-thumb]:rounded-full 
                         [&::-moz-range-thumb]:cursor-pointer 
                         [&::-moz-range-thumb]:border-none
                         [&::-moz-range-track]:bg-gray-600 
                         [&::-moz-range-track]:h-1 
                         [&::-moz-range-track]:rounded-full"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
