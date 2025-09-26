import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (token) {
        localStorage.setItem("token", token);
        window.history.replaceState({}, document.title, "/dashboard");
      }

      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        window.location.href = "/";
        return;
      }

      try {
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        // Fetch Spotify profile or set placeholder
        setUser({ name: "Resona User" });
      } catch {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };
    verify();
  }, []);

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        Loading...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Resona</h1>
        <nav className="flex flex-col gap-4">
          <a href="#" className="hover:text-green-400 transition-colors">Home</a>
          <a href="#" className="hover:text-green-400 transition-colors">Search</a>
          <a href="#" className="hover:text-green-400 transition-colors">Library</a>
          <a href="#" className="hover:text-green-400 transition-colors">Playlists</a>
        </nav>
        <div className="mt-auto text-gray-400 text-sm">Logged in as {user.name}</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Welcome, {user.name}</h2>
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-700 rounded-full px-4 py-2 text-white focus:outline-none"
          />
        </div>

        {/* Featured playlists */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Featured</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 p-4 rounded-xl hover:scale-105 transition-transform"
              >
                <div className="bg-green-600 h-32 w-full rounded-lg mb-4"></div>
                <p className="font-semibold">Playlist {i + 1}</p>
                <p className="text-gray-400 text-sm">Description here</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recently played */}
        <section>
          <h3 className="text-xl font-semibold mb-4">Recently Played</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 hover:scale-105 transition-transform"
              >
                <div className="bg-green-500 h-16 w-16 rounded-lg"></div>
                <div>
                  <p className="font-semibold">Song {i + 1}</p>
                  <p className="text-gray-400 text-sm">Artist Name</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Now Playing Bar */}
      <footer className="fixed bottom-0 left-64 right-0 bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-green-500 w-12 h-12 rounded-lg"></div>
          <div>
            <p className="font-semibold">Current Song</p>
            <p className="text-gray-400 text-sm">Artist Name</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button>⏮</button>
          <button>▶️</button>
          <button>⏭</button>
        </div>
      </footer>
    </div>
  );
}
