import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { PlayerContext } from '../context/PlayerContext';
import Layout from '../components/Layout';
import PlaylistCard from '../components/PlaylistCard';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const { setCurrentTrack, deviceId } = useContext(PlayerContext);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    axios.get('https://api.spotify.com/v1/me', { headers })
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));

    axios.get('https://api.spotify.com/v1/me/playlists', { headers })
      .then(res => setPlaylists(res.data.items))
      .catch(err => console.error(err));
  }, []);

  const playTrack = (uri) => {
    if (!deviceId || !token) return;
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [uri] }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    setCurrentTrack({ uri });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Good to see you, {profile?.display_name}</h2>
          <div className="text-white/60">Here’s your music at a glance</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {playlists.map(p => (
            <PlaylistCard key={p.id} playlist={p} onClick={() => playTrack(p.uri)} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
