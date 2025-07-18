import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import Logo from './Logo';
import { Button } from './LoadingSpinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error types
      if (error.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (error.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setEmail(value);
      if (fieldErrors.email) {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (field === 'password') {
      setPassword(value);
      if (fieldErrors.password) {
        setFieldErrors(prev => ({ ...prev, password: '' }));
      }
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest/5 via-olive/5 to-sage/10 dark:from-dark-bg dark:via-dark-muted dark:to-dark-bg flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-light-text dark:text-dark-text mb-2">
            Welcome back
          </h2>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
            Sign in to your PrepMate account to continue your interview practice
          </p>
        </div>

        {/* Backend Info Note */}
        <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-700 rounded-xl shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200 mb-2">
                ⚡ Backend Information
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                Our backend is deployed on <strong>Render</strong> and goes to sleep when not used for a while. 
                For the first API request, Render needs to start the deployment which may take <strong>30-60 seconds</strong>. 
                Please have patience - the app will work normally once the deployment is completed! 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="card card-elevated p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Alert */}
            {error && (
              <div className="alert alert-error">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="font-medium mb-1">
                      Authentication Failed
                    </h3>
                    <p className="text-sm">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-light-text/40 dark:text-dark-text/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`form-input pl-10 ${fieldErrors.email ? 'form-input-error' : ''}`}
                  placeholder="Enter your email address"
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="form-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-light-text/40 dark:text-dark-text/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`form-input pl-10 pr-10 ${fieldErrors.password ? 'form-input-error' : ''}`}
                  placeholder="Enter your password"
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-light-text/40 dark:text-dark-text/40 hover:text-light-text dark:hover:text-dark-text transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="form-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-forest dark:text-sage hover:text-olive dark:hover:text-sand transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
              loadingText="Signing in..."
              leftIcon={
                !loading && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                )
              }
            >
              Sign In
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-light-text/60 dark:text-dark-text/60">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-forest dark:text-sage hover:text-olive dark:hover:text-sand transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-light-text/40 dark:text-dark-text/40">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-forest dark:text-sage hover:text-olive dark:hover:text-sand transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-forest dark:text-sage hover:text-olive dark:hover:text-sand transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
