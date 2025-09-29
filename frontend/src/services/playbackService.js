// frontend/src/services/playbackService.js
import api from '../api/axios';

class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async playTrack(trackUri) {
    if (!this.deviceId || !this.accessToken) {
      console.error('Device or token not ready');
      return;
    }

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

      if (!response.ok) {
        console.error('Playback failed:', response.status);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  }

  async playPlaylist(playlistUri, trackOffset = 0) {
    if (!this.deviceId || !this.accessToken) return;

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

      if (!response.ok) {
        console.error('Playlist playback failed:', response.status);
      }
    } catch (error) {
      console.error('Playlist playback error:', error);
    }
  }
}

export default new PlaybackService();
