import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { useAuth } from '../context/AuthContext';
import { fetchFundComments, addFundComment, likeComment, formatRelativeTime } from '../services/fundService';
import './FundDetail.css';

const FundDetail = () => {
  const { id } = useParams();
  const { funds, discussions, refreshDiscussions } = useFunds();
  const { isAuthenticated, user, profile, loginWithGoogle } = useAuth();
  const fund = funds.find(f => f.code.toUpperCase() === id?.toUpperCase()) || funds[0];
  const [activeTab, setActiveTab] = useState('Yorumlar');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Bu fona ait gerçek yorumları çek
  useEffect(() => {
    if (fund?.code) {
      fetchFundComments(fund.code).then(data => setComments(data || []));
    }
  }, [fund?.code]);

  // Yeni yorum gönderme
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    if (!isAuthenticated) {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error('Giriş hatası:', err);
      }
      return;
    }

    try {
      setIsSubmittingComment(true);
      const newComment = await addFundComment({
        fundCode: fund.code,
        content: commentText.trim(),
      });
      if (newComment) {
        setComments(prev => [newComment, ...prev]);
        refreshDiscussions();
      }
      setCommentText('');
    } catch (err) {
      alert('Yorum gönderilirken bir hata oluştu: ' + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Beğeni işlemi
  const handleLike = async (commentId) => {
    if (likedMap[commentId]) return;
    setLikedMap(prev => ({ ...prev, [commentId]: true }));
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c));
    await likeComment(commentId);
  };

  // Yanıtlama başlatma
  const handleStartReply = (comment) => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    if (replyingToId === comment.id) {
      setReplyingToId(null);
      setReplyText('');
    } else {
      setReplyingToId(comment.id);
      setReplyText(`@${comment.author} `);
    }
  };

  // Yanıt gönderme
  const handleSendReply = async (parentComment) => {
    if (!replyText.trim()) return;

    try {
      setIsSubmittingReply(true);
      const newComment = await addFundComment({
        fundCode: fund.code,
        content: replyText.trim(),
      });
      if (newComment) {
        setComments(prev => [newComment, ...prev]);
        refreshDiscussions();
      }
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      alert('Yanıt gönderilirken bir hata oluştu: ' + err.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Yorum içeriğini yanıt etiketiyle ayrıştırıcı
  const renderCommentContent = (content) => {
    const match = content.match(/^@([^\s:]+)\s*(.*)/s) || content.match(/^@([^:]+):\s*(.*)/s);
    if (match && match[1]) {
      return (
        <div className="comment-text-with-reply">
          <span className="reply-target-badge">↳ @{match[1]}</span>
          <span className="reply-body-text">{match[2]}</span>
        </div>
      );
    }
    return <div className="comment-text">{content}</div>;
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
        {[
          { key: 'Yorumlar', label: `Yorumlar (${comments.length})` },
          { key: 'Tartışmalar', label: `Tartışmalar (${fundDiscussions.length})` },
          { key: 'Fon Bilgileri', label: 'Fon Bilgileri' }
        ].map(tab => (
          <button 
            key={tab.key}
            className={`common-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Topluluk Bölümü (Yorumlar) */}
      {activeTab === 'Yorumlar' && (
        <section className="comments-section">
          
          <div className="comment-form">
            {isAuthenticated ? (
              <>
                <div className="comment-form-user">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="comment-form-avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="comment-form-avatar-fallback">
                      {(profile?.display_name || user?.user_metadata?.full_name || 'Y')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="comment-form-username">{profile?.display_name || user?.user_metadata?.full_name || 'Yatırımcı'}</span>
                </div>
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
              </>
            ) : (
              <div className="comment-login-prompt">
                <p>Yorum yapmak için giriş yapın</p>
                <button className="btn btn-google-comment" onClick={loginWithGoogle}>
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google ile Giriş Yap
                </button>
              </div>
            )}
          </div>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  {comment.authorAvatar ? (
                    <img src={comment.authorAvatar} alt="" className="comment-avatar-img" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="avatar-base">{(comment.author || 'Y')[0].toUpperCase()}</div>
                  )}
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author || 'Yatırımcı'}</span>
                      <span className="meta-dot">·</span>
                      <span className="comment-date">
                        {comment.formattedDate || (comment.created_at ? formatRelativeTime(comment.created_at) : 'Az önce')}
                      </span>
                    </div>
                    {renderCommentContent(comment.content)}
                    <div className="comment-actions">
                      <button 
                        className={`like-btn ${likedMap[comment.id] ? 'liked' : ''}`}
                        onClick={() => handleLike(comment.id)}
                      >
                        Beğen ({comment.likes_count || 0})
                      </button>
                      <button 
                        className="reply-btn"
                        onClick={() => handleStartReply(comment)}
                      >
                        {replyingToId === comment.id ? 'Vazgeç' : 'Yanıtla'}
                      </button>
                    </div>

                    {replyingToId === comment.id && (
                      <div className="inline-reply-box animate-fade-in">
                        <div className="inline-reply-header">
                          <span><strong>@{comment.author}</strong> adlı kullanıcıya yanıt veriyorsunuz</span>
                        </div>
                        <textarea 
                          className="inline-reply-input"
                          rows="2"
                          placeholder="Yanıtınızı yazın..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          autoFocus
                        />
                        <div className="inline-reply-actions">
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline" 
                            onClick={() => { setReplyingToId(null); setReplyText(''); }}
                          >
                            Vazgeç
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-primary" 
                            onClick={() => handleSendReply(comment)}
                            disabled={isSubmittingReply || !replyText.trim()}
                          >
                            {isSubmittingReply ? 'Gönderiliyor...' : 'Yanıtla'}
                          </button>
                        </div>
                      </div>
                    )}
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
