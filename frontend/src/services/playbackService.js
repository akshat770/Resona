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
    console.log('Access token set');
  }

  setIsPremium(premium) {
    this.isPremium = premium;
    console.log('Premium status set to:', premium);
  }

  async playTrack(trackUri, previewUrl = null) {
    console.log('PlayTrack called:', { 
      trackUri, 
      previewUrl, 
      isPremium: this.isPremium,
      deviceId: this.deviceId 
    });
    
    // For Premium users, try multiple approaches
    if (this.isPremium && this.accessToken) {
      
      // Approach 1: Try with device ID
      if (this.deviceId) {
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
            console.log('Success: Track playing on web player');
            return;
          }
        } catch (error) {
          console.log('Web player approach failed');
        }
      }

      // Approach 2: Try without device ID (use active device)
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
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
          console.log('Success: Track playing on active device');
          return;
        }
      } catch (error) {
        console.log('Active device approach failed');
      }

      // Approach 3: Open in Spotify app as fallback for Premium users
      console.log('All playback methods failed, opening in Spotify app');
      const trackId = trackUri.split(':').pop();
      window.open(`https://open.spotify.com/track/${trackId}?utm_source=resona`, '_blank');
      return;
    }

    // Non-Premium: Use preview or open in Spotify
    if (previewUrl) {
      console.log('Playing preview for non-Premium user');
      this.playPreview(previewUrl);
    } else {
      console.log('No preview, opening in Spotify');
      const trackId = trackUri.split(':').pop();
      window.open(`https://open.spotify.com/track/${trackId}?utm_source=resona`, '_blank');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    console.log('PlayPlaylist called:', { playlistUri, trackOffset, isPremium: this.isPremium });
    
    // Premium users: Try web playback, fallback to Spotify app
    if (this.isPremium && this.accessToken) {
      
      // Try with device ID first
      if (this.deviceId) {
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
            console.log('Success: Playlist playing on web player');
            return;
          }
        } catch (error) {
          console.log('Web player playlist failed');
        }
      }

      // Fallback: Open playlist in Spotify app
      const playlistId = playlistUri.split(':').pop();
      window.open(`https://open.spotify.com/playlist/${playlistId}?utm_source=resona`, '_blank');
      return;
    }

    // Non-Premium: Preview or open in Spotify
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      const playlistId = playlistUri.split(':').pop();
      window.open(`https://open.spotify.com/playlist/${playlistId}?utm_source=resona`, '_blank');
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
      console.error('Preview playback failed:', error);
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
}

export default new PlaybackService();
