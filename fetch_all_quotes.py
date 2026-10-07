#!/usr/bin/env python3
"""
全市場報價：台股（上市＋上櫃，含 ETF）與美股（NASDAQ／NYSE／AMEX 個股＋ETF）
- 不用再手動把每一檔持股加進 update_stock_prices.py 的清單，App 找不到的股票會自動來這裡查
- 為了不讓使用者每次下載一大包，輸出拆成小檔案，App 只下載自己持股需要的那幾份：
    public/quotes/tw.json          台股全部（約 2000 多檔，壓縮後幾十 KB）
    public/quotes/us/A.json …      美股依代號第一個字母分檔（每份約 20～40 KB）
    public/quotes/meta.json        更新時間、檔數
  每一筆格式：代號: [現價, 漲跌幅%, 名稱]
- 這些檔案不存進 git（價格每 15 分鐘就變，存進去 repo 會越來越肥），只在部署時產生；
  某個來源這次抓失敗的話，沿用目前網站上的那一份，不會讓報價整個消失

資料來源（全部是一次抓整個市場，不是一檔一檔查）：
- 證交所 openapi STOCK_DAY_ALL：上市全部的代號、中文名、收盤價
- 櫃買中心 openapi tpex_mainboard_daily_close_quotes：上櫃全部的代號、中文名、收盤價
- 證交所 mis 即時報價：台股盤中時段，一次查 100 檔，把收盤價換成即時價
- Nasdaq screener：美股全部個股、全部 ETF（延遲報價）
"""

import json
import os
import re
import subprocess
import time
from datetime import datetime, timedelta, timezone

TW_TZ = timezone(timedelta(hours=8))
OUT_DIR = "public/quotes"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def now_tw():
    return datetime.now(TW_TZ)


def fetch(url, timeout=90):
    """用 curl 抓：櫃買中心那份 4MB 多的 JSON，用 Python urllib 讀常常讀到一半斷線，curl 比較穩"""
    try:
        r = subprocess.run(["curl", "-sS", "--compressed", "-m", str(timeout), "--retry", "2", "-A", UA,
                            "-H", "Accept: application/json, text/plain, */*", url], capture_output=True)
        if r.returncode != 0:
            print(f"    ❌ {url[:70]}: {r.stderr.decode()[:120]}")
            return None
        return json.loads(r.stdout)
    except Exception as e:
        print(f"    ❌ {url[:70]}: {e}")
        return None


def num(s):
    try:
        v = float(str(s).replace(",", "").replace("$", "").replace("%", "").replace("+", "").strip())
        return v
    except Exception:
        return None


def pct_from_change(price, change):
    if price is None or change is None:
        return None
    prev = price - change
    return round(change / prev * 100, 2) if prev else None


# 只留股票、ETF、特別股；權證（6 碼數字）之類的上萬檔不需要
TW_CODE_RE = re.compile(r"^(\d{4}[A-Z]?|00\d{2,4}[A-Z]?)$")


def load_previous():
    """目前網站上的那一份，當作這次抓失敗時的備援"""
    repo = os.environ.get("GITHUB_REPOSITORY", "winona-pan/finzen")
    owner, name = repo.split("/")
    base = f"https://{owner}.github.io/{name}/quotes/"
    prev_tw = fetch(base + "tw.json", 30) or {}
    prev_us = {}
    meta = fetch(base + "meta.json", 30) or {}
    for shard in meta.get("us_shards", []):
        prev_us.update(fetch(f"{base}us/{shard}.json", 30) or {})
    print(f"  ↩️  網站上現有：台股 {len(prev_tw)} 檔、美股 {len(prev_us)} 檔")
    return prev_tw, prev_us


def fetch_tw_lists():
    """回傳 {代號: {"p":價, "c":漲跌%, "n":名稱, "m":"tse"/"otc"}}"""
    out = {}
    listed = fetch("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL") or []
    for r in listed:
        code = (r.get("Code") or "").strip()
        if not TW_CODE_RE.match(code):
            continue
        p = num(r.get("ClosingPrice"))
        out[code] = {"p": p, "c": pct_from_change(p, num(r.get("Change"))), "n": (r.get("Name") or "").strip(), "m": "tse"}
    print(f"  📈 上市：{sum(1 for v in out.values() if v['m']=='tse')} 檔")
    otc = fetch("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes") or []
    n_otc = 0
    for r in otc:
        code = (r.get("SecuritiesCompanyCode") or "").strip()
        if not TW_CODE_RE.match(code) or code in out:
            continue
        p = num(r.get("Close"))
        out[code] = {"p": p, "c": pct_from_change(p, num(r.get("Change"))), "n": (r.get("CompanyName") or "").strip(), "m": "otc"}
        n_otc += 1
    print(f"  📈 上櫃：{n_otc} 檔")
    return out


