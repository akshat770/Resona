import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (token) {
        localStorage.setItem("token", token);
        window.history.replaceState({}, document.title, "/dashboard");
      }

      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        window.location.href = "/";
        return;
      }

      try {
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setUser({}); // placeholder, you can fetch profile later
      } catch {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };
    verify();
  }, []);

  if (!user) return <p className="text-white text-center mt-20">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">You are logged in with Spotify 🎶</p>
    </div>
  );
}
