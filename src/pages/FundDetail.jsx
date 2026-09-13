import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './FundDetail.css';

const FundDetail = () => {
  const { id } = useParams();
  const { funds, discussions } = useFunds();
  const fund = funds.find(f => f.code.toUpperCase() === id?.toUpperCase()) || funds[0];
  const [activeTab, setActiveTab] = useState('Yorumlar');
  const [commentText, setCommentText] = useState('');

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

  // Gerçekçi yorumlar
  const sampleComments = [
    { author: 'yatirim_gurusu', time: '2 saat önce', text: `${fund.code} fonu son dönemde sektörel rüzgârları iyi kullanıyor. Portföy yönetiminin aktif takası dikkat çekici. Aylık %${fund.returns.monthly > 0 ? fund.returns.monthly.toFixed(1) : '?'} getiri bu piyasa koşullarında gayet tatminkâr.`, likes: 24 },
    { author: 'foncu_ali', time: '3 saat önce', text: `Yönetim ücreti biraz yüksek ama getirilerle kıyasladığınızda hak ediyor. Uzun vadede portföyde tutulabilir diye düşünüyorum. Risk/getiri dengesi makul.`, likes: 18 },
    { author: 'borsa_meraklisi', time: '5 saat önce', text: `Geçen hafta almıştım, şu an haftalık ${fund.returns.weekly > 0 ? '+' : ''}${fund.returns.weekly.toFixed(2)}% ile iyi gidiyor. Stop-loss seviyemi %5 altına koydum, yükseliş devam ederse kademeli ekleme yapacağım.`, likes: 31 },
    { author: 'analiz_pro', time: '8 saat önce', text: `Bu fonun benchmark endeksine göre performansı pozitif alfa üretiyor. YBB ${fund.returns.ytd != null ? '%' + fund.returns.ytd.toFixed(1) : 'henüz belirsiz'} seviyesinde. Sektör ortalamasının üstünde kalmaya devam ediyor.`, likes: 15 },
    { author: 'risk_yoneticisi', time: '12 saat önce', text: `Risk seviyesi ${fund.risk}/7. Bu kategoride makul bir seviye. Portföy çeşitlendirmesi yapıyorsanız, toplam ağırlığın %10'unu geçmemesini tavsiye ederim. Özellikle volatilite dönemlerinde dikkatli olun.`, likes: 9 },
  ];

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
              <button className="btn btn-primary" onClick={() => setCommentText('')}>Yorum Yap</button>
            </div>
          </div>

          <div className="comments-list">
            {sampleComments.map((comment, i) => (
              <div className="comment-item" key={i}>
                <div className="avatar-base">{comment.author[0].toUpperCase()}</div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="meta-dot">·</span>
                    <span className="comment-date">{comment.time}</span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-actions">
                    <button className="like-btn">Beğen ({comment.likes})</button>
                    <span className="meta-dot">·</span>
                    <button className="reply-btn">Yanıtla</button>
                    <span className="meta-dot">·</span>
                    <button className="reply-btn">Şikayet Et</button>
                  </div>
                </div>
              </div>
            ))}
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
