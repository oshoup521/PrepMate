import React, { useState, useEffect } from 'react';
import interviewService from '../services/interviewService';
import { LoadingPage } from './LoadingSpinner';

const Progress = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0,
    streakDays: 0,
    topRoles: [],
    weeklyProgress: []
  });

  useEffect(() => {
    fetchSessionsAndCalculateStats();
  }, []);
  const fetchSessionsAndCalculateStats = async () => {
    try {
      setLoading(true);
      const userSessions = await interviewService.getUserSessions();
      setSessions(userSessions);
      calculateStats(userSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Error is already handled by the interceptor and shown as toast
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessions) => {
    const completedSessions = sessions.filter(s => s.completed);
    const totalSessions = sessions.length;
    
    // Calculate average score from completed sessions
    let totalScore = 0;
    let scoreCount = 0;
    completedSessions.forEach(session => {
      if (session.summary && session.summary.overallScore) {
        totalScore += parseFloat(session.summary.overallScore);
        scoreCount++;
      }
    });
    const averageScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;

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
      averageScore,
      streakDays,
      topRoles,
      weeklyProgress
    });
  };
  if (loading) {
    return <LoadingPage message="Loading your progress data..." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Progress
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your interview preparation journey and identify areas for improvement.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}/10</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streakDays}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Activity
          </h3>
          <div className="space-y-3">
            {stats.weeklyProgress.map((day, index) => (
              <div key={index} className="flex items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                  {day.date}
                </span>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(day.count * 33.33, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {day.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Practiced Roles
          </h3>
          <div className="space-y-4">
            {stats.topRoles.length > 0 ? (
              stats.topRoles.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.role}
                  </span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / stats.totalSessions) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No practice sessions yet. Start your first interview!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg text-center ${stats.totalSessions >= 1 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm font-medium">First Interview</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Complete 1 session</p>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${stats.totalSessions >= 5 ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-sm font-medium">Getting Started</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Complete 5 sessions</p>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${stats.streakDays >= 3 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-2xl mb-2">🔥</div>
            <p className="text-sm font-medium">On Fire</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">3 day streak</p>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${stats.averageScore >= 8 ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-2xl mb-2">⭐</div>
            <p className="text-sm font-medium">High Achiever</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">8+ average score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
