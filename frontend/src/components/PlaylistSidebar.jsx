import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

export function PlaylistListItem({ p }) {
  return (
    <NavLink to={`/playlists`} className={({ isActive }) => `block px-3 py-2 rounded text-sm truncate ${isActive ? 'bg-white/15' : 'hover:bg-white/10'}`}>
      {p.name}
    </NavLink>
  );
}

export default function PlaylistSidebar() {
  const [playlists, setPlaylists] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me/playlists?limit=20', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPlaylists(d.items || [])).catch(() => {});
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="px-2 pb-2 text-sm text-white/60">Playlists</div>
      <div className="space-y-1 max-h-80 overflow-auto pr-1">
        {playlists.map(p => <PlaylistListItem key={p.id} p={p} />)}
      </div>
    </div>
  );
}


