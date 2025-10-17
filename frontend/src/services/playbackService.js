class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
    this.isPremium = false;
    this.audioElement = new Audio();
    this.currentPreviewUrl = null;
    this.isPreviewMode = false;
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  setIsPremium(premium) {
    this.isPremium = premium;
  }

  async playTrack(trackUri, previewUrl = null) {
    console.log('PlayTrack called:', { trackUri, previewUrl, isPremium: this.isPremium });
    
    // If no preview URL provided, fetch it from Spotify API
    if (!previewUrl) {
      console.log('Fetching preview URL from Spotify API...');
      const trackId = trackUri.split(':').pop();
      
      try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        if (response.ok) {
          const trackData = await response.json();
          previewUrl = trackData.preview_url;
          console.log('Fetched preview URL:', previewUrl);
        }
      } catch (error) {
        console.error('Failed to fetch track preview:', error);
      }
    }

    // ALWAYS try to play preview in web app first
    if (previewUrl) {
      console.log('Playing preview in web app');
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available for this track');
    }

    // Premium users: ALSO try web player (optional, runs in background)
    if (this.isPremium && this.deviceId && this.accessToken) {
      setTimeout(() => {
        this.tryWebPlayerInBackground(trackUri);
      }, 100);
    }
  }

  async tryWebPlayerInBackground(trackUri) {
    try {
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
        console.log('BONUS: Full track also playing on web player');
      }
    } catch (error) {
      // Silently fail - preview is still playing
      console.log('Web player failed (that\'s fine, preview is playing)');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Always play preview if available
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    }

    // Premium: Also try web player
    if (this.isPremium && this.deviceId) {
      setTimeout(() => {
        this.tryWebPlayerPlaylist(playlistUri, trackOffset);
      }, 100);
    }
  }

  async tryWebPlayerPlaylist(playlistUri, trackOffset = 0) {
    try {
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
        console.log('BONUS: Full playlist also playing on web player');
      }
    } catch (error) {
      console.log('Playlist web player failed (that\'s fine)');
    }
  }

  playPreview(previewUrl) {
    if (!previewUrl) return;
    
    this.stopPreview();
    this.audioElement.src = previewUrl;
    this.audioElement.volume = 0.7;
    this.currentPreviewUrl = previewUrl;
    this.isPreviewMode = true;

    this.audioElement.play().then(() => {
      console.log('Preview playing successfully');
    }).catch(error => {
      console.error('Preview failed:', error);
    });

    setTimeout(() => {
      if (this.currentPreviewUrl === previewUrl) {
        this.stopPreview();
      }
    }, 30000);
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
