class PlaybackService {
  constructor() {
    this.deviceId = null;
    this.accessToken = null;
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

  async playTrack(trackUri) {
    if (!this.deviceId || !this.accessToken) {
      console.error('Device or token not ready');
      return;
    }

    try {
      console.log('Playing track:', trackUri);
      
      // Skip the transfer step, just play directly
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
        // If 404, try without device_id parameter
        if (response.status === 404) {
          console.log('Retrying without device_id...');
          const retryResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({
              uris: [trackUri],
              device_id: this.deviceId
            })
          });
          
          if (retryResponse.ok || retryResponse.status === 204) {
            console.log('Track started playing (retry successful)');
          } else {
            const errorText = await retryResponse.text();
            console.error('Retry failed:', retryResponse.status, errorText);
          }
        } else {
          const errorText = await response.text();
          console.error('Playback failed:', response.status, errorText);
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
      } else if (response.status === 404) {
        // Retry without device_id in URL
        console.log('Retrying playlist without device_id...');
        const retryResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: JSON.stringify({
            context_uri: playlistUri,
            offset: { position: trackOffset },
            device_id: this.deviceId
          })
        });
        
        if (retryResponse.ok || retryResponse.status === 204) {
          console.log('Playlist started playing (retry successful)');
        }
      } else {
        const errorText = await response.text();
        console.error('Playlist playback failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Playlist playback error:', error);
    }
  }
}

export default new PlaybackService();
