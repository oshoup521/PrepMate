import React from 'react';

const InterviewSummary = ({ questionAnswers, role }) => {
  // Calculate average score
  const validScores = questionAnswers.filter(qa => 
    qa.score && !isNaN(parseInt(qa.score))
  ).map(qa => parseInt(qa.score));
  
  const averageScore = validScores.length > 0 
    ? (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(1) 
    : 'N/A';
  
  // Group feedback into categories based on scores
  const strengths = [];
  const areasToImprove = [];
  
  questionAnswers.forEach(qa => {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 animate-fadeIn">
      <div className="text-center mb-8">        <div className="inline-block p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Interview Performance Summary</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Here's how you performed in your {role} interview</p>
      </div>
      
      {/* Score card */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
        <div className="mb-6 lg:mb-0">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-2">{role} Interview</h3>
          <div className="flex items-center">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-600 dark:text-gray-300">{new Date().toLocaleDateString()}</span>
            <span className="mx-3 text-gray-400">|</span>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-600 dark:text-gray-300">{questionAnswers.length} questions</span>
          </div>
        </div>
        
        <div className="text-center flex flex-col items-center">          <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Overall Score</div>
          <div className="relative mb-2">
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">{averageScore}</div>
            <div className="absolute top-0 right-[-15px] text-base text-gray-500 dark:text-gray-400">/10</div>
          </div>
          <div className={`text-sm font-medium px-4 py-1 rounded-full 
            ${averageScore >= 8 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 
              averageScore >= 7 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' : 
              averageScore >= 5 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' : 
              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'}`}>
            {getPerformanceRating(averageScore)}
          </div>
        </div>
      </div>
        {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Strengths Section */}
        <div className="bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 px-6 py-4 border-b border-green-200 dark:border-green-800">
            <div className="flex items-center">              <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Strengths</h3>
            </div>
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">Areas where you performed exceptionally well</p>
          </div>
          <div className="p-6">
            {strengths.length > 0 ? (
              <ul className="space-y-4">
                {strengths.map((strength, index) => (
                  <li key={index} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400 dark:border-green-600 shadow-sm">
                    <div className="font-medium text-green-900 dark:text-green-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {strength.question}
                    </div>
                    <div className="text-green-800 dark:text-green-300">{strength.feedback}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-200 dark:text-green-800 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No specific strengths identified in this interview.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try answering more questions to get feedback.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Areas to Improve Section */}
        <div className="bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 px-6 py-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center">              <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300">Areas for Improvement</h3>
            </div>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">Focus on these areas to enhance your interview performance</p>
          </div>
          <div className="p-6">
            {areasToImprove.length > 0 ? (
              <ul className="space-y-4">
                {areasToImprove.map((area, index) => (
                  <li key={index} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-4 border-amber-400 dark:border-amber-600 shadow-sm">
                    <div className="font-medium text-amber-900 dark:text-amber-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {area.question}
                    </div>
                    <div className="text-amber-800 dark:text-amber-300">{area.improvementAreas}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-200 dark:text-amber-800 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Great job! No specific areas for improvement identified.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Continue practicing to maintain your performance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Question by Question Breakdown */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-white">
          Question by Question Breakdown
        </h3>
        <div className="space-y-4">
          {questionAnswers.map((qa, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800/80">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-gray-800 dark:text-white">Question {index + 1}</div>
                <div className={`px-2 py-1 rounded font-medium text-sm
                  ${qa.score && parseInt(qa.score) >= 7 ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' : 
                    qa.score && parseInt(qa.score) >= 5 ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' : 
                    'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'}`}>
                  Score: {qa.score || 'N/A'}/10
                </div>
              </div>
              <p className="text-gray-800 dark:text-gray-200 mb-2">{qa.question}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your answer was {qa.answer.length > 100 ? qa.answer.substring(0, 100) + '...' : qa.answer}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tips for Next Interview */}      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
          <span className="mr-2">💡</span>
          Tips for Your Next Interview
        </h3>
        <ul className="list-disc pl-5 space-y-1.5 text-blue-800 dark:text-blue-300 text-sm">
          <li>Review the areas for improvement highlighted above</li>
          <li>Practice articulating your answers more concisely</li>
          <li>Research common questions for {role} positions</li>
          <li>Consider doing more mock interviews to build confidence</li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewSummary;
