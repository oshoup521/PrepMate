import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MockInterviewTemplates from './components/MockInterviewTemplates';
import Progress from './components/Progress';
import InterviewSession from './components/InterviewSession';
import SessionHistory from './components/SessionHistory';
import Profile from './components/Profile';
import EmailVerification from './components/EmailVerification';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import EmailTestInfo from './components/EmailTestInfo';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function App() {
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`).catch(() => {});
    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-200">
            <Header />
            <main>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/templates" 
                  element={
                    <ProtectedRoute>
                      <MockInterviewTemplates />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/progress" 
                  element={
                    <ProtectedRoute>
                      <Progress />
                    </ProtectedRoute>
                  } 
                />                <Route 
                  path="/interview" 
                  element={
                    <ProtectedRoute>
                      <InterviewSession />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/session/:sessionId" 
                  element={
                    <ProtectedRoute>
                      <SessionHistory />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
            
            {/* Toast Notifications */}
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerStyle={{ top: 72 }}
              toastOptions={{
                duration: 4000,
                style: {
                  maxWidth: '90vw',
                  fontSize: '0.875rem',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#537D5D',
                    color: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#dc2626',
                    color: '#fff',
                  },
                },
              }}
            />
            <EmailTestInfo />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
