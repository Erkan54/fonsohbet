import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase İstemcisi
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Tarihten 1 ay çıkarma (takvim gün taşmalarını önleyerek)
function subtractOneMonth(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  const day = d.getUTCDate();

  // Bir önceki ay
  const targetYear = month === 0 ? year - 1 : year;
  const targetMonth = month === 0 ? 11 : month - 1;
  const maxDaysInTarget = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, maxDaysInTarget);

  const res = new Date(Date.UTC(targetYear, targetMonth, targetDay));
  return res.toISOString().split('T')[0];
}

// 1 Aylık Getiri Hesaplayıcı (latest available <= target_date)
function calculateMonthlyReturn(priceRecords) {
  if (!priceRecords || priceRecords.length < 2) {
    return 0;
  }
  const sorted = [...priceRecords].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const targetDate = subtractOneMonth(latest.date);

  // target_date veya öncesindeki son işlem günü
  const eligiblePast = sorted.filter(p => p.date <= targetDate);
  const base = eligiblePast.length > 0 ? eligiblePast[eligiblePast.length - 1] : sorted[0];

  const basePrice = Number(base.price);
  const latestPrice = Number(latest.price);
  if (basePrice <= 0) return 0;

  const ret = ((latestPrice / basePrice) - 1) * 100;
  return Number(ret.toFixed(2));
}

// Yerel önbellekten (fund_prices_cache.json) veri oku
function getLocalCachedData() {
  try {
    const cachePath = path.join(process.cwd(), 'data', 'fund_prices_cache.json');
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Yerel önbellek okuma hatası:', err.message);
  }
  return [];
}

// Yerel sync meta verisinden oku
function getLocalSyncRuns() {
  try {
    const syncPath = path.join(process.cwd(), 'data', 'fund_sync_runs.json');
    if (fs.existsSync(syncPath)) {
      const raw = fs.readFileSync(syncPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Yerel sync meta okuma hatası:', err.message);
  }
  return [];
}

export default async function handler(req, res) {
  // CDN Cache: 5 dakika önbellek, arka planda 24 saate kadar revalidate
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json');

  try {
    let syncRun = null;
    let allPrices = [];

    // 1. Supabase'den veri çekmeyi dene
    if (supabase) {
      try {
        const { data: runData } = await supabase
          .from('fund_sync_runs')
          .select('*')
          .eq('status', 'success')
          .order('completed_at', { ascending: false })
          .limit(1);

        if (runData && runData.length > 0) {
          syncRun = runData[0];
        }

        const { data: pricesData } = await supabase
          .from('fund_prices')
          .select('fund_code, date, price')
          .in('fund_code', ['THF', 'ZBP', 'BLH'])
          .order('date', { ascending: true });

        if (pricesData && pricesData.length > 0) {
          allPrices = pricesData;
        }
      } catch (dbErr) {
        console.warn('Supabase sorgu hatası, yerel önbellek kullanılacak:', dbErr.message);
      }
    }

    // 2. DB'de yoksa yerel önbelleğe başvur
    if (allPrices.length === 0) {
      const local = getLocalCachedData();
      allPrices = local.filter(p => ['THF', 'ZBP', 'BLH'].includes(p.fund_code));
    }
    if (!syncRun) {
      const localRuns = getLocalSyncRuns();
      syncRun = localRuns.find(r => r.status === 'success') || localRuns[0] || null;
    }

    // THF Fiyatları ve Grafiği
    const thfPrices = allPrices.filter(p => p.fund_code === 'THF').sort((a, b) => a.date.localeCompare(b.date));
    const zbpPrices = allPrices.filter(p => p.fund_code === 'ZBP').sort((a, b) => a.date.localeCompare(b.date));
    const blhPrices = allPrices.filter(p => p.fund_code === 'BLH').sort((a, b) => a.date.localeCompare(b.date));

    // THF için son ~1 aylık (yaklaşık son 25 işlem günü) noktalar
    const thfPoints1M = thfPrices.slice(-25).map(p => ({
      date: p.date,
      price: Number(Number(p.price).toFixed(6)),
    }));

    const thfLatestPrice = thfPoints1M.length > 0 ? thfPoints1M[thfPoints1M.length - 1].price : 0;
    const thfReturn1M = calculateMonthlyReturn(thfPrices);
    const zbpReturn1M = calculateMonthlyReturn(zbpPrices);
    const blhReturn1M = calculateMonthlyReturn(blhPrices);

    const dataDate = syncRun?.source_max_date || (thfPoints1M.length > 0 ? thfPoints1M[thfPoints1M.length - 1].date : null);
    const lastUpdated = syncRun?.completed_at || syncRun?.started_at || new Date().toISOString();
    const isStale = !syncRun || syncRun.status !== 'success';

    const responsePayload = {
      dataDate: dataDate,
      lastUpdated: lastUpdated,
      isStale: isStale,
      chart: {
        fundCode: 'THF',
        fundName: 'TERA PORTFÖY HİSSE SENEDİ (TL) FONU',
        period: '1M',
        latestPrice: thfLatestPrice,
        monthlyReturn: thfReturn1M,
        points: thfPoints1M,
      },
      highlightFunds: [
        {
          code: 'THF',
          return1m: thfReturn1M,
        },
        {
          code: 'ZBP',
          return1m: zbpReturn1M,
        },
        {
          code: 'BLH',
          return1m: blhReturn1M,
        },
      ],
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('market-summary API hatası:', error);
    return res.status(500).json({
      error: 'Piyasa özeti yüklenirken hata oluştu',
      isStale: true,
      chart: null,
      highlightFunds: [],
    });
  }
}
