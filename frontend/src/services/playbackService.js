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
    
    // PREMIUM USERS: Try full track playback first
    if (this.isPremium && this.deviceId && this.accessToken) {
      console.log('Premium user: Trying full track playback...');
      
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
          console.log('SUCCESS: Full track playing for Premium user');
          return; // Exit here - full track is playing
        } else {
          console.log('Full track failed, falling back to preview');
        }
      } catch (error) {
        console.log('Full track failed, falling back to preview');
      }
    }

    // NON-PREMIUM OR FALLBACK: Play preview
    console.log('Playing preview...');
    
    // If no preview URL provided, fetch it
    if (!previewUrl) {
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
        }
      } catch (error) {
        console.error('Failed to fetch track preview:', error);
      }
    }

    // Play preview
    if (previewUrl) {
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available for this track');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    console.log('PlayPlaylist called:', { playlistUri, isPremium: this.isPremium });
    
    // PREMIUM USERS: Try full playlist first
    if (this.isPremium && this.deviceId && this.accessToken) {
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
          console.log('SUCCESS: Full playlist playing for Premium user');
          return; // Exit here - full playlist is playing
        }
      } catch (error) {
        console.log('Full playlist failed, falling back to preview');
      }
    }

    // NON-PREMIUM OR FALLBACK: Play preview
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      console.log('No preview available for playlist');
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
