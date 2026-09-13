import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Questionnaire.css';

const questions = [
  {
    id: 1,
    category: "Vade & Zamanlama",
    text: "Bu yatırdığınız paraya ne zaman ihtiyacınız olabilir?",
    options: [
      { text: "Her an lazım olabilir, acil durumlar kapıda", points: { risk: 1, type: 'Para Piyasası' } },
      { text: "3-6 ay içinde çekerim muhtemelen", points: { risk: 2, type: 'Borçlanma Araçları' } },
      { text: "1-3 yıl arası dokunmam, kalsın", points: { risk: 4, type: 'Değişken' } },
      { text: "3 yıldan uzun süre bekleyebilirim, uzun vadeciyim", points: { risk: 7, type: 'Hisse' } },
    ]
  },
  {
    id: 2,
    category: "Maddi Durum & Birikim",
    text: "Şu anki genel maddi durumunuz ve kenara para koyma alışkanlığınız ne alemde?",
    options: [
      { text: "Öğrenciyim veya kısıtlı bütçem var; harçlıktan, cep harçlığından 3-5 kuruş artırmaya çalışıyorum", points: { risk: 2, type: 'Para Piyasası', isStudent: true } },
      { text: "Aylık düzenli gelirim var, her ay maaşımdan küçük-orta bir miktarı kenara atabiliyorum", points: { risk: 4, type: 'Değişken' } },
      { text: "Kenarda halihazırda toplu bir birikimim var, erimesin değerlendireyim diyorum", points: { risk: 4, type: 'Altın' } },
      { text: "Gelirim gayet rahat, düzenli yatırım bütçem ve risk toleransım yüksek", points: { risk: 7, type: 'Hisse' } },
    ]
  },
  {
    id: 3,
    category: "Güvence & Acil Durum",
    text: "Yatırım yapacağınız bu tutar haricinde, kenarda ani bir sağlık/iş masrafı için güvenceniz var mı?",
    options: [
      { text: "Yok maalesef, tek kurşunum bu; bir şey olursa direkt bozdurmam gerekir", points: { risk: 1, type: 'Para Piyasası', emergencyNone: true } },
      { text: "1-2 aylık idare edecek ufak bir kenarlık var", points: { risk: 3, type: 'Borçlanma Araçları' } },
      { text: "Evet, 3-6 aylık masrafımı karşılayacak acil durum param hazırda bekliyor", points: { risk: 6, type: 'Hisse', emergencySafe: true } },
    ]
  },
  {
    id: 4,
    category: "Düşüş Psikolojisi",
    text: "Aldığınız fon piyasa dalgalanmasıyla kısa sürede %10-15 düşerse ilk tepkiniz ne olur?",
    options: [
      { text: "Uykularım kaçar, panikler hemen satıp çıkarım", points: { risk: 1, type: 'Para Piyasası' } },
      { text: "Canım çok sıkılır ama zararına satmamak için beklerim", points: { risk: 3, type: 'Değişken' } },
      { text: "Piyasadır bu, düşer de çıkar da der sakince izlerim", points: { risk: 5, type: 'Değişken' } },
      { text: "Süper fırsat! İndirim gelmiş der sevinir, daha fazla alırım", points: { risk: 7, type: 'Hisse' } },
    ]
  },
  {
    id: 5,
    category: "Getiri Beklentisi",
    text: "Nasıl bir getiri-risk dengesi hayal ediyorsunuz?",
    options: [
      { text: "Düzenli ve az olsun, kafam rahat olsun (sıfır stres)", points: { risk: 1, type: 'Para Piyasası' } },
      { text: "Mevduatın/enflasyonun biraz üzerinde getirsin, aşırı oynamasın kafi", points: { risk: 3, type: 'Borçlanma Araçları' } },
      { text: "Orta yolu bulalım, dengeli bir sepetle makul büyüsün", points: { risk: 4, type: 'Değişken' } },
      { text: "Risk almadan büyük kazanç olmaz, agresif ve yüksek getiri isterim", points: { risk: 7, type: 'Hisse' } },
    ]
  },
  {
    id: 6,
    category: "Kıymetli Madenler",
    text: "Portföyünüzde altın veya kıymetli madenler yer alsın ister misiniz?",
    options: [
      { text: "Evet, altın vazgeçilmez güvenli limanımdır, mutlaka olsun", points: { risk: 4, type: 'Altın', wantsGold: true } },
      { text: "Ağırlıklı olmasa da sepetin bir köşesinde bulunsun", points: { risk: 4, type: 'Değişken' } },
      { text: "Hayır, altın yerine şirket hisseleri ve teknolojiye odaklanırım", points: { risk: 6, type: 'Hisse' } },
    ]
  },
  {
    id: 7,
    category: "Küresel Piyasalar & Teknoloji",
    text: "Yurt dışı teknoloji devlerine (Apple, Nvidia, Google vb.) veya döviz bazlı varlıklara yatırım yapmak ilginizi çeker mi?",
    options: [
      { text: "Kesinlikle! Param hem döviz bazlı korunsun hem de küresel devlerde büyüsün", points: { risk: 6, type: 'Hisse', wantsGlobalTech: true } },
      { text: "Döviz bazlı Eurobond veya dengeli yabancı fonlar fena olmaz", points: { risk: 4, type: 'Borçlanma Araçları' } },
      { text: "Yerli şirketler ve BIST bana daha samimi ve anlaşılır geliyor", points: { risk: 5, type: 'Hisse' } },
      { text: "Yabancı piyasalar karmaşık gelir, sadece TL vadeli/para piyasası yeter", points: { risk: 1, type: 'Para Piyasası' } },
    ]
  },
  {
    id: 8,
    category: "Katılım Hassasiyeti",
    text: "Yatırımlarınızda faizsiz / katılım esaslarına uygunluk sizin için önemli mi?",
    options: [
      { text: "Evet, kesinlikle sadece faizsiz katılım fonları olsun", points: { risk: 0, type: 'Katılım', katilimOnly: true } },
      { text: "Hassasiyetim yok, getiri potansiyeli neyse ona odaklanırım", points: { risk: 0, type: 'Herhangi' } },
    ]
  },
  {
    id: 9,
    category: "Takip Alışkanlığı",
    text: "Fonlarınızı ve piyasaları ne sıklıkla takip etmeyi planlıyorsunuz?",
    options: [
      { text: "Alıp unutmak istiyorum; ayda yılda bir baksam yeter, kafam rahat kalsın", points: { risk: 2, type: 'Değişken' } },
      { text: "Haftada bir-iki defa bakar, duruma göre gerekirse dengelerim", points: { risk: 4, type: 'Değişken' } },
      { text: "Her gün uygulamayı açar, piyasaları zevkle takip ederim", points: { risk: 6, type: 'Hisse' } },
    ]
  },
  {
    id: 10,
    category: "Yatırım Hedefi",
    text: "Bu birikimle ulaşmak istediğiniz en büyük nihai hedef nedir?",
    options: [
      { text: "Param enflasyon karşısında değer kaybetmesin, erimesin yeter", points: { risk: 2, type: 'Para Piyasası' } },
      { text: "Ev peşinatı, araba veya tatil gibi 1-3 yıllık somut bir harcama için birikim", points: { risk: 4, type: 'Değişken' } },
      { text: "Bileşik getiriyle finansal özgürlük kazanmak, servet büyütmek", points: { risk: 7, type: 'Hisse' } },
      { text: "Emeklilikte rahat etmek için kenarda damlayan sağlam bir kumbara", points: { risk: 4, type: 'Değişken' } },
    ]
  }
];

