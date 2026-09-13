import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Veri getirme
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setIsFading(true);
      if (!data) setIsLoading(true);
      
      try {
        const result = await fetchFundHistory(fundCode, period);
        if (isMounted && result) {
          setData(result);
        }
      } catch (err) {
        console.error('Grafik verisi yüklenemedi:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsFading(false);
        }
      }
    }

    loadData();
    setHoveredPointIndex(null);

    return () => { isMounted = false; };
  }, [fundCode, period]);

  // Koordinatları hesaplama
  const chartCoordinates = useMemo(() => {
    const points = data?.points;
    if (!points || points.length === 0) return [];

    const prices = points.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Y-axis padding for visual breathing room
    const padding = (maxPrice - minPrice) * 0.1;
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;
    const range = adjustedMax - adjustedMin > 0 ? adjustedMax - adjustedMin : 1;

    return points.map((pt, i) => {
      const prevPrice = i > 0 ? points[i - 1].price : pt.price;
      const dailyChange = prevPrice > 0 ? ((pt.price / prevPrice) - 1) * 100 : 0;
      
      const x = (i / Math.max(1, points.length - 1)) * 400; // SVG width is 400
      const y = 110 - ((pt.price - adjustedMin) / range) * 100; // SVG height is 120 (10 to 110 bounds)
      
      return {
        ...pt,
        x,
        y,
        dailyChange,
      };
    });
  }, [data?.points]);

  // SVG Çizgilerini (Path) Üretme (Yumuşak Bezier Eğrisi)
  const { linePath, areaPath } = useMemo(() => {
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
    const a = `${d} L ${lastX.toFixed(2)} 120 L ${firstX.toFixed(2)} 120 Z`;

    return { linePath: d, areaPath: a };
  }, [chartCoordinates]);

  const activePoint = useMemo(() => {
    if (chartCoordinates.length === 0) return null;
    if (hoveredPointIndex !== null && chartCoordinates[hoveredPointIndex]) {
      return chartCoordinates[hoveredPointIndex];
    }
    return chartCoordinates[chartCoordinates.length - 1];
  }, [chartCoordinates, hoveredPointIndex]);

  const handleMouseMove = useCallback((e) => {
    if (chartCoordinates.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetX = ratio * 400;

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
  }, [chartCoordinates]);

  const handleMouseLeave = () => {
    setHoveredPointIndex(null);
  };

  const periodLabel = PERIODS.find(p => p.id === period)?.label || '1A';

  return (
    <div className="fund-chart-container">
      <div className="fund-chart-header">
        <div className="fund-chart-title">
          <span>Fon Fiyatı</span>
          <span className="fund-chart-period-return">
            {periodLabel} {data && data.periodReturn != null ? <span className={data.periodReturn >= 0 ? 'text-positive' : 'text-negative'}>{formatReturn(data.periodReturn)}</span> : null}
          </span>
        </div>
        <div className="fund-chart-controls">
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`period-btn ${period === p.id ? 'active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="fund-chart-body"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ opacity: isFading && !isLoading ? 0.7 : 1, transition: 'opacity 0.2s ease' }}
      >
        {isLoading ? (
          <div className="chart-skeleton"></div>
        ) : chartCoordinates.length > 1 ? (
          <>
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="fund-chart-svg">
              <defs>
                <linearGradient id="fundChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#315D68" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#315D68" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Subtle Grid line at middle */}
              <line x1="0" y1="60" x2="400" y2="60" className="chart-grid-line" strokeDasharray="4 4" />
              
              {areaPath && <path d={areaPath} fill="url(#fundChartGradient)" className="fund-chart-svg-area" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#315D68"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="fund-chart-svg-line"
                />
              )}
            </svg>

            {activePoint && hoveredPointIndex !== null && (
              <div 
                className="chart-hover-line"
                style={{ left: `${((activePoint.x / 400) * 100).toFixed(2)}%` }}
              />
            )}

            {activePoint && (
              <div
                className="fund-chart-tooltip"
                style={{
                  left: `${((activePoint.x / 400) * 100).toFixed(2)}%`,
                  top: `${((activePoint.y / 120) * 100).toFixed(2)}%`,
                  opacity: hoveredPointIndex !== null ? 1 : 0,
                  transition: 'opacity 0.15s ease'
                }}
              >
                <div className="tooltip-date">{formatDateTr(activePoint.date)}</div>
                <div className="tooltip-price">{formatPrice(activePoint.price)}</div>
                <div className={`tooltip-diff ${activePoint.dailyChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {formatReturn(activePoint.dailyChange)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="chart-error-state">
            Bu dönem için yeterli fiyat verisi bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
};

export default FundChart;
