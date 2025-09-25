import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  // Use more explicit state names for clarity
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Using an async function inside useEffect for cleaner async/await syntax
    const verifyToken = async () => {
      try {
        // Capture JWT from URL `?token=...` if present
        const qs = new URLSearchParams(window.location.search);
        const tokenFromUrl = qs.get('token');
        if (tokenFromUrl) {
          localStorage.setItem('jwt', tokenFromUrl);
          // Clean token from URL to prevent it from being shared or bookmarked
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url.toString());
        }

        const jwt = localStorage.getItem('jwt');

        // If no token exists, don't bother making an API call
        if (!jwt) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${jwt}` };
        
        // On success, the backend should ideally return user data
        await api.get(`/auth/verify`, { headers });

        setIsAuthenticated(true);
      } catch (err) {
        // Clear any invalid token
        localStorage.removeItem('jwt');
        
        // Differentiate between auth errors and other server/network errors
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // The token is invalid or expired, which is an expected auth failure.
          setIsAuthenticated(false);
        } else {
          // A different error occurred (e.g., network, server error)
          setError("Couldn't verify your session. Please try again later.");
          console.error("Verification error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []); // Empty dependency array ensures this runs only once on mount

  if (isLoading) {
    // A more styled loading indicator can be used here
    return <div className="flex items-center justify-center h-screen text-white bg-gray-900">Loading...</div>;
  }

  if (error) {
    // Display an error message if verification failed for non-auth reasons
    return <div className="flex items-center justify-center h-screen text-red-500 bg-gray-900">{error}</div>;
  }

  // If authenticated, render the protected component, otherwise redirect to login
  return isAuthenticated ? children : <Navigate to="/" replace />;
}
