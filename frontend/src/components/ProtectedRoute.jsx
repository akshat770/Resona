import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        // First, check if there's a token in the URL and extract it
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        if (urlToken) {
          console.log("ProtectedRoute - Found token in URL, storing...");
          localStorage.setItem("jwt", urlToken);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Now get token from localStorage
        const token = localStorage.getItem("jwt");
        if (!token) {
          console.log("ProtectedRoute - No token found");
          setIsAuthenticated(false);
          return;
        }

        console.log("ProtectedRoute - Verifying token...");
        
        // Call backend to verify token
        await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("ProtectedRoute - Token verified successfully");
        setIsAuthenticated(true);
      } catch (err) {
        console.log("ProtectedRoute - Authentication failed:", err?.response?.status);
        localStorage.removeItem("jwt"); // remove invalid token
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
