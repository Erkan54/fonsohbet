"""FonSohbet Günlük Fon Verisi Senkronizasyon İşi (Pipeline).

Kullanım:
    python -m app.jobs.sync_funds
    python -m app.jobs.sync_funds --days 40
    python -m app.jobs.sync_funds --backfill

Çalışma adımları:
1. Senkronizasyon başlangıcını 'fund_sync_runs' tablosuna kaydeder.
2. TEFAS'tan ilgili fon türlerini (YAT, BYF) toplu (bulk) çeker.
3. Çekilen kayıtları normalize eder (Decimal dönüşümü, tarih doğrulama).
4. Verileri TRACKED_FUNDS listesiyle filtreler.
5. 'fund_prices' tablosuna UNIQUE(fund_code, date) kuralıyla upsert eder.
6. Her fon için 'fund_prices' üzerinden gerçek 1 aylık getiriyi hesaplar.
7. 'funds' tablosundaki 'price' ve 'monthly_return' alanlarını türetilmiş cache olarak günceller.
8. 'fund_sync_runs' tablosunu başarı durumu ve son veri tarihi ile günceller.
9. Hata durumunda asla var olan veriyi null ile ezmez, hatayı loglar.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

from app.config import (
    BASE_DIR,
    HERO_CHART_FUND,
    HERO_CHIP_FUNDS,
    SUPABASE_KEY,
    SUPABASE_URL,
    TEFAS_KINDS,
    TIMEZONE,
    TRACKED_FUNDS,
)
from app.services.fund_service import (
    calculate_period_return,
    normalize_fund_records,
    parse_date_str,
)
from app.services.tefas_client import TefasClient, TefasClientError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("sync_funds")

# Yerel yedek / önbellek dizini
CACHE_DIR = BASE_DIR / "data"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_PRICES_CACHE = CACHE_DIR / "fund_prices_cache.json"
LOCAL_SYNC_CACHE = CACHE_DIR / "fund_sync_runs.json"


def get_supabase_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def record_sync_start() -> Optional[int]:
    """fund_sync_runs tablosuna yeni bir çalışma kaydı ekler."""
    started_at = datetime.now().isoformat()
    payload = {
        "started_at": started_at,
        "status": "running",
        "funds_updated": 0,
        "error_count": 0,
    }

    # Yerel önbelleğe yaz
    local_runs = []
    if LOCAL_SYNC_CACHE.exists():
        try:
            with open(LOCAL_SYNC_CACHE, "r", encoding="utf-8") as f:
                local_runs = json.load(f)
        except Exception:
            local_runs = []

    run_id = int(datetime.now().timestamp() * 1000)
    payload_local = {**payload, "id": run_id}
    local_runs.insert(0, payload_local)
    with open(LOCAL_SYNC_CACHE, "w", encoding="utf-8") as f:
        json.dump(local_runs[:50], f, indent=2, ensure_ascii=False)

    # Supabase'e yazmayı dene
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/fund_sync_runs"
            headers = {**get_supabase_headers(), "Prefer": "return=representation"}
            r = requests.post(url, headers=headers, json=payload, timeout=10)
            if r.status_code in (200, 201):
                data = r.json()
                if data and isinstance(data, list):
                    return data[0].get("id")
        except Exception as e:
            logger.warning("Supabase fund_sync_runs tablosuna yazılamadı (tablo henüz oluşturulmamış olabilir): %s", e)

    return run_id


def record_sync_complete(
    run_id: Optional[int],
    status: str,
    source_max_date: Optional[str] = None,
    funds_updated: int = 0,
    error_count: int = 0,
    error_message: Optional[str] = None,
) -> None:
    """fund_sync_runs kaydını sonuçla günceller."""
    completed_at = datetime.now().isoformat()
    patch_data = {
        "completed_at": completed_at,
        "status": status,
        "source_max_date": source_max_date,
        "funds_updated": funds_updated,
        "error_count": error_count,
        "error_message": error_message,
    }

    # Yerel önbelleği güncelle
    if LOCAL_SYNC_CACHE.exists():
        try:
            with open(LOCAL_SYNC_CACHE, "r", encoding="utf-8") as f:
                local_runs = json.load(f)
            for item in local_runs:
                if item.get("id") == run_id:
                    item.update(patch_data)
                    break
            with open(LOCAL_SYNC_CACHE, "w", encoding="utf-8") as f:
                json.dump(local_runs[:50], f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.warning("Yerel sync önbelleği güncellenemedi: %s", e)

    # Supabase kaydını güncelle
    if SUPABASE_URL and SUPABASE_KEY and run_id:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/fund_sync_runs?id=eq.{run_id}"
            requests.patch(url, headers=get_supabase_headers(), json=patch_data, timeout=10)
        except Exception as e:
            logger.warning("Supabase fund_sync_runs güncellenemedi: %s", e)


def save_fund_prices(records: List[Dict[str, Any]]) -> int:
    """Fiyat kayıtlarını hem Supabase'e hem de yerel önbelleğe upsert eder."""
    if not records:
        return 0

    # 1. Yerel JSON önbelleğe kaydet / güncelle
    cached_prices: Dict[str, Dict[str, Any]] = {}
    if LOCAL_PRICES_CACHE.exists():
        try:
            with open(LOCAL_PRICES_CACHE, "r", encoding="utf-8") as f:
                raw = json.load(f)
                for item in raw:
                    key = f"{item['fund_code']}:{item['date']}"
                    cached_prices[key] = item
        except Exception:
            cached_prices = {}

    for r in records:
        key = f"{r['fund_code']}:{r['date']}"
        cached_prices[key] = {
            "fund_code": r["fund_code"],
            "date": r["date"],
            "price": str(r["price"]),
            "shares_outstanding": r.get("shares_outstanding"),
            "investor_count": r.get("investor_count"),
            "portfolio_size": r.get("portfolio_size"),
        }

    # Sıralı listeye çevir ve kaydet
    sorted_cache = sorted(cached_prices.values(), key=lambda x: (x["fund_code"], x["date"]))
    with open(LOCAL_PRICES_CACHE, "w", encoding="utf-8") as f:
        json.dump(sorted_cache, f, indent=2, ensure_ascii=False)

    logger.info("Yerel fund_prices önbelleğine %d kayıt kaydedildi.", len(sorted_cache))

    # 2. Supabase'e upsert et
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/fund_prices?on_conflict=fund_code,date"
            headers = {
                **get_supabase_headers(),
                "Prefer": "resolution=merge-duplicates",
            }
            # Parçalar halinde gönder (her parçada 500 kayıt)
            db_payload = [
                {
                    "fund_code": r["fund_code"],
                    "date": r["date"],
                    "price": float(r["price"]),  # REST API numerik aktarımı
                }
                for r in records
            ]
            batch_size = 500
            for i in range(0, len(db_payload), batch_size):
                chunk = db_payload[i : i + batch_size]
                resp = requests.post(url, headers=headers, json=chunk, timeout=20)
                if resp.status_code not in (200, 201):
                    logger.warning("Supabase fund_prices batch uyarısı: %s %s", resp.status_code, resp.text)
        except Exception as e:
            logger.warning("Supabase fund_prices tablosuna kaydedilemedi (tablo henüz oluşturulmamış olabilir): %s", e)

    return len(records)


