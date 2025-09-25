import React, { useMemo } from 'react';
import { useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';

export default function PlayerControls() {
  const { currentTrack, deviceId } = useContext(PlayerContext);
  const token = useMemo(() => localStorage.getItem('token'), []);

  const call = (method, path, body) => {
    if (!token || !deviceId) return;
    fetch(`https://api.spotify.com/v1/me/player/${path}?device_id=${deviceId}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined
    }).catch(() => {});
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/70 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {currentTrack ? (
            <>
              <div className="w-12 h-12 bg-white/5 rounded" />
              <div className="truncate">
                <div className="truncate">{currentTrack.name || 'Playing'}</div>
                <div className="text-xs text-white/50 truncate">{currentTrack.artist || ''}</div>
              </div>
            </>
          ) : (
            <div className="text-white/50">Nothing playing</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => call('POST', 'previous')}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Prev</button>
          <button onClick={() => call('PUT', 'play', currentTrack ? { uris: [currentTrack.uri] } : undefined)}
            className="px-3 py-2 rounded bg-green-600 hover:bg-green-500">Play</button>
          <button onClick={() => call('PUT', 'pause')}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Pause</button>
          <button onClick={() => call('POST', 'next')}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Next</button>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => call('PUT', 'shuffle?state=true')}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Shuffle</button>
          <button onClick={() => call('PUT', 'repeat?state=context')}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Repeat</button>
        </div>
      </div>
    </div>
  );
}


