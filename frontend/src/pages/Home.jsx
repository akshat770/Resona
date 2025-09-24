import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [user, setUser] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${backendUrl}/user/me`, {
          withCredentials: true, // if your backend sends a cookie
        });
        setUser(res.data);
      } catch (err) {
        console.log('User not logged in', err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">Resona</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.name}</h2>
        </div>
      ) : (
        <a
          href={`${backendUrl}/auth/google`}
          className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded text-lg"
        >
          Login with Google
        </a>
      )}
    </div>
  );
}
