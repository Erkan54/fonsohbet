import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Forum.css';

const Forum = () => {
  const { discussions, addNewDiscussion } = useFunds();
  const [activeTab, setActiveTab] = useState('Popüler');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFundCode, setNewFundCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await addNewDiscussion({
        title: newTitle.trim(),
        fundCode: newFundCode.trim().toUpperCase() || 'GENEL',
        author: 'Yatırımcı',
      });
      setNewTitle('');
      setNewFundCode('');
      setNewContent('');
      setIsModalOpen(false);
    } catch (err) {
      alert('Tartışma eklenirken bir sorun oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forum-page container animate-fade-in">
      <div className="forum-header">
        <h1 className="page-title">Forum Tartışmaları</h1>
        <button className="btn btn-primary hero-btn" onClick={() => setIsModalOpen(true)}>+ Yeni Tartışma</button>
      </div>

      <div className="common-tabs">
        {['Popüler', 'Yeni', 'Takip Ettiklerim'].map(tab => (
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
        {discussions.length > 0 ? (
          discussions.map(disc => (
            <div className="forum-list-item" key={disc.id}>
              <div className="forum-item-main">
                <Link to={`/fon/${disc.fundCode}`} className="forum-item-title">{disc.title}</Link>
                <p className="forum-item-desc">
                  Bu tartışma {disc.fundCode} fonu hakkında. Gelişmeler ve analizler paylaşılıyor...
                </p>
                <div className="forum-item-meta">
                  <Link to={`/fon/${disc.fundCode}`} className="fund-badge">{disc.fundCode}</Link>
                  <span className="meta-dot">·</span>
                  <span className="meta-item">Yazan: {disc.author}</span>
                  <span className="meta-dot">·</span>
                  <span className="meta-item">{disc.lastActivity}</span>
                </div>
              </div>
              <div className="forum-item-stats">
                <div className="stat-box">
                  <span className="stat-num">{disc.commentsCount}</span>
                  <span className="stat-label">Yorum</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{(disc.commentsCount || 1) * 14}</span>
                  <span className="stat-label">Görülme</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
            <p style={{ fontSize: '16px', color: '#64748B', marginBottom: '16px' }}>Henüz hiçbir tartışma konusu açılmamış.</p>
            <button className="btn btn-primary hero-btn" onClick={() => setIsModalOpen(true)}>+ İlk Tartışmayı Başlat</button>
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
