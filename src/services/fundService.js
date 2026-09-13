import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { funds as mockFunds, discussions as mockDiscussions } from '../data/mockData';

// DB sütunlarını frontend nesne yapısına dönüştürücü
export const mapDbFundToModel = (f) => ({
  id: f.id || f.code,
  code: f.code,
  name: f.name,
  category: f.category,
  price: Number(f.price) || 0,
  borsaKapanis: f.borsa_kapanis !== null ? Number(f.borsa_kapanis) : undefined,
  returns: {
    weekly: Number(f.weekly_return) || 0,
    monthly: Number(f.monthly_return) || 0,
    ytd: f.ytd_return !== null && f.ytd_return !== undefined ? Number(f.ytd_return) : null,
  },
  risk: f.risk_level || 1,
  investors: f.investors || 0,
  discussionCount: f.discussion_count || 0,
  sourceUrl: f.source_url || `https://fonasistani.com/fon/${f.code}`,
});

// 1. Tüm Fonları Getir (Canlı Supabase veya Yerel Mock)
export const fetchFunds = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return mockFunds;
  }

  try {
    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .order('code', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase veri hatası veya boş tablo, mock veriye geçiliyor:', error);
      return mockFunds;
    }

    return data.map(mapDbFundToModel);
  } catch (err) {
    console.error('fetchFunds hatası:', err);
    return mockFunds;
  }
};

// 2. Tek Bir Fonu Getir
export const fetchFundByCode = async (code) => {
  if (!isSupabaseConfigured || !supabase) {
    return mockFunds.find(f => f.code.toUpperCase() === code?.toUpperCase()) || null;
  }

  try {
    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .ilike('code', code)
      .maybeSingle();

    if (error || !data) {
      return mockFunds.find(f => f.code.toUpperCase() === code?.toUpperCase()) || null;
    }

    return mapDbFundToModel(data);
  } catch (err) {
    console.error('fetchFundByCode hatası:', err);
    return mockFunds.find(f => f.code.toUpperCase() === code?.toUpperCase()) || null;
  }
};

// 3. Forum Tartışmalarını Getir
export const fetchDiscussions = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return mockDiscussions;
  }

  try {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('id', { ascending: false });

    if (error || !data || data.length === 0) {
      return mockDiscussions;
    }

    return data.map(d => ({
      id: d.id,
      title: d.title,
      fundCode: d.fund_code,
      author: d.author,
      commentsCount: d.comments_count,
      lastActivity: d.last_activity,
    }));
  } catch (err) {
    console.error('fetchDiscussions hatası:', err);
    return mockDiscussions;
  }
};

// 4. Yeni Tartışma Aç
export const createDiscussion = async ({ title, fundCode, author }) => {
  if (!isSupabaseConfigured || !supabase) {
    const newDisc = {
      id: Date.now(),
      title,
      fundCode,
      author: author || 'anonim',
      commentsCount: 0,
      lastActivity: 'Şimdi',
    };
    mockDiscussions.unshift(newDisc);
    return newDisc;
  }

  const { data, error } = await supabase
    .from('discussions')
    .insert([
      {
        title,
        fund_code: fundCode,
        author: author || 'anonim',
        comments_count: 0,
        last_activity: 'Şimdi',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
