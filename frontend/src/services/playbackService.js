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

  async getTrackPreview(trackUri) {
    if (!this.accessToken) return null;
    
    const trackId = trackUri.split(':').pop();
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

  async playTrack(trackUri, previewUrl = null) {
    console.log('PlayTrack called:', { trackUri, previewUrl, isPremium: this.isPremium });
    
    // If no preview provided, get it from API
    if (!previewUrl) {
      previewUrl = await this.getTrackPreview(trackUri);
    }

    // ALWAYS play preview in web app (this was working before)
    if (previewUrl) {
      console.log('Playing preview directly in web app');
      this.playPreview(previewUrl);
      
      // Premium users: ALSO try to play full track in background (optional)
      if (this.isPremium && this.deviceId) {
        this.tryWebPlayerInBackground(trackUri);
      }
    } else {
      // No preview available
      console.log('No preview available for this track');
      
      // Premium users can still try web player
      if (this.isPremium && this.deviceId) {
        this.tryWebPlayerInBackground(trackUri);
      }
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
        console.log('Bonus: Full track also playing on Spotify Web Player');
        // Don't stop the preview - let both play (user can choose)
      }
    } catch (error) {
      // Silently fail - preview is still playing
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Always try to play preview first
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    }

    // Premium users: Also try web player
    if (this.isPremium && this.deviceId) {
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
          console.log('Bonus: Full playlist also playing on Spotify');
        }
      } catch (error) {
        // Silently fail
      }
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
      console.log('Preview playing in web app');
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
