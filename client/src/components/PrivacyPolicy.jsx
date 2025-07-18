import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest/5 via-olive/5 to-sage/10 dark:from-dark-bg dark:via-dark-muted dark:to-dark-bg py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-light-text dark:text-dark-text mb-2">
            Privacy Policy
          </h1>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="card card-elevated p-6 sm:p-8 mb-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              1. Information We Collect
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-4">
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This includes:
            </p>
            <ul className="list-disc list-inside text-light-text/80 dark:text-dark-text/80 mb-6 space-y-2">
              <li>Account information (name, email address, password)</li>
              <li>Interview session data and responses</li>
              <li>Usage data and preferences</li>
              <li>Communication records when you contact us</li>
            </ul>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-light-text/80 dark:text-dark-text/80 mb-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate personalized interview questions and feedback</li>
              <li>Track your progress and performance</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve our AI algorithms</li>
            </ul>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              3. Information Sharing and Disclosure
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-light-text/80 dark:text-dark-text/80 mb-6 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>In connection with a business transfer or merger</li>
              <li>With service providers who assist us in operating our platform</li>
            </ul>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              4. Data Security
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              5. AI and Machine Learning
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              PrepMate uses artificial intelligence to enhance your interview practice experience. Your interview responses may be processed by AI systems to provide personalized feedback and improve our services. We ensure that AI processing is done securely and in accordance with this privacy policy.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              6. Data Retention
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. You may request deletion of your account and associated data at any time.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-light-text/80 dark:text-dark-text/80 mb-6 space-y-2">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of certain communications</li>
              <li>Request a copy of your data</li>
              <li>Withdraw consent where applicable</li>
            </ul>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              8. Cookies and Tracking Technologies
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              We use cookies and similar tracking technologies to collect information about your browsing activities and to provide a better user experience. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              9. Third-Party Services
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              10. Children's Privacy
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              11. International Data Transfers
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers are conducted in accordance with applicable data protection laws.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
              13. Contact Us
            </h2>
            <p className="text-light-text/80 dark:text-dark-text/80 mb-6">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-light-muted dark:bg-dark-muted p-4 rounded-lg mb-6">
              <p className="text-light-text dark:text-dark-text">
                <strong>Email:</strong> privacy@prepmate.com<br />
                <strong>Address:</strong> PrepMate Privacy Team<br />
                <strong>Response Time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link 
            to="/terms" 
            className="btn btn-ghost"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terms of Service
          </Link>
          <Link 
            to="/login" 
            className="btn btn-secondary"
          >
            Back to Login
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 