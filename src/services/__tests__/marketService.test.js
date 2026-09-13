import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, formatReturn, formatDateTr } from '../marketService.js';

describe('MarketService - Formatlama ve Veri Yardımcıları', () => {
  it('1. formatPrice fonksiyonu fiyatı 6 ondalık ve tr-TR para birimiyle formatlamalı', () => {
    assert.equal(formatPrice(2.916338), '2,916338 ₺');
    assert.equal(formatPrice(199.574868), '199,574868 ₺');
    assert.equal(formatPrice(0.123456), '0,123456 ₺');
    assert.equal(formatPrice(null), '—');
  });

  it('2. formatReturn fonksiyonu pozitif getiriye +, negatife -, sıfıra % formatı vermeli', () => {
    assert.equal(formatReturn(28.10), '+%28,10');
    assert.equal(formatReturn(-1.14), '-%1,14');
    assert.equal(formatReturn(0), '%0,00');
    assert.equal(formatReturn(null), '%0,00');
  });

  it('3. formatDateTr tarihi tr-TR Türkçe ay formatına dönüştürmeli', () => {
    const formatted = formatDateTr('2026-09-11');
    assert.match(formatted, /11.*Eyl.*2026/);
  });

  it('4. Çizgi grafik min-max koordinat dönüşümü doğruluğu', () => {
    const rawPoints = [
      { date: '2026-08-11', price: 2.0 },
      { date: '2026-08-25', price: 2.5 },
      { date: '2026-09-11', price: 3.0 },
    ];
    const minPrice = 2.0;
    const maxPrice = 3.0;
    const range = maxPrice - minPrice;

    // x aralığı 10 - 390, y aralığı 105 (min) - 20 (max)
    const coords = rawPoints.map((p, i) => ({
      x: 10 + (i / (rawPoints.length - 1)) * 380,
      y: 105 - ((p.price - minPrice) / range) * 85,
    }));

    // En düşük fiyat en alta (y = 105), en yüksek en üste (y = 20) gelmeli
    assert.equal(coords[0].x, 10);
    assert.equal(coords[0].y, 105);
    assert.equal(coords[2].x, 390);
    assert.equal(coords[2].y, 20);
  });

  it('5. Çip renk sınıfı eşlemesi (pozitif -> text-positive, negatif -> text-negative)', () => {
    const getColorClass = (ret) => {
      if (ret > 0) return 'text-positive';
      if (ret < 0) return 'text-negative';
      return 'text-neutral';
    };

    assert.equal(getColorClass(28.10), 'text-positive');
    assert.equal(getColorClass(-1.14), 'text-negative');
    assert.equal(getColorClass(0), 'text-neutral');
  });
});
