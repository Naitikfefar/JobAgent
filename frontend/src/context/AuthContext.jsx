import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await getMe();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to restore session:', error);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  // Login function
  const login = async (loginData) => {
    // This will be called from the Login component
    // The login API call happens there, then we set the token and user
  };

  // Store token and user after successful login
  const handleLoginSuccess = (authData) => {
    localStorage.setItem('token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    try {
      navigate('/login');
    } catch (e) {
      // ignore if navigate not available
    }
  };

  // Update user profile
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        handleLoginSuccess,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
