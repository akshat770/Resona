import { useEffect, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';

export default function WebPlayer() {
  const { currentTrack, deviceId, setDeviceId } = useContext(PlayerContext);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem('token');
      const player = new window.Spotify.Player({
        name: 'Spotify Clone Player',
        getOAuthToken: cb => cb(token),
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }) => setDeviceId(device_id));
      player.connect();
    };
  }, []);

  useEffect(() => {
    if (!currentTrack || !deviceId) return;
    const token = localStorage.getItem('token');
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [currentTrack.uri] }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
  }, [currentTrack, deviceId]);

  return null;
}
