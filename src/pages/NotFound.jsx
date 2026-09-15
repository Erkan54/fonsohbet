import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updatePageSeo } from '../lib/seo';
import './Corporate.css';

const NotFound = () => {
  useEffect(() => {
    updatePageSeo({
      title: 'Sayfa Bulunamadı (404) | FonSohbet',
      description: 'Aradığınız sayfa bulunamadı veya taşınmış olabilir. FonSohbet anasayfasından TEFAS fon analizlerine ulaşabilirsiniz.',
      robots: 'noindex, follow',
    });
  }, []);
  return (
    <div className="corp-page container animate-fade-in">
      <div className="corp-container text-center" style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(49, 93, 104, 0.1)',
          color: 'var(--color-brand)',
          fontSize: '32px',
          fontWeight: '800',
          marginBottom: '20px'
        }}>
          404
        </div>
        <h1 className="corp-title" style={{ marginBottom: '12px' }}>Sayfa Bulunamadı</h1>
        <p className="corp-subtitle" style={{ maxWidth: '480px', margin: '0 auto 32px' }}>
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı kalmış olabilir.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Anasayfaya Dön
          </Link>
          <Link to="/fonlar" className="btn btn-outline" style={{ padding: '12px 24px' }}>
            Tüm Fonları İncele
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
