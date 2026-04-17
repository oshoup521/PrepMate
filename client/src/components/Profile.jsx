import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import interviewService from '../services/interviewService';
import { Button } from './LoadingSpinner';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';

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
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { refreshUser(); }, []);

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

  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const credits       = currentUser?.sessionCredits ?? 0;
  const rawTotal      = currentUser?.totalSessionCredits ?? credits;
  const totalCredits  = Math.max(rawTotal, credits);
  const usedCredits   = Math.max(totalCredits - credits, 0);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="container-responsive py-8 sm:py-10">

        {/* ── Page heading ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Profile</h1>
          <p className="text-sm text-light-text/50 dark:text-dark-text/50 mt-0.5">Manage your account and subscription</p>
        </div>

        {/* ── Two-column grid on desktop ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-start">

          {/* ══ LEFT COLUMN: identity + security ══ */}
          <div className="lg:col-span-1 space-y-5">

            {/* Identity card */}
            <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-sm">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br from-forest to-olive dark:from-sage dark:to-sand">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>

              {/* Name + credit badge */}
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight truncate">
                  {currentUser?.name}
                </h2>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                  credits > 0
                    ? 'bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                }`}>
                  {credits} {credits === 1 ? 'session' : 'sessions'}
                </span>
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

          {/* ══ RIGHT COLUMN: session credits ══ */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-muted border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              {/* Top band */}
              <div className={`px-6 py-4 flex items-center justify-between gap-4 border-b ${
                credits > 0
                  ? 'bg-gradient-to-r from-forest/5 to-sage/5 dark:from-forest/10 dark:to-sage/10 border-forest/20 dark:border-forest/30'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800/40'
              }`}>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${credits > 0 ? 'text-forest dark:text-sage' : 'text-amber-600 dark:text-amber-400'}`}>
                    Session Credits
                  </p>
                  <p className="font-bold text-light-text dark:text-dark-text">
                    {credits > 0 ? `${credits} session${credits !== 1 ? 's' : ''} remaining` : 'No sessions left'}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 ${
                  credits > 0
                    ? 'bg-forest/10 dark:bg-forest/20 text-forest dark:text-sage'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                }`}>
                  {credits}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-5">
                {/* Credit bar */}
                <div>
                  <div className="flex justify-between text-xs text-light-text/40 dark:text-dark-text/40 mb-1.5">
                    <span>{credits} of {totalCredits} remaining</span>
                    <span>{usedCredits} used</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${credits > 0 ? 'bg-forest' : 'bg-amber-400'}`}
                      style={{ width: `${totalCredits > 0 ? Math.round((credits / totalCredits) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Pack info */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Starter', sessions: 5,  price: '₹225' },
                    { label: 'Popular', sessions: 15, price: '₹525' },
                    { label: 'Power',   sessions: 30, price: '₹900' },
                  ].map(p => (
                    <div key={p.label} className="bg-light-bg dark:bg-dark-bg rounded-xl p-3">
                      <p className="text-xs text-light-text/40 dark:text-dark-text/40">{p.label}</p>
                      <p className="font-bold text-light-text dark:text-dark-text text-sm mt-0.5">{p.sessions} sessions</p>
                      <p className="text-xs text-forest dark:text-sage font-semibold">{p.price}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/upgrade')}
                  className="w-full py-3.5 rounded-xl bg-forest text-white font-bold text-sm hover:bg-olive transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  {credits > 0 ? 'Buy more sessions' : 'Buy sessions to continue'}
                </button>
                <p className="text-center text-xs text-light-text/40 dark:text-dark-text/40 -mt-2">
                  Credits never expire · Secured by Razorpay
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Profile;
