import React from 'react';
import './Corporate.css';

const Terms = () => {
  return (
    <div className="corporate-page animate-fade-in">
      <div className="container corporate-container">
        
        <div className="corporate-header">
          <span className="corporate-badge">Hukuki</span>
          <h1 className="corporate-title">Kullanım Koşulları</h1>
          <p className="corporate-subtitle">
            FonSohbet platformunu ziyaret eden ve hizmetlerinden yararlanan tüm kullanıcılar aşağıdaki koşulları kabul etmiş sayılır.
          </p>
        </div>

        <div className="corporate-card">
          <div className="corporate-content">

            <div className="corporate-alert-box">
              <strong>⚠️ ÖNEMLİ YASAL UYARI (YATIRIM TAVSİYESİ DEĞİLDİR):</strong><br />
              FonSohbet platformunda yer alan hiçbir grafik, istatistiki veri, getiri tablosu, algoritma sonucu, topluluk yorumu veya anket sonucu; Sermaye Piyasası Kurulu (SPK) mevzuatı kapsamında yatırım danışmanlığı veya yatırım tavsiyesi niteliği taşımaz. Yatırım kararlarınızı yetkili aracı kurumlar ve portföy danışmanları eşliğinde kendi risk profilinize göre vermelisiniz.
            </div>

            <section className="corporate-section">
              <h2>1. Hizmetin Tanımı ve Kapsamı</h2>
              <p>
                FonSohbet, Türkiye Elektronik Fon Alım Satım Platformu (TEFAS) tarafından kamuya açık olarak yayımlanan yatırım fonu verilerini görselleştiren, analiz araçları sunan ve yatırımcıların bilgi paylaşımı yapabileceği bir topluluk alanıdır.
              </p>
              <p>
                Platform, bağımsız bir üniversite öğrencisi geliştirici tarafından bilgi edinme ve araştırma amaçlı olarak geliştirilmektedir.
              </p>
            </section>

            <section className="corporate-section">
              <h2>2. Veri Doğruluğu ve Sorumluluk Reddi</h2>
              <p>
                Platformdaki fon fiyatları ve getiri hesaplamaları resmi veri kaynaklarına dayanmakla birlikte, teknik aksaklıklar, TEFAS veri aktarım gecikmeleri veya hesaplama farklılıklarından kaynaklanabilecek hatalardan FonSohbet sorumlu tutulamaz.
              </p>
              <p>
                Kullanıcıların platformdaki verilere veya diğer kullanıcıların forumda yazdığı yorumlara dayanarak gerçekleştirdiği alım-satım işlemlerinden doğabilecek kâr veya zararlardan FonSohbet hiçbir şekilde hukuki veya mali sorumluluk kabul etmez.
              </p>
            </section>

            <section className="corporate-section">
              <h2>3. Topluluk ve Forum Kuralları</h2>
              <p>
                FonSohbet forum ve yorum alanlarında tüm kullanıcıların yapıcı, saygılı ve yasalara uygun bir dil kullanması esastır. Aşağıdaki davranışlar kesinlikle yasaktır ve tespiti halinde hesap kalıcı olarak engellenebilir:
              </p>
              <ul>
                <li>Yanıltıcı, manipülatif veya piyasa dolandırıcılığı teşkil edebilecek asılsız iddialar paylaşmak.</li>
                <li>Diğer kullanıcılara hakaret, nefret söylemi, taciz veya tehdit içeren ifadelerde bulunmak.</li>
                <li>İzinsiz reklam, spam, referans linki veya yasa dışı bahis/finans siteleri tanıtımı yapmak.</li>
                <li>Telif hakkı içeren içerikleri izinsiz paylaşmak.</li>
              </ul>
            </section>

            <section className="corporate-section">
              <h2>4. Fikri Mülkiyet Hakları</h2>
              <p>
                FonSohbet adı, logosu, arayüz tasarımları, grafik bileşenleri ve özel yazılım kodları geliştiriciye aittir. İzinsiz olarak ticari amaçla kopyalanamaz, dağıtılamaz veya kaynak gösterilmeden çoğaltılamaz.
              </p>
            </section>

            <section className="corporate-section">
              <h2>5. Değişiklik Hakkı ve İletişim</h2>
              <p>
                FonSohbet, bu kullanım koşullarını dilediği zaman güncelleme hakkını saklı tutar. Değişiklikler sitede yayımlandığı andan itibaren geçerlilik kazanır.
              </p>
              <p>
                Kullanım koşullarıyla ilgili tüm soru, öneri ve talepleriniz için resmi iletişim adresimiz: <a href="mailto:ahmetnurullaherkan@gmail.com" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ahmetnurullaherkan@gmail.com</a>
              </p>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Terms;
