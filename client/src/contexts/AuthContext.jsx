import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    let cachedUser = null;
    try {
      const decodedToken = jwtDecode(storedToken);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp <= currentTime) {
        logout();
        setLoading(false);
        return;
      }
      cachedUser = JSON.parse(localStorage.getItem('user'));
    } catch {
      logout();
      setLoading(false);
      return;
    }

    // Optimistic hydrate from cache, then verify with server
    setToken(storedToken);
    setCurrentUser(cachedUser);

    axios
      .get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${storedToken}` } })
      .then((response) => {
        const freshUser = response.data;
        if (!freshUser) {
          logout();
          return;
        }
        localStorage.setItem('user', JSON.stringify(freshUser));
        setCurrentUser(freshUser);
      })
      .catch((error) => {
        const status = error?.response?.status;
        // User deleted / token revoked / unauthorized — force logout.
        // Network errors (no response) leave the cached session intact.
        if (status === 401 || status === 403 || status === 404) {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, []);
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(access_token);
      setCurrentUser(user);
      
      return user;
    } catch (error) {

      throw error;
    }
  };
  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      // Check if the server returns user and token (auto login) or just a message (verification required)
      if (response.data.access_token && response.data.user) {
        // Auto login flow
        const { access_token, user } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        setToken(access_token);
        setCurrentUser(user);
      }

      // Always return full response so Register.jsx can check for access_token
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    try {
      const response = await axios.get(`${API_URL}/auth/profile`);
      const updatedUser = response.data;
      if (!updatedUser) {
        logout();
        return;
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } catch (error) {
      // 401/403 is handled by the global response interceptor (logs out).
      // For network errors, keep the cached session — stale user data is acceptable.
    }
  };
  // Set up axios interceptor to add auth token to all requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        // Auth endpoints (login/register/password) naturally return 401/403 on bad creds — don't log out.
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password');
        if ((status === 401 || status === 403) && !isAuthEndpoint && localStorage.getItem('token')) {
          logout();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.assign('/login');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const value = {
    currentUser,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
