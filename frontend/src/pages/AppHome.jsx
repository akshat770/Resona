import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

export default function AppHome() {
  const navigate = useNavigate();

  useEffect(() => {
    // After Google OAuth callback, the backend redirects here.
    // Check session on backend and route accordingly.
    axios
      .get('/user/me')
      .then(() => navigate('/dashboard'))
      .catch(() => navigate('/'));
  }, []);

  return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
}
