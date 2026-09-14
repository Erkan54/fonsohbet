import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFunds } from '../context/FundsContext';
import {
  fetchAdminStats,
  fetchAdminComments,
  deleteCommentAsAdmin,
  fetchAdminDiscussions,
  deleteDiscussionAsAdmin,
  fetchAdminUsers,
  toggleUserBan,
} from '../services/adminService';
import './Admin.css';

const Admin = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { funds, refreshDiscussions } = useFunds();

  const [activeTab, setActiveTab] = useState('comments');
  const [stats, setStats] = useState({
    totalComments: 0,
    totalDiscussions: 0,
    totalUsers: 0,
    bannedUsers: 0,
  });

  const [comments, setComments] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [users, setUsers] = useState([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFundFilter, setSelectedFundFilter] = useState('Tümü');
  const [toastMessage, setToastMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // İstatistikleri yükle
  const loadStats = useCallback(async () => {
    const s = await fetchAdminStats();
    setStats(s);
  }, []);

  // Aktif sekmenin verisini yükle
  const loadTabData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      if (activeTab === 'comments') {
        const data = await fetchAdminComments({
          search: searchTerm,
          fundCode: selectedFundFilter,
        });
        setComments(data);
      } else if (activeTab === 'discussions') {
        const data = await fetchAdminDiscussions({ search: searchTerm });
        setDiscussions(data);
      } else if (activeTab === 'users') {
        const data = await fetchAdminUsers({ search: searchTerm });
        setUsers(data);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [activeTab, searchTerm, selectedFundFilter]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadTabData();
    }
  }, [isAdmin, loadStats, loadTabData]);

  // Yorum Silme
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    try {
      setIsProcessing(true);
      await deleteCommentAsAdmin(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setStats(prev => ({ ...prev, totalComments: Math.max(0, prev.totalComments - 1) }));
      refreshDiscussions();
      showToast('Yorum başarıyla silindi.');
    } catch (err) {
      alert('Yorum silinirken hata oluştu: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Tartışma Silme
  const handleDeleteDiscussion = async (discussionId) => {
    if (!window.confirm('Bu tartışmayı ve bağlı tüm yorumları kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    try {
      setIsProcessing(true);
      await deleteDiscussionAsAdmin(discussionId);
      setDiscussions(prev => prev.filter(d => d.id !== discussionId));
      setStats(prev => ({ ...prev, totalDiscussions: Math.max(0, prev.totalDiscussions - 1) }));
      refreshDiscussions();
      showToast('Tartışma konusu silindi.');
    } catch (err) {
      alert('Tartışma silinirken hata oluştu: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Kullanıcı Banlama / Açma
  const handleToggleBan = async (targetUser) => {
    const isBanned = targetUser.status === 'banned';
    const actionName = isBanned ? 'kullanıcının banını kaldırmak' : 'kullanıcıyı askıya almak (banlamak)';
    if (!window.confirm(`${targetUser.username} isimli ${actionName} istediğinize emin misiniz?`)) return;

    try {
      setIsProcessing(true);
      const newStatus = await toggleUserBan(targetUser.id, targetUser.status);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
      setStats(prev => ({
        ...prev,
        bannedUsers: isBanned ? Math.max(0, prev.bannedUsers - 1) : prev.bannedUsers + 1,
      }));
      showToast(isBanned ? 'Kullanıcının banı kaldırıldı.' : 'Kullanıcı hesabı askıya alındı.');
    } catch (err) {
      alert('Kullanıcı durumu güncellenirken hata: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Yetkisiz Erişim Kontrolü
  if (authLoading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p className="text-muted">Yetki kontrolü yapılıyor...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container animate-fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(163, 67, 62, 0.1)',
          color: 'var(--color-negative)',
          fontSize: '28px',
          marginBottom: '20px'
        }}>
          🚫
        </div>
        <h1 className="page-title" style={{ marginBottom: '12px' }}>Yetkisiz Erişim (403)</h1>
        <p className="page-subtitle" style={{ maxWidth: '480px', margin: '0 auto 28px' }}>
          Bu sayfaya sadece FonSohbet moderatör ve yöneticileri erişebilir. Yönetici yetkiniz varsa lütfen ilgili Google hesabınızla giriş yapınız.
        </p>
        <Link to="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="admin-page container animate-fade-in">
      {/* Üst Başlık & Moderatör Bilgisi */}
      <div className="admin-header-row">
        <div>
          <span className="admin-badge-role">⚙️ Yönetici & Moderatör Paneli</span>
          <h1 className="page-title">Topluluk & Moderasyon</h1>
          <p className="page-subtitle">
            Hoş geldiniz, <b>{profile?.display_name || user?.email}</b>. Spam içerikleri temizleyin ve kullanıcıları denetleyin.
          </p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={() => { loadStats(); loadTabData(); }}
          title="Verileri Yenile"
          disabled={isProcessing}
        >
          ↻ Yenile
        </button>
      </div>

      {/* Bildirim Toast */}
      {toastMessage && (
        <div className="admin-toast">
          <span>✓ {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-comments">💬</div>
          <div>
            <div className="stat-value">{stats.totalComments}</div>
            <div className="stat-label">Toplam Yorum</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-discussions">📋</div>
          <div>
            <div className="stat-value">{stats.totalDiscussions}</div>
            <div className="stat-label">Forum Tartışması</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-users">👥</div>
          <div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Kayıtlı Yatırımcı</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-banned">🚫</div>
          <div>
            <div className="stat-value">{stats.bannedUsers}</div>
            <div className="stat-label">Askıdaki Hesap</div>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="admin-tabs-nav">
        <button 
          className={`admin-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => { setActiveTab('comments'); setSearchTerm(''); }}
        >
          Yorum Moderasyonu
          <span className="tab-badge">{stats.totalComments}</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'discussions' ? 'active' : ''}`}
          onClick={() => { setActiveTab('discussions'); setSearchTerm(''); }}
        >
          Forum Konuları
          <span className="tab-badge">{stats.totalDiscussions}</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
        >
          Kullanıcılar & Ban
          <span className="tab-badge">{stats.totalUsers}</span>
        </button>
      </div>

      {/* Filtreleme ve Arama Çubuğu */}
      <div className="admin-filter-bar">
        <input 
          type="text"
          className="input-base admin-search-input"
          placeholder={
            activeTab === 'comments' ? 'Yorum içeriğinde ara...' :
            activeTab === 'discussions' ? 'Konu başlığında ara...' :
            'Kullanıcı adı veya isimde ara...'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {activeTab === 'comments' && (
          <select 
            className="input-base admin-select-filter"
            value={selectedFundFilter}
            onChange={(e) => setSelectedFundFilter(e.target.value)}
          >
            <option value="Tümü">Tüm Fonlar</option>
            {funds.map(f => (
              <option key={f.code} value={f.code}>{f.code} - {f.name.substring(0, 20)}...</option>
            ))}
          </select>
        )}
      </div>

      {/* Mobilde Yatay Kaydırma İpucu */}
      <div className="admin-table-scroll-hint">
        <span>↔️ Tabloyu parmağınızla sağa-sola kaydırarak tüm sütunları ve butonları görebilirsiniz.</span>
      </div>

      {/* Tablo İçerikleri */}
      <div className="admin-table-card table-responsive">
        {isLoadingData ? (
          <div className="admin-empty-state">Veriler yükleniyor...</div>
        ) : activeTab === 'comments' ? (
          comments.length > 0 ? (
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Fon</th>
                  <th>Yazar</th>
                  <th>Yorum İçeriği</th>
                  <th>Tarih</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.fund_code ? (
                        <Link to={`/fon/${c.fund_code}`} className="fund-badge badge-blue">
                          {c.fund_code}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.authorDisplay}</div>
                      {c.userStatus === 'banned' && (
                        <span className="user-status-pill status-banned">Askıda</span>
                      )}
                    </td>
                    <td>
                      <div className="comment-cell-text">
                        {c.isReply && <span className="reply-badge-inline">Yanıt</span>}
                        {c.cleanContent}
                      </div>
                    </td>
                    <td>
                      <span title={c.exactDate} className="text-muted" style={{ fontSize: '13px' }}>
                        {c.formattedDate}
                      </span>
                    </td>
                    <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-admin-delete"
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={isProcessing}
                        title="Bu yorumu kalıcı olarak sil"
                      >
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">Kriterlere uygun yorum bulunamadı.</div>
          )
        ) : activeTab === 'discussions' ? (
          discussions.length > 0 ? (
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Fon</th>
                  <th>Başlık</th>
                  <th>Yazar</th>
                  <th>Yorumlar</th>
                  <th>Tarih</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {discussions.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.fund_code ? (
                        <Link to={`/fon/${d.fund_code}`} className="fund-badge badge-blue">
                          {d.fund_code}
                        </Link>
                      ) : (
                        <span className="fund-badge badge-terracotta">GENEL</span>
                      )}
                    </td>
                    <td>
                      <Link to={d.fund_code ? `/fon/${d.fund_code}` : '/forum'} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                        {d.title}
                      </Link>
                    </td>
                    <td>{d.author}</td>
                    <td><b>{d.comments_count || 0}</b></td>
                    <td>
                      <span title={d.exactDate} className="text-muted" style={{ fontSize: '13px' }}>
                        {d.formattedDate}
                      </span>
                    </td>
                    <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-admin-delete"
                        onClick={() => handleDeleteDiscussion(d.id)}
                        disabled={isProcessing}
                        title="Bu tartışmayı ve tüm yorumlarını sil"
                      >
                        🗑️ Konuyu Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">Tartışma konusu bulunamadı.</div>
          )
        ) : (
          users.length > 0 ? (
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Yatırımcı</th>
                  <th>Kullanıcı Adı</th>
                  <th>Yetki Rolü</th>
                  <th>Durum</th>
                  <th>Kayıt Tarihi</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentUser = user?.id === u.id;
                  const isBanned = u.status === 'banned';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-brand-light)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                              {(u.display_name || u.username || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <span style={{ fontWeight: 600 }}>{u.display_name || 'İsimsiz'}</span>
                        </div>
                      </td>
                      <td>@{u.username}</td>
                      <td>
                        {u.role === 'admin' ? (
                          <span className="role-badge-admin">Admin</span>
                        ) : (
                          <span className="text-muted">Kullanıcı</span>
                        )}
                      </td>
                      <td>
                        <span className={`user-status-pill ${isBanned ? 'status-banned' : 'status-active'}`}>
                          {isBanned ? 'Askıda (Banlı)' : 'Aktif'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted" style={{ fontSize: '13px' }}>
                          {new Date(u.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </td>
                      <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                        {isCurrentUser ? (
                          <span className="text-muted" style={{ fontSize: '12px' }}>Siz</span>
                        ) : isBanned ? (
                          <button 
                            className="btn-admin-unban"
                            onClick={() => handleToggleBan(u)}
                            disabled={isProcessing}
                          >
                            ✓ Banı Kaldır
                          </button>
                        ) : (
                          <button 
                            className="btn-admin-ban"
                            onClick={() => handleToggleBan(u)}
                            disabled={isProcessing}
                          >
                            🚫 Banla
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">Kullanıcı bulunamadı.</div>
          )
        )}
      </div>
    </div>
  );
};

export default Admin;
