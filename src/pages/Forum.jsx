import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { useAuth } from '../context/AuthContext';
import './Forum.css';

const Forum = () => {
  const { funds, discussions, addNewDiscussion } = useFunds();
  const { isAuthenticated, user, profile, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('Yeni');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFundCode, setNewFundCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Fon Arama (Searchbar ile aynı sistem)
  const [fundSearchTerm, setFundSearchTerm] = useState('');
  const [isFundSearchFocused, setIsFundSearchFocused] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const fundSearchRef = useRef(null);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fundSearchRef.current && !fundSearchRef.current.contains(e.target)) {
        setIsFundSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal için filtrelenmiş fonlar
  const filteredModalFunds = React.useMemo(() => {
    const term = fundSearchTerm.trim().toLowerCase();
    if (!term) {
      return funds.slice(0, 8); // Arama boşken popüler ilk 8 fon
    }
    return funds.filter(f =>
      f.code.toLowerCase().includes(term) ||
      f.name.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [funds, fundSearchTerm]);

  const handleSelectModalFund = (fund) => {
    setSelectedFund(fund);
    setNewFundCode(fund.code);
    setFundSearchTerm(`${fund.code} - ${fund.name}`);
    setIsFundSearchFocused(false);
  };

  const handleClearModalFund = () => {
    setSelectedFund(null);
    setNewFundCode('');
    setFundSearchTerm('');
    setIsFundSearchFocused(false);
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (!isAuthenticated) {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error('Giriş hatası:', err);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const codeClean = (selectedFund?.code || newFundCode || fundSearchTerm.split(' ')[0]).trim().toUpperCase();
      const validFund = funds.find(f => f.code.toUpperCase() === codeClean);
      const fundCodeToSave = validFund ? validFund.code : null;

      await addNewDiscussion({
        title: newTitle.trim(),
        fundCode: fundCodeToSave,
        content: newContent.trim(),
        userId: user.id,
      });
      setNewTitle('');
      setNewFundCode('');
      setFundSearchTerm('');
      setSelectedFund(null);
      setNewContent('');
      setIsModalOpen(false);
    } catch (err) {
      alert('Tartışma eklenirken bir sorun oluştu: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewDiscussionClick = () => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    setFundSearchTerm('');
    setSelectedFund(null);
    setNewFundCode('');
    setIsModalOpen(true);
  };

  // Tartışmaları en yeniden eskiye göre sırala
  const displayedDiscussions = React.useMemo(() => {
    let list = [...discussions];
    list.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });
    return list;
  }, [discussions]);

  return (
    <div className="forum-page container animate-fade-in">
      <div className="forum-header">
        <h1 className="page-title">Forum Tartışmaları</h1>
        <button className="btn btn-primary hero-btn" onClick={handleNewDiscussionClick}>+ Yeni Tartışma</button>
      </div>

      <div className="common-tabs">
        {['Yeni'].map(tab => (
          <button 
            key={tab}
            className={`common-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="forum-list">
        {displayedDiscussions.length > 0 ? (
          displayedDiscussions.map(disc => (
            <div className="forum-list-item" key={disc.id}>
              <div className="forum-item-main">
                <Link to={disc.fundCode ? `/fon/${disc.fundCode}` : '/forum'} className="forum-item-title">{disc.title}</Link>
                <p className="forum-item-desc">
                  {disc.fundCode ? `Bu tartışma ${disc.fundCode} fonu hakkında paylaşıldı.` : 'Genel yatırım ve fon piyasaları tartışması.'}
                </p>
                <div className="forum-item-meta">
                  {disc.fundCode ? (
                    <Link to={`/fon/${disc.fundCode}`} className="fund-badge">{disc.fundCode}</Link>
                  ) : (
                    <span className="fund-badge badge-blue">GENEL</span>
                  )}
                  <span className="meta-dot">·</span>
                  <span className="meta-item">
                    {disc.authorAvatar && (
                      <img src={disc.authorAvatar} alt="" className="meta-avatar" referrerPolicy="no-referrer" />
                    )}
                    {disc.author}
                  </span>
                  <span className="meta-dot">·</span>
                  <span className="meta-item">{disc.lastActivity || 'Az önce'}</span>
                </div>
              </div>
              <div className="forum-item-stats">
                <div className="stat-box">
                  <span className="stat-num">{disc.commentsCount || 0}</span>
                  <span className="stat-label">Yorum</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
            <p style={{ fontSize: '16px', color: '#64748B', marginBottom: '16px' }}>
              Henüz hiçbir tartışma konusu açılmamış.
            </p>
            <button className="btn btn-primary hero-btn" onClick={handleNewDiscussionClick}>+ İlk Tartışmayı Başlat</button>
          </div>
        )}
      </div>

      {/* Yeni Tartışma Modalı */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yeni Tartışma Başlat</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <p className="modal-desc">Hangi fon hakkında fikirlerinizi veya sorularınızı paylaşmak istiyorsunuz?</p>
            <form className="modal-form" onSubmit={handleCreateDiscussion}>
              {/* Fon Seçim Searchbar (Header searchbar ile aynı sistem) */}
              <div className="modal-fund-search-wrapper" ref={fundSearchRef}>
                <div className={`modal-fund-input-box ${isFundSearchFocused ? 'focused' : ''}`}>
                  <svg className="modal-fund-search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16ZM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input 
                    type="text" 
                    className="modal-fund-search-input" 
                    placeholder="Fon seçin veya arayın... (Örn: THF, Altın)" 
                    value={fundSearchTerm}
                    onChange={e => {
                      setFundSearchTerm(e.target.value);
                      if (selectedFund && !e.target.value.includes(selectedFund.code)) {
                        setSelectedFund(null);
                        setNewFundCode('');
                      }
                      setIsFundSearchFocused(true);
                    }}
                    onFocus={() => setIsFundSearchFocused(true)}
                  />
                  {(fundSearchTerm || selectedFund) && (
                    <button 
                      type="button" 
                      className="modal-fund-clear-btn" 
                      onClick={handleClearModalFund}
                      title="Temizle"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Dropdown Sonuç Listesi */}
                {isFundSearchFocused && filteredModalFunds.length > 0 && (
                  <div className="modal-fund-dropdown">
                    {filteredModalFunds.map(f => (
                      <button
                        key={f.code}
                        type="button"
                        className="modal-fund-item"
                        onClick={() => handleSelectModalFund(f)}
                      >
                        <span className="modal-fund-code">{f.code}</span>
                        <span className="modal-fund-name" title={f.name}>{f.name}</span>
                        <span className={`modal-fund-perf ${f.returns?.monthly >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {f.returns?.monthly >= 0 ? '+' : ''}{f.returns?.monthly != null ? f.returns.monthly.toFixed(2) : '0.00'}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sonuç bulunamadı */}
                {isFundSearchFocused && fundSearchTerm.trim().length > 0 && filteredModalFunds.length === 0 && (
                  <div className="modal-fund-dropdown">
                    <div className="modal-fund-no-result">
                      "{fundSearchTerm}" ile eşleşen fon bulunamadı (Genel konu olarak açılacak)
                    </div>
                  </div>
                )}
              </div>
              <input 
                type="text" 
                className="input-base" 
                placeholder="Konu Başlığı *" 
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <textarea 
                className="input-base" 
                rows="5" 
                placeholder="Düşünceleriniz, analiziniz veya sorunuz..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              ></textarea>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Vazgeç</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : 'Tartışmayı Paylaş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
