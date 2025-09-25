import React from 'react';

export function QueueItem({ track, onClick }) {
  return (
    <li onClick={onClick} className="flex items-center gap-3 p-3 rounded hover:bg-white/10 cursor-pointer">
      <img src={track.album?.images?.[2]?.url} alt="" className="w-10 h-10 rounded" />
      <div className="min-w-0">
        <div className="truncate">{track.name}</div>
        <div className="text-xs text-white/50 truncate">{track.artists?.map(a => a.name).join(', ')}</div>
      </div>
    </li>
  );
}

export default function PlayerQueue({ items = [], onSelect }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <div className="px-4 py-2 text-sm text-white/60">Up Next</div>
      <ul className="divide-y divide-white/10">
        {items.map(t => (
          <QueueItem key={t.id} track={t} onClick={() => onSelect?.(t)} />
        ))}
      </ul>
    </div>
  );
}


