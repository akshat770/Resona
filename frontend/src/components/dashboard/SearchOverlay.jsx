import SearchBar from "../SearchBar";

export default function SearchOverlay({
  setShowSearchUI,
  setSearchResults,
  setSearchLikedSongs,
  searchResults,
  searchLikedSongs,
  addToLikedSongs,
  handleAddToPlaylist,
  playTrack,
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center p-4 border-b border-gray-700 bg-gray-800/50">
        <SearchBar autoFocus onResults={(results) => setSearchResults(results)} />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 text-white">
        {!searchResults && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-2 border-gray-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
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
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                  Songs
                </h3>
                <div className="grid gap-2">
                  {searchResults.tracks.items.filter((track) => track && track.id).map((track) => {
                    const isLiked = searchLikedSongs.has(track.id);

                    return (
                      <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition-colors group">
                        <img src={track.album?.images?.[0]?.url || "/placeholder.png"} alt={track.name || "Track"} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{track.name || "Unknown Track"}</h4>
                          <p className="text-gray-400 text-sm truncate">{track.artists?.map((a) => a.name).join(", ") || "Unknown Artist"}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title={isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                            className={`p-2 rounded-full transition-colors ${
                              isLiked ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-green-400"
                            }`}
                            onClick={() => addToLikedSongs(track.id, track.name)}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          </button>
                          <button title="Add to Playlist" className="p-2 rounded-full hover:bg-gray-400/30 text-gray-400 hover:text-white transition-colors" onClick={() => handleAddToPlaylist(track)}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                          </button>
                          <button title="Play" className="p-2 rounded-full hover:bg-green-400/30 text-green-400 hover:text-green-300 transition-colors" onClick={() => playTrack({ ...track, preview_url: track.preview_url })}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
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
              <section>
                <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13.5C14.8 13.8 14.4 14 14 14H10C9.6 14 9.2 13.8 9 13.5L3 7V9L9 15.5C9.2 15.8 9.6 16 10 16H14C14.4 16 14.8 15.8 15 15.5L21 9Z" />
                  </svg>
                  Artists
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.artists.items.filter((artist) => artist && artist.id).map((artist) => (
                    <div key={artist.id} className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group">
                      <img src={artist.images?.[0]?.url || "/placeholder.png"} alt={artist.name || "Artist"} className="w-20 h-20 rounded-full mb-3 object-cover" />
                      <h4 className="text-white font-medium text-center truncate w-full text-sm">{artist.name || "Unknown Artist"}</h4>
                      <p className="text-gray-400 text-xs">Artist</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {searchResults.albums?.items?.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-green-400 mb-6">Albums</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.albums.items.filter((album) => album && album.id).map((album) => (
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
                  {searchResults.playlists.items.filter((playlist) => playlist && playlist.id).map((playlist) => (
                    <div key={playlist.id} className="flex flex-col p-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                      <img src={playlist.images?.[0]?.url || "/placeholder.png"} alt={playlist.name || "Playlist"} className="w-full aspect-square rounded-lg mb-3 object-cover" />
                      <h4 className="text-white font-medium truncate text-sm">{playlist.name || "Unknown Playlist"}</h4>
                      <p className="text-gray-400 text-xs">By {playlist.owner?.display_name || "Unknown"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {searchResults && !searchResults.tracks?.items?.length && !searchResults.artists?.items?.length && !searchResults.albums?.items?.length && !searchResults.playlists?.items?.length && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
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
}
