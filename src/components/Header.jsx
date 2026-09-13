import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Header.css';

const Header = () => {
  const { funds } = useFunds();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsFocused(false);
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

          <Link to="/profil" className="btn btn-outline login-btn">Giriş Yap</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
