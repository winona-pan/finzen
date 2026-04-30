#!/usr/bin/env python3
"""
FinZen 股價 + 法人資料自動更新腳本
- 台股股價：Yahoo Finance v7（最穩定）
- 三大法人：台灣證交所公開 JSON（免費、無需 Key）
- 美股：Yahoo Finance v7
每次執行會更新 stock_prices.json
"""

import json
import time
import urllib.request
from datetime import datetime, timedelta

# ── 設定你要追蹤的股票代號 ──────────────────────────────
TW_STOCKS = ["0050", "0056", "2330", "2317", "2412", "2454", "3008",
             "00878", "00881", "009816", "00981A"]
US_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA",
             "META", "VOO", "QQQ", "SPY"]
# ─────────────────────────────────────────────────────────

def req(url, timeout=12):
    headers = {"User-Agent": "Mozilla/5.0 (compatible; FinZen/1.0)", "Accept": "application/json"}
    try:
        r = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        print(f"    HTTP failed {url[:70]}: {e}")
        return None

def fetch_yahoo(symbols_str):
    """批量抓取 Yahoo Finance v7，回傳 {symbol: data}"""
    url = (f"https://query1.finance.yahoo.com/v7/finance/quote"
           f"?symbols={symbols_str}"
           f"&fields=regularMarketPrice,regularMarketDayHigh,regularMarketDayLow,"
           f"regularMarketVolume,shortName,longName,regularMarketChangePercent")
    raw = req(url)
    if not raw:
        # 備用 query2
        url2 = url.replace("query1", "query2")
        raw = req(url2)
    if not raw:
        return {}
    try:
        d = json.loads(raw)
        results = d.get("quoteResponse", {}).get("result", [])
        out = {}
        for q in results:
            sym = q.get("symbol", "")
            out[sym] = {
                "price":  q.get("regularMarketPrice"),
                "high":   q.get("regularMarketDayHigh"),
                "low":    q.get("regularMarketDayLow"),
                "vol":    q.get("regularMarketVolume"),
                "chgPct": round(q.get("regularMarketChangePercent", 0), 2),
                "name":   q.get("shortName") or q.get("longName") or sym,
            }
        return out
    except Exception as e:
        print(f"    Yahoo parse error: {e}")
        return {}

def fetch_institutional(date_str):
    """
    抓取台股三大法人買賣超（證交所公開 JSON，無需 API Key）
    date_str: "YYYYMMDD"
    """
    url = (f"https://www.twse.com.tw/rwd/zh/fund/T86"
           f"?date={date_str}&selectType=ALL&response=json")
    raw = req(url, timeout=15)
    if not raw:
        return {}, date_str
    try:
        d = json.loads(raw)
        if d.get("stat") != "OK":
            return {}, date_str
        result = {}
        def parse(s):
            try:
                return int(str(s).replace(",", "").replace("+", "").strip())
            except Exception:
                return 0
        for row in d.get("data", []):
            if len(row) < 12:
                continue
            code = row[0].strip()
            result[code] = {
                "foreign": parse(row[4]),   # 外資淨買賣超（千股）
                "trust":   parse(row[7]),   # 投信淨
                "dealer":  parse(row[10]),  # 自營商淨
            }
        return result, date_str
    except Exception as e:
        print(f"    法人資料解析失敗: {e}")
        return {}, date_str

def main():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"🕐 開始更新 {now_str}")
    prices = {}

    # 讀取現有資料（保留上次成功的資料）
    try:
        with open("stock_prices.json", "r") as f:
            prices = json.load(f)
    except Exception:
        pass

    # ── 三大法人（台股，15:30後才有當日資料） ──
    print("🏛  抓取三大法人資料...")
    today = datetime.now().strftime("%Y%m%d")
    inst_data, inst_date = fetch_institutional(today)
    if not inst_data:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
        inst_data, inst_date = fetch_institutional(yesterday)
        if inst_data:
            print(f"   ⚠ 使用前一交易日({inst_date})法人資料，共 {len(inst_data)} 支")
        else:
            print("   ❌ 法人資料取得失敗")
    else:
        print(f"   ✅ 取得 {len(inst_data)} 支台股法人資料（{inst_date}）")

    # ── 台股（批量） ──
    print(f"📈 抓取台股 ({len(TW_STOCKS)} 檔)...")
    tw_syms = ",".join(f"{s}.TW" for s in TW_STOCKS)
    tw_res = fetch_yahoo(tw_syms)
    for sym in TW_STOCKS:
        q = tw_res.get(f"{sym}.TW") or tw_res.get(sym)
        if q and q.get("price"):
            entry = {
                **q,
                "market": "TW",
                "institutional": inst_data.get(sym, {}),
                "institutional_date": inst_date,
                "updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
            }
            prices[sym] = entry
            prices[f"{sym}.TW"] = entry
            chg = f"({q['chgPct']:+.2f}%)" if q.get("chgPct") is not None else ""
            print(f"  ✅ {sym} {q['name']}: {q['price']} {chg}")
        else:
            print(f"  ❌ {sym}: 抓取失敗")

    # ── 美股（批量） ──
    print(f"🇺🇸 抓取美股 ({len(US_STOCKS)} 檔)...")
    us_syms = ",".join(US_STOCKS)
    us_res = fetch_yahoo(us_syms)
    for sym in US_STOCKS:
        q = us_res.get(sym)
        if q and q.get("price"):
            entry = {
                **q,
                "market": "US",
                "updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
            }
            prices[sym] = entry
            chg = f"({q['chgPct']:+.2f}%)" if q.get("chgPct") is not None else ""
            print(f"  ✅ {sym} {q['name']}: ${q['price']} {chg}")
        else:
            print(f"  ❌ {sym}: 抓取失敗")

    # ── 寫入 JSON ──
    prices["_meta"] = {
        "last_updated": now_str,
        "tw_count": len(TW_STOCKS),
        "us_count": len(US_STOCKS),
        "institutional_date": inst_date,
    }
    with open("stock_prices.json", "w", encoding="utf-8") as f:
        json.dump(prices, f, ensure_ascii=False, indent=2)

    real = [k for k in prices if not k.startswith("_") and not k.endswith(".TW")]
    print(f"\n✅ 完成！共更新 {len(real)} 檔股票")

if __name__ == "__main__":
    main()
