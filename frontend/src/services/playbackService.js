class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
    this.isPremium = false;
    this.audioElement = new Audio();
    this.currentPreviewUrl = null;
    this.isPreviewMode = false;
    this.currentTrackInfo = null;
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId;
    console.log('Device ID set:', deviceId);
  }

  setAccessToken(token) {
    this.accessToken = token;
    console.log('Access token set');
  }

  setIsPremium(premium) {
    this.isPremium = premium;
    console.log('Premium status set to:', premium);
  }

  async getTrackPreview(trackId) {
    if (!this.accessToken) return null;
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const trackData = await response.json();
        return trackData.preview_url;
      }
    } catch (error) {
      console.error('Failed to fetch track preview:', error);
    }
    return null;
  }

  async activateWebPlayer() {
    if (!this.deviceId || !this.accessToken) return false;

    try {
      // First, try to activate the web player
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          device_ids: [this.deviceId],
          play: false
        })
      });

      if (response.status === 204) {
        console.log('Web player activated successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    } catch (error) {
      console.log('Web player activation failed');
    }
    return false;
  }

  async playTrack(trackUri, previewUrl = null) {
    const trackId = trackUri.split(':').pop();
    console.log('PlayTrack called:', { trackUri, previewUrl, isPremium: this.isPremium });
    
    // For Premium users, try web player first
    if (this.isPremium && this.deviceId && this.accessToken) {
      
      // Try to activate web player and play
      try {
        await this.activateWebPlayer();
        
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: JSON.stringify({
            uris: [trackUri]
          })
        });

        if (response.ok || response.status === 204) {
          console.log('SUCCESS: Full track playing on web player');
          return;
        }
      } catch (error) {
        console.log('Web player failed, trying preview');
      }
    }

    // If no preview URL provided, try to fetch it
    if (!previewUrl) {
      console.log('No preview provided, fetching from Spotify API...');
      previewUrl = await this.getTrackPreview(trackId);
    }

    // Play preview if available
    if (previewUrl) {
      console.log('Playing 30-second preview in web app');
      this.playPreview(previewUrl);
      return;
    }

    // Last resort: Create a placeholder track with track info
    this.playPlaceholder(trackUri);
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    console.log('PlayPlaylist called:', { playlistUri, trackOffset, isPremium: this.isPremium });
    
    // For Premium users, try web player
    if (this.isPremium && this.deviceId && this.accessToken) {
      try {
        await this.activateWebPlayer();
        
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: JSON.stringify({
            context_uri: playlistUri,
            offset: { position: trackOffset }
          })
        });

        if (response.ok || response.status === 204) {
          console.log('SUCCESS: Playlist playing on web player');
          return;
        }
      } catch (error) {
        console.log('Playlist web player failed');
      }
    }

    // Fallback: Play preview of first track
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      console.log('No preview available for playlist');
      this.showNoPreviewMessage();
    }
  }

  playPreview(previewUrl) {
    if (!previewUrl) return;
    
    console.log('Starting 30-second preview playback');
    this.stopPreview();
    
    this.audioElement.src = previewUrl;
    this.audioElement.volume = 0.7;
    this.currentPreviewUrl = previewUrl;
    this.isPreviewMode = true;

    // Add event listeners for better tracking
    this.audioElement.onplay = () => console.log('Preview started');
    this.audioElement.onpause = () => console.log('Preview paused');
    this.audioElement.onended = () => {
      console.log('Preview ended');
      this.stopPreview();
    };

    this.audioElement.play().then(() => {
      console.log('Preview playing successfully');
    }).catch(error => {
      console.error('Preview playback failed:', error);
      this.showNoPreviewMessage();
    });

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (this.currentPreviewUrl === previewUrl) {
        this.stopPreview();
      }
    }, 30000);
  }

  playPlaceholder(trackUri) {
    console.log('No preview available, showing placeholder');
    // Create a visual indication that track would play
    const trackId = trackUri.split(':').pop();
    
    // Show a temporary notification
    this.showTrackNotification(`Track ready to play. Web player needs an active Spotify session.`);
  }

  showTrackNotification(message) {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 border border-gray-700';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div>
          <p class="font-semibold">${message}</p>
          <p class="text-sm text-gray-400">Start playing music on Spotify app first</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
  }

  showNoPreviewMessage() {
    this.showTrackNotification('No preview available for this track.');
  }

  stopPreview() {
    if (this.audioElement && this.currentPreviewUrl) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.currentPreviewUrl = null;
      this.isPreviewMode = false;
    }
  }

  togglePreview() {
    if (!this.audioElement || !this.currentPreviewUrl) return;
    if (this.audioElement.paused) {
      this.audioElement.play();
    } else {
      this.audioElement.pause();
    }
  }

  isPreviewPlaying() {
    return this.audioElement && !this.audioElement.paused && this.currentPreviewUrl;
  }

  getCurrentPreview() {
    return {
      isPlaying: this.isPreviewPlaying(),
      url: this.currentPreviewUrl,
      currentTime: this.audioElement?.currentTime || 0,
      duration: this.audioElement?.duration || 30
    };
  }
}

export default new PlaybackService();
