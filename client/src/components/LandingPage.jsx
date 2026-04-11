import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

// ─── Intersection Observer Hook ──────────────────────────────────────────────
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
};

// ─── Static Data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Questions',
    desc: 'Google Gemini generates realistic, role-specific questions tailored to your chosen difficulty level — fresh every session.',
  },
  {
    icon: '📊',
    title: 'Instant AI Evaluation',
    desc: 'Get scored on technical accuracy, clarity, and depth for every answer. Detailed feedback shows exactly where to improve.',
  },
  {
    icon: '🎯',
    title: '9 Tech Roles Covered',
    desc: 'From Software Engineer to Product Manager — practice for the exact role you\'re targeting with role-specific question banks.',
  },
  {
    icon: '📈',
    title: 'Progress Analytics',
    desc: 'Track your scores across sessions, visualize trends over time, and pinpoint weak areas before the real interview.',
  },
  {
    icon: '🎚️',
    title: '3 Difficulty Levels',
    desc: 'Start with beginner-friendly questions and progressively work up to advanced FAANG-style challenges at your pace.',
  },
  {
    icon: '🎤',
    title: 'Voice Input (Pro)',
    desc: 'Answer questions by speaking naturally — just like a real interview. Powered by speech-to-text for hands-free practice.',
  },
];

const ROLES = [
  { label: 'Software Engineer', icon: '💻' },
  { label: 'Frontend Developer', icon: '🎨' },
  { label: 'Backend Developer', icon: '⚙️' },
  { label: 'Full Stack Developer', icon: '🔗' },
  { label: 'Data Scientist', icon: '📊' },
  { label: 'DevOps Engineer', icon: '🚀' },
  { label: 'Product Manager', icon: '📋' },
  { label: 'UX Designer', icon: '✏️' },
  { label: 'QA Engineer', icon: '🔍' },
];

const STEPS = [
  {
    num: '01',
    title: 'Pick Your Role & Level',
    desc: 'Choose from 9 tech roles and select your difficulty — beginner, intermediate, or advanced. No setup required.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Answer AI Questions',
    desc: 'Respond to realistic interview questions in a chat interface at your own pace. Type or speak your answers freely.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Get Instant Feedback',
    desc: 'Receive AI-powered evaluation with a score, detailed feedback, and actionable improvement tips for every answer.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    name: 'Aryan Sharma',
    role: 'SDE-2 at Razorpay',
    avatar: 'AS',
    text: 'PrepMate helped me crack my Razorpay interview in under 3 weeks. The AI feedback was incredibly specific — way better than random LeetCode grinding.',
  },
  {
    name: 'Priya Nair',
    role: 'Frontend Dev at Zomato',
    avatar: 'PN',
    text: 'I practiced system design and behavioral questions daily. The progress tracking kept me motivated. Got my dream offer after 4 weeks of PrepMate!',
  },
  {
    name: 'Rahul Gupta',
    role: 'Data Scientist at Swiggy',
    avatar: 'RG',
    text: 'The role-specific questions were spot on. My actual interviews felt like déjà vu. PrepMate is a must-have for any serious job seeker.',
  },
];

const FAQS = [
  {
    q: 'What is PrepMate?',
    a: 'PrepMate is an AI-powered mock interview platform that simulates real job interviews. You answer questions in a chat interface and receive instant AI-generated feedback on your performance.',
  },
  {
    q: 'How does the free plan work?',
    a: 'The free plan gives you 5 complete interview sessions — no credit card required. Each session includes AI-generated questions and detailed feedback so you can start improving right away.',
  },
  {
    q: 'How does the AI evaluate my answers?',
    a: 'We use Google Gemini to evaluate responses across multiple dimensions: technical accuracy, communication clarity, depth of explanation, and use of concrete examples. You receive a score and actionable written feedback after each response.',
  },
  {
    q: 'What payment methods are accepted?',
    a: "We accept all major credit/debit cards, UPI, net banking, and digital wallets via Razorpay — India's most trusted payment gateway.",
  },
  {
    q: 'Can I cancel my Pro subscription anytime?',
    a: 'Yes, cancel at any time from your profile. Your Pro access continues until the end of your current billing period. No questions asked, no penalties.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use industry-standard JWT authentication, bcrypt password hashing, and HTTPS encryption for all data. Your interview sessions are private and never shared.',
  },
];

