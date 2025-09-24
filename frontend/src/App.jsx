import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import { PlayerProvider } from './context/PlayerContext';

function App() {
  return (
    <PlayerProvider>
      <div className="relative min-h-dvh bg-black text-white">
        {/* Decorative gradient blobs using Tailwind only */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-[40rem] w-[40rem] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-cyan-400 via-purple-600 to-cyan-400" />
          <div className="absolute -bottom-32 -right-16 h-[30rem] w-[30rem] rounded-full opacity-15 blur-3xl bg-gradient-to-tr from-fuchsia-500 via-cyan-400 to-indigo-500" />
        </div>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </Router>
      </div>
    </PlayerProvider>
  );
}

export default App;
