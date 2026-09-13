import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Profile.css';

const Profile = () => {
  const { discussions } = useFunds();
  const [activeTab, setActiveTab] = useState('Tartışmalarım');
  const userDiscussions = discussions.filter(d => d.author === 'yatirimci101');

  return (
    <div className="profile-page container animate-fade-in">
      <div className="profile-header">
        <div className="profile-avatar">Y</div>
        <div className="profile-info">
          <h1 className="profile-username">yatirimci101</h1>
          <p className="profile-bio">Yatırımcı profili</p>
          <div className="profile-stats">
            <span><strong>{userDiscussions.length}</strong> Tartışma</span>
            <span className="meta-dot">·</span>
            <span><strong>0</strong> Yorum</span>
            <span className="meta-dot">·</span>
            <span><strong>0</strong> Takip Edilen Fon</span>
          </div>
        </div>
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
                <Link to={`/fon/${disc.fundCode}`} className="profile-item-title">{disc.title}</Link>
                <div className="profile-item-meta">
                  <span className="fund-badge">{disc.fundCode}</span>
                  <span className="meta-dot">·</span>
                  <span>{disc.commentsCount} yorum</span>
                  <span className="meta-dot">·</span>
                  <span>{disc.lastActivity}</span>
                </div>
              </div>
            )) : (
              <p className="empty-state">Henüz bir tartışma başlatmadınız.</p>
            )}
          </div>
        )}

        {activeTab === 'Yorumlarım' && (
          <div className="profile-list">
            <p className="empty-state">Henüz bir yorum yapmadınız.</p>
          </div>
        )}

        {activeTab === 'Takip Ettiklerim' && (
          <div className="profile-funds-grid">
            <Link to="/fon/AFT" className="followed-fund-card">
              <span className="ff-code">AFT</span>
              <span className="ff-name">Ak Portföy Yeni Teknolojiler</span>
            </Link>
            <Link to="/fon/MAC" className="followed-fund-card">
              <span className="ff-code">MAC</span>
              <span className="ff-name">Marmara Capital Hisse</span>
            </Link>
            <Link to="/fon/TTA" className="followed-fund-card">
              <span className="ff-code">TTA</span>
              <span className="ff-name">İş Portföy Altın</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
