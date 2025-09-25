import React from 'react';
import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
    isActive ? 'bg-green-600 text-white' : 'hover:bg-gray-800 text-gray-300'
  }`;

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 bg-black/60 backdrop-blur border-r border-white/10 p-4 hidden md:block">
      <div className="text-2xl font-bold mb-6">Resona</div>
      <nav className="space-y-2">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/liked" className={linkClass}>Liked Songs</NavLink>
        <NavLink to="/playlists" className={linkClass}>Playlists</NavLink>
      </nav>
    </aside>
  );
}


