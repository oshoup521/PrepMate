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
