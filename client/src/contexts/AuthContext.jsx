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
    // Check if there's a token in local storage and it's valid
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Verify token isn't expired
        const decodedToken = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp > currentTime) {
          setToken(storedToken);
          setCurrentUser(JSON.parse(localStorage.getItem('user')));
        } else {
          // Token expired
          logout();
        }
      } catch (error) {
        // Invalid token
        logout();
      }
    }
    
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt started');
      console.log('📍 API URL:', API_URL);
      console.log('🌐 Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🔗 Full login URL:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { access_token, user } = response.data;
      console.log('✅ Login successful');
      console.log('👤 User received:', { id: user.id, email: user.email, name: user.name });
      console.log('🎫 Token received (first 20 chars):', access_token.substring(0, 20) + '...');
      
      // Decode and log token payload for debugging
      try {
        const tokenPayload = jwtDecode(access_token);
        console.log('🔍 Token payload:', tokenPayload);
      } catch (decodeError) {
        console.error('❌ Failed to decode token:', decodeError);
      }
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(access_token);
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('❌ Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  };
  const register = async (name, email, password) => {
    try {
      console.log('Registering user:', { name, email });
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      console.log('Registration response:', response.data);

      // Check if the server returns user and token (auto login) or just a message (verification required)
      if (response.data.access_token && response.data.user) {
        // Auto login flow
        const { access_token, user } = response.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setToken(access_token);
        setCurrentUser(user);
        
        return user;
      } else {
        // Verification required flow - return the message to the Register component
        return response.data;
      }
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
  // Set up axios interceptor to add auth token to all requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Response interceptor caught error:', error);
        
        // Check for specific auth-related errors
        if (error.response && error.response.status === 401) {
          console.log('Authentication error detected, logging out...');
          logout();
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
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
