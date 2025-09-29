class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
    this.currentTrack = null;
    this.isReady = false;
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId;
    this.isReady = true;
    console.log('Device ID set:', deviceId);
  }

  setAccessToken(token) {
    this.accessToken = token;
    console.log('Access token set');
  }

  async waitForPlayer() {
    // Wait for player to be ready
    let attempts = 0;
    while (!this.isReady && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return this.isReady;
  }

  async transferPlaybackToWebPlayer() {
    if (!this.deviceId || !this.accessToken) return false;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          device_ids: [this.deviceId],
          play: false
        })
      });

      if (response.ok || response.status === 204) {
        console.log('Playback transferred to web player');
        return true;
      }
    } catch (error) {
      console.log('Playback transfer not needed or failed (this is often normal)');
    }
    return false;
  }

  async playTrack(trackUri) {
    if (!await this.waitForPlayer()) {
      console.error('Player not ready after waiting');
      return;
    }

    try {
      console.log('Playing track:', trackUri);
      
      // First, transfer playback to our web player (optional)
      await this.transferPlaybackToWebPlayer();
      
      // Wait a moment for the transfer
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        console.log('Track started playing');
        this.currentTrack = trackUri;
      } else {
        const errorText = await response.text();
        console.error('Playback failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0) {
    if (!await this.waitForPlayer()) {
      console.error('Player not ready after waiting');
      return;
    }

    try {
      console.log('Playing playlist:', playlistUri, 'starting at track:', trackOffset);
      
      // Transfer playback to our web player
      await this.transferPlaybackToWebPlayer();
      
      // Wait a moment for the transfer
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
        console.log('Playlist started playing');
      } else {
        const errorText = await response.text();
        console.error('Playlist playback failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Playlist playback error:', error);
    }
  }

  async getCurrentPlaybackState() {
    if (!this.accessToken) return null;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting playback state:', error);
    }
    return null;
  }
}

export default new PlaybackService();
