import React, { useState } from 'react';
import './Corporate.css';

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const email = 'ahmetnurullaherkan@gmail.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="corporate-page animate-fade-in">
      <div className="container corporate-container">

        <div className="corporate-header">
          <span className="corporate-badge">İletişim</span>
          <h1 className="corporate-title">Bizimle İletişime Geçin</h1>
          <p className="corporate-subtitle">
            Görüşleriniz, önerileriniz, platform sponsorlukları ve reklam anlaşmaları için doğrudan bana ulaşabilirsiniz.
          </p>
        </div>

        <div className="corporate-card">
          <div className="corporate-content">

            {/* İletişim Kategorileri Kartları */}
            <div className="contact-cards-grid">

              <div className="contact-card">
                <div className="contact-card-icon">🤝</div>
                <h3 className="contact-card-title">Reklam & İş Birlikleri</h3>
                <p className="contact-card-desc">
                  FonSohbet'te reklam vermek, sponsorluk modelleri geliştirmek veya kurumsal ortaklıklar kurmak için e-posta ile tekliflerinizi iletebilirsiniz.
                </p>
                <a href={`mailto:${email}?subject=Reklam%20ve%20%C4%B0%C5%9F%20Birli%C4%9Fi`} className="contact-email-link">
                  {email} →
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">💡</div>
                <h3 className="contact-card-title">Öneri & Geri Bildirim</h3>
                <p className="contact-card-desc">
                  Sitede görmek istediğiniz yeni bir özellik, grafik geliştirmesi veya fon analiz aracı mı var? Fikirlerinizi duymaktan memnuniyet duyarım.
                </p>
                <a href={`mailto:${email}?subject=%C3%96neri%20ve%20Geri%20Bildirim`} className="contact-email-link">
                  {email} →
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">🐛</div>
                <h3 className="contact-card-title">Teknik Destek & Hata</h3>
                <p className="contact-card-desc">
                  Sistemde bir hata, yanlış veri veya teknik sorunla karşılaştıysanız lütfen ekran görüntüsü ile birlikte bana bildirin, en kısa sürede çözeyim.
                </p>
                <a href={`mailto:${email}?subject=Teknik%20Hata%20Bildirimi`} className="contact-email-link">
                  {email} →
                </a>
              </div>

            </div>

            {/* Büyük E-posta ve Kopyalama Alanı */}
            <div className="main-email-banner">
              <div className="main-email-title">Doğrudan E-Posta Adresi</div>
              <p className="corporate-subtitle" style={{ fontSize: '14px', margin: 0 }}>
                Öğrenci olarak tek başıma geliştirdiğim bu projede gelen tüm mesajları bizzat okuyor ve genellikle 24 saat içinde yanıtlıyorum.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href={`mailto:${email}`} className="main-email-address">
                  {email}
                </a>
                <button
                  onClick={handleCopy}
                  className="btn btn-outline"
                  style={{ height: '44px', padding: '0 16px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {copied ? '✓ Kopyalandı!' : 'Kopyala'}
                </button>
              </div>

              <span className="main-email-note">
                ℹ️ <strong>Adres Bilgisi:</strong> FonSohbet tamamen bağımsız bir dijital web projesidir. Fiziki bir şirket ofisi veya ziyaret adresi bulunmamaktadır; tüm resmi ve kurumsal iletişim sadece e-posta üzerinden yürütülmektedir.
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
