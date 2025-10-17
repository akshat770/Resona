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
    console.log('Device ID set:', deviceId);
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  setIsPremium(premium) {
    this.isPremium = premium;
    console.log('Premium status set to:', premium);
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
          console.log('Premium: Full track playing on web player');
          return;
        } else {
          console.log('Web player failed, trying preview');
        }
      } catch (error) {
        console.log('Premium playback failed, trying preview');
      }
    }

    // Fallback: Use preview (for both Premium and Free users)
    if (previewUrl) {
      console.log('Playing 30-second preview');
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available - this song cannot be played');
      // Just show a visual indicator but don't redirect anywhere
      this.showNoPreviewNotification();
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Premium users: Try web player
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
          console.log('Premium: Playlist playing on web player');
          return;
        }
      } catch (error) {
        console.log('Playlist playback failed');
      }
    }

    // Fallback: Play preview of first track
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      this.showNoPreviewNotification();
    }
  }

  playPreview(previewUrl) {
    if (!previewUrl) return;
    
    // Stop any currently playing preview
    this.stopPreview();
    
    this.audioElement.src = previewUrl;
    this.audioElement.volume = 0.7;
    this.currentPreviewUrl = previewUrl;
    this.isPreviewMode = true;

    this.audioElement.play().then(() => {
      console.log('Preview playing successfully');
    }).catch(error => {
      console.error('Preview playback failed:', error);
    });

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (this.currentPreviewUrl === previewUrl) {
        this.stopPreview();
      }
    }, 30000);
  }

  showNoPreviewNotification() {
    // Simple console log instead of alert
    console.log('No preview available for this track');
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
