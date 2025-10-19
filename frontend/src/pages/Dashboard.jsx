import { useEffect, useState } from "react";
import api from "../api/axios";
import playbackService from "../services/playbackService";
import PlaylistManager from "../components/PlaylistManager";
import LikedSongsPopup from "../components/LikedSongsPopup";
import PlaylistPopup from "../components/PlaylistPopup";
import SearchBar from "../components/SearchBar";

export default function Dashboard({ playerReady, isPremium, setAccessToken, setIsPremium, setIsAuthenticated }) {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [showLikedSongsPopup, setShowLikedSongsPopup] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistPopup, setShowPlaylistPopup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New: Search overlay states
  const [showSearchUI, setShowSearchUI] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) return window.location.href = "/";

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const spotifyAccessToken = payload.accessToken;
        
        setAccessToken(spotifyAccessToken);
        setIsAuthenticated(true);
        playbackService.setAccessToken(spotifyAccessToken);

        await api.get("/auth/verify", { headers: { Authorization: `Bearer ${token}` } });

        const profileRes = await api.get("/spotify/profile", { headers: { Authorization: `Bearer ${token}` } });
        setUser(profileRes.data);

        setIsPremium(profileRes.data.product === 'premium');

        const playlistsRes = await api.get("/spotify/user-playlists", { headers: { Authorization: `Bearer ${token}` } });
        setPlaylists(playlistsRes.data.items || []);

        const recentRes = await api.get("/spotify/recent-tracks", { headers: { Authorization: `Bearer ${token}` } });
        setRecent(recentRes.data.items || []);

      } catch (err) {
        console.error("Error fetching Spotify data:", err);
        localStorage.removeItem("jwt");
        window.location.href = "/";
      }
    };

    fetchData();
  }, [setAccessToken, setIsPremium, setIsAuthenticated]);

  const playTrack = (track) => {
    if (!track) return;
    
    const recentIndex = recent.findIndex(r => r.track?.id === track.id);
    if (recentIndex !== -1) {
      const trackUris = recent.map(r => r.track.uri);
      playbackService.playTrack(track.uri, track.preview_url, trackUris, recentIndex);
    } else {
      playbackService.playTrack(track.uri, track.preview_url);
    }
  };

  const playPlaylist = (playlist, trackIndex = 0) => {
    if (!playlist) return;
    
    let firstTrackPreview = null;
    if (playlist.tracks?.items?.[trackIndex]?.track?.preview_url) {
      firstTrackPreview = playlist.tracks.items[trackIndex].track.preview_url;
    }
    
    playbackService.playPlaylist(playlist.uri, trackIndex, firstTrackPreview);
  };

  const openPlaylistPopup = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistPopup(true);
  };

  // Define your overlay for search
  const renderSearchOverlay = () => (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center p-4 border-b border-gray-700">
        <SearchBar
          autoFocus
          onResults={(results) => setSearchResults(results)}
        />
        <button
          onClick={() => { setShowSearchUI(false); setSearchResults(null); }}
          className="ml-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
          aria-label="Close Search"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-4 text-white">
        {!searchResults && <div className="text-gray-500 text-xl text-center mt-12">Type to search Spotify...</div>}
        {searchResults && (
          <>
            {searchResults.tracks?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Tracks</h3>
                <div className="space-y-2">
                  {searchResults.tracks.items.map(track => (
                    <div key={track.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer">
                      <img src={track.album.images[0]?.url} alt={track.name} className="w-10 h-10 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{track.name}</div>
                        <div className="text-gray-400 text-sm truncate">{track.artists.map(a => a.name).join(", ")}</div>
                      </div>
                      <button
                        title="Play"
                        className="p-2 rounded-full hover:bg-green-400/30"
                        onClick={() => playTrack({ ...track, preview_url: track.preview_url })}
                      >
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {searchResults.artists?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Artists</h3>
                <div className="flex flex-wrap gap-4">
                  {searchResults.artists.items.map(artist => (
                    <div key={artist.id} className="flex flex-col items-center w-28 cursor-pointer">
                      <img src={artist.images?.[0]?.url || "/placeholder.png"} alt={artist.name} className="w-20 h-20 rounded-full mb-2" />
                      <div className="truncate text-sm text-white text-center">{artist.name}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {searchResults.albums?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Albums</h3>
                <div className="flex flex-wrap gap-4">
                  {searchResults.albums.items.map(album => (
                    <div key={album.id} className="flex flex-col items-center w-28 cursor-pointer">
                      <img src={album.images[0]?.url} alt={album.name} className="w-20 h-20 rounded mb-2" />
                      <div className="truncate text-xs text-white text-center">{album.name}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {searchResults.playlists?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Playlists</h3>
                <div className="flex flex-wrap gap-4">
                  {searchResults.playlists.items.map(playlist => (
                    <div key={playlist.id} className="flex flex-col items-center w-28 cursor-pointer">
                      <img src={playlist.images?.[0]?.url} alt={playlist.name} className="w-20 h-20 rounded mb-2" />
                      <div className="truncate text-xs text-white text-center">{playlist.name}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {Object.values(searchResults).every(section => section.items.length === 0) && (
              <div className="text-gray-400 text-center mt-8">No results found</div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-white pb-24 relative">
      {/* MOBILE-RESPONSIVE SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-700`}>
        <div className="flex items-center justify-between p-6 lg:justify-start">
          <h1 className="text-2xl font-bold text-green-400">Resona</h1>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <nav className="px-6 flex flex-col gap-4">
          <a 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-700 text-white font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </a>
          <a 
            href="#" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            Search
          </a>
          <button 
            onClick={() => {
              setShowLikedSongsPopup(true);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white text-left"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Liked Songs
          </button>
        </nav>
        
        {/* User Info */}
        <div className="mt-auto p-6 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {user?.images?.[0]?.url && (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-white">
                {user?.display_name || user?.id || "User"}
              </p>
              <p className="text-xs text-gray-400">
                {isPremium ? 'Premium User' : 'Free User (Preview Mode)'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-0">
        {/* UPDATED: Interactive Animated Hamburger Menu */}
        <div className="lg:hidden bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative w-10 h-10 text-white focus:outline-none"
          >
            <span className="sr-only">Open main menu</span>
            <div className="block w-6 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span
                aria-hidden="true"
                className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'
                }`}
              ></span>
              <span
                aria-hidden="true"
                className={`block absolute h-0.5 w-6 bg-current transform transition duration-200 ease-in-out ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              ></span>
              <span
                aria-hidden="true"
                className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                  isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'
                }`}
              ></span>
            </div>
          </button>
          <button
            onClick={() => setShowSearchUI(true)}
            className="flex-1 mx-4 cursor-pointer bg-gray-700 border border-gray-600 rounded-full px-3 py-2 text-gray-400 text-left"
            style={{ minWidth: 0 }}
            title="Search"
          >
            <span className="truncate">Search Spotify...</span>
          </button>
          <div className={`w-2 h-2 rounded-full ${
            isPremium 
              ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
              : 'bg-blue-400'
          }`}></div>
        </div>

        <div className="p-4 lg:p-8">
          {/* Keep your existing main content */}
          {/* MOBILE-RESPONSIVE HEADER, QUICK ACTIONS, PLAYLISTS, ETC */}
        </div>
      </main>

      {/* Popups */}
      <LikedSongsPopup
        isOpen={showLikedSongsPopup}
        onClose={() => setShowLikedSongsPopup(false)}
        playerReady={playerReady}
        isPremium={isPremium}
        playlists={playlists}
      />
      
      <PlaylistPopup
        isOpen={showPlaylistPopup}
        onClose={() => {
          setShowPlaylistPopup(false);
          setSelectedPlaylist(null);
        }}
        playlist={selectedPlaylist}
        playerReady={playerReady}
        isPremium={isPremium}
      />

      {/* SEARCH OVERLAY */}
      {showSearchUI && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
          <div className="flex items-center p-4 border-b border-gray-700">
            <SearchBar
              autoFocus
              onResults={(results) => setSearchResults(results)}
            />
            <button
              onClick={() => { setShowSearchUI(false); setSearchResults(null); }}
              className="ml-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
              aria-label="Close Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4 text-white">
            {!searchResults && <div className="text-gray-500 text-xl text-center mt-12">Type to search Spotify...</div>}
            {searchResults && (
              <>
                {/* Tracks Section */}
                {searchResults.tracks?.items?.length > 0 && (
                  <section className="mb-8">
                    <h3 className="text-lg font-bold text-green-400 mb-3">Tracks</h3>
                    <div className="space-y-2">
                      {searchResults.tracks.items.map(track => (
                        <div key={track.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer">
                          <img src={track.album.images[0]?.url} alt={track.name} className="w-10 h-10 rounded" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{track.name}</div>
                            <div className="text-gray-400 text-sm truncate">{track.artists.map(a => a.name).join(", ")}</div>
                          </div>
                          <button
                            title="Play"
                            className="p-2 rounded-full hover:bg-green-400/30"
                            onClick={() => playTrack({ ...track, preview_url: track.preview_url })}
                          >
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Artists Section */}
                {searchResults.artists?.items?.length > 0 && (
                  <section className="mb-8">
                    <h3 className="text-lg font-bold text-green-400 mb-3">Artists</h3>
                    <div className="flex flex-wrap gap-4">
                      {searchResults.artists.items.map(artist => (
                        <div key={artist.id} className="flex flex-col items-center w-28 cursor-pointer">
                          <img src={artist.images?.[0]?.url || "/placeholder.png"} alt={artist.name} className="w-20 h-20 rounded-full mb-2" />
                          <div className="truncate text-sm text-white text-center">{artist.name}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Albums Section */}
                {searchResults.albums?.items?.length > 0 && (
                  <section className="mb-8">
                    <h3 className="text-lg font-bold text-green-400 mb-3">Albums</h3>
                    <div className="flex flex-wrap gap-4">
                      {searchResults.albums.items.map(album => (
                        <div key={album.id} className="flex flex-col items-center w-28 cursor-pointer">
                          <img src={album.images[0]?.url} alt={album.name} className="w-20 h-20 rounded mb-2" />
                          <div className="truncate text-xs text-white text-center">{album.name}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Playlists Section */}
                {searchResults.playlists?.items?.length > 0 && (
                  <section className="mb-8">
                    <h3 className="text-lg font-bold text-green-400 mb-3">Playlists</h3>
                    <div className="flex flex-wrap gap-4">
                      {searchResults.playlists.items.map(playlist => (
                        <div key={playlist.id} className="flex flex-col items-center w-28 cursor-pointer">
                          <img src={playlist.images?.[0]?.url} alt={playlist.name} className="w-20 h-20 rounded mb-2" />
                          <div className="truncate text-xs text-white text-center">{playlist.name}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {Object.values(searchResults).every(section => section.items.length === 0) && (
                  <div className="text-gray-400 text-center mt-8">No results found</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
