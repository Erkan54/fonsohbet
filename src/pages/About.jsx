import React from 'react';
import { Link } from 'react-router-dom';
import './Corporate.css';

const About = () => {
  return (
    <div className="corporate-page animate-fade-in">
      <div className="container corporate-container">
        
        <div className="corporate-header">
          <span className="corporate-badge">Hakkımızda</span>
          <h1 className="corporate-title">Yatırım Fonlarını Herkes İçin Şeffaf ve Erişilebilir Kılıyoruz</h1>
          <p className="corporate-subtitle">
            FonSohbet, Türkiye'deki yatırımcıların TEFAS fon verilerine saniyeler içinde ulaşmasını ve toplulukla fikir alışverişi yapmasını sağlayan modern bir finans platformudur.
          </p>
        </div>

        <div className="corporate-card">
          <div className="corporate-content">
            
            <section className="corporate-section">
              <h2>🌱 FonSohbet'in Hikayesi</h2>
              <p>
                FonSohbet; finansal piyasalara, algoritmik sistemlere ve modern web teknolojilerine tutku duyan bir üniversite öğrencisi (<strong>Ahmet Nurullah Erkan</strong>) tarafından, bireysel bir öğrenci projesi olarak hayata geçirildi.
              </p>
              <p>
                Geleneksel aracı kurum ekranlarının ve resmi platformların hantal, karmaşık ve mobil uyumsuz arayüzlerinden yola çıkarak; <em>"Neden fon verilerini incelemek bir borsa terminali kadar hızlı, bir sosyal medya uygulaması kadar akıcı ve sade olmasın?"</em> sorusuyla tasarlandı.
              </p>
            </section>

            <section className="corporate-section">
              <h2>🎯 Misyonumuz ve Vizyonumuz</h2>
              <p>
                Türkiye'de hızla büyüyen fon yatırımcıları topluluğuna; gizli ücretler, kafa karıştırıcı grafikler veya pazarlama manipülasyonları olmadan, <strong>tamamen saf ve tarafsız veri</strong> sunmak.
              </p>
              <ul>
                <li><strong>Hızlı ve Net Veri:</strong> TEFAS tarafından yayımlanan resmi fon fiyatları, performans metrikleri ve geçmiş fiyat grafikleri.</li>
                <li><strong>Samimi Topluluk:</strong> Fonlar hakkında gerçek yatırımcı deneyimleri, soru-cevaplar ve tarafsız tartışmalar.</li>
                <li><strong>Modern Teknoloji:</strong> Minimalist, yüksek performanslı ve gözü yormayan arayüz tasarımı.</li>
              </ul>
            </section>

            <section className="corporate-section">
              <h2>👨‍💻 Geliştirici & Bağımsız Yapı</h2>
              <p>
                FonSohbet, herhangi bir banka, portföy yönetim şirketi veya aracı kurumun yan kuruluşu değildir. Tamamen bağımsız bir geliştirici tarafından, yatırımcıların geri bildirimleriyle her gün geliştirilmeye devam eden canlı bir projedir.
              </p>

              <div className="developer-tag">
                <div className="dev-avatar">AE</div>
                <div className="dev-info">
                  <h4>Ahmet Nurullah Erkan</h4>
                  <p>Kurucu & Bağımsız Yazılım Geliştirici</p>
                </div>
              </div>
            </section>

            <div className="main-email-banner">
              <div className="main-email-title">Görüşleriniz, İletişim ve İş Birliği İçin</div>
              <p className="corporate-subtitle" style={{ fontSize: '14px', margin: 0 }}>
                Öğrenci projemize katkı sağlamak, hata bildirmek veya reklam/sponsorluk anlaşmaları için doğrudan bana ulaşabilirsiniz:
              </p>
              <a href="mailto:ahmetnurullaherkan@gmail.com" className="main-email-address">
                ahmetnurullaherkan@gmail.com
              </a>
              <span className="main-email-note">
                Fiziki ofis veya adresimiz bulunmamaktadır, tüm iletişim dijital ortamda e-posta ile yürütülmektedir.
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
