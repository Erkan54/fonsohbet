import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Funds from './pages/Funds';
import FundDetail from './pages/FundDetail';
import Forum from './pages/Forum';
import Questionnaire from './pages/Questionnaire';
import Profile from './pages/Profile';

import Footer from './components/Footer';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FundsProvider } from './context/FundsContext';

const AppContent = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <Header />
      <main className="main-content" style={{ marginTop: isHome ? 0 : '40px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fonlar" element={<Funds />} />
          <Route path="/fon/:id" element={<FundDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/bul" element={<Questionnaire />} />
          <Route path="/profil" element={<Profile />} />
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
