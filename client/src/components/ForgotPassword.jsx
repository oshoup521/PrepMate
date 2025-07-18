import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email
      });
      
      setIsSubmitted(true);
      toast.success(response.data.message || 'Password reset instructions sent to your email');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset instructions';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900">
              Check Your Email
            </h2>
            
            <p className="mt-4 text-gray-600">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-blue-800 text-sm">
                  If you don't see the email in your inbox, please check your spam folder. 
                  The reset link will expire in 1 hour for security reasons.
                </p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Try Different Email
                </button>
                
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
                  </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-light-text/40 dark:text-dark-text/40">
            Need help?{' '}
            <Link to="/privacy" className="text-forest dark:text-sage hover:text-olive dark:hover:text-sand transition-colors">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest/5 via-olive/5 to-sage/10 dark:from-dark-bg dark:via-dark-muted dark:to-dark-bg flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-forest to-olive rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-light-text dark:text-dark-text mb-2">
            Reset Your Password
          </h2>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
            Enter your email address and we'll send you instructions to reset your password
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

        {/* Forgot Password Card */}
        <div className="card card-elevated p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Instructions...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Reset Instructions
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-light-text/60 dark:text-dark-text/60">
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="font-medium text-forest dark:text-sage hover:text-olive dark:hover:text-sand transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
