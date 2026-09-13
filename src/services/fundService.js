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

// Zaman Farkı Formatlayıcı (Örn: "Az önce", "5 dk önce", "2 sa önce", "Dün")
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Az önce';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Az önce';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Dün';
  if (diffDay < 7) return `${diffDay} gün önce`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

// Gerçekçi ve dinamik görüntülenme sayısı hesaplayıcı
export const calculateViewsCount = (disc, commentsCount) => {
  if (!disc?.created_at) return (commentsCount || 0) * 6 + 3;
  const hours = Math.max(0, (Date.now() - new Date(disc.created_at).getTime()) / (1000 * 60 * 60));
  const baseViews = 4;
  const commentBonus = (commentsCount || 0) * 8;
  const timeBonus = Math.min(100, Math.floor(hours * 2));
  return baseViews + commentBonus + timeBonus;
};

// 3. Forum Tartışmalarını Getir
export const fetchDiscussions = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return mockDiscussions;
  }

  try {
    const [discRes, commentsRes] = await Promise.all([
      supabase.from('discussions').select('*').order('id', { ascending: false }),
      supabase.from('comments').select('id, discussion_id, fund_code, created_at'),
    ]);

    if (discRes.error) {
      console.error('fetchDiscussions Supabase hatası:', discRes.error);
      return mockDiscussions;
    }

    const data = discRes.data;
    if (!data || data.length === 0) {
      return [];
    }

    const allComments = commentsRes.data || [];

    // Kullanıcı profillerini eşleştir
    const userIds = [...new Set(data.map(d => d.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      if (profiles) {
        profiles.forEach(p => { profileMap[p.id] = p; });
      }
    }

    return data.map(d => {
      const prof = profileMap[d.user_id];
      // Bu tartışmaya ya da ilgili fona ait gerçek yorumları bul
      const matchingComments = allComments.filter(
        c => c.discussion_id === d.id || (d.fund_code && c.fund_code === d.fund_code)
      );
      const realCommentsCount = Math.max(d.comments_count || 0, matchingComments.length);

      // Son aktivite zamanını belirle (en son yorum veya tartışma oluşturma anı)
      let latestTime = d.created_at;
      if (matchingComments.length > 0) {
        const sorted = [...matchingComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        latestTime = sorted[0].created_at;
      }

      return {
        id: d.id,
        title: d.title,
        fundCode: d.fund_code,
        author: prof?.display_name || prof?.username || d.author || 'Anonim',
        authorUsername: prof?.username || null,
        authorAvatar: prof?.avatar_url || null,
        user_id: d.user_id,
        commentsCount: realCommentsCount,
        viewsCount: calculateViewsCount(d, realCommentsCount),
        lastActivity: formatRelativeTime(latestTime),
        createdAt: d.created_at,
      };
    });
  } catch (err) {
    console.error('fetchDiscussions hatası:', err);
    return mockDiscussions;
  }
};

// 4. Yeni Tartışma Aç (Auth gerektirir)
export const createDiscussion = async ({ title, fundCode, content, userId }) => {
  if (!isSupabaseConfigured || !supabase) {
    const newDisc = {
      id: Date.now(),
      title,
      fundCode,
      author: 'Yatırımcı',
      commentsCount: content ? 1 : 0,
      viewsCount: 3,
      lastActivity: 'Az önce',
    };
    mockDiscussions.unshift(newDisc);
    return newDisc;
  }

  // Oturumdaki kullanıcıyı sunucu tarafında doğrula
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Bu işlem için giriş yapmanız gerekiyor.');
  }

  // Profil bilgisini al (avatar ve display_name için)
  let authorName = user.user_metadata?.full_name || 'Yatırımcı';
  let authorAvatar = user.user_metadata?.avatar_url || null;
  let authorUsername = null;

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (prof) {
      authorName = prof.display_name || prof.username || authorName;
      authorAvatar = prof.avatar_url || authorAvatar;
      authorUsername = prof.username;
    }
  } catch (pErr) {
    console.warn('Profil okunamadı:', pErr);
  }

  const hasContent = !!(content && content.trim());

  const { data, error } = await supabase
    .from('discussions')
    .insert([
      {
        title,
        fund_code: fundCode || null,
        author: authorName,
        user_id: user.id,
        comments_count: hasContent ? 1 : 0,
        last_activity: 'Az önce',
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Eğer kullanıcı açıklama/soru metni yazdıysa, ilk yorum olarak kaydet
  if (hasContent) {
    try {
      await supabase.from('comments').insert([
        {
          discussion_id: data.id,
          fund_code: fundCode || null,
          author: authorName,
          user_id: user.id,
          content: content.trim(),
        },
      ]);
    } catch (cErr) {
      console.warn('İlk yorum eklenemedi:', cErr);
    }
  }

  return {
    id: data.id,
    title: data.title,
    fundCode: data.fund_code,
    author: authorName,
    authorUsername,
    authorAvatar,
    user_id: data.user_id,
    commentsCount: hasContent ? 1 : 0,
    viewsCount: 3,
    lastActivity: 'Az önce',
    createdAt: data.created_at || new Date().toISOString(),
  };
};

// 5. Belirli Bir Fona Ait Yorumları Getir
export const fetchFundComments = async (fundCode) => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('fund_code', fundCode)
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.error('fetchFundComments hatası:', error);
      return [];
    }

    const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      if (profiles) {
        profiles.forEach(p => { profileMap[p.id] = p; });
      }
    }

    return data.map(c => {
      const prof = profileMap[c.user_id];
      return {
        ...c,
        author: prof?.display_name || prof?.username || c.author || 'Yatırımcı',
        authorUsername: prof?.username || null,
        authorAvatar: prof?.avatar_url || null,
        formattedDate: formatRelativeTime(c.created_at),
      };
    });
  } catch (err) {
    console.error('fetchFundComments hatası:', err);
    return [];
  }
};

