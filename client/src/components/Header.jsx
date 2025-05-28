import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Templates', href: '/templates', icon: '📝' },
    { name: 'Progress', href: '/progress', icon: '📈' },
    { name: 'Interview', href: '/interview', icon: '🎯' },
  ];

  return (
    <header className="bg-white/95 dark:bg-dark-muted/95 backdrop-blur-sm shadow-sm border-b border-light-border dark:border-dark-border sticky top-0 z-40">
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/"} 
              className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity duration-200"
              onClick={closeMobileMenu}
            >
              <Logo size="sm" />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {isAuthenticated && (
              <nav className="flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`header-link ${isActiveLink(item.href) ? 'header-link-active' : ''}`}
                  >
                    <span className="mr-2 text-sm">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                {/* User info - Hidden on mobile */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-light-text dark:text-dark-text">
                      {currentUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-light-text/60 dark:text-dark-text/60">
                      Welcome back
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-forest/10 dark:bg-sage/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-forest dark:text-sage">
                      {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Desktop logout button */}
                <button
                  onClick={handleLogout}
                  className="hidden lg:inline-flex btn btn-ghost btn-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-light-text dark:text-dark-text hover:bg-forest/5 dark:hover:bg-sage/5 transition-colors duration-200"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="btn btn-ghost btn-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && isAuthenticated && (
        <div className="mobile-menu">
          <div 
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
          />
          <div className={`mobile-menu-panel ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
                <Logo size="sm" />
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-light-text dark:text-dark-text hover:bg-forest/5 dark:hover:bg-sage/5"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User info section */}
              <div className="p-4 border-b border-light-border dark:border-dark-border bg-forest/5 dark:bg-sage/5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-forest/10 dark:bg-sage/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-forest dark:text-sage">
                      {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">
                      {currentUser?.name || 'User'}
                    </p>
                    <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                      {currentUser?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActiveLink(item.href)
                        ? 'bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage border border-forest/20 dark:border-sage/20'
                        : 'text-light-text dark:text-dark-text hover:bg-forest/5 dark:hover:bg-sage/5'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                    {isActiveLink(item.href) && (
                      <div className="w-2 h-2 bg-forest dark:bg-sage rounded-full ml-auto" />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Mobile menu footer */}
              <div className="p-4 border-t border-light-border dark:border-dark-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
