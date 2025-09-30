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
    this.isPremium = true;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async playTrack(trackUri, previewUrl = null) {
    console.log('PlayTrack called:', { trackUri, previewUrl, isPremium: this.isPremium });
    
    // Premium users: Try Web Playback API first
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
        console.log('Premium playback failed, falling back to preview');
      }
    }

    // Non-Premium or fallback: Use preview
    if (previewUrl) {
      console.log('Playing preview:', previewUrl);
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available');
      alert('No preview available for this track. Please upgrade to Spotify Premium for full playback.');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Premium users: Try Web Playback API first
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
        console.log('Premium playlist playback failed');
      }
    }

    // Non-Premium: Play first track preview
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      alert('No preview available for this playlist. Please upgrade to Spotify Premium.');
    }
  }

  playPreview(previewUrl) {
    if (!previewUrl) {
      console.log('No preview URL provided');
      return;
    }

    console.log('Starting preview playback:', previewUrl);
    
    // Stop current preview
    this.stopPreview();

    // Set up new preview
    this.audioElement.src = previewUrl;
    this.audioElement.volume = 0.7;
    this.currentPreviewUrl = previewUrl;
    this.isPreviewMode = true;

    // Play preview
    this.audioElement.play().then(() => {
      console.log('Preview playing successfully');
    }).catch(error => {
      console.error('Preview playback failed:', error);
      alert('Failed to play preview. Please check your connection.');
    });

    // Auto-stop after 30 seconds
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
      console.log('Preview stopped');
    }
  }

  togglePreview() {
    if (!this.audioElement || !this.currentPreviewUrl) return;

    if (this.audioElement.paused) {
      this.audioElement.play();
      console.log('Preview resumed');
    } else {
      this.audioElement.pause();
      console.log('Preview paused');
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
