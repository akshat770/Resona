import { useEffect, useState } from "react";
import api from "../api/axios";
import playbackService from "../services/playbackService";
import LikedSongsPopup from "../components/LikedSongsPopup";
import PlaylistPopup from "../components/PlaylistPopup";
import SearchBar from "../components/SearchBar";
import { useToast } from "../components/ToastProvider";
import AddToPlaylistPopup from "../components/AddToPlaylistPopup";
import AIPlaylistGenerator from "../components/AIPlaylistGenerator";

// Body scroll lock utility
const useBodyScrollLock = () => {
  const lockScroll = () => document.body.style.overflow = 'hidden';
  const unlockScroll = () => document.body.style.overflow = 'unset';
  return { lockScroll, unlockScroll };
};

export default function Dashboard({ playerReady, isPremium, setAccessToken, setIsPremium, setIsAuthenticated }) {
  // ==================== STATE MANAGEMENT ====================
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);
  
  // UI States
  const [showLikedSongsPopup, setShowLikedSongsPopup] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistPopup, setShowPlaylistPopup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddToPlaylistPopup, setShowAddToPlaylistPopup] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null);
  const [showAIPlaylistGenerator, setShowAIPlaylistGenerator] = useState(false);
  
  // Search States
  const [showSearchUI, setShowSearchUI] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLikedSongs, setSearchLikedSongs] = useState(new Set());

  // Hooks
  const { showToast } = useToast();
  const { lockScroll, unlockScroll } = useBodyScrollLock();

  // ==================== EFFECTS ====================
  // Body scroll lock when popups are open
  useEffect(() => {
    const isAnyPopupOpen = showLikedSongsPopup || showPlaylistPopup || showAddToPlaylistPopup || 
                           showAIPlaylistGenerator || showSearchUI || isMobileMenuOpen;
    
    if (isAnyPopupOpen) lockScroll();
    else unlockScroll();

    return () => unlockScroll();
  }, [showLikedSongsPopup, showPlaylistPopup, showAddToPlaylistPopup, showAIPlaylistGenerator, showSearchUI, isMobileMenuOpen, lockScroll, unlockScroll]);

  // Initial data fetch
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

        // Verify session
        await api.get("/auth/verify", { headers: { Authorization: `Bearer ${token}` } });

        // Fetch user profile
        const profileRes = await api.get("/spotify/profile", { headers: { Authorization: `Bearer ${token}` } });
        setUser(profileRes.data);
        setIsPremium(profileRes.data.product === 'premium');

        // Fetch playlists and recent tracks
        const [playlistsRes, recentRes] = await Promise.all([
          api.get("/spotify/user-playlists", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/spotify/recent-tracks", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setPlaylists(playlistsRes.data.items || []);
        setRecent(recentRes.data.items || []);

      } catch (err) {
        console.error("Error fetching Spotify data:", err);
        localStorage.removeItem("jwt");
        window.location.href = "/";
      }
    };

    fetchData();
  }, [setAccessToken, setIsPremium, setIsAuthenticated]);

  // Check liked status when search results change
  useEffect(() => {
    if (searchResults?.tracks?.items?.length > 0) {
      const trackIds = searchResults.tracks.items.map(track => track.id);
      checkMultipleLikedStatus(trackIds);
    }
  }, [searchResults]);

  // ==================== HANDLERS ====================
  const handleAddToPlaylist = (track) => {
    setSelectedTrackForPlaylist(track);
    setShowAddToPlaylistPopup(true);
  };

  const checkMultipleLikedStatus = async (trackIds) => {
    try {
      const token = localStorage.getItem("jwt");
      const promises = trackIds.map(async (trackId) => {
        const response = await api.get(`/spotify/check-liked/${trackId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { trackId, isLiked: response.data[0] };
      });
      
      const results = await Promise.all(promises);
      const likedSet = new Set();
      results.forEach(({ trackId, isLiked }) => {
        if (isLiked) likedSet.add(trackId);
      });
      
      setSearchLikedSongs(likedSet);
    } catch (error) {
      console.error('Error checking liked status:', error);
    }
  };

  const addToLikedSongs = async (trackId, trackName) => {
    try {
      const token = localStorage.getItem("jwt");
      const isCurrentlyLiked = searchLikedSongs.has(trackId);
      
      if (isCurrentlyLiked) {
        await api.delete("/spotify/liked-songs", {
          headers: { Authorization: `Bearer ${token}` },
          data: { trackIds: [trackId] }
        });
        
        const newLikedSet = new Set(searchLikedSongs);
        newLikedSet.delete(trackId);
        setSearchLikedSongs(newLikedSet);
        
        showToast(`Removed "${trackName}" from Liked Songs`, "success");
      } else {
        await api.put("/spotify/liked-songs", 
          { trackIds: [trackId] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const newLikedSet = new Set(searchLikedSongs);
        newLikedSet.add(trackId);
        setSearchLikedSongs(newLikedSet);
        
        showToast(`Added "${trackName}" to Liked Songs`, "heart");
      }
    } catch (error) {
      showToast("Failed to update Liked Songs", "error");
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderSearchOverlay = () => (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center p-4 border-b border-gray-700 bg-gray-800/50">
        <SearchBar
          autoFocus
          onResults={(results) => setSearchResults(results)}
        />
        <button
          onClick={() => { 
            setShowSearchUI(false); 
            setSearchResults(null); 
            setSearchLikedSongs(new Set());
          }}
          className="ml-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Close Search"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 p-4 text-white">
        {!searchResults && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-2 border-gray-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-xl">Type to search Spotify...</p>
            <p className="text-gray-600 text-sm mt-2">Find songs, artists, albums, and playlists</p>
          </div>
        )}
        
        {searchResults && (
          <div className="max-w-6xl mx-auto space-y-8">
            {searchResults.tracks?.items?.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  Songs
                </h3>
                <div className="grid gap-2">
                  {searchResults.tracks.items.filter(track => track && track.id).map(track => {
                    const isLiked = searchLikedSongs.has(track.id);
                    
                    return (
                      <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition-colors group">
                        <img src={track.album?.images?.[0]?.url || "/placeholder.png"} alt={track.name || "Track"} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{track.name || "Unknown Track"}</h4>
                          <p className="text-gray-400 text-sm truncate">{track.artists?.map(a => a.name).join(", ") || "Unknown Artist"}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title={isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                            className={`p-2 rounded-full transition-colors ${
                              isLiked 
                                ? 'text-green-400 hover:text-green-300' 
                                : 'text-gray-400 hover:text-green-400'
                            }`}
                            onClick={() => addToLikedSongs(track.id, track.name)}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </button>
                          <button
                            title="Add to Playlist"
                            className="p-2 rounded-full hover:bg-gray-400/30 text-gray-400 hover:text-white transition-colors"
                            onClick={() => handleAddToPlaylist(track)}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                          </button>
                          <button
                            title="Play"
                            className="p-2 rounded-full hover:bg-green-400/30 text-green-400 hover:text-green-300 transition-colors"
                            onClick={() => playTrack({ ...track, preview_url: track.preview_url })}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
            {/* Artists, Albums, Playlists sections with improved layout */}
            {searchResults.artists?.items?.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13.5C14.8 13.8 14.4 14 14 14H10C9.6 14 9.2 13.8 9 13.5L3 7V9L9 15.5C9.2 15.8 9.6 16 10 16H14C14.4 16 14.8 15.8 15 15.5L21 9Z"/>
                  </svg>
                  Artists
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.artists.items.filter(artist => artist && artist.id).map(artist => (
                    <div key={artist.id} className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group">
                      <img src={artist.images?.[0]?.url || "/placeholder.png"} alt={artist.name || "Artist"} className="w-20 h-20 rounded-full mb-3 object-cover" />
                      <h4 className="text-white font-medium text-center truncate w-full text-sm">{artist.name || "Unknown Artist"}</h4>
                      <p className="text-gray-400 text-xs">Artist</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Similar improvements for Albums and Playlists */}
            {searchResults.albums?.items?.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-green-400 mb-6">Albums</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.albums.items.filter(album => album && album.id).map(album => (
                    <div key={album.id} className="flex flex-col p-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                      <img src={album.images?.[0]?.url || "/placeholder.png"} alt={album.name || "Album"} className="w-full aspect-square rounded-lg mb-3 object-cover" />
                      <h4 className="text-white font-medium truncate text-sm">{album.name || "Unknown Album"}</h4>
                      <p className="text-gray-400 text-xs truncate">{album.artists?.[0]?.name || "Unknown Artist"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {searchResults.playlists?.items?.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-green-400 mb-6">Playlists</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.playlists.items.filter(playlist => playlist && playlist.id).map(playlist => (
                    <div key={playlist.id} className="flex flex-col p-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                      <img src={playlist.images?.[0]?.url || "/placeholder.png"} alt={playlist.name || "Playlist"} className="w-full aspect-square rounded-lg mb-3 object-cover" />
                      <h4 className="text-white font-medium truncate text-sm">{playlist.name || "Unknown Playlist"}</h4>
                      <p className="text-gray-400 text-xs">By {playlist.owner?.display_name || "Unknown"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {searchResults && (!searchResults.tracks?.items?.length && !searchResults.artists?.items?.length && !searchResults.albums?.items?.length && !searchResults.playlists?.items?.length) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
                <h3 className="text-white text-xl mb-2">No results found</h3>
                <p className="text-gray-400">Try searching for something else</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ==================== LOADING STATE ====================
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2">Loading your music...</h2>
          <p className="text-gray-400">Setting up your personalized experience</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="flex min-h-screen bg-gray-900 text-white pb-24 relative">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-700`}>
        <div className="flex items-center justify-between p-6 lg:justify-start">
          <h1 className="text-2xl font-bold text-green-400">Resona</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <nav className="px-6 flex flex-col gap-2">
          <a 
            href="/dashboard" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white font-medium transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home    
          </a>
          <button 
            onClick={() => {
              setShowLikedSongsPopup(true);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white text-left"
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
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
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
        {/* MOBILE HEADER */}
        <div className="lg:hidden bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative w-10 h-10 text-white focus:outline-none"
          >
            <span className="sr-only">Open main menu</span>
            <div className="block w-6 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}></span>
              <span className={`block absolute h-0.5 w-6 bg-current transform transition duration-200 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}></span>
            </div>
          </button>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={() => setShowSearchUI(true)}
              className="bg-gray-700 border border-gray-600 rounded-full px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-32 text-sm cursor-pointer"
            >
              Search...
            </button>
            <div className={`w-2 h-2 rounded-full ${isPremium ? (playerReady ? 'bg-green-400' : 'bg-yellow-400') : 'bg-blue-400'}`}></div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 lg:mb-12 gap-6">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                Good {getGreeting()}, {user?.display_name || user?.id || "User"}!
              </h2>
              <p className="text-gray-400 text-lg">
                {isPremium ? "Let's play some music" : "Enjoy 30-second previews or upgrade to Premium"}
              </p>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isPremium ? (playerReady ? 'bg-green-400' : 'bg-yellow-400') : 'bg-blue-400'}`}></div>
                <span className="text-sm text-gray-400 hidden sm:block">
                  {isPremium ? (playerReady ? 'Premium Ready' : 'Connecting...') : 'Preview Mode'}
                </span>
              </div>
              
              <button
                onClick={() => setShowSearchUI(true)}
                className="bg-gray-800 border border-gray-700 rounded-full px-4 lg:px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-32 lg:w-80 text-sm cursor-pointer text-left hover:bg-gray-750 transition-colors"
              >
                Search...
              </button>
            </div>
          </div>

          {/* PREMIUM BANNER */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 rounded-2xl mb-8 lg:mb-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-xl mb-2">Upgrade to Spotify Premium</h3>
                <p className="text-green-100">Get unlimited skips, no ads, and full track playback</p>
              </div>
              <button 
                onClick={() => window.open('https://www.spotify.com/premium/', '_blank')}
                className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors self-start lg:self-auto shadow-lg"
              >
                Upgrade Now
              </button>
            </div>
          )}

          {/* QUICK ACTIONS */}
          <section className="mb-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { 
                  title: "Liked Songs", 
                  subtitle: isPremium ? 'Your saved tracks' : 'Preview your saves',
                  gradient: "from-purple-600 to-blue-600",
                  onClick: () => setShowLikedSongsPopup(true)
                },
                { 
                  title: "Recently Played", 
                  subtitle: "Jump back in",
                  gradient: "from-green-600 to-teal-600",
                  onClick: () => {}
                },
                { 
                  title: "Discover", 
                  subtitle: "New releases",
                  gradient: "from-orange-600 to-red-600",
                  onClick: () => {}
                },
                { 
                  title: "AI Playlist", 
                  subtitle: "Smart curation",
                  gradient: "from-pink-600 to-purple-600",
                  onClick: () => setShowAIPlaylistGenerator(true)
                }
              ].map((action, index) => (
                <button 
                  key={index}
                  onClick={action.onClick}
                  className={`bg-gradient-to-br ${action.gradient} p-4 lg:p-6 rounded-2xl text-left hover:scale-105 active:scale-95 transition-transform shadow-lg`}
                >
                  <p className="font-semibold text-base lg:text-lg">{action.title}</p>
                  <p className="text-sm lg:text-base opacity-90 mt-2">{action.subtitle}</p>
                </button>
              ))}
            </div>
          </section>

          {/* RECENTLY PLAYED */}
          <section className="mb-12">
            <h3 className="text-2xl lg:text-3xl font-semibold mb-6 lg:mb-8">Recently Played</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {recent.slice(0, 6).map((r, index) => (
                <div
                  key={r.track?.id || index}
                  className="bg-gray-800 hover:bg-gray-700 active:bg-gray-750 p-4 lg:p-5 rounded-2xl flex items-center gap-4 lg:gap-5 transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600 shadow-lg"
                  onClick={() => playTrack(r.track)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={r.track?.album?.images?.[0]?.url || "/placeholder.png"}
                      alt={r.track?.name || "Unknown"}
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-all duration-200 flex items-center justify-center">
                      <div className="bg-green-500 text-black rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    {!isPremium && r.track?.preview_url && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        30s
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="font-semibold text-base lg:text-lg truncate text-white mb-1">
                      {r.track?.name || "Unknown Track"}
                    </p>
                    <p className="text-gray-400 text-sm lg:text-base truncate">
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

          {/* YOUR PLAYLISTS */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <h3 className="text-2xl lg:text-3xl font-semibold">Your Playlists</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
              {playlists.map(pl => (
                <div
                  key={pl.id}
                  className="bg-gray-800 hover:bg-gray-750 active:bg-gray-700 p-4 lg:p-5 rounded-2xl transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600 shadow-lg"
                  onClick={() => openPlaylistPopup(pl)}
                >
                  <div className="relative mb-4 lg:mb-5">
                    <img
                      src={pl.images?.[0]?.url || "/placeholder.png"}
                      alt={pl.name}
                      className="rounded-xl w-full aspect-square object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPlaylist(pl);
                      }}
                      className="absolute bottom-2 right-2 lg:bottom-3 lg:right-3 bg-green-500 hover:bg-green-400 text-black rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg transform translate-y-2 group-hover:translate-y-0"
                    >
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    {!isPremium && (
                      <div className="absolute top-2 left-2 lg:top-3 lg:left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Preview
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold truncate text-white mb-1 text-sm lg:text-base">{pl.name}</p>
                    <p className="text-gray-400 text-xs lg:text-sm">
                      {pl.tracks?.total || 0} songs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MADE FOR YOU */}
          <section className="mb-12">
            <h3 className="text-2xl lg:text-3xl font-semibold mb-6 lg:mb-8">Made for You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { title: "Discover Weekly", subtitle: "Your weekly mixtape of fresh music", gradient: "from-blue-900 to-blue-700" },
                { title: "Release Radar", subtitle: "Catch all the latest music", gradient: "from-green-900 to-green-700" },
                { title: "Daily Mix 1", subtitle: "Based on your recent listening", gradient: "from-purple-900 to-purple-700" },
                { title: "On Repeat", subtitle: "Songs you can't stop playing", gradient: "from-red-900 to-red-700" }
              ].map((item, index) => (
                <div key={index} className={`bg-gradient-to-br ${item.gradient} p-6 lg:p-8 rounded-2xl shadow-lg`}>
                  <h4 className="font-bold mb-3 text-base lg:text-lg">{item.title}</h4>
                  <p className="text-sm lg:text-base opacity-90">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* POPUPS */}
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
        playlists={playlists}
        setPlaylists={setPlaylists}
      />

      {showSearchUI && renderSearchOverlay()}

      <AddToPlaylistPopup
        isOpen={showAddToPlaylistPopup}
        onClose={() => {
          setShowAddToPlaylistPopup(false);
          setSelectedTrackForPlaylist(null);
        }}
        track={selectedTrackForPlaylist}
        playlists={playlists}
        setPlaylists={setPlaylists}
      />

      <AIPlaylistGenerator
        isOpen={showAIPlaylistGenerator}
        onClose={() => setShowAIPlaylistGenerator(false)}
        onPlaylistGenerated={(newPlaylist) => {
          setPlaylists(prev => [newPlaylist, ...prev]);
          showToast(`Created "${newPlaylist.name}"!`, 'success');
        }}
      />
    </div>
  );
}
