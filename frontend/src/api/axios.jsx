import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const qs = new URLSearchParams(window.location.search);
        const tokenFromUrl = qs.get('token');

        if (tokenFromUrl) {
          localStorage.setItem('jwt', tokenFromUrl);
          api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;

          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url.toString());
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        await api.get('/auth/verify');
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('jwt');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setIsAuthenticated(false);
        } else {
          setError("Couldn't verify your session. Please try again later.");
          console.error("Verification error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-screen text-white bg-gray-900">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500 bg-gray-900">{error}</div>;

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
