import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { showSuccessToast, showLoadingToast, dismissToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';
import Logo from './Logo';
import axios from 'axios';

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verificationNeeded, setVerificationNeeded] = useState(location.state?.needVerification || false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Debug effect - log API URL on component mount
  useEffect(() => {
    console.log('Login component: API URL:', import.meta.env.VITE_API_URL || 'Not set (will use default http://localhost:3000)');
    
    // If we received a needVerification flag, set the appropriate error message
    if (location.state?.needVerification && location.state?.email) {
      setVerificationNeeded(true);
      setError('Please verify your email before logging in');
    }
  }, [location.state]);

  const validateForm = () => {
    if (!email.trim()) {
      throw new Error('Email is required');
    }
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  };

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first');
      return;
    }    try {
      setIsVerifying(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/auth/dev-verify`, { 
        email: email.trim().toLowerCase() 
      });
      
      toast.success(response.data.message || 'Email verified successfully. You can now log in.');
      setError('');
      setVerificationNeeded(false);
    } catch (err) {
      console.error('Verification error:', err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to verify email. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    let loadingToast;
    
    try {
      setError('');
      validateForm();
      setIsLoading(true);
      
      loadingToast = showLoadingToast('Signing in...');
      console.log('Attempting login with:', email.trim().toLowerCase());
      
      await login(email.trim().toLowerCase(), password);
      
      dismissToast(loadingToast);
      showSuccessToast('Welcome back! Login successful.');
      navigate('/dashboard');
    } catch (err) {
      if (loadingToast) dismissToast(loadingToast);
      console.error('Login error:', err);
      
      // Display specific error messages
      if (err?.response?.data?.message) {
        const errorMsg = err.response.data.message;
        
        // Check if error is related to email verification
        if (errorMsg.toLowerCase().includes('verify') || errorMsg.toLowerCase().includes('verification')) {
          setVerificationNeeded(true);
        }
        
        toast.error(errorMsg);
        setError(errorMsg);
      } else if (err?.message?.includes('verify your email')) {
        const errorMsg = 'Please verify your email before logging in';
        setVerificationNeeded(true);
        toast.error(errorMsg);
        setError(errorMsg);
      } else {
        const errorMsg = 'Login failed. Please check your credentials.';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the error message indicates unverified email or if we have the verification flag
  const isEmailVerificationError = verificationNeeded || 
                                  error.toLowerCase().includes('verify your email') || 
                                  error.toLowerCase().includes('not verified') || 
                                  error.toLowerCase().includes('email verification');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Logo />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            
            {/* Show verify button only for email verification errors */}
            {isEmailVerificationError && import.meta.env.DEV && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={isVerifying}
                  className="w-full text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email (Dev Only)'}
                </button>
                <p className="text-xs mt-1 text-gray-600">
                  This button is only available in development mode
                </p>
              </div>
            )}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
