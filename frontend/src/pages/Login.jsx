export default function Login() {
    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">Spotify Clone</h1>
          <a
            href={`${backendURL}/auth/google`}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Login with Google
          </a>
        </div>
      </div>
    );
  }
  