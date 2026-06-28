import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ref_token');
    const storedUser = localStorage.getItem('ref_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginContext = (userData, token) => {
    localStorage.setItem('ref_token', token);
    localStorage.setItem('ref_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutContext = () => {
    localStorage.removeItem('ref_token');
    localStorage.removeItem('ref_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginContext, logoutContext, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
