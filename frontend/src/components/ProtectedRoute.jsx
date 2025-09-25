import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";


  useEffect(() => {
    api.get(`${backendURL}/dashboard`)
      .then(res => {
        setUser(res.data.user);
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
