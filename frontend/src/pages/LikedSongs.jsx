import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function LikedSongs() {
  const [songs, setSongs] = useState([]);
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  useEffect(() => {
    axios.get(`${backendURL}/spotify/liked`, { withCredentials: true })
      .then(res => setSongs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Liked Songs</h1>

      <div className="space-y-4">
        {songs.map((item, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="font-semibold">
              {item.track.name} - {item.track.artists.map(a => a.name).join(", ")}
            </p>
          </div>
        ))}
      </div>

      <Link to="/dashboard" className="block mt-6 text-green-400 hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
