import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFunds } from '../context/FundsContext';
import './Questionnaire.css';

const questions = [
  {
    id: 1,
    text: "Bu yatırdığınız paraya ne zaman ihtiyacınız olabilir?",
    options: [
      { text: "Her an lazım olabilir", points: { risk: 1, type: 'Para Piyasası' } },
      { text: "3-6 ay içinde", points: { risk: 2, type: 'Borçlanma Araçları' } },
      { text: "1-3 yıl arası dokunmam", points: { risk: 4, type: 'Değişken' } },
      { text: "3 yıldan uzun süre bekleyebilirim", points: { risk: 6, type: 'Hisse' } },
    ]
  },
  {
    id: 2,
    text: "Paranız kısa sürede %10 düşerse ne yaparsınız?",
    options: [
      { text: "Hemen satar çıkarım, bana göre değil", points: { risk: 1, type: 'Para Piyasası' } },
      { text: "Canım sıkılır ama beklerim", points: { risk: 3, type: 'Değişken' } },
      { text: "Fırsat bilip daha fazla alırım", points: { risk: 6, type: 'Hisse' } },
    ]
  },
  {
    id: 3,
    text: "Düzenli ve az getiri mi, yoksa dalgalı ama potansiyeli yüksek getiri mi istersiniz?",
    options: [
      { text: "Düzenli ve az olsun, kafam rahat olsun", points: { risk: 1, type: 'Para Piyasası' } },
      { text: "Biraz dalgalanabilir, orta yolu bulalım", points: { risk: 4, type: 'Değişken' } },
      { text: "Risk almadan büyük kazanç olmaz", points: { risk: 7, type: 'Hisse' } },
    ]
  },
  {
    id: 4,
    text: "Katılım (faizsiz) esaslı fonları özellikle tercih ediyor musunuz?",
    options: [
      { text: "Evet, sadece katılım fonları", points: { risk: 0, type: 'Katılım' } },
      { text: "Fark etmez, getiriye odaklanıyorum", points: { risk: 0, type: 'Herhangi' } },
    ]
  },
  {
    id: 5,
    text: "Altın gibi kıymetli madenler portföyünüzde olsun ister misiniz?",
    options: [
      { text: "Evet, güvenli liman severim", points: { risk: 4, type: 'Altın' } },
      { text: "Hayır, hisse ve diğer araçlar yeterli", points: { risk: 0, type: 'Herhangi' } },
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

  const getRecommendedFunds = () => {
    // Basit bir önerme algoritması: Seçimlere göre en çok öne çıkan risk ve tipi bul
    let totalRisk = 0;
    let typeCounts = {};
    
    answers.forEach(ans => {
      totalRisk += ans.points.risk;
      const type = ans.points.type;
      if (type !== 'Herhangi') {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    const avgRisk = totalRisk / answers.length;
    let preferredType = 'Değişken';
    let max = 0;
    Object.keys(typeCounts).forEach(key => {
      if (typeCounts[key] > max) {
        max = typeCounts[key];
        preferredType = key;
      }
    });

    // Filtreleme
    return funds.filter(f => {
      if (preferredType === 'Katılım' && !f.name.includes('Katılım')) return false;
      if (preferredType === 'Altın' && f.category !== 'Altın') return false;
      if (preferredType === 'Hisse' && !f.category.includes('Hisse')) return false;
      if (preferredType === 'Para Piyasası' && f.category !== 'Para Piyasası') return false;
      
      // Risk toleransına yakın olanlar
      return Math.abs(f.risk - avgRisk) <= 2;
    }).slice(0, 3);
  };

  if (showResults) {
    const recommendations = getRecommendedFunds();
    
    return (
      <div className="q-page container animate-fade-in">
        <div className="q-results">
          <h1 className="q-title">İncelemek isteyebileceğiniz fonlar</h1>
          <p className="q-subtitle">Verdiğiniz yanıtlara göre risk profilinize ve vade tercihinize en yakın fonları aşağıda listeledik.</p>
          
          <div className="recommendation-list">
            {recommendations.length > 0 ? (
              recommendations.map(fund => (
                <div className="rec-card" key={fund.id}>
                  <div className="rec-header">
                    <Link to={`/fon/${fund.code}`} className="rec-code">{fund.code}</Link>
                    <span className="rec-risk">Risk: {fund.risk}/7</span>
                  </div>
                  <div className="rec-name">{fund.name}</div>
                  <div className="rec-reason">
                    Bu fon, {fund.category} kategorisinde olup tercih ettiğiniz vade ve risk beklentinizle örtüşmektedir.
                  </div>
                  <div className="rec-metrics">
                    <div className="rec-metric">
                      <span className="rm-label">1 Ay</span>
                      <span className={`rm-val ${fund.returns.monthly >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fund.returns.monthly >= 0 ? '+' : ''}{fund.returns.monthly.toFixed(2)}%
                      </span>
                    </div>
                    <div className="rec-metric">
                      <span className="rm-label">YBB 2026</span>
                      <span className={`rm-val ${fund.returns.ytd != null && fund.returns.ytd >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fund.returns.ytd != null ? `${fund.returns.ytd >= 0 ? '+' : ''}${fund.returns.ytd.toFixed(2)}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>Tercihlerinize tam uyan bir fon bulamadık. Daha genel bir arama yapabilirsiniz.</p>
            )}
          </div>
          
          <div className="q-actions">
            <button className="btn btn-outline" onClick={() => navigate('/fonlar')}>Tüm Fonları Gör</button>
            <button className="btn btn-outline" onClick={() => {
              setCurrentStep(0);
              setAnswers([]);
              setShowResults(false);
            }}>Testi Tekrar Çöz</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentStep];

  return (
    <div className="q-page container animate-fade-in">
      <div className="q-container">
        <div className="q-progress">
          Adım {currentStep + 1} / {questions.length}
        </div>
        <div key={currentStep} className="animate-slide-in-right">
          <h2 className="q-question">{currentQ.text}</h2>
          <div className="q-options">
            {currentQ.options.map((opt, i) => (
              <button 
                key={i} 
                className="q-option-btn"
                onClick={() => handleAnswer(opt)}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
