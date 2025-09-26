// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // Call backend to verify token
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsAuthenticated(true);
      } catch (err) {
        console.log("Not authenticated:", err?.response?.status);
        localStorage.removeItem("jwt");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        Loading...
      </div>
    );

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
