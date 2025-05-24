import React, { useState, useEffect, useRef } from 'react';
import RoleSelector from './RoleSelector';
import ChatInterface from './ChatInterface';
import InterviewSummary from './InterviewSummary';
import ConfettiEffect from './ConfettiEffect';
import interviewService from '../services/interviewService';
import Logo from './Logo';

const InterviewSession = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
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
    if (!selectedRole) return;
    
    setIsLoading(true);
    setSessionStarted(true);
    try {
      // Get the first question from the AI
      const questionData = await interviewService.generateQuestion(selectedRole, difficulty);
      
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
        selectedRole,
        difficulty
      );
      // Generate the next question
      const nextQuestionData = await interviewService.generateQuestion(selectedRole, difficulty);
      
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
      difficulty: difficulty,
      questions: questionAnswers
    });
    setQuestionAnswers([]);
    setShowConfetti(true);
    // Hide confetti after 6 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 6000);
  };  
  
  return (
    <div className="max-w-5xl mx-auto">
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
        <div className="card p-6 animate-fadeIn">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-forest dark:text-sage">PrepMate Interview Coach</h2>
            <p className="text-light-text/80 dark:text-dark-text/80 max-w-2xl mx-auto text-center mb-6">
              Practice technical interviews with our AI coach. Receive personalized feedback and improve your interview skills.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card p-4 bg-sage/10 dark:bg-sage/5 border-l-4 border-l-forest dark:border-l-sage">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 mr-2 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-forest dark:text-sage">Realistic Questions</h3>
                </div>
                <p className="text-sm text-light-text/80 dark:text-dark-text/80">Role-specific questions tailored to your experience level</p>
              </div>
              
              <div className="card p-4 bg-sage/10 dark:bg-sage/5 border-l-4 border-l-forest dark:border-l-sage">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 mr-2 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-forest dark:text-sage">Expert Feedback</h3>
                </div>
                <p className="text-sm text-light-text/80 dark:text-dark-text/80">Get scored and receive detailed response evaluations</p>
              </div>
              
              <div className="card p-4 bg-sage/10 dark:bg-sage/5 border-l-4 border-l-forest dark:border-l-sage">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 mr-2 bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-forest dark:text-sage">Skill Improvement</h3>
                </div>
                <p className="text-sm text-light-text/80 dark:text-dark-text/80">Learn from mistakes and build confidence with each session</p>
              </div>
            </div>
          </div>
          
          <RoleSelector 
            onRoleSelect={handleRoleSelect}
            selectedRole={selectedRole}
            onDifficultySelect={handleDifficultySelect}
            selectedDifficulty={difficulty}
          />
          
          <div className="flex flex-col items-center mt-8">
            <button
              onClick={startInterview}
              disabled={!selectedRole}
              className={`
                btn ${!selectedRole ? 'bg-light-border dark:bg-dark-border text-light-text/50 dark:text-dark-text/50 cursor-not-allowed' : 'btn-primary'}
                px-6 py-3 rounded-lg text-white font-medium text-sm shadow transition-all duration-200
              `}
            >
              Start Your Interview
            </button>
            
            <p className="mt-3 text-sm text-light-text/60 dark:text-dark-text/60">
              {selectedRole ? `Prepare for your ${selectedRole} interview - ${difficulty} level` : 'Select a role to begin'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden animate-fadeIn flex flex-col h-[calc(100vh-180px)] md:h-[600px]">
          <div className="bg-forest dark:bg-forest/80 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <h2 className="text-base font-medium">{selectedRole} Interview - {difficulty} level</h2>
              </div>
              <button 
                onClick={handleEndInterview}
                className="text-xs py-1 px-3 bg-white/20 hover:bg-white/30 rounded-full text-white"
              >
                End Interview
              </button>
            </div>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="chat-container flex-grow overflow-y-auto bg-light-bg/50 dark:bg-dark-bg/50 p-4"
          >
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`chat-message ${message.sender === 'ai' ? 'chat-message-ai' : 'chat-message-user'}`}
              >
                {message.sender === 'ai' && (
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-forest dark:bg-sage/80 text-white flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-forest dark:text-sage">AI Interviewer</span>
                  </div>
                )}
                
                <div>
                  {/* Question Text */}
                  <div className={`${message.sender === 'ai' ? 'text-light-text dark:text-dark-text' : 'text-white'} leading-relaxed`}>
                    {message.text}
                  </div>
                  
                  {/* Feedback Section - Visually Distinct */}
                  {message.feedback && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-olive/10 to-sage/10 dark:from-olive/5 dark:to-sage/5 rounded-lg border-l-4 border-olive dark:border-sage shadow-sm">
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
                            Score: {message.score}/10
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
                  <div className="flex items-center justify-end mt-2">
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
                <div className="w-6 h-6 rounded-full bg-forest dark:bg-sage/80 text-white flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <span className="text-sm text-forest dark:text-sage mr-3">AI is thinking...</span>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
          
          <ChatInterface 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
