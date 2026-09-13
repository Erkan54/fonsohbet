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

      const discs = discData || [];
      // Her fon için tartışma ve yorum sayısını hesapla
      const activityMap = {};
      discs.forEach(d => {
        if (d.fundCode) {
          activityMap[d.fundCode] = (activityMap[d.fundCode] || 0) + 1 + (d.commentsCount || 0);
        }
      });

      if (fundsData && fundsData.length > 0) {
        const enrichedFunds = fundsData.map(f => ({
          ...f,
          discussionCount: (activityMap[f.code] || 0) + (f.discussionCount || 0),
        }));
        setFunds(enrichedFunds);
        console.log(`📊 [Fonsohbet] ${enrichedFunds.length} fon yüklendi.`);
      }

      setDiscussions(discs);
      console.log(`💬 [Fonsohbet] ${discs.length} forum tartışması yüklendi.`);
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
      // İlgili fonun aktivitesini artır
      if (created.fundCode) {
        setFunds(prevFunds => prevFunds.map(f => 
          f.code === created.fundCode ? { ...f, discussionCount: (f.discussionCount || 0) + 1 } : f
        ));
      }
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
