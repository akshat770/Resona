import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setLoading(false);
        return setIsAuthenticated(false);
      }

      try {
        await api.get("/auth/verify");
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("jwt");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-white bg-gray-900">Loading...</div>;

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
