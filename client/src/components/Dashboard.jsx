import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import { LoadingPage, LoadingCard, LoadingButton } from './LoadingSpinner';
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
      
      // Fetch both sessions and progress data
      const [sessionsData, progressData] = await Promise.all([
        interviewService.getUserSessions(),
        interviewService.getUserProgress().catch(error => {
          console.warn('Progress API not available, using manual calculation:', error);
          return null;
        })
      ]);
      
      setSessions(sessionsData);
      
      // Use progress API data if available, otherwise calculate manually
      if (progressData) {
        setProgressStats({
          totalSessions: progressData.totalSessions,
          completedSessions: progressData.completedSessions,
          activeSessions: progressData.activeSessions,
          inProgressSessions: progressData.inProgressSessions,
          averageScore: progressData.averageScore
        });
      } else {
        // Manual calculation fallback
        const completed = sessionsData.filter(s => s.completed && s.status === 'completed');
        const active = sessionsData.filter(s => s.status === 'active');
        const inProgress = sessionsData.filter(s => s.status === 'in_progress' && !s.completed);
        
        setProgressStats({
          totalSessions: sessionsData.length,
          completedSessions: completed.length,
          activeSessions: active.length,
          inProgressSessions: inProgress.length,
          averageScore: 0 // Would need more complex calculation
        });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    setIsStartingInterview(true);
    showSuccessToast('Redirecting to interview session...');
    navigate('/interview');
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
    switch (difficulty.toLowerCase()) {
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

  if (loading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  return (
    <div className="container-responsive section-spacing">
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
            <LoadingButton
              onClick={handleStartInterview}
              isLoading={isStartingInterview}
              className="btn btn-primary btn-lg w-full sm:w-auto shadow-lg hover:shadow-xl"
            >
              {isStartingInterview ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start New Interview
                </>
              )}
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl mr-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60">Total Sessions</p>
              <p className="progress-stat text-blue-600 dark:text-blue-400">{progressStats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl mr-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60">Completed</p>
              <p className="progress-stat text-green-600 dark:text-green-400">{progressStats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl mr-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60">In Progress</p>
              <p className="progress-stat text-yellow-600 dark:text-yellow-400">{progressStats.inProgressSessions}</p>
            </div>
          </div>
        </div>

        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-forest/10 dark:bg-sage/10 rounded-xl mr-4">
              <svg className="w-6 h-6 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60">Avg Score</p>
              <p className="progress-stat text-forest dark:text-sage">
                {progressStats.averageScore > 0 ? `${progressStats.averageScore}/10` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Sessions */}
      <div className="card card-elevated">
        <div className="px-4 sm:px-6 py-4 border-b border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">
                Recent Interview Sessions
              </h2>
              <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
                Click on any session to view details and analysis
              </p>
            </div>
            <LoadingButton
              onClick={handleStartInterview}
              isLoading={isStartingInterview}
              className="btn btn-primary btn-sm"
            >
              {isStartingInterview ? 'Redirecting...' : 'New Interview'}
            </LoadingButton>
          </div>
        </div>
        
        {/* Sessions Content */}
        <div className="overflow-hidden">
          {sessions.length === 0 ? (
            <div className="px-4 sm:px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 p-3 bg-forest/10 dark:bg-sage/10 rounded-full">
                <svg className="w-full h-full text-forest/40 dark:text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
                No interviews yet
              </h3>
              <p className="text-light-text/60 dark:text-dark-text/60 mb-6 max-w-sm mx-auto">
                Start your first interview session to begin tracking your progress and improving your skills.
              </p>
              <LoadingButton
                onClick={handleStartInterview}
                isLoading={isStartingInterview}
                className="btn btn-primary"
              >
                {isStartingInterview ? 'Starting...' : 'Start Your First Interview'}
              </LoadingButton>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
                  <thead className="bg-forest/5 dark:bg-sage/5">
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
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">
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
                        <td className="px-6 py-4 text-sm text-light-text/60 dark:text-dark-text/60">
                          <div className="flex items-center">
                            <span>{session.questions?.length || 0}</span>
                            {(session.questions?.length || 0) > 0 && (
                              <svg className="w-4 h-4 ml-2 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="btn btn-ghost btn-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-light-border dark:divide-dark-border">
                {sessions.slice(0, 10).map((session) => (
                  <div 
                    key={session.id}
                    className="p-4 hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-light-text dark:text-dark-text">
                          {session.role}
                        </h3>
                        <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
                          {formatDate(session.createdAt)}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-light-text/40 dark:text-dark-text/40 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`status-badge ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                      <span className={`status-badge ${getStatusColor(session)}`}>
                        {getStatusText(session)}
                      </span>
                      <span className="status-badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {session.questions?.length || 0} questions
                      </span>
                    </div>
                    
                    {session.description && (
                      <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                        {session.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {sessions.length > 10 && (
                <div className="px-4 sm:px-6 py-4 border-t border-light-border dark:border-dark-border text-center">
                  <button
                    onClick={() => navigate('/progress')}
                    className="btn btn-secondary"
                  >
                    View All Sessions
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
