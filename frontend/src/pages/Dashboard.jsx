import { useEffect, useState, useRef } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [playlists, setPlaylists] = useState([]);
  const [liked, setLiked] = useState([]);
  const cursorRef = useRef(null);
  const ringRef = useRef(null);

  // ----------------------------
  // Fetch Data
  // ----------------------------
  const loadData = async () => {
    try {
      const playlistsRes = await api.get("/spotify/playlists");
      setPlaylists(playlistsRes.data || []);

      const likedRes = await api.get("/spotify/liked");
      setLiked(likedRes.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) window.location.href = "/";
    }
  };

  useEffect(() => { loadData(); }, []);

  // ----------------------------
  // Logout
  // ----------------------------
  const logout = () => {
    localStorage.removeItem("jwt");
    window.location.href = "/";
  };

  // ----------------------------
  // Custom Cursor Logic
  // ----------------------------
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let rx = x, ry = y;
    let rafId;

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      cursor.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0)`;
    };

    const tick = () => {
      rx += (x - rx) * 0.15;
      ry += (y - ry) * 0.15;
      ring.style.transform = `translate3d(${rx - 20}px, ${ry - 20}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    const down = () => { ring.style.transform += ' scale(0.8)'; ring.style.borderColor = 'rgba(0,255,200,0.9)'; };
    const up = () => { ring.style.transform = ring.style.transform.replace(' scale(0.8)',''); ring.style.borderColor = 'rgba(255,255,255,0.3)'; };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", down, { passive: true });
    window.addEventListener("mouseup", up, { passive: true });

    rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener("mousemove", onMove); window.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); };
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white">

      {/* ------------------ */}
      {/* Live Background */}
      {/* ------------------ */}
      <div className="absolute inset-0">
        {/* animated gradient lines */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-cyan-900 to-blue-800 opacity-50 animate-pulse-slow"></div>
        {/* floating neon particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-cyan-400 rounded-full absolute" style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `particleMove ${5 + Math.random() * 5}s ease-in-out infinite alternate`,
              opacity: Math.random() * 0.7 + 0.3
            }} />
          ))}
        </div>
      </div>

      {/* ------------------ */}
      {/* Custom Cursor */}
      {/* ------------------ */}
      <div ref={ringRef} className="pointer-events-none fixed top-0 left-0 w-10 h-10 rounded-full border border-white/30 mix-blend-screen shadow-lg" />
      <div ref={cursorRef} className="pointer-events-none fixed top-0 left-0 w-3 h-3 rounded-full bg-cyan-400 mix-blend-screen shadow-lg" />

      {/* ------------------ */}
      {/* Dashboard Content */}
      {/* ------------------ */}
      <div className="relative z-10 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">Dashboard</h1>
          <button onClick={logout} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-semibold">Logout</button>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">Your Playlists</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-gray-900/50 hover:bg-gray-800 p-4 rounded-xl shadow-xl transition-colors border border-cyan-700/40">
                {pl.images?.[0]?.url ? (
                  <img src={pl.images[0].url} alt="" className="w-full aspect-square object-cover rounded-lg mb-3" />
                ) : (
                  <div className="w-full aspect-square rounded-lg bg-gray-800 mb-3" />
                )}
                <p className="font-bold truncate">{pl.name}</p>
                <p className="text-sm text-white/60">{pl.tracks?.total ?? 0} tracks</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">Liked Songs</h2>
          <div className="bg-gray-900/50 rounded-xl divide-y divide-cyan-700/30 p-4">
            {liked.slice(0, 10).map((it) => (
              <div key={it.track?.id} className="flex items-center gap-3 p-2 hover:bg-gray-800/50 transition rounded">
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

      {/* ------------------ */}
      {/* Background Animations */}
      {/* ------------------ */}
      <style>{`
        @keyframes particleMove {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        .animate-pulse-slow {
          animation: pulse 8s infinite alternate;
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
