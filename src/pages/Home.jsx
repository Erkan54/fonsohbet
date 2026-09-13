import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Home.css';

const Home = () => {
  const { funds, discussions } = useFunds();
  const navigate = useNavigate();

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Alanı */}
      <section className="hero-section">
        <div className="container hero-container hero-split">
          <div className="hero-content">
            <h1 className="hero-title">Yatırım fonlarını keşfet, <span className="highlight-text">yatırımcılarla</span> konuş.</h1>
            <p className="hero-subtitle">Türkiye'nin en çok takip edilen fonlarını incele, yorumları oku ve yatırımcılarla tartış.</p>
            <div className="hero-actions">
              <button className="btn btn-primary hero-btn" onClick={() => navigate('/bul')}>
                Bana uygun fonları bul
              </button>
              <button className="btn btn-outline hero-btn" onClick={() => navigate('/fonlar')}>
                Fonları incele
              </button>
            </div>
          </div>
          <div className="hero-visual animate-slide-in-right">
            <div className="mock-chart-card">
              <div className="mock-chart-header">
                <div className="mock-chip"><span className="mc-code">THF</span><span className="mc-perf text-positive">%28.10</span></div>
                <div className="mock-chip"><span className="mc-code">YIT</span><span className="mc-perf text-positive">%66.34</span></div>
                <div className="mock-chip"><span className="mc-code">AFA</span><span className="mc-perf text-negative">-%1.00</span></div>
              </div>
              <div className="mock-chart-body">
                <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="mock-chart-svg">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#315D68" stopOpacity="0.15"/>
                      <stop offset="100%" stopColor="#315D68" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M -5 100 C 50 100, 80 110, 120 85 C 160 60, 200 80, 250 45 C 300 10, 350 40, 395 15 L 405 15 L 405 130 L -5 130 Z" fill="url(#chartGradient)"/>
                  <path d="M -5 100 C 50 100, 80 110, 120 85 C 160 60, 200 80, 250 45 C 300 10, 350 40, 395 15" fill="none" stroke="#315D68" strokeWidth="3.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="mock-chart-dot-html"></div>
                <div className="mock-tooltip-modern">
                  Yüksek Getiri
                  <div className="tooltip-line"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forum Akışı */}
      <section className="forum-feed-section">
        <div className="container">
          <div className="forum-layout">
            
            <div className="forum-content-area">
              <h2 className="section-title-modern">Gündemdeki Tartışmalar</h2>
              <div className="forum-main-column">
                <div className="discussion-list">
                  {discussions.slice(0, 5).map((disc, i) => {
                    const badgeColors = ['badge-blue', 'badge-green', 'badge-terracotta', 'badge-brown', 'badge-blue'];
                    return (
                      <div className="discussion-row" key={disc.id}>
                        <div className="discussion-content">
                          <Link to={`/fon/${disc.fundCode}`} className="discussion-title">{disc.title}</Link>
                          <div className="discussion-meta">
                            <Link to={`/fon/${disc.fundCode}`} className={`fund-badge ${badgeColors[i]}`}>{disc.fundCode}</Link>
                            <span className="meta-dot">·</span>
                            <span className="meta-item">{disc.commentsCount} yorum</span>
                            <span className="meta-dot">·</span>
                            <span className="meta-item">{disc.lastActivity}</span>
                            <span className="meta-dot">·</span>
                            <span className="meta-author">{disc.author}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h2 className="section-title-modern mt-48">Son Tartışmalar</h2>
              <div className="forum-main-column">
                <div className="discussion-list">
                  {discussions.slice(5, 10).map((disc, i) => {
                    const badgeColors = ['badge-brown', 'badge-terracotta', 'badge-blue', 'badge-green', 'badge-brown'];
                    return (
                      <div className="discussion-row" key={disc.id}>
                        <div className="discussion-content">
                          <Link to={`/fon/${disc.fundCode}`} className="discussion-title">{disc.title}</Link>
                          <div className="discussion-meta">
                            <Link to={`/fon/${disc.fundCode}`} className={`fund-badge ${badgeColors[i]}`}>{disc.fundCode}</Link>
                            <span className="meta-dot">·</span>
                            <span className="meta-item">{disc.commentsCount} yorum</span>
                            <span className="meta-dot">·</span>
                            <span className="meta-item">{disc.lastActivity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="forum-sidebar">
              <div className="sidebar-box">
                <h3 className="sidebar-title">En Çok Konuşulan Fonlar</h3>
                <ul className="popular-funds-list">
                  {[...funds]
                    .sort((a, b) => b.discussionCount - a.discussionCount)
                    .slice(0, 5)
                    .map(f => (
                      <li className="popular-fund-item" key={f.code}>
                        <div className="pf-left">
                          <span className="pf-code">{f.code}</span>
                          <span className="pf-meta">{f.name.length > 20 ? f.name.substring(0, 20) + '...' : f.name}</span>
                        </div>
                        <div className="pf-right">
                          <span className={`pf-perf text-tabular ${f.returns.monthly >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {f.returns.monthly >= 0 ? '+' : ''}{f.returns.monthly.toFixed(2)}%
                          </span>
                        </div>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </aside>
            
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