def in_tw_session():
    t = now_tw()
    if t.weekday() >= 5:
        return False
    minutes = t.hour * 60 + t.minute
    return 9 * 60 - 5 <= minutes <= 14 * 60 + 30  # 收盤後再跑一兩次，拿到最後成交價


def apply_tw_realtime(tw):
    """台股盤中：證交所 mis 即時報價，一次 100 檔（超過會回「參數不足」）"""
    codes = [(c, v["m"]) for c, v in tw.items()]
    updated = 0
    for i in range(0, len(codes), 100):
        batch = codes[i:i + 100]
        q = "|".join(f"{m}_{c}.tw" for c, m in batch)
        data = fetch("https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=" + q, 30)
        for row in (data or {}).get("msgArray", []):
            code = row.get("c")
            if code not in tw:
                continue
            price = num(row.get("z")) or num(row.get("pz"))  # z＝最近成交價，這一刻剛好沒成交時是 "-"
            prev = num(row.get("y"))  # 昨收
            if price:
                tw[code]["p"] = price
                tw[code]["c"] = round((price - prev) / prev * 100, 2) if prev else tw[code]["c"]
                updated += 1
        time.sleep(0.6)  # 對證交所客氣一點，不要連續狂打
    print(f"  ⚡ 盤中即時更新：{updated} 檔")


def clean_us_name(name):
    name = (name or "").strip()
    for suffix in [" Common Stock", " Class A Common Stock", " Class B Common Stock", " Ordinary Shares", " American Depositary Shares", " Common Shares"]:
        if name.endswith(suffix):
            name = name[: -len(suffix)]
    return name.strip()


def fetch_us():
    """Nasdaq screener：一次拿到全部美股個股、全部 ETF"""
    out = {}
    stocks = fetch("https://api.nasdaq.com/api/screener/stocks?tableonly=true&download=true") or {}
    for r in ((stocks.get("data") or {}).get("rows") or []):
        sym = (r.get("symbol") or "").strip().replace("/", "-").upper()
        p = num(r.get("lastsale"))
        if sym and p:
            out[sym] = {"p": p, "c": num(r.get("pctchange")), "n": clean_us_name(r.get("name"))}
    n_stock = len(out)
    etf = fetch("https://api.nasdaq.com/api/screener/etf?download=true") or {}
    for r in (((etf.get("data") or {}).get("data") or {}).get("rows") or []):
        sym = (r.get("symbol") or "").strip().replace("/", "-").upper()
        p = num(r.get("lastSalePrice"))
        if sym and p and sym not in out:
            out[sym] = {"p": p, "c": num(r.get("percentageChange")), "n": (r.get("companyName") or "").strip()}
    print(f"  🇺🇸 美股：個股 {n_stock} 檔、ETF {len(out) - n_stock} 檔")
    return out


def compact(d):
    return {k: [v["p"], None if v["c"] is None else round(v["c"], 2), v["n"]] for k, v in sorted(d.items()) if v.get("p")}


def shard_key(sym):
    ch = sym[0]
    return ch if "A" <= ch <= "Z" else "_"


def main():
    print(f"🕐 全市場報價 {now_tw():%Y-%m-%d %H:%M}")
    prev_tw, prev_us = load_previous()

    tw = fetch_tw_lists()
    if tw and in_tw_session():
        apply_tw_realtime(tw)
    tw_out = compact(tw) if len(tw) > 500 else prev_tw  # 這次抓得太少（來源出問題），沿用網站上那份
    if tw_out is prev_tw:
        print("  ⚠️ 台股這次抓取不完整，沿用網站上現有的資料")

    us = fetch_us()
    us_out = compact(us) if len(us) > 3000 else prev_us
    if us_out is prev_us:
        print("  ⚠️ 美股這次抓取不完整，沿用網站上現有的資料")

    os.makedirs(f"{OUT_DIR}/us", exist_ok=True)
    with open(f"{OUT_DIR}/tw.json", "w", encoding="utf-8") as f:
        json.dump(tw_out, f, ensure_ascii=False, separators=(",", ":"))
    shards = {}
    for sym, v in us_out.items():
        shards.setdefault(shard_key(sym), {})[sym] = v
    for key, part in shards.items():
        with open(f"{OUT_DIR}/us/{key}.json", "w", encoding="utf-8") as f:
            json.dump(part, f, ensure_ascii=False, separators=(",", ":"))
    meta = {"updated": now_tw().strftime("%Y-%m-%d %H:%M"), "tw_count": len(tw_out), "us_count": len(us_out), "us_shards": sorted(shards)}
    with open(f"{OUT_DIR}/meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)
    tw_kb = os.path.getsize(f"{OUT_DIR}/tw.json") / 1024
    biggest = max((os.path.getsize(f"{OUT_DIR}/us/{k}.json") for k in shards), default=0) / 1024
    print(f"✅ 台股 {len(tw_out)} 檔（{tw_kb:.0f}KB）、美股 {len(us_out)} 檔（{len(shards)} 份，最大 {biggest:.0f}KB）")


if __name__ == "__main__":
    main()
