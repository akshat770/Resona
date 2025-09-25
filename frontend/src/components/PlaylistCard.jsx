import React from 'react';

export default function PlaylistCard({ playlist, onClick }) {
  const image = playlist.images?.[0]?.url;
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
    >
      <div className="aspect-square bg-black/40">
        {image ? (
          <img src={image} alt={playlist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/30">No art</div>
        )}
      </div>
      <div className="p-4">
        <div className="font-semibold line-clamp-1">{playlist.name}</div>
        <div className="text-sm text-white/50 line-clamp-2">{playlist.description || 'Playlist'}</div>
      </div>
    </div>
  );
}


