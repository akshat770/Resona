router.get("/spotify", (req, res) => {
  const scopes = [
    "user-read-email",
    "user-read-private", 
    "user-read-recently-played",
    "user-library-read",
    "user-library-modify",
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-playback-state",    // Required for playback
    "user-modify-playback-state",  // Required for playback control
    "user-read-currently-playing", // Required for current track
    "streaming"                    // Required for Web Playback SDK
  ];
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, "state123");
  res.redirect(authorizeURL);
});
