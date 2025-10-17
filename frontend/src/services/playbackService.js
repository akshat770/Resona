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
    console.log('Playing track directly in web app');
    
    // ALWAYS try to get preview first (this was working before)
    if (!previewUrl) {
      const trackId = trackUri.split(':').pop();
      previewUrl = await this.fetchPreview(trackId);
    }

    // Play preview in web app (this is what was working)
    if (previewUrl) {
      this.playPreview(previewUrl);
      console.log('Track playing in web app');
    } else {
      console.log('No preview available');
    }
  }

  async fetchPreview(trackId) {
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
      console.error('Failed to fetch preview:', error);
    }
    return null;
  }

  async playPlaylist(playlistUri, trackOffset = 0, firstTrackPreview = null) {
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
      console.log('Audio playing in web app successfully');
    }).catch(error => {
      console.error('Audio failed:', error);
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
