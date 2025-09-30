// frontend/src/services/playbackService.js
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

  async transferPlaybackToWebPlayer() {
    if (!this.deviceId || !this.accessToken) return false;

    try {
      console.log('Transferring playback to web player...');
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          device_ids: [this.deviceId],
          play: true // IMPORTANT: Keep playing when transferring
        })
      });

      if (response.ok || response.status === 204) {
        console.log('Successfully transferred to web player');
        return true;
      }
    } catch (error) {
      console.log('Transfer failed:', error);
    }
    return false;
  }

  async playTrack(trackUri, previewUrl = null) {
    console.log('PlayTrack called:', { trackUri, previewUrl, isPremium: this.isPremium });
    
    // Premium users: Use Web Playback API
    if (this.isPremium && this.deviceId && this.accessToken) {
      try {
        // First transfer any existing playback to web player
        await this.transferPlaybackToWebPlayer();
        
        // Wait a moment for the transfer
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now start the new track
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
          console.log('Premium: Track started on web player');
          return;
        } else {
          const errorText = await response.text();
          console.error('Playback failed:', response.status, errorText);
        }
      } catch (error) {
        console.log('Premium playback failed, falling back to preview');
      }
    }

    // Fallback for non-Premium or failed Premium
    if (previewUrl) {
      console.log('Playing preview:', previewUrl);
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available');
      alert('No preview available for this track. Please upgrade to Spotify Premium for full playback.');
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    // Premium users: Use Web Playback API
    if (this.isPremium && this.deviceId && this.accessToken) {
      try {
        // Transfer playback first
        await this.transferPlaybackToWebPlayer();
        
        // Wait for transfer
        await new Promise(resolve => setTimeout(resolve, 1000));

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
          console.log('Premium: Playlist started on web player');
          return;
        }
      } catch (error) {
        console.log('Premium playlist playback failed');
      }
    }

    // Fallback for non-Premium
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      alert('No preview available for this playlist. Please upgrade to Spotify Premium.');
    }
  }

  // Preview methods remain the same...
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
