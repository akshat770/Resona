class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
    this.isPremium = false;
    this.audioElement = new Audio();
    this.currentPreviewUrl = null;
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId;
    this.isPremium = true; // If device is ready, user has Premium
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async playTrack(trackUri, previewUrl = null) {
    // Premium users: Use Web Playback API
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
        console.log('Premium playback failed, trying preview');
      }
    }

    // Non-Premium users or fallback: Use preview
    if (previewUrl) {
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available for this track');
      // Fallback: Open in Spotify
      const trackId = trackUri.split(':').pop();
      window.open(`https://open.spotify.com/track/${trackId}`, '_blank');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Premium users: Use Web Playback API
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

    // Non-Premium: Play first track preview or open playlist
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      const playlistId = playlistUri.split(':').pop();
      window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank');
    }
  }

  playPreview(previewUrl) {
    if (!previewUrl) {
      console.log('No preview URL available');
      return;
    }

    // Stop current preview
    this.stopPreview();

    // Play new preview
    this.audioElement.src = previewUrl;
    this.audioElement.play().then(() => {
      console.log('Preview: Playing 30-second preview');
      this.currentPreviewUrl = previewUrl;
    }).catch(error => {
      console.error('Preview playback failed:', error);
    });
  }

  stopPreview() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.currentPreviewUrl = null;
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
}

export default new PlaybackService();
