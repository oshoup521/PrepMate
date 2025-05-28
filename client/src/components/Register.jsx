import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { showSuccessToast, showLoadingToast, dismissToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';
import Logo from './Logo';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Debug effect - log API URL on component mount
  useEffect(() => {
    console.log('API URL:', import.meta.env.VITE_API_URL || 'Not set (will use default http://localhost:3000)');
  }, []);

  const validateForm = () => {
    if (!name.trim()) {
      throw new Error('Name is required');
    }
    if (name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
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
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Register form submitted');
    let loadingToast;
    
    try {
      setError('');
      validateForm();
      setIsLoading(true);
      
      loadingToast = showLoadingToast('Creating your account...');
      console.log('Attempting to register with:', { name: name.trim(), email: email.trim().toLowerCase() });
      console.log('API URL being used:', import.meta.env.VITE_API_URL || 'http://localhost:3000');
      
      // Add additional logging for the API request
      console.log('Sending registration request...');
      
      const result = await register(name.trim(), email.trim().toLowerCase(), password);
      console.log('Registration result:', result);
      
      dismissToast(loadingToast);
      
      // Store the email for verification purposes
      setRegisteredEmail(email.trim().toLowerCase());
      
      // Check if we got an access token (auto login) or just a message (verification required)
      if (result && result.access_token) {
        // Auto login flow (development mode)
        showSuccessToast(result.message || 'Account created successfully! Welcome to PrepMate.');
        navigate('/dashboard');
      } else {
        // Verification required flow - show verification message
        setRegistrationSuccess(true);
        showSuccessToast(result?.message || 'Account created! Please check your email to verify your account.');
      }
    } catch (err) {
      console.error('Full registration error:', err);
      if (loadingToast) dismissToast(loadingToast);
      
      if (err?.message?.includes('validation') || err?.message?.includes('required') || err?.message?.includes('match')) {
        toast.error(err.message);
        setError(err.message);
      } else if (err?.response) {
        // Handle API error response
        const errorMsg = err.response.data?.message || 'Registration failed. Please try again.';
        toast.error(errorMsg);
        setError(errorMsg);
        console.error('API registration error:', err.response.data);
      } else if (err?.request) {
        // Request was made but no response received
        const errorMsg = 'Server is not responding. Please make sure the server is running.';
        toast.error(errorMsg);
        setError(errorMsg);
        console.error('Network error during registration:', err.request);
      } else {
        // Something else happened in setting up the request
        setError('Registration failed. Please try again.');
        toast.error('An unexpected error occurred');
        console.error('Unexpected registration error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    navigate('/login', { state: { email: registeredEmail, needVerification: true } });
  };

  // If registration is successful, show verification message
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <Logo />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Registration Successful!
            </h2>
            <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-5 rounded relative">
              <p className="mb-4">
                Your account has been created successfully! A verification email has been sent to <strong>{registeredEmail}</strong>.
              </p>
              <p className="mb-4">
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="text-sm">
                Note: If you don't see the email, please check your spam folder.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={redirectToLogin}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Login Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Logo />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              sign in to existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
