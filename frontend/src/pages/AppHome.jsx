import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

export default function AppHome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Support hybrid: token query param OR session via /user/me
    const qs = new URLSearchParams(window.location.search);
    const token = qs.get('token');
    if (token) {
      localStorage.setItem('jwt', token);
      navigate('/dashboard');
      return;
    }
    axios.get('/user/me')
      .then(() => navigate('/dashboard'))
      .catch(() => navigate('/'));
  }, []);

  return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
}
