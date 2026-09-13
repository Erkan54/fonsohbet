"""FonSohbet merkezi yapılandırma modülü."""
from __future__ import annotations

import os
from pathlib import Path
from typing import List

# .env dosyasını oku (varsa)
def load_dotenv_file(filepath: Path | str = ".env") -> None:
    path = Path(filepath)
    if not path.exists():
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# Proje kök dizinindeki .env'yi yükle
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv_file(BASE_DIR / ".env")

# Zaman Dilimi
TIMEZONE = "Europe/Istanbul"

# Supabase Yapılandırması
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "https://hfiwaotfufxporlqnbxy.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "sb_publishable_SZqLufapaOaXKcskvAliww_eJZyhphx")

# Hero ve Özet Fon Yapılandırması
HERO_CHART_FUND = "THF"
HERO_CHIP_FUNDS = ["THF", "ZBP", "BLH"]

# TEFAS Fon Türleri (YAT: Yatırım Fonları, BYF: Borsa Yatırım Fonları)
TEFAS_KINDS: List[str] = ["YAT", "BYF"]

# FonSohbet Takip Edilen Fon Evreni (100 Seçkin Fon)
TRACKED_FUNDS: List[str] = [
    # Hero Vurgulanan Fonlar
    "THF", "ZBP", "BLH",
    # Hisse Senedi
    "AFT", "YAY", "AK3", "YAS", "AFA", "TMG", "KPC", "GUH", "GSP",
    # Para Piyasası
    "TP2", "TI1", "GTL", "GAL", "FI5", "YLB", "ALE", "TZL", "VK6", "TKM",
    # Altın & Kıymetli Madenler
    "OJK", "YKT", "TTA", "GTA", "AFO", "TUA", "DBA", "HBF", "FIB", "GGK",
    # Değişken
    "FNO", "TNI", "IJC", "HSA", "GMA", "SUA", "TE4", "GBV", "YIT", "HOA",
    # Borçlanma Araçları
    "TZV", "TIV", "TSI", "TGT", "VKT", "YBE", "GUB", "AVT", "HKV", "TRJ",
    # Fon Sepeti
    "TPC", "YPV", "YAC", "OJT", "ARL", "GZP", "ZPC", "TCF", "OTJ", "TGE",
    # Katılım
    "KLU", "KHP", "EP1", "AIS", "VPA", "KUT", "PPK", "HPH", "KPI", "GPN",
    # Karma
    "IPJ", "YAK", "ITP", "IKP", "IJP", "IKL", "IJB", "KRR",
    # Kira Sertifikaları
    "KTV", "ZPK", "HPV", "RBV", "VFK", "VTL",
    # Gümüş
    "GTZ", "YZG", "GUM", "GMC", "DMG", "KGM",
    # Borsa Yatırım Fonları
    "FGS", "ZBB", "ZKP", "ZTR", "ZKE", "BOE", "ZPP", "BND",
]
