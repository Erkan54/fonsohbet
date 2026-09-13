"""FonSohbet TEFAS Veri Boru Hattı Birim Testleri.

Tüm harici TEFAS ve Supabase çağrıları mock'lanmıştır.
Testler asla canlı TEFAS bağlantısına bağımlı değildir.
"""
from __future__ import annotations

import unittest
from datetime import date, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pandas as pd
from pytefas.exceptions import TefasAPIError, TefasRateLimitError

from app.services.fund_service import (
    calculate_period_return,
    format_price_tr,
    format_return_tr,
    normalize_fund_records,
    parse_date_str,
    subtract_months,
    to_decimal,
)
from app.services.tefas_client import TefasClient, TefasClientError


class TestTefasPipeline(unittest.TestCase):
    """Python veri boru hattı kapsamlı testleri."""

    def test_normalize_fund_records_dates_and_decimal(self):
        """1. THF ve fon verilerinin normalizasyonu, tarih doğrulaması ve Decimal korunumu."""
        raw_data = [
            {"fund_code": "thf", "date": "2026-09-11", "price": 2.916338, "fund_name": "TERA HISSE"},
            {"fund_code": "ZBP", "date": "2026-09-11T00:00:00Z", "price": "199.574868", "fund_name": "ZIRAAT LIKIT"},
            {"fund_code": "BLH", "date": date(2026, 9, 11), "price": 46.986633, "fund_name": "AK BANKA"},
        ]
        norm = normalize_fund_records(raw_data)
        self.assertEqual(len(norm), 3)

        # Decimal tipi ve kesinlik kontrolü
        thf = next(r for r in norm if r["fund_code"] == "THF")
        self.assertEqual(thf["date"], "2026-09-11")
        self.assertIsInstance(thf["price"], Decimal)
        self.assertEqual(thf["price"], Decimal("2.916338"))

        zbp = next(r for r in norm if r["fund_code"] == "ZBP")
        self.assertEqual(zbp["date"], "2026-09-11")
        self.assertIsInstance(zbp["price"], Decimal)
        self.assertEqual(zbp["price"], Decimal("199.574868"))

    def test_normalize_fund_records_sorting(self):
        """2. Verilerin tarihe göre artan (ascending) sırada sıralanması."""
        raw_data = [
            {"fund_code": "THF", "date": "2026-09-11", "price": 2.91},
            {"fund_code": "THF", "date": "2026-08-15", "price": 2.50},
            {"fund_code": "THF", "date": "2026-09-01", "price": 2.70},
            {"fund_code": "THF", "date": "2026-08-10", "price": 2.45},
        ]
        norm = normalize_fund_records(raw_data)
        dates = [r["date"] for r in norm]
        self.assertEqual(dates, ["2026-08-10", "2026-08-15", "2026-09-01", "2026-09-11"])

    def test_normalize_fund_records_deduplication(self):
        """3. Aynı (fund_code, date) çiftindeki mükerrer verilerin elenmesi."""
        raw_data = [
            {"fund_code": "THF", "date": "2026-09-11", "price": 2.90},
            {"fund_code": "THF", "date": "2026-09-11", "price": 2.916338},  # En son geçerli olan kalmalı
        ]
        norm = normalize_fund_records(raw_data)
        self.assertEqual(len(norm), 1)
        self.assertEqual(norm[0]["price"], Decimal("2.916338"))

    def test_calculate_period_return_positive(self):
        """4. Pozitif 1 aylık getiri hesaplama doğruluğu."""
        prices = [
            {"date": "2026-08-11", "price": Decimal("2.000000")},
            {"date": "2026-08-25", "price": Decimal("2.200000")},
            {"date": "2026-09-11", "price": Decimal("2.500000")},
        ]
        # (2.5 / 2.0 - 1) * 100 = %25.0
        ret = calculate_period_return(prices, period="1m")
        self.assertEqual(ret, Decimal("25.0"))

    def test_calculate_period_return_negative(self):
        """5. Negatif getiri hesaplama doğruluğu."""
        prices = [
            {"date": "2026-08-11", "price": Decimal("100.000000")},
            {"date": "2026-09-11", "price": Decimal("90.000000")},
        ]
        # (90 / 100 - 1) * 100 = -%10.0
        ret = calculate_period_return(prices, period="1m")
        self.assertEqual(ret, Decimal("-10.0"))

    def test_calculate_period_return_zero(self):
        """6. Sıfır değişim (%0.0) getiri durumu."""
        prices = [
            {"date": "2026-08-11", "price": Decimal("50.000000")},
            {"date": "2026-09-11", "price": Decimal("50.000000")},
        ]
        ret = calculate_period_return(prices, period="1m")
        self.assertEqual(ret, Decimal("0.0"))

    def test_calculate_period_return_weekend_holiday_rule(self):
        """7. Look-ahead yaratmayan kural: target_date hafta sonuna gelirse öncesindeki son işlem gününü alma (latest available observation <= target_date)."""
        # 11 Eylül 2026 bir Cuma. 1 ay öncesi 11 Ağustos 2026 Salı.
        # Şimdi diyelim latest_date = 2026-09-15 (Salı), 1 ay öncesi 2026-08-15 (Cumartesi - Tatil).
        # Cuma günü 2026-08-14, Pazartesi günü 2026-08-17.
        # Kuralımıza göre: observation <= 2026-08-15 seçilmeli, yani 2026-08-14 Cuma! Pazartesi (look-ahead) ALINMAZ!
        prices = [
            {"date": "2026-08-13", "price": Decimal("10.0")},
            {"date": "2026-08-14", "price": Decimal("10.5")},  # <= 2026-08-15 için son işlem günü
            {"date": "2026-08-17", "price": Decimal("11.0")},  # Pazartesi (look-ahead olmamalı!)
            {"date": "2026-09-15", "price": Decimal("12.6")},  # Son fiyat
        ]
        # Base price 10.5 olmalıdır: ((12.6 / 10.5) - 1) * 100 = 20.0%
        ret = calculate_period_return(prices, period="1m")
        self.assertEqual(ret, Decimal("20.0"))

    def test_calculate_period_return_short_history_fallback(self):
        """8. Fon 1 aydan daha yeni ise eldeki en eski gözlemi baz alma."""
        prices = [
            {"date": "2026-09-01", "price": Decimal("10.0")},
            {"date": "2026-09-11", "price": Decimal("11.0")},
        ]
        ret = calculate_period_return(prices, period="1m")
        self.assertEqual(ret, Decimal("10.0"))

    def test_db_unique_constraint_simulation(self):
        """9. Veritabanı UNIQUE(fund_code, date) kısıtı simülasyonu - mükerrer kayıt engeli."""
        db_mock_store = set()

        def insert_price(fund_code: str, d: str, price: Decimal):
            key = (fund_code, d)
            if key in db_mock_store:
                raise ValueError(f"UNIQUE constraint violated: {key}")
            db_mock_store.add(key)

        insert_price("THF", "2026-09-11", Decimal("2.91"))
        insert_price("ZBP", "2026-09-11", Decimal("199.57"))

        # Aynı fon ve aynı tarihte tekrar kayıt eklenmeye çalışıldığında hata fırlatmalı
        with self.assertRaises(ValueError):
            insert_price("THF", "2026-09-11", Decimal("2.92"))

    @patch("app.services.tefas_client.Crawler")
    def test_tefas_client_retry_and_backoff_on_failure(self, mock_crawler_class):
        """10. TEFAS geçici ağ/rate-limit hatalarında retry mekanizması ve sahte veri üretmeme garantisi."""
        mock_crawler = MagicMock()
        mock_crawler_class.return_value = mock_crawler

        # İlk 2 denemede rate limit hatası, 3. denemede başarı simülasyonu
        mock_df = pd.DataFrame([
            {"date": "2026-09-11", "fund_code": "THF", "fund_name": "TERA", "price": 2.916338}
        ])
        mock_crawler.fetch.side_effect = [
            TefasRateLimitError("429 Too Many Requests"),
            TefasAPIError("Timeout"),
            mock_df,
        ]

        with patch("time.sleep", return_value=None):
            client = TefasClient(timeout=10, max_retry=3)
            result = client.fetch_fund_history("THF", "2026-09-01", "2026-09-11")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["fund_code"], "THF")
        self.assertEqual(mock_crawler.fetch.call_count, 3)

    @patch("app.services.tefas_client.Crawler")
    def test_tefas_client_raises_on_persistent_failure(self, mock_crawler_class):
        """11. TEFAS kalıcı olarak kapalıysa asla sahte veri üretilmemeli, TefasClientError fırlatılmalı."""
        mock_crawler = MagicMock()
        mock_crawler_class.return_value = mock_crawler
        mock_crawler.fetch.side_effect = ConnectionError("Remote end closed connection")

        with patch("time.sleep", return_value=None):
            client = TefasClient(timeout=5, max_retry=2)
            with self.assertRaises(TefasClientError):
                client.fetch_fund_history("THF", "2026-09-01", "2026-09-11")

    def test_format_price_and_return_tr(self):
        """12. Türkçe yerel biçimlendirme doğruluğu (tr-TR format: 2,916338 ₺ ve +%28,10)."""
        # Fiyat formatı
        self.assertEqual(format_price_tr(Decimal("2.916338")), "2,916338 ₺")
        self.assertEqual(format_price_tr(199.574868), "199,574868 ₺")
        self.assertEqual(format_price_tr(0.123456), "0,123456 ₺")

        # Getiri formatı
        self.assertEqual(format_return_tr(Decimal("28.10")), "+%28,10")
        self.assertEqual(format_return_tr(Decimal("-1.14")), "-%1,14")
        self.assertEqual(format_return_tr(Decimal("0.0")), "%0,00")

    def test_subtract_months_edge_cases(self):
        """13. Takvim gün sınırları ve ay geçişleri testi."""
        # 31 Mart'tan 1 ay öncesi -> 28 Şubat (veya artık yılda 29)
        d1 = date(2026, 3, 31)
        self.assertEqual(subtract_months(d1, 1), date(2026, 2, 28))

        # 1 Ocak'tan 1 ay öncesi -> 1 Aralık bir önceki yıl
        d2 = date(2026, 1, 15)
        self.assertEqual(subtract_months(d2, 1), date(2025, 12, 15))


if __name__ == "__main__":
    unittest.main()