const CHAT_SLIDES = [
  {
    role: 'Software Engineer',
    question: 'Explain the difference between REST and GraphQL. When would you choose one over the other?',
    answer: "REST uses fixed endpoints per resource, GraphQL uses a single endpoint. I'd choose GraphQL for complex UIs with multiple data dependencies, and REST for simpler CRUD services...",
    score: 88,
    level: 'Intermediate',
  },
  {
    role: 'Data Scientist',
    question: 'What is the difference between bagging and boosting in ensemble methods?',
    answer: 'Bagging trains models in parallel on random subsets to reduce variance — Random Forest is the classic example. Boosting trains sequentially, each model correcting previous errors...',
    score: 92,
    level: 'Advanced',
  },
  {
    role: 'Product Manager',
    question: 'How would you prioritize features with limited engineering resources?',
    answer: "I'd use RICE scoring — Reach, Impact, Confidence, Effort. After quantifying each feature, I'd align with business OKRs and validate top items with user research before committing...",
    score: 85,
    level: 'Intermediate',
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const LandingPage = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [chatIdx, setChatIdx] = useState(0);
  const [phase, setPhase] = useState(0); // 0=question, 1=answer, 2=score

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, loading, navigate]);

  // Navbar shadow on scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Chat animation cycle
  useEffect(() => {
    const delays = [2200, 3400, 1800];
    const t = setTimeout(() => {
      setPhase(p => {
        if (p < 2) return p + 1;
        setChatIdx(i => (i + 1) % CHAT_SLIDES.length);
        return 0;
      });
    }, delays[phase]);
    return () => clearTimeout(t);
  }, [phase, chatIdx]);

  const slide = CHAT_SLIDES[chatIdx];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  // Scroll-reveal refs
  const [featRef, featInView] = useInView();
  const [stepsRef, stepsInView] = useInView();
  const [rolesRef, rolesInView] = useInView();
  const [pricingRef, pricingInView] = useInView();
  const [testiRef, testiInView] = useInView();
  const [faqRef, faqInView] = useInView();

  return (
    <div className="font-sans overflow-x-hidden text-light-text dark:text-dark-text">

      {/* ─── Sticky Navbar ─────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-dark-bg/90 backdrop-blur-md shadow-md border-b border-light-border dark:border-dark-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'pricing', label: 'Pricing' },
                { id: 'faq', label: 'FAQ' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-light-text/70 dark:text-dark-text/70 hover:text-forest dark:hover:text-sage'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors px-4 py-2 ${
                  scrolled
                    ? 'text-light-text/80 dark:text-dark-text/80 hover:text-forest dark:hover:text-sage'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-forest text-white hover:bg-forest-700 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-light-text dark:text-dark-text' : 'text-white'}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden py-4 border-t border-white/20 bg-forest-900/95 backdrop-blur-md">
              {[
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'pricing', label: 'Pricing' },
                { id: 'faq', label: 'FAQ' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5"
                >
                  {label}
                </button>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-white/10 mt-2">
                <Link to="/login" className="text-center py-2.5 text-sm font-medium text-white border border-white/30 rounded-xl hover:bg-white/10">
                  Sign In
                </Link>
                <Link to="/register" className="text-center py-2.5 text-sm font-bold bg-sage text-forest-900 rounded-xl">
                  Get Started Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-olive-700">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
        {/* Ambient blobs */}
        <div className="absolute top-24 right-16 w-80 h-80 bg-sage/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-24 left-8 w-56 h-56 bg-sand/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — Copy */}
            <div className="text-white">
              {/* AI Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white/90 mb-6">
                <span className="w-2 h-2 bg-sage rounded-full animate-pulse" />
                Powered by Google Gemini AI
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                Ace Your Next
                <span className="block text-sage mt-1">Tech Interview</span>
                <span className="block text-white/80 text-3xl sm:text-4xl lg:text-5xl font-bold mt-1">with AI-Powered Practice</span>
              </h1>

              <p className="text-lg text-white/75 mb-8 leading-relaxed max-w-lg">
                PrepMate simulates real interviews with AI-generated questions, instant scored feedback, and detailed performance analytics. Practice smarter. Land faster.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-sage text-forest-900 font-bold px-8 py-3.5 rounded-xl hover:bg-sage-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
                >
                  Start for Free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-base"
                >
                  How It Works
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-5 text-white/60 text-sm">
                {['Free forever plan', 'No credit card needed', '5 free sessions'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-sage flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Animated Chat Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px]">
                {/* Glow */}
                <div className="absolute -inset-4 bg-sage/20 blur-2xl rounded-3xl" />

                {/* Card */}
                <div
                  className="relative bg-white dark:bg-dark-muted rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                  style={{ animation: 'float 6s ease-in-out infinite' }}
                >
                  {/* Window chrome */}
                  <div className="bg-forest-700 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                      <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/20 text-white/90 px-2.5 py-0.5 rounded-full font-medium">{slide.role}</span>
                      <span className="text-xs bg-white/20 text-white/90 px-2.5 py-0.5 rounded-full">{slide.level}</span>
                    </div>
                  </div>

                  {/* Chat body */}
                  <div className="p-4 space-y-3 min-h-[270px] bg-white dark:bg-dark-muted">
                    {/* AI question */}
                    <div className="flex gap-2.5 items-start">
                      <div className="w-8 h-8 rounded-full bg-forest/15 dark:bg-forest/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                        </svg>
                      </div>
                      <div className="bg-forest-50 dark:bg-forest/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-forest-900 dark:text-sage/90 max-w-[300px] leading-relaxed">
                        {slide.question}
                      </div>
                    </div>

                    {/* User answer */}
                    <div
                      className={`flex gap-2.5 items-start justify-end transition-all duration-500 ${
                        phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <div className="bg-sage/20 dark:bg-sage/10 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-forest-800 dark:text-dark-text max-w-[300px] leading-relaxed">
                        {slide.answer}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-sand dark:bg-sand/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-forest dark:text-sage">
                        You
                      </div>
                    </div>

                    {/* Score badge */}
                    <div
                      className={`flex items-center gap-3 bg-gradient-to-r from-forest/10 to-sage/10 dark:from-forest/30 dark:to-sage/20 border border-forest/20 dark:border-sage/20 rounded-xl px-4 py-3 transition-all duration-500 ${
                        phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-forest dark:bg-forest-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
                        {slide.score}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-forest dark:text-sage">AI Evaluation</p>
                        <p className="text-xs text-forest-700/70 dark:text-dark-text/60 mt-0.5">
                          Strong depth — add a concrete trade-off example.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="px-4 pb-4 bg-white dark:bg-dark-muted">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-xs text-light-text/40 dark:text-dark-text/40 select-none">
                        Type your answer…
                      </div>
                      <button className="bg-forest text-white px-4 py-2 rounded-xl text-xs font-semibold">
                        Submit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating labels */}
                <div className="absolute -top-3 -right-3 bg-sage text-forest-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce-slow whitespace-nowrap">
                  Live AI Feedback
                </div>
                <div className="absolute -bottom-3 -left-3 bg-white dark:bg-dark-muted text-forest dark:text-sage text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-light-border dark:border-dark-border whitespace-nowrap">
                  9 Roles Available
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0,70 C360,10 720,60 1080,30 C1260,15 1380,50 1440,40 L1440,70 Z" className="fill-light-bg dark:fill-dark-bg" />
          </svg>
        </div>
      </section>

      {/* ─── Stats Strip ───────────────────────────────────────────────────── */}
      <section className="bg-light-bg dark:bg-dark-bg py-14">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '9', label: 'Tech Roles' },
            { val: '3', label: 'Difficulty Levels' },
            { val: '∞', label: 'Practice Sessions (Pro)' },
            { val: 'AI', label: 'Powered by Gemini' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-black text-forest dark:text-sage mb-1">{s.val}</div>
              <div className="text-sm text-light-text/55 dark:text-dark-text/55 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-light-bg dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-forest dark:text-sage uppercase tracking-widest mb-3 block">Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Everything to Ace Your Interview</h2>
            <p className="text-light-text/60 dark:text-dark-text/55 max-w-2xl mx-auto text-lg leading-relaxed">
              PrepMate gives you a realistic interview experience with AI that pushes you to perform your absolute best.
            </p>
          </div>

          <div
            ref={featRef}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-7 hover:border-forest/40 dark:hover:border-sage/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 70}ms`, transitionProperty: 'opacity, transform, box-shadow, border-color' }}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-light-text/60 dark:text-dark-text/55 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-forest-50 dark:bg-dark-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-forest dark:text-sage uppercase tracking-widest mb-3 block">Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Interview-Ready in 3 Steps</h2>
            <p className="text-light-text/60 dark:text-dark-text/55 max-w-xl mx-auto text-lg leading-relaxed">
              No setup, no downloads. Open the app and start practicing in under 60 seconds.
            </p>
          </div>

          <div
            ref={stepsRef}
            className="grid md:grid-cols-3 gap-10 relative"
          >
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-transparent via-forest/30 to-transparent" />

            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className={`relative text-center transition-all duration-700 ${stepsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-24 h-24 rounded-2xl bg-forest text-white flex flex-col items-center justify-center mx-auto mb-6 shadow-xl shadow-forest/20">
                  {s.icon}
                  <span className="text-xs font-black mt-1 text-white/70">{s.num}</span>
                </div>
                <h3 className="font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-light-text/60 dark:text-dark-text/55 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-light-bg dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-forest dark:text-sage uppercase tracking-widest mb-3 block">Roles</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Practice for Your Dream Role</h2>
            <p className="text-light-text/60 dark:text-dark-text/55 max-w-xl mx-auto text-lg leading-relaxed">
              Tailored questions for 9 high-demand tech roles — from coding challenges to product strategy.
            </p>
          </div>

          <div
            ref={rolesRef}
            className="flex flex-wrap gap-3 justify-center"
          >
            {ROLES.map((r, i) => (
              <div
                key={r.label}
                className={`flex items-center gap-2.5 bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl px-5 py-3.5 hover:border-forest dark:hover:border-sage hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default ${
                  rolesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 50}ms`, transitionProperty: 'opacity, transform, box-shadow, border-color' }}
              >
                <span className="text-xl">{r.icon}</span>
                <span className="font-medium text-sm">{r.label}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-forest dark:text-sage font-semibold text-sm hover:underline underline-offset-4"
            >
              Start practicing any role for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-forest-50 dark:bg-dark-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-forest dark:text-sage uppercase tracking-widest mb-3 block">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-light-text/60 dark:text-dark-text/55 max-w-xl mx-auto text-lg mb-8 leading-relaxed">
              Start free. Upgrade when you're ready to go all-in on your interview prep.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  !billingAnnual ? 'bg-forest text-white shadow-sm' : 'text-light-text/60 dark:text-dark-text/60 hover:text-light-text dark:hover:text-dark-text'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingAnnual ? 'bg-forest text-white shadow-sm' : 'text-light-text/60 dark:text-dark-text/60 hover:text-light-text dark:hover:text-dark-text'
                }`}
              >
                Annual
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${billingAnnual ? 'bg-sage text-forest-900' : 'bg-forest-100 dark:bg-forest/20 text-forest dark:text-sage'}`}>
                  Save 10%
                </span>
              </button>
            </div>
          </div>

          <div
            ref={pricingRef}
            className={`grid md:grid-cols-2 gap-8 max-w-3xl mx-auto transition-all duration-700 ${pricingInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Free */}
            <div className="bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="font-black text-2xl mb-1">Free</h3>
                <p className="text-light-text/55 dark:text-dark-text/55 text-sm mb-5">Perfect to get started</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black">₹0</span>
                  <span className="text-light-text/50 dark:text-dark-text/50 mb-2 text-sm">/ forever</span>
                </div>
              </div>

              <ul className="space-y-3.5 mb-8 text-sm flex-1">
                {[
                  { text: '5 interview sessions', ok: true },
                  { text: 'Basic job roles', ok: true },
                  { text: 'Text-based answers', ok: true },
                  { text: 'Unlimited sessions', ok: false },
                  { text: 'AI answer evaluation', ok: false },
                  { text: 'Performance analytics', ok: false },
                  { text: 'Voice input', ok: false },
                ].map(item => (
                  <li key={item.text} className={`flex items-center gap-3 ${!item.ok ? 'opacity-35' : ''}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-forest/12 text-forest dark:bg-forest/30 dark:text-sage' : 'bg-light-border dark:bg-dark-border'}`}>
                      {item.ok ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-light-text/30 dark:text-dark-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="block text-center py-3.5 px-6 rounded-xl border-2 border-forest dark:border-sage text-forest dark:text-sage font-bold hover:bg-forest hover:text-white dark:hover:bg-sage dark:hover:text-forest-900 transition-all duration-200"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-forest rounded-2xl p-8 text-white overflow-hidden flex flex-col shadow-2xl shadow-forest/30">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="absolute top-4 right-4 bg-sage text-forest-900 text-xs font-black px-3 py-1 rounded-full shadow">
                Most Popular
              </div>

              <div className="relative mb-6">
                <h3 className="font-black text-2xl mb-1">Pro</h3>
                <p className="text-white/65 text-sm mb-5">For serious job seekers</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black">₹{billingAnnual ? '269' : '299'}</span>
                  <span className="text-white/55 mb-2 text-sm">/ month</span>
                </div>
                {billingAnnual && (
                  <p className="text-white/55 text-xs mt-1.5">₹3,229 billed annually · Save ₹359/year</p>
                )}
              </div>

              <ul className="relative space-y-3.5 mb-8 text-sm flex-1">
                {[
                  'Unlimited interview sessions',
                  'All 9 roles & all difficulty levels',
                  'AI-powered answer evaluation',
                  'Detailed performance summaries',
                  'Session history & analytics',
                  'Voice input support',
                  'Priority support',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-sage/25 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="relative block text-center py-3.5 px-6 rounded-xl bg-sage text-forest-900 font-black hover:bg-sage-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Free, Upgrade Anytime
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-light-text/45 dark:text-dark-text/45 mt-7 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Payments secured by Razorpay · Cancel anytime · No hidden fees
          </p>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-light-bg dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-bold text-forest dark:text-sage uppercase tracking-widest mb-3 block">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Developers Who Aced It</h2>
            <p className="text-light-text/60 dark:text-dark-text/55 max-w-xl mx-auto text-lg">
              Real stories from developers who used PrepMate to land their dream roles.
            </p>
          </div>

          <div ref={testiRef} className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  testiInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 100}ms`, transitionProperty: 'opacity, transform, box-shadow' }}
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-light-text/70 dark:text-dark-text/65 text-sm leading-relaxed mb-6">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest/15 dark:bg-forest/35 flex items-center justify-center font-black text-sm text-forest dark:text-sage">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-light-text/50 dark:text-dark-text/50">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-forest-50 dark:bg-dark-muted">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-bold text-forest dark:text-sage uppercase tracking-widest mb-3 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Got Questions?</h2>
            <p className="text-light-text/60 dark:text-dark-text/55 text-lg">Everything you need to know about PrepMate.</p>
          </div>

          <div
            ref={faqRef}
            className={`space-y-3 transition-all duration-700 ${faqInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {FAQS.map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-sm hover:text-forest dark:hover:text-sage transition-colors gap-4"
                >
                  <span>{item.q}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                      openFAQ === i ? 'rotate-180 text-forest dark:text-sage' : 'text-light-text/35 dark:text-dark-text/35'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === i && (
                  <div className="px-6 pb-5 text-sm text-light-text/60 dark:text-dark-text/60 leading-relaxed border-t border-light-border dark:border-dark-border pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-28 bg-gradient-to-br from-forest-900 via-forest-800 to-olive-700 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sand/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join developers who have used PrepMate to build confidence, sharpen skills, and walk into their tech interviews fully prepared.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-sage text-forest-900 font-black px-10 py-4 rounded-xl hover:bg-sage-500 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-base"
            >
              Start for Free — No Card Needed
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-10 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-base"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-forest-900 text-white/55 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 text-sage">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M8 10h8" />
                  <path d="M12 7v6" />
                </svg>
                <span className="font-extrabold text-white text-xl tracking-tight">PrepMate</span>
              </div>
              <p className="text-sm leading-relaxed">
                AI-powered mock interview platform for serious tech job seekers.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Account</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/register" className="text-white/55 hover:text-white transition-colors">Sign Up Free</Link></li>
                <li><Link to="/login" className="text-white/55 hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/forgot-password" className="text-white/55 hover:text-white transition-colors">Reset Password</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/terms" className="text-white/55 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-white/55 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} PrepMate. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Powered by
              <span className="text-sage font-semibold ml-0.5">Google Gemini AI</span>
              <span className="opacity-40">·</span>
              Payments by
              <span className="text-sage font-semibold ml-0.5">Razorpay</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Float keyframe */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
