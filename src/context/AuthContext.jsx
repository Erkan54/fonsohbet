import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser, fetchProfile } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profil bilgisini yükle
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const profileData = await fetchProfile(userId);
    setProfile(profileData);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Aktif oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Google ile giriş yap
  const loginWithGoogle = async () => {
    return await signInWithGoogle();
  };

  // Çıkış yap
  const logout = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Kullanıcı giriş yapmış mı?
  const isAuthenticated = Boolean(user && session);

  // Kullanıcı yönetici (admin / moderatör) mi?
  const isAdmin = Boolean(profile && profile.role === 'admin');

  // Profil bilgilerini yenile
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      isAuthenticated,
      isAdmin,
      loginWithGoogle, 
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
