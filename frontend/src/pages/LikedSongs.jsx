import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function LikedSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const response = await api.get("/spotify/liked-songs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSongs(response.data.items || []);
      } catch (err) {
        console.error("Error fetching liked songs:", err);
        setError("Failed to load liked songs");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Liked Songs</h1>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {songs.length === 0 ? (
          <p className="text-gray-400">No liked songs found.</p>
        ) : (
          songs.map((item, index) => (
            <div key={item.track?.id || index} className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <p className="font-semibold">
                {item.track?.name || "Unknown"} - {item.track?.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
              </p>
            </div>
          ))
        )}
      </div>

      <Link to="/dashboard" className="block mt-6 text-green-400 hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
