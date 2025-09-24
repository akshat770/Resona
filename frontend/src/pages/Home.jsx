import React from 'react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">Spotify Clone</h1>
      <a
        href="https://localhost:5000/auth/google"
        className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded text-lg"
      >
        Login with Google
      </a>
    </div>
  );
}
