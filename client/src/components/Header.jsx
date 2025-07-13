import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import { Button, IconButton } from './LoadingSpinner';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('🚪 Logout function called');
    try {
      logout();
      navigate('/login');
      setIsMenuOpen(false);
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMenuOpen]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
      </svg>
    )},
    { path: '/interview', label: 'Interview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )},
    { path: '/templates', label: 'Templates', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { path: '/progress', label: 'Progress', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )}
  ];

  return (
    <>
      <header className="bg-white dark:bg-dark-muted border-b border-light-border dark:border-dark-border sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-dark-muted/95">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          {currentUser && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`header-link ${isActive(item.path) ? 'header-link-active' : ''}`}
                  onClick={closeMenu}
                >
                  <span className="hidden xl:flex items-center space-x-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  <span className="xl:hidden">
                    {item.icon}
                  </span>
                </Link>
              ))}
            </nav>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {currentUser ? (
              <>
                {/* User Info - Desktop */}
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-light-text dark:text-dark-text">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-light-text/60 dark:text-dark-text/60">
                      {currentUser.email}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-forest dark:bg-sage rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {currentUser.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Logout Button - Desktop */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Logout
                </Button>

                {/* Mobile Menu Button */}
                <IconButton
                  icon={
                    isMenuOpen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="lg:hidden touch-manipulation"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMenuOpen}
                />
              </>
            ) : (
              /* Auth Buttons - Not logged in */
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="primary"
                  size="sm"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

          </header>
    
    {/* Mobile Menu Portal - Outside header to avoid z-index stacking context issues */}
    {currentUser && isMenuOpen && (
      <div className="mobile-menu lg:hidden">
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMenu}
          onTouchEnd={closeMenu}
        />
        <div className="mobile-menu-panel">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <Logo size="sm" />
            <IconButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              onClick={closeMenu}
              aria-label="Close menu"
              className="z-10"
            />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* User Info - Mobile */}
            <div className="flex items-center space-x-3 mb-4 p-3 bg-forest/5 dark:bg-sage/5 rounded-lg flex-shrink-0">
              <div className="w-10 h-10 bg-forest dark:bg-sage rounded-full flex items-center justify-center">
                <span className="text-base font-medium text-white">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-light-text dark:text-dark-text truncate">
                  {currentUser.name}
                </p>
                <p className="text-sm text-light-text/60 dark:text-dark-text/60 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Navigation Links - Mobile */}
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 cursor-pointer
                    ${isActive(item.path) 
                      ? 'bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage' 
                      : 'text-light-text dark:text-dark-text hover:bg-forest/5 dark:hover:bg-sage/5'
                    }
                  `}
                  onClick={closeMenu}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    closeMenu();
                  }}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Logout Button - Mobile - Fixed at bottom */}
          <div className="border-t border-light-border dark:border-dark-border pt-3 flex-shrink-0">
            <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
              variant="ghost"
              fullWidth
              className="touch-manipulation"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Header;
