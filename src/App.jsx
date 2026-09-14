import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Funds from './pages/Funds';
import FundDetail from './pages/FundDetail';
import Forum from './pages/Forum';
import Questionnaire from './pages/Questionnaire';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';

import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { FundsProvider } from './context/FundsContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // setTimeout ile React DOM güncellemelerinin bitmesini bekle
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    }, 0);
  }, [pathname]);
  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="main-content" style={{ marginTop: isHome ? 0 : '40px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fonlar" element={<Funds />} />
          <Route path="/fon/:id" element={<FundDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/bul" element={<Questionnaire />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/hakkimizda" element={<About />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/kullanim-kosullari" element={<Terms />} />
          <Route path="/gizlilik-politikasi" element={<Privacy />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FundsProvider>
          <AppContent />
        </FundsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
