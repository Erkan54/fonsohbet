import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchFunds, fetchDiscussions, createDiscussion } from '../services/fundService';
import { funds as fallbackFunds, discussions as fallbackDiscussions } from '../data/mockData';

const FundsContext = createContext({
  funds: fallbackFunds,
  discussions: fallbackDiscussions,
  loading: false,
  refreshFunds: async () => {},
  refreshDiscussions: async () => {},
  addNewDiscussion: async () => {},
});

export const FundsProvider = ({ children }) => {
  const [funds, setFunds] = useState(fallbackFunds);
  const [discussions, setDiscussions] = useState(fallbackDiscussions);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fundsData, discData] = await Promise.all([
        fetchFunds(),
        fetchDiscussions(),
      ]);
      if (fundsData && fundsData.length > 0) {
        setFunds(fundsData);
        console.log(`📊 [Fonsohbet] ${fundsData.length} fon yüklendi.`);
      }
      if (discData && discData.length > 0) {
        setDiscussions(discData);
        console.log(`💬 [Fonsohbet] ${discData.length} forum tartışması yüklendi.`);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addNewDiscussion = async (newDisc) => {
    try {
      const created = await createDiscussion(newDisc);
      setDiscussions(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Tartışma eklenemedi:', err);
      throw err;
    }
  };

  return (
    <FundsContext.Provider
      value={{
        funds,
        discussions,
        loading,
        refreshFunds: loadData,
        refreshDiscussions: async () => {
          const d = await fetchDiscussions();
          setDiscussions(d);
        },
        addNewDiscussion,
      }}
    >
      {children}
    </FundsContext.Provider>
  );
};

export const useFunds = () => useContext(FundsContext);
