import { useState, useEffect, useRef } from 'react';

export default function SpotifyPlayer({ accessToken, onPlayerReady }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

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
        // Only log unexpected errors, not "no list loaded"
        if (!message.includes('no list was loaded')) {
          console.error('Playback error:', message);
        }
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state) => {
        console.log('Player state changed:', state);
        
        if (!state) {
          setCurrentTrack(null);
          setIsPlaying(false);
          setPosition(0);
          setDuration(0);
          return;
        }

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
        setIsReady(true);
        onPlayerReady(device_id);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken, onPlayerReady]);

  const togglePlay = () => {
    if (!player || !currentTrack) {
      console.log('No track loaded. Please click on a song first.');
      return;
    }
    
    player.togglePlay().then(() => {
      console.log('Toggle play successful');
    }).catch(error => {
      console.error('Toggle play failed:', error);
    });
  };

  const nextTrack = () => {
    if (!player || !currentTrack) {
      console.log('No track loaded. Please click on a song first.');
      return;
    }
    
    player.nextTrack().then(() => {
      console.log('Next track successful');
    }).catch(error => {
      console.error('Next track failed:', error);
    });
  };

  const previousTrack = () => {
    if (!player || !currentTrack) {
      console.log('No track loaded. Please click on a song first.');
      return;
    }
    
    player.previousTrack().then(() => {
      console.log('Previous track successful');
    }).catch(error => {
      console.error('Previous track failed:', error);
    });
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isReady) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 text-center text-gray-400 border-t border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Connecting to Spotify...</span>
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 text-center text-gray-400 border-t border-gray-700">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Premium Player Ready - Click on a song in the dashboard to start</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 border-t border-gray-700">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Current Track Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src={currentTrack.album.images[0]?.url}
            alt={currentTrack.name}
            className="w-14 h-14 rounded-lg"
          />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{currentTrack.name}</p>
            <p className="text-gray-400 text-sm truncate">
              {currentTrack.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={previousTrack}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
              </svg>
            </button>
            
            <button 
              onClick={togglePlay}
              className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
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
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 min-w-[2.5rem] text-right">
              {formatTime(position)}
            </span>
            <div className="flex-1 bg-gray-600 rounded-full h-1">
              <div 
                className="bg-green-400 h-1 rounded-full transition-all duration-100"
                style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 min-w-[2.5rem]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.025 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.025l4.358-3.793a1 1 0 011 0z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            defaultValue="0.5"
            onChange={(e) => player?.setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>
      </div>
    </div>
  );
}
