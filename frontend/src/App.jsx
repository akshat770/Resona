import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import Home from './pages/Home';
import AppHome from './pages/AppHome';
import Dashboard from './pages/Dashboard';
import WebPlayer from './components/WebPlayer';

export default function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app" element={<AppHome />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <WebPlayer />
    </PlayerProvider>
  );
}
