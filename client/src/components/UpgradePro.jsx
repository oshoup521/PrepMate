import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../utils/axiosConfig';
import AuthContext from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PLANS = {
  monthly: { label: 'Monthly', price: 299, amount: 29900, perMonth: 299, period: '/month' },
  annual:  { label: 'Annual',  price: 3229, amount: 322900, perMonth: 269, period: '/year', savingLabel: 'Save ₹359 — 10% off' },
};

const FREE_FEATURES = [
  { text: '5 interview sessions total', ok: true },
  { text: 'Basic job roles only', ok: true },
  { text: 'Text answers only', ok: true },
  { text: 'Unlimited sessions', ok: false },
  { text: 'All job roles & difficulty levels', ok: false },
  { text: 'AI answer evaluation', ok: false },
  { text: 'Performance summaries', ok: false },
  { text: 'Voice input', ok: false },
];

const PRO_FEATURES = [
  'Unlimited interview sessions',
  'All job roles & difficulty levels',
  'AI-powered answer evaluation',
  'Detailed performance summaries',
  'Voice input support',
  'Priority support',
];

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: "Yes. Cancel whenever you want — your Pro access stays active until the end of your billing period. No hidden fees.",
  },
  {
    q: 'What payment methods are accepted?',
    a: "Credit/debit cards, UPI, net banking, and wallets — all processed securely by Razorpay, India's most trusted gateway.",
  },
  {
    q: 'What happens after my 5 free sessions?',
    a: "You'll need Pro to keep practicing. Your session history, scores, and progress are always preserved.",
  },
  {
    q: 'Is my payment information secure?',
    a: "Absolutely. All payments go through Razorpay with bank-level encryption. We never store your card details.",
  },
];

const CheckIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-light-text/20 dark:text-dark-text/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-light-text dark:text-dark-text hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors"
      >
        <span>{item.q}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 ml-4 text-light-text/40 dark:text-dark-text/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-2 text-sm text-light-text/70 dark:text-dark-text/70 border-t border-light-border dark:border-dark-border">
          {item.a}
        </div>
      )}
    </div>
  );
}