def update_funds_table_cache(fund_code: str, latest_price: Decimal, return_1m: Decimal) -> None:
    """'funds' tablosundaki türetilmiş 'price' ve 'monthly_return' alanlarını günceller."""
    if not (SUPABASE_URL and SUPABASE_KEY):
        return
    try:
        url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/funds?code=eq.{fund_code}"
        payload = {
            "price": float(latest_price),
            "monthly_return": float(return_1m),
            "updated_at": datetime.now().isoformat(),
        }
        requests.patch(url, headers=get_supabase_headers(), json=payload, timeout=5)
    except Exception as e:
        logger.debug("funds tablosu güncelleme uyarısı (%s): %s", fund_code, e)


def run_sync(days: int = 35, full_backfill: bool = False) -> Dict[str, Any]:
    """Senkronizasyon pipeline ana fonksiyonu."""
    logger.info("=== TEFAS Fon Senkronizasyonu Başlatıldı (Aralık: %d gün, Backfill: %s) ===", days, full_backfill)
    run_id = record_sync_start()

    end_d = date.today()
    start_d = end_d - timedelta(days=days if not full_backfill else 365)

    client = TefasClient(timeout=60, max_retry=5)
    tracked_set = set(TRACKED_FUNDS)

    try:
        # 1. TEFAS'tan toplu (bulk) veri çekimi
        raw_records = client.fetch_bulk(
            start_date=start_d,
            end_date=end_d,
            kinds=TEFAS_KINDS,
        )

        if not raw_records:
            msg = f"TEFAS API'sinden belirtilen aralıkta ({start_d} - {end_d}) veri dönmedi."
            logger.warning(msg)
            record_sync_complete(run_id, status="success", error_message=msg)
            return {"status": "empty", "records": 0}

        # 2. Normalizasyon ve Decimal dönüşümü
        normalized = normalize_fund_records(raw_records)

        # 3. Takip edilen fon listesiyle filtreleme
        filtered = [r for r in normalized if r["fund_code"] in tracked_set]
        logger.info(
            "Toplam %d kayıttan takip edilen fonlara ait %d kayıt filtrelendi.",
            len(normalized), len(filtered)
        )

        if not filtered:
            msg = "Takip edilen fonlara ait hiçbir kayıt bulunamadı."
            logger.warning(msg)
            record_sync_complete(run_id, status="success", error_message=msg)
            return {"status": "no_tracked_match", "records": 0}

        # 4. fund_prices tablosuna ve yerel önbelleğe kaydet
        saved_count = save_fund_prices(filtered)

        # 5. Her fon için 1 aylık getiri hesapla ve 'funds' tablosunu güncelle
        # Fon bazında grupla
        by_fund: Dict[str, List[Dict[str, Any]]] = {}
        for r in filtered:
            by_fund.setdefault(r["fund_code"], []).append(r)

        source_max_date = max(r["date"] for r in filtered)

        for fcode, plist in by_fund.items():
            plist.sort(key=lambda x: x["date"])
            ret_1m = calculate_period_return(plist, period="1m")
            latest_price = plist[-1]["price"]
            update_funds_table_cache(fcode, latest_price, ret_1m)

        # 6. Senkronizasyon koşusunu başarıyla tamamla
        record_sync_complete(
            run_id=run_id,
            status="success",
            source_max_date=source_max_date,
            funds_updated=len(by_fund),
            error_count=0,
        )

        logger.info("=== Senkronizasyon Başarıyla Tamamlandı! Güncellenen fon sayısı: %d, Son Veri: %s ===", len(by_fund), source_max_date)

        return {
            "status": "success",
            "source_max_date": source_max_date,
            "funds_updated": len(by_fund),
            "records_saved": saved_count,
        }

    except Exception as e:
        logger.error("Senkronizasyon sırasında hata oluştu: %s", e, exc_info=True)
        record_sync_complete(
            run_id=run_id,
            status="failed",
            error_count=1,
            error_message=str(e),
        )
        return {
            "status": "failed",
            "error": str(e),
        }


def main():
    parser = argparse.ArgumentParser(description="FonSohbet TEFAS Fon Senkronizasyon Pipeline")
    parser.add_argument("--days", type=int, default=35, help="Çekilecek gün sayısı (varsayılan: 35)")
    parser.add_argument("--backfill", action="store_true", help="1 yıllık geçmiş veri tamamlama (backfill)")
    args = parser.parse_args()

    res = run_sync(days=args.days, full_backfill=args.backfill)
    if res.get("status") == "failed":
        sys.exit(1)


if __name__ == "__main__":
    main()
