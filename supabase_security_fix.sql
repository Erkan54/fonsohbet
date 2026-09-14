-- ===================================================================
-- FONSOHBET - KRİTİK GÜVENLİK VE RLS YAMASI
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp RUN ediniz.
-- ===================================================================

-- 1. FUND_PRICES & SYNC_RUNS ANONİM YAZMA/SİLME AÇIĞININ KAPATILMASI
-- Eski tehlikeli "Anyone can insert/modify" (FOR ALL USING true) politikalarını kaldır
DROP POLICY IF EXISTS "Anyone can insert fund prices" ON public.fund_prices;
DROP POLICY IF EXISTS "Anyone can modify sync runs" ON public.fund_sync_runs;

-- Sadece SELECT herkese açık olsun:
DROP POLICY IF EXISTS "Public fund prices are viewable by everyone" ON public.fund_prices;
CREATE POLICY "Public fund prices are viewable by everyone" ON public.fund_prices 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public sync runs are viewable by everyone" ON public.fund_sync_runs;
CREATE POLICY "Public sync runs are viewable by everyone" ON public.fund_sync_runs 
  FOR SELECT USING (true);

-- NOT: INSERT, UPDATE, DELETE için anon politikası eklenmemiştir.
-- Sadece Python senkronizasyon script'i (SUPABASE_SERVICE_ROLE_KEY kullanarak) 
-- RLS'i bypass edip güvenle veri yazabilir.


-- 2. DISCUSSIONS VE COMMENTS TABLOLARINDA BAŞKASININ ADINA YAZMA AÇIĞININ KAPATILMASI
DROP POLICY IF EXISTS "Authenticated users can create discussions" ON public.discussions;
CREATE POLICY "Authenticated users can create discussions" ON public.discussions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);


-- 3. PROFILES TABLOSU YETKİ YÜKSELTME (ROLE = ADMIN) AÇIĞININ KAPATILMASI
-- Kullanıcıların kendi rollerini 'admin' yapmasını engelleyen trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eğer giriş yapmış normal kullanıcı kendi role veya status alanını değiştirmeye çalışırsa engelle
  IF auth.uid() IS NOT NULL AND (auth.uid() = OLD.id) THEN
    IF NEW.role <> OLD.role OR NEW.status <> OLD.status THEN
      RAISE EXCEPTION 'Yetkisiz rol veya statü değişikliği talebi engellendi.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();


