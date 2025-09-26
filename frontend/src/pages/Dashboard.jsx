import { useEffect, useState } from "react";
import api from "../api/axios"; // Your backend axios instance

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileRes = await api.get("/spotify/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);

        const playlistsRes = await api.get("/spotify/playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaylists(playlistsRes.data.items);

        const recentRes = await api.get("/spotify/recently-played", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecent(recentRes.data.items);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };

    fetchData();
  }, []);

  if (!user) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 lg:p-12">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Good Evening, {user.display_name || "User"}
        </h1>
        {user.images?.[0]?.url && (
          <img
            src={user.images[0].url}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-green-500"
          />
        )}
      </header>

      {/* Playlists */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Your Playlists</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <img
                src={pl.images[0]?.url || "/placeholder.png"}
                alt={pl.name}
                className="rounded-lg mb-3 w-full h-48 object-cover"
              />
              <p className="font-semibold text-lg truncate">{pl.name}</p>
              <p className="text-gray-400 text-sm mt-1">{pl.tracks.total} tracks</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Played */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Recently Played</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recent.map((r) => (
            <div
              key={r.track.id}
              className="bg-gray-800 p-3 rounded-xl flex items-center gap-4 shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <img
                src={r.track.album.images[0]?.url || "/placeholder.png"}
                alt={r.track.name}
                className="w-16 h-16 rounded object-cover flex-shrink-0"
              />
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{r.track.name}</p>
                <p className="text-gray-400 text-xs truncate">
                  {r.track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
