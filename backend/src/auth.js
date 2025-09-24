// optional - if you ever want to build client-only login (not used here)
export const loginUrl = `https://accounts.spotify.com/authorize?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SPOTIFY_REDIRECT_URI)}&response_type=token&scope=user-library-read%20playlist-read-private`;
