import React from 'react';
import './Corporate.css';

const Privacy = () => {
  return (
    <div className="corporate-page animate-fade-in">
      <div className="container corporate-container">
        
        <div className="corporate-header">
          <span className="corporate-badge">Gizlilik</span>
          <h1 className="corporate-title">Gizlilik Politikası</h1>
          <p className="corporate-subtitle">
            Kişisel verilerinizin güvenliği ve gizliliği FonSohbet için önceliklidir. Verilerinizin nasıl işlendiğini şeffaf bir şekilde açıklıyoruz.
          </p>
        </div>

        <div className="corporate-card">
          <div className="corporate-content">

            <section className="corporate-section">
              <h2>1. Toplanan Kişisel Veriler</h2>
              <p>
                FonSohbet'te hesap oluştururken yalnızca <strong>Google ile Güvenli Giriş (Google OAuth 2.0)</strong> altyapısı kullanılmaktadır. Sistemimizde şifreniz saklanmaz. Google üzerinden yalnızca şu temel bilgiler alınır:
              </p>
              <ul>
                <li><strong>Ad ve Soyad:</strong> Forum ve yorumlarda görüntülenen profil adınız için.</li>
                <li><strong>E-Posta Adresi:</strong> Güvenli oturum açma ve hesabınızı tekil olarak tanımlamak için.</li>
                <li><strong>Profil Fotoğrafı (Avatar):</strong> Topluluk içerisindeki profil resminiz için.</li>
              </ul>
            </section>

            <section className="corporate-section">
              <h2>2. Verilerin Kullanım Amacı</h2>
              <p>
                Toplanan veriler yalnızca aşağıdaki amaçlarla sınırlı olarak kullanılır:
              </p>
              <ul>
                <li>Kullanıcı oturumunun güvenli bir şekilde sürdürülmesi.</li>
                <li>Platformda yorum yapma, tartışma açma ve beğeni gibi topluluk özelliklerinin çalışması.</li>
                <li>Sistem güvenliğinin sağlanması, spam ve kötü niyetli girişimlerin önlenmesi.</li>
              </ul>
              <div className="corporate-alert-box">
                <strong>🔒 Verileriniz Asla Satılmaz:</strong> FonSohbet, kullanıcıların kişisel verilerini hiçbir koşulda üçüncü taraf reklam şirketlerine, aracı kurumlara veya veri komisyoncularına satmaz ve kiralamaz.
              </div>
            </section>

            <section className="corporate-section">
              <h2>3. Çerezler (Cookies) ve Yerel Depolama</h2>
              <p>
                FonSohbet, kullanıcı deneyimini iyileştirmek, oturum sürekliliğini sağlamak ve sayfa yükleme hızlarını optimize etmek için tarayıcınızın yerel depolama (Local Storage) ve oturum çerezlerini kullanır:
              </p>
              <ul>
                <li><strong>Oturum Çerezleri:</strong> Google OAuth oturumunuzun aktif kalmasını sağlar.</li>
                <li><strong>Önbellek (Cache):</strong> Fiyat grafikleri ve TEFAS verilerinin her ziyarette tekrar indirilmesini önleyerek kotanızı korur ve anında yüklenir.</li>
              </ul>
            </section>

            <section className="corporate-section">
              <h2>4. Veri Saklama ve Güvenlik</h2>
              <p>
                Platform veritabanı, uluslararası güvenlik standartlarına sahip bulut altyapısı (Supabase / AWS altyapısı) üzerinde TLS/SSL şifreleme protokolleri ile korunmaktadır.
              </p>
            </section>

            <section className="corporate-section">
              <h2>5. Kullanıcı Hakları ve Veri Silme</h2>
              <p>
                KVKK ve genel veri koruma ilkeleri kapsamında; kullanıcılar diledikleri an hesaplarının ve tüm paylaşımlarının sistemden kalıcı olarak silinmesini talep etme hakkına sahiptir.
              </p>
              <p>
                Veri silme talepleriniz veya gizlilik politikamız ile ilgili tüm sorularınız için doğrudan geliştirici e-posta adresiyle iletişime geçebilirsiniz: <a href="mailto:ahmetnurullaherkan@gmail.com" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ahmetnurullaherkan@gmail.com</a>
              </p>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Privacy;
