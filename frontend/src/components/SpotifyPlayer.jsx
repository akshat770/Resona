import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function SpotifyPlayer({ accessToken, onPlayerReady }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.5);
  const [isVolumeSliderActive, setIsVolumeSliderActive] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showAddToMenu, setShowAddToMenu] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const playerRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const addToMenuRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Fetch playlists and check liked status when track changes
  useEffect(() => {
    if (currentTrack) {
      fetchPlaylists();
      checkIfLiked();
    }
  }, [currentTrack]);

  // Handle click outside for add-to menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addToMenuRef.current && !addToMenuRef.current.contains(event.target)) {
        setShowAddToMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time progress updates
  useEffect(() => {
    if (isPlaying && player) {
      progressIntervalRef.current = setInterval(() => {
        player.getCurrentState().then(state => {
          if (state) {
            setPosition(state.position);
          }
        });
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, player]);

  // Volume slider persistence
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeContainerRef.current && !volumeContainerRef.current.contains(event.target)) {
        if (!isVolumeSliderActive) {
          setShowVolumeSlider(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVolumeSliderActive]);

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
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [accessToken, onPlayerReady]);

  // Fetch playlists for add-to feature
  const fetchPlaylists = async () => {
    const token = localStorage.getItem("jwt");
    try {
      const response = await api.get("/spotify/user-playlists", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(response.data.items || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  // Check if current track is liked
  const checkIfLiked = async () => {
    if (!currentTrack) return;
    const token = localStorage.getItem("jwt");
    try {
      const response = await api.get(`/spotify/check-liked/${currentTrack.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(response.data[0]);
    } catch (error) {
      console.error("Error checking liked status:", error);
    }
  };

  // Toggle liked status
  const toggleLiked = async () => {
    if (!currentTrack) return;
    const token = localStorage.getItem("jwt");
    
    try {
      if (isLiked) {
        await api.delete("/spotify/liked-songs", {
          headers: { Authorization: `Bearer ${token}` },
          data: { trackIds: [currentTrack.id] }
        });
        setIsLiked(false);
      } else {
        await api.put("/spotify/liked-songs", {
          trackIds: [currentTrack.id]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling liked:", error);
    }
  };

  // Add to playlist function
  const addToPlaylist = async (playlistId) => {
    if (!currentTrack) return;
    const token = localStorage.getItem("jwt");
    
    try {
      await api.post(`/spotify/playlist/${playlistId}/tracks`, {
        tracks: [currentTrack.uri]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Song added to playlist!");
      setShowAddToMenu(false);
    } catch (error) {
      console.error("Error adding to playlist:", error);
      alert("Failed to add to playlist");
    }
  };

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

  // Volume control functions
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    player?.setVolume(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      const volumeToRestore = previousVolume > 0 ? previousVolume : 0.5;
      setVolume(volumeToRestore);
      setIsMuted(false);
      player?.setVolume(volumeToRestore);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
      player?.setVolume(0);
    }
  };

  // Progress bar seek functionality
  const handleProgressClick = (e) => {
    if (!player || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newPosition = percentage * duration;
    
    player.seek(newPosition).then(() => {
      setPosition(newPosition);
    }).catch(error => {
      console.error('Seek failed:', error);
    });
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      );
    } else if (volume < 0.3) {
      return (
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
      );
    } else if (volume < 0.7) {
      return (
        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
      );
    } else {
      return (
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
      );
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isReady) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 text-center text-gray-400 border-t border-gray-700 z-50">
        <div className="flex items-center justify-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Connecting to Spotify...</span>
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 text-center text-gray-400 border-t border-gray-700 z-50">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm">Premium Player Ready - Click on a song in the dashboard to start</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 backdrop-blur-sm z-50">
      {/* MOBILE LAYOUT */}
      <div className="lg:hidden p-3">
        {/* Top row: Track info and main controls */}
        <div className="flex items-center justify-between mb-3">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-12 h-12 rounded-lg shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate text-sm">{currentTrack.name}</p>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLiked}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            
            <div className="relative" ref={addToMenuRef}>
              <button
                onClick={() => setShowAddToMenu(!showAddToMenu)}
                className="text-gray-400 hover:text-white p-2 rounded-full"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
              
              {/* Mobile Add to Playlist Menu */}
              {showAddToMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-600 w-48 z-20">
                  <div className="p-2 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700 mb-2">Add to playlist:</p>
                    {playlists.length > 0 ? playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => addToPlaylist(playlist.id)}
                        className="w-full text-left px-2 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center gap-2"
                      >
                        <img
                          src={playlist.images?.[0]?.url || "/placeholder.png"}
                          alt={playlist.name}
                          className="w-6 h-6 rounded"
                        />
                        <span className="truncate">{playlist.name}</span>
                      </button>
                    )) : (
                      <p className="text-xs text-gray-500 px-2 py-1">No playlists</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <button onClick={previousTrack} className="text-gray-400 hover:text-white p-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
            </svg>
          </button>
          
          <button 
            onClick={togglePlay}
            className="bg-gradient-to-r from-green-400 to-green-500 text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button onClick={nextTrack} className="text-gray-400 hover:text-white p-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono w-8">{formatTime(position)}</span>
          <div 
            className="flex-1 bg-gray-700 rounded-full h-1 cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-1 rounded-full transition-all duration-150"
              style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 font-mono w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:block p-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          {/* Current Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative">
              <img
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.name}
                className="w-14 h-14 rounded-lg shadow-lg"
              />
              {isPlaying && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-800 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{currentTrack.name}</p>
              <p className="text-gray-400 text-sm truncate">
                {currentTrack.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>
            
            {/* Desktop Like/Add buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLiked}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isLiked ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              
              <div className="relative" ref={addToMenuRef}>
                <button
                  onClick={() => setShowAddToMenu(!showAddToMenu)}
                  className="text-gray-400 hover:text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
                
                {showAddToMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-600 min-w-48 z-10">
                    <div className="p-2">
                      <p className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700 mb-2">Add to playlist:</p>
                      <div className="max-h-40 overflow-y-auto">
                        {playlists.length > 0 ? playlists.map(playlist => (
                          <button
                            key={playlist.id}
                            onClick={() => addToPlaylist(playlist.id)}
                            className="w-full text-left px-2 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center gap-2 transition-colors"
                          >
                            <img
                              src={playlist.images?.[0]?.url || "/placeholder.png"}
                              alt={playlist.name}
                              className="w-6 h-6 rounded"
                            />
                            <span className="truncate">{playlist.name}</span>
                          </button>
                        )) : (
                          <p className="text-xs text-gray-500 px-2 py-1">No playlists found</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-4">
              <button 
                onClick={previousTrack}
                className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-gray-700 hover:shadow-lg hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
                </svg>
              </button>
              
              <button 
                onClick={togglePlay}
                className="bg-gradient-to-r from-green-400 to-green-500 text-black rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-xl hover:shadow-green-500/30"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button 
                onClick={nextTrack}
                className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-gray-700 hover:shadow-lg hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
                </svg>
              </button>
            </div>

            {/* Enhanced Progress Bar with seek functionality */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-gray-400 min-w-[2.5rem] text-right font-mono">
                {formatTime(position)}
              </span>
              <div 
                className="flex-1 bg-gray-700 rounded-full h-2 relative group cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-150 relative"
                  style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
                >
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="absolute inset-0 bg-green-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-xs text-gray-400 min-w-[2.5rem] font-mono">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Desktop Volume Control */}
          <div className="flex items-center gap-3 flex-1 justify-end relative">
            <div 
              ref={volumeContainerRef}
              className="relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => {
                if (!isVolumeSliderActive) {
                  setShowVolumeSlider(false);
                }
              }}
            >
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-gray-700 hover:shadow-lg group relative"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {getVolumeIcon()}
                </svg>
                
                {/* Volume Level Indicator */}
                <div className="absolute -top-1 -right-1">
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    volume > 0.7 ? 'bg-green-400' : 
                    volume > 0.3 ? 'bg-yellow-400' : 
                    volume > 0 ? 'bg-orange-400' : 'bg-red-400'
                  }`}></div>
                </div>
              </button>

              {/* Persistent Volume Slider */}
              <div className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ${
                showVolumeSlider ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
              }`}>
                <div 
                  className="bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-600/50"
                  onMouseEnter={() => setIsVolumeSliderActive(true)}
                  onMouseLeave={() => setIsVolumeSliderActive(false)}
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* Volume Percentage */}
                    <div className="text-xs text-green-400 font-mono font-semibold">
                      {Math.round(volume * 100)}%
                    </div>
                    
                    {/* Vertical Slider */}
                    <div className="relative h-24 w-2 bg-gray-700 rounded-full">
                      <div 
                        className="absolute bottom-0 w-2 bg-gradient-to-t from-green-400 to-green-500 rounded-full transition-all duration-200"
                        style={{ height: `${volume * 100}%` }}
                      >
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-green-400"></div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rotate-180"
                        style={{ 
                          writingMode: 'bt-lr',
                          WebkitAppearance: 'slider-vertical'
                        }}
                      />
                    </div>

                    {/* Volume Levels Visualization */}
                    <div className="flex flex-col gap-1 items-center">
                      {[0.8, 0.6, 0.4, 0.2].map((level) => (
                        <div
                          key={level}
                          className={`w-1 h-1 rounded-full transition-all duration-200 ${
                            volume >= level ? 'bg-green-400 shadow-green-400/50' : 'bg-gray-600'
                          }`}
                          style={{ 
                            boxShadow: volume >= level ? '0 0 4px currentColor' : 'none'
                          }}
                        />
                      ))}
                    </div>

                    {/* Quick Volume Buttons */}
                    <div className="flex gap-1 mt-2">
                      {[0, 0.3, 0.7, 1].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleVolumeChange(level)}
                          className={`w-6 h-6 rounded text-xs font-mono transition-all duration-200 ${
                            Math.abs(volume - level) < 0.1 
                              ? 'bg-green-500 text-black shadow-lg' 
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {level === 0 ? '🔇' : Math.round(level * 100)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sound Waves Animation */}
            {isPlaying && volume > 0 && (
              <div className="flex items-center gap-0.5 ml-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-green-400 rounded-full animate-pulse"
                    style={{
                      height: `${8 + Math.random() * 8}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
