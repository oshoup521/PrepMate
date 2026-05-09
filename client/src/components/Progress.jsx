import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import { LoadingPage, Button } from './LoadingSpinner';

const MOBILE_PER_PAGE = 5;
const DESKTOP_PER_PAGE = 10;

const Progress = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobilePage, setMobilePage] = useState(1);
  const [desktopPage, setDesktopPage] = useState(1);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    activeSessions: 0,
    inProgressSessions: 0,
    averageScore: null,
    streakDays: 0,
    topRoles: [],
    weeklyProgress: [],
    recentSessions: 0,
    lastSessionDate: null
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Get progress data from the new API endpoint
      const progressData = await interviewService.getUserProgress();
      setStats(progressData);
      
      // Also get sessions for detailed view if needed
      const userSessions = await interviewService.getUserSessions();
      setSessions(userSessions);
      
    } catch (error) {
      console.error('Error fetching progress data:', error);
      
      // Fallback to manual calculation if API fails
      try {
        const userSessions = await interviewService.getUserSessions();
        setSessions(userSessions);
        calculateStats(userSessions);
      } catch (fallbackError) {
        console.error('Error fetching sessions for fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep the manual calculation as fallback
  const calculateStats = (sessions) => {
    const completedSessions = sessions.filter(s => s.completed && s.status === 'completed');
    const activeSessions = sessions.filter(s => s.status === 'active');
    const inProgressSessions = sessions.filter(s => s.status === 'in_progress' && !s.completed);
    const totalSessions = sessions.length;
    
    // Calculate average score from completed sessions
    let totalScore = 0;
    let scoreCount = 0;
    completedSessions.forEach(session => {
      if (session.summary && session.summary.overallScore && !isNaN(parseFloat(session.summary.overallScore))) {
        totalScore += parseFloat(session.summary.overallScore);
        scoreCount++;
      }
    });
    const averageScore = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(1)) : null;

    // Calculate role frequency
    const roleCount = {};
    sessions.forEach(session => {
      roleCount[session.role] = (roleCount[session.role] || 0) + 1;
    });
    const topRoles = Object.entries(roleCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([role, count]) => ({ role, count }));

    // Calculate streak (simplified - just count recent days)
    const today = new Date();
    const recentSessions = sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });
    const streakDays = recentSessions.length > 0 ? Math.min(recentSessions.length, 7) : 0;

    // Weekly progress (last 7 days)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const daySessionsCount = sessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate.toDateString() === date.toDateString();
      }).length;
      
      weeklyProgress.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: daySessionsCount
      });
    }

    setStats({
      totalSessions,
      completedSessions: completedSessions.length,
      activeSessions: activeSessions.length,
      inProgressSessions: inProgressSessions.length,
      averageScore,
      streakDays,
      topRoles,
      weeklyProgress,
      recentSessions: recentSessions.length,
      lastSessionDate: sessions.length > 0 ? sessions[0].createdAt : null
    });
  };

  const handleViewSession = (sessionId) => navigate(`/session/${sessionId}`);
  const handleContinueSession = (sessionId) => navigate(`/interview?sessionId=${sessionId}`);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (session) => {
    if (session.completed && session.status === 'completed') return 'status-completed';
    if (session.status === 'in_progress') return 'status-in-progress';
    return 'status-active';
  };

  const getStatusText = (session) => {
    if (session.completed && session.status === 'completed') return 'Completed';
    if (session.status === 'in_progress') return 'In Progress';
    return 'Active';
  };

  const getScoreDisplay = (session) => {
    let score = session.summary?.overallScore ?? session.summary?.score ?? null;
    if (score !== null) {
      const n = parseFloat(score);
      if (!isNaN(n)) return `${n}/10`;
    }
    if (session.completed && session.status === 'completed') return 'Completed';
    return 'N/A';
  };

  const getScoreColor = (score) => {
    const n = parseFloat(score);
    if (isNaN(n)) return 'text-gray-600 dark:text-gray-400';
    if (n >= 8) return 'text-green-600 dark:text-green-400';
    if (n >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Pagination calculations
  const mobileTotalPages = Math.ceil(sessions.length / MOBILE_PER_PAGE);
  const desktopTotalPages = Math.ceil(sessions.length / DESKTOP_PER_PAGE);
  const mobileSessions = sessions.slice((mobilePage - 1) * MOBILE_PER_PAGE, mobilePage * MOBILE_PER_PAGE);
  const desktopSessions = sessions.slice((desktopPage - 1) * DESKTOP_PER_PAGE, desktopPage * DESKTOP_PER_PAGE);

  if (loading) {
    return <LoadingPage message="Loading your progress data..." />;
  }

  return (
    <div className="container-responsive section-spacing">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light-text dark:text-dark-text mb-2">
          Your <span className="gradient-text">Progress</span>
        </h1>
        <p className="text-light-text/70 dark:text-dark-text/70 text-sm sm:text-base">
          Track your interview preparation journey and identify areas for improvement.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl mr-3 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60 truncate">Total Sessions</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl mr-3 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60 truncate">Completed</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl mr-3 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60 truncate">Avg Score</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.averageScore !== null && stats.averageScore !== undefined ? `${stats.averageScore}/10` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="progress-card card-interactive">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl mr-3 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-light-text/60 dark:text-dark-text/60 truncate">Streak Days</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">{stats.streakDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
        {/* Weekly Activity */}
        <div className="card card-elevated">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-light-text dark:text-dark-text mb-4 sm:mb-6">
              Weekly Activity
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {stats.weeklyProgress.map((day, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-sm font-medium text-light-text/60 dark:text-dark-text/60 w-10 sm:w-12">
                    {day.date}
                  </span>
                  <div className="flex-1 mx-3 sm:mx-4">
                    <div className="bg-light-border dark:bg-dark-border rounded-full h-2">
                      <div 
                        className="bg-forest dark:bg-sage h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(day.count * 33.33, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-light-text/60 dark:text-dark-text/60 font-medium min-w-[2rem] text-right">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Roles */}
        <div className="card card-elevated">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-light-text dark:text-dark-text mb-4 sm:mb-6">
              Most Practiced Roles
            </h3>
            <div className="space-y-4">
              {stats.topRoles.length > 0 ? (
                stats.topRoles.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-forest/10 dark:bg-sage/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm sm:text-base font-medium text-forest dark:text-sage">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm sm:text-base font-medium text-light-text dark:text-dark-text truncate">
                        {item.role}
                      </span>
                    </div>
                    <div className="flex items-center ml-4 flex-shrink-0">
                      <div className="w-16 sm:w-20 bg-light-border dark:bg-dark-border rounded-full h-2 mr-3">
                        <div 
                          className="bg-forest dark:bg-sage h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(item.count / stats.totalSessions) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm sm:text-base text-light-text/60 dark:text-dark-text/60 font-medium min-w-[1.5rem]">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 p-2 bg-forest/10 dark:bg-sage/10 rounded-full">
                    <svg className="w-full h-full text-forest/40 dark:text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-light-text/60 dark:text-dark-text/60 text-sm">
                    No practice sessions yet. Start your first interview!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="card card-elevated mb-8 sm:mb-12">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-light-text dark:text-dark-text mb-4 sm:mb-6">
            Your Achievements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl text-center transition-all duration-200 ${
              stats.totalSessions >= 1 
                ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 scale-100' 
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-50'
            }`}>
              <div className="text-2xl sm:text-3xl mb-2">🎯</div>
              <p className="text-xs sm:text-sm font-medium text-light-text dark:text-dark-text">First Interview</p>
              <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">Complete 1 session</p>
              {stats.totalSessions >= 1 && (
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-2"></div>
              )}
            </div>
            
            <div className={`p-4 rounded-xl text-center transition-all duration-200 ${
              stats.totalSessions >= 5 
                ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 scale-100' 
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-50'
            }`}>
              <div className="text-2xl sm:text-3xl mb-2">🚀</div>
              <p className="text-xs sm:text-sm font-medium text-light-text dark:text-dark-text">Getting Started</p>
              <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">Complete 5 sessions</p>
              {stats.totalSessions >= 5 && (
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-2"></div>
              )}
            </div>
            
            <div className={`p-4 rounded-xl text-center transition-all duration-200 ${
              stats.streakDays >= 3 
                ? 'bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 scale-100' 
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-50'
            }`}>
              <div className="text-2xl sm:text-3xl mb-2">🔥</div>
              <p className="text-xs sm:text-sm font-medium text-light-text dark:text-dark-text">On Fire</p>
              <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">3 day streak</p>
              {stats.streakDays >= 3 && (
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-2"></div>
              )}
            </div>
            
            <div className={`p-4 rounded-xl text-center transition-all duration-200 ${
              stats.averageScore !== null && stats.averageScore >= 8 
                ? 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 scale-100' 
                : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-50'
            }`}>
              <div className="text-2xl sm:text-3xl mb-2">⭐</div>
              <p className="text-xs sm:text-sm font-medium text-light-text dark:text-dark-text">High Achiever</p>
              <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">8+ average score</p>
              {stats.averageScore !== null && stats.averageScore >= 8 && (
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-2"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      {stats.lastSessionDate && (
        <div className="card card-elevated mb-8 sm:mb-12">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-forest/5 dark:bg-sage/5 rounded-lg">
                <div>
                  <p className="font-medium text-light-text dark:text-dark-text">Last session</p>
                  <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                    {new Date(stats.lastSessionDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-forest dark:text-sage">
                    {stats.recentSessions} sessions
                  </p>
                  <p className="text-xs text-light-text/60 dark:text-dark-text/60">this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Sessions */}
      <div className="card card-elevated">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-light-text dark:text-dark-text">
              All Sessions
            </h3>
            {sessions.length > 0 && (
              <span className="text-sm text-light-text/60 dark:text-dark-text/60">
                {sessions.length} total
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-forest/10 dark:bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-light-text/60 dark:text-dark-text/60">
                No sessions yet. Start your first interview!
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block sm:hidden space-y-4">
                {mobileSessions.map((session) => (
                  <div key={session.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-light-text dark:text-dark-text">{session.role}</h4>
                        <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">{formatDate(session.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`status-badge ${getDifficultyColor(session.difficulty)}`}>{session.difficulty}</span>
                        <span className={`status-badge ${getStatusColor(session)}`}>{getStatusText(session)}</span>
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
                          <Button variant="primary" size="sm" onClick={() => handleContinueSession(session.id)}>Continue</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleViewSession(session.id)}>View</Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile Pagination */}
                {mobileTotalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobilePage(p => Math.max(1, p - 1))}
                      disabled={mobilePage === 1}
                    >
                      Prev
                    </Button>
                    {Array.from({ length: mobileTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setMobilePage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          mobilePage === page
                            ? 'bg-forest dark:bg-sage text-white dark:text-dark-bg'
                            : 'text-light-text/60 dark:text-dark-text/60 hover:bg-forest/10 dark:hover:bg-sage/10'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobilePage(p => Math.min(mobileTotalPages, p + 1))}
                      disabled={mobilePage === mobileTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
                    <thead className="bg-light-bg/50 dark:bg-dark-bg/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">Role & Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">Questions</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-light-text/60 dark:text-dark-text/60 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-muted divide-y divide-light-border dark:divide-dark-border">
                      {desktopSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-light-text dark:text-dark-text">{session.role}</div>
                            {session.description && (
                              <div className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">{session.description}</div>
                            )}
                            <div className="text-xs text-light-text/50 dark:text-dark-text/50 mt-1">{formatDate(session.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`status-badge ${getDifficultyColor(session.difficulty)}`}>{session.difficulty}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`status-badge ${getStatusColor(session)}`}>{getStatusText(session)}</span>
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
                              <Button variant="primary" size="sm" onClick={() => handleContinueSession(session.id)}>Continue</Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleViewSession(session.id)}>View Details</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Desktop Pagination */}
                {desktopTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-bg/30">
                    <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                      Showing {(desktopPage - 1) * DESKTOP_PER_PAGE + 1}–{Math.min(desktopPage * DESKTOP_PER_PAGE, sessions.length)} of {sessions.length}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDesktopPage(p => Math.max(1, p - 1))}
                        disabled={desktopPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: desktopTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setDesktopPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            desktopPage === page
                              ? 'bg-forest dark:bg-sage text-white dark:text-dark-bg'
                              : 'text-light-text/60 dark:text-dark-text/60 hover:bg-forest/10 dark:hover:bg-sage/10'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDesktopPage(p => Math.min(desktopTotalPages, p + 1))}
                        disabled={desktopPage === desktopTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
