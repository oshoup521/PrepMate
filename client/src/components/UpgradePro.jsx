import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../utils/axiosConfig';
import AuthContext from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

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

const PACKS = {
  starter: { label: 'Starter', sessions: 5,  price: 149, perSession: 30,  badge: null,         desc: 'Try it out' },
  popular: { label: 'Popular', sessions: 15, price: 299, perSession: 20,  badge: 'Most Popular', desc: 'Best value' },
  power:   { label: 'Power',   sessions: 30, price: 499, perSession: 17,  badge: 'Best Deal',   desc: 'For serious prep' },
};

const FAQ_ITEMS = [
  {
    q: 'Do credits expire?',
    a: 'No. Your session credits never expire — use them at your own pace.',
  },
  {
    q: 'What payment methods are accepted?',
    a: "Credit/debit cards, UPI, net banking, and wallets — all processed securely by Razorpay, India's most trusted gateway.",
  },
  {
    q: 'Can I buy multiple packs?',
    a: 'Yes. Credits stack — buy a Starter now and a Popular pack later, and all credits add up.',
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
  const [loadingPack, setLoadingPack] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const { currentUser, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const credits = currentUser?.sessionCredits ?? 0;

  const handlePurchase = async (packKey) => {
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
            toast.success(`${res.data.sessionsAdded} sessions added to your account!`);
            navigate('/dashboard');
          } catch {
            toast.error('Payment verification failed. Contact support if amount was deducted.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        config: {
          display: {
            hide: [
              { method: 'emi' },
              { method: 'paylater' },
            ],
          },
        },
        theme: { color: '#537D5D' },
        modal: { ondismiss: () => setLoadingPack(null) },
      };

      const rzp = new window.Razorpay(options);

      // Intercept Razorpay's injected backdrop (inline styles override CSS)
      const observer = new MutationObserver(() => {
        const backdrop = document.querySelector('.razorpay-backdrop');
        if (backdrop) {
          backdrop.style.background = 'rgba(0,0,0,0.55)';
          backdrop.style.backdropFilter = 'blur(6px)';
          backdrop.style.webkitBackdropFilter = 'blur(6px)';
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">

      {/* Hero */}
      <div className="pt-14 pb-10 px-4 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage text-xs font-bold uppercase tracking-widest">
          Session Packs
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-light-text dark:text-dark-text mb-3 leading-tight">
          Buy sessions,{' '}
          <span className="gradient-text">no subscriptions</span>
        </h1>
        <p className="text-light-text/60 dark:text-dark-text/60 max-w-sm mx-auto text-base">
          Pay only for what you need. Credits never expire.
        </p>

        {credits > 0 && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage text-sm font-semibold">
            <CheckIcon className="w-4 h-4" />
            {credits} session{credits !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-12">

        {/* Pack cards */}
        <div className="grid sm:grid-cols-3 gap-5 items-start">
          {Object.entries(PACKS).map(([key, pack]) => {
            const isPopular = key === 'popular';
            const isLoading = loadingPack === key;
            return (
              <div
                key={key}
                className={`relative bg-white dark:bg-dark-muted rounded-2xl p-6 flex flex-col ${
                  isPopular
                    ? 'border-2 border-forest shadow-xl shadow-forest/10'
                    : 'border border-light-border dark:border-dark-border'
                }`}
              >
                {pack.badge && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span className="px-4 py-1 bg-forest text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-md">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isPopular ? 'text-forest dark:text-sage' : 'text-light-text/40 dark:text-dark-text/40'}`}>
                    {pack.label}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-light-text dark:text-dark-text">
                      ₹{pack.price}
                    </span>
                  </div>
                  <p className="text-sm text-light-text/50 dark:text-dark-text/50 mt-1">
                    {pack.sessions} sessions · ₹{pack.perSession}/session
                  </p>
                  <p className="text-xs text-forest dark:text-sage font-medium mt-0.5">{pack.desc}</p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {[
                    `${pack.sessions} interview sessions`,
                    'All job roles & difficulty levels',
                    'AI answer evaluation',
                    'Performance summaries',
                    'Voice input support',
                    'Credits never expire',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
                      <CheckIcon className="w-4 h-4 text-forest flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(key)}
                  disabled={!!loadingPack}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-forest hover:bg-forest-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-forest/10 dark:bg-forest/20 hover:bg-forest/20 dark:hover:bg-forest/30 text-forest dark:text-sage'
                  }`}
                >
                  {isLoading ? (
                    <><SpinnerIcon /> Opening payment…</>
                  ) : (
                    `Get ${pack.sessions} sessions · ₹${pack.price}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-light-text/40 dark:text-dark-text/40">
          <ShieldIcon />
          Secured by Razorpay · Credits stack · No subscription
        </p>

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

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-forest to-forest-700 rounded-2xl p-7 text-center text-white">
          <p className="font-bold text-lg mb-1">Start practicing smarter</p>
          <p className="text-white/70 text-sm mb-5">No subscription. No commitment. Just sessions when you need them.</p>
          <button
            onClick={() => handlePurchase('popular')}
            disabled={!!loadingPack}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-forest font-bold text-sm hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {loadingPack === 'popular' ? <><SpinnerIcon /> Opening payment…</> : 'Get 15 sessions · ₹299'}
          </button>
          <p className="text-white/40 text-xs mt-3 flex items-center justify-center gap-1.5">
            <ShieldIcon />
            Secured by Razorpay
          </p>
        </div>

      </div>
    </div>
  );
};

export default UpgradePro;
