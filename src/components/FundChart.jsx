import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchFundHistory, formatPrice, formatReturn, formatDateTr } from '../services/marketService';
import './FundChart.css';

const PERIODS = [
  { id: '1m', label: '1A' },
  { id: '3m', label: '3A' },
  { id: '6m', label: '6A' },
  { id: 'ytd', label: 'YBB' },
  { id: '1y', label: '1Y' },
];

const FundChart = ({ fundCode, defaultPeriod = '1m' }) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [cache, setCache] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });

  // Update gliding underline position
  useEffect(() => {
    if (!controlsRef.current) return;
    const activeBtn = controlsRef.current.querySelector('.period-btn.active');
    if (activeBtn) {
      setGliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [period]);

  // Data fetching and caching
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (cache[period]) {
        // Cached instant switch
        return;
      }
      
      setIsFetching(true);
      try {
        const result = await fetchFundHistory(fundCode, period);
        if (isMounted && result) {
          setCache(prev => ({ ...prev, [period]: result }));
        }
      } catch (err) {
        console.error('Grafik verisi yüklenemedi:', err);
      } finally {
        if (isMounted) {
          setIsFetching(false);
          if (isInitialLoad) setIsInitialLoad(false);
        }
      }
    }

    loadData();
    setHoveredPointIndex(null);
    return () => { isMounted = false; };
  }, [fundCode, period, cache, isInitialLoad]);

  const currentData = cache[period];
  
  // Calculate SVG Coordinates and metadata
  const { coords, minPoint, maxPoint, firstPoint, lastPoint, xTicks, yTicks } = useMemo(() => {
    const points = currentData?.points;
    if (!points || points.length === 0) return { coords: [], xTicks: [], yTicks: [] };

    const prices = points.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Y-axis padding (give room for min/max labels and final point)
    const padding = (maxPrice - minPrice) * 0.15;
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;
    const range = adjustedMax - adjustedMin > 0 ? adjustedMax - adjustedMin : 1;

    let minPt = null, maxPt = null;
    let minDiff = Infinity, maxDiff = -Infinity;

    const computedCoords = points.map((pt, i) => {
      const prevPrice = i > 0 ? points[i - 1].price : pt.price;
      const dailyChange = prevPrice > 0 ? ((pt.price / prevPrice) - 1) * 100 : 0;
      
      const x = (i / Math.max(1, points.length - 1)) * 400; // SVG viewBox width 400
      const y = 140 - ((pt.price - adjustedMin) / range) * 120; // SVG viewBox height 160 (20 to 140 bounds)
      
      const pObj = { ...pt, x, y, dailyChange };
      
      if (pt.price < minDiff) { minDiff = pt.price; minPt = pObj; }
      if (pt.price > maxDiff) { maxDiff = pt.price; maxPt = pObj; }
      
      return pObj;
    });

    // Generate responsive X-axis ticks (3-5 labels)
    const tickCount = window.innerWidth < 480 ? 3 : 5;
    const xTicksArray = [];
    if (computedCoords.length > 1) {
      const step = Math.floor((computedCoords.length - 1) / (tickCount - 1));
      for (let i = 0; i < tickCount; i++) {
        const idx = Math.min(i * step, computedCoords.length - 1);
        xTicksArray.push(computedCoords[idx]);
      }
    }

    // Generate Y-axis ticks (3 levels)
    const yTicksArray = [];
    const priceStep = range / 3;
    for (let i = 1; i <= 2; i++) {
      const val = adjustedMin + priceStep * i;
      const y = 140 - ((val - adjustedMin) / range) * 120;
      yTicksArray.push({ price: val, y });
    }

    return {
      coords: computedCoords,
      minPoint: minPt,
      maxPoint: maxPt,
      firstPoint: computedCoords[0],
      lastPoint: computedCoords[computedCoords.length - 1],
      xTicks: xTicksArray,
      yTicks: yTicksArray
    };
  }, [currentData]);

  // SVG Paths
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length === 0) return { linePath: '', areaPath: '' };
    if (coords.length === 1) return { linePath: `M ${coords[0].x} ${coords[0].y}`, areaPath: '' };

    let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const a = `${d} L ${lastX.toFixed(2)} 160 L ${firstX.toFixed(2)} 160 Z`;

    return { linePath: d, areaPath: a };
  }, [coords]);

  const handlePointerMove = useCallback((e) => {
    if (coords.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const mouseX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetX = ratio * 400;

    let closestIdx = 0;
    let minDiff = Infinity;
    coords.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - targetX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredPointIndex(closestIdx);
  }, [coords]);

  const handlePointerLeave = () => {
    setHoveredPointIndex(null);
  };

  const activePoint = hoveredPointIndex !== null ? coords[hoveredPointIndex] : null;
  const isFetchingAndCached = isFetching && !!currentData;
  const periodLabel = PERIODS.find(p => p.id === period)?.label || '1A';

  // Format short dates (e.g. 11 Eyl)
  const formatShortDate = (dStr) => {
    const d = new Date(dStr + 'T00:00:00');
    if(isNaN(d)) return dStr;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fund-chart-container" ref={containerRef}>
      
      {/* HEADER */}
      <div className="fund-chart-header">
        <div className="fund-chart-title-group">
          <div className="fund-chart-title-top">
            <span className="fund-chart-title-label">Fon Fiyatı</span>
            <span className="fund-chart-info-icon" title="Fon fiyatları TEFAS tarafından günlük olarak yayımlanan son verilerdir.">
              ⓘ
            </span>
          </div>
          
          <div className="fund-chart-period-return-wrapper">
            <span className="fund-chart-period-label">{periodLabel}</span>
            <span 
              className={`fund-chart-period-return ${
                currentData?.periodReturn > 0 ? 'text-positive' : 
                currentData?.periodReturn < 0 ? 'text-negative' : 'text-neutral'
              }`}
            >
              {currentData?.periodReturn != null ? formatReturn(currentData.periodReturn) : '—'}
            </span>
          </div>
          
          {lastPoint && (
            <div className="fund-chart-meta-line">
              TEFAS · {formatShortDate(lastPoint.date)} {new Date(lastPoint.date).getFullYear()}
            </div>
          )}
        </div>

        <div className="fund-chart-controls-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div className="fund-chart-controls" ref={controlsRef} role="tablist">
            {PERIODS.map(p => (
              <button
                key={p.id}
                role="tab"
                aria-selected={period === p.id}
                className={`period-btn ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
            <div className="period-glider" style={gliderStyle} />
          </div>
          {isFetchingAndCached && (
            <div className="chart-loading-overlay">
              <div className="loading-spinner"></div> Yükleniyor...
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div 
        className="fund-chart-body"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerMove}
        style={{ opacity: isFetchingAndCached ? 0.55 : 1 }}
      >
        {isInitialLoad ? (
          <div className="chart-skeleton-container">
            <div className="skeleton-shimmer" style={{height: '40px', width: '30%'}}></div>
            <div className="skeleton-shimmer" style={{flex: 1, width: '100%'}}></div>
          </div>
        ) : coords.length > 1 ? (
          <>
            <svg 
              viewBox="0 0 400 160" 
              preserveAspectRatio="none" 
              className="fund-chart-svg"
              aria-label={`${fundCode} fonunun ${periodLabel} dönemi fiyat grafiği. Dönem getirisi: ${currentData?.periodReturn}%`}
            >
              <defs>
                <linearGradient id="fundChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor="#315D68" stopOpacity="0.10" />
                  <stop offset="60%" stopColor="#315D68" stopOpacity="0.035" />
                  <stop offset="100%" stopColor="#315D68" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Reference Lines (Y-Axis & Grid) */}
              {yTicks.map((tick, i) => (
                <g key={`yline-${i}`}>
                  <line x1="0" y1={tick.y} x2="400" y2={tick.y} className="axis-line" />
                </g>
              ))}

              {/* Start Reference Line */}
              {firstPoint && (
                <line x1="0" y1={firstPoint.y} x2="400" y2={firstPoint.y} className="start-ref-line" />
              )}
              
              {/* Area & Line */}
              {areaPath && <path d={areaPath} fill="url(#fundChartGradient)" className="fund-chart-svg-area chart-entry-area" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#315D68"
                  strokeWidth={window.innerWidth < 480 ? "2.2" : "2.8"}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="fund-chart-svg-line chart-entry-line"
                />
              )}

              {/* Min / Max Markers (Circles Only) */}
              {minPoint && maxPoint && (
                <g className="minmax-marker-group">
                  <circle cx={minPoint.x} cy={minPoint.y} r="3" className="minmax-circle" />
                  
                  <circle cx={maxPoint.x} cy={maxPoint.y} r="3" className="minmax-circle" />
                </g>
              )}

              {/* Permanent Latest Point Indicator (Circles Only) */}
              {lastPoint && (
                <g className="latest-point-group">
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="10" className="latest-point-ring" />
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="4.5" className="latest-point-circle" />
                </g>
              )}
            </svg>

            {/* HTML Overlays for Text (Prevents SVG stretching) */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {/* Y-Axis Labels */}
              {yTicks.map((tick, i) => (
                <div key={`ylabel-${i}`} className="axis-label-html" style={{ position: 'absolute', right: '4px', top: `${(tick.y / 160) * 100}%`, transform: 'translateY(-100%)' }}>
                  {tick.price.toFixed(4)}
                </div>
              ))}

              {/* X-Axis Labels */}
              {xTicks.map((tick, i) => {
                let transform = 'translateX(-50%)';
                let left = `${(tick.x / 400) * 100}%`;
                if (i === 0) { transform = 'none'; left = '0%'; }
                else if (i === xTicks.length - 1) { transform = 'translateX(-100%)'; left = '100%'; }
                return (
                  <div key={`xlabel-${i}`} className="axis-label-html" style={{ position: 'absolute', left, bottom: '2px', transform }}>
                    {formatShortDate(tick.date)}
                  </div>
                );
              })}

              {/* Min / Max Text Overlay */}
              {minPoint && maxPoint && (
                <div className="minmax-marker-group-html">
                  <div className="minmax-text-html" style={{ position: 'absolute', left: `${(minPoint.x / 400) * 100}%`, top: `${(minPoint.y / 160) * 100}%`, transform: 'translate(-50%, 8px)' }}>
                    Düşük
                  </div>
                  <div className="minmax-text-html" style={{ position: 'absolute', left: `${(maxPoint.x / 400) * 100}%`, top: `${(maxPoint.y / 160) * 100}%`, transform: 'translate(-50%, -20px)' }}>
                    Yüksek
                  </div>
                </div>
              )}

              {/* Latest Point Text Overlay */}
              {lastPoint && (
                <div className="latest-point-text-html" style={{ position: 'absolute', left: `${(lastPoint.x / 400) * 100}%`, top: `${(lastPoint.y / 160) * 100}%`, transform: 'translate(calc(-100% - 16px), -50%)' }}>
                  {formatPrice(lastPoint.price, 4).replace(' ₺', '')} ₺
                </div>
              )}
            </div>

            {/* Crosshair Line */}
            {activePoint && (
              <div 
                className="chart-hover-line"
                style={{ left: `${((activePoint.x / 400) * 100).toFixed(2)}%` }}
              />
            )}

            {/* Hover Dot */}
            <div 
              className={`chart-hover-marker ${activePoint ? 'visible' : ''}`}
              style={{
                left: activePoint ? `${((activePoint.x / 400) * 100).toFixed(2)}%` : '-10%',
                top: activePoint ? `${((activePoint.y / 160) * 100).toFixed(2)}%` : '50%'
              }}
            />

            {/* Tooltip */}
            {activePoint && (
              <div
                className="fund-chart-tooltip"
                style={{
                  left: `${((activePoint.x / 400) * 100).toFixed(2)}%`,
                  top: `${((activePoint.y / 160) * 100).toFixed(2)}%`,
                  opacity: hoveredPointIndex !== null ? 1 : 0
                }}
              >
                <div className="tooltip-date">{formatDateTr(activePoint.date)}</div>
                <div className="tooltip-price">{formatPrice(activePoint.price)}</div>
                <div className="tooltip-diff-row">
                  <span className="tooltip-diff-label">Günlük</span>
                  <span className={`tooltip-diff ${activePoint.dailyChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatReturn(activePoint.dailyChange)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="chart-error-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Bu dönem için yeterli fiyat verisi bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
};

export default FundChart;
