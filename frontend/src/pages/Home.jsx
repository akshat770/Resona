import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { PlayerContext } from '../context/PlayerContext.jsx';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const { currentSong, playSong } = useContext(PlayerContext);

  useEffect(() => {
    axios.get('http://localhost:5000/api/songs', { withCredentials: true })
      .then(res => setSongs(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-gray-900 shadow-md">
        <h1 className="text-3xl font-bold tracking-wider text-green-400">MERN Spotify Clone</h1>
        <a href="http://localhost:5000/auth/google">
          <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full font-semibold transition duration-300">
            Login with Google
          </button>
        </a>
      </header>

      {/* Songs List */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 tracking-wide">Trending Tracks</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map((s, idx) => (
            <li
              key={s._id}
              className="bg-gray-800 hover:bg-gray-700 transition duration-300 rounded-xl p-4 flex flex-col justify-between shadow-lg"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold truncate">{s.title}</h3>
                <p className="text-gray-400 truncate">{s.artist}</p>
              </div>
              <button
                onClick={() => playSong({ ...s, fileUrl: `http://localhost:5000/api/songs/stream/${s.fileId}` })}
                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-full transition duration-300"
              >
                Play
              </button>
            </li>
          ))}
        </ul>
      </main>

      {/* Audio Player */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 shadow-lg p-2">
        <AudioPlayer
          autoPlay={false}
          src={currentSong?.fileUrl || ''}
          showJumpControls={false}
          showFilledVolume={true}
          customAdditionalControls={[]}
          layout="horizontal-reverse"
        />
      </footer>
    </div>
  );
}
