// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import SpotifyPlayer from "../components/SpotifyPlayer";
import playbackService from "../services/playbackService";
import PreviewPlayer from "../components/PreviewPlayer";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) return window.location.href = "/";

      try {
        // Decode JWT to extract access token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const spotifyAccessToken = payload.accessToken;
        
        setAccessToken(spotifyAccessToken);
        playbackService.setAccessToken(spotifyAccessToken);

        // Verify session
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch user profile
        const profileRes = await api.get("/spotify/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);

        // Check if user has Premium
        setIsPremium(profileRes.data.product === 'premium');

        // Fetch playlists
        const playlistsRes = await api.get("/spotify/user-playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaylists(playlistsRes.data.items || []);

        // Fetch recent tracks
        const recentRes = await api.get("/spotify/recent-tracks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecent(recentRes.data.items || []);

      } catch (err) {
        console.error("Error fetching Spotify data:", err);
        localStorage.removeItem("jwt");
        window.location.href = "/";
      }
    };

    fetchData();
  }, []);

  const handlePlayerReady = (deviceId) => {
    console.log('Player ready with device ID:', deviceId);
    playbackService.setDeviceId(deviceId);
    setPlayerReady(true);
    setIsPremium(true); // If web player works, user has Premium
  };

  const playTrack = (track) => {
  if (!track) return;
  
  console.log('Playing track:', {
    name: track.name,
    uri: track.uri,
    preview_url: track.preview_url,
    isPremium
  });
  
  playbackService.playTrack(track.uri, track.preview_url);
};

const playPlaylist = (playlist, trackIndex = 0) => {
  if (!playlist) return;
  
  // Get first track's preview URL
  let firstTrackPreview = null;
  if (playlist.tracks?.items?.[trackIndex]?.track?.preview_url) {
    firstTrackPreview = playlist.tracks.items[trackIndex].track.preview_url;
  }
  
  console.log('Playing playlist:', {
    name: playlist.name,
    uri: playlist.uri,
    preview_url: firstTrackPreview,
    isPremium
  });
  
  playbackService.playPlaylist(playlist.uri, trackIndex, firstTrackPreview);
};

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white pb-24">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col border-r border-gray-700">
        <h1 className="text-2xl font-bold mb-8 text-green-400">Resona</h1>
        <nav className="flex flex-col gap-4">
          <a 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-700 text-white font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </a>
          <a 
            href="#" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            Search
          </a>
          <a 
            href="/liked" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Liked Songs
          </a>
        </nav>
        
        {/* User Info */}
        <div className="mt-auto pt-6 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {user.images?.[0]?.url && (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-white">
                {user.display_name || user.id || "User"}
              </p>
              <p className="text-xs text-gray-400">
                {isPremium ? 'Premium User' : 'Free User (Preview Mode)'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.display_name || user.id || "User"}
            </h2>
            <p className="text-gray-400">
              {isPremium ? "Let's play some music" : "Enjoy 30-second previews or upgrade to Premium"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Player Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isPremium 
                  ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
                  : 'bg-blue-400'
              }`}></div>
              <span className="text-sm text-gray-400">
                {isPremium 
                  ? (playerReady ? 'Premium Player Ready' : 'Connecting...')
                  : 'Preview Mode'
                }
              </span>
            </div>
            
            <input
              type="text"
              placeholder="Search songs, artists..."
              className="bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Premium Upgrade Banner for Free Users */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 rounded-xl mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Upgrade to Spotify Premium</h3>
              <p className="text-green-100 text-sm">Get unlimited skips, no ads, and full track playback</p>
            </div>
            <button 
              onClick={() => window.open('https://www.spotify.com/premium/', '_blank')}
              className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Rest of your existing sections remain the same */}
        {/* Quick Actions */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-xl text-left hover:scale-105 transition-transform">
              <p className="font-semibold">Liked Songs</p>
              <p className="text-sm opacity-80 mt-1">
                {isPremium ? 'Your saved tracks' : 'Preview your saves'}
              </p>
            </button>
            <button className="bg-gradient-to-br from-green-600 to-teal-600 p-4 rounded-xl text-left hover:scale-105 transition-transform">
              <p className="font-semibold">Recently Played</p>
              <p className="text-sm opacity-80 mt-1">Jump back in</p>
            </button>
            <button className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-xl text-left hover:scale-105 transition-transform">
              <p className="font-semibold">Discover</p>
              <p className="text-sm opacity-80 mt-1">New releases</p>
            </button>
            <button className="bg-gradient-to-br from-pink-600 to-purple-600 p-4 rounded-xl text-left hover:scale-105 transition-transform">
              <p className="font-semibold">AI Playlist</p>
              <p className="text-sm opacity-80 mt-1">Smart curation</p>
            </button>
          </div>
        </section>

        {/* Recently Played */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Recently Played</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.slice(0, 6).map((r, index) => (
              <div
                key={r.track?.id || index}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex items-center gap-4 transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600"
                onClick={() => playTrack(r.track)}
              >
                <div className="relative">
                  <img
                    src={r.track?.album?.images?.[0]?.url || "/placeholder.png"}
                    alt={r.track?.name || "Unknown"}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-200 flex items-center justify-center">
                    <div className="bg-green-500 text-black rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg">
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  {/* Preview indicator for non-premium */}
                  {!isPremium && r.track?.preview_url && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                      30s
                    </div>
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-semibold text-sm truncate text-white">
                    {r.track?.name || "Unknown Track"}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {r.track?.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
                  </p>
                  {!isPremium && !r.track?.preview_url && (
                    <p className="text-red-400 text-xs mt-1">No preview available</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Playlists with preview indicators */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Your Playlists</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {playlists.map(pl => (
              <div
                key={pl.id}
                className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600"
              >
                <div className="relative mb-4">
                  <img
                    src={pl.images?.[0]?.url || "/placeholder.png"}
                    alt={pl.name}
                    className="rounded-lg w-full aspect-square object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playPlaylist(pl);
                    }}
                    className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-400 text-black rounded-full w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg transform translate-y-2 group-hover:translate-y-0"
                  >
                    <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  {/* Preview mode indicator */}
                  {!isPremium && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Preview
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold truncate text-white mb-1">{pl.name}</p>
                  <p className="text-gray-400 text-sm">
                    {pl.tracks?.total || 0} songs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Made for You section remains the same */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Made for You</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-6 rounded-xl">
              <h4 className="font-bold mb-2">Discover Weekly</h4>
              <p className="text-sm opacity-80">Your weekly mixtape of fresh music</p>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-green-700 p-6 rounded-xl">
              <h4 className="font-bold mb-2">Release Radar</h4>
              <p className="text-sm opacity-80">Catch all the latest music</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-purple-700 p-6 rounded-xl">
              <h4 className="font-bold mb-2">Daily Mix 1</h4>
              <p className="text-sm opacity-80">Based on your recent listening</p>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-red-700 p-6 rounded-xl">
              <h4 className="font-bold mb-2">On Repeat</h4>
              <p className="text-sm opacity-80">Songs you can't stop playing</p>
            </div>
          </div>
        </section>
      </main>
      
      {accessToken && (
        isPremium ? (
          <SpotifyPlayer
            accessToken={accessToken}
            onPlayerReady={handlePlayerReady}
          />
        ) : (
          <PreviewPlayer />
        )
      )}
    </div>
  );
}
