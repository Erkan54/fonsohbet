import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Eğer henüz .env dosyasına anahtarlar girilmediyse null döner, uygulama çökmez
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'BURAYA_SUPABASE_PROJECT_URL_YAPISTIRIN' &&
  !supabaseUrl.includes('BURAYA_')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log('%c🟢 [Fonsohbet] Canlı Supabase Veritabanına Bağlanıldı!', 'color: #10B981; font-weight: bold; font-size: 14px;');
  } else {
    console.warn('%c🟡 [Fonsohbet] Supabase ortam değişkenleri (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) tanımlı değil, mock veriler kullanılıyor.', 'color: #F59E0B; font-weight: bold;');
  }
}