const UpgradePro = () => {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const { currentUser, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!RAZORPAY_KEY_ID) {
      toast.error('Payment is not configured yet. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your connection.');
        setLoading(false);
        return;
      }

      const { data } = await axios.post(`${API_URL}/payment/create-order`, { plan: selectedPlan });
      const { orderId, amount, currency } = data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'PrepMate',
        description: `Pro Plan — ${PLANS[selectedPlan].label}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await axios.post(`${API_URL}/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan,
            });
            await refreshUser();
            toast.success('Welcome to Pro! Enjoy unlimited sessions.');
            navigate('/dashboard');
          } catch {
            toast.error('Payment verification failed. Contact support if amount was deducted.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: { color: '#537D5D' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const isPro = currentUser?.plan === 'pro';

  /* ─── Already on Pro ─── */
  if (isPro) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Pro status card */}
          <div className="relative bg-forest rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">Active plan</p>
                  <p className="text-lg font-bold leading-tight">PrepMate Pro</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 rounded-xl p-3.5">
                  <p className="text-white/50 text-xs mb-0.5">Billing</p>
                  <p className="font-semibold text-sm capitalize">{currentUser?.billingCycle || 'Monthly'}</p>
                </div>
                {currentUser?.planExpiresAt && (
                  <div className="bg-white/10 rounded-xl p-3.5">
                    <p className="text-white/50 text-xs mb-0.5">Renews</p>
                    <p className="font-semibold text-sm">
                      {new Date(currentUser.planExpiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckIcon className="w-4 h-4 text-green-300 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl bg-white text-forest font-semibold text-sm hover:bg-white/90 transition-colors active:scale-[0.98]"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Upgrade page ─── */
  const plan = PLANS[selectedPlan];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">

      {/* Hero */}
      <div className="pt-14 pb-10 px-4 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage text-xs font-bold uppercase tracking-widest">
          PrepMate Pro
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-light-text dark:text-dark-text mb-3 leading-tight">
          Ace every interview,{' '}
          <span className="gradient-text">every time</span>
        </h1>
        <p className="text-light-text/60 dark:text-dark-text/60 max-w-sm mx-auto text-base">
          Unlimited AI-powered practice with no session limits.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-12">

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-full p-1 shadow-sm gap-1">
            {Object.entries(PLANS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedPlan === key
                    ? 'bg-forest text-white shadow'
                    : 'text-light-text/60 dark:text-dark-text/60 hover:text-light-text dark:hover:text-dark-text'
                }`}
              >
                {p.label}
                {p.savingLabel && (
                  <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedPlan === key
                      ? 'bg-white/20 text-white'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    −10%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 items-start">

          {/* Free card */}
          <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-light-text/40 dark:text-dark-text/40 mb-1">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-light-text dark:text-dark-text">₹0</span>
                <span className="text-light-text/40 dark:text-dark-text/40 text-sm pb-1">forever</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className={`flex items-center gap-2.5 text-sm ${f.ok ? 'text-light-text dark:text-dark-text' : 'text-light-text/30 dark:text-dark-text/30'}`}>
                  {f.ok
                    ? <CheckIcon className="w-4 h-4 text-forest flex-shrink-0" />
                    : <XIcon />
                  }
                  <span className={!f.ok ? 'line-through' : ''}>{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="w-full py-2.5 rounded-xl border border-light-border dark:border-dark-border text-center text-sm text-light-text/40 dark:text-dark-text/40 font-medium select-none">
              Your current plan
            </div>
          </div>

          {/* Pro card */}
          <div className="relative bg-white dark:bg-dark-muted border-2 border-forest rounded-2xl p-6 shadow-xl shadow-forest/10">
            {/* Most popular badge */}
            <div className="absolute -top-3.5 inset-x-0 flex justify-center">
              <span className="px-4 py-1 bg-forest text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </span>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-forest dark:text-sage mb-1">Pro</p>
              <div className="flex items-end gap-1 flex-wrap">
                <span className="text-4xl font-bold text-light-text dark:text-dark-text">
                  ₹{plan.perMonth.toLocaleString('en-IN')}
                </span>
                <span className="text-light-text/40 dark:text-dark-text/40 text-sm pb-1">/ month</span>
              </div>
              {selectedPlan === 'annual' ? (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-sm text-light-text/40 dark:text-dark-text/40 line-through">₹299/mo</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold">
                    Save ₹359/year
                  </span>
                  <span className="text-xs text-light-text/40 dark:text-dark-text/40">· billed annually</span>
                </div>
              ) : (
                <p className="text-sm text-light-text/40 dark:text-dark-text/40 mt-1">billed monthly</p>
              )}
            </div>

            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-light-text dark:text-dark-text">
                  <CheckIcon className="w-4 h-4 text-forest flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Opening payment…
                </>
              ) : (
                `Upgrade — ₹${plan.price.toLocaleString('en-IN')}${plan.period}`
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-light-text/40 dark:text-dark-text/40 mt-3">
              <ShieldIcon />
              Secured by Razorpay · Cancel anytime
            </p>
          </div>
        </div>

        {/* What you get — full-width row */}
        <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-6 sm:p-8">
          <h2 className="text-base font-semibold text-light-text dark:text-dark-text mb-5 text-center">
            Everything in Pro
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { title: 'Unlimited sessions', desc: 'Practice as much as you need — no monthly cap.' },
              { title: 'All job roles', desc: 'SWE, PM, Design, Data Science, and more.' },
              { title: 'Multiple difficulty levels', desc: 'Junior → Senior → Staff — pick your challenge.' },
              { title: 'AI answer evaluation', desc: 'Instant, rubric-based feedback on every answer.' },
              { title: 'Performance summaries', desc: 'End-of-session scores and improvement tips.' },
              { title: 'Voice input', desc: 'Speak your answers naturally, just like a real interview.' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-forest/10 dark:bg-forest/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="w-3.5 h-3.5 text-forest dark:text-sage" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{title}</p>
                  <p className="text-xs text-light-text/50 dark:text-dark-text/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto w-full">
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text text-center mb-5">
            Frequently asked questions
          </h2>
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="bg-gradient-to-r from-forest to-forest-700 rounded-2xl p-7 text-center text-white">
          <p className="font-bold text-lg mb-1">Ready to level up?</p>
          <p className="text-white/70 text-sm mb-5">Join learners who practice smarter with PrepMate Pro.</p>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-forest font-bold text-sm hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? <><SpinnerIcon /> Opening payment…</> : `Get Pro · ₹${plan.price.toLocaleString('en-IN')}${plan.period}`}
          </button>
          <p className="text-white/40 text-xs mt-3 flex items-center justify-center gap-1.5">
            <ShieldIcon />
            Secured by Razorpay · Cancel anytime
          </p>
        </div>

      </div>
    </div>
  );
};

export default UpgradePro;
