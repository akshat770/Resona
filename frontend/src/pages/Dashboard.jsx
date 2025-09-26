import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [playerDeviceId, setPlayerDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Resona Player",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setPlayerDeviceId(device_id);
      });

      player.addListener("player_state_changed", state => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      player.connect();
      setSpotifyPlayer(player);
    };
  }, []);

  // Fetch user info, playlists, and recent tracks
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        // Verify session
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch Spotify profile
        const profileRes = await api.get("/spotify/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);

        // Fetch playlists
        const playlistsRes = await api.get("/spotify/playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaylists(playlistsRes.data.items);

        // Fetch recently played
        const recentRes = await api.get("/spotify/recently-played", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecent(recentRes.data.items);

        // Set first track as current
        if (recentRes.data.items.length > 0) {
          setCurrentTrack(recentRes.data.items[0].track);
        }
      } catch (err) {
        console.error("Error fetching Spotify data:", err);
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };

    fetchData();
  }, []);

  // Play selected track
  const playTrack = async (trackUri) => {
    if (!playerDeviceId) return;
    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${playerDeviceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const togglePlay = () => {
    if (!spotifyPlayer) return;
    spotifyPlayer.togglePlay();
    setIsPlaying(!isPlaying);
  };

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
          <a href="#" className="hover:text-green-400 transition-colors">
            Home
          </a>
          <a href="#" className="hover:text-green-400 transition-colors">
            Search
          </a>
          <a href="#" className="hover:text-green-400 transition-colors">
            Library
          </a>
          <a href="#" className="hover:text-green-400 transition-colors">
            Playlists
          </a>
        </nav>
        <div className="mt-auto text-gray-400 text-sm">
          Logged in as {user.display_name || "User"}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">
            Welcome, {user.display_name || "User"}
          </h2>
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
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="bg-gray-800 p-4 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                onClick={() => playTrack(pl.tracks.items?.[0]?.track?.uri)} // play first track
              >
                <img
                  src={pl.images[0]?.url || "/placeholder.png"}
                  alt={pl.name}
                  className="rounded-lg mb-4 w-full h-32 object-cover"
                />
                <p className="font-semibold truncate">{pl.name}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {pl.tracks.total} tracks
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Played */}
        <section>
          <h3 className="text-xl font-semibold mb-4">Recently Played</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((r) => (
              <div
                key={r.track.id}
                className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => playTrack(r.track.uri)}
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
      </main>

      {/* Now Playing Bar */}
      {currentTrack && (
        <footer className="fixed bottom-0 left-64 right-0 bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={currentTrack.album.images[0]?.url || "/placeholder.png"}
              alt={currentTrack.name}
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <p className="font-semibold">{currentTrack.name}</p>
              <p className="text-gray-400 text-sm">
                {currentTrack.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => spotifyPlayer?.previousTrack()}>⏮</button>
            <button onClick={togglePlay}>{isPlaying ? "⏸" : "▶️"}</button>
            <button onClick={() => spotifyPlayer?.nextTrack()}>⏭</button>
          </div>
        </footer>
      )}
    </div>
  );
}
