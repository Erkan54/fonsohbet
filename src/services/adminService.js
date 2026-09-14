import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatRelativeTime } from './fundService';

/**
 * FonSohbet Yönetim & Moderatör Servisi
 */

// 1. Genel İstatistikleri Getir
export const fetchAdminStats = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      totalComments: 142,
      totalDiscussions: 18,
      totalUsers: 45,
      bannedUsers: 0,
    };
  }

  try {
    const [commentsRes, discRes, usersRes, bannedRes] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('discussions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
    ]);

    return {
      totalComments: commentsRes.count || 0,
      totalDiscussions: discRes.count || 0,
      totalUsers: usersRes.count || 0,
      bannedUsers: bannedRes.count || 0,
    };
  } catch (err) {
    console.error('fetchAdminStats hatası:', err);
    return {
      totalComments: 0,
      totalDiscussions: 0,
      totalUsers: 0,
      bannedUsers: 0,
    };
  }
};

// 2. Yorumları Listele (Arama ve Fon Filtresi ile)
export const fetchAdminComments = async ({ limit = 100, search = '', fundCode = '' } = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('comments')
      .select('id, discussion_id, fund_code, author, content, likes_count, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fundCode && fundCode !== 'Tümü') {
      query = query.eq('fund_code', fundCode.toUpperCase());
    }

    if (search && search.trim() !== '') {
      query = query.ilike('content', `%${search.trim()}%`);
    }

    const { data: comments, error } = await query;
    if (error) throw error;
    if (!comments || comments.length === 0) return [];

    // Kullanıcı profillerini eşleştir
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, status, role')
        .in('id', userIds);
      if (profiles) {
        profiles.forEach(p => { profileMap[p.id] = p; });
      }
    }

    return comments.map(c => {
      const prof = profileMap[c.user_id];
      const isReply = (c.content || '').startsWith('[reply:');
      const cleanContent = isReply 
        ? c.content.replace(/^\[reply:\d+\]\s*/, '') 
        : c.content;

      return {
        ...c,
        isReply,
        cleanContent,
        userStatus: prof?.status || 'active',
        userRole: prof?.role || 'user',
        authorDisplay: prof?.display_name || prof?.username || c.author,
        formattedDate: formatRelativeTime(c.created_at),
        exactDate: new Date(c.created_at).toLocaleString('tr-TR'),
      };
    });
  } catch (err) {
    console.error('fetchAdminComments hatası:', err);
    return [];
  }
};

// 3. Yorum Sil (Admin RPC veya Direct Delete)
export const deleteCommentAsAdmin = async (commentId) => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    // Öncelikle güvenli RPC fonksiyonunu dene
    const { error: rpcErr } = await supabase.rpc('admin_delete_comment', {
      p_comment_id: commentId,
    });

    if (!rpcErr) return true;

    // RPC yoksa doğrudan delete sorgusunu dene (RLS admin delete politikası ile)
    const { error: delErr } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (delErr) throw delErr;
    return true;
  } catch (err) {
    console.error('deleteCommentAsAdmin hatası:', err);
    throw err;
  }
};

// 4. Forum Tartışmalarını Listele
export const fetchAdminDiscussions = async ({ limit = 50, search = '' } = {}) => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let query = supabase
      .from('discussions')
      .select('id, title, fund_code, author, comments_count, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search && search.trim() !== '') {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data: discussions, error } = await query;
    if (error) throw error;
    if (!discussions || discussions.length === 0) return [];

    return discussions.map(d => ({
      ...d,
      formattedDate: formatRelativeTime(d.created_at),
      exactDate: new Date(d.created_at).toLocaleString('tr-TR'),
    }));
  } catch (err) {
    console.error('fetchAdminDiscussions hatası:', err);
    return [];
  }
};

// 5. Tartışmayı ve Altındaki Yorumları Sil
export const deleteDiscussionAsAdmin = async (discussionId) => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error: rpcErr } = await supabase.rpc('admin_delete_discussion', {
      p_discussion_id: discussionId,
    });

    if (!rpcErr) return true;

    // Doğrudan delete
    const { error: delErr } = await supabase
      .from('discussions')
      .delete()
      .eq('id', discussionId);

    if (delErr) throw delErr;
    return true;
  } catch (err) {
    console.error('deleteDiscussionAsAdmin hatası:', err);
    throw err;
  }
};

// 6. Kullanıcı Profillerini Listele
export const fetchAdminUsers = async ({ search = '' } = {}) => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let query = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, role, status, created_at')
      .order('created_at', { ascending: false });

    if (search && search.trim() !== '') {
      query = query.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchAdminUsers hatası:', err);
    return [];
  }
};

// 7. Kullanıcı Durumunu Değiştir (Banla / Banı Kaldır)
export const toggleUserBan = async (userId, currentStatus) => {
  if (!isSupabaseConfigured || !supabase) return false;

  const nextStatus = currentStatus === 'banned' ? 'active' : 'banned';

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', userId);

    if (error) throw error;
    return nextStatus;
  } catch (err) {
    console.error('toggleUserBan hatası:', err);
    throw err;
  }
};
