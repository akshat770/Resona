import { createContext, useState } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  return (
    <PlayerContext.Provider value={{ currentTrack, setCurrentTrack, deviceId, setDeviceId }}>
      {children}
    </PlayerContext.Provider>
  );
};
