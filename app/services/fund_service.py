"""Fon normalizasyonu ve merkezi getiri hesaplama servisi.

Fiyatları floating-point saçmalıklarından korumak için daima Decimal ile işler.
1 aylık getiri hesabında look-ahead yaratmayan 'latest available observation <= target_date'
kuralını uygular.
"""
from __future__ import annotations

import calendar
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Union


def parse_date_str(d: Union[str, date, datetime]) -> date:
    """Tarih girdisini datetime.date nesnesine dönüştürür."""
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        cleaned = d.strip().split("T")[0]
        return datetime.strptime(cleaned, "%Y-%m-%d").date()
    raise ValueError(f"Geçersiz tarih formatı: {d!r}")


def subtract_months(d: date, months: int = 1) -> date:
    """Bir tarihten belirtilen ay sayısını çıkarır (takvim gün sınırlarını koruyarak)."""
    year = d.year
    month = d.month - months
    while month <= 0:
        month += 12
        year -= 1
    max_days = calendar.monthrange(year, month)[1]
    day = min(d.day, max_days)
    return date(year, month, day)


def to_decimal(val: Any) -> Decimal:
    """Herhangi bir sayısal girdiyi hassasiyet kaybetmeden Decimal'a dönüştürür."""
    if isinstance(val, Decimal):
        return val
    if val is None:
        raise ValueError("None değeri Decimal'a çevrilemez.")
    try:
        # Stringe çevirerek float ikili gösterim hatalarını önle
        return Decimal(str(val))
    except (InvalidOperation, TypeError) as e:
        raise ValueError(f"Geçersiz sayısal değer ({val!r}): {e}") from e


def normalize_fund_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ham TEFAS kayıtlarını temizler, Decimal'a dönüştürür, tarihe göre sıralar ve mükerrerleri eler."""
    valid_map: Dict[str, Dict[str, Any]] = {}

    for r in records:
        fund_code = str(r.get("fund_code", "")).strip().upper()
        raw_date = r.get("date")
        raw_price = r.get("price")

        if not fund_code or raw_date is None or raw_price is None:
            continue

        try:
            d = parse_date_str(raw_date)
            date_str = d.strftime("%Y-%m-%d")
            price_dec = to_decimal(raw_price)
            if price_dec <= Decimal("0"):
                continue
        except Exception:
            continue

        key = f"{fund_code}:{date_str}"
        valid_map[key] = {
            "fund_code": fund_code,
            "fund_name": str(r.get("fund_name", "")).strip(),
            "date": date_str,
            "date_obj": d,
            "price": price_dec,
            "shares_outstanding": r.get("shares_outstanding"),
            "investor_count": r.get("investor_count"),
            "portfolio_size": r.get("portfolio_size"),
        }

    # Tarihe göre artan (ascending) sırada listele
    sorted_records = sorted(valid_map.values(), key=lambda x: (x["fund_code"], x["date_obj"]))
    return sorted_records


def calculate_period_return(
    prices: List[Dict[str, Any]],
    period: str = "1m",
) -> Decimal:
    """Merkezi getiri hesaplayıcı.

    Kural:
    - latest_price = en son mevcut fiyat gözlemi
    - 1m için: target_date = latest_date minus 1 calendar month
    - base_price = latest available observation <= target_date
      (target_date tarihinde fiyat varsa o, tatil/hafta sonu ise önceki son işlem günü)
    - return = ((latest_price / base_price) - 1) * 100

    Look-ahead (geleceğe bakma) yaratmaz ve süreyi yapay olarak kısaltmaz.
    """
    if not prices or len(prices) < 2:
        return Decimal("0.0")

    # Fiyatların Decimal ve tarihe göre sıralı olduğundan emin ol
    normalized: List[tuple[date, Decimal]] = []
    for p in prices:
        try:
            d = parse_date_str(p["date"])
            pr = to_decimal(p["price"])
            if pr > Decimal("0"):
                normalized.append((d, pr))
        except Exception:
            continue

    if len(normalized) < 2:
        return Decimal("0.0")

    normalized.sort(key=lambda x: x[0])

    latest_date, latest_price = normalized[-1]

    if period.lower() == "1m":
        target_date = subtract_months(latest_date, 1)
    else:
        # Gelecekte 1w, 3m, 6m, 1y eklenebilir
        target_date = subtract_months(latest_date, 1)

    # latest available observation <= target_date
    eligible_past = [item for item in normalized if item[0] <= target_date]

    if eligible_past:
        # Hedef tarihteki veya hedef tarihten hemen önceki son işlem günü
        base_date, base_price = eligible_past[-1]
    else:
        # Fon geçmişi 1 aydan kısaysa mevcut en eski veriyi baz al
        base_date, base_price = normalized[0]

    if base_price == Decimal("0"):
        return Decimal("0.0")

    period_return = ((latest_price / base_price) - Decimal("1")) * Decimal("100")
    return period_return


def format_price_tr(price: Union[Decimal, float, int], decimals: int = 6) -> str:
    """Türkçe para birimi formatı: 2,916338 ₺"""
    dec = to_decimal(price)
    quant = Decimal("1." + "0" * decimals) if decimals > 0 else Decimal("1")
    rounded = dec.quantize(quant, rounding=ROUND_HALF_UP)
    parts = f"{rounded:.{decimals}f}".split(".")
    int_part = parts[0]
    dec_part = parts[1] if len(parts) > 1 else ""

    # Binlik ayraç (nokta)
    int_formatted = "{:,}".format(int(int_part)).replace(",", ".")
    if dec_part:
        return f"{int_formatted},{dec_part} ₺"
    return f"{int_formatted} ₺"


def format_return_tr(ret: Union[Decimal, float, int], decimals: int = 2) -> str:
    """Türkçe yüzde getiri formatı: +%28,10 veya -%1,14"""
    dec = to_decimal(ret)
    quant = Decimal("1." + "0" * decimals) if decimals > 0 else Decimal("1")
    rounded = dec.quantize(quant, rounding=ROUND_HALF_UP)

    sign = "+" if rounded > Decimal("0") else ("-" if rounded < Decimal("0") else "")
    abs_val = abs(rounded)
    parts = f"{abs_val:.{decimals}f}".split(".")
    dec_part = parts[1] if len(parts) > 1 else ""

    if sign == "-":
        return f"-%{parts[0]},{dec_part}"
    elif sign == "+":
        return f"+%{parts[0]},{dec_part}"
    return f"%{parts[0]},{dec_part}"
