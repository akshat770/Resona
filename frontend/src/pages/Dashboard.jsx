import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [playlists, setPlaylists] = useState([]);
  const [liked, setLiked] = useState([]);
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  const connectSpotify = () => {
    window.location.href = `${backendURL}/spotify/login`;
  };

  const loadData = () => {
    axios.get(`${backendURL}/spotify/playlists`, { withCredentials: true })
      .then(res => setPlaylists(res.data?.items || res.data || []))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401) window.location.href = "/";
      });
    axios.get(`${backendURL}/spotify/liked`, { withCredentials: true })
      .then(res => setLiked(res.data?.items || []))
      .catch(err => console.error(err));
  };

  useEffect(() => { loadData(); }, []);

  const logout = () => {
    axios.get(`${backendURL}/auth/logout`, { withCredentials: true })
      .then(() => window.location.href = "/")
      .catch(err => console.error(err));
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
        onClick={loadData}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mb-4 ml-2"
      >
        Refresh
      </button>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg mb-4 ml-2"
      >
        Logout
      </button>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Your Playlists</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <div key={pl.id} className="bg-gray-800/80 hover:bg-gray-800 p-4 rounded-xl shadow-lg transition-colors">
              {pl.images?.[0]?.url ? (
                <img src={pl.images[0].url} alt="" className="w-full aspect-square object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-gray-700 mb-3" />
              )}
              <p className="font-bold truncate">{pl.name}</p>
              <p className="text-sm text-white/60">{pl.tracks?.total ?? 0} tracks</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Liked Songs</h2>
        <div className="bg-gray-800/80 rounded-xl divide-y divide-white/10">
          {liked.slice(0, 10).map((it) => (
            <div key={it.track?.id} className="flex items-center gap-3 p-3">
              <img src={it.track?.album?.images?.[2]?.url} alt="" className="w-12 h-12 rounded" />
              <div className="min-w-0">
                <div className="truncate">{it.track?.name}</div>
                <div className="text-sm text-white/60 truncate">{(it.track?.artists||[]).map(a=>a.name).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
