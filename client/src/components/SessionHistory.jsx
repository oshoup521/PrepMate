import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import { LoadingPage, Button } from './LoadingSpinner';
import { showErrorToast, showSuccessToast, showLoadingToast, dismissToast } from '../utils/errorHandler';

const SessionHistory = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const sessionData = await interviewService.getSession(sessionId);
      setSession(sessionData);
    } catch (error) {
      console.error('Failed to fetch session:', error);
      showErrorToast('Failed to load session data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = () => {
    navigate(`/interview?sessionId=${sessionId}`);
  };

  const handleEndSession = async () => {
    if (!session) return;

    setIsEndingSession(true);
    const endingToast = showLoadingToast('Ending interview session and generating summary...');

    try {
      await interviewService.endSession(sessionId);
      
      dismissToast(endingToast);
      showSuccessToast('Interview session ended successfully!');
      
      // Refresh the session data to show the updated status
      await fetchSession();
      
    } catch (error) {
      console.error('Failed to end session:', error);
      dismissToast(endingToast);
      showErrorToast('Failed to end session. Please try again.');
    } finally {
      setIsEndingSession(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const isActiveSession = session && !session.completed && (session.status === 'active' || session.status === 'in_progress');

  if (loading) {
    return <LoadingPage message="Loading interview session..." />;
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Session Not Found
          </h1>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
              {session.role} Interview
            </h1>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(session.difficulty)}`}>
                {session.difficulty}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                session.completed 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {session.completed ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Date:</span>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(session.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Questions:</span>
              <p className="font-medium text-gray-900 dark:text-white">{session.questions?.length || 0}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Answers:</span>
              <p className="font-medium text-gray-900 dark:text-white">{session.answers?.length || 0}</p>
            </div>
          </div>

          {/* Action Buttons for Active Sessions */}
          {isActiveSession && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleResumeSession}
                  variant="primary"
                  size="lg"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a4 4 0 014-4h4a4 4 0 014 4v2" />
                    </svg>
                  }
                >
                  Resume Interview
                </Button>
                <Button
                  onClick={handleEndSession}
                  variant="secondary"
                  size="lg"
                  loading={isEndingSession}
                  loadingText="Ending Session..."
                  leftIcon={
                    !isEndingSession && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )
                  }
                >
                  End Session
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Resume to continue the interview or end the session to generate a summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Questions and Answers */}
      {session.questions && session.questions.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Interview Questions & Answers</h2>
          
          {session.questions.map((question, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 ml-9">{question}</p>
              </div>
              
              {session.answers && session.answers[index] && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center mr-3">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Answer</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 ml-9 mb-4">{session.answers[index]}</p>
                </div>
              )}

              {!session.answers || !session.answers[index] ? (
                <div className="ml-9 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-300 text-sm">No answer recorded for this question.</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Interview Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This session doesn't have any recorded questions or answers yet.
          </p>
          
          {/* Show action buttons even when no data for active sessions */}
          {isActiveSession && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleResumeSession}
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a4 4 0 014-4h4a4 4 0 014 4v2" />
                  </svg>
                }
              >
                Resume Interview
              </Button>
              <Button
                onClick={handleEndSession}
                variant="secondary"
                loading={isEndingSession}
                loadingText="Ending Session..."
                leftIcon={
                  !isEndingSession && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }
              >
                End Session
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      {session.summary && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Interview Summary</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.summary.overallScore && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Overall Score</h3>
                  <p className={`text-2xl font-bold ${getScoreColor(session.summary.overallScore)}`}>
                    {session.summary.overallScore}/10
                  </p>
                </div>
              )}
              
              {session.summary.strengths && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Strengths</h3>
                  <p className="text-gray-700 dark:text-gray-300">{session.summary.strengths}</p>
                </div>
              )}
              
              {session.summary.improvements && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Areas for Improvement</h3>
                  <p className="text-gray-700 dark:text-gray-300">{session.summary.improvements}</p>
                </div>
              )}
              
              {session.summary.recommendations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recommendations</h3>
                  <p className="text-gray-700 dark:text-gray-300">{session.summary.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
