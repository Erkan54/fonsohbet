import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserComments } from '../services/fundService';
import './Profile.css';

const Profile = () => {
  const { discussions } = useFunds();
  const { isAuthenticated, user, profile, loginWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Tartışmalarım');
  const [userComments, setUserComments] = useState([]);
  const navigate = useNavigate();

  // Bu kullanıcının yorumlarını çek
  useEffect(() => {
    if (user?.id) {
      fetchUserComments(user.id).then(data => setUserComments(data || []));
    }
  }, [user?.id]);

  // Giriş yapmamış kullanıcıya giriş sayfası göster
  if (!isAuthenticated) {
    return (
      <div className="profile-page container animate-fade-in">
        <div className="profile-login-prompt">
          <div className="login-prompt-icon">
            <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M5.338 18.32C5.996 15.876 8.722 14 12 14s6.004 1.876 6.662 4.32c.186.69-.312 1.68-1.032 1.68H6.37c-.72 0-1.218-.99-1.032-1.68z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="login-prompt-title">Profilini Görüntüle</h2>
          <p className="login-prompt-desc">
            Tartışmalarını, yorumlarını ve takip ettiğin fonları görmek için giriş yap.
          </p>
          <button className="btn btn-google-login-large" onClick={loginWithGoogle}>
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google ile Devam Et
          </button>
        </div>
      </div>
    );
  }

  // Giriş yapılmış - Gerçek profil sayfası
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || 'Yatırımcı';
  const username = profile?.username || 'yatirimci';
  const userEmail = user?.email || '';

  // Bu kullanıcının tartışmaları (user_id ile eşleşen)
  const userDiscussions = discussions.filter(d => d.user_id === user.id);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="profile-page container animate-fade-in">
      <div className="profile-header">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="profile-avatar-img" referrerPolicy="no-referrer" />
        ) : (
          <div className="profile-avatar">{displayName[0].toUpperCase()}</div>
        )}
        <div className="profile-info">
          <h1 className="profile-username">{displayName}</h1>
          <p className="profile-bio">@{username} · {userEmail}</p>
          <div className="profile-stats">
            <span><strong>{userDiscussions.length}</strong> Tartışma</span>
            <span className="meta-dot">·</span>
            <span><strong>{userComments.length}</strong> Yorum</span>
            <span className="meta-dot">·</span>
            <span><strong>0</strong> Takip Edilen Fon</span>
          </div>
        </div>
        <button className="btn btn-outline profile-logout-btn" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </div>

      <div className="common-tabs">
        {['Tartışmalarım', 'Yorumlarım', 'Takip Ettiklerim'].map(tab => (
          <button 
            key={tab}
            className={`common-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="profile-content">
        {activeTab === 'Tartışmalarım' && (
          <div className="profile-list">
            {userDiscussions.length > 0 ? userDiscussions.map(disc => (
              <div className="profile-list-item" key={disc.id}>
                <Link to={disc.fundCode ? `/fon/${disc.fundCode}` : '/forum'} className="profile-item-title">{disc.title}</Link>
                <div className="profile-item-meta">
                  {disc.fundCode ? (
                    <span className="fund-badge">{disc.fundCode}</span>
                  ) : (
                    <span className="fund-badge badge-blue">GENEL</span>
                  )}
                  <span className="meta-dot">·</span>
                  <span>{disc.commentsCount || 0} yorum</span>
                  <span className="meta-dot">·</span>
                  <span>{disc.lastActivity || 'Az önce'}</span>
                </div>
              </div>
            )) : (
              <p className="empty-state">Henüz bir tartışma başlatmadınız.</p>
            )}
          </div>
        )}

        {activeTab === 'Yorumlarım' && (
          <div className="profile-list">
            {userComments.length > 0 ? (
              userComments.map(c => (
                <div className="profile-list-item" key={c.id}>
                  <div className="profile-item-meta" style={{ marginBottom: '6px' }}>
                    {c.fund_code ? (
                      <Link to={`/fon/${c.fund_code}`} className="fund-badge">{c.fund_code}</Link>
                    ) : (
                      <span className="fund-badge badge-blue">GENEL</span>
                    )}
                    <span className="meta-dot">·</span>
                    <span>{c.formattedDate || 'Az önce'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1E293B', lineHeight: '1.5' }}>{c.content}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">Henüz bir yorum yapmadınız.</p>
            )}
          </div>
        )}

        {activeTab === 'Takip Ettiklerim' && (
          <div className="profile-list">
            <p className="empty-state">Henüz bir fon takip etmiyorsunuz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
