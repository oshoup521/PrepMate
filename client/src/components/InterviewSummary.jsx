import React from 'react';
import { Button } from './LoadingSpinner';

const InterviewSummary = ({ summary, onReset }) => {
  if (!summary) return null;

  // Helper function to convert markdown-style text to JSX
  const renderMarkdownText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Process the text step by step to handle multiple markdown features
    let processedText = text;
    const elements = [];
    let currentIndex = 0;
    
    // Split by various markdown patterns
    const markdownPatterns = [
      { pattern: /(\*\*[^*]+?\*\*)/g, type: 'bold' },
      { pattern: /(\*[^*]+?\*)/g, type: 'italic' },
      { pattern: /(`[^`]+?`)/g, type: 'code' },
      { pattern: /(### [^\n]+)/g, type: 'header' },
      { pattern: /(^- [^\n]+)/gm, type: 'bullet' },
      { pattern: /(^> [^\n]+)/gm, type: 'quote' }
    ];
    
    // Simple approach: handle bold, italic, and code inline
    const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|### [^\n]+|^- [^\n]+|^> [^\n]+)/gm);
    
    return parts.map((part, index) => {
      // Bold text
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-semibold text-light-text dark:text-dark-text">
            {boldText}
          </strong>
        );
      }
      
      // Italic text
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
        const italicText = part.slice(1, -1);
        return (
          <em key={index} className="italic text-light-text dark:text-dark-text">
            {italicText}
          </em>
        );
      }
      
      // Code text
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const codeText = part.slice(1, -1);
        return (
          <code key={index} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded font-mono text-blue-600 dark:text-blue-400">
            {codeText}
          </code>
        );
      }
      
      // Header text
      if (part.startsWith('### ')) {
        const headerText = part.slice(4);
        return (
          <h3 key={index} className="text-lg font-bold text-light-text dark:text-dark-text mt-4 mb-2">
            {headerText}
          </h3>
        );
      }
      
      // Bullet points
      if (part.startsWith('- ')) {
        const bulletText = part.slice(2);
        return (
          <div key={index} className="flex items-start mt-2">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span className="text-light-text/80 dark:text-dark-text/80">
              {bulletText}
            </span>
          </div>
        );
      }
      
      // Quote text
      if (part.startsWith('> ')) {
        const quoteText = part.slice(2);
        return (
          <blockquote key={index} className="border-l-4 border-blue-500 pl-4 my-2 text-light-text/80 dark:text-dark-text/80 italic">
            {quoteText}
          </blockquote>
        );
      }
      
      // Regular text - handle line breaks
      if (part.includes('\n')) {
        return (
          <span key={index}>
            {part.split('\n').map((line, lineIndex) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < part.split('\n').length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      }
      
      // Return regular text
      return <span key={index}>{part}</span>;
    });
  };

  // Extract key data
  const overallScore = summary.overallScore || summary.aiSummary?.overallScore || 0;
  const questionsCount = summary.totalQuestions || summary.questions?.length || 0;
  const answersCount = summary.totalAnswers || summary.answers?.length || questionsCount;
  const role = summary.role || 'Interview';
  const difficulty = summary.difficulty || 'intermediate';

  // Debug log to see what data we're getting
  console.log('Summary data:', {
    overallScore,
    questionsCount,
    answersCount,
    summary
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-bg to-forest/5 dark:from-dark-bg dark:via-dark-bg dark:to-sage/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
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
                    {questionsCount > 0 && answersCount > 0 ? `${overallScore}/10` : 'N/A'}
                  </div>
                  <p className={`text-lg font-semibold ${getScoreColor(overallScore)}`}>
                    {getPerformanceText(overallScore)}
                  </p>
                </div>
                
                <div className="flex justify-center sm:justify-end space-x-8">
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
                </div>
              </div>
            </div>
          </div>

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
                  
                  // Truncate if too long
                  if (recommendationsText && recommendationsText.length > 200) {
                    recommendationsText = `${recommendationsText.substring(0, 200)}...`;
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
              onClick={() => window.location.href = '/dashboard'}
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