const Questionnaire = () => {
  const { funds } = useFunds();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const getProfileAnalysis = () => {
    let riskSum = 0;
    let riskCount = 0;
    let typeCounts = {};

    answers.forEach(ans => {
      if (ans.points && ans.points.risk > 0) {
        riskSum += ans.points.risk;
        riskCount++;
      }
      const type = ans.points?.type;
      if (type && type !== 'Herhangi') {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    let avgRisk = riskCount > 0 ? (riskSum / riskCount) : 4;

    // Acil durum parası hiç yoksa riski sınırla
    const hasNoEmergency = answers.some(a => a.points?.emergencyNone);
    if (hasNoEmergency) {
      avgRisk = Math.min(avgRisk, 3.2);
    }

    let profileTitle = "Dengeli Yatırımcı";
    let profileBadgeClass = "badge-balanced";
    let profileDescription = "Orta düzey risk toleransına sahipsiniz. Enflasyonun üzerinde getiri hedeflerken aşırı dalgalanmalardan kaçınarak dengeli bir sepet oluşturmanız en sağlıklısı.";

    if (avgRisk < 2.5) {
      profileTitle = "Temkinli & Muhafazakar Yatırımcı";
      profileBadgeClass = "badge-conservative";
      profileDescription = "Sizin için ana paranın güvenliği ve düzenli getiri her şeyden önce geliyor. Dalgalanmalardan hoşlanmıyor, likit ve risksiz getiriyi tercih ediyorsunuz.";
    } else if (avgRisk >= 4.8) {
      profileTitle = "Büyüme Odaklı & Cesur Yatırımcı";
      profileBadgeClass = "badge-aggressive";
      profileDescription = "Yüksek getiri potansiyeli için kısa vadeli düşüşleri tolere edebiliyorsunuz. Uzun vadeli bileşik büyüme gücüne ve hisse senedi/teknoloji potansiyeline odaklısınız.";
    }

    return {
      avgRisk: Number(avgRisk.toFixed(1)),
      title: profileTitle,
      badgeClass: profileBadgeClass,
      description: profileDescription,
      typeCounts
    };
  };

  const getRecommendedFunds = () => {
    const profile = getProfileAnalysis();
    const isKatilimOnly = answers.some(a => a.points?.katilimOnly);
    const wantsGold = answers.some(a => a.points?.wantsGold);
    const wantsGlobalTech = answers.some(a => a.points?.wantsGlobalTech);

    const scoredFunds = (funds || []).map(fund => {
      let score = 100;
      const fNameLower = (fund.name || '').toLowerCase();
      const fCatLower = (fund.category || '').toLowerCase();

      // 1. Katılım şartı
      const isKatilim = fNameLower.includes('katılım') || fCatLower.includes('katılım');
      if (isKatilimOnly) {
        if (!isKatilim) return { fund, score: -999, reason: '' };
        score += 80;
      }

      // 2. Risk puanı yakınlığı (0 ile 7 arası)
      const riskDiff = Math.abs((fund.risk || 4) - profile.avgRisk);
      score -= riskDiff * 16;

      // 3. Kategori tercihi puanlaması
      if (fund.category === 'Para Piyasası') {
        if (profile.avgRisk < 2.5) score += 40;
        if (profile.typeCounts['Para Piyasası']) score += profile.typeCounts['Para Piyasası'] * 8;
      }
      if (fund.category === 'Hisse Senedi') {
        if (profile.avgRisk >= 4.5) score += 35;
        if (profile.typeCounts['Hisse']) score += profile.typeCounts['Hisse'] * 8;
      }
      if (fund.category === 'Altın') {
        if (wantsGold) score += 50;
        if (profile.typeCounts['Altın']) score += profile.typeCounts['Altın'] * 8;
      }
      if (fund.category === 'Borçlanma Araçları') {
        if (profile.avgRisk >= 2 && profile.avgRisk <= 4) score += 25;
      }
      if (fund.category === 'Değişken') {
        if (profile.avgRisk >= 3.5 && profile.avgRisk <= 6) score += 25;
      }

      // 4. Global teknoloji isteği
      if (wantsGlobalTech) {
        if (fNameLower.includes('teknoloji') || fNameLower.includes('yabancı') || ['AFT', 'YAY', 'GUH', 'IJC', 'YIT', 'GBV'].includes(fund.code)) {
          score += 45;
        }
      }

      // 5. Küçük getiri ve popülerlik bonusu
      if (fund.returns && fund.returns.monthly > 0) {
        score += Math.min(fund.returns.monthly, 8);
      }
      if (fund.discussionCount > 50) score += 5;

      // Özel Neden Metni Oluşturma
      let reason = `Bu fon, ${fund.category} kategorisinde olup tercih ettiğiniz vade ve risk beklentinizle örtüşmektedir.`;
      if (isKatilim) {
        reason = "Faizsiz finans ve katılım esaslarına tam uyumlu yapısıyla getiri hedeflerinize ve hassasiyetinize uygun.";
      } else if (fund.category === 'Para Piyasası') {
        reason = "Kısa vadeli nakit ve acil durum ihtiyaçlarınıza uygun, sıfır dalgalanmayla günlük faiz getirisi sağlayan risksiz bir fon.";
      } else if (fund.category === 'Altın') {
        reason = "Kıymetli maden tercihinize uygun, enflasyona ve küresel dalgalanmalara karşı güvenli liman sağlayan altın fonu.";
      } else if (fund.category === 'Hisse Senedi') {
        if (fNameLower.includes('yabancı') || fNameLower.includes('teknoloji')) {
          reason = "Küresel dev şirketlere ve teknolojiye yatırım yaparak uzun vadeli yüksek büyüme vadeden hisse fonu.";
        } else {
          reason = "Borsa İstanbul'un öncü şirketlerine yatırım yaparak uzun vadede enflasyonu yenmeyi hedefleyen hisse senedi fonu.";
        }
      } else if (fund.category === 'Değişken') {
        reason = "Portföy yöneticileri tarafından piyasa şartlarına göre dinamik yönetilen, dengeli ve esnek değişken fon.";
      } else if (fund.category === 'Borçlanma Araçları') {
        reason = "Düşük dalgalanmayla mevduat üzeri istikrarlı getiri hedefleyen borçlanma araçları fonu.";
      }

      return { fund, score, reason };
    });

    scoredFunds.sort((a, b) => b.score - a.score);
    return scoredFunds.filter(item => item.score > 0).slice(0, 3);
  };

  if (showResults) {
    const profile = getProfileAnalysis();
    const recommendations = getRecommendedFunds();
    
    return (
      <div className="q-page container animate-fade-in">
        <div className="q-results">
          {/* Yatırımcı Profil Kartı */}
          <div className="q-profile-card">
            <div className="q-profile-header">
              <span className={`q-profile-badge ${profile.badgeClass}`}>
                {profile.title}
              </span>
              <span className="q-risk-score">
                Risk Toleransı: <strong>{profile.avgRisk} / 7</strong>
              </span>
            </div>
            <p className="q-profile-desc">{profile.description}</p>
          </div>

          <h1 className="q-title">İncelemek İsteyebileceğiniz Fonlar</h1>
          <p className="q-subtitle">
            10 soruluk testte verdiğiniz yanıtlara göre maddi durumunuza, vadenize ve risk toleransınıza en uygun 3 fonu listeledik.
          </p>
          
          <div className="recommendation-list">
            {recommendations.length > 0 ? (
              recommendations.map(({ fund, reason }) => (
                <div className="rec-card" key={fund.id || fund.code}>
                  <div className="rec-header">
                    <div className="rec-title-wrap">
                      <Link to={`/fon/${fund.code}`} className="rec-code">{fund.code}</Link>
                      <span className="rec-category-tag">{fund.category}</span>
                    </div>
                    <span className="rec-risk">Risk: {fund.risk}/7</span>
                  </div>
                  <div className="rec-name">{fund.name}</div>
                  <div className="rec-reason">
                    <span className="rec-reason-icon">💡</span> {reason}
                  </div>
                  <div className="rec-metrics">
                    <div className="rec-metric">
                      <span className="rm-label">1 Aylık Getiri</span>
                      <span className={`rm-val ${fund.returns?.monthly >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fund.returns?.monthly >= 0 ? '+' : ''}{fund.returns?.monthly != null ? fund.returns.monthly.toFixed(2) : '0.00'}%
                      </span>
                    </div>
                    <div className="rec-metric">
                      <span className="rm-label">YBB 2026</span>
                      <span className={`rm-val ${fund.returns?.ytd != null && fund.returns.ytd >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fund.returns?.ytd != null ? `${fund.returns.ytd >= 0 ? '+' : ''}${fund.returns.ytd.toFixed(2)}%` : '—'}
                      </span>
                    </div>
                    <div className="rec-metric">
                      <span className="rm-label">Fiyat</span>
                      <span className="rm-val">₺{fund.price != null ? fund.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rec-empty">
                <p>Tercihlerinize tam uyan bir fon bulunamadı. Genel fon listesini inceleyebilirsiniz.</p>
              </div>
            )}
          </div>
          
          <div className="q-actions">
            <button className="btn btn-primary" onClick={() => navigate('/fonlar')}>
              Tüm Fonları İncele
            </button>
            <button className="btn btn-outline" onClick={() => {
              setCurrentStep(0);
              setAnswers([]);
              setShowResults(false);
            }}>
              Testi Tekrar Çöz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <div className="q-page container animate-fade-in">
      <div className="q-container">
        {/* Progress Bar ve Adım Bilgisi */}
        <div className="q-progress-header">
          <span className="q-step-badge">ADIM {currentStep + 1} / {questions.length}</span>
          <span className="q-category-badge">{currentQ.category}</span>
        </div>

        <div className="q-progress-track">
          <div 
            className="q-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div key={currentStep} className="q-content animate-slide-in-right">
          <h2 className="q-question">{currentQ.text}</h2>
          <div className="q-options">
            {currentQ.options.map((opt, i) => (
              <button 
                key={i} 
                className="q-option-btn"
                onClick={() => handleAnswer(opt)}
              >
                <span className="q-opt-marker">{String.fromCharCode(65 + i)}</span>
                <span className="q-opt-text">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {currentStep > 0 && (
          <div className="q-footer-nav">
            <button className="q-back-btn" onClick={handlePrevious}>
              ← Önceki Soruya Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;
