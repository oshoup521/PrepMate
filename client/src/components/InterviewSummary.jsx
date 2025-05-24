import React from 'react';

const InterviewSummary = ({ summary, onReset }) => {
  // Calculate average score
  const validScores = summary.questions.filter(qa => 
    qa.score && !isNaN(parseInt(qa.score))
  ).map(qa => parseInt(qa.score));
  
  const averageScore = validScores.length > 0 
    ? (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(1) 
    : 'N/A';
  
  // Group feedback into categories based on scores
  const strengths = [];
  const areasToImprove = [];
  
  summary.questions.forEach(qa => {
    if (qa.score && parseInt(qa.score) >= 7) {
      strengths.push({
        question: qa.question,
        feedback: qa.feedback
      });
    } else if (qa.score && parseInt(qa.score) < 7) {
      areasToImprove.push({
        question: qa.question,
        feedback: qa.feedback,
        improvementAreas: qa.improvementAreas
      });
    }
  });
  
  // Get performance rating
  const getPerformanceRating = (score) => {
    if (score === 'N/A') return 'Not Available';
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'Excellent';
    if (numScore >= 7) return 'Good';
    if (numScore >= 5) return 'Average';
    return 'Needs Improvement';
  };
  
  return (
    <div className="card p-6 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-forest/10 dark:bg-sage/10 rounded-full mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Interview Performance Summary</h2>
        <p className="text-light-text/80 dark:text-dark-text/80 text-sm">
          Here's how you performed in your {summary.role} interview - {summary.difficulty} level
        </p>
      </div>
      
      {/* Score card */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-10 bg-sage/10 dark:bg-sage/5 p-6 rounded-xl border border-forest/20 dark:border-sage/20">
        <div className="mb-6 lg:mb-0">
          <h3 className="text-xl font-bold text-forest dark:text-sage mb-2">{summary.role} Interview</h3>
          <div className="flex items-center">
            <div className="bg-white dark:bg-dark-muted p-2 rounded-lg shadow-sm mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-light-text/80 dark:text-dark-text/80">{new Date().toLocaleDateString()}</span>
            <span className="mx-3 text-light-text/40 dark:text-dark-text/40">|</span>
            <div className="bg-white dark:bg-dark-muted p-2 rounded-lg shadow-sm mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <span className="font-medium text-light-text/80 dark:text-dark-text/80">{summary.questions.length} questions</span>
          </div>
        </div>
        
        <div className="text-center flex flex-col items-center">
          <div className="text-xs font-medium uppercase tracking-wider text-light-text/60 dark:text-dark-text/60 mb-1">Overall Score</div>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <div className="text-4xl font-extrabold text-forest dark:text-sage summary-score">{averageScore}</div>
            <div className="text-lg font-medium text-light-text/60 dark:text-dark-text/60">/10</div>
          </div>
          <div className={`text-sm font-medium px-4 py-1 rounded-full 
            ${averageScore >= 8 ? 'bg-forest/20 dark:bg-sage/20 text-forest dark:text-sage' : 
              averageScore >= 7 ? 'bg-olive/20 dark:bg-sage/20 text-olive dark:text-sage' : 
              averageScore >= 5 ? 'bg-sand/20 dark:bg-sand/10 text-forest dark:text-sand' : 
              'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'}`}
          >
            {getPerformanceRating(averageScore)}
          </div>
        </div>
      </div>
        
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Strengths Section */}
        <div className="card border-forest/20 dark:border-sage/20 overflow-hidden">
          <div className="bg-forest/10 dark:bg-sage/10 px-6 py-4 border-b border-forest/20 dark:border-sage/20">
            <div className="flex items-center">
              <div className="bg-forest/20 dark:bg-sage/20 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-forest dark:text-sage">Strengths</h3>
            </div>
            <p className="text-forest/80 dark:text-sage/80 text-xs mt-1">Areas where you performed exceptionally well</p>
          </div>
          <div className="p-6">
            {strengths.length > 0 ? (
              <ul className="space-y-4">
                {strengths.map((strength, index) => (
                  <li key={index} className="bg-forest/5 dark:bg-sage/5 p-4 rounded-lg border-l-4 border-forest dark:border-sage">
                    <div className="font-medium text-forest dark:text-sage mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {strength.question}
                    </div>
                    <div className="text-light-text dark:text-dark-text">{strength.feedback}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-forest/20 dark:text-sage/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-light-text/60 dark:text-dark-text/60">No specific strengths identified in this interview.</p>
                <p className="text-sm text-light-text/40 dark:text-dark-text/40 mt-1">Try answering more questions to get feedback.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Areas to Improve Section */}
        <div className="card border-forest/20 dark:border-sage/20 overflow-hidden">
          <div className="bg-forest/10 dark:bg-sage/10 px-6 py-4 border-b border-forest/20 dark:border-sage/20">
            <div className="flex items-center">
              <div className="bg-forest/20 dark:bg-sage/20 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-forest dark:text-sage">Areas for Improvement</h3>
            </div>
            <p className="text-forest/80 dark:text-sage/80 text-xs mt-1">Focus on these areas to enhance your interview performance</p>
          </div>
          <div className="p-6">
            {areasToImprove.length > 0 ? (
              <ul className="space-y-4">
                {areasToImprove.map((area, index) => (
                  <li key={index} className="bg-sand/10 dark:bg-sand/5 p-4 rounded-lg border-l-4 border-sand dark:border-sand/70">
                    <div className="font-medium text-forest dark:text-sage mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {area.question}
                    </div>
                    <div className="text-light-text dark:text-dark-text">{area.improvementAreas}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-forest/20 dark:text-sage/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-light-text/60 dark:text-dark-text/60">Great job! No specific areas for improvement identified.</p>
                <p className="text-sm text-light-text/40 dark:text-dark-text/40 mt-1">Continue practicing to maintain your performance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Question by Question Breakdown */}
      <div className="mt-8 mb-8">
        <h3 className="text-xl font-semibold border-b border-light-border dark:border-dark-border pb-2 mb-4">
          Question by Question Breakdown
        </h3>
        <div className="space-y-4">
          {summary.questions.map((qa, index) => (
            <div key={index} className="card p-4 border border-light-border/80 dark:border-dark-border/80">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-forest dark:text-sage">Question {index + 1}</div>
                <div className={`px-2 py-1 rounded font-medium text-xs
                  ${qa.score && parseInt(qa.score) >= 7 ? 'bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage' : 
                    qa.score && parseInt(qa.score) >= 5 ? 'bg-sand/10 dark:bg-sand/10 text-forest dark:text-sand' : 
                    'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'}`}
                >
                  Score: {qa.score || 'N/A'}/10
                </div>
              </div>
              <p className="text-light-text dark:text-dark-text mb-2">{qa.question}</p>
              <p className="text-light-text/60 dark:text-dark-text/60 text-sm">Your answer was {qa.answer.length > 100 ? qa.answer.substring(0, 100) + '...' : qa.answer}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tips for Next Interview */}
      <div className="mt-8 bg-forest/5 dark:bg-sage/5 p-4 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-forest dark:text-sage mb-2">
          <span className="mr-2">💡</span>
          Tips for Your Next Interview
        </h3>
        <ul className="list-disc pl-5 space-y-1.5 text-light-text dark:text-dark-text text-sm">
          <li>Review the areas for improvement highlighted above</li>
          <li>Practice articulating your answers more concisely</li>
          <li>Research common questions for {summary.role} positions</li>
          <li>Consider doing more mock interviews to build confidence</li>
        </ul>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onReset}
          className="btn btn-primary px-6 py-3"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
};

export default InterviewSummary;
