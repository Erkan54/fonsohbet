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

function getStartDate(latestDateStr, period) {
  const d = new Date(latestDateStr + 'T00:00:00Z');
  let targetYear = d.getUTCFullYear();
  let targetMonth = d.getUTCMonth();
  let targetDay = d.getUTCDate();
  
  if (period === 'ytd') {
    targetMonth = 0;
    targetDay = 1;
  } else if (period === '1y') {
    targetYear -= 1;
  } else {
    let minusMonths = 1;
    if (period === '3m') minusMonths = 3;
    if (period === '6m') minusMonths = 6;
    
    targetMonth -= minusMonths;
    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
  }
  
  const maxDays = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  targetDay = Math.min(targetDay, maxDays);
  
  return new Date(Date.UTC(targetYear, targetMonth, targetDay)).toISOString().split('T')[0];
}

// Yerel önbellekten (fund_prices_cache.json) veri oku
function getLocalCachedData(fundCode) {
  try {
    const cachePath = path.join(process.cwd(), 'data', 'fund_prices_cache.json');
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf8');
      const allData = JSON.parse(raw);
      return allData.filter(p => p.fund_code === fundCode);
    }
  } catch (err) {
    console.warn('Yerel önbellek okuma hatası:', err.message);
  }
  return [];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json');

  const { code, period = '1m' } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'fund code is required' });
  }

  const fundCode = code.toUpperCase();
  
  try {
    let allPrices = [];

    // 1. Supabase'den veri çekmeyi dene
    if (supabase) {
      try {
        const { data: pricesData } = await supabase
          .from('fund_prices')
          .select('date, price')
          .eq('fund_code', fundCode)
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
      allPrices = getLocalCachedData(fundCode);
    }

    if (allPrices.length === 0) {
      return res.status(200).json({ points: [], periodReturn: 0 });
    }

    // Filtreleme
    const latestDate = allPrices[allPrices.length - 1].date;
    const startDate = getStartDate(latestDate, period.toLowerCase());
    
    // Calculate returns based on exactly the start date price
    const eligiblePast = allPrices.filter(p => p.date <= startDate);
    const baseRecord = eligiblePast.length > 0 ? eligiblePast[eligiblePast.length - 1] : allPrices[0];
    
    const filteredPoints = allPrices.filter(p => p.date >= startDate).map(p => ({
      date: p.date,
      price: Number(Number(p.price).toFixed(6)),
    }));

    // Calculate period return
    const basePrice = Number(baseRecord.price);
    const latestPrice = Number(filteredPoints[filteredPoints.length - 1].price);
    
    let periodReturn = 0;
    if (basePrice > 0) {
      periodReturn = ((latestPrice / basePrice) - 1) * 100;
    }

    return res.status(200).json({
      fundCode,
      period,
      periodReturn: Number(periodReturn.toFixed(2)),
      points: filteredPoints
    });

  } catch (error) {
    console.error('history API hatası:', error);
    return res.status(500).json({ error: 'Tarihsel veri alınırken hata oluştu' });
  }
}
