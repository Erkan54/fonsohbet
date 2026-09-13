-- ===================================================================
-- FONSOНBET - TEFAS FUND PRICES & SYNC RUNS TABLOLARI
-- ===================================================================

-- 1. FUND_PRICES TABLOSU (TEK GERÇEK KAYNAK / SOURCE OF TRUTH)
CREATE TABLE IF NOT EXISTS public.fund_prices (
  id BIGSERIAL PRIMARY KEY,
  fund_code VARCHAR(10) NOT NULL REFERENCES public.funds(code) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC(20, 10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_fund_prices_fund_code_date UNIQUE(fund_code, date)
);

-- Hızlı tarih aralığı ve fon sorguları için indeksler
CREATE INDEX IF NOT EXISTS idx_fund_prices_code_date ON public.fund_prices(fund_code, date);
CREATE INDEX IF NOT EXISTS idx_fund_prices_date ON public.fund_prices(date);

-- 2. FUND_SYNC_RUNS TABLOSU (SENKRONİZASYON META VERİLERİ)
CREATE TABLE IF NOT EXISTS public.fund_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed'
  source_max_date DATE,
  funds_updated INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_fund_sync_runs_status_completed ON public.fund_sync_runs(status, completed_at DESC);

-- 3. ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.fund_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public fund prices are viewable by everyone" ON public.fund_prices;
CREATE POLICY "Public fund prices are viewable by everyone" ON public.fund_prices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert fund prices" ON public.fund_prices;
CREATE POLICY "Anyone can insert fund prices" ON public.fund_prices FOR ALL USING (true);

DROP POLICY IF EXISTS "Public sync runs are viewable by everyone" ON public.fund_sync_runs;
CREATE POLICY "Public sync runs are viewable by everyone" ON public.fund_sync_runs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can modify sync runs" ON public.fund_sync_runs;
CREATE POLICY "Anyone can modify sync runs" ON public.fund_sync_runs FOR ALL USING (true);
