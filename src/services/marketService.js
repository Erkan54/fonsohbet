/**
 * FonSohbet Piyasa ve Hero Özeti Servisi
 */

export const formatPrice = (val, decimals = 6) => {
  if (val == null || isNaN(val)) return '—';
  const num = Number(val);
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
  return `${formatted} ₺`;
};

export const formatReturn = (val, decimals = 2) => {
  if (val == null || isNaN(val)) return '%0,00';
  const num = Number(val);
  const sign = num > 0 ? '+' : (num < 0 ? '-' : '');
  const absFormatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(num));

  return `${sign}%${absFormatted}`;
};

export const formatDateTr = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const fetchMarketSummary = async () => {
  try {
    const res = await fetch('/api/home/market-summary');
    if (!res.ok) {
      throw new Error(`Piyasa özeti API hatası: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('fetchMarketSummary hatası:', err);
    return null;
  }
};
