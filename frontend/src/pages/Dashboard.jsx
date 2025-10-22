import { useEffect, useState } from "react";
import api from "../api/axios";
import playbackService from "../services/playbackService";
import LikedSongsPopup from "../components/LikedSongsPopup";
import PlaylistPopup from "../components/PlaylistPopup";
import SearchBar from "../components/SearchBar";
import { useToast } from "../components/ToastProvider";
import AddToPlaylistPopup from "../components/AddToPlaylistPopup";
import AIPlaylistGenerator from "../components/AIPlaylistGenerator";

// ADDED: Body scroll lock utility
const useBodyScrollLock = () => {
  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
  };

  const unlockScroll = () => {
    document.body.style.overflow = 'unset';
  };

  return { lockScroll, unlockScroll };
};

export default function Dashboard({ playerReady, isPremium, setAccessToken, setIsPremium, setIsAuthenticated }) {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [showLikedSongsPopup, setShowLikedSongsPopup] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistPopup, setShowPlaylistPopup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddToPlaylistPopup, setShowAddToPlaylistPopup] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null);
  const [showAIPlaylistGenerator, setShowAIPlaylistGenerator] = useState(false);
  
  // Search functionality states
  const [showSearchUI, setShowSearchUI] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  
  // ADDED: State for tracking liked songs in search
  const [searchLikedSongs, setSearchLikedSongs] = useState(new Set());

  // Toast functionality
  const { showToast } = useToast();
  
  // ADDED: Body scroll lock
  const { lockScroll, unlockScroll } = useBodyScrollLock();

  // ADDED: Effect to manage body scroll when any popup is open
  useEffect(() => {
    const isAnyPopupOpen = showLikedSongsPopup || showPlaylistPopup || showAddToPlaylistPopup || showAIPlaylistGenerator || showSearchUI || isMobileMenuOpen;
    
    if (isAnyPopupOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    // Cleanup function to ensure scroll is unlocked when component unmounts
    return () => {
      unlockScroll();
    };
  }, [showLikedSongsPopup, showPlaylistPopup, showAddToPlaylistPopup, showAIPlaylistGenerator, showSearchUI, isMobileMenuOpen, lockScroll, unlockScroll]);

  const handleAddToPlaylist = (track) => {
    setSelectedTrackForPlaylist(track);
    setShowAddToPlaylistPopup(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) return window.location.href = "/";

      try {
        // Decode JWT to extract access token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const spotifyAccessToken = payload.accessToken;
        
        setAccessToken(spotifyAccessToken);
        setIsAuthenticated(true);
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
  }, [setAccessToken, setIsPremium, setIsAuthenticated]);

  // ADDED: Function to check liked status of multiple songs
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

  // ADDED: Check liked status when search results change
  useEffect(() => {
    if (searchResults?.tracks?.items?.length > 0) {
      const trackIds = searchResults.tracks.items.map(track => track.id);
      checkMultipleLikedStatus(trackIds);
    }
  }, [searchResults]);

  // UPDATED: Add to liked songs function with state tracking
  const addToLikedSongs = async (trackId, trackName) => {
    try {
      const token = localStorage.getItem("jwt");
      const isCurrentlyLiked = searchLikedSongs.has(trackId);
      
      if (isCurrentlyLiked) {
        // Remove from liked songs
        await api.delete("/spotify/liked-songs", {
          headers: { Authorization: `Bearer ${token}` },
          data: { trackIds: [trackId] }
        });
        
        // Update local state
        const newLikedSet = new Set(searchLikedSongs);
        newLikedSet.delete(trackId);
        setSearchLikedSongs(newLikedSet);
        
        showToast(`Removed "${trackName}" from Liked Songs`, "success");
      } else {
        // Add to liked songs
        await api.put("/spotify/liked-songs", 
          { trackIds: [trackId] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update local state
        const newLikedSet = new Set(searchLikedSongs);
        newLikedSet.add(trackId);
        setSearchLikedSongs(newLikedSet);
        
        showToast(`Added "${trackName}" to Liked Songs`, "heart");
      }
    } catch (error) {
      showToast("Failed to update Liked Songs", "error");
    }
  };

  // Add to playlist function
  const addToPlaylist = async (playlistId, trackUri, trackName, playlistName) => {
    try {
      const token = localStorage.getItem("jwt");
      await api.post(`/spotify/playlist/${playlistId}/tracks`,
        { tracks: [trackUri] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(`Added "${trackName}" to ${playlistName}`, "success");
    } catch (error) {
      showToast("Failed to add to playlist", "error");
    }
  };

  const playTrack = (track) => {
    if (!track) return;
    
    console.log('Playing track:', {
      name: track.name,
      uri: track.uri,
      preview_url: track.preview_url,
      isPremium
    });
    
    // Check if this is from recent tracks - provide context
    const recentIndex = recent.findIndex(r => r.track?.id === track.id);
    if (recentIndex !== -1) {
      const trackUris = recent.map(r => r.track.uri);
      playbackService.playTrack(track.uri, track.preview_url, trackUris, recentIndex);
    } else {
      // Single track
      playbackService.playTrack(track.uri, track.preview_url);
    }
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

  const openPlaylistPopup = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistPopup(true);
  };

  // UPDATED: Search overlay render function
  const renderSearchOverlay = () => (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center p-4 border-b border-gray-700">
        <SearchBar
          autoFocus
          onResults={(results) => setSearchResults(results)}
        />
        <button
          onClick={() => { 
            setShowSearchUI(false); 
            setSearchResults(null); 
            setSearchLikedSongs(new Set()); // ADDED: Clear liked songs state
          }}
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
                  {searchResults.tracks.items.filter(track => track && track.id).map(track => {
                    const isLiked = searchLikedSongs.has(track.id); // ADDED: Check liked status
                    
                    return (
                      <div key={track.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer">
                        <img src={track.album?.images?.[0]?.url || "/placeholder.png"} alt={track.name || "Track"} className="w-10 h-10 rounded" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{track.name || "Unknown Track"}</div>
                          <div className="text-gray-400 text-sm truncate">{track.artists?.map(a => a.name).join(", ") || "Unknown Artist"}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* UPDATED: Heart button with proper liked status */}
                          <button
                            title={isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                            className={`p-2 rounded-full transition-colors ${
                              isLiked 
                                ? 'text-green-400 hover:text-green-300' 
                                : 'text-gray-400 hover:text-green-400'
                            }`}
                            onClick={() => addToLikedSongs(track.id, track.name)}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </button>
                          <button
                            title="Add to Playlist"
                            className="p-2 rounded-full hover:bg-gray-400/30"
                            onClick={() => handleAddToPlaylist(track)}
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                          </button>
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
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {searchResults.artists?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Artists</h3>
                <div className="flex flex-wrap gap-4">
                  {searchResults.artists.items.filter(artist => artist && artist.id).map(artist => (
                    <div key={artist.id} className="flex flex-col items-center w-28 cursor-pointer">
                      <img src={artist.images?.[0]?.url || "/placeholder.png"} alt={artist.name || "Artist"} className="w-20 h-20 rounded-full mb-2" />
                      <div className="truncate text-sm text-white text-center">{artist.name || "Unknown Artist"}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {searchResults.albums?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Albums</h3>
                <div className="flex flex-wrap gap-4">
                  {searchResults.albums.items.filter(album => album && album.id).map(album => (
                    <div key={album.id} className="flex flex-col items-center w-28 cursor-pointer">
                      <img src={album.images?.[0]?.url || "/placeholder.png"} alt={album.name || "Album"} className="w-20 h-20 rounded mb-2" />
                      <div className="truncate text-xs text-white text-center">{album.name || "Unknown Album"}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {searchResults.playlists?.items?.length > 0 && (
              <section className="mb-8">
                <h3 className="text-lg font-bold text-green-400 mb-3">Playlists</h3>
                <div className="flex flex-wrap gap-4">
                  {searchResults.playlists.items.filter(playlist => playlist && playlist.id).map(playlist => (
                    <div key={playlist.id} className="flex flex-col items-center w-28 cursor-pointer">
                      <img src={playlist.images?.[0]?.url || "/placeholder.png"} alt={playlist.name || "Playlist"} className="w-20 h-20 rounded mb-2" />
                      <div className="truncate text-xs text-white text-center">{playlist.name || "Unknown Playlist"}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {searchResults && (!searchResults.tracks?.items?.length && !searchResults.artists?.items?.length && !searchResults.albums?.items?.length && !searchResults.playlists?.items?.length) && (
              <div className="text-gray-400 text-center mt-8">No results found</div>
            )}
          </>
        )}
      </div>
    </div>
  );

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

          {/* Search and Status */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={() => setShowSearchUI(true)}
              className="bg-gray-700 border border-gray-600 rounded-full px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-32 text-sm cursor-pointer"
            >
              Search...
            </button>
            <div className={`w-2 h-2 rounded-full ${
              isPremium 
                ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
                : 'bg-blue-400'
            }`}></div>
          </div>
        </div>

        {/* Keep all the rest of your existing content unchanged */}
        <div className="p-4 lg:p-8">
          {/* MOBILE-RESPONSIVE HEADER */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.display_name || user?.id || "User"}
              </h2>
              <p className="text-gray-400 text-sm lg:text-base">
                {isPremium ? "Let's play some music" : "Enjoy 30-second previews or upgrade to Premium"}
              </p>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Player Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isPremium 
                    ? (playerReady ? 'bg-green-400' : 'bg-yellow-400')
                    : 'bg-blue-400'
                }`}></div>
                <span className="text-xs lg:text-sm text-gray-400 hidden sm:block">
                  {isPremium 
                    ? (playerReady ? 'Premium Ready' : 'Connecting...')
                    : 'Preview Mode'
                  }
                </span>
              </div>
              
              <button
                onClick={() => setShowSearchUI(true)}
                className="bg-gray-800 border border-gray-700 rounded-full px-3 lg:px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-28 lg:w-64 text-sm cursor-pointer text-left"
              >
                Search...
              </button>
            </div>
          </div>

          {/* Premium Upgrade Banner */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 rounded-xl mb-6 lg:mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">Upgrade to Spotify Premium</h3>
                <p className="text-green-100 text-sm">Get unlimited skips, no ads, and full track playback</p>
              </div>
              <button 
                onClick={() => window.open('https://www.spotify.com/premium/', '_blank')}
                className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors self-start lg:self-auto"
              >
                Upgrade
              </button>
            </div>
          )}

          {/* MOBILE-RESPONSIVE QUICK ACTIONS */}
          <section className="mb-6 lg:mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <button 
                onClick={() => setShowLikedSongsPopup(true)}
                className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 lg:p-4 rounded-xl text-left hover:scale-105 active:scale-95 transition-transform"
              >
                <p className="font-semibold text-sm lg:text-base">Liked Songs</p>
                <p className="text-xs lg:text-sm opacity-80 mt-1">
                  {isPremium ? 'Your saved tracks' : 'Preview your saves'}
                </p>
              </button>
              <button className="bg-gradient-to-br from-green-600 to-teal-600 p-3 lg:p-4 rounded-xl text-left hover:scale-105 active:scale-95 transition-transform">
                <p className="font-semibold text-sm lg:text-base">Recently Played</p>
                <p className="text-xs lg:text-sm opacity-80 mt-1">Jump back in</p>
              </button>
              <button className="bg-gradient-to-br from-orange-600 to-red-600 p-3 lg:p-4 rounded-xl text-left hover:scale-105 active:scale-95 transition-transform">
                <p className="font-semibold text-sm lg:text-base">Discover</p>
                <p className="text-xs lg:text-sm opacity-80 mt-1">New releases</p>
              </button>
              <button 
                onClick={() => setShowAIPlaylistGenerator(true)}
                className="bg-gradient-to-br from-pink-600 to-purple-600 p-3 lg:p-4 rounded-xl text-left hover:scale-105 active:scale-95 transition-transform"
              >
                <p className="font-semibold text-sm lg:text-base">AI Playlist</p>
                <p className="text-xs lg:text-sm opacity-80 mt-1">Smart curation</p>
              </button>
            </div>
          </section>

          {/* MOBILE-RESPONSIVE RECENTLY PLAYED */}
          <section className="mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Recently Played</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {recent.slice(0, 6).map((r, index) => (
                <div
                  key={r.track?.id || index}
                  className="bg-gray-800 hover:bg-gray-700 active:bg-gray-750 p-3 lg:p-4 rounded-xl flex items-center gap-3 lg:gap-4 transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600"
                  onClick={() => playTrack(r.track)}
                >
                  <div className="relative">
                    <img
                      src={r.track?.album?.images?.[0]?.url || "/placeholder.png"}
                      alt={r.track?.name || "Unknown"}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition-all duration-200 flex items-center justify-center">
                      <div className="bg-green-500 text-black rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    {!isPremium && r.track?.preview_url && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                        30s
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="font-semibold text-sm lg:text-base truncate text-white">
                      {r.track?.name || "Unknown Track"}
                    </p>
                    <p className="text-gray-400 text-xs lg:text-sm truncate">
                      {r.track?.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
                    </p>
                    {!isPremium && !r.track?.preview_url && (
                      <p className="text-red-400 text-xs mt-1">No preview</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MOBILE-RESPONSIVE PLAYLISTS - REMOVED MANAGE BUTTON */}
          <section className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-semibold">Your Playlists</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-6">
              {playlists.map(pl => (
                <div
                  key={pl.id}
                  className="bg-gray-800 hover:bg-gray-750 active:bg-gray-700 p-3 lg:p-4 rounded-xl transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600"
                  onClick={() => openPlaylistPopup(pl)}
                >
                  <div className="relative mb-3 lg:mb-4">
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
                      className="absolute bottom-1 right-1 lg:bottom-2 lg:right-2 bg-green-500 hover:bg-green-400 text-black rounded-full w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg transform translate-y-2 group-hover:translate-y-0"
                    >
                      <svg className="w-4 h-4 lg:w-6 lg:h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    {!isPremium && (
                      <div className="absolute top-1 left-1 lg:top-2 lg:left-2 bg-blue-500 text-white text-xs px-1 lg:px-2 py-0.5 lg:py-1 rounded">
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

          {/* MOBILE-RESPONSIVE MADE FOR YOU */}
          <section className="mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Made for You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-4 lg:p-6 rounded-xl">
                <h4 className="font-bold mb-2 text-sm lg:text-base">Discover Weekly</h4>
                <p className="text-xs lg:text-sm opacity-80">Your weekly mixtape of fresh music</p>
              </div>
              <div className="bg-gradient-to-br from-green-900 to-green-700 p-4 lg:p-6 rounded-xl">
                <h4 className="font-bold mb-2 text-sm lg:text-base">Release Radar</h4>
                <p className="text-xs lg:text-sm opacity-80">Catch all the latest music</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900 to-purple-700 p-4 lg:p-6 rounded-xl">
                <h4 className="font-bold mb-2 text-sm lg:text-base">Daily Mix 1</h4>
                <p className="text-xs lg:text-sm opacity-80">Based on your recent listening</p>
              </div>
              <div className="bg-gradient-to-br from-red-900 to-red-700 p-4 lg:p-6 rounded-xl">
                <h4 className="font-bold mb-2 text-sm lg:text-base">On Repeat</h4>
                <p className="text-xs lg:text-sm opacity-80">Songs you can't stop playing</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* UPDATED: Popups */}
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

      {/* Search Overlay */}
      {showSearchUI && renderSearchOverlay()}

      {/* Add to Playlist Popup */}
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

      {/* AI Playlist Generator */}
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
