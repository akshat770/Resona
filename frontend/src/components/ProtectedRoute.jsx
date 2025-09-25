import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../api/axios'; // Import your configured axios instance

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null | true | false

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Ask the backend to verify the token
        await axios.get('/auth/verify');
        setIsAuthenticated(true);
      } catch (error) {
        // If the token is invalid, the API will return a 401 error
        console.error("Token verification failed:", error);
        // localStorage.removeItem('jwt_token'); // Clean up invalid token
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, []);

  // Show a loading state while checking the token
  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  // If authenticated, show the dashboard. If not, redirect to login.
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;