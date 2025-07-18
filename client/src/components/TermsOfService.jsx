import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest/5 via-olive/5 to-sage/10 dark:from-dark-bg dark:via-dark-muted dark:to-dark-bg py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-light-text dark:text-dark-text mb-2">
            Terms of Service
          </h1>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="card card-elevated p-6 sm:p-8 mb-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              By accessing and using PrepMate ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              2. Description of Service
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              PrepMate is an AI-powered interview coaching platform designed to help users practice and improve their interview skills. The service includes mock interviews, personalized feedback, and performance tracking features.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              3. User Accounts
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-4">
              To access certain features of the Service, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-light-text/80 dark:text-dark-text/80 mb-6 space-y-2">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-light-text/80 dark:text-dark-text/80 mb-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload or transmit malicious code or content</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Use the Service for commercial purposes without permission</li>
            </ul>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              The Service and its original content, features, and functionality are owned by PrepMate and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              6. Privacy Policy
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              7. AI-Generated Content
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              PrepMate uses artificial intelligence to generate interview questions and provide feedback. While we strive for accuracy, AI-generated content may not always be perfect or suitable for all situations. Users should use their judgment when applying AI-generated advice.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              PrepMate shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              9. Termination
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              11. Contact Information
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              If you have any questions about these Terms of Service, please contact us at support@prepmate.com.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link 
            to="/login" 
            className="btn btn-secondary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
          <Link 
            to="/privacy" 
            className="btn btn-ghost"
          >
            Privacy Policy
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 