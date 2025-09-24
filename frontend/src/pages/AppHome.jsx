import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AppHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    }
  }, []);

  return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
}
