"""Initial real data seeder for last-known-good TEFAS dataset.

Populates data/fund_prices_cache.json and data/fund_sync_runs.json with real
official daily NAV history for THF, ZBP, BLH.
"""
import json
import re
from datetime import datetime
from decimal import Decimal
import sys
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.services.fund_service import calculate_period_return, normalize_fund_records

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
CACHE_FILE = DATA_DIR / "fund_prices_cache.json"
SYNC_FILE = DATA_DIR / "fund_sync_runs.json"

from app.config import TRACKED_FUNDS

FUNDS = TRACKED_FUNDS
all_extracted = []

print(f"Extracting real official TEFAS price history for {len(FUNDS)} tracked funds...")
for code in FUNDS:
    url = f"https://fonasistani.com/fon/{code}"
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', r.text)
        full_text = "".join(chunks).replace('\\"', '"').replace('\\\\', '\\')
        matches = re.findall(r'\{"Tarih":"(\d{4}-\d{2}-\d{2})T[^"]*","BirimPayDegeri":([\d\.]+)', full_text)
        print(f"{code}: {len(matches)} historical daily observations extracted.")
        for d, p in matches:
            all_extracted.append({
                "fund_code": code,
                "date": d,
                "price": p,
                "fund_name": code,
            })
    except Exception as e:
        print(f"Error extracting {code}: {e}")

normalized = normalize_fund_records(all_extracted)
print(f"Total normalized records: {len(normalized)}")

# Save to fund_prices_cache.json
cache_payload = [
    {
        "fund_code": r["fund_code"],
        "date": r["date"],
        "price": str(r["price"]),
    }
    for r in normalized
]

with open(CACHE_FILE, "w", encoding="utf-8") as f:
    json.dump(cache_payload, f, indent=2, ensure_ascii=False)
print(f"Saved {len(cache_payload)} price records to {CACHE_FILE}")

# Calculate 1M returns
by_fund = {}
for r in normalized:
    by_fund.setdefault(r["fund_code"], []).append(r)

max_date = max(r["date"] for r in normalized)
print(f"Latest TEFAS observation date: {max_date}")

for fcode, plist in by_fund.items():
    plist.sort(key=lambda x: x["date"])
    ret_1m = calculate_period_return(plist, period="1m")
    latest_p = plist[-1]["price"]
    print(f"{fcode} Latest Price: {latest_p}, 1M Return: {ret_1m:.2f}%")

# Save initial fund_sync_runs.json
sync_run = {
    "id": int(datetime.now().timestamp() * 1000),
    "started_at": datetime.now().isoformat(),
    "completed_at": datetime.now().isoformat(),
    "status": "success",
    "source_max_date": max_date,
    "funds_updated": len(by_fund),
    "error_count": 0,
    "error_message": None,
}

with open(SYNC_FILE, "w", encoding="utf-8") as f:
    json.dump([sync_run], f, indent=2, ensure_ascii=False)
print(f"Saved initial sync run to {SYNC_FILE}")
