import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RoleSelector from './RoleSelector';
import ChatInterface from './ChatInterface';
import InterviewSummary from './InterviewSummary';
import ConfettiEffect from './ConfettiEffect';
import { LoadingCard, Button } from './LoadingSpinner';
import interviewService from '../services/interviewService';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const InterviewSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  
  // Core state
  const [phase, setPhase] = useState('setup'); // 'setup', 'interview', 'completed'
  const [selectedRole, setSelectedRole] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [summary, setSummary] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  
  const chatContainerRef = useRef(null);

  // Helper function to scroll to bottom
  const scrollToBottom = (delay = 100) => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, delay);
  };

  // Initialize session on mount
  useEffect(() => {
    if (sessionId) {
      loadExistingSession();
    }
  }, [sessionId]);

  // Auto-scroll chat when messages change
  useEffect(() => {
    scrollToBottom(100);
  }, [messages]);

  // Additional scroll trigger for question generation
  useEffect(() => {
    if (currentQuestion) {
      scrollToBottom(150);
    }
  }, [currentQuestion]);

  const loadExistingSession = async () => {
    setIsLoading(true);
    try {
      const session = await interviewService.getSession(sessionId);
      
      if (session.completed) {
        // Show completed session
        setPhase('completed');
        setSummary(session.summary);
        setShowConfetti(true);
        return;
      }
      
      // Validate session data
      if (!session.role || session.role.trim().length < 2) {
        throw new Error('Invalid session data: role is missing or too short');
      }
      
      // Resume active session
      setCurrentSession(session);
      setSelectedRole(session.role);
      setDifficulty(session.difficulty === 'easy' ? 'beginner' : 
                   session.difficulty === 'hard' ? 'advanced' : 'intermediate');
      setPhase('interview');
      
      // Rebuild messages from session data
      const sessionMessages = [];
      if (session.questions && session.answers) {
        for (let i = 0; i < session.questions.length; i++) {
          sessionMessages.push({ sender: 'ai', text: session.questions[i] });
          if (session.answers[i]) {
            // Use stored evaluation data if available
            const storedEvaluation = session.evaluations && session.evaluations[i] ? session.evaluations[i] : null;
            sessionMessages.push({ 
              sender: 'user', 
              text: session.answers[i],
              evaluation: storedEvaluation
            });
          }
        }
      }
      setMessages(sessionMessages);
      
      // Set current question or generate new one
      const lastQuestionIndex = session.questions?.length - 1;
      const hasAnswerForLastQuestion = session.answers?.[lastQuestionIndex];
      
      if (!hasAnswerForLastQuestion && session.questions?.[lastQuestionIndex]) {
        setCurrentQuestion(session.questions[lastQuestionIndex]);
      } else {
        // Generate new question using session data
        console.log('Generating new question for resumed session:', { role: session.role, difficulty: session.difficulty });
        await generateQuestionForSession(session.role, session.difficulty);
      }
      
      // Scroll to bottom after loading session
      scrollToBottom(300);
      showSuccessToast('Session resumed successfully!');
    } catch (error) {
      console.error('Failed to load session:', error);
      showErrorToast('Failed to load session');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = async () => {
    if (!selectedRole) {
      toast.error('Please select a job role first');
      return;
    }
    
    setIsLoading(true);
    try {
      const apiDifficulty = difficulty === 'beginner' ? 'easy' : 
                           difficulty === 'advanced' ? 'hard' : 'medium';
      
      const session = await interviewService.createSession(selectedRole, apiDifficulty);
      setCurrentSession(session);
      setPhase('interview');
      
      await generateQuestion();
      
      // Scroll to bottom after starting session
      scrollToBottom(300);
      showSuccessToast('Interview started! Good luck!');
    } catch (error) {
      console.error('Failed to start interview:', error);
      showErrorToast('Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestion = async () => {
    if (!selectedRole) {
      console.error('No role selected for question generation');
      return;
    }
    
    setIsGeneratingQuestion(true);
    try {
      const apiDifficulty = difficulty === 'beginner' ? 'easy' : 
                           difficulty === 'advanced' ? 'hard' : 'medium';
      
      // Create context from previous questions to avoid repetition
      const previousQuestions = messages.filter(m => m.sender === 'ai').map(m => m.text);
      const context = previousQuestions.length > 0 
        ? `Previous questions asked: ${previousQuestions.join('; ')}. Please ask a different question.`
        : undefined;
      
      const questionData = await interviewService.generateQuestion(selectedRole, apiDifficulty, context);
      const question = questionData.question || "Tell me about your experience with this role.";
      
      // Check if this question was already asked
      if (previousQuestions.includes(question)) {
        // If it's a repeat, try again with more specific context
        const specificContext = `Previous questions: ${previousQuestions.join('; ')}. This question was already asked: "${question}". Please ask a completely different question about ${selectedRole} role.`;
        const retryQuestionData = await interviewService.generateQuestion(selectedRole, apiDifficulty, specificContext);
        const retryQuestion = retryQuestionData.question || `Let's explore a different aspect of ${selectedRole} work. What challenges have you faced in your career?`;
        
        setCurrentQuestion(retryQuestion);
        setMessages(prev => [...prev, { sender: 'ai', text: retryQuestion }]);
      } else {
        setCurrentQuestion(question);
        setMessages(prev => [...prev, { sender: 'ai', text: question }]);
        scrollToBottom(200); // Scroll after question is added
      }
    } catch (error) {
      console.error('Failed to generate question:', error);
      const questionNumber = messages.filter(m => m.sender === 'ai').length + 1;
      const fallbackQuestion = `Question ${questionNumber}: Tell me about a challenging ${selectedRole || 'role'} project you've worked on recently.`;
      setCurrentQuestion(fallbackQuestion);
      setMessages(prev => [...prev, { sender: 'ai', text: fallbackQuestion }]);
      scrollToBottom(200); // Scroll after fallback question is added
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const generateQuestionForSession = async (role, sessionDifficulty) => {
    if (!role) {
      console.error('No role provided for question generation');
      return;
    }
    
    if (role.trim().length < 2) {
      console.error('Role is too short for question generation:', role);
      return;
    }
    
    setIsGeneratingQuestion(true);
    try {
      const apiDifficulty = sessionDifficulty || 'medium';
      console.log('Generating question with params:', { role, difficulty: apiDifficulty });
      
      // Create context from previous questions to avoid repetition
      const previousQuestions = messages.filter(m => m.sender === 'ai').map(m => m.text);
      const context = previousQuestions.length > 0 
        ? `Previous questions asked: ${previousQuestions.join('; ')}. Please ask a different question.`
        : undefined;
      
      const questionData = await interviewService.generateQuestion(role, apiDifficulty, context);
      const question = questionData.question || "Tell me about your experience with this role.";
      
      // Check if this question was already asked
      if (previousQuestions.includes(question)) {
        // If it's a repeat, try again with more specific context
        const specificContext = `Previous questions: ${previousQuestions.join('; ')}. This question was already asked: "${question}". Please ask a completely different question about ${role} role.`;
        const retryQuestionData = await interviewService.generateQuestion(role, apiDifficulty, specificContext);
        const retryQuestion = retryQuestionData.question || `Let's explore a different aspect of ${role} work. What challenges have you faced in your career?`;
        
        setCurrentQuestion(retryQuestion);
        setMessages(prev => [...prev, { sender: 'ai', text: retryQuestion }]);
        scrollToBottom(200); // Scroll after retry question is added
      } else {
        setCurrentQuestion(question);
        setMessages(prev => [...prev, { sender: 'ai', text: question }]);
        scrollToBottom(200); // Scroll after question is added
      }
    } catch (error) {
      console.error('Failed to generate question:', error);
      showErrorToast('Failed to generate question. Please try again.');
      const questionNumber = messages.filter(m => m.sender === 'ai').length + 1;
      const fallbackQuestion = `Question ${questionNumber}: Tell me about a challenging ${role} project you've worked on recently.`;
      setCurrentQuestion(fallbackQuestion);
      setMessages(prev => [...prev, { sender: 'ai', text: fallbackQuestion }]);
      scrollToBottom(200); // Scroll after fallback question is added
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (!answer.trim() || !currentQuestion) return;
    
    // Add user answer to chat (initially without score)
    const userMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { sender: 'user', text: answer, isEvaluating: true }]);
    scrollToBottom(150); // Scroll after user answer is added
    setIsLoading(true);
    
    try {
      // Evaluate the answer
      let evaluation = null;
      try {
        evaluation = await interviewService.evaluateAnswer(currentQuestion, answer, selectedRole);
        console.log('Answer evaluation:', evaluation);
      } catch (evalError) {
        console.error('Failed to evaluate answer:', evalError);
        // Continue without evaluation if it fails
      }
      
      // Update the user message with evaluation results
      setMessages(prev => prev.map((msg, index) => 
        index === userMessageIndex - 1 ? { 
          ...msg, 
          isEvaluating: false, 
          evaluation: evaluation 
        } : msg
      ));
      scrollToBottom(100); // Scroll after evaluation is updated
      
      // Save answer to session
      await interviewService.addQuestionAnswer(currentSession.id, currentQuestion, answer, evaluation);
      
      // Generate next question
      await generateQuestion();
    } catch (error) {
      console.error('Failed to process answer:', error);
      showErrorToast('Failed to process your answer');
      
      // Remove evaluation loading state on error
      setMessages(prev => prev.map((msg, index) => 
        index === userMessageIndex - 1 ? { 
          ...msg, 
          isEvaluating: false 
        } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    if (!currentSession) return;
    
    setIsEndingInterview(true);
    try {
      const result = await interviewService.endSession(currentSession.id);
      setSummary(result.summary);
      setPhase('completed');
      setShowConfetti(true);
      showSuccessToast('Interview completed!');
    } catch (error) {
      console.error('Failed to end interview:', error);
      showErrorToast('Failed to end interview');
    } finally {
      setIsEndingInterview(false);
    }
  };

  const resetInterview = () => {
    setPhase('setup');
    setSelectedRole('');
    setDifficulty('intermediate');
    setCurrentSession(null);
    setMessages([]);
    setCurrentQuestion('');
    setSummary(null);
    setShowConfetti(false);
    navigate('/interview');
  };

  // Render different phases
  if (phase === 'completed') {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
        {showConfetti && <ConfettiEffect />}
        <div className="container-responsive section-spacing">
          <InterviewSummary summary={summary} onReset={resetInterview} />
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="container-responsive py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                Start Your <span className="gradient-text">Interview</span>
              </h1>
              <p className="text-light-text/70 dark:text-dark-text/70 text-sm">
                Choose your role and difficulty level to begin your practice session
              </p>
            </div>
            
            <div className="bg-white dark:bg-dark-muted rounded-xl border border-light-border dark:border-dark-border shadow-sm">
              <RoleSelector
                selectedRole={selectedRole}
                onRoleSelect={setSelectedRole}
                difficulty={difficulty}
                onDifficultySelect={setDifficulty}
              />
              
              <div className="px-4 pb-4 text-center border-t border-light-border dark:border-dark-border pt-4">
                <Button
                  onClick={startNewSession}
                  disabled={!selectedRole || isLoading}
                  className="px-8 py-3 text-base font-medium bg-gradient-to-r from-forest to-forest/90 hover:from-forest/90 hover:to-forest text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Interview...
                    </div>
                  ) : (
                    'Start Interview'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interview phase
  const questionCount = messages.filter(m => m.sender === 'ai').length;
  const answerCount = messages.filter(m => m.sender === 'user').length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-bg to-forest/5 dark:from-dark-bg dark:via-dark-bg dark:to-sage/5 flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md border-b border-forest/10 dark:border-sage/20 shadow-sm">
        <div className="container-responsive py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-forest to-forest/80 dark:from-sage dark:to-sage/80 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-light-text dark:text-dark-text">
                    {selectedRole} Interview
                  </h1>
                  <div className="flex items-center space-x-3 text-xs text-light-text/60 dark:text-dark-text/60">
                    <span className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        difficulty === 'beginner' ? 'bg-green-500' :
                        difficulty === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                    <span>•</span>
                    <span>Question {questionCount}</span>
                    <span>•</span>
                    <span>{answerCount} answered</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-xs text-light-text/60 dark:text-dark-text/60">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Session</span>
                </div>
                <Button
                  onClick={endInterview}
                  variant="outline"
                  size="sm"
                  disabled={isLoading || isEndingInterview}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 text-xs px-3 py-1"
                >
                  {isEndingInterview ? 'Ending...' : 'End Interview'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="container-responsive flex-1 flex flex-col">
          <div className="max-w-5xl mx-auto flex-1 flex flex-col py-4">
            
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-hidden">
              <div 
                ref={chatContainerRef}
                className="h-full overflow-y-auto px-4 py-8 space-y-8"
              >
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-forest to-sage rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                      Interview Starting Soon
                    </h3>
                    <p className="text-light-text/60 dark:text-dark-text/60">
                      Your AI interviewer is preparing the first question...
                    </p>
                  </div>
                )}
                
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`w-full ${index > 0 ? 'mt-8' : ''}`}
                  >
                    {message.sender === 'user' ? (
                      // User Answer - Right Side
                      <div className="flex justify-end">
                        <div className="flex items-start space-x-4 max-w-4xl flex-row-reverse space-x-reverse">
                          {/* User Avatar */}
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-forest to-forest/80 dark:from-sage dark:to-sage/80">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          
                          {/* User Message */}
                          <div className="text-right">
                            <div className="inline-block px-5 py-4 rounded-2xl shadow-md max-w-3xl bg-gradient-to-r from-forest to-forest/90 dark:from-sage dark:to-sage/90 text-white">
                              <p className="text-base leading-relaxed whitespace-pre-wrap text-left">
                                {message.text}
                              </p>
                            </div>
                            
                            {/* Evaluation Score */}
                            <div className="mt-2 text-right">
                              {message.isEvaluating ? (
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="text-gray-600 dark:text-gray-300">Evaluating...</span>
                                </div>
                              ) : message.evaluation ? (
                                <div className="inline-flex items-center space-x-2">
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    message.evaluation.score >= 8 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                    message.evaluation.score >= 6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                    message.evaluation.score >= 4 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                                    </svg>
                                    Score: {message.evaluation.score}/10
                                  </div>
                                  {message.evaluation.feedback && (
                                    <div className="text-xs text-light-text/60 dark:text-dark-text/60 max-w-xs truncate">
                                      {message.evaluation.feedback}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-light-text/40 dark:text-dark-text/40">
                                  You
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // AI Question - Left Side
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-4 max-w-4xl">
                          {/* AI Avatar */}
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          
                          {/* AI Message */}
                          <div className="text-left">
                            <div className="inline-block px-5 py-4 rounded-2xl shadow-md max-w-3xl bg-white dark:bg-dark-muted border border-gray-200 dark:border-gray-700 text-light-text dark:text-dark-text">
                              <p className="text-base leading-relaxed whitespace-pre-wrap">
                                {message.text}
                              </p>
                            </div>
                            <div className="text-xs text-light-text/40 dark:text-dark-text/40 mt-2 text-left">
                              AI Interviewer
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isGeneratingQuestion && (
                  <div className="flex justify-start mt-8">
                    <div className="flex items-start space-x-4 max-w-4xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="bg-white dark:bg-dark-muted border border-gray-200 dark:border-gray-700 px-5 py-4 rounded-2xl shadow-md">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-forest dark:bg-sage rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-forest dark:bg-sage rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-forest dark:bg-sage rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-base text-light-text/70 dark:text-dark-text/70">
                            Generating your next question...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="sticky bottom-0 z-40 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-t border-forest/10 dark:border-sage/20 shadow-lg">
        <div className="container-responsive py-4">
          <div className="max-w-5xl mx-auto">
            <ChatInterface
              onSendMessage={handleAnswer}
              disabled={isLoading || isGeneratingQuestion || !currentQuestion || isEndingInterview}
              placeholder={
                isEndingInterview
                  ? "Ending interview session..."
                  : isGeneratingQuestion 
                    ? "Please wait for the next question..."
                    : currentQuestion 
                      ? "Type your answer here..."
                      : "Preparing interview..."
              }
            />
          </div>
        </div>
      </div>

      {/* Elegant End Interview Loader */}
      {isEndingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white/95 dark:bg-dark-bg/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full border border-white/20 dark:border-white/10">
            <div className="text-center">
              {/* Elegant Spinner */}
              <div className="relative mb-6">
                <div className="w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-forest/30 dark:border-sage/30"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-forest dark:border-t-sage animate-spin"></div>
                </div>
              </div>

              {/* Simple Text */}
              <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
                Generating Summary
              </h3>
              <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                Analyzing your responses...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
