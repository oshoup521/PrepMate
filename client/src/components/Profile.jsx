import React, { useState, useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import interviewService from '../services/interviewService';
import { Button } from './LoadingSpinner';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';

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

const Profile = () => {
  const { currentUser } = useContext(AuthContext);

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

  const initials = currentUser?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="container-responsive section-spacing">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-light-text dark:text-dark-text mb-1">
            My <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm">
            Manage your account details
          </p>
        </div>

        {/* Account info card */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-forest to-olive dark:from-sage dark:to-sand flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-light-text dark:text-dark-text truncate">
                {currentUser?.name}
              </p>
              <p className="text-sm text-light-text/60 dark:text-dark-text/60 truncate">
                {currentUser?.email}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Email verified
              </span>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-forest/10 dark:bg-sage/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
                Change Password
              </h2>
              <p className="text-xs text-light-text/50 dark:text-dark-text/50">
                Enter your current password to set a new one
              </p>
            </div>
          </div>

          {success && (
            <div className="alert alert-success mb-5 flex items-center gap-2 text-sm">
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
              onChange={v => { setCurrentPassword(v); setErrors(p => ({ ...p, currentPassword: '' })); setSuccess(false); }}
              error={errors.currentPassword}
              placeholder="Enter your current password"
            />
            <PasswordField
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={v => { setNewPassword(v); setErrors(p => ({ ...p, newPassword: '' })); setSuccess(false); }}
              error={errors.newPassword}
              placeholder="At least 6 characters"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: '' })); setSuccess(false); }}
              error={errors.confirmPassword}
              placeholder="Re-enter new password"
            />

            {/* Strength hint */}
            {newPassword.length > 0 && (
              <PasswordStrengthBar password={newPassword} />
            )}

            <div className="pt-1">
              <Button
                type="submit"
                loading={loading}
                loadingText="Saving..."
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={
                  !loading && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }
              >
                Save New Password
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

/* ---------- Password strength bar ---------- */
const PasswordStrengthBar = ({ password }) => {
  const score = (() => {
    let s = 0;
    if (password.length >= 8)               s++;
    if (password.length >= 12)              s++;
    if (/[A-Z]/.test(password))             s++;
    if (/[0-9]/.test(password))             s++;
    if (/[^A-Za-z0-9]/.test(password))      s++;
    return s; // 0–5
  })();

  const label  = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][score];
  const colors = [
    'bg-red-500', 'bg-red-400', 'bg-yellow-400',
    'bg-yellow-500', 'bg-green-500', 'bg-green-600',
  ];
  const textColors = [
    'text-red-500', 'text-red-400', 'text-yellow-500',
    'text-yellow-600', 'text-green-600', 'text-green-700',
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-light-border dark:bg-dark-border'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{label}</p>
    </div>
  );
};

export default Profile;
