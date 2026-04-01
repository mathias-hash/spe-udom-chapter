import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('spe_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData, tokens) => {
    localStorage.setItem('spe_user', JSON.stringify(userData));
    if (tokens?.access) localStorage.setItem('spe_access', tokens.access);
    if (tokens?.refresh) localStorage.setItem('spe_refresh', tokens.refresh);
    setUser(userData);
  }, []);

  // Update user data only (keep existing tokens)
  const updateUser = useCallback((userData) => {
    localStorage.setItem('spe_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('spe_user');
    localStorage.removeItem('spe_access');
    localStorage.removeItem('spe_refresh');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
