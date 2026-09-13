import React, { useState } from 'react';
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
      const codeClean = newFundCode.trim().toUpperCase();
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
              <input 
                type="text" 
                className="input-base" 
                placeholder="Fon Kodu (Örn: THF)" 
                value={newFundCode}
                onChange={e => setNewFundCode(e.target.value)}
              />
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
