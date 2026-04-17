import React, { useState, useContext, useMemo } from 'react';
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

const RETAIL_PER_SESSION = 50;

const PACKS = {
  starter: { label: 'Starter', sessions: 5,  price: 225, perSession: 45, badge: null,           desc: 'Try it out' },
  popular: { label: 'Popular', sessions: 15, price: 525, perSession: 35, badge: 'Most Popular', desc: 'Best value' },
  power:   { label: 'Power',   sessions: 30, price: 900, perSession: 30, badge: 'Best Deal',    desc: 'For serious prep' },
};

const CUSTOM_MIN = 1;
const CUSTOM_MAX = 100;
const CUSTOM_DEFAULT = 10;

// Mirrors server/src/payment/payment.service.ts — keep in sync.
// Server recomputes and is source of truth; this is for live UI preview only.
const CUSTOM_BRACKETS = [
  { upTo: 5,   paisePerSession: 5000 },
  { upTo: 15,  paisePerSession: 3000 },
  { upTo: 30,  paisePerSession: 2500 },
  { upTo: 100, paisePerSession: 2200 },
];

function calcCustomPaise(sessions) {
  let remaining = sessions;
  let prevCap = 0;
  let total = 0;
  for (const b of CUSTOM_BRACKETS) {
    const take = Math.min(remaining, b.upTo - prevCap);
    total += take * b.paisePerSession;
    remaining -= take;
    prevCap = b.upTo;
    if (remaining <= 0) break;
  }
  return total;
}

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
  const [loadingKey, setLoadingKey] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [customCount, setCustomCount] = useState(CUSTOM_DEFAULT);
  const { currentUser, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const credits = currentUser?.sessionCredits ?? 0;

  const customPreview = useMemo(() => {
    const n = Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.floor(customCount) || CUSTOM_MIN));
    const paise = calcCustomPaise(n);
    const price = paise / 100;
    const perSession = price / n;
    return { n, price, perSession };
  }, [customCount]);

  // Find a pack that beats the custom price for the same or fewer sessions — nudge.
  const packHint = useMemo(() => {
    const { n, price } = customPreview;
    const better = Object.values(PACKS).find(
      (p) => p.sessions >= n && p.price <= price,
    );
    if (!better) return null;
    const extra = better.sessions - n;
    const saved = price - better.price;
    if (extra <= 0 && saved <= 0) return null;
    return { pack: better, extra, saved };
  }, [customPreview]);

  const handlePurchase = async (payload) => {
    // payload is { pack: key } or { sessions: n }
    if (!RAZORPAY_KEY_ID) {
      toast.error('Payment is not configured yet. Please try again later.');
      return;
    }

    const key = payload.pack || `custom-${payload.sessions}`;
    setLoadingKey(key);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your connection.');
        setLoadingKey(null);
        return;
      }

      const { data } = await axios.post(`${API_URL}/payment/create-order`, payload);
      const { orderId, amount, currency, sessions, label } = data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'PrepMate',
        description: `${label} — ${sessions} interview session${sessions === 1 ? '' : 's'}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const res = await axios.post(`${API_URL}/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...payload,
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
        modal: { ondismiss: () => setLoadingKey(null) },
      };

      const rzp = new window.Razorpay(options);

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
      setLoadingKey(null);
    }
  };

  const handleCustomChange = (raw) => {
    if (raw === '') { setCustomCount(''); return; }
    const n = Math.floor(Number(raw));
    if (Number.isNaN(n)) return;
    setCustomCount(Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, n)));
  };

  const customLoadingKey = `custom-${customPreview.n}`;
  const isCustomLoading = loadingKey === customLoadingKey;
  const anyLoading = !!loadingKey;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">

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

        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Limited-time intro pricing · Up to 40% off
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 items-start">
          {Object.entries(PACKS).map(([key, pack]) => {
            const isPopular = key === 'popular';
            const isLoading = loadingKey === key;
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
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-light-text dark:text-dark-text">
                      ₹{pack.price}
                    </span>
                    <span className="text-sm text-light-text/40 dark:text-dark-text/40 line-through mb-1">
                      ₹{pack.sessions * RETAIL_PER_SESSION}
                    </span>
                  </div>
                  <p className="text-sm text-light-text/50 dark:text-dark-text/50 mt-1">
                    {pack.sessions} sessions · ₹{pack.perSession}/session
                  </p>
                  <p className="text-xs text-forest dark:text-sage font-semibold mt-0.5">
                    Save {Math.round((1 - pack.price / (pack.sessions * RETAIL_PER_SESSION)) * 100)}% · {pack.desc}
                  </p>
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
                  onClick={() => handlePurchase({ pack: key })}
                  disabled={anyLoading}
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

        {/* Custom quantity */}
        <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-6 sm:p-7">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 text-light-text/40 dark:text-dark-text/40">
                Choose your own amount
              </p>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                Custom session bundle
              </h3>
              <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-0.5">
                Pick any number from {CUSTOM_MIN} to {CUSTOM_MAX}. Price scales with quantity.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-light-text/50 dark:text-dark-text/50 mb-2">
                Number of sessions
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCustomChange((customPreview.n - 1).toString())}
                  disabled={anyLoading || customPreview.n <= CUSTOM_MIN}
                  className="w-10 h-11 rounded-lg bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage font-bold text-lg hover:bg-forest/20 dark:hover:bg-forest/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease sessions"
                >
                  −
                </button>
                <input
                  type="number"
                  min={CUSTOM_MIN}
                  max={CUSTOM_MAX}
                  value={customCount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  onBlur={() => { if (customCount === '' || customCount < CUSTOM_MIN) setCustomCount(CUSTOM_MIN); }}
                  disabled={anyLoading}
                  className="flex-1 h-11 px-3 text-center text-lg font-semibold bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/40"
                />
                <button
                  type="button"
                  onClick={() => handleCustomChange((customPreview.n + 1).toString())}
                  disabled={anyLoading || customPreview.n >= CUSTOM_MAX}
                  className="w-10 h-11 rounded-lg bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage font-bold text-lg hover:bg-forest/20 dark:hover:bg-forest/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase sessions"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min={CUSTOM_MIN}
                max={CUSTOM_MAX}
                value={customPreview.n}
                onChange={(e) => handleCustomChange(e.target.value)}
                disabled={anyLoading}
                className="w-full mt-4 accent-forest"
                aria-label="Sessions slider"
              />
            </div>

            <div className="bg-forest/5 dark:bg-forest/10 rounded-xl p-4">
              <div className="flex items-end justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-light-text/50 dark:text-dark-text/50">
                  Total
                </span>
                <span className="text-3xl font-bold text-light-text dark:text-dark-text">
                  ₹{customPreview.price.toFixed(customPreview.price % 1 === 0 ? 0 : 2)}
                </span>
              </div>
              <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                {customPreview.n} session{customPreview.n === 1 ? '' : 's'} · ₹{customPreview.perSession.toFixed(2)}/session
              </p>
              {packHint && (
                <p className="text-xs text-forest dark:text-sage font-medium mt-2">
                  Tip: {packHint.pack.label} pack gives you {packHint.pack.sessions} sessions for ₹{packHint.pack.price}
                  {packHint.saved > 0 && ` — save ₹${packHint.saved.toFixed(0)}`}
                  {packHint.extra > 0 && ` (+${packHint.extra} extra)`}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => handlePurchase({ sessions: customPreview.n })}
            disabled={anyLoading}
            className="w-full mt-5 py-3.5 rounded-xl font-semibold text-sm bg-forest hover:bg-forest-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCustomLoading ? (
              <><SpinnerIcon /> Opening payment…</>
            ) : (
              `Get ${customPreview.n} session${customPreview.n === 1 ? '' : 's'} · ₹${customPreview.price.toFixed(customPreview.price % 1 === 0 ? 0 : 2)}`
            )}
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-light-text/40 dark:text-dark-text/40">
          <ShieldIcon />
          Secured by Razorpay · Credits stack · No subscription
        </p>

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

        <div className="bg-gradient-to-r from-forest to-forest-700 rounded-2xl p-7 text-center text-white">
          <p className="font-bold text-lg mb-1">Start practicing smarter</p>
          <p className="text-white/70 text-sm mb-5">No subscription. No commitment. Just sessions when you need them.</p>
          <button
            onClick={() => handlePurchase({ pack: 'popular' })}
            disabled={anyLoading}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-forest font-bold text-sm hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {loadingKey === 'popular' ? <><SpinnerIcon /> Opening payment…</> : `Get ${PACKS.popular.sessions} sessions · ₹${PACKS.popular.price}`}
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
