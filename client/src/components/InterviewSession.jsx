import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import RoleSelector from './RoleSelector';
import ChatInterface from './ChatInterface';
import InterviewSummary from './InterviewSummary';
import ConfettiEffect from './ConfettiEffect';
import { LoadingCard, Button } from './LoadingSpinner';
import StartInterviewConfirmModal from './StartInterviewConfirmModal';
import interviewService from '../services/interviewService';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';
import { useQuestionTimer } from '../hooks/useQuestionTimer';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axiosConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const SESSION_PACKS = [
  { key: 'starter', label: 'Starter', sessions: 5,  price: 149, badge: null },
  { key: 'popular', label: 'Popular', sessions: 15, price: 299, badge: 'Most Popular' },
  { key: 'power',   label: 'Power',   sessions: 30, price: 499, badge: 'Best Deal' },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Build a "don't repeat these questions" context that stays under the 1000-char server cap.
// Keeps the most recent questions, truncates each, and hard-caps the final string.
const MAX_CONTEXT_CHARS = 900; // leave headroom below 1000
const MAX_QUESTION_SNIPPET = 90;
const buildQuestionContext = (previousQuestions) => {
  if (!previousQuestions?.length) return undefined;
  const prefix = 'Previous questions asked: ';
  const suffix = '. Please ask a different question.';
  const budget = MAX_CONTEXT_CHARS - prefix.length - suffix.length;
  const snippets = [];
  let used = 0;
  // Walk from most recent backwards so newest questions are preserved
  for (let i = previousQuestions.length - 1; i >= 0; i--) {
    const q = (previousQuestions[i] || '').trim();
    if (!q) continue;
    const snippet = q.length > MAX_QUESTION_SNIPPET ? q.slice(0, MAX_QUESTION_SNIPPET) + '…' : q;
    const addLen = snippet.length + (snippets.length ? 2 : 0); // "; " separator
    if (used + addLen > budget) break;
    snippets.unshift(snippet);
    used += addLen;
  }
  if (!snippets.length) return undefined;
  return `${prefix}${snippets.join('; ')}${suffix}`;
};

const InterviewSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = searchParams.get('sessionId');
  const { refreshUser, currentUser } = useAuth();

  // Template navigation: role + difficulty passed via route state
  const templateRole = location.state?.role;
  const templateDifficulty = location.state?.difficulty;
  const hasTemplateStart = !!templateRole && !!templateDifficulty && !sessionId;

  // Core state — start in 'loading' when template auto-start is pending so the setup screen doesn't flash
  const [phase, setPhase] = useState(hasTemplateStart ? 'loading' : 'setup'); // 'setup', 'loading', 'interview', 'completed'
  const [selectedRole, setSelectedRole] = useState(hasTemplateStart ? templateRole : '');
  const [difficulty, setDifficulty] = useState(
    hasTemplateStart
      ? (templateDifficulty === 'easy' ? 'beginner' : templateDifficulty === 'hard' ? 'advanced' : 'intermediate')
      : ''
  );
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [summary, setSummary] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);

  // Upgrade modal (shown when free user hits 10-question limit)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loadingPack, setLoadingPack] = useState(null);

  // Start-session confirmation modal (prevents accidental quota burn)
  const [pendingStart, setPendingStart] = useState(null); // { role, apiDifficulty, fromTemplate }

  // Per-question timing (resets each question)
  const { elapsed, isRunning: timerRunning, start: startTimer, stop: stopTimer } = useQuestionTimer();
  // Session-level timing (runs from first question to end of interview)
  const { elapsed: sessionElapsed, isRunning: sessionTimerRunning, start: startSessionTimer, stop: stopSessionTimer } = useQuestionTimer();
  const [questionTimings, setQuestionTimings] = useState([]); // seconds per answered question
  
  const chatContainerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const autoStartRef = useRef(false);

  // Scroll the scrollable chat area to the bottom
  const scrollToBottom = (delay = 80) => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, delay);
  };

  // Initialize session on mount
  useEffect(() => {
    if (sessionId) {
      loadExistingSession();
      return;
    }
    if (hasTemplateStart && !autoStartRef.current) {
      autoStartRef.current = true;
      beginSession({
        role: templateRole,
        apiDifficulty: templateDifficulty,
        fromTemplate: true,
      });
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

  // Start timer whenever a new question appears; start session timer once
  useEffect(() => {
    if (currentQuestion && phase === 'interview') {
      startTimer();
      if (!sessionTimerRunning) startSessionTimer();
    }
  }, [currentQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const beginSession = async ({ role, apiDifficulty, fromTemplate }) => {
    setIsLoading(true);
    try {
      const session = await interviewService.createSession(role, apiDifficulty);
      setCurrentSession(session);
      setPhase('interview');
      if (fromTemplate) {
        await generateQuestionForSession(role, apiDifficulty);
      } else {
        await generateQuestion();
      }
      scrollToBottom(300);
      showSuccessToast('Interview started! Good luck!');
    } catch (error) {
      console.error('Failed to start interview:', error);
      showErrorToast('Failed to start interview');
      if (fromTemplate) setPhase('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = () => {
    if (!selectedRole) {
      toast.error('Please select a job role first');
      return;
    }
    if (!difficulty) {
      toast.error('Please select a difficulty level');
      return;
    }
    const apiDifficulty = difficulty === 'beginner' ? 'easy' :
                         difficulty === 'advanced' ? 'hard' : 'medium';
    setPendingStart({ role: selectedRole, apiDifficulty, fromTemplate: false });
  };

  const confirmStart = () => {
    if (!pendingStart) return;
    const start = pendingStart;
    setPendingStart(null);
    beginSession(start);
  };

  const cancelStart = () => {
    const wasTemplate = pendingStart?.fromTemplate;
    setPendingStart(null);
    if (wasTemplate) {
      navigate('/templates');
    }
  };

  const generateQuestion = async () => {
    if (!selectedRole) {
      console.error('No role selected for question generation');
      return;
    }

    setIsGeneratingQuestion(true);

    // Add a placeholder message that will be filled by streaming tokens
    setMessages(prev => [...prev, { sender: 'ai', text: '', isStreaming: true }]);
    scrollToBottom(200);

    try {
      const apiDifficulty = difficulty === 'beginner' ? 'easy' :
                           difficulty === 'advanced' ? 'hard' : 'medium';

      const previousQuestions = messages.filter(m => m.sender === 'ai').map(m => m.text);
      const context = buildQuestionContext(previousQuestions);

      await interviewService.generateQuestionStream(
        selectedRole,
        apiDifficulty,
        context,
        (token) => {
          setMessages(prev => {
            const lastIdx = prev.length - 1;
            if (lastIdx < 0 || prev[lastIdx].sender !== 'ai') return prev;
            const rawAccum = (prev[lastIdx]._raw || '') + token;
            // Only display content before the "---" context separator
            const displayText = rawAccum.split('\n---')[0];
            return prev.map((m, i) =>
              i === lastIdx ? { ...m, text: displayText, isStreaming: true, _raw: rawAccum } : m
            );
          });
          scrollToBottom(50);
        },
        (data) => {
          setMessages(prev => {
            const lastIdx = prev.length - 1;
            if (lastIdx < 0 || prev[lastIdx].sender !== 'ai') return prev;
            return prev.map((m, i) =>
              i === lastIdx ? { sender: 'ai', text: data.question } : m
            );
          });
          setCurrentQuestion(data.question);
        },
        (error) => {
          console.error('Question stream error:', error);
          const fallback = `Tell me about a challenging ${selectedRole} project you've worked on recently.`;
          setMessages(prev => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].isStreaming) {
              return prev.map((m, i) => i === lastIdx ? { sender: 'ai', text: fallback } : m);
            }
            return [...prev, { sender: 'ai', text: fallback }];
          });
          setCurrentQuestion(fallback);
        },
      );
    } catch (error) {
      console.error('Failed to generate question:', error);
      const questionNumber = messages.filter(m => m.sender === 'ai').length;
      const fallbackQuestion = `Question ${questionNumber}: Tell me about a challenging ${selectedRole || 'role'} project you've worked on recently.`;
      setMessages(prev => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].isStreaming) {
          return prev.map((m, i) => i === lastIdx ? { sender: 'ai', text: fallbackQuestion } : m);
        }
        return [...prev, { sender: 'ai', text: fallbackQuestion }];
      });
      setCurrentQuestion(fallbackQuestion);
      scrollToBottom(200);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const generateQuestionForSession = async (role, sessionDifficulty) => {
    if (!role || role.trim().length < 2) {
      console.error('Invalid role for question generation:', role);
      return;
    }

    setIsGeneratingQuestion(true);

    setMessages(prev => [...prev, { sender: 'ai', text: '', isStreaming: true }]);
    scrollToBottom(200);

    try {
      const apiDifficulty = sessionDifficulty || 'medium';

      const previousQuestions = messages.filter(m => m.sender === 'ai').map(m => m.text);
      const context = buildQuestionContext(previousQuestions);

      await interviewService.generateQuestionStream(
        role,
        apiDifficulty,
        context,
        (token) => {
          setMessages(prev => {
            const lastIdx = prev.length - 1;
            if (lastIdx < 0 || prev[lastIdx].sender !== 'ai') return prev;
            const rawAccum = (prev[lastIdx]._raw || '') + token;
            const displayText = rawAccum.split('\n---')[0];
            return prev.map((m, i) =>
              i === lastIdx ? { ...m, text: displayText, isStreaming: true, _raw: rawAccum } : m
            );
          });
          scrollToBottom(50);
        },
        (data) => {
          setMessages(prev => {
            const lastIdx = prev.length - 1;
            if (lastIdx < 0 || prev[lastIdx].sender !== 'ai') return prev;
            return prev.map((m, i) =>
              i === lastIdx ? { sender: 'ai', text: data.question } : m
            );
          });
          setCurrentQuestion(data.question);
        },
        (error) => {
          console.error('Question stream error:', error);
          showErrorToast('Failed to generate question. Please try again.');
          const fallback = `Tell me about a challenging ${role} project you've worked on recently.`;
          setMessages(prev => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].isStreaming) {
              return prev.map((m, i) => i === lastIdx ? { sender: 'ai', text: fallback } : m);
            }
            return [...prev, { sender: 'ai', text: fallback }];
          });
          setCurrentQuestion(fallback);
        },
      );
    } catch (error) {
      console.error('Failed to generate question:', error);
      showErrorToast('Failed to generate question. Please try again.');
      const fallbackQuestion = `Tell me about a challenging ${role} project you've worked on recently.`;
      setMessages(prev => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && prev[lastIdx].isStreaming) {
          return prev.map((m, i) => i === lastIdx ? { sender: 'ai', text: fallbackQuestion } : m);
        }
        return [...prev, { sender: 'ai', text: fallbackQuestion }];
      });
      setCurrentQuestion(fallbackQuestion);
      scrollToBottom(200);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (!answer.trim() || !currentQuestion) return;

    const timeTaken = stopTimer();
    // Compute before any state update so the count is stable inside the closure
    const answeredCount = messages.filter(m => m.sender === 'user').length + 1;
    const isLastQuestion = sessionHasLimit && answeredCount >= MAX_QUESTIONS;
    // Index of the message we are about to push (stable closure snapshot)
    const newMsgIndex = messages.length;

    setMessages(prev => [...prev, { sender: 'user', text: answer, isEvaluating: true, timeTaken }]);
    setQuestionTimings(prev => [...prev, timeTaken]);
    scrollToBottom(150);
    setIsLoading(true);
    let savedSuccessfully = false;

    try {
      // Evaluate with streaming feedback (same for all questions including the 10th)
      let evaluation = null;
      try {
        evaluation = await new Promise((resolve, reject) => {
          interviewService.evaluateAnswerStream(
            currentQuestion,
            answer,
            selectedRole,
            (token) => {
              setMessages(prev => prev.map((msg, index) => {
                if (index !== newMsgIndex) return msg;
                const raw = (msg._evalRaw || '') + token;
                const newlineIdx = raw.indexOf('\n');
                const feedbackSoFar = newlineIdx !== -1 ? raw.slice(newlineIdx + 1).split('\n---')[0] : '';
                return { ...msg, _evalRaw: raw, streamingFeedback: feedbackSoFar };
              }));
            },
            (data) => resolve(data),
            (error) => reject(error),
          );
        });
      } catch (evalError) {
        console.error('Failed to evaluate answer, using fallback:', evalError);
        const answerLen = answer.trim().length;
        evaluation = {
          score: answerLen > 500 ? 7 : answerLen > 200 ? 6 : answerLen > 50 ? 5 : 4,
          feedback: 'Your answer has been recorded. AI evaluation is temporarily unavailable.',
          improvement_areas: 'Continue practicing and elaborate on your answers with specific examples.',
          isFallback: true,
        };
      }

      // Update message with final evaluation
      setMessages(prev => prev.map((msg, index) =>
        index === newMsgIndex ? {
          ...msg,
          isEvaluating: false,
          streamingFeedback: undefined,
          _evalRaw: undefined,
          evaluation,
        } : msg
      ));
      scrollToBottom(100);

      await interviewService.addQuestionAnswer(currentSession.id, currentQuestion, answer, evaluation);
      savedSuccessfully = true;

      if (!isLastQuestion) {
        await generateQuestion();
      }
    } catch (error) {
      console.error('Failed to process answer:', error);
      showErrorToast('Failed to process your answer');
      setMessages(prev => prev.map((msg, index) =>
        index === newMsgIndex ? { ...msg, isEvaluating: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }

    // After evaluation is shown for the 10th answer, present the upgrade modal
    if (savedSuccessfully && isLastQuestion) {
      setShowUpgradeModal(true);
    }
  };

  const handleInSessionPurchase = async (packKey) => {
    if (!RAZORPAY_KEY_ID) {
      toast.error('Payment is not configured yet. Please try again later.');
      return;
    }
    setLoadingPack(packKey);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your connection.');
        setLoadingPack(null);
        return;
      }

      const { data } = await axios.post(`${API_URL}/payment/create-order`, { pack: packKey });
      const { orderId, amount, currency, sessions, label } = data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'PrepMate',
        description: `${label} Pack — ${sessions} interview sessions`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const res = await axios.post(`${API_URL}/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              pack: packKey,
            });
            await refreshUser();
            toast.success(`${res.data.sessionsAdded} sessions added — continuing your interview!`);
            setShowUpgradeModal(false);
            await generateQuestion();
          } catch {
            toast.error('Payment verification failed. Contact support if amount was deducted.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: { color: '#537D5D' },
        modal: { ondismiss: () => setLoadingPack(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setLoadingPack(null);
    }
  };

  const endInterview = async () => {
    if (!currentSession) return;
    
    setIsEndingInterview(true);
    stopSessionTimer();
    try {
      const result = await interviewService.endSession(currentSession.id);
      setSummary(result.summary);
      setPhase('completed');
      setShowConfetti(true);
      refreshUser();
    } catch (error) {
      console.error('Failed to end interview:', error);
      showErrorToast('Failed to end interview');
    } finally {
      setIsEndingInterview(false);
    }
  };

  const resetInterview = () => {
    stopTimer();
    stopSessionTimer();
    setPhase('setup');
    setSelectedRole('');
    setDifficulty('');
    setCurrentSession(null);
    setMessages([]);
    setCurrentQuestion('');
    setSummary(null);
    setShowConfetti(false);
    setQuestionTimings([]);
    navigate('/interview');
  };

  const MAX_QUESTIONS = 10;
  // Free users (never purchased) are capped at MAX_QUESTIONS per session.
  // Once any pack is bought, totalSessionCredits exceeds the free default of 3.
  const hasPurchased = (currentUser?.totalSessionCredits ?? 3) > 3;
  const sessionHasLimit = !hasPurchased;

  // Render different phases
  if (phase === 'completed') {
    return (
      <div className="bg-light-bg dark:bg-dark-bg">
        {showConfetti && <ConfettiEffect />}
        <InterviewSummary summary={summary} onReset={resetInterview} questionTimings={questionTimings} />
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg px-4">
        <LoadingCard message="Preparing your interview..." className="max-w-sm w-full" />
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <>
        <StartInterviewConfirmModal
          open={!!pendingStart}
          credits={currentUser?.sessionCredits ?? 0}
          onConfirm={confirmStart}
          onCancel={cancelStart}
        />
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
                selectedDifficulty={difficulty}
                onDifficultySelect={setDifficulty}
              />
              
              <div className="px-4 pb-4 text-center border-t border-light-border dark:border-dark-border pt-4">
                <Button
                  onClick={startNewSession}
                  disabled={!selectedRole || !difficulty || isLoading}
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
      </>
    );
  }

  // Interview phase
  const questionCount = messages.filter(m => m.sender === 'ai').length;
  const answerCount = messages.filter(m => m.sender === 'user').length;

  return (
    <div className="interview-layout bg-gradient-to-br from-light-bg via-light-bg to-forest/5 dark:from-dark-bg dark:via-dark-bg dark:to-sage/5">

      {/* Summary generation overlay */}
      {isEndingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
          <div className="bg-white dark:bg-dark-muted rounded-2xl shadow-2xl px-10 py-12 flex flex-col items-center gap-5 max-w-sm w-full mx-4 text-center">
            {/* Animated rings */}
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-forest/20 dark:bg-sage/20 animate-ping" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 dark:bg-sage/10">
                <svg
                  className="h-8 w-8 animate-spin text-forest dark:text-sage"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
                Generating Score Summary
              </h2>
              <p className="text-sm text-light-text/60 dark:text-dark-text/50 mt-1.5">
                Alex is reviewing your performance…
              </p>
            </div>
            {/* Animated dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-forest dark:bg-sage animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade modal — shown when free user hits the 10-question cap */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowUpgradeModal(false); endInterview(); } }}
        >
          <div className="bg-white dark:bg-dark-muted rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Top band */}
            <div className="bg-gradient-to-r from-forest/10 to-sage/10 dark:from-forest/20 dark:to-sage/20 px-6 py-5 text-center border-b border-forest/10 dark:border-forest/20">
              <div className="w-12 h-12 rounded-full bg-forest/10 dark:bg-forest/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-light-text dark:text-dark-text">
                You've answered 10 questions!
              </h2>
              <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
                Free sessions are limited to 10 questions. Buy a pack to keep this interview going — no restart needed.
              </p>
            </div>

            {/* How the math works — shown only to first-time buyers */}
            {(() => {
              const freeCredits = currentUser?.sessionCredits ?? 0;
              const isFirstBuyer = (currentUser?.totalSessionCredits ?? 3) <= 3;
              if (!isFirstBuyer) return null;
              return (
                <div className="mx-5 mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <span className="font-semibold">How this works:</span> Your {freeCredits} free session{freeCredits !== 1 ? 's' : ''} count toward whichever pack you choose — they are not added on top. You get exactly the number of sessions shown below, all unlimited.
                </div>
              );
            })()}

            {/* Pack options */}
            <div className="px-5 py-4 space-y-2.5">
              {SESSION_PACKS.map((pack) => {
                const freeCredits = currentUser?.sessionCredits ?? 0;
                const isFirstBuyer = (currentUser?.totalSessionCredits ?? 3) <= 3;
                // Net sessions after purchase (first buyers: max not add; repeat buyers: add)
                const netSessions = isFirstBuyer ? Math.max(freeCredits, pack.sessions) : freeCredits + pack.sessions;
                const addedNew = isFirstBuyer ? Math.max(0, pack.sessions - freeCredits) : pack.sessions;
                return (
                  <button
                    key={pack.key}
                    onClick={() => handleInSessionPurchase(pack.key)}
                    disabled={!!loadingPack}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                      pack.key === 'popular'
                        ? 'border-forest bg-forest/5 dark:bg-forest/10 hover:bg-forest/10 dark:hover:bg-forest/20'
                        : 'border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-light-text dark:text-dark-text">{pack.label}</span>
                        {pack.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-forest text-white uppercase tracking-wide">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-light-text/50 dark:text-dark-text/50">
                        {isFirstBuyer
                          ? `${freeCredits} free unlocked + ${addedNew} new = ${netSessions} sessions total`
                          : `${pack.sessions} sessions added · ${netSessions} total`
                        } · unlimited questions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {loadingPack === pack.key ? (
                        <svg className="w-4 h-4 animate-spin text-forest" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold text-forest dark:text-sage">₹{pack.price}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-1 text-center space-y-2">
              <p className="text-xs text-light-text/40 dark:text-dark-text/40">
                Credits stack · Secured by Razorpay · No subscription
              </p>
              <button
                onClick={() => { setShowUpgradeModal(false); endInterview(); }}
                className="text-xs text-light-text/40 dark:text-dark-text/40 hover:text-light-text dark:hover:text-dark-text underline underline-offset-2 transition-colors"
              >
                No thanks, end session and see my results
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md border-b border-forest/10 dark:border-sage/20 shadow-sm z-40">
        <div className="container-responsive py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-base">A</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-light-text dark:text-dark-text">
                    Interview with Alex
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
                    <span>Question {questionCount}{sessionHasLimit ? ` / ${MAX_QUESTIONS}` : ''}</span>
                    <span>•</span>
                    <span>{answerCount} answered</span>
                    {sessionTimerRunning && (
                      <>
                        <span>•</span>
                        <span
                          className="font-mono"
                          title="Total interview time"
                        >
                          ⏱ {formatTime(sessionElapsed)}
                        </span>
                      </>
                    )}
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
                  End Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area – scrollable chat */}
      <div className="interview-chat-area" ref={scrollAreaRef}>
        <div className="container-responsive">
          <div className="max-w-5xl mx-auto py-4">
            <div
              ref={chatContainerRef}
              className="px-2 sm:px-4 space-y-6 pb-4"
            >
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white font-bold text-2xl">A</span>
                    </div>
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                      Alex is getting ready...
                    </h3>
                    <p className="text-light-text/60 dark:text-dark-text/60">
                      Your interviewer will be with you in just a moment.
                    </p>
                  </div>
                )}
                
                {messages.map((message, index) => {
                  const nextMsg = messages[index + 1];
                  const isAnswered = message.sender === 'ai' && nextMsg && nextMsg.sender === 'user';
                  const isActiveQuestion =
                    message.sender === 'ai' &&
                    !message.isStreaming &&
                    !!message.text &&
                    !isAnswered &&
                    index === messages.length - 1;
                  const answeredTime = isAnswered ? nextMsg.timeTaken : undefined;
                  return (
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
                                message.streamingFeedback ? (
                                  <div className="mt-1 text-left max-w-sm ml-auto bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-1.5 mb-1 text-indigo-500 dark:text-indigo-400 text-xs font-medium">
                                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Alex is reviewing your answer...
                                    </div>
                                    <p className="text-xs text-light-text/70 dark:text-dark-text/60 leading-relaxed">
                                      {message.streamingFeedback}
                                      <span className="inline-block w-0.5 h-3 bg-forest dark:bg-sage ml-0.5 align-middle animate-pulse" />
                                    </p>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-xs">
                                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-indigo-600 dark:text-indigo-400">Alex is reviewing...</span>
                                  </div>
                                )
                              ) : message.evaluation ? (
                                <div className="inline-flex items-center space-x-2 flex-wrap justify-end gap-y-1">
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
                                  {message.timeTaken !== undefined && (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">
                                      ⏱ {formatTime(message.timeTaken)}
                                    </div>
                                  )}
                                  {message.evaluation.feedback && (
                                    <div className="text-xs text-light-text/60 dark:text-dark-text/60 max-w-xs line-clamp-2">
                                      {message.evaluation.feedback}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2 text-xs text-light-text/40 dark:text-dark-text/40">
                                  <span>You</span>
                                  {message.timeTaken !== undefined && (
                                    <span className="font-mono">⏱ {formatTime(message.timeTaken)}</span>
                                  )}
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
                          {/* Alex Avatar */}
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                            <span className="text-white font-bold text-lg">A</span>
                          </div>

                          {/* Alex Message */}
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Alex</span>
                              {isActiveQuestion && timerRunning && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                  {formatTime(elapsed)}
                                </span>
                              )}
                              {answeredTime !== undefined && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                  Taken {formatTime(answeredTime)}
                                </span>
                              )}
                            </div>
                            <div className="inline-block px-5 py-4 rounded-2xl shadow-md max-w-3xl bg-white dark:bg-dark-muted border border-gray-200 dark:border-gray-700 text-light-text dark:text-dark-text">
                              <p className="text-base leading-relaxed whitespace-pre-wrap">
                                {message.text || (message.isStreaming ? '\u00A0' : '')}
                                {message.isStreaming && (
                                  <span className="inline-block w-0.5 h-[1.1em] bg-forest dark:bg-sage ml-0.5 align-middle animate-pulse" />
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}

                {isGeneratingQuestion && !messages.some(m => m.isStreaming) && (
                  <div className="flex justify-start mt-8">
                    <div className="flex items-start space-x-4 max-w-4xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-lg">A</span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1 ml-1">Alex</div>
                        <div className="bg-white dark:bg-dark-muted border border-gray-200 dark:border-gray-700 px-5 py-4 rounded-2xl shadow-md">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                            <span className="text-sm text-light-text/60 dark:text-dark-text/60 italic">Alex is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar – sticks above virtual keyboard on mobile */}
      <div className="interview-input-bar bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl border-t border-forest/10 dark:border-sage/20 shadow-lg z-40">
        <div className="container-responsive py-3 sm:py-4">
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

      {/* End Interview Loader */}
      {isEndingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white/95 dark:bg-dark-bg/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 mx-4 max-w-xs w-full border border-white/20 dark:border-white/10">
            <div className="text-center">
              {/* Bar loader */}
              <div className="flex items-end justify-center gap-1 h-10 mb-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-forest dark:bg-sage"
                    style={{
                      animation: 'barPulse 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>

              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">
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
