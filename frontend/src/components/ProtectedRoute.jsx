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
        await api.get("/auth/verify", { withCredentials: true });
        setIsAuthenticated(true);
      } catch {
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
