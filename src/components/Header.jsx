import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { funds } = useFunds();
  const { isAuthenticated, isAdmin, profile, user, loginWithGoogle, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileNavRef = useRef(null);
  const hamburgerBtnRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sayfa değiştiğinde açık olan tüm menüleri ve aramayı kapat
  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsUserMenuOpen(false);
    setIsFocused(false);
    setIsMobileSearchOpen(false);
    setSearchTerm('');
  }, [location.pathname]);

  // Body scroll lock for mobile nav drawer
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [isMobileNavOpen]);

  // Dışarı tıklandığında dropdown ve mobil menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsFocused(false);
        setIsMobileSearchOpen(false);
        setSearchTerm('');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        isMobileNavOpen &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(e.target) &&
        hamburgerBtnRef.current &&
        !hamburgerBtnRef.current.contains(e.target)
      ) {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileNavOpen]);

  // Escape tuşu ile menüleri kapatma (Erişilebilirlik)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isMobileNavOpen) setIsMobileNavOpen(false);
        if (isUserMenuOpen) setIsUserMenuOpen(false);
        if (isFocused) {
          setIsFocused(false);
          setSearchTerm('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen, isUserMenuOpen, isFocused]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google giriş hatası:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Çıkış hatası:', err);
    }
  };

  // Kullanıcı avatar'ını belirle
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || 'Yatırımcı';
  const username = profile?.username || 'yatirimci';

  // Arama sonuçlarını filtrele
  const filteredFunds = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    return funds
      .filter(f =>
        f.code.toLowerCase().includes(term) ||
        f.name.toLowerCase().includes(term) ||
        f.category?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [searchTerm, funds]);

  // Fon seçimi
  const handleSelect = (code) => {
    setSearchTerm('');
    setIsFocused(false);
    navigate(`/fon/${code}`);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredFunds.length > 0) {
      handleSelect(filteredFunds[0].code);
    }
  };

  return (
    <header className={`header ${isScrolled ? 'shrink' : ''}`}>
      <div className="container header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img src="/logo.webp" alt="FonSohbet Logo" className="header-logo-img" width="160" height="40" />
          </Link>
          <nav className="main-nav">
            <Link to="/fonlar" className="nav-link">Fonlar</Link>
            <Link to="/forum" className="nav-link">Forum</Link>
            <Link to="/bul" className="nav-link">Fonunu Bul</Link>
          </nav>
        </div>
        
        <div className="header-right">
          {/* Mobil Arama İkonu (sadece mobilde görünür) */}
          <button
            className="mobile-search-toggle"
            onClick={() => {
              setIsMobileSearchOpen(true);
              setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
            }}
            aria-label="Ara"
          >
            <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16ZM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Arama Barı (masaüstünde her zaman görünür, mobilde isMobileSearchOpen ile açılır) */}
          <div className={`header-search ${isMobileSearchOpen ? 'mobile-expanded' : ''}`} ref={searchRef}>
            <div 
              className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}
              onClick={() => mobileSearchInputRef.current?.focus()}
            >
              <svg className="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16ZM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                ref={mobileSearchInputRef}
                type="text"
                className="search-bar-input"
                placeholder="Fon ara... (Örn: THF, Altın)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleInputKeyDown}
              />
              {/* Mobilde açıkken kapatma X butonu */}
              {isMobileSearchOpen && (
                <button
                  className="mobile-search-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileSearchOpen(false);
                    setIsFocused(false);
                    setSearchTerm('');
                  }}
                  aria-label="Aramayı Kapat"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Sonuç Dropdown */}
            {isFocused && filteredFunds.length > 0 && (
              <div className="search-dropdown">
                {filteredFunds.map(f => (
                  <button
                    key={f.code}
                    className="search-result-item"
                    onClick={() => handleSelect(f.code)}
                  >
                    <span className="sr-code">{f.code}</span>
                    <span className="sr-name">{f.name.length > 40 ? f.name.substring(0, 40) + '...' : f.name}</span>
                    <span className={`sr-perf ${f.returns.monthly >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {f.returns.monthly >= 0 ? '+' : ''}{f.returns.monthly.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Sonuç bulunamadı */}
            {isFocused && searchTerm.trim().length > 0 && filteredFunds.length === 0 && (
              <div className="search-dropdown">
                <div className="search-no-result">"{searchTerm}" ile eşleşen fon bulunamadı</div>
              </div>
            )}
          </div>

          {/* Auth Alanı */}
          {isAuthenticated ? (
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button 
                className="user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                id="user-menu-trigger"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="user-avatar-fallback">{displayName[0].toUpperCase()}</div>
                )}
                <span className="user-display-name">{displayName}</span>
                <svg className={`chevron-icon ${isUserMenuOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="dropdown-displayname">{displayName}</span>
                    <span className="dropdown-username">@{username}</span>
                  </div>
                  <div className="user-dropdown-divider" />
                  <Link 
                    to="/profil" 
                    className="user-dropdown-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 01.41-1.068A6.97 6.97 0 0110 11a6.97 6.97 0 016.126 2.425 1.23 1.23 0 01.41 1.068A1.5 1.5 0 0115.055 16H4.945a1.5 1.5 0 01-1.48-1.507z" /></svg>
                    Profilim
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{ color: '#D97706', fontWeight: 600 }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      Yönetim Paneli
                    </Link>
                  )}
                  <button className="user-dropdown-item logout-item" onClick={handleLogout}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" /><path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" /></svg>
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-google-login" onClick={handleGoogleLogin} id="google-login-btn">
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="google-btn-text">Google ile Giriş</span>
            </button>
          )}

          {/* Hamburger Menü Butonu (Mobil & Tablet) */}
          <button
            ref={hamburgerBtnRef}
            className={`hamburger-btn ${isMobileNavOpen ? 'active' : ''}`}
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label={isMobileNavOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span className="hamburger-line line-1" />
            <span className="hamburger-line line-2" />
            <span className="hamburger-line line-3" />
          </button>
        </div>
      </div>

      {/* Mobil Navigasyon Çekmecesi & Karartma Perdesi (Portal ile body'ye bağlanır) */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <div
            className={`mobile-nav-backdrop ${isMobileNavOpen ? 'open' : ''}`}
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-drawer"
            ref={mobileNavRef}
            className={`mobile-nav-drawer ${isMobileNavOpen ? 'open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobil Gezinme Menüsü"
          >
            <div className="mobile-drawer-header">
              <Link to="/" className="mobile-drawer-logo" onClick={() => setIsMobileNavOpen(false)}>
                <img src="/logo.webp" alt="FonSohbet Logo" width="140" height="35" />
              </Link>
              <button
                className="mobile-drawer-close"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Menüyü Kapat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Kullanıcı Giriş Yapmışsa Profil Kartı */}
            {isAuthenticated && (
              <div className="mobile-drawer-user-card">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="mobile-drawer-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="mobile-drawer-avatar-fallback">{displayName[0].toUpperCase()}</div>
                )}
                <div className="mobile-drawer-user-info">
                  <span className="mobile-drawer-user-name">{displayName}</span>
                  <span className="mobile-drawer-user-handle">@{username}</span>
                </div>
                <Link to="/profil" className="mobile-drawer-profile-badge" onClick={() => setIsMobileNavOpen(false)}>
                  Profil
                </Link>
              </div>
            )}

            <nav className="mobile-drawer-nav">
              <Link 
                to="/" 
                className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                onClick={() => setIsMobileNavOpen(false)}
              >
                <div className="mn-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="mn-text-wrapper">
                  <span className="mn-text">Ana Sayfa</span>
                  <span className="mn-desc">Piyasa özeti ve güncel tartışmalar</span>
                </div>
                <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <Link 
                to="/fonlar" 
                className={`mobile-nav-link ${location.pathname.startsWith('/fon') && location.pathname !== '/bul' ? 'active' : ''}`} 
                onClick={() => setIsMobileNavOpen(false)}
              >
                <div className="mn-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M3 3v18h18"/>
                    <path d="m19 9-5 5-4-4-3 3"/>
                  </svg>
                </div>
                <div className="mn-text-wrapper">
                  <span className="mn-text">Fonlar</span>
                  <span className="mn-desc">Tüm TEFAS fonları ve analizler</span>
                </div>
                <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <Link 
                to="/forum" 
                className={`mobile-nav-link ${location.pathname === '/forum' ? 'active' : ''}`} 
                onClick={() => setIsMobileNavOpen(false)}
              >
                <div className="mn-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="mn-text-wrapper">
                  <span className="mn-text">Forum</span>
                  <span className="mn-desc">Yatırımcı topluluğu ve sohbetler</span>
                </div>
                <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <Link 
                to="/bul" 
                className={`mobile-nav-link ${location.pathname === '/bul' ? 'active' : ''}`} 
                onClick={() => setIsMobileNavOpen(false)}
              >
                <div className="mn-icon-wrapper highlight">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                  </svg>
                </div>
                <div className="mn-text-wrapper">
                  <span className="mn-text">Fonunu Bul</span>
                  <span className="mn-desc">Risk profiline uygun fon önerileri</span>
                </div>
                <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              {isAuthenticated && (
                <Link 
                  to="/profil" 
                  className={`mobile-nav-link ${location.pathname === '/profil' ? 'active' : ''}`} 
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <div className="mn-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="mn-text-wrapper">
                    <span className="mn-text">Profilim</span>
                    <span className="mn-desc">Yorumlar ve kaydedilen içerikler</span>
                  </div>
                  <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              )}

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={`mobile-nav-link ${location.pathname === '/admin' ? 'active' : ''}`} 
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <div className="mn-icon-wrapper" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </div>
                  <div className="mn-text-wrapper">
                    <span className="mn-text" style={{ color: '#D97706', fontWeight: 600 }}>Yönetim Paneli</span>
                    <span className="mn-desc">Spam temizleme ve moderatör araçları</span>
                  </div>
                  <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              )}
            </nav>

            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <button className="mobile-drawer-logout-btn" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Çıkış Yap</span>
                </button>
              ) : (
                <button className="mobile-drawer-google-btn" onClick={handleGoogleLogin}>
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google ile Giriş Yap</span>
                </button>
              )}
              <div className="mobile-drawer-brand-note">
                FonSohbet • TEFAS Fon Platformu
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};

export default Header;
