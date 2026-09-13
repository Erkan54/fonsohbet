import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Funds.css';

const Funds = () => {
  const { funds, loading } = useFunds();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tümü');
  const [riskFilter, setRiskFilter] = useState('Tümü');
  const [sortBy, setSortBy] = useState('ytd'); 
  const [sortOrder, setSortOrder] = useState('desc');

  // Benzersiz kategorileri listele
  const categories = useMemo(() => ['Tümü', ...new Set(funds.map(f => f.category))], [funds]);

  const renderReturn = (val) => {
    const isPositive = val >= 0;
    return (
      <span className={isPositive ? 'text-positive' : 'text-negative'}>
        {isPositive ? '+' : ''}{val.toFixed(2)}%
      </span>
    );
  };

  const getBadgeColor = (category) => {
    if (category.includes('Hisse')) return 'badge-green';
    if (category.includes('Borçlanma') || category === 'Para Piyasası') return 'badge-blue';
    if (category === 'Altın' || category === 'Kıymetli Maden') return 'badge-brown';
    return 'badge-terracotta';
  };

  // Fonları filtrele ve sırala
  const processedFunds = useMemo(() => {
    let result = [...funds];

    // 1. Arama Filtresi (Kod veya Ad)
    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.code.toLowerCase().includes(lower) || 
        f.name.toLowerCase().includes(lower)
      );
    }

    // 2. Kategori Filtresi
    if (categoryFilter !== 'Tümü') {
      result = result.filter(f => f.category === categoryFilter);
    }

    // 3. Risk Filtresi
    if (riskFilter !== 'Tümü') {
      result = result.filter(f => {
        if (riskFilter === 'Düşük') return f.risk <= 2;
        if (riskFilter === 'Orta') return f.risk >= 3 && f.risk <= 4;
        if (riskFilter === 'Yüksek') return f.risk >= 5;
        return true;
      });
    }

    // 4. Sıralama İşlemi
    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'weekly') { valA = a.returns.weekly; valB = b.returns.weekly; }
      else if (sortBy === 'monthly') { valA = a.returns.monthly; valB = b.returns.monthly; }
      else if (sortBy === 'ytd') { valA = a.returns.ytd ?? -Infinity; valB = b.returns.ytd ?? -Infinity; }
      else if (sortBy === 'investors') { valA = a.investors; valB = b.investors; }
      else if (sortBy === 'risk') { valA = a.risk; valB = b.risk; }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchTerm, categoryFilter, riskFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('Tümü');
    setRiskFilter('Tümü');
    setSortBy('ytd');
    setSortOrder('desc');
  };

  return (
    <div className="funds-page animate-fade-in">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Yatırım Fonları</h1>
          <p className="page-subtitle">Türkiye'deki en popüler 50 yatırım fonu</p>
        </div>

        {/* --- Detaylı Filtreleme Paneli --- */}
        <div className="filter-dashboard">
          
          <div className="filter-row">
            <div className="filter-group flex-2">
              <label className="filter-label">Fon Ara</label>
              <input 
                type="text" 
                className="input-base filter-input" 
                placeholder="Örn: MAC veya Teknoloji..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group flex-2">
              <label className="filter-label">Kategori</label>
              <select 
                className="input-base filter-select" 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Risk Seviyesi</label>
              <div className="risk-buttons">
                {['Tümü', 'Düşük', 'Orta', 'Yüksek'].map(risk => (
                  <button 
                    key={risk}
                    className={`risk-btn ${riskFilter === risk ? 'active' : ''} ${riskFilter === risk ? 'risk-' + risk.toLowerCase().replace('ü', 'u').replace('ş', 's') : ''}`}
                    onClick={() => setRiskFilter(risk)}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sırala</label>
              <div className="sort-group">
                <select 
                  className="input-base filter-select sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="weekly">Haftalık Getiri</option>
                  <option value="monthly">Aylık Getiri</option>
                  <option value="ytd">YBB 2026</option>
                  <option value="investors">Yatırımcı Sayısı</option>
                  <option value="risk">Risk Seviyesi</option>
                </select>
                <button 
                  className="btn btn-outline sort-dir-btn" 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title={sortOrder === 'desc' ? 'Azalan Sıra' : 'Artan Sıra'}
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="filter-actions">
            <span className="results-count"><b>{processedFunds.length}</b> fon bulundu</span>
            <button className="btn btn-outline clear-btn" onClick={clearFilters}>Filtreleri Temizle</button>
          </div>
        </div>
        {/* --- Filtreleme Paneli Sonu --- */}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fon</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>1 Hafta</th>
                <th>1 Ay</th>
                <th>YBB 2026</th>
                <th>Risk</th>
                <th>Yatırımcı</th>
              </tr>
            </thead>
            <tbody>
              {processedFunds.length > 0 ? (
                processedFunds.map(fund => (
                  <tr key={fund.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to={`/fon/${fund.code}`} className={`fund-badge ${getBadgeColor(fund.category)}`}>
                          {fund.code}
                        </Link>
                        <Link to={`/fon/${fund.code}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <span className="fund-table-name">{fund.name.length > 35 ? fund.name.substring(0, 35) + '...' : fund.name}</span>
                        </Link>
                      </div>
                    </td>
                    <td><span className="fund-category-text">{fund.category}</span></td>
                    <td><span className="text-tabular">₺{fund.price.toFixed(2)}</span></td>
                    <td>{renderReturn(fund.returns.weekly)}</td>
                    <td>{renderReturn(fund.returns.monthly)}</td>
                    <td>{fund.returns.ytd != null ? renderReturn(fund.returns.ytd) : <span className="text-muted">—</span>}</td>
                    <td>
                      <div className="risk-indicator">
                        <div className={`risk-bar bg-risk-${fund.risk}`}></div>
                        <span>{fund.risk}</span>
                      </div>
                    </td>
                    <td>{fund.investors.toLocaleString('tr-TR')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    Aradığınız kriterlere uygun fon bulunamadı. Lütfen filtreleri değiştirin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funds;
