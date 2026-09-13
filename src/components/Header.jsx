import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { funds } = useFunds();
  const { isAuthenticated, profile, user, loginWithGoogle, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dışarı tıklandığında dropdown'ları kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Anlık filtreleme
  const filteredFunds = searchTerm.trim().length > 0
    ? funds.filter(f =>
        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = (code) => {
    setSearchTerm('');
    setIsFocused(false);
    navigate(`/fon/${code}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredFunds.length > 0) {
      handleSelect(filteredFunds[0].code);
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      setSearchTerm('');
    }
  };

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

  return (
    <header className={`header ${isScrolled ? 'shrink' : ''}`}>
      <div className="container header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="FonSohbet Logo" className="header-logo-img" />
          </Link>
          <nav className="main-nav">
            <Link to="/fonlar" className="nav-link">Fonlar</Link>
            <Link to="/forum" className="nav-link">Forum</Link>
            <Link to="/bul" className="nav-link">Fonunu Bul</Link>
          </nav>
        </div>
        
        <div className="header-right">
          {/* Arama Barı */}
          <div className="header-search" ref={searchRef}>
            <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
              <svg className="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16ZM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                className="search-bar-input"
                placeholder="Fon ara... (Örn: THF, Altın)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
              />
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
        </div>
      </div>
    </header>
  );
};

export default Header;
