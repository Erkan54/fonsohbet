import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/logo.png" alt="FonSohbet Logo" />
            </Link>
            <p className="footer-description">
              Türkiye'nin en modern fon analiz ve topluluk platformu. Yatırımlarınızı daha akıllı yönetin, diğer yatırımcılarla fikir alışverişi yapın.
            </p>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-heading">Keşfet</h4>
            <ul className="footer-links">
              <li><Link to="/fonlar">Fonları İncele</Link></li>
              <li><Link to="/forum">Tartışma Forumu</Link></li>
              <li><Link to="/bul">Bana Uygun Fonu Bul</Link></li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-heading">Kurumsal</h4>
            <ul className="footer-links">
              <li><Link to="#">Hakkımızda</Link></li>
              <li><Link to="#">İletişim</Link></li>
              <li><Link to="#">Kullanım Koşulları</Link></li>
              <li><Link to="#">Gizlilik Politikası</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FonSohbet. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
