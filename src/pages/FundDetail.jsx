import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { fetchFundComments, addFundComment } from '../services/fundService';
import './FundDetail.css';

const FundDetail = () => {
  const { id } = useParams();
  const { funds, discussions } = useFunds();
  const fund = funds.find(f => f.code.toUpperCase() === id?.toUpperCase()) || funds[0];
  const [activeTab, setActiveTab] = useState('Yorumlar');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Bu fona ait gerçek yorumları çek
  useEffect(() => {
    if (fund?.code) {
      fetchFundComments(fund.code).then(data => setComments(data || []));
    }
  }, [fund?.code]);

  // Yeni yorum gönderme
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setIsSubmittingComment(true);
      const newComment = await addFundComment({
        fundCode: fund.code,
        author: 'Yatırımcı',
        content: commentText.trim(),
      });
      if (newComment) {
        setComments(prev => [newComment, ...prev]);
      }
      setCommentText('');
    } catch (err) {
      alert('Yorum gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Bu fona ait tartışmalar
  const fundDiscussions = discussions.filter(d => d.fundCode === fund.code);

  const renderReturn = (val) => {
    if (val == null) return <span className="text-muted">—</span>;
    const isPositive = val >= 0;
    return (
      <span className={isPositive ? 'text-positive' : 'text-negative'}>
        {isPositive ? '+' : ''}{val.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="fund-detail-page container animate-fade-in">
      {/* Üst Bilgi Alanı */}
      <section className="fund-header">
        <h1 className="fund-code">{fund.code}</h1>
        <h2 className="fund-name">{fund.name}</h2>
        
        <div className="fund-metrics">
          <div className="metric-box">
            <span className="metric-label">Son Fiyat</span>
            <span className="metric-value">₺{fund.price.toFixed(4)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">1 Hafta</span>
            <span className="metric-value">{renderReturn(fund.returns.weekly)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">1 Ay</span>
            <span className="metric-value">{renderReturn(fund.returns.monthly)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">YBB 2026</span>
            <span className="metric-value">{renderReturn(fund.returns.ytd)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Risk Seviyesi</span>
            <span className="metric-value">{fund.risk} / 7</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Yatırımcı Sayısı</span>
            <span className="metric-value">{fund.investors.toLocaleString('tr-TR')}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Kategori</span>
            <span className="metric-value">{fund.category}</span>
          </div>
        </div>
      </section>

      {/* Sekmeler */}
      <div className="common-tabs">
        {['Yorumlar', 'Tartışmalar', 'Fon Bilgileri'].map(tab => (
          <button 
            key={tab}
            className={`common-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Topluluk Bölümü (Yorumlar) */}
      {activeTab === 'Yorumlar' && (
        <section className="comments-section">
          
          <div className="comment-form">
            <textarea 
              className="comment-input" 
              placeholder={`${fund.code} hakkında ne düşünüyorsunuz?`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="comment-form-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleAddComment}
                disabled={isSubmittingComment || !commentText.trim()}
              >
                {isSubmittingComment ? 'Gönderiliyor...' : 'Yorum Yap'}
              </button>
            </div>
          </div>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <div className="avatar-base">{(comment.author || 'Y')[0].toUpperCase()}</div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author || 'Yatırımcı'}</span>
                      <span className="meta-dot">·</span>
                      <span className="comment-date">
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Yeni'}
                      </span>
                    </div>
                    <div className="comment-text">{comment.content}</div>
                    <div className="comment-actions">
                      <button className="like-btn">Beğen ({comment.likes_count || 0})</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                <p style={{ color: '#64748B', margin: 0, fontSize: '15px' }}>Bu fon hakkında henüz yorum yapılmamış.</p>
                <p style={{ color: '#94A3B8', marginTop: '6px', fontSize: '13px' }}>İlk yorumu yukarıdaki alandan siz yazabilirsiniz!</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tartışmalar */}
      {activeTab === 'Tartışmalar' && (
        <section className="fund-discussions">
          {fundDiscussions.length > 0 ? (
            fundDiscussions.map(disc => (
              <div className="discussion-row" key={disc.id}>
                <div className="discussion-content">
                  <span className="discussion-title">{disc.title}</span>
                  <div className="discussion-meta">
                    <span className="meta-author">{disc.author}</span>
                    <span className="meta-dot">·</span>
                    <span className="meta-item">{disc.commentsCount} yorum</span>
                    <span className="meta-dot">·</span>
                    <span className="meta-item">{disc.lastActivity}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="placeholder-content">
              <p>Bu fon hakkında henüz tartışma açılmamış. İlk tartışmayı siz başlatın!</p>
            </div>
          )}
        </section>
      )}

      {/* Fon Bilgileri */}
      {activeTab === 'Fon Bilgileri' && (
        <section className="fund-info-section">
          <div className="fund-info-grid">
            <div className="info-item"><span className="info-label">Fon Kodu</span><span className="info-value">{fund.code}</span></div>
            <div className="info-item"><span className="info-label">Fon Adı</span><span className="info-value">{fund.name}</span></div>
            <div className="info-item"><span className="info-label">Kategori</span><span className="info-value">{fund.category}</span></div>
            <div className="info-item"><span className="info-label">Birim Pay Değeri</span><span className="info-value">₺{fund.price.toFixed(6)}</span></div>
            <div className="info-item"><span className="info-label">Risk Seviyesi</span><span className="info-value">{fund.risk} / 7</span></div>
            <div className="info-item"><span className="info-label">Toplam Yatırımcı</span><span className="info-value">{fund.investors.toLocaleString('tr-TR')}</span></div>
            <div className="info-item"><span className="info-label">Fiyat Tarihi</span><span className="info-value">11 Eylül 2026</span></div>
            {fund.borsaKapanis && <div className="info-item"><span className="info-label">Borsa Kapanış</span><span className="info-value">₺{fund.borsaKapanis.toFixed(2)}</span></div>}
            {fund.sourceUrl && <div className="info-item"><span className="info-label">Kaynak</span><a href={fund.sourceUrl} target="_blank" rel="noopener noreferrer" className="info-value info-link">Fon Asistanı →</a></div>}
          </div>
        </section>
      )}
    </div>
  );
};

export default FundDetail;
