import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../api/axios';
import { PlayerContext } from '../context/PlayerContext';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const { setCurrentTrack, deviceId } = useContext(PlayerContext);

  const token = localStorage.getItem('token');

  useEffect(() => {
    // fetch profile
    axiosInstance.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));

    // fetch playlists
    axiosInstance.get('/api/playlists', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPlaylists(res.data.items))
      .catch(err => console.error(err));
  }, []);

  const playTrack = (uri) => {
    if (!deviceId) return;
    axiosInstance.put('/api/player/play', { device_id: deviceId, uris: [uri] }, { headers: { Authorization: `Bearer ${token}` } });
    setCurrentTrack({ uri });
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6">Welcome, {profile?.display_name}</h2>
      <h3 className="text-xl mb-4">Your Playlists</h3>
      <ul className="grid grid-cols-3 gap-4">
        {playlists.map(p => (
          <li key={p.id} className="bg-gray-800 p-4 rounded hover:bg-gray-700 cursor-pointer"
              onClick={() => playTrack(p.uri)}>
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
