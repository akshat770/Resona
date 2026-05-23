export default function Login() {
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#121212] p-8 lg:p-10 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <svg width="64" height="64" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="50" cy="50" r="48" stroke="#1DB954" strokeWidth="3" />
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              fill="white"
              fontSize="40"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              R
            </text>
            <path
              d="M30 70 Q50 60 70 70"
              stroke="#1DB954"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M32 58 Q50 50 68 58"
              stroke="#1ed760"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M34 46 Q50 42 66 46"
              stroke="#169c46"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 text-white">Resona</h1>
        <p className="text-gray-400 mb-8 lg:mb-10 text-sm lg:text-base">
          Connect with Spotify to start listening
        </p>

        <a
          href={`${backendURL}/auth/spotify`}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1DB954] hover:bg-[#1ed760] active:bg-[#169c46] text-black font-bold px-8 py-3.5 transition-colors shadow-lg shadow-green-500/20 text-sm lg:text-base w-full sm:w-auto"
        >
          <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 6.64 5.37 12 12 12s12-5.36 12-12c0-6.63-5.37-12-12-12zm5.42 17.54c-.22.36-.68.47-1.04.26-2.84-1.73-6.42-2.12-10.64-1.16-.41.09-.82-.17-.91-.59-.09-.42.17-.82.59-.91 4.6-1.02 8.55-.58 11.7 1.34.36.21.47.68.26 1.06zm1.48-3.29c-.28.46-.88.6-1.34.32-3.25-1.98-8.21-2.55-12.05-1.39-.52.16-1.08-.13-1.24-.65-.16-.52.13-1.08.65-1.24 4.32-1.34 9.77-.72 13.48 1.59.46.28.6.88.32 1.37zm.13-3.39c-3.89-2.31-10.33-2.52-14.04-1.37-.63.2-1.29-.15-1.48-.78-.2-.63.15-1.29.78-1.48 4.27-1.34 11.38-1.09 15.83 1.55.57.34.75 1.08.41 1.66-.34.57-1.08.75-1.66.41z" />
          </svg>
          Login with Spotify
        </a>
      </div>
    </div>
  );
}
