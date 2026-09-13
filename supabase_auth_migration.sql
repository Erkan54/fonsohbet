-- ===================================================================
-- FONSOHBET AUTH MIGRATION
-- Profiles tablosu, trigger, user_id sütunları ve RLS güncellemesi
-- ===================================================================

-- 1. PROFILES TABLOSU
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles için indeks
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. OTOMATİK PROFİL OLUŞTURMA TRİGGER FONKSİYONU
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_username TEXT;
  base_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Google metadata'dan isim al
  base_username := LOWER(COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  ));
  
  -- Türkçe karakter temizleme
  base_username := REPLACE(base_username, 'ı', 'i');
  base_username := REPLACE(base_username, 'ğ', 'g');
  base_username := REPLACE(base_username, 'ü', 'u');
  base_username := REPLACE(base_username, 'ş', 's');
  base_username := REPLACE(base_username, 'ö', 'o');
  base_username := REPLACE(base_username, 'ç', 'c');
  base_username := REPLACE(base_username, 'İ', 'i');
  base_username := REPLACE(base_username, 'Ğ', 'g');
  base_username := REPLACE(base_username, 'Ü', 'u');
  base_username := REPLACE(base_username, 'Ş', 's');
  base_username := REPLACE(base_username, 'Ö', 'o');
  base_username := REPLACE(base_username, 'Ç', 'c');
  
  -- Boşlukları kaldır, sadece alfanumerik karakterler bırak
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '', 'g');
  
  -- Eğer boşsa fallback
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'yatirimci';
  END IF;
  
  -- Benzersiz username oluştur
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Yatırımcı'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
  );
  RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. DISCUSSIONS ve COMMENTS TABLOLARINA user_id EKLEME
ALTER TABLE public.discussions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);


-- 4. RLS POLİTİKALARINI GÜNCELLE

-- Eski INSERT politikalarını kaldır (herkes yazabiliyordu)
DROP POLICY IF EXISTS "Anyone can create discussions" ON public.discussions;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;

-- Yeni: Sadece giriş yapmış kullanıcılar yazabilir
CREATE POLICY "Authenticated users can create discussions" ON public.discussions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Kullanıcılar sadece kendi tartışma/yorumlarını silebilir
DROP POLICY IF EXISTS "Users can delete own discussions" ON public.discussions;
CREATE POLICY "Users can delete own discussions" ON public.discussions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi tartışma/yorumlarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update own discussions" ON public.discussions;
CREATE POLICY "Users can update own discussions" ON public.discussions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);
