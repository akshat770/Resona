import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fixed: Use consistent token key 'jwt'
      const token = localStorage.getItem("jwt");
      if (!token) return window.location.href = "/";

      try {
        // Verify session
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fixed: Use correct endpoints
        const profileRes = await api.get("/spotify/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);

        const playlistsRes = await api.get("/spotify/user-playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaylists(playlistsRes.data.items || []);

        const recentRes = await api.get("/spotify/recent-tracks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecent(recentRes.data.items || []);
        if (recentRes.data.items && recentRes.data.items.length) {
          setCurrentTrack(recentRes.data.items[0].track);
        }
      } catch (err) {
        console.error("Error fetching Spotify data:", err);
        localStorage.removeItem("jwt");
        window.location.href = "/";
      }
    };

    fetchData();
  }, []);

  const playTrack = (track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(prev => !prev);

  const nextTrack = () => {
    if (!currentTrack || !recent.length) return;
    const idx = recent.findIndex(r => r.track.id === currentTrack.id);
    const nextIdx = (idx + 1) % recent.length;
    setCurrentTrack(recent[nextIdx].track);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (!currentTrack || !recent.length) return;
    const idx = recent.findIndex(r => r.track.id === currentTrack.id);
    const prevIdx = (idx - 1 + recent.length) % recent.length;
    setCurrentTrack(recent[prevIdx].track);
    setIsPlaying(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Resona</h1>
        <nav className="flex flex-col gap-4">
          <a href="/dashboard" className="hover:text-green-400 transition-colors">Home</a>
          <a href="#" className="hover:text-green-400 transition-colors">Search</a>
          <a href="/liked" className="hover:text-green-400 transition-colors">Liked Songs</a>
          <a href="#" className="hover:text-green-400 transition-colors">Playlists</a>
        </nav>
        <div className="mt-auto text-gray-400 text-sm">
          Logged in as {user.display_name || user.id || "User"}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Welcome, {user.display_name || user.id || "User"}</h2>
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-700 rounded-full px-4 py-2 text-white focus:outline-none"
          />
        </div>

        {/* Playlists */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Playlists</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map(pl => (
              <div
                key={pl.id}
                className="bg-gray-800 p-4 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                onClick={() => {
                  // Fixed: Handle undefined tracks
                  const firstTrack = pl.tracks?.items?.[0]?.track;
                  if (firstTrack) playTrack(firstTrack);
                }}
              >
                <img
                  src={pl.images?.[0]?.url || "/placeholder.png"}
                  alt={pl.name}
                  className="rounded-lg mb-4 w-full h-32 object-cover"
                />
                <p className="font-semibold truncate">{pl.name}</p>
                <p className="text-gray-400 text-sm mt-1">{pl.tracks?.total || 0} tracks</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Played */}
        <section>
          <h3 className="text-xl font-semibold mb-4">Recently Played</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((r, index) => (
              <div
                key={r.track?.id || index}
                className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => playTrack(r.track)}
              >
                <img
                  src={r.track?.album?.images?.[0]?.url || "/placeholder.png"}
                  alt={r.track?.name || "Unknown"}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="font-semibold text-sm truncate">{r.track?.name || "Unknown Track"}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {r.track?.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Now Playing */}
      {currentTrack && (
        <footer className="fixed bottom-0 left-64 right-0 bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={currentTrack.album?.images?.[0]?.url || "/placeholder.png"}
              alt={currentTrack.name}
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <p className="font-semibold">{currentTrack.name}</p>
              <p className="text-gray-400 text-sm">
                {currentTrack.artists?.map(a => a.name).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={prevTrack} className="text-2xl hover:text-green-400">⏮</button>
            <button onClick={togglePlay} className="text-2xl hover:text-green-400">
              {isPlaying ? "⏸" : "▶️"}
            </button>
            <button onClick={nextTrack} className="text-2xl hover:text-green-400">⏭</button>
          </div>
        </footer>
      )}
    </div>
  );
}
