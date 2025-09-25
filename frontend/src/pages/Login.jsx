export default function Login() {
    const backendURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <a
          href={`${backendURL}/auth/google`}
          className="px-6 py-3 bg-green-600 rounded-lg shadow-lg"
        >
          Login with Google
        </a>
      </div>
    );
  }
  