import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [playlists, setPlaylists] = useState([]);
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const connectSpotify = () => {
    window.location.href = `${backendURL}/spotify/login`;
  };

  const loadPlaylists = () => {
    axios.get(`${backendURL}/spotify/playlists`, { withCredentials: true })
      .then(res => setPlaylists(res.data))
      .catch(err => console.error(err));
  };

  const logout = () => {
    window.location.href = `${backendURL}/auth/logout`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      <button
        onClick={connectSpotify}
        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg mb-4"
      >
        Connect Spotify
      </button>

      <button
        onClick={loadPlaylists}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mb-4 ml-2"
      >
        Load Playlists
      </button>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg mb-4 ml-2"
      >
        Logout
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {playlists.map((pl) => (
          <div key={pl.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="font-bold">{pl.name}</p>
            <p className="text-sm">{pl.tracks.total} tracks</p>
          </div>
        ))}
      </div>

      <Link to="/liked" className="block mt-6 text-green-400 hover:underline">
        View Liked Songs →
      </Link>
    </div>
  );
}
