import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rcc_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then(res => setUser(res.data.user)).catch(() => localStorage.removeItem('rcc_token')).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('rcc_token', res.data.token);
    setUser(res.data.user);
  }
  function logout() { localStorage.removeItem('rcc_token'); setUser(null); }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
