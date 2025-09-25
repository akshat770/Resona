import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

export default function Liked() {
  const [tracks, setTracks] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setTracks(data.items || []))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Liked Songs</h2>
        <ul className="divide-y divide-white/10 rounded-xl overflow-hidden border border-white/10">
          {tracks.map(({ track }) => (
            <li key={track.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10">
              <div className="flex items-center gap-4">
                <img src={track.album.images?.[2]?.url} alt="" className="w-10 h-10 rounded" />
                <div>
                  <div className="font-medium">{track.name}</div>
                  <div className="text-sm text-white/50">{track.artists.map(a => a.name).join(', ')}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}


