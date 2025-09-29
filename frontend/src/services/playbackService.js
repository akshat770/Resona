// frontend/src/services/playbackService.js
class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
    this.isReady = false;
    this.deviceActivated = false;
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

  async activateDevice() {
    if (!this.deviceId || !this.accessToken || this.deviceActivated) return true;

    try {
      console.log('Activating device...');
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
        console.log('Device activated successfully');
        this.deviceActivated = true;
        return true;
      }
    } catch (error) {
      console.log('Device activation failed, but continuing...');
    }
    return false;
  }

  async playTrack(trackUri) {
    if (!this.deviceId || !this.accessToken) {
      console.error('Device or token not ready');
      return;
    }

    try {
      // First activate the device
      await this.activateDevice();
      
      // Small delay to ensure activation
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Playing track:', trackUri);
      
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
      } else {
        const errorText = await response.text();
        console.error('Playback failed:', response.status, errorText);
        
        // Show user-friendly error
        if (response.status === 404) {
          alert('No active device found. Please:\n1. Open Spotify app on your phone/computer\n2. Play any song\n3. Try again');
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0) {
    if (!this.deviceId || !this.accessToken) {
      console.error('Device or token not ready');
      return;
    }

    try {
      // First activate the device
      await this.activateDevice();
      
      // Small delay to ensure activation
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Playing playlist:', playlistUri);
      
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
        
        // Show user-friendly error
        if (response.status === 404) {
          alert('No active device found. Please:\n1. Open Spotify app on your phone/computer\n2. Play any song\n3. Try again');
        }
      }
    } catch (error) {
      console.error('Playlist playback error:', error);
    }
  }
}

export default new PlaybackService();
