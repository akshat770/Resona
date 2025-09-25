import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../api/axios';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const jwt = localStorage.getItem('jwt');
      try {
        if (jwt) {
          await axios.get('/auth/verify', { headers: { Authorization: `Bearer ${jwt}` } });
          setIsAuthenticated(true);
          return;
        }
        await axios.get('/user/me');
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    verify();
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;