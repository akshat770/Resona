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
          return; // EXIT HERE - full track is playing
        } else {
          console.log('Full track failed, falling back to preview');
        }
      } catch (error) {
        console.log('Full track failed, falling back to preview');
      }
    }

    // FALLBACK: Get and play preview
    console.log('Getting preview for track...');
    
    // If no preview URL provided, fetch it from Spotify API
    if (!previewUrl) {
      const trackId = trackUri.split(':').pop();
      console.log('Fetching preview for track ID:', trackId);
      
      try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        if (response.ok) {
          const trackData = await response.json();
          previewUrl = trackData.preview_url;
          console.log('API returned preview URL:', previewUrl);
        } else {
          console.error('Failed to fetch track data:', response.status);
        }
      } catch (error) {
        console.error('API call failed:', error);
      }
    }

    // Play preview if we got one
    if (previewUrl) {
      console.log('Playing preview:', previewUrl);
      this.playPreview(previewUrl);
    } else {
      console.log('This track has no preview available anywhere');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    console.log('PlayPlaylist called for Premium user');
    
    // PREMIUM: Try full playlist first
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
          return; // EXIT HERE
        }
      } catch (error) {
        console.log('Full playlist failed, trying preview');
      }
    }

    // Fallback: Play preview
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
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