-- 4. GÜVENLİ YORUM BEĞENME (RPC FUNCTION)
-- Yorum beğenen kullanıcılar başkasının yorum satırını doğrudan update edemez (RLS engeller).
-- Bunun yerine güvenli bir RPC fonksiyonu tanımlanır:
CREATE OR REPLACE FUNCTION public.increment_comment_likes(p_comment_id BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_new_likes INTEGER;
BEGIN
  UPDATE public.comments
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_comment_id
  RETURNING likes_count INTO v_new_likes;
  
  RETURN v_new_likes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_comment_likes(BIGINT) TO anon, authenticated;


-- 5. FON TARTIŞMA SAYISI ARTIRMA (RPC FUNCTION)
CREATE OR REPLACE FUNCTION public.increment_fund_discussions(p_fund_code VARCHAR(10))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.funds
  SET discussion_count = COALESCE(discussion_count, 0) + 1
  WHERE code = p_fund_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_fund_discussions(VARCHAR) TO anon, authenticated;


-- ===================================================================
-- 6. SPAM, BOT VE RATE LIMITING KORUMASI (GÜNLÜK & ANLIK LİMİTLER)
-- ===================================================================

-- Kullanıcının banlı olup olmadığını, ardışık spam hızını ve günlük limitini denetleyen trigger
CREATE OR REPLACE FUNCTION public.check_user_rate_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_status TEXT;
  v_recent_comment_count INTEGER;
  v_daily_comment_count INTEGER;
  v_recent_discussion_count INTEGER;
  v_daily_discussion_count INTEGER;
BEGIN
  -- 1. Kullanıcı banlı mı kontrol et
  SELECT status INTO v_user_status FROM public.profiles WHERE id = NEW.user_id;
  IF v_user_status = 'banned' THEN
    RAISE EXCEPTION 'Hesabınız askıya alınmıştır. İçerik oluşturamazsınız.';
  END IF;

  -- 2. YORUMLAR (COMMENTS) İÇİN KONTROLLER
  IF TG_TABLE_NAME = 'comments' THEN
    -- Karakter uzunluğu kontrolü (boş veya aşırı uzun flood engeli)
    IF LENGTH(TRIM(NEW.content)) < 2 THEN
      RAISE EXCEPTION 'Yorumunuz çok kısa.';
    END IF;
    IF LENGTH(NEW.content) > 1500 THEN
      RAISE EXCEPTION 'Yorumunuz çok uzun (Maksimum 1500 karakter).';
    END IF;

    -- Cooldown: Son 5 saniye içinde aynı kullanıcı yorum atmış mı? (Bot script döngülerini engeller)
    SELECT COUNT(*) INTO v_recent_comment_count
    FROM public.comments
    WHERE user_id = NEW.user_id
      AND created_at > (now() - INTERVAL '30 seconds');

    IF v_recent_comment_count > 0 THEN
      RAISE EXCEPTION 'Çok hızlı yorum yapıyorsunuz. Lütfen en az 30 saniye bekleyin.';
    END IF;

    -- Günlük Limit: Bir kullanıcının 24 saat içinde yapabileceği maksimum yorum sayısı (Örn: 50)
    SELECT COUNT(*) INTO v_daily_comment_count
    FROM public.comments
    WHERE user_id = NEW.user_id
      AND created_at > (now() - INTERVAL '24 hours');

    IF v_daily_comment_count >= 50 THEN
      RAISE EXCEPTION 'Günlük yorum sınırına ulaştınız (Günde maksimum 50 yorum). Lütfen yarın tekrar deneyin.';
    END IF;
  END IF;

  -- 3. TARTIŞMALAR (DISCUSSIONS) İÇİN KONTROLLER
  IF TG_TABLE_NAME = 'discussions' THEN
    -- Başlık karakter uzunluğu
    IF LENGTH(TRIM(NEW.title)) < 5 THEN
      RAISE EXCEPTION 'Tartışma başlığı en az 5 karakter olmalıdır.';
    END IF;
    IF LENGTH(NEW.title) > 150 THEN
      RAISE EXCEPTION 'Tartışma başlığı en fazla 150 karakter olabilir.';
    END IF;

    -- Cooldown: Son 30 saniye içinde yeni konu açılmış mı?
    SELECT COUNT(*) INTO v_recent_discussion_count
    FROM public.discussions
    WHERE user_id = NEW.user_id
      AND created_at > (now() - INTERVAL '30 seconds');

    IF v_recent_discussion_count > 0 THEN
      RAISE EXCEPTION 'Çok hızlı konu açıyorsunuz. Lütfen 30 saniye bekleyin.';
    END IF;

    -- Günlük Limit: Bir kullanıcının 24 saat içinde açabileceği maksimum tartışma sayısı (Örn: 10)
    SELECT COUNT(*) INTO v_daily_discussion_count
    FROM public.discussions
    WHERE user_id = NEW.user_id
      AND created_at > (now() - INTERVAL '24 hours');

    IF v_daily_discussion_count >= 10 THEN
      RAISE EXCEPTION 'Günlük yeni konu açma sınırına ulaştınız (Günde maksimum 10 tartışma).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_comment_rate_limit ON public.comments;
CREATE TRIGGER trg_check_comment_rate_limit
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.check_user_rate_limits();

DROP TRIGGER IF EXISTS trg_check_discussion_rate_limit ON public.discussions;
CREATE TRIGGER trg_check_discussion_rate_limit
  BEFORE INSERT ON public.discussions
  FOR EACH ROW EXECUTE FUNCTION public.check_user_rate_limits();


-- ===================================================================
-- 7. ADMİN VE MODERATÖR YETKİLERİ (YORUM/TARTIŞMA SİLME & BANLAMA)
-- ===================================================================

-- Yardımcı fonksiyon: Mevcut kullanıcının admin olup olmadığını kontrol eder
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 1. Adminler herhangi bir tartışmayı silebilir
DROP POLICY IF EXISTS "Admins can delete any discussion" ON public.discussions;
CREATE POLICY "Admins can delete any discussion" ON public.discussions
  FOR DELETE USING (public.is_admin());

-- 2. Adminler herhangi bir yorumu silebilir
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
CREATE POLICY "Admins can delete any comment" ON public.comments
  FOR DELETE USING (public.is_admin());

-- 3. Adminler kullanıcı profil durumunu (ban/aktif) güncelleyebilir
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- 4. Admin RPC: Tek tıkla yorum silme (İlgili fonun sayacını otomatik düşürür)
CREATE OR REPLACE FUNCTION public.admin_delete_comment(p_comment_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_fund_code VARCHAR(10);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem: Sadece yöneticiler yorum silebilir.';
  END IF;

  SELECT fund_code INTO v_fund_code FROM public.comments WHERE id = p_comment_id;

  DELETE FROM public.comments WHERE id = p_comment_id;

  IF v_fund_code IS NOT NULL THEN
    UPDATE public.funds 
    SET discussion_count = GREATEST(0, COALESCE(discussion_count, 1) - 1)
    WHERE code = v_fund_code;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_comment(BIGINT) TO authenticated;

-- 5. Admin RPC: Tek tıkla tartışma silme
CREATE OR REPLACE FUNCTION public.admin_delete_discussion(p_discussion_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem: Sadece yöneticiler tartışma silebilir.';
  END IF;

  DELETE FROM public.discussions WHERE id = p_discussion_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_discussion(BIGINT) TO authenticated;


-- ===================================================================
-- 8. AHMET NURULLAH ERKAN (ahmetnurullaherkan@gmail.com) HESABINA DOĞRUDAN ADMİN TANIMI
-- ===================================================================

-- 1. Eğer hesap zaten giriş yapmışsa, e-posta adresi üzerinden profili anında admin yap:
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE LOWER(email) = 'ahmetnurullaherkan@gmail.com'
);

-- 2. Yeni kullanıcı trigger'ını güncelle: 
-- ahmetnurullaherkan@gmail.com ile her giriş yapıldığında veya hesap yeni açıldığında otomatik admin rolü verilsin:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_username TEXT;
  base_username TEXT;
  counter INTEGER := 0;
  assigned_role TEXT := 'user';
BEGIN
  -- Eğer gelen e-posta ana yöneticiye aitse doğrudan admin yetkisi ata:
  IF LOWER(NEW.email) = 'ahmetnurullaherkan@gmail.com' THEN
    assigned_role := 'admin';
  END IF;

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
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '', 'g');
  
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'yatirimci';
  END IF;
  
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Yatırımcı'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET role = assigned_role;

  RETURN NEW;
END;
$$;

