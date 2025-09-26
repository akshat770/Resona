// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Call backend to verify session
        // Include credentials (cookies) in request
        await api.get("/auth/verify", { withCredentials: true });
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log("Not authenticated");
        } else {
          setError("Couldn't verify your session. Please try again later.");
          console.error("Verification error:", err);
        }
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

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500 bg-gray-900">
        {error}
      </div>
    );

  // Redirect to login if not authenticated
  return isAuthenticated ? children : <Navigate to="/" replace />;
}
