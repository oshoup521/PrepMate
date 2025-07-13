import React from 'react';
import { Button } from './LoadingSpinner';

const InterviewSummary = ({ summary, onReset }) => {
  if (!summary) return null;

  // Calculate overall score from individual questions
  const calculateOverallScore = () => {
    if (summary.questions && summary.questions.length > 0) {
      const scores = summary.questions
        .map(q => q.score)
        .filter(score => score !== undefined && score !== null && !isNaN(score));
      
      if (scores.length > 0) {
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      }
    }
    return 0;
  };

  const overallScore = summary.aiSummary?.overallScore || calculateOverallScore();
  const hasAISummary = summary.aiSummary && typeof summary.aiSummary === 'object';

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20';
    if (score >= 6) return 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20';
    return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
  };

  return (
    <div className="container-responsive section-spacing animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light-text dark:text-dark-text mb-4">
          Interview <span className="gradient-text">Complete!</span>
        </h1>
        <p className="text-light-text/70 dark:text-dark-text/70 text-sm sm:text-base mb-4">
          Great job on completing your {summary.role} interview at {summary.difficulty} level.
        </p>
        {hasAISummary && (
          <div className="inline-flex items-center px-3 py-1 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            AI-Powered Analysis
          </div>
        )}
      </div>

      {/* Overall Score Card */}
      <div className={`summary-card mb-8 bg-gradient-to-br ${getScoreBgColor(overallScore)} border-2 ${overallScore >= 8 ? 'border-green-200 dark:border-green-700' : overallScore >= 6 ? 'border-yellow-200 dark:border-yellow-700' : 'border-red-200 dark:border-red-700'}`}>
        <div className="text-center">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                Overall Performance
              </h2>
              <div className={`summary-score ${getScoreColor(overallScore)}`}>
                {overallScore}/10
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              <div className="mb-2">
                <span className="text-sm font-medium text-light-text/60 dark:text-dark-text/60">Questions Answered</span>
                <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                  {summary.questions?.length || 0}
                </div>
              </div>
              <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                {overallScore >= 8 ? 'Excellent performance!' : overallScore >= 6 ? 'Good performance!' : 'Room for improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      {hasAISummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Strengths */}
          {summary.aiSummary.strengths && (
            <div className="card card-elevated">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">Strengths</h3>
                </div>
                <div className="space-y-3">
                  {Array.isArray(summary.aiSummary.strengths) ? (
                    summary.aiSummary.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-light-text dark:text-dark-text">{strength}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-light-text dark:text-dark-text">{summary.aiSummary.strengths}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {summary.aiSummary.improvements && (
            <div className="card card-elevated">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">Areas for Improvement</h3>
                </div>
                <div className="space-y-3">
                  {Array.isArray(summary.aiSummary.improvements) ? (
                    summary.aiSummary.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-light-text dark:text-dark-text">{improvement}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-light-text dark:text-dark-text">{summary.aiSummary.improvements}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {summary.aiSummary.recommendations && (
            <div className="card card-elevated lg:col-span-2">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">Recommendations</h3>
                </div>
                <div className="space-y-3">
                  {Array.isArray(summary.aiSummary.recommendations) ? (
                    summary.aiSummary.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-light-text dark:text-dark-text">{rec}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-light-text dark:text-dark-text">{summary.aiSummary.recommendations}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Technical Assessment */}
          {summary.aiSummary.technicalAssessment && (
            <div className="card card-elevated lg:col-span-2">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">Technical Assessment</h3>
                </div>
                <p className="text-sm text-light-text dark:text-dark-text leading-relaxed">
                  {summary.aiSummary.technicalAssessment}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question by Question Review */}
      <div className="card card-elevated mb-8 sm:mb-12">
        <div className="px-4 sm:px-6 py-4 border-b border-light-border dark:border-dark-border">
          <h3 className="text-xl font-semibold text-light-text dark:text-dark-text">
            Question-by-Question Review
          </h3>
          <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
            Detailed feedback for each answer you provided
          </p>
        </div>
        
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {summary.questions && summary.questions.length > 0 ? (
            summary.questions.map((qa, index) => (
              <div key={index} className="p-4 sm:p-6 hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors duration-200">
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                    <h4 className="text-base font-medium text-light-text dark:text-dark-text mb-2 sm:mb-0 flex-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      Question
                    </h4>
                    {qa.score !== undefined && qa.score !== null && (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        qa.score >= 8 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        qa.score >= 6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {qa.score}/10
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-light-text/80 dark:text-dark-text/80 bg-forest/5 dark:bg-sage/5 p-3 rounded-lg border-l-4 border-forest dark:border-sage">
                    {qa.question}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-light-text dark:text-dark-text mb-2">Your Answer:</h5>
                  <p className="text-sm text-light-text/80 dark:text-dark-text/80 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                    {qa.answer}
                  </p>
                </div>
                
                {qa.feedback && (
                  <div className="feedback-section p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 rounded-full bg-olive dark:bg-sage text-white flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-olive dark:text-sage">AI Feedback</span>
                    </div>
                    <p className="text-sm text-light-text/90 dark:text-dark-text/90 italic">
                      {qa.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 p-2 bg-forest/10 dark:bg-sage/10 rounded-full">
                <svg className="w-full h-full text-forest/40 dark:text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-light-text/60 dark:text-dark-text/60">
                No questions were recorded during this session.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error handling for failed AI summary */}
      {summary.error && (
        <div className="card p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-8">
          <div className="flex items-start">
            <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                AI Analysis Unavailable
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {summary.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onReset}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Start New Interview
        </Button>
        
        <Button
          onClick={() => window.history.back()}
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto"
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          }
        >
          Back to Dashboard
        </Button>
        
        <button
          onClick={() => window.print()}
          className="btn btn-ghost btn-lg w-full sm:w-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Summary
        </button>
      </div>
    </div>
  );
};

export default InterviewSummary;
