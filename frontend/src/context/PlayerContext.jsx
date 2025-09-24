import React, { createContext, useState, useRef } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = (song) => {
    if (currentSong?.fileUrl !== song.fileUrl) {
      audioRef.current.src = song.fileUrl;
      setCurrentSong(song);
    }
    audioRef.current.play();
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  audioRef.current.onended = () => setIsPlaying(false);

  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, playSong, pause }}>
      {children}
    </PlayerContext.Provider>
  );
};
