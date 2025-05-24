import React, { useState, useEffect } from 'react';
import RoleSelector from './RoleSelector';
import ChatInterface from './ChatInterface';
import InterviewSummary from './InterviewSummary';
import ConfettiEffect from './ConfettiEffect';
import interviewService from '../services/interviewService';

const InterviewSession = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState(null);  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };
  const startInterview = async () => {
    if (!selectedRole) return;
    
    setIsLoading(true);
    setSessionStarted(true);
      try {
      // Get the first question from the AI
      const questionData = await interviewService.generateQuestion(selectedRole);
      
      // Handle case where question might be a JSON string
      let question = "";
      if (typeof questionData.question === 'string') {
        try {
          // Try to parse it as JSON if it's a string that looks like JSON
          if (questionData.question.trim().startsWith('{') || questionData.question.trim().startsWith('[')) {
            const parsedQuestion = JSON.parse(questionData.question);
            question = parsedQuestion.question || parsedQuestion;
          } else {
            question = questionData.question;
          }
        } catch (e) {
          question = questionData.question;
        }
      } else {
        question = questionData.question || "Let's begin the interview. Tell me about your experience with this role.";
      }
      
      setCurrentQuestion(question);
      setMessages([
        { 
          sender: 'ai', 
          text: question 
        }
      ]);
    } catch (error) {
      console.error("Failed to start interview:", error);
      setMessages([
        { 
          sender: 'ai', 
          text: "Sorry, I couldn't generate a question right now. Let's start with something simple: Tell me about your background in this field." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim() || !currentQuestion) return;
    
    // Add the user message to the chat
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);
    
    try {
      // Get AI feedback on the answer
      const evaluation = await interviewService.evaluateAnswer(
        currentQuestion,
        userMessage,
        selectedRole
      );
        // Generate the next question
      const nextQuestionData = await interviewService.generateQuestion(selectedRole);
      
      // Handle case where question might be a JSON string
      let nextQuestion = "";
      if (typeof nextQuestionData.question === 'string') {
        try {
          // Try to parse it as JSON if it's a string that looks like JSON
          if (nextQuestionData.question.trim().startsWith('{') || nextQuestionData.question.trim().startsWith('[')) {
            const parsedQuestion = JSON.parse(nextQuestionData.question);
            nextQuestion = parsedQuestion.question || parsedQuestion;
          } else {
            nextQuestion = nextQuestionData.question;
          }
        } catch (e) {
          nextQuestion = nextQuestionData.question;
        }
      } else {
        nextQuestion = nextQuestionData.question || "Next question: Tell me about a challenging project you've worked on.";
      }
      
      // Add the feedback message
      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'ai', 
          text: "Thank you for your answer. Here's some feedback:",
          feedback: evaluation.feedback || "Your answer was interesting. Let's continue with another question.",
          score: evaluation.score
        }
      ]);
      
      // Track this Q&A pair with feedback for summary
      setQuestionAnswers((prev) => [
        ...prev, 
        { 
          question: currentQuestion, 
          answer: userMessage, 
          feedback: evaluation.feedback || "No specific feedback provided.",
          score: evaluation.score,
          improvementAreas: evaluation.improvement_areas || "No specific improvement areas identified."
        }
      ]);
      
      // Add the next question after a short delay
      setTimeout(() => {
        setCurrentQuestion(nextQuestion);
        setMessages((prev) => [
          ...prev, 
          { sender: 'ai', text: nextQuestion }
        ]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to process answer:", error);
      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'ai', 
          text: "Thanks for your answer. Let's move to the next question.",
        },
        {
          sender: 'ai',
          text: "Can you tell me about a time you faced a technical challenge and how you overcame it?"
        }
      ]);
      setIsLoading(false);
    }
  };
  const handleEndInterview = () => {
    setSessionStarted(false);
    setMessages([]);
    setCurrentQuestion('');
    setInterviewSummary({
      role: selectedRole,
      questions: questionAnswers
    });
    setQuestionAnswers([]);
    setShowConfetti(true);
    // Hide confetti after 6 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 6000);
  };  return (
    <div className="max-w-5xl mx-auto">
      {showConfetti && <ConfettiEffect duration={5000} />}
      
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          AI-Powered Interview Coach
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm">
          Practice technical interviews with our AI coach. Receive personalized feedback and improve your skills.
        </p>
      </div>
      
      {!sessionStarted ? (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fadeIn">
          {/* Features highlights as a horizontal strip */}
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <div className="flex items-center p-2">
              <div className="w-6 h-6 mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium dark:text-white text-xs">Real Questions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Role-specific</p>
              </div>
            </div>
            
            <div className="flex items-center p-2">
              <div className="w-6 h-6 mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium dark:text-white text-xs">Instant Feedback</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get scored</p>
              </div>
            </div>
            
            <div className="flex items-center p-2">
              <div className="w-6 h-6 mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium dark:text-white text-xs">Improvement Tips</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Learn & improve</p>
              </div>
            </div>
          </div>
          <RoleSelector 
            onRoleSelect={handleRoleSelect}
            selectedRole={selectedRole}
          />
          
          <div className="flex flex-col items-center mt-6">
            <button
              onClick={startInterview}
              disabled={!selectedRole}
              className={`
                px-5 py-2 rounded-md text-white font-medium text-sm shadow-sm transition-all duration-200
                ${!selectedRole 
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-300/20 dark:hover:shadow-blue-500/20'}
              `}
            >
              Start Your Interview
            </button>
            
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {selectedRole ? `Prepare for your ${selectedRole} interview` : 'Select a role to begin'}
            </p>
          </div>
        </div>      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <h2 className="text-base font-medium">{selectedRole} Interview</h2>
              </div>
              <div className="text-xs bg-white bg-opacity-20 dark:bg-opacity-30 rounded-full px-2 py-0.5 animate-pulse-slow">
                Live Session
              </div>
            </div>
          </div>
          
          <ChatInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-center">
            <button
              onClick={handleEndInterview}
              className="flex items-center px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              End Interview & View Summary
            </button>
          </div>
        </div>
      )}
        {interviewSummary && (
        <div className="mt-6 animate-slide-up">
          <InterviewSummary 
            questionAnswers={interviewSummary.questions}
            role={interviewSummary.role}
          />
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setInterviewSummary(null);
                setSelectedRole('');
              }}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium px-4 py-2 text-sm rounded-md transition-all duration-200 shadow-sm"
            >
              Start New Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
