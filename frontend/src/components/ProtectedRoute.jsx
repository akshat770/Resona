import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function ProtectedRoute() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // check if token is in URL (after Google redirect)
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("jwt", tokenFromUrl);
      // clean URL (remove ?token=...)
      window.history.replaceState({}, document.title, location.pathname);
    }

    async function verifyToken() {
      try {
        await api.get("/auth/verify");
        setAuthenticated(true);
      } catch (err) {
        console.error("Verify failed:", err);
        localStorage.removeItem("jwt");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [location]);

  if (loading) return <div className="text-center p-6">Loading...</div>;

  return authenticated ? <Outlet /> : <Navigate to="/" />;
}
