import React, { useState, useEffect, useRef, useContext } from 'react';
import RoleSelector from './RoleSelector';
import ChatInterface from './ChatInterface';
import InterviewSummary from './InterviewSummary';
import ConfettiEffect from './ConfettiEffect';
import { LoadingCard, LoadingButton } from './LoadingSpinner';
import interviewService from '../services/interviewService';
import AuthContext from '../contexts/AuthContext';
import { showSuccessToast, showLoadingToast, dismissToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';
import Logo from './Logo';

// Mapping from UI difficulty to API difficulty
const mapDifficulty = (uiDifficulty) => {
  const difficultyMap = {
    'beginner': 'easy',
    'intermediate': 'medium',
    'advanced': 'hard'
  };
  return difficultyMap[uiDifficulty] || 'medium'; // Default to medium if mapping not found
};

const InterviewSession = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const chatContainerRef = useRef(null);
  
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };
  
  const handleDifficultySelect = (difficultyLevel) => {
    setDifficulty(difficultyLevel);
  };
  
  const startInterview = async () => {
    if (!selectedRole) {
      toast.error('Please select a job role first');
      return;
    }
    
    setIsLoading(true);
    setSessionStarted(true);
    
    const loadingToast = showLoadingToast('Starting your interview session...');
    
    try {
      // Map UI difficulty to API difficulty
      const apiDifficulty = mapDifficulty(difficulty);
      
      // Create a new session
      const session = await interviewService.createSession(selectedRole, apiDifficulty);
      setCurrentSession(session);
      
      // Get the first question from the AI
      setIsGeneratingQuestion(true);
      const questionData = await interviewService.generateQuestion(selectedRole, apiDifficulty);
      
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
      
      dismissToast(loadingToast);
      showSuccessToast('Interview session started! Good luck!');
    } catch (error) {
      dismissToast(loadingToast);
      console.error("Failed to start interview:", error);
      
      // Fallback with a generic question
      const fallbackQuestion = "Let's begin the interview. Tell me about your background and experience in this field.";
      setCurrentQuestion(fallbackQuestion);
      setMessages([
        { 
          sender: 'ai', 
          text: fallbackQuestion
        }
      ]);
      
      toast.error('Failed to connect to AI service. Starting with basic questions.');
    } finally {
      setIsLoading(false);
      setIsGeneratingQuestion(false);
    }
  };

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim() || !currentQuestion) return;
    
    // Add the user message to the chat
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);
    setIsEvaluatingAnswer(true);
    
    const evaluationToast = showLoadingToast('AI is evaluating your answer...');
    
    try {
      // Map UI difficulty to API difficulty
      const apiDifficulty = mapDifficulty(difficulty);
      
      // Get AI feedback on the answer
      const evaluation = await interviewService.evaluateAnswer(
        currentQuestion,
        userMessage,
        selectedRole,
        apiDifficulty
      );
      
      dismissToast(evaluationToast);
      const questionToast = showLoadingToast('Generating next question...');
      
      // Generate the next question
      const nextQuestionData = await interviewService.generateQuestion(selectedRole, apiDifficulty);
      
      dismissToast(questionToast);
      
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
      const newQuestionAnswers = [
        ...questionAnswers, 
        { 
          question: currentQuestion, 
          answer: userMessage, 
          feedback: evaluation.feedback || "No specific feedback provided.",
          score: evaluation.score,
          improvementAreas: evaluation.improvement_areas || "No specific improvement areas identified."
        }
      ];
      setQuestionAnswers(newQuestionAnswers);

      // Save Q&A data to database using the new API endpoint
      if (currentSession) {
        try {
          await interviewService.addQuestionAnswer(
            currentSession.id, 
            currentQuestion, 
            userMessage, 
            evaluation
          );
        } catch (error) {
          console.error("Failed to save Q&A data:", error);
          // Don't interrupt the flow, just log the error
        }
      }

      // Add the next question after a short delay
      setTimeout(() => {
        setCurrentQuestion(nextQuestion);
        setMessages((prev) => [
          ...prev, 
          { sender: 'ai', text: nextQuestion }
        ]);
        setIsLoading(false);
        setIsEvaluatingAnswer(false);
      }, 1000);
      
    } catch (error) {
      dismissToast(evaluationToast);
      console.error("Failed to process answer:", error);
      
      // Provide fallback feedback and next question
      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'ai', 
          text: "Thank you for your answer. Here's some feedback:",
          feedback: "Your answer shows good understanding. Let's continue with the next question.",
          score: 7
        },
        {
          sender: 'ai',
          text: "Can you tell me about a time you faced a technical challenge and how you overcame it?"
        }
      ]);
        
      // Track Q&A with fallback feedback
      const newQuestionAnswers = [
        ...questionAnswers, 
        { 
          question: currentQuestion, 
          answer: userMessage, 
          feedback: "System evaluation unavailable - answer recorded.",
          score: 7,
          improvementAreas: "Unable to provide specific feedback at this time."
        }
      ];
      setQuestionAnswers(newQuestionAnswers);

      // Try to save even fallback data
      if (currentSession) {
        try {
          await interviewService.addQuestionAnswer(
            currentSession.id, 
            currentQuestion, 
            userMessage, 
            { feedback: "System evaluation unavailable", score: 7 }
          );
        } catch (saveError) {
          console.error("Failed to save fallback Q&A data:", saveError);
        }
      }

      setIsLoading(false);
      setIsEvaluatingAnswer(false);
    }
  };

  const handleEndInterview = async () => {
    if (!currentSession) {
      // If no session, just show local summary
      setSessionStarted(false);
      setMessages([]);
      setCurrentQuestion('');
      setInterviewSummary({
        role: selectedRole,
        difficulty: difficulty,
        apiDifficulty: mapDifficulty(difficulty),
        questions: questionAnswers
      });
      setQuestionAnswers([]);
      setShowConfetti(true);
      showSuccessToast('Interview completed! Check your performance summary below.');
      setTimeout(() => setShowConfetti(false), 6000);
      return;
    }

    const endingToast = showLoadingToast('Ending interview session and generating summary...');
    
    try {
      // End the session properly with AI-generated summary
      const endResult = await interviewService.endSession(currentSession.id);
      
      dismissToast(endingToast);
      
      // Reset UI state
      setSessionStarted(false);
      setMessages([]);
      setCurrentQuestion('');
      
      // Set summary with AI-generated data
      setInterviewSummary({
        role: selectedRole,
        difficulty: difficulty,
        apiDifficulty: mapDifficulty(difficulty),
        questions: questionAnswers,
        aiSummary: endResult.summary, // Include AI-generated summary
        session: endResult.session
      });
      
      setQuestionAnswers([]);
      setCurrentSession(null);
      setShowConfetti(true);
      
      // Show success message
      showSuccessToast('Interview completed! AI summary generated successfully.');
      
      // Hide confetti after 6 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 6000);
      
    } catch (error) {
      dismissToast(endingToast);
      console.error("Failed to end session properly:", error);
      
      // Fallback to basic ending
      setSessionStarted(false);
      setMessages([]);
      setCurrentQuestion('');
      setInterviewSummary({
        role: selectedRole,
        difficulty: difficulty,
        apiDifficulty: mapDifficulty(difficulty),
        questions: questionAnswers,
        error: "Failed to generate AI summary. Manual review of answers below."
      });
      setQuestionAnswers([]);
      setCurrentSession(null);
      setShowConfetti(true);
      
      showSuccessToast('Interview completed! Please review your answers below.');
      setTimeout(() => setShowConfetti(false), 6000);
    }
  };
  
  return (
    <div className="container-responsive section-spacing">
      {showConfetti && <ConfettiEffect duration={5000} />}
      
      {interviewSummary ? (
        <InterviewSummary 
          summary={interviewSummary}
          onReset={() => {
            setInterviewSummary(null);
            setSelectedRole('');
          }}
        />
      ) : !sessionStarted ? (
        <div className="animate-fadeIn">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-forest/10 dark:bg-sage/10 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light-text dark:text-dark-text mb-4">
              <span className="gradient-text">PrepMate</span> Interview Coach
            </h1>
            <p className="text-light-text/70 dark:text-dark-text/70 max-w-2xl mx-auto text-sm sm:text-base mb-8">
              Practice technical interviews with our AI coach. Receive personalized feedback and improve your interview skills with realistic questions.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="card p-4 sm:p-6 bg-forest/5 dark:bg-sage/5 border-l-4 border-l-forest dark:border-l-sage card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 mr-3 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-forest dark:text-sage">Realistic Questions</h3>
                </div>
                <p className="text-sm text-light-text/70 dark:text-dark-text/70">Role-specific questions tailored to your experience level and industry standards</p>
              </div>
              
              <div className="card p-4 sm:p-6 bg-forest/5 dark:bg-sage/5 border-l-4 border-l-forest dark:border-l-sage card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 mr-3 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-forest dark:text-sage">Expert Feedback</h3>
                </div>
                <p className="text-sm text-light-text/70 dark:text-dark-text/70">Get scored and receive detailed response evaluations with improvement suggestions</p>
              </div>
              
              <div className="card p-4 sm:p-6 bg-forest/5 dark:bg-sage/5 border-l-4 border-l-forest dark:border-l-sage card-interactive">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 mr-3 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-forest dark:text-sage">Skill Improvement</h3>
                </div>
                <p className="text-sm text-light-text/70 dark:text-dark-text/70">Learn from mistakes and build confidence with each practice session</p>
              </div>
            </div>
          </div>
          
          {/* Role Selection */}
          <div className="card card-elevated mb-8">
            <div className="p-4 sm:p-6 lg:p-8">
              <RoleSelector 
                onRoleSelect={handleRoleSelect}
                selectedRole={selectedRole}
                onDifficultySelect={handleDifficultySelect}
                selectedDifficulty={difficulty}
              />
            </div>
          </div>
          
          {/* Start Button */}
          <div className="text-center">
            <LoadingButton
              onClick={startInterview}
              disabled={!selectedRole}
              isLoading={isLoading}
              className={`
                ${!selectedRole 
                  ? 'btn btn-ghost opacity-50 cursor-not-allowed' 
                  : 'btn btn-primary btn-lg shadow-lg hover:shadow-xl'
                }
                w-full sm:w-auto px-8 py-4 text-base sm:text-lg
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting Interview...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start Your Interview
                </>
              )}
            </LoadingButton>
            
            <p className="mt-4 text-sm text-light-text/60 dark:text-dark-text/60">
              {selectedRole 
                ? `Ready to practice ${selectedRole} interview - ${difficulty} level` 
                : 'Select a role and difficulty to begin your interview'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col">
          {/* Interview Header */}
          <div className="card mb-4 sm:mb-6 flex-shrink-0">
            <div className="bg-forest dark:bg-forest/90 text-white p-4 sm:p-6 rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-medium">{selectedRole} Interview</h2>
                    <p className="text-white/80 text-sm">{difficulty} level • {questionAnswers.length} questions completed</p>
                  </div>
                </div>
                <button 
                  onClick={handleEndInterview}
                  className="btn bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 btn-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  End Interview
                </button>
              </div>
            </div>
          </div>
          
          {/* Chat Container */}
          <div className="card flex-1 flex flex-col min-h-0">
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-light-bg/30 dark:bg-dark-bg/30"
            >
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${message.sender === 'ai' ? 'chat-message-ai' : 'chat-message-user'}`}
                >
                  {message.sender === 'ai' && (
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-forest dark:bg-sage/80 text-white flex items-center justify-center mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-forest dark:text-sage">AI Interviewer</span>
                    </div>
                  )}
                  
                  <div>
                    {/* Question Text */}
                    <div className={`${message.sender === 'ai' ? 'text-light-text dark:text-dark-text' : 'text-white'} leading-relaxed text-sm sm:text-base`}>
                      {message.text}
                    </div>
                    
                    {/* Feedback Section */}
                    {message.feedback && (
                      <div className="mt-4 p-4 feedback-section rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-full bg-olive dark:bg-sage text-white flex items-center justify-center mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-olive dark:text-sage">Feedback</span>
                          </div>
                          {message.score && (
                            <div className="px-3 py-1 bg-olive/20 dark:bg-sage/20 rounded-full text-sm font-bold text-olive dark:text-sage">
                              {message.score}/10
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-light-text/90 dark:text-dark-text/90 italic leading-relaxed">
                          {message.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="flex items-center justify-end mt-3">
                      <span className="text-xs font-medium text-white/80 mr-2">You</span>
                      <div className="w-6 h-6 rounded-full bg-white text-forest flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center ml-4 mt-4">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-forest dark:bg-sage/80 text-white flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <span className="text-sm text-forest dark:text-sage mr-3">
                    {isEvaluatingAnswer ? 'Evaluating your answer...' : 'AI is thinking...'}
                  </span>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-light-border dark:border-dark-border">
              <ChatInterface 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