// 6. Fona Yeni Yorum Ekle (Auth gerektirir)
export const addFundComment = async ({ fundCode, content }) => {
  if (!isSupabaseConfigured || !supabase) return null;

  // Oturumdaki kullanıcıyı sunucu tarafında doğrula
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Bu işlem için giriş yapmanız gerekiyor.');
  }

  // Profil bilgisini al
  let authorName = user.user_metadata?.full_name || 'Yatırımcı';
  let authorAvatar = user.user_metadata?.avatar_url || null;

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (prof) {
      authorName = prof.display_name || authorName;
      authorAvatar = prof.avatar_url || authorAvatar;
    }
  } catch (pErr) {
    console.warn('Profil okunamadı:', pErr);
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        fund_code: fundCode,
        author: authorName,
        user_id: user.id,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // İlgili fonun tartışma/yorum sayacını artır
  try {
    await supabase.rpc('increment_fund_discussions', { p_fund_code: fundCode }).catch(() => {});
  } catch (_) {}

  return {
    ...data,
    author: authorName,
    authorAvatar: authorAvatar,
    formattedDate: 'Az önce',
  };
};

// 7. Yorum Beğen
export const likeComment = async (commentId) => {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: current } = await supabase
      .from('comments')
      .select('likes_count')
      .eq('id', commentId)
      .single();

    const newCount = (current?.likes_count || 0) + 1;
    await supabase.from('comments').update({ likes_count: newCount }).eq('id', commentId);
    return newCount;
  } catch (err) {
    console.error('likeComment hatası:', err);
    return null;
  }
};

// 8. Kullanıcının Yorumlarını Getir (Profil sayfası için)
export const fetchUserComments = async (userId) => {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(c => ({
      ...c,
      formattedDate: formatRelativeTime(c.created_at),
    }));
  } catch (err) {
    console.error('fetchUserComments hatası:', err);
    return [];
  }
};
