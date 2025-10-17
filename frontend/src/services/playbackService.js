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

  // FIXED: Added missing getCurrentPreview method
  getCurrentPreview() {
    return {
      url: this.currentPreviewUrl,
      isPlaying: this.isPreviewPlaying(),
      currentTime: this.audioElement?.currentTime || 0
    };
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
          play: false // IMPROVED: Don't auto-play during transfer
        })
      });

      if (response.ok || response.status === 204) {
        console.log('Successfully transferred to web player');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Transfer failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
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
        await new Promise(resolve => setTimeout(resolve, 500));

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
          // Stop any preview playback when premium starts
          this.stopPreview();
          return;
        } else {
          const errorText = await response.text();
          console.error('Premium playback failed:', response.status, errorText);
        }
      } catch (error) {
        console.error('Premium playback failed, falling back to preview:', error);
      }
    }

    // Fallback for non-Premium or failed Premium
    if (previewUrl) {
      console.log('Playing preview:', previewUrl);
      this.playPreview(previewUrl);
    } else {
      console.log('No preview available');
      this.showNoPreviewMessage();
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
    console.log('PlayPlaylist called:', { playlistUri, trackOffset, isPremium: this.isPremium });
    
    // Premium users: Use Web Playback API
    if (this.isPremium && this.deviceId && this.accessToken) {
      try {
        // Transfer playback first
        await this.transferPlaybackToWebPlayer();
        
        // Wait for transfer
        await new Promise(resolve => setTimeout(resolve, 500));

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
          // Stop any preview playback when premium starts
          this.stopPreview();
          return;
        } else {
          const errorText = await response.text();
          console.error('Premium playlist playback failed:', response.status, errorText);
        }
      } catch (error) {
        console.error('Premium playlist playback failed:', error);
      }
    }

    // Fallback for non-Premium
    if (firstTrackPreview) {
      this.playPreview(firstTrackPreview);
    } else {
      this.showNoPreviewMessage();
    }
  }

  // IMPROVED: Better preview playback with error handling
  playPreview(previewUrl) {
    if (!previewUrl) {
      console.warn('No preview URL provided');
      return;
    }
    
    // Stop any existing preview
    this.stopPreview();
    
    // Set up new preview
    this.audioElement.src = previewUrl;
    this.audioElement.volume = 0.7;
    this.currentPreviewUrl = previewUrl;
    this.isPreviewMode = true;

    // Attempt to play with better error handling
    this.audioElement.play().then(() => {
      console.log('Preview playing successfully');
    }).catch(error => {
      console.error('Preview playback failed:', error);
      
      // Reset state on failure
      this.currentPreviewUrl = null;
      this.isPreviewMode = false;
      
      // Handle different error types
      if (error.name === 'NotAllowedError') {
        console.warn('Autoplay blocked by browser. User interaction required.');
        this.showAutoplayBlockedMessage();
      } else if (error.name === 'NotSupportedError') {
        console.error('Audio format not supported');
        this.showUnsupportedAudioMessage();
      } else {
        console.error('Unknown playback error:', error);
        this.showGenericPlaybackError();
      }
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
    if (!this.audioElement || !this.currentPreviewUrl) {
      console.warn('No preview to toggle');
      return;
    }
    
    if (this.audioElement.paused) {
      this.audioElement.play().catch(error => {
        console.error('Failed to resume preview:', error);
      });
    } else {
      this.audioElement.pause();
    }
  }

  isPreviewPlaying() {
    return this.audioElement && !this.audioElement.paused && this.currentPreviewUrl;
  }

  // IMPROVED: Better user messaging
  showNoPreviewMessage() {
    alert('No preview available for this track. Please upgrade to Spotify Premium for full playback.');
  }

  showAutoplayBlockedMessage() {
    alert('Audio playback was blocked by your browser. Please click the play button to start the preview.');
  }

  showUnsupportedAudioMessage() {
    alert('This audio format is not supported by your browser. Please try a different track.');
  }

  showGenericPlaybackError() {
    alert('Unable to play preview. Please check your internet connection and try again.');
  }

  // IMPROVED: Get playback state for debugging
  getPlaybackState() {
    return {
      isPremium: this.isPremium,
      hasDeviceId: !!this.deviceId,
      hasAccessToken: !!this.accessToken,
      isPreviewMode: this.isPreviewMode,
      currentPreviewUrl: this.currentPreviewUrl,
      isPreviewPlaying: this.isPreviewPlaying(),
      audioElementSrc: this.audioElement?.src || null,
      audioElementCurrentTime: this.audioElement?.currentTime || 0
    };
  }
}

export default new PlaybackService();