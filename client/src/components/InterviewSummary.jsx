import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './LoadingSpinner';

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const InterviewSummary = ({ summary, onReset, questionTimings = [] }) => {
  const navigate = useNavigate();
  if (!summary) return null;

  // Render inline markdown (bold, italic, code) within a single line of text
  const renderInline = (text) => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index} className="font-semibold text-light-text dark:text-dark-text">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return <code key={index} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded font-mono text-blue-600 dark:text-blue-400">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // Helper function to convert markdown-style text to JSX
  const renderMarkdownText = (text) => {
    if (!text || typeof text !== 'string') return text;

    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.trim() === '') {
        return <div key={i} className="h-1" />;
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-base font-bold text-light-text dark:text-dark-text mt-4 mb-1">
            {renderInline(line.slice(4))}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-lg font-bold text-light-text dark:text-dark-text mt-4 mb-1">
            {renderInline(line.slice(3))}
          </h2>
        );
      }
      // Sub-bullet (4 spaces or tab before -)
      if (/^(\s{4}|\t)- /.test(line)) {
        return (
          <div key={i} className="flex items-start ml-5 mt-1">
            <span className="text-blue-400 mr-2 flex-shrink-0 text-xs mt-1">◦</span>
            <span className="text-light-text/80 dark:text-dark-text/80 text-sm">{renderInline(line.replace(/^(\s+- )/, ''))}</span>
          </div>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start mt-2">
            <span className="text-blue-500 mr-2 flex-shrink-0 mt-0.5">•</span>
            <span className="text-light-text/80 dark:text-dark-text/80 text-sm">{renderInline(line.slice(2))}</span>
          </div>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-blue-500 pl-4 my-2 text-light-text/80 dark:text-dark-text/80 italic text-sm">
            {renderInline(line.slice(2))}
          </blockquote>
        );
      }
      return (
        <p key={i} className="text-light-text/80 dark:text-dark-text/80 text-sm mt-1">
          {renderInline(line)}
        </p>
      );
    });
  };

  // Extract key data – coerce score to number (guard against 'N/A' strings)
  const rawScore = summary.overallScore ?? summary.aiSummary?.overallScore ?? 0;
  const overallScore = isNaN(Number(rawScore)) ? 0 : Number(rawScore);
  const questionsCount = summary.totalQuestions || summary.questions?.length || 0;
  const answersCount = summary.totalAnswers || summary.answers?.length || questionsCount;
  const role = summary.role || 'Interview';
  const difficulty = summary.difficulty || 'intermediate';

  // Helper function to safely extract and parse data
  const safeExtractArray = (data) => {
    if (!data) return [];
    
    // If it's already an array, return it
    if (Array.isArray(data)) return data;
    
    // If it's a string that looks like JSON, try to parse it
    if (typeof data === 'string') {
      // Check if it looks like JSON
      if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === 'object' && parsed.strengths) return parsed.strengths;
          if (typeof parsed === 'object' && parsed.improvements) return parsed.improvements;
          return [data]; // Return as single item if can't extract array
        } catch (e) {
          // If JSON parsing fails, treat as regular string
          return [data];
        }
      }
      // If it's a regular string, return as single item
      return [data];
    }
    
    // If it's an object, try to extract relevant fields
    if (typeof data === 'object') {
      if (data.strengths && Array.isArray(data.strengths)) return data.strengths;
      if (data.improvements && Array.isArray(data.improvements)) return data.improvements;
      return [data.toString()];
    }
    
    return [data.toString()];
  };

  // Get strengths and improvements as arrays with safe parsing
  const strengths = safeExtractArray(summary.strengths);
  const improvements = safeExtractArray(summary.improvements);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20';
    if (score >= 6) return 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20';
    if (score >= 4) return 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20';
    return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
  };

  const getPerformanceText = (score) => {
    if (score >= 8) return 'Excellent!';
    if (score >= 6) return 'Good Job!';
    if (score >= 4) return 'Not Bad!';
    return 'Keep Practicing!';
  };

  const getScoreIcon = (score) => {
    if (score >= 8) return '🎉';
    if (score >= 6) return '👍';
    if (score >= 4) return '💪';
    return '📚';
  };

  const hasTimings = questionTimings.length > 0;
  const totalTime = hasTimings ? questionTimings.reduce((a, b) => a + b, 0) : 0;
  const avgTime = hasTimings ? Math.round(totalTime / questionTimings.length) : 0;
  const maxTime = hasTimings ? Math.max(...questionTimings) : 0;

  return (
    <div className="bg-gradient-to-br from-light-bg via-light-bg to-forest/5 dark:from-dark-bg dark:via-dark-bg dark:to-sage/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{getScoreIcon(overallScore)}</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-light-text dark:text-dark-text mb-2">
              Interview Complete!
            </h1>
            <p className="text-light-text/70 dark:text-dark-text/70">
              {role} • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
            </p>
          </div>

          {/* Score Card */}
          <div className={`card p-6 mb-8 bg-gradient-to-br ${getScoreBg(overallScore)} border-2 border-forest/20 dark:border-sage/20`}>
            <div className="text-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                    Your Score
                  </h2>
                  <div className={`text-5xl font-bold ${getScoreColor(overallScore)} mb-2`}>
                    {questionsCount > 0 && answersCount > 0 && overallScore > 0 ? `${overallScore}/10` : 'N/A'}
                  </div>
                  <p className={`text-lg font-semibold ${getScoreColor(overallScore)}`}>
                    {getPerformanceText(overallScore)}
                  </p>
                </div>
                
                <div className="flex justify-center sm:justify-end flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                      {questionsCount}
                    </div>
                    <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                      Questions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                      {answersCount}
                    </div>
                    <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                      Answered
                    </div>
                  </div>
                  {hasTimings && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold font-mono text-light-text dark:text-dark-text">
                          {formatTime(totalTime)}
                        </div>
                        <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                          Total Time
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold font-mono text-light-text dark:text-dark-text">
                          {formatTime(avgTime)}
                        </div>
                        <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                          Avg / Question
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Time Breakdown */}
          {hasTimings && (
            <div className="card p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                  Time Per Question
                </h3>
              </div>

              <div className="space-y-3">
                {questionTimings.map((t, i) => {
                  const pct = maxTime > 0 ? Math.round((t / maxTime) * 100) : 0;
                  const isSlower = t === maxTime && questionTimings.length > 1;
                  const isFastest = t === Math.min(...questionTimings) && questionTimings.length > 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-light-text/60 dark:text-dark-text/60 w-6 text-right flex-shrink-0">
                        Q{i + 1}
                      </span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isSlower  ? 'bg-red-400 dark:bg-red-500' :
                            isFastest ? 'bg-green-500 dark:bg-green-400' :
                            'bg-indigo-400 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono w-10 flex-shrink-0 ${
                        isSlower  ? 'text-red-500 dark:text-red-400' :
                        isFastest ? 'text-green-600 dark:text-green-400' :
                        'text-light-text/70 dark:text-dark-text/70'
                      }`}>
                        {formatTime(t)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {questionTimings.length > 1 && (
                <div className="mt-4 flex gap-4 text-xs text-light-text/50 dark:text-dark-text/50">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    Fastest: {formatTime(Math.min(...questionTimings))}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                    Slowest: {formatTime(maxTime)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Feedback Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            
            {/* Strengths */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                  What You Did Well
                </h3>
              </div>
              
              {strengths.length > 0 ? (
                <ul className="space-y-2">
                  {strengths.slice(0, 3).map((strength, index) => {
                    // Clean up the strength text
                    let strengthText = typeof strength === 'string' ? strength : strength.toString();
                    
                    // If it looks like JSON, try to extract meaningful content
                    if (strengthText.trim().startsWith('{') || strengthText.trim().startsWith('[')) {
                      try {
                        const parsed = JSON.parse(strengthText);
                        if (typeof parsed === 'string') {
                          strengthText = parsed;
                        } else if (Array.isArray(parsed) && parsed.length > 0) {
                          strengthText = parsed[0];
                        } else if (typeof parsed === 'object') {
                          // Extract first meaningful string from object
                          const values = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 5);
                          strengthText = values[0] || strengthText;
                        }
                      } catch (e) {
                        // Keep original text if parsing fails
                      }
                    }
                    
                    return (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">•</span>
                        <span className="text-light-text/80 dark:text-dark-text/80 text-sm leading-relaxed">
                          {renderMarkdownText(strengthText)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-light-text/60 dark:text-dark-text/60 text-sm">
                  Great job completing the interview! Keep practicing to improve your skills.
                </p>
              )}
            </div>

            {/* Areas for Improvement */}
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                  Areas to Focus On
                </h3>
              </div>
              
              {improvements.length > 0 ? (
                <ul className="space-y-2">
                  {improvements.slice(0, 3).map((improvement, index) => {
                    // Clean up the improvement text
                    let improvementText = typeof improvement === 'string' ? improvement : improvement.toString();
                    
                    // If it looks like JSON, try to extract meaningful content
                    if (improvementText.trim().startsWith('{') || improvementText.trim().startsWith('[')) {
                      try {
                        const parsed = JSON.parse(improvementText);
                        if (typeof parsed === 'string') {
                          improvementText = parsed;
                        } else if (Array.isArray(parsed) && parsed.length > 0) {
                          improvementText = parsed[0];
                        } else if (typeof parsed === 'object') {
                          // Extract first meaningful string from object
                          const values = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 5);
                          improvementText = values[0] || improvementText;
                        }
                      } catch (e) {
                        // Keep original text if parsing fails
                      }
                    }
                    
                    return (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <span className="text-light-text/80 dark:text-dark-text/80 text-sm leading-relaxed">
                          {renderMarkdownText(improvementText)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-light-text/60 dark:text-dark-text/60 text-sm">
                  Continue practicing to enhance your interview skills further.
                </p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {summary.recommendations && (
            <div className="card p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l1.09 3.26L16 7.27l-2.91 1.01L12 12l-1.09-3.26L8 7.27l2.91-1.01L12 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                  Next Steps
                </h3>
              </div>
              
              <div className="text-light-text/80 dark:text-dark-text/80 text-sm leading-relaxed">
                {(() => {
                  let recommendationsText = summary.recommendations;
                  
                  // If recommendations is an object or JSON string, try to extract meaningful text
                  if (typeof recommendationsText === 'object') {
                    recommendationsText = JSON.stringify(recommendationsText, null, 2);
                  }
                  
                  // If it's a string that looks like JSON, try to parse and extract content
                  if (typeof recommendationsText === 'string' && recommendationsText.trim().startsWith('{')) {
                    try {
                      const parsed = JSON.parse(recommendationsText);
                      if (parsed.recommendations) {
                        recommendationsText = parsed.recommendations;
                      } else if (parsed.text) {
                        recommendationsText = parsed.text;
                      } else {
                        // Extract first meaningful string value from the object
                        const values = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 10);
                        recommendationsText = values[0] || 'Continue practicing to improve your interview skills.';
                      }
                    } catch (e) {
                      recommendationsText = 'Continue practicing to improve your interview skills.';
                    }
                  }
                  
                  return renderMarkdownText(recommendationsText || 'Continue practicing to improve your interview skills.');
                })()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button
              onClick={onReset}
              variant="primary"
              className="px-8 py-3 text-lg"
            >
              Start New Interview
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSummary;
