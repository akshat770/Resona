import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PlaylistCard from '../components/PlaylistCard';

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setPlaylists(data.items || []))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your Playlists</h2>
          <a
            href="https://open.spotify.com/collection/playlists"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500"
          >Manage on Spotify</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {playlists.map(p => (
            <PlaylistCard key={p.id} playlist={p} onClick={() => window.open(p.external_urls.spotify, '_blank')} />
          ))}
        </div>
      </div>
    </Layout>
  );
}


