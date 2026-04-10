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
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
      <div className="container-responsive section-spacing">
        <div className="card text-center py-12">
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-4">
            Session Not Found
          </h1>
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive section-spacing">

      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center text-sm text-forest dark:text-sage hover:opacity-80 transition-opacity mb-6"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Session Header Card */}
      <div className="card p-6 mb-6">
        {/* Title + badges */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
            {session.role} Interview
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`status-badge ${getDifficultyColor(session.difficulty)}`}>
              {session.difficulty}
            </span>
            <span className={`status-badge ${
              session.completed
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            }`}>
              {session.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Meta row — date is full-width on mobile, inline on sm+ */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm mb-5">
          <div className="w-full sm:w-auto">
            <p className="text-light-text/50 dark:text-dark-text/50 mb-0.5">Date</p>
            <p className="font-medium text-light-text dark:text-dark-text">{formatDate(session.createdAt)}</p>
          </div>
          <div>
            <p className="text-light-text/50 dark:text-dark-text/50 mb-0.5">Questions</p>
            <p className="font-medium text-light-text dark:text-dark-text">{session.questions?.length || 0}</p>
          </div>
          <div>
            <p className="text-light-text/50 dark:text-dark-text/50 mb-0.5">Answers</p>
            <p className="font-medium text-light-text dark:text-dark-text">{session.answers?.length || 0}</p>
          </div>
        </div>

        {/* Action buttons — shown once, only for active sessions */}
        {isActiveSession && (
          <div className="pt-4 border-t border-light-border dark:border-dark-border">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleResumeSession}
                variant="primary"
                size="lg"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Resume Interview
              </Button>
              <Button
                onClick={handleEndSession}
                variant="outline"
                size="lg"
                loading={isEndingSession}
                loadingText="Ending Session..."
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
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
            <p className="text-xs text-light-text/50 dark:text-dark-text/50 mt-2">
              Resume to continue the interview or end the session to generate a summary.
            </p>
          </div>
        )}
      </div>

      {/* Questions & Answers */}
      {session.questions && session.questions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">
            Interview Questions &amp; Answers
          </h2>

          {session.questions.map((question, index) => (
            <div key={index} className="card p-6">
              {/* Question */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold text-forest dark:text-sage uppercase tracking-wide mb-1">Question</p>
                  <p className="text-light-text dark:text-dark-text leading-relaxed">{question}</p>
                </div>
              </div>

              {/* Answer */}
              {session.answers?.[index] ? (
                <div className="flex items-start gap-3 pl-10">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Your Answer</p>
                    <p className="text-light-text/80 dark:text-dark-text/80 leading-relaxed">{session.answers[index]}</p>
                  </div>
                </div>
              ) : (
                <div className="ml-10 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/40 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">No answer recorded for this question.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty state — no redundant buttons here */
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-light-text/30 dark:text-dark-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
            No Interview Data
          </h3>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm">
            This session doesn't have any recorded questions or answers yet.
          </p>
        </div>
      )}

      {/* Summary Section */}
      {session.summary && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">Interview Summary</h2>
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.summary.overallScore && (
                <div>
                  <p className="text-xs font-semibold text-light-text/50 dark:text-dark-text/50 uppercase tracking-wide mb-1">Overall Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(session.summary.overallScore)}`}>
                    {session.summary.overallScore}/10
                  </p>
                </div>
              )}
              {session.summary.strengths && (
                <div>
                  <p className="text-xs font-semibold text-light-text/50 dark:text-dark-text/50 uppercase tracking-wide mb-1">Strengths</p>
                  <p className="text-light-text/80 dark:text-dark-text/80 text-sm leading-relaxed">{session.summary.strengths}</p>
                </div>
              )}
              {session.summary.improvements && (
                <div>
                  <p className="text-xs font-semibold text-light-text/50 dark:text-dark-text/50 uppercase tracking-wide mb-1">Areas for Improvement</p>
                  <p className="text-light-text/80 dark:text-dark-text/80 text-sm leading-relaxed">{session.summary.improvements}</p>
                </div>
              )}
              {session.summary.recommendations && (
                <div>
                  <p className="text-xs font-semibold text-light-text/50 dark:text-dark-text/50 uppercase tracking-wide mb-1">Recommendations</p>
                  <p className="text-light-text/80 dark:text-dark-text/80 text-sm leading-relaxed">{session.summary.recommendations}</p>
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
