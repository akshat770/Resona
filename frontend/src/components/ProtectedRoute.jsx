import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";


  useEffect(() => {
    // Capture JWT from URL ?token=... if present
    const qs = new URLSearchParams(window.location.search);
    const t = qs.get('token');
    if (t) {
      localStorage.setItem('jwt', t);
      // Optional: clean token from URL (soft redirect)
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }

    const jwt = localStorage.getItem('jwt');
    const headers = jwt ? { Authorization: `Bearer ${jwt}` } : undefined;

    api.get(`/auth/verify`, { headers })
      .then(() => {
        setUser(true);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;

  return user ? children : <Navigate to="/" replace />;
}
