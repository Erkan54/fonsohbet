"""TEFAS API İstemci Adapter'ı.

Resmi TEFAS JSON API'si ile haberleşir (pytefas aracılığıyla).
Toplu (bulk) veri çekimi, rate-limit yönetimi, geçici hata durumlarında retry
ve hata loglama yeteneklerini kapsüller.
Asla sahte veri üretmez veya üçüncü taraf ayna kullanmaz.
"""
from __future__ import annotations

import logging
import time
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

import pandas as pd
from pytefas import Crawler
from pytefas.exceptions import TefasAPIError, TefasRateLimitError

logger = logging.getLogger(__name__)

DateLike = Union[str, date, datetime]


class TefasClientError(Exception):
    """TEFAS istemci temel hata sınıfı."""
    pass


class TefasClient:
    """Resmi TEFAS JSON API istemci servisi."""

    def __init__(self, timeout: int = 60, max_retry: int = 5) -> None:
        self.timeout = timeout
        self.max_retry = max_retry
        self._crawler = Crawler(timeout=timeout, max_retry=max_retry)

    def fetch_bulk(
        self,
        start_date: DateLike,
        end_date: Optional[DateLike] = None,
        kinds: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Belirtilen fon türleri için toplu (bulk) TEFAS verisi çeker.

        50 fonu tek tek çekmek yerine, tür bazlı ('YAT', 'BYF') toplu sorgu
        atarak dakikada 6 istek sınırına takılmadan veriyi hızlıca toplar.
        """
        if kinds is None:
            kinds = ["YAT", "BYF"]

        start_str = self._format_date(start_date)
        end_str = self._format_date(end_date) if end_date else start_str

        all_records: List[Dict[str, Any]] = []

        for kind in kinds:
            logger.info("TEFAS toplu fon verisi çekiliyor: kind=%s, aralık=%s - %s", kind, start_str, end_str)
            df = self._fetch_with_retry(
                start=start_str,
                end=end_str,
                kind=kind,
                columns="info",
                fund_code=None,
            )
            if df is not None and not df.empty:
                records = self._df_to_records(df)
                logger.info("kind=%s için %d adet kayıt çekildi.", kind, len(records))
                all_records.extend(records)
            else:
                logger.warning("kind=%s için kayıt dönmedi.", kind)

        return all_records

    def fetch_fund_history(
        self,
        fund_code: str,
        start_date: DateLike,
        end_date: Optional[DateLike] = None,
        kind: str = "YAT",
    ) -> List[Dict[str, Any]]:
        """Tek bir fonun tarihsel fiyat verisini çeker."""
        start_str = self._format_date(start_date)
        end_str = self._format_date(end_date) if end_date else start_str

        logger.info("TEFAS tekil fon verisi çekiliyor: code=%s, aralık=%s - %s", fund_code, start_str, end_str)
        df = self._fetch_with_retry(
            start=start_str,
            end=end_str,
            kind=kind,
            columns="info",
            fund_code=fund_code.upper(),
        )

        if df is None or df.empty:
            logger.warning("Fon %s için veri bulunamadı (%s - %s).", fund_code, start_str, end_str)
            return []

        return self._df_to_records(df)

    def _fetch_with_retry(
        self,
        start: str,
        end: str,
        kind: str,
        columns: str,
        fund_code: Optional[str],
    ) -> Optional[pd.DataFrame]:
        """Geçici ağ veya rate-limit hatalarında exponential backoff ile yeniden dener."""
        last_exception: Optional[Exception] = None

        for attempt in range(1, self.max_retry + 1):
            try:
                df = self._crawler.fetch(
                    start=start,
                    end=end,
                    kind=kind,
                    columns=columns,
                    fund_code=fund_code,
                )
                return df
            except TefasRateLimitError as e:
                last_exception = e
                wait_time = min(2 ** attempt * 2, 45)
                logger.warning(
                    "TEFAS rate-limit aşıldı (deneme %d/%d). %d sn bekleniyor: %s",
                    attempt, self.max_retry, wait_time, e
                )
                time.sleep(wait_time)
            except (TefasAPIError, ConnectionError, TimeoutError, RuntimeError) as e:
                last_exception = e
                wait_time = min(2 ** attempt, 20)
                logger.warning(
                    "TEFAS API geçici hata (deneme %d/%d). %d sn bekleniyor: %s",
                    attempt, self.max_retry, wait_time, e
                )
                time.sleep(wait_time)
            except Exception as e:
                logger.error("TEFAS beklenmeyen hata oluştu: %s: %s", type(e).__name__, e)
                raise TefasClientError(f"TEFAS veri çekme hatası: {e}") from e

        logger.error("TEFAS maksimum deneme sayısı (%d) aşıldı: %s", self.max_retry, last_exception)
        raise TefasClientError(f"TEFAS verisi çekilemedi: {last_exception}") from last_exception

    @staticmethod
    def _format_date(d: DateLike) -> str:
        """Tarihi YYYY-MM-DD string formatına dönüştürür."""
        if isinstance(d, str):
            return d.strip()
        if isinstance(d, (date, datetime)):
            return d.strftime("%Y-%m-%d")
        raise ValueError(f"Geçersiz tarih formatı: {d!r}")

    @staticmethod
    def _df_to_records(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """pytefas DataFrame'ini standart dictionary listesine dönüştürür."""
        records: List[Dict[str, Any]] = []
        if df.empty:
            return records

        # Tarih sütununu string YYYY-MM-DD'ye normalize et
        df_copy = df.copy()
        if "date" in df_copy.columns:
            df_copy["date"] = pd.to_datetime(df_copy["date"]).dt.strftime("%Y-%m-%d")

        for row in df_copy.to_dict(orient="records"):
            records.append({
                "date": str(row.get("date", "")),
                "fund_code": str(row.get("fund_code", "")).strip().upper(),
                "fund_name": str(row.get("fund_name", "")).strip(),
                "price": row.get("price"),
                "shares_outstanding": row.get("shares_outstanding"),
                "investor_count": row.get("investor_count"),
                "portfolio_size": row.get("portfolio_size"),
            })

        return records
