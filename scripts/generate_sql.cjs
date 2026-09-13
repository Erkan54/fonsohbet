const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/mockData.js'), 'utf8');

// Match funds
const fundsMatch = content.match(/export const funds = (\[[\s\S]*?\]);/);
const discussionsMatch = content.match(/export const discussions = (\[[\s\S]*?\]);/);

let funds = [];
let discussions = [];
eval('funds = ' + fundsMatch[1]);
eval('discussions = ' + discussionsMatch[1]);

let sql = `-- ===================================================================
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
`;

const fundRows = funds.map(f => {
  const bk = f.borsaKapanis !== undefined ? f.borsaKapanis : 'NULL';
  const ytd = f.returns.ytd !== null && f.returns.ytd !== undefined ? f.returns.ytd : 'NULL';
  const nameSafe = f.name.replace(/'/g, "''");
  const catSafe = f.category.replace(/'/g, "''");
  return `  ('${f.id}', '${f.code}', '${nameSafe}', '${catSafe}', ${f.price}, ${bk}, ${f.returns.weekly}, ${f.returns.monthly}, ${ytd}, ${f.risk}, ${f.investors}, ${f.discussionCount}, '${f.sourceUrl}')`;
});

sql += fundRows.join(',\n') + '\n';
sql += `ON CONFLICT (code) DO UPDATE SET
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
`;

const discRows = discussions.map(d => {
  const titleSafe = d.title.replace(/'/g, "''");
  return `  (${d.id}, '${titleSafe}', '${d.fundCode}', '${d.author}', ${d.commentsCount}, '${d.lastActivity}')`;
});

sql += discRows.join(',\n') + '\n';
sql += `ON CONFLICT (id) DO NOTHING;

-- Sequence güncellemesi (id cakismasin diye)
SELECT setval(pg_get_serial_sequence('public.discussions', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM public.discussions;
`;

fs.writeFileSync(path.join(__dirname, '../supabase_schema.sql'), sql, 'utf8');
console.log(`supabase_schema.sql basariyla olusturuldu! Toplam fon: ${funds.length}, tartisma: ${discussions.length}`);
