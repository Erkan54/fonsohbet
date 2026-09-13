import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import { fetchMarketSummary, formatPrice, formatReturn, formatDateTr } from '../services/marketService';
import './Home.css';

const Home = () => {
  const { funds, discussions } = useFunds();
  const navigate = useNavigate();

  // Gerçek TEFAS Piyasa Özeti ve Hero Verisi
  const [marketSummary, setMarketSummary] = React.useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      try {
        const data = await fetchMarketSummary();
        if (isMounted) {
          setMarketSummary(data);
        }
      } catch (err) {
        console.error('Piyasa özeti yüklenirken hata:', err);
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    }
    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // THF 1 Aylık Çizgi Grafik Hesaplaması (Dinamik SVG Koordinatları)
  const chartCoordinates = React.useMemo(() => {
    const points = marketSummary?.chart?.points;
    if (!points || points.length === 0) return [];

    const prices = points.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice > 0 ? maxPrice - minPrice : 1;

    return points.map((pt, i) => {
      const prevPrice = i > 0 ? points[i - 1].price : pt.price;
      const dailyChange = prevPrice > 0 ? ((pt.price / prevPrice) - 1) * 100 : 0;
      const x = 10 + (i / Math.max(1, points.length - 1)) * 380;
      const y = 105 - ((pt.price - minPrice) / range) * 85;
      return {
        ...pt,
        x,
        y,
        dailyChange,
      };
    });
  }, [marketSummary?.chart?.points]);

  // Yumuşatılmış Catmull-Rom / Kübik Bezier Eğrisi Üretici
  const { linePath, areaPath } = React.useMemo(() => {
    if (chartCoordinates.length === 0) return { linePath: '', areaPath: '' };
    if (chartCoordinates.length === 1) {
      const p = chartCoordinates[0];
      return { linePath: `M ${p.x} ${p.y}`, areaPath: '' };
    }

    let d = `M ${chartCoordinates[0].x.toFixed(2)} ${chartCoordinates[0].y.toFixed(2)}`;
    for (let i = 0; i < chartCoordinates.length - 1; i++) {
      const p0 = chartCoordinates[i === 0 ? i : i - 1];
      const p1 = chartCoordinates[i];
      const p2 = chartCoordinates[i + 1];
      const p3 = chartCoordinates[i + 2 < chartCoordinates.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    const firstX = chartCoordinates[0].x;
    const lastX = chartCoordinates[chartCoordinates.length - 1].x;
    const a = `${d} L ${lastX.toFixed(2)} 130 L ${firstX.toFixed(2)} 130 Z`;

    return { linePath: d, areaPath: a };
  }, [chartCoordinates]);

  // Aktif vurgulanan nokta (üzerine gelinmişse o, yoksa son işlem günü noktası)
  const activePoint = React.useMemo(() => {
    if (chartCoordinates.length === 0) return null;
    if (hoveredPointIndex !== null && chartCoordinates[hoveredPointIndex]) {
      return chartCoordinates[hoveredPointIndex];
    }
    return chartCoordinates[chartCoordinates.length - 1];
  }, [chartCoordinates, hoveredPointIndex]);

  // Fare hareketine göre en yakın veri noktasını bulma
  const handleChartMouseMove = (e) => {
    if (chartCoordinates.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetX = 10 + ratio * 380;

    let closestIdx = 0;
    let minDiff = Infinity;
    chartCoordinates.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - targetX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredPointIndex(closestIdx);
  };

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
                {isLoadingSummary ? (
                  <>
                    <div className="mock-chip skeleton-chip"><span className="skeleton-pulse"></span></div>
                    <div className="mock-chip skeleton-chip"><span className="skeleton-pulse"></span></div>
                    <div className="mock-chip skeleton-chip"><span className="skeleton-pulse"></span></div>
                  </>
                ) : (
                  ['THF', 'ZBP', 'BLH'].map(code => {
                    const item = marketSummary?.highlightFunds?.find(h => h.code === code);
                    const ret = item?.return1m ?? 0;
                    const isPositive = ret > 0;
                    const isNegative = ret < 0;
                    const colorClass = isPositive ? 'text-positive' : (isNegative ? 'text-negative' : 'text-neutral');
                    return (
                      <div
                        className="mock-chip"
                        key={code}
                        onClick={() => navigate(`/fon/${code}`)}
                        style={{ cursor: 'pointer' }}
                        title={`${code} 1 Aylık Getiri: ${formatReturn(ret)}`}
                      >
                        <span className="mc-code">{code}</span>
                        <span className={`mc-perf ${colorClass}`}>
                          {formatReturn(ret)}
                        </span>
                      </div>
                    );
                  })
                )}
                {marketSummary?.dataDate && (
                  <span className="hero-data-date-badge" title="Resmi TEFAS Veri Tarihi">
                    TEFAS: {formatDateTr(marketSummary.dataDate)}
                  </span>
                )}
              </div>

              <div
                className="mock-chart-body"
                onMouseMove={handleChartMouseMove}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                {isLoadingSummary ? (
                  <div className="chart-skeleton-container">
                    <div className="chart-skeleton-shimmer"></div>
                  </div>
                ) : chartCoordinates.length > 0 ? (
                  <>
                    <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="mock-chart-svg">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#315D68" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#315D68" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#315D68"
                          strokeWidth="3.5"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>

                    {activePoint && (
                      <>
                        <div
                          className="mock-chart-dot-html"
                          style={{
                            left: `${((activePoint.x / 400) * 100).toFixed(2)}%`,
                            top: `${((activePoint.y / 120) * 100).toFixed(2)}%`,
                          }}
                        />
                        <div
                          className="mock-tooltip-modern"
                          style={{
                            left: `${((activePoint.x / 400) * 100).toFixed(2)}%`,
                            top: `${((activePoint.y / 120) * 100).toFixed(2)}%`,
                          }}
                        >
                          <div className="tooltip-header-date">{formatDateTr(activePoint.date)}</div>
                          <div className="tooltip-price-value">{formatPrice(activePoint.price)}</div>
                          <div
                            className={`tooltip-daily-diff ${
                              activePoint.dailyChange >= 0 ? 'text-positive' : 'text-negative'
                            }`}
                          >
                            {formatReturn(activePoint.dailyChange)} (Günlük)
                          </div>
                          <div className="tooltip-line"></div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="chart-empty-state">
                    <span>Veriler senkronize ediliyor...</span>
                  </div>
                )}
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
                {discussions.length > 0 ? (
                  <div className="discussion-list">
                    {discussions.slice(0, 5).map((disc, i) => {
                      const badgeColors = ['badge-blue', 'badge-green', 'badge-terracotta', 'badge-brown', 'badge-blue'];
                      return (
                        <div className="discussion-row" key={disc.id}>
                          <div className="discussion-content">
                            <Link to={disc.fundCode ? `/fon/${disc.fundCode}` : '/forum'} className="discussion-title">{disc.title}</Link>
                            <div className="discussion-meta">
                              {disc.fundCode ? (
                                <Link to={`/fon/${disc.fundCode}`} className={`fund-badge ${badgeColors[i % badgeColors.length]}`}>{disc.fundCode}</Link>
                              ) : (
                                <span className="fund-badge badge-blue">GENEL</span>
                              )}
                              <span className="meta-dot">·</span>
                              <span className="meta-item">{disc.commentsCount || 0} yorum</span>
                              <span className="meta-dot">·</span>
                              <span className="meta-item">{disc.lastActivity || 'Az önce'}</span>
                              <span className="meta-dot">·</span>
                              <span className="meta-author">{disc.author}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                    <p style={{ color: '#64748B', marginBottom: '14px', fontSize: '15px' }}>Henüz topluluk tartışması başlatılmamış.</p>
                    <Link to="/forum" className="btn btn-primary hero-btn" style={{ display: 'inline-block', fontSize: '14px' }}>
                      İlk Tartışmayı Sen Başlat
                    </Link>
                  </div>
                )}
              </div>

              {discussions.length > 5 && (
                <>
                  <h2 className="section-title-modern mt-48">Son Tartışmalar</h2>
                  <div className="forum-main-column">
                    <div className="discussion-list">
                      {discussions.slice(5, 10).map((disc, i) => {
                        const badgeColors = ['badge-brown', 'badge-terracotta', 'badge-blue', 'badge-green', 'badge-brown'];
                        return (
                          <div className="discussion-row" key={disc.id}>
                            <div className="discussion-content">
                              <Link to={disc.fundCode ? `/fon/${disc.fundCode}` : '/forum'} className="discussion-title">{disc.title}</Link>
                              <div className="discussion-meta">
                                {disc.fundCode ? (
                                  <Link to={`/fon/${disc.fundCode}`} className={`fund-badge ${badgeColors[i % badgeColors.length]}`}>{disc.fundCode}</Link>
                                ) : (
                                  <span className="fund-badge badge-blue">GENEL</span>
                                )}
                                <span className="meta-dot">·</span>
                                <span className="meta-item">{disc.commentsCount || 0} yorum</span>
                                <span className="meta-dot">·</span>
                                <span className="meta-item">{disc.lastActivity || 'Az önce'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <aside className="forum-sidebar">
              <div className="sidebar-box">
                <h3 className="sidebar-title">En Çok Konuşulan Fonlar</h3>
                <ul className="popular-funds-list">
                  {[...funds]
                    .sort((a, b) => b.discussionCount - a.discussionCount)
                    .slice(0, 5)
                    .map(f => (
                      <li className="popular-fund-item" key={f.code} onClick={() => navigate(`/fon/${f.code}`)} style={{ cursor: 'pointer' }}>
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
