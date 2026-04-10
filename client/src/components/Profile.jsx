import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import interviewService from '../services/interviewService';
import { Button } from './LoadingSpinner';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';

/* ─── Password eye toggle field ─── */
const PasswordField = ({ id, label, value, onChange, error, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`form-input pr-11 ${error ? 'form-input-error' : ''}`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-light-text/40 dark:text-dark-text/40 hover:text-light-text dark:hover:text-dark-text transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

/* ─── Password strength bar ─── */
const PasswordStrengthBar = ({ password }) => {
  const score = (() => {
    let s = 0;
    if (password.length >= 8)          s++;
    if (password.length >= 12)         s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const labels     = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors     = ['bg-red-500', 'bg-red-400', 'bg-yellow-400', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
  const textColors = ['text-red-500', 'text-red-400', 'text-yellow-500', 'text-yellow-600', 'text-green-600', 'text-green-700'];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-light-border dark:bg-dark-border'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
};

const PRO_FEATURES = [
  'Unlimited interview sessions',
  'All job roles & difficulty levels',
  'AI-powered answer evaluation',
  'Detailed performance summaries',
  'Voice input support',
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ══════════════════════════════════════════════
   PROFILE PAGE
   ══════════════════════════════════════════════ */
const Profile = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!currentPassword) e.currentPassword = 'Current password is required';
    if (!newPassword)     e.newPassword     = 'New password is required';
    else if (newPassword.length < 6) e.newPassword = 'Must be at least 6 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (currentPassword && newPassword && currentPassword === newPassword)
      e.newPassword = 'New password must be different from current password';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    if (!validate()) return;
    setLoading(true);
    try {
      await interviewService.changePassword(currentPassword, newPassword);
      showSuccessToast('Password changed successfully!');
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setPwOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      if (msg.toLowerCase().includes('current')) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        showErrorToast(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isPro    = currentUser?.plan === 'pro';
  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const renewal  = currentUser?.planExpiresAt;
  const days     = daysUntil(renewal);
  const renewalStr = renewal
    ? new Date(renewal).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="container-responsive py-8 sm:py-10">

        {/* ── Page heading ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Profile</h1>
          <p className="text-sm text-light-text/50 dark:text-dark-text/50 mt-0.5">Manage your account and subscription</p>
        </div>

        {/* ── Two-column grid on desktop ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ══ LEFT COLUMN: identity + security ══ */}
          <div className="lg:col-span-1 space-y-5">

            {/* Identity card */}
            <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-sm">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md ${isPro ? 'bg-forest' : 'bg-gradient-to-br from-forest to-olive dark:from-sage dark:to-sand'}`}>
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>

              {/* Name + plan badge */}
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight truncate">
                  {currentUser?.name}
                </h2>
                {isPro ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-forest text-white tracking-widest uppercase flex-shrink-0">
                    PRO
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-light-border dark:border-dark-border text-light-text/50 dark:text-dark-text/50 tracking-widest uppercase flex-shrink-0">
                    FREE
                  </span>
                )}
              </div>

              {/* Email */}
              <p className="text-sm text-light-text/60 dark:text-dark-text/60 truncate mb-3">
                {currentUser?.email}
              </p>

              {/* Verified badge */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Email verified
              </div>
            </div>

            {/* Account & Security card */}
            <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-light-border dark:border-dark-border">
                <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Account & Security</h3>
                <p className="text-xs text-light-text/50 dark:text-dark-text/50 mt-0.5">Change your password</p>
              </div>

              {/* Change password toggle */}
              <button
                onClick={() => { setPwOpen(v => !v); setSuccess(false); }}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-light-text dark:text-dark-text hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-light-text/40 dark:text-dark-text/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </div>
                <svg
                  className={`w-4 h-4 text-light-text/30 dark:text-dark-text/30 transition-transform duration-200 ${pwOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {pwOpen && (
                <div className="px-5 pb-5 border-t border-light-border dark:border-dark-border pt-4">
                  {success && (
                    <div className="alert alert-success mb-4 flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Password changed successfully.
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <PasswordField
                      id="currentPassword"
                      label="Current Password"
                      value={currentPassword}
                      onChange={v => { setCurrentPassword(v); setErrors(p => ({ ...p, currentPassword: '' })); }}
                      error={errors.currentPassword}
                      placeholder="Enter your current password"
                    />
                    <PasswordField
                      id="newPassword"
                      label="New Password"
                      value={newPassword}
                      onChange={v => { setNewPassword(v); setErrors(p => ({ ...p, newPassword: '' })); }}
                      error={errors.newPassword}
                      placeholder="At least 6 characters"
                    />
                    {newPassword.length > 0 && <PasswordStrengthBar password={newPassword} />}
                    <PasswordField
                      id="confirmPassword"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                      error={errors.confirmPassword}
                      placeholder="Re-enter new password"
                    />
                    <div className="pt-1">
                      <Button
                        type="submit"
                        loading={loading}
                        loadingText="Saving..."
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={!loading && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      >
                        Save New Password
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT COLUMN: subscription ══ */}
          <div className="lg:col-span-2">
            {isPro ? (
              /* ── Pro subscription card ── */
              <div className="relative bg-forest rounded-2xl overflow-hidden shadow-xl shadow-forest/20 h-full">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-white/5 rounded-full pointer-events-none" />

                <div className="relative p-6 sm:p-8 flex flex-col h-full">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Current Plan</p>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">PrepMate Pro</h2>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/20 text-white tracking-widest uppercase">
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-white/50 text-xs mb-1">Billing cycle</p>
                      <p className="text-white font-semibold capitalize">{currentUser.billingCycle || 'Monthly'}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {currentUser.billingCycle === 'annual' ? '₹3,229 / year' : '₹299 / month'}
                      </p>
                    </div>
                    {renewalStr && (
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-white/50 text-xs mb-1">Renews on</p>
                        <p className="text-white font-semibold">{renewalStr}</p>
                        {days !== null && (
                          <p className={`text-xs mt-0.5 ${days <= 7 ? 'text-amber-300' : 'text-white/40'}`}>
                            {days === 0 ? 'Renews today' : `in ${days} day${days !== 1 ? 's' : ''}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">What's included</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                      {PRO_FEATURES.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-white/90">
                          <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/10 pt-5 mt-auto">
                    <p className="text-white/40 text-xs mb-4">
                      Your plan auto-renews on {renewalStr || 'your billing date'}. To cancel, reach out to support before the renewal date.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-2.5 rounded-xl bg-white text-forest font-semibold text-sm hover:bg-white/90 transition-colors active:scale-[0.98]"
                      >
                        Go to Dashboard
                      </button>
                      <a
                        href="mailto:support@prepmate.com?subject=Cancel%20Subscription"
                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors text-center active:scale-[0.98]"
                      >
                        Contact Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Free plan card ── */
              <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
                {/* Top band */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-800/40 px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-0.5">Current plan</p>
                    <p className="font-bold text-light-text dark:text-dark-text">Free — 5 sessions total</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 uppercase tracking-wide flex-shrink-0">
                    Free
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-widest text-light-text/40 dark:text-dark-text/40 mb-4">Unlock with Pro</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 flex-1">
                    {[
                      { text: 'Unlimited sessions', desc: 'No 5-session cap' },
                      { text: 'All job roles & levels', desc: 'SWE, PM, Design and more' },
                      { text: 'AI answer evaluation', desc: 'Instant rubric-based scores' },
                      { text: 'Performance summaries', desc: 'Track improvement over time' },
                      { text: 'Voice input', desc: 'Speak like a real interview' },
                    ].map(({ text, desc }) => (
                      <li key={text} className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-forest dark:text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-light-text dark:text-dark-text">{text}</p>
                          <p className="text-xs text-light-text/40 dark:text-dark-text/40">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/upgrade')}
                    className="w-full py-3.5 rounded-xl bg-forest text-white font-bold text-sm hover:bg-olive transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Upgrade to Pro — from ₹299/mo
                  </button>
                  <p className="text-center text-xs text-light-text/40 dark:text-dark-text/40 mt-2.5">
                    Secured by Razorpay · Cancel anytime
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
