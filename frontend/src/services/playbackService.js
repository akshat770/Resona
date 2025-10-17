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

  async getTrackWithPreview(trackUri) {
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
    
    // Premium users: Try web player first
    if (this.isPremium && this.deviceId && this.accessToken) {
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
          console.log('Premium: Full track playing');
          return;
        }
      } catch (error) {
        console.log('Web player failed, trying preview');
      }
    }

    // If no preview provided, fetch it from Spotify
    if (!previewUrl) {
      console.log('No preview provided, fetching from API...');
      previewUrl = await this.getTrackWithPreview(trackUri);
    }

    // Play preview if we got one
    if (previewUrl) {
      console.log('Playing preview in web app');
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available for this track');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Premium: Try web player
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
          console.log('Premium: Playlist playing');
          return;
        }
      } catch (error) {
        console.log('Playlist failed, trying preview');
      }
    }

    // Fallback: Play preview
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      console.log('No preview for playlist');
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
