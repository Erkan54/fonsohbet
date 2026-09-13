-- ===================================================================
-- FONSOНBET SUPABASE VERİTABANI ŞEMASI VE BAŞLANGIÇ VERİLERİ
-- ===================================================================

-- 1. FONLAR TABLOSU
CREATE TABLE IF NOT EXISTS public.funds (
  id TEXT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(16, 6) DEFAULT 0,
  borsa_kapanis NUMERIC(16, 6),
  weekly_return NUMERIC(8, 2) DEFAULT 0,
  monthly_return NUMERIC(8, 2) DEFAULT 0,
  ytd_return NUMERIC(8, 2),
  risk_level INTEGER DEFAULT 1,
  investors INTEGER DEFAULT 0,
  discussion_count INTEGER DEFAULT 0,
  source_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- İndeksler (Arama ve filtreleme hızı için)
CREATE INDEX IF NOT EXISTS idx_funds_category ON public.funds(category);
CREATE INDEX IF NOT EXISTS idx_funds_code ON public.funds(code);

-- 2. TARTIŞMALAR (FORUM) TABLOSU
CREATE TABLE IF NOT EXISTS public.discussions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  fund_code VARCHAR(10) REFERENCES public.funds(code) ON DELETE SET NULL,
  author TEXT NOT NULL DEFAULT 'anonim',
  comments_count INTEGER DEFAULT 0,
  last_activity TEXT DEFAULT 'Şimdi',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. YORUMLAR TABLOSU
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  discussion_id BIGINT REFERENCES public.discussions(id) ON DELETE CASCADE,
  fund_code VARCHAR(10) REFERENCES public.funds(code) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROW LEVEL SECURITY (RLS) - Güvenlik ve Okuma/Yazma İzinleri
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Herkes fonları, tartışmaları ve yorumları okuyabilir:
DROP POLICY IF EXISTS "Public funds are viewable by everyone" ON public.funds;
CREATE POLICY "Public funds are viewable by everyone" ON public.funds FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public discussions are viewable by everyone" ON public.discussions;
CREATE POLICY "Public discussions are viewable by everyone" ON public.discussions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.comments;
CREATE POLICY "Public comments are viewable by everyone" ON public.comments FOR SELECT USING (true);

-- Herkes yorum ve tartışma ekleyebilir:
DROP POLICY IF EXISTS "Anyone can create discussions" ON public.discussions;
CREATE POLICY "Anyone can create discussions" ON public.discussions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
CREATE POLICY "Anyone can insert comments" ON public.comments FOR INSERT WITH CHECK (true);

-- ===================================================================
-- 5. 100 ADET GERÇEK FON VERİSİNİN YÜKLENMESİ
-- ===================================================================
INSERT INTO public.funds (id, code, name, category, price, borsa_kapanis, weekly_return, monthly_return, ytd_return, risk_level, investors, discussion_count, source_url)
VALUES
  ('TP2', 'TP2', 'Tera Portföy Para Piyasası (TL) Fonu', 'Para Piyasası', 2.229489, NULL, 0.9, 4.06, 38.14, 1, 182400, 34, 'https://fonasistani.com/fon/TP2'),
  ('TI1', 'TI1', 'İş Portföy Para Piyasası (TL) Fonu', 'Para Piyasası', 1703.023923, NULL, 0.71, 3.32, 29.64, 1, 421000, 87, 'https://fonasistani.com/fon/TI1'),
  ('GTL', 'GTL', 'Garanti Portföy Birinci Para Piyasası (TL) Fonu', 'Para Piyasası', 0.137571, NULL, 0.71, 3.27, 29.35, 1, 310500, 52, 'https://fonasistani.com/fon/GTL'),
  ('GAL', 'GAL', 'Garanti Portföy İkinci Para Piyasası (TL) Fonu', 'Para Piyasası', 417.977456, NULL, 0.67, 3.19, 28.6, 1, 198700, 29, 'https://fonasistani.com/fon/GAL'),
  ('FI5', 'FI5', 'QNB Portföy Para Piyasası (TL) Fonu', 'Para Piyasası', 758.387213, NULL, 0.71, 3.27, 29.81, 1, 156300, 41, 'https://fonasistani.com/fon/FI5'),
  ('YLB', 'YLB', 'Yapı Kredi Portföy Para Piyasası Fonu', 'Para Piyasası', 1.858115, NULL, 0.71, 3.23, 29.63, 1, 287600, 38, 'https://fonasistani.com/fon/YLB'),
  ('ALE', 'ALE', 'Ak Portföy Para Piyasası (TL) Fonu', 'Para Piyasası', 13.799779, NULL, 0.68, 3.22, 29.62, 1, 345200, 63, 'https://fonasistani.com/fon/ALE'),
  ('TZL', 'TZL', 'Ziraat Portföy Para Piyasası (TL) Fonu', 'Para Piyasası', 0.141116, NULL, 0.7, 3.24, 29.97, 1, 402100, 55, 'https://fonasistani.com/fon/TZL'),
  ('VK6', 'VK6', 'V Portföy Vakıfbank Para Piyasası (TL) Fonu', 'Para Piyasası', 4.244963, NULL, 0.7, 3.29, 30.02, 1, 178900, 22, 'https://fonasistani.com/fon/VK6'),
  ('TKM', 'TKM', 'TEB Portföy Para Piyasası (TL) Fonu', 'Para Piyasası', 0.219865, NULL, 0.68, 3.19, 29.85, 1, 134600, 18, 'https://fonasistani.com/fon/TKM'),
  ('THF', 'THF', 'Tera Portföy Hisse Senedi (TL) Fonu', 'Hisse Senedi', 2.916338, NULL, 4.74, 28.1, 79.28, 6, 67200, 312, 'https://fonasistani.com/fon/THF'),
  ('AFT', 'AFT', 'Ak Portföy Yeni Teknolojiler Yabancı Hisse Senedi Fonu', 'Hisse Senedi', 1.000902, NULL, 3.03, 2.81, 16.83, 6, 124500, 245, 'https://fonasistani.com/fon/AFT'),
  ('YAY', 'YAY', 'Yapı Kredi Portföy Yabancı Teknoloji Sektörü Hisse Senedi Fonu', 'Hisse Senedi', 1871.713648, NULL, 3.23, 2.25, 44.89, 6, 98700, 189, 'https://fonasistani.com/fon/YAY'),
  ('AK3', 'AK3', 'Ak Portföy Hisse Senedi (TL) Fonu', 'Hisse Senedi', 54.429536, NULL, 3.9, 6.44, 33.64, 6, 156800, 178, 'https://fonasistani.com/fon/AK3'),
  ('YAS', 'YAS', 'Yapı Kredi Portföy Koç Holding İştirak ve Hisse Senedi Fonu', 'Hisse Senedi', 15.366682, NULL, 4.1, 7.75, 15.87, 6, 89400, 134, 'https://fonasistani.com/fon/YAS'),
  ('AFA', 'AFA', 'Ak Portföy Amerika Yabancı Hisse Senedi Fonu', 'Hisse Senedi', 1.29163, NULL, -1, 0.31, 27.52, 6, 210300, 267, 'https://fonasistani.com/fon/AFA'),
  ('TMG', 'TMG', 'İş Portföy Yabancı Hisse Senedi Fonu', 'Hisse Senedi', 1.446923, NULL, -1.32, -0.7, 24.84, 6, 78500, 112, 'https://fonasistani.com/fon/TMG'),
  ('KPC', 'KPC', 'Kuveyt Türk Portföy Katılım Hisse Senedi (TL) Fonu', 'Hisse Senedi', 22.117819, NULL, 3.98, 7.31, 47.71, 6, 145600, 198, 'https://fonasistani.com/fon/KPC'),
  ('GUH', 'GUH', 'Garanti Portföy Yabancı Teknoloji Hisse Senedi Fonu', 'Hisse Senedi', 0.460551, NULL, 4.21, 1.3, 45.97, 6, 67800, 156, 'https://fonasistani.com/fon/GUH'),
  ('GSP', 'GSP', 'Azimut PYŞ Kar Payı Ödeyen Hisse Senedi Fonu', 'Hisse Senedi', 0.587267, NULL, 3.51, 3.17, 43.58, 6, 54300, 89, 'https://fonasistani.com/fon/GSP'),
  ('OJK', 'OJK', 'QNB Portföy Altın Fonu', 'Altın', 13.624712, NULL, -0.33, 2.78, 12.61, 4, 234100, 145, 'https://fonasistani.com/fon/OJK'),
  ('YKT', 'YKT', 'Yapı Kredi Portföy Altın Fonu', 'Altın', 0.892774, NULL, -0.61, 2.21, 10.05, 4, 198700, 112, 'https://fonasistani.com/fon/YKT'),
  ('TTA', 'TTA', 'İş Portföy Altın Fonu', 'Altın', 0.625375, NULL, -1.25, 1.26, 1.8, 4, 312400, 234, 'https://fonasistani.com/fon/TTA'),
  ('GTA', 'GTA', 'Garanti Portföy Altın Fonu', 'Altın', 1.617694, NULL, -0.46, 2.54, 10.04, 4, 187600, 98, 'https://fonasistani.com/fon/GTA'),
  ('AFO', 'AFO', 'Ak Portföy Altın Fonu', 'Altın', 1.340945, NULL, -0.53, 2.43, 9.86, 4, 267800, 167, 'https://fonasistani.com/fon/AFO'),
  ('TUA', 'TUA', 'TEB Portföy Altın Fonu', 'Altın', 1.477904, NULL, -0.44, 2.75, 9.79, 4, 98500, 56, 'https://fonasistani.com/fon/TUA'),
  ('DBA', 'DBA', 'Deniz Portföy Altın Fonu', 'Altın', 0.754535, NULL, -0.41, 2.61, 11.91, 4, 76400, 43, 'https://fonasistani.com/fon/DBA'),
  ('HBF', 'HBF', 'HSBC Portföy Altın Fonu', 'Altın', 51.532924, NULL, -0.68, 2.38, 10.46, 4, 112300, 78, 'https://fonasistani.com/fon/HBF'),
  ('FIB', 'FIB', 'Fiba Portföy Altın Fonu', 'Altın', 0.506895, NULL, -0.98, 2.16, 8.19, 4, 34200, 21, 'https://fonasistani.com/fon/FIB'),
  ('GGK', 'GGK', 'Inveo Portföy Altın Fonu', 'Altın', 14.041938, NULL, -0.38, 2.52, 8.7, 4, 28900, 15, 'https://fonasistani.com/fon/GGK'),
  ('FNO', 'FNO', 'QNB Portföy Birinci Değişken Fon', 'Değişken', 0.208149, NULL, 0.69, 3.82, 17.85, 5, 87600, 67, 'https://fonasistani.com/fon/FNO'),
  ('TNI', 'TNI', 'TEB Portföy ING Bank Özel Bankacılık ve Platinum Değişken Özel Fon', 'Değişken', 11.624968, NULL, 0.96, 4.1, 31.94, 5, 45200, 34, 'https://fonasistani.com/fon/TNI'),
  ('IJC', 'IJC', 'İş Portföy Yarı İletken Teknolojileri Değişken Fon', 'Değişken', 15.785568, NULL, 3.54, -5.38, 61.51, 6, 134800, 289, 'https://fonasistani.com/fon/IJC'),
  ('HSA', 'HSA', 'HSBC Portföy Değişken (TL) Fon', 'Değişken', 1662.564165, NULL, 2.3, 3.17, 23.44, 5, 67400, 45, 'https://fonasistani.com/fon/HSA'),
  ('GMA', 'GMA', 'Azimut Portföy Birinci Değişken Fon', 'Değişken', 2.205526, NULL, 1.79, 3.76, 31.6, 5, 54300, 38, 'https://fonasistani.com/fon/GMA'),
  ('SUA', 'SUA', 'Ünlü Portföy Birinci Değişken Fon', 'Değişken', 0.605165, NULL, 0.39, 2.95, 26.11, 5, 23400, 19, 'https://fonasistani.com/fon/SUA'),
  ('TE4', 'TE4', 'TEB Portföy Birinci Değişken Fon', 'Değişken', 6.708927, NULL, 0.91, 3.82, 30.55, 5, 41200, 28, 'https://fonasistani.com/fon/TE4'),
  ('GBV', 'GBV', 'Garanti Portföy Blockchain Teknolojileri Değişken Fon', 'Değişken', 13.465991, NULL, 3.06, 3.18, 40.48, 6, 98700, 213, 'https://fonasistani.com/fon/GBV'),
  ('YIT', 'YIT', 'Garanti Portföy Yarı İletken Teknolojileri Değişken Fon', 'Değişken', 2.675241, NULL, 5.86, -1.36, 66.34, 6, 112500, 278, 'https://fonasistani.com/fon/YIT'),
  ('HOA', 'HOA', 'HSBC Portföy Teknoloji Değişken Fon', 'Değişken', 0.247441, NULL, 2.46, 0.56, 30.85, 5, 56700, 67, 'https://fonasistani.com/fon/HOA'),
  ('TZV', 'TZV', 'Ziraat Portföy Kısa Vadeli Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 968.58394, NULL, 0.67, 3.24, 28.54, 2, 356700, 42, 'https://fonasistani.com/fon/TZV'),
  ('TIV', 'TIV', 'İş Portföy Kısa Vadeli Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 54.197427, NULL, 0.72, 3.43, 27.48, 2, 289400, 56, 'https://fonasistani.com/fon/TIV'),
  ('TSI', 'TSI', 'İş Portföy Maksimum Hesap Kısa Vadeli Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 0.21165, NULL, 0.68, 3.37, 28.01, 2, 198200, 31, 'https://fonasistani.com/fon/TSI'),
  ('TGT', 'TGT', 'Garanti Portföy Kısa Vadeli Borçlanma Araçları Fonu', 'Borçlanma Araçları', 0.122543, NULL, 0.69, 3.47, 27.79, 2, 234500, 38, 'https://fonasistani.com/fon/TGT'),
  ('VKT', 'VKT', 'V Portföy Vakıfbank Kısa Vadeli Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 0.124444, NULL, 0.64, 3.31, 28.73, 2, 145600, 22, 'https://fonasistani.com/fon/VKT'),
  ('YBE', 'YBE', 'Yapı Kredi Portföy Eurobond (Dolar) Borçlanma Araçları Fonu', 'Borçlanma Araçları', 1.857065, NULL, -0.32, 1.05, 14.64, 3, 87300, 67, 'https://fonasistani.com/fon/YBE'),
  ('GUB', 'GUB', 'Garanti Portföy Özel Sektör Borçlanma Araçları Fonu', 'Borçlanma Araçları', 2.621818, NULL, 0.69, 3.23, 29.82, 2, 112400, 28, 'https://fonasistani.com/fon/GUB'),
  ('AVT', 'AVT', 'Ak Portföy Kısa Vadeli Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 231.51825, NULL, 0.69, 3.32, 29.25, 2, 267800, 45, 'https://fonasistani.com/fon/AVT'),
  ('HKV', 'HKV', 'Ziraat Portföy Halkbank Kısa Vadeli Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 603.798379, NULL, 0.7, 3.27, 28.85, 2, 198300, 34, 'https://fonasistani.com/fon/HKV'),
  ('TRJ', 'TRJ', 'Tera Portföy Birinci Borçlanma Araçları (TL) Fonu', 'Borçlanma Araçları', 2.223444, NULL, 0.91, 4.02, 39.71, 2, 78900, 52, 'https://fonasistani.com/fon/TRJ'),
  ('TPC', 'TPC', 'TEB Portföy Kıymetli Madenler Fon Sepeti Fonu', 'Fon Sepeti', 13.257372, NULL, -1.79, 1.63, 5.87, 4, 67800, 56, 'https://fonasistani.com/fon/TPC'),
  ('YPV', 'YPV', 'Yapı Kredi Portföy Üçüncü Fon Sepeti Fonu', 'Fon Sepeti', 8.040081, NULL, 1.95, 4.66, 20.11, 4, 54300, 34, 'https://fonasistani.com/fon/YPV'),
  ('YAC', 'YAC', 'Yapı Kredi Portföy İkinci Fon Sepeti Fonu', 'Fon Sepeti', 14.934257, NULL, 1.48, 3.87, 19.93, 4, 78900, 45, 'https://fonasistani.com/fon/YAC'),
  ('OJT', 'OJT', 'QNB Portföy Teknoloji Fon Sepeti Fonu', 'Fon Sepeti', 12.986709, NULL, 1.4, 0.54, 41.27, 5, 89400, 123, 'https://fonasistani.com/fon/OJT'),
  ('ARL', 'ARL', 'Ak Portföy Birinci Fon Sepeti Fonu', 'Fon Sepeti', 16.188423, NULL, 0.36, 1.28, 21.41, 3, 112500, 67, 'https://fonasistani.com/fon/ARL'),
  ('GZP', 'GZP', 'Garanti Portföy Birinci Fon Sepeti Fonu', 'Fon Sepeti', 7.816732, NULL, 1.1, 2.56, 24.33, 4, 67800, 38, 'https://fonasistani.com/fon/GZP'),
  ('ZPC', 'ZPC', 'Ziraat Portföy Fon Sepeti Fonu', 'Fon Sepeti', 19.998471, NULL, 2.53, 5.3, 18.33, 4, 134200, 56, 'https://fonasistani.com/fon/ZPC'),
  ('TCF', 'TCF', 'TEB Portföy Üçüncü Fon Sepeti Fonu', 'Fon Sepeti', 4.645263, NULL, 0.82, 3.42, 29.32, 3, 45600, 22, 'https://fonasistani.com/fon/TCF'),
  ('OTJ', 'OTJ', 'Oyak Portföy Kıymetli Madenler Katılım Fon Sepeti Fonu', 'Fon Sepeti', 7.208872, NULL, -2.24, 1.6, 3.63, 4, 56700, 34, 'https://fonasistani.com/fon/OTJ'),
  ('TGE', 'TGE', 'İş Portföy Emtia Yabancı BYF Fon Sepeti Fonu', 'Fon Sepeti', 0.308652, NULL, 1.74, 7.47, 42.14, 5, 78400, 89, 'https://fonasistani.com/fon/TGE'),
  ('KLU', 'KLU', 'Kuveyt Türk Portföy Para Piyasası Katılım (TL) Fonu', 'Katılım', 4.941755, NULL, 0.7, 3.2, 29.05, 1, 189400, 45, 'https://fonasistani.com/fon/KLU'),
  ('KHP', 'KHP', 'Kuveyt Türk Portföy Paylaşımlı Hesap Para Piyasası Katılım Fonu', 'Katılım', 1.234382, NULL, 1, 4.5, NULL, 1, 67800, 23, 'https://fonasistani.com/fon/KHP'),
  ('EP1', 'EP1', 'Emlak Katılım Portföy Para Piyasası Katılım (TL) Fonu', 'Katılım', 1.091098, NULL, 0.71, 3.22, NULL, 1, 45600, 12, 'https://fonasistani.com/fon/EP1'),
  ('AIS', 'AIS', 'Ak Portföy Para Piyasası Katılım Fonu', 'Katılım', 0.109806, NULL, 0.71, 3.31, 30.29, 1, 234500, 56, 'https://fonasistani.com/fon/AIS'),
  ('VPA', 'VPA', 'Vakıf Katılım Portföy Para Piyasası Katılım Fonu', 'Katılım', 1.134104, NULL, 0.69, 3.22, NULL, 1, 78900, 18, 'https://fonasistani.com/fon/VPA'),
  ('KUT', 'KUT', 'Kuveyt Türk Portföy Kıymetli Madenler Katılım Fonu', 'Katılım', 12.33733, NULL, -0.24, 3.96, 8.66, 4, 112300, 87, 'https://fonasistani.com/fon/KUT'),
  ('PPK', 'PPK', 'QNB Portföy Para Piyasası Katılım (TL) Fonu', 'Katılım', 2.299768, NULL, 0.7, 3.28, 29.72, 1, 98700, 34, 'https://fonasistani.com/fon/PPK'),
  ('HPH', 'HPH', 'Hedef Portföy Para Piyasası Katılım Fonu', 'Katılım', 2.423067, NULL, 0.69, 2.98, 28.95, 1, 34500, 15, 'https://fonasistani.com/fon/HPH'),
  ('KPI', 'KPI', 'İş Portföy Para Piyasası Katılım (TL) Fonu', 'Katılım', 1.50348, NULL, 0.7, 3.22, 29.42, 1, 156700, 42, 'https://fonasistani.com/fon/KPI'),
  ('GPN', 'GPN', 'Garanti Portföy Para Piyasası Katılım (TL) Fonu', 'Katılım', 1.421222, NULL, 0.7, 3.29, 29.78, 1, 134500, 38, 'https://fonasistani.com/fon/GPN'),
  ('IPJ', 'IPJ', 'İş Portföy Elektrikli Araçlar Karma Fon', 'Karma', 19.813969, NULL, 0.67, -1.79, 29.43, 5, 89400, 134, 'https://fonasistani.com/fon/IPJ'),
  ('YAK', 'YAK', 'Yapı Kredi Portföy Karma Fon', 'Karma', 5.285327, NULL, 1.35, 4.28, 23.67, 4, 67800, 56, 'https://fonasistani.com/fon/YAK'),
  ('ITP', 'ITP', 'İş Portföy Teknoloji Karma Fon', 'Karma', 13.252158, NULL, 0.35, 1.4, 34.76, 5, 112500, 167, 'https://fonasistani.com/fon/ITP'),
  ('IKP', 'IKP', 'İş Portföy Yenilenebilir Enerji Karma Fon', 'Karma', 9.281377, NULL, 2.04, 0.41, 34.35, 5, 78900, 112, 'https://fonasistani.com/fon/IKP'),
  ('IJP', 'IJP', 'İş Portföy Blockchain Teknolojileri Karma Fon', 'Karma', 9.330812, NULL, 1.34, 2.34, 34.83, 5, 98700, 198, 'https://fonasistani.com/fon/IJP'),
  ('IKL', 'IKL', 'İş Portföy Sağlık Şirketleri Karma Fon', 'Karma', 9.961695, NULL, -2, 0.89, 17.21, 5, 45600, 67, 'https://fonasistani.com/fon/IKL'),
  ('IJB', 'IJB', 'İş Portföy Dijital Oyun Sektörü Karma Fon', 'Karma', 6.646589, NULL, -0.04, 0.86, 12.66, 5, 56700, 89, 'https://fonasistani.com/fon/IJB'),
  ('KRR', 'KRR', 'İş Portföy Karma Fon', 'Karma', 1.185243, NULL, 3.26, 5.73, NULL, 4, 34500, 23, 'https://fonasistani.com/fon/KRR'),
  ('KTV', 'KTV', 'Kuveyt Türk Portföy Kısa Vadeli Kira Sertifikaları Katılım (TL) Fonu', 'Kısa Vadeli Kira Sertifikası', 7.851583, NULL, 0.66, 3.15, 27.39, 2, 189400, 34, 'https://fonasistani.com/fon/KTV'),
  ('ZPK', 'ZPK', 'Ziraat Portföy Kısa Vadeli Kira Sertifikası Katılım (TL) Fonu', 'Kısa Vadeli Kira Sertifikası', 8.588669, NULL, 0.69, 3.22, 28.02, 2, 167800, 28, 'https://fonasistani.com/fon/ZPK'),
  ('HPV', 'HPV', 'Ziraat Portföy Halkbank Kısa Vadeli Kira Sertifikaları Katılım (TL) Fonu', 'Kısa Vadeli Kira Sertifikası', 7.942426, NULL, 0.69, 3.22, 28.04, 2, 134500, 22, 'https://fonasistani.com/fon/HPV'),
  ('RBV', 'RBV', 'Albaraka Portföy Kısa Vadeli Kira Sertifikaları Katılım (TL) Fonu', 'Kısa Vadeli Kira Sertifikası', 7.058914, NULL, 0.69, 3.23, 28.1, 2, 87600, 18, 'https://fonasistani.com/fon/RBV'),
  ('VFK', 'VFK', 'Ziraat Portföy İkinci Kısa Vadeli Kira Sertifikaları Katılım (TL) Fonu', 'Kısa Vadeli Kira Sertifikası', 5.58388, NULL, 0.69, 3.24, 28.09, 2, 98700, 15, 'https://fonasistani.com/fon/VFK'),
  ('VTL', 'VTL', 'V Portföy Kısa Vadeli Kira Sertifikaları Katılım (TL) Fonu', 'Kısa Vadeli Kira Sertifikası', 1.131849, NULL, 0.7, 3.23, NULL, 2, 45600, 8, 'https://fonasistani.com/fon/VTL'),
  ('GTZ', 'GTZ', 'Garanti Portföy Gümüş Fon Sepeti Fonu', 'Gümüş', 11.803172, NULL, -2.09, 2.52, -3.28, 5, 45600, 67, 'https://fonasistani.com/fon/GTZ'),
  ('YZG', 'YZG', 'Yapı Kredi Portföy Gümüş Fon Sepeti Fonu', 'Gümüş', 13.187009, NULL, -1.88, 2.76, -1.6, 5, 34500, 45, 'https://fonasistani.com/fon/YZG'),
  ('GUM', 'GUM', 'Ak Portföy Gümüş Fon Sepeti Fonu', 'Gümüş', 12.681348, NULL, -1.72, 3.29, -1.35, 5, 56700, 56, 'https://fonasistani.com/fon/GUM'),
  ('GMC', 'GMC', 'TEB Portföy Gümüş Fon Sepeti Fonu', 'Gümüş', 7.820826, NULL, -2.73, 2.04, -4.78, 5, 23400, 34, 'https://fonasistani.com/fon/GMC'),
  ('DMG', 'DMG', 'Deniz Portföy Gümüş Fon Sepeti Fonu', 'Gümüş', 6.910948, NULL, -1.42, 3.2, 0.13, 5, 18700, 23, 'https://fonasistani.com/fon/DMG'),
  ('KGM', 'KGM', 'Kuveyt Türk Portföy Gümüş Katılım Fon Sepeti Fonu', 'Gümüş', 2.989685, NULL, -1.45, 3.4, -0.11, 5, 28900, 19, 'https://fonasistani.com/fon/KGM'),
  ('FGS', 'FGS', 'QNB Portföy Gümüş Katılım Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 618.432436, 613.25, -3.27, 2.76, -4.59, 5, 34500, 45, 'https://fonasistani.com/fon/FGS'),
  ('ZBP', 'ZBP', 'Ziraat Portföy BIST Likit Banka Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 199.574868, 202.3, 2.74, 11.98, 4.71, 6, 78900, 89, 'https://fonasistani.com/fon/ZBP'),
  ('ZBB', 'ZBB', 'Ziraat Portföy BIST 30 Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 224.170758, 223.8, 4.75, 7.47, 35.88, 6, 112500, 156, 'https://fonasistani.com/fon/ZBB'),
  ('ZKP', 'ZKP', 'Ziraat Portföy BIST Katılım 30 Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 277.898023, 282, 5.5, 6.9, 52.43, 6, 134200, 178, 'https://fonasistani.com/fon/ZKP'),
  ('ZTR', 'ZTR', 'Ziraat Portföy BIST TLREF Endeksi (TL) Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 1394.732538, 1399, 0.68, 3.4, 30.32, 2, 198300, 67, 'https://fonasistani.com/fon/ZTR'),
  ('BLH', 'BLH', 'Ak Portföy BIST Likit Banka Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 46.986633, 46.8, 1.69, 10.12, 3.08, 6, 67800, 56, 'https://fonasistani.com/fon/BLH'),
  ('ZKE', 'ZKE', 'Ziraat Portföy BIST Katılım 30 Eşit Ağırlıklı Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 180.236628, 181.65, 3.27, -0.76, 48.71, 6, 56700, 89, 'https://fonasistani.com/fon/ZKE'),
  ('BOE', 'BOE', 'Ak Portföy BIST 30 Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 41.194072, 41.17, 4.97, 8.57, 34.72, 6, 89400, 112, 'https://fonasistani.com/fon/BOE'),
  ('ZPP', 'ZPP', 'Ziraat Portföy BIST Banka Dışı Likit 10 Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 282.755338, 282, 4.06, 9.01, 55.03, 6, 98700, 134, 'https://fonasistani.com/fon/ZPP'),
  ('BND', 'BND', 'Ak Portföy BIST Banka Dışı Likit 10 Endeksi Hisse Senedi Yoğun Borsa Yatırım Fonu', 'Borsa Yatırım Fonu', 41.299083, 41.4, 5.37, 9.52, 52.54, 6, 78400, 98, 'https://fonasistani.com/fon/BND')
ON CONFLICT (code) DO UPDATE SET
  price = EXCLUDED.price,
  borsa_kapanis = EXCLUDED.borsa_kapanis,
  weekly_return = EXCLUDED.weekly_return,
  monthly_return = EXCLUDED.monthly_return,
  ytd_return = EXCLUDED.ytd_return,
  risk_level = EXCLUDED.risk_level,
  investors = EXCLUDED.investors,
  discussion_count = EXCLUDED.discussion_count,
  updated_at = timezone('utc'::text, now());

-- ===================================================================
-- 6. BAŞLANGIÇ TARTIŞMA VERİLERİ
-- ===================================================================
INSERT INTO public.discussions (id, title, fund_code, author, comments_count, last_activity)
VALUES
  (1, 'THF bu ay %28 getiri vermiş, sürdürülebilir mi sizce?', 'THF', 'borsa_kurdu', 142, '5 dk önce'),
  (2, 'YIT yarı iletken fonu YBB %66 — çip sektörü balonlaşıyor mu?', 'YIT', 'silikon_vadisi', 98, '12 dk önce'),
  (3, 'IJC Nvidia düşüşünden nasıl etkilenecek?', 'IJC', 'tekno_foncu', 87, '23 dk önce'),
  (4, 'TTA altın fonu neden YBB sadece %1.8 kaldı?', 'TTA', 'altinsever42', 76, '34 dk önce'),
  (5, 'AFT yeni teknolojiler fonu Nasdaq rallisini kaçırıyor', 'AFT', 'foncu_mehmet', 63, '1 saat önce'),
  (6, 'TP2 para piyasası fonunda %38 YBB — mevduattan iyi mi?', 'TP2', 'nakit_kral', 124, '1 saat önce'),
  (7, 'GBV blockchain fonu uzun vadede portföye eklenmeli mi?', 'GBV', 'kripto_hakim', 89, '2 saat önce'),
  (8, 'KPC katılım hisse fonu konvansiyonel muadillerini geçmiş', 'KPC', 'katilim_yatirimci', 56, '2 saat önce'),
  (9, 'ZKP BIST Katılım 30 BYF — %52 YBB ile zirvede', 'ZKP', 'endeks_takipci', 78, '3 saat önce'),
  (10, 'AFA Amerika hisse fonu dolar bazlı mı TL bazlı mı bakmalıyız?', 'AFA', 'dolar_analiz', 91, '3 saat önce'),
  (11, 'Gümüş fonları (GTZ, YZG) neden ekside? Altından farkı ne?', 'GTZ', 'madenler_gurusu', 67, '4 saat önce'),
  (12, 'IPJ elektrikli araç fonu son 1 ayda negatife döndü', 'IPJ', 'ev_yatirimcisi', 45, '5 saat önce'),
  (13, 'YAY Yapı Kredi Teknoloji fonu ile GUH karşılaştırması', 'YAY', 'fon_karsilastir', 112, '5 saat önce'),
  (14, 'TZV Ziraat borçlanma fonu — düşük riskli liman mı?', 'TZV', 'guvenli_liman', 34, '6 saat önce'),
  (15, 'ZPP Banka Dışı Likit 10 BYF — YBB %55 ama risk çok yüksek', 'ZPP', 'risk_olcer', 56, '7 saat önce'),
  (16, 'ITP İş Portföy Teknoloji Karma Fon uzun vade stratejisi', 'ITP', 'uzun_vade_emre', 43, '8 saat önce'),
  (17, 'Para piyasası fonlarında TP2 mi TI1 mi? Hangisi daha güvenli?', 'TI1', 'faiz_takipci', 156, '9 saat önce'),
  (18, 'OJK altın fonu mu AFO mu? QNB vs Ak Portföy karşılaştırması', 'OJK', 'altin_kartal', 78, '10 saat önce'),
  (19, 'GSP kar payı ödeyen hisse fonu — temettü stratejisi tartışması', 'GSP', 'temettu_avcisi', 67, '11 saat önce'),
  (20, 'TGE emtia fon sepeti %42 YBB — emtia süper döngüsü mü?', 'TGE', 'emtia_analiz', 89, '12 saat önce')
ON CONFLICT (id) DO NOTHING;

-- Sequence güncellemesi (id cakismasin diye)
SELECT setval(pg_get_serial_sequence('public.discussions', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM public.discussions;
