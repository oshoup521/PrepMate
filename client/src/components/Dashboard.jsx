import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import { LoadingPage, LoadingCard, Button } from './LoadingSpinner';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressStats, setProgressStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    activeSessions: 0,
    inProgressSessions: 0,
    averageScore: 0
  });
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [sessionsData, progressData] = await Promise.all([
        interviewService.getUserSessions(),
        interviewService.getUserProgress()
      ]);

      setSessions(sessionsData || []);
      
      // Ensure we have valid numbers for all stats
      const safeProgressStats = {
        totalSessions: Number(progressData?.totalSessions) || 0,
        completedSessions: Number(progressData?.completedSessions) || 0,
        activeSessions: Number(progressData?.activeSessions) || 0,
        inProgressSessions: Number(progressData?.inProgressSessions) || 0,
        averageScore: Number(progressData?.averageScore) || 0
      };
      
      setProgressStats(safeProgressStats);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showErrorToast('Failed to load dashboard data');
      
      // Set default values on error
      setProgressStats({
        totalSessions: 0,
        completedSessions: 0,
        activeSessions: 0,
        inProgressSessions: 0,
        averageScore: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
    setIsStartingInterview(true);
    navigate('/interview');
    } catch (error) {
      console.error('Failed to start interview:', error);
      showErrorToast('Failed to start interview');
    } finally {
      setIsStartingInterview(false);
    }
  };

  const handleViewSession = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  const handleContinueSession = (sessionId) => {
    navigate(`/interview?sessionId=${sessionId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (session) => {
    if (session.completed && session.status === 'completed') {
      return 'status-completed';
    } else if (session.status === 'in_progress') {
      return 'status-in-progress';
    } else {
      return 'status-active';
    }
  };

  const getStatusText = (session) => {
    if (session.completed && session.status === 'completed') {
      return 'Completed';
    } else if (session.status === 'in_progress') {
      return 'In Progress';
    } else {
      return 'Active';
    }
  };

  const getScoreDisplay = (session) => {
    // Check multiple possible score locations
    let score = null;
    
    if (session.summary?.overallScore !== undefined && session.summary?.overallScore !== null) {
      score = session.summary.overallScore;
    } else if (session.summary?.score !== undefined && session.summary?.score !== null) {
      score = session.summary.score;
    }
    
    if (score !== null) {
      const numericScore = parseFloat(score);
      if (!isNaN(numericScore)) {
        return `${numericScore}/10`;
      }
    }
    
    // For completed sessions without scores, show a default
    if (session.completed && session.status === 'completed') {
      return 'Completed';
    }
    
    return 'N/A';
  };

  const getScoreColor = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) {
      return 'text-gray-600 dark:text-gray-400'; // Default color for N/A or non-numeric scores
    }
    if (numericScore >= 8) return 'text-green-600 dark:text-green-400';
    if (numericScore >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  return (
    <div className="container-responsive section-spacing">
      {/* Debug Info - Remove in production */}
      {import.meta.env.DEV && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm">
          <strong>🔧 Debug Info:</strong><br/>
          API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3000'}<br/>
          User ID: {currentUser?.id}<br/>
          User Agent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
        </div>
      )}

      {/* Welcome Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light-text dark:text-dark-text mb-2">
              Welcome back, <span className="gradient-text">{currentUser?.name || 'User'}!</span>
            </h1>
            <p className="text-light-text/70 dark:text-dark-text/70 text-sm sm:text-base">
              Track your interview preparation progress and continue your learning journey.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button
              onClick={handleStartInterview}
              loading={isStartingInterview}
              disabled={isStartingInterview}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-lg hover:shadow-xl"
              loadingText="Starting..."
              leftIcon={
                !isStartingInterview && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              }
            >
              Start New Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="card progress-card">
          <div className="progress-stat">
            <div className="text-2xl sm:text-3xl font-bold text-forest dark:text-sage">
              {progressStats.totalSessions}
            </div>
            <div className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
              Total Sessions
            </div>
          </div>
        </div>

        <div className="card progress-card">
          <div className="progress-stat">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {progressStats.completedSessions}
            </div>
            <div className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
              Completed
            </div>
          </div>
        </div>

        <div className="card progress-card">
          <div className="progress-stat">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {progressStats.inProgressSessions}
            </div>
            <div className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
              In Progress
            </div>
          </div>
        </div>

        <div className="card progress-card">
          <div className="progress-stat">
            <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(progressStats.averageScore)}`}>
              {progressStats.averageScore > 0 ? `${progressStats.averageScore}/10` : 'N/A'}
            </div>
            <div className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
              Average Score
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text">
            Recent Sessions
              </h2>
          {sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/progress')}
              rightIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              View All
            </Button>
          )}
        </div>
        
          {sessions.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-forest/10 dark:bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
              No sessions yet
              </h3>
            <p className="text-light-text/60 dark:text-dark-text/60 mb-6 max-w-md mx-auto">
                Start your first interview session to begin tracking your progress and improving your skills.
              </p>
            <Button
                onClick={handleStartInterview}
              loading={isStartingInterview}
              variant="primary"
              size="lg"
              loadingText="Starting..."
              leftIcon={
                !isStartingInterview && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              }
            >
              Start Your First Interview
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile view */}
            <div className="block sm:hidden space-y-4">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-light-text dark:text-dark-text">
                        {session.role}
                      </h3>
                      <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`status-badge ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                      <span className={`status-badge ${getStatusColor(session)}`}>
                        {getStatusText(session)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                                              Score: <span className={`font-semibold ${getScoreColor(session.summary?.overallScore || session.summary?.score || 0)}`}>
                          {getScoreDisplay(session)}
                        </span>
                    </div>
                    <div className="flex space-x-2">
                      {session.status === 'in_progress' && !session.completed && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleContinueSession(session.id)}
                        >
                          Continue
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSession(session.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
                  <thead className="bg-light-bg/50 dark:bg-dark-bg/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
                        Role & Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-muted divide-y divide-light-border dark:divide-dark-border">
                    {sessions.slice(0, 10).map((session) => (
                      <tr 
                        key={session.id} 
                        className="hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-light-text dark:text-dark-text">
                              {session.role}
                            </div>
                            {session.description && (
                              <div className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">
                                {session.description}
                              </div>
                            )}
                            <div className="text-xs text-light-text/50 dark:text-dark-text/50 mt-1">
                              {formatDate(session.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${getDifficultyColor(session.difficulty)}`}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${getStatusColor(session)}`}>
                            {getStatusText(session)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${getScoreColor(session.summary?.overallScore || session.summary?.score || 0)}`}>
                            {getScoreDisplay(session)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-light-text/60 dark:text-dark-text/60">
                          {session.questions?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          {session.status === 'in_progress' && !session.completed && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleContinueSession(session.id)}
                            >
                              Continue
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSession(session.id)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
              </div>

      {/* Quick Actions */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card card-interactive p-6" onClick={() => navigate('/templates')}>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
              Interview Templates
                        </h3>
            <p className="text-sm text-light-text/60 dark:text-dark-text/60">
              Browse pre-made interview templates for different roles and companies.
                        </p>
                      </div>

          <div className="card card-interactive p-6" onClick={() => navigate('/progress')}>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
              Progress Analytics
            </h3>
            <p className="text-sm text-light-text/60 dark:text-dark-text/60">
              View detailed analytics and track your improvement over time.
            </p>
                    </div>
                    
          <div className="card card-interactive p-6" onClick={handleStartInterview}>
            <div className="w-12 h-12 bg-forest/10 dark:bg-sage/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
              Practice Interview
            </h3>
                      <p className="text-sm text-light-text/60 dark:text-dark-text/60">
              Start a new interview session with AI-powered questions and feedback.
            </p>
                </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
