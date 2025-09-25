import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AppHome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Spotify implicit grant returns token in URL hash
    // e.g. #access_token=...&token_type=Bearer&expires_in=3600
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    if (token) {
      const expiresAt = Date.now() + Number(expiresIn || 3600) * 1000;
      localStorage.setItem('token', token);
      localStorage.setItem('token_expires_at', String(expiresAt));
      navigate('/dashboard');
    } else {
      // fallback: if token already stored and not expired
      const stored = localStorage.getItem('token');
      const exp = Number(localStorage.getItem('token_expires_at')) || 0;
      if (stored && Date.now() < exp) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  }, []);

  return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
}
