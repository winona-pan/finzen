#!/usr/bin/env python3
"""
全市場報價：台股（上市＋上櫃，含 ETF）與美股（NASDAQ／NYSE／AMEX 個股＋ETF）
- 不用再手動把每一檔持股加進 update_stock_prices.py 的清單，App 找不到的股票會自動來這裡查
- 為了不讓使用者每次下載一大包，輸出拆成小檔案，App 只下載自己持股需要的那幾份：
    public/quotes/tw.json          台股全部（約 2000 多檔，壓縮後幾十 KB）
    public/quotes/us/A.json …      美股依代號第一個字母分檔（每份約 20～40 KB）
    public/quotes/meta.json        更新時間、檔數
  每一筆格式：代號: [現價, 漲跌幅%, 名稱, 產業別]（產業別給 App 的產業分佈圖自動分類用，查不到是 null）
- 這些檔案不存進 git（每個交易日都會變，存進去 repo 會越來越肥），只在部署時產生；
  某個來源這次抓失敗的話，沿用目前網站上的那一份，不會讓報價整個消失

資料來源（全部是一次抓整個市場，不是一檔一檔查）：
- 證交所 openapi STOCK_DAY_ALL：上市全部的代號、中文名、收盤價
- 櫃買中心 openapi tpex_mainboard_daily_close_quotes：上櫃全部的代號、中文名、收盤價
- 證交所 mis 即時報價：台股盤中時段，一次查 100 檔，把收盤價換成即時價
- Nasdaq screener：美股全部個股、全部 ETF（延遲報價），個股順便帶 sector
- 證交所 openapi t187ap03_L／櫃買中心 openapi mopsfe_t187ap03_O：上市、上櫃公司基本資料裡的「產業別」
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
    """回傳 ({代號: {"p":價, "c":漲跌%, "n":名稱, "m":"tse"/"otc"}}, 上市資料的日期（民國 1151007 這種格式）)"""
    out = {}
    listed = fetch("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL") or []
    listed_date = max((r.get("Date") or "" for r in listed), default="")
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
    print(f"  📈 上櫃：{n_otc} 檔（上市資料日期 {listed_date}）")
    return out, listed_date


def need_tw_realtime(listed_date):
    """要不要另外查即時報價：
    - 盤中（09:00～13:30，多留一點時間拿最後成交價）一定要
    - 收盤後，證交所的「上市全部收盤」常常要到晚上才換成今天的，在那之前也要用即時報價補上今天的收盤價
    其他時間（晚上已更新、假日）就不用，免得一直對證交所發請求"""
    t = now_tw()
    if t.weekday() >= 5:
        return False
    minutes = t.hour * 60 + t.minute
    if 9 * 60 - 5 <= minutes <= 13 * 60 + 45:
        return True
    today_roc = f"{t.year - 1911}{t:%m%d}"
    return minutes > 13 * 60 + 45 and listed_date != today_roc


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
            out[sym] = {"p": p, "c": num(r.get("pctchange")), "n": clean_us_name(r.get("name")), "s": US_SECTOR.get((r.get("sector") or "").strip())}
    n_stock = len(out)
    etf = fetch("https://api.nasdaq.com/api/screener/etf?download=true") or {}
    for r in (((etf.get("data") or {}).get("data") or {}).get("rows") or []):
        sym = (r.get("symbol") or "").strip().replace("/", "-").upper()
        p = num(r.get("lastSalePrice"))
        if sym and p and sym not in out:
            out[sym] = {"p": p, "c": num(r.get("percentageChange")), "n": (r.get("companyName") or "").strip(), "s": "ETF"}
    print(f"  🇺🇸 美股：個股 {n_stock} 檔、ETF {len(out) - n_stock} 檔")
    return out


def compact(d):
    return {k: [v["p"], None if v["c"] is None else round(v["c"], 2), v["n"], v.get("s")] for k, v in sorted(d.items()) if v.get("p")}


# 證交所／櫃買中心「產業別」代碼對照（公司基本資料裡給的是代碼）
TW_INDUSTRY = {
    "01": "水泥", "02": "食品", "03": "塑膠", "04": "紡織纖維", "05": "電機機械", "06": "電器電纜",
    "08": "玻璃陶瓷", "09": "造紙", "10": "鋼鐵", "11": "橡膠", "12": "汽車", "14": "建材營造",
    "15": "航運", "16": "觀光餐旅", "17": "金融保險", "18": "貿易百貨", "19": "綜合", "20": "其他",
    "21": "化學", "22": "生技醫療", "23": "油電燃氣", "24": "半導體", "25": "電腦及週邊設備",
    "26": "光電", "27": "通信網路", "28": "電子零組件", "29": "電子通路", "30": "資訊服務",
    "31": "其他電子", "32": "文化創意", "33": "農業科技", "34": "電子商務", "35": "綠能環保",
    "36": "數位雲端", "37": "運動休閒", "38": "居家生活", "80": "管理股票", "91": "存託憑證",
}

# Nasdaq screener 的 sector 是英文，統一翻成中文跟台股放在同一張圓餅圖
US_SECTOR = {
    "Technology": "科技", "Finance": "金融", "Health Care": "醫療保健", "Consumer Discretionary": "非必需消費",
    "Consumer Staples": "必需消費", "Industrials": "工業", "Energy": "能源", "Utilities": "公用事業",
    "Real Estate": "不動產", "Telecommunications": "通訊服務", "Basic Materials": "原物料", "Miscellaneous": "其他",
}


def pick(row, *keys):
    for k in keys:
        v = row.get(k)
        if v not in (None, ""):
            return str(v).strip()
    return ""


def fetch_tw_industries():
    """{代號: 產業名}；兩份公司基本資料抓失敗就回傳空的，只是這次沒有自動分類，不影響報價"""
    out = {}
    sources = [
        "https://openapi.twse.com.tw/v1/opendata/t187ap03_L",       # 上市
        "https://www.tpex.org.tw/openapi/v1/mopsfe_t187ap03_O",     # 上櫃
    ]
    for url in sources:
        for r in fetch(url) or []:
            code = pick(r, "公司代號", "SecuritiesCompanyCode", "CompanyCode", "Code")
            ind = pick(r, "產業別", "SecuritiesIndustryCode", "IndustryCode", "Industry")
            if not code or not ind:
                continue
            # 有的來源給代碼（"24"）、有的直接給名稱（"半導體業"），兩種都接
            name = TW_INDUSTRY.get(ind.zfill(2)) if ind.isdigit() else ind.removesuffix("業")
            if name:
                out[code] = name
    print(f"  🏭 台股產業別：{len(out)} 檔")
    return out


def shard_key(sym):
    ch = sym[0]
    return ch if "A" <= ch <= "Z" else "_"


def main():
    print(f"🕐 全市場報價 {now_tw():%Y-%m-%d %H:%M}")
    prev_tw, prev_us = load_previous()

    tw, listed_date = fetch_tw_lists()
    if tw and need_tw_realtime(listed_date):
        apply_tw_realtime(tw)
    industries = fetch_tw_industries()
    for code, v in tw.items():
        # 00 開頭的是 ETF／ETN，公司基本資料裡不會有
        v["s"] = "ETF" if code.startswith("00") else industries.get(code)
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
