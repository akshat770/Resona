import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../api/axios';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    axios
      .get('/user/me')
      .then(() => mounted && setAuthenticated(true))
      .catch(() => mounted && setAuthenticated(false))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return null;
  if (!authenticated) return <Navigate to="/" replace />;
  return children;
}


