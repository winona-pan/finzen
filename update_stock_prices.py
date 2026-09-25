#!/usr/bin/env python3
"""
FinZen 股價 + 法人資料自動更新腳本
- 台股股價：Yahoo Finance v8/chart（v7/quote 從 2024 年底起陸續被 Yahoo 封鎖，改用還在正常運作的端點）
- 三大法人：台灣證交所公開 JSON（完整欄位修正版）
- 美股：Yahoo Finance v8/chart
每次執行會更新 stock_prices.json
"""

import json
import time
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone

# GitHub Actions 執行伺服器預設用 UTC，跟台灣時間差 8 小時；所有存進 JSON 給使用者看的時間都要用這個，
# 不要直接用 datetime.now()（那個會是 UTC，顯示出來會讓人覺得「怎麼都是凌晨」）
TW_TZ = timezone(timedelta(hours=8))
def now_tw():
    return datetime.now(TW_TZ)

# ── 設定你要追蹤的股票代號 ──────────────────────────────
# 台股：涵蓋台灣50（市值前50大）目前主要成分股，季度會有汰弱留強、不會完全跟指數同步，
# 但涵蓋到絕大多數常見的大型持股；美股：市值前50大左右的公司。
# 之所以用這種「廣泛覆蓋」而不是只放少少幾支，是因為這是排程在後端穩定執行、不受瀏覽器/代理伺服器限制的路線，
# 涵蓋越廣，你實際持有的股票就越不用依賴瀏覽器端不穩定的即時查詢備援。
TW_STOCKS = ["0050", "0056", "00878", "00881", "009816", "00981A", "00929", "00939", "00940", "00713",
             "2330", "2454", "2317", "2308", "3711", "2382", "2412", "3037", "2303", "2881",
             "2891", "2882", "2884", "2886", "2892", "2880", "5880", "1303", "1301", "2002",
             "2345", "3017", "2887", "2379", "3231", "2357", "6669", "3661", "2409", "2327",
             "1216", "9910", "5871", "3045", "6505", "4938", "3008", "2395", "5876"]
US_STOCKS = ["AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA", "AVGO", "LLY",
             "JPM", "V", "UNH", "XOM", "WMT", "MA", "PG", "JNJ", "HD", "COST",
             "ORCL", "MRK", "ABBV", "CVX", "CRM", "KO", "AMD", "PEP", "NFLX", "BAC",
             "TMO", "ADBE", "LIN", "MCD", "CSCO", "ABT", "WFC", "DIS", "ACN", "IBM",
             "TXN", "INTU", "VZ", "NOW", "CAT", "AMGN", "QCOM", "VOO", "QQQ", "SPY"]
# 大盤指數（用來跟你的投資組合報酬率比較）：台灣加權指數、費城半導體指數、S&P 500
INDEXES = {"^TWII": "台灣加權指數", "^SOX": "費城半導體指數", "^GSPC": "S&P 500"}
# ─────────────────────────────────────────────────────────

def req(url, timeout=12):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept": "application/json"}
    try:
        r = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        print(f"    HTTP failed {url[:70]}: {e}")
        return None

def fetch_yahoo(symbols_str):
    """逐一抓取 Yahoo Finance v8/chart（v7/quote 從 2024 年底起被 Yahoo 陸續封鎖，改用還在正常運作的 v8/chart 端點，一次一檔），回傳 {symbol: data}"""
    out = {}
    symbols = [s for s in symbols_str.split(",") if s]
    for sym in symbols:
        url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym, safe='')}"
               f"?interval=1d&range=1d")
        raw = req(url)
        if not raw:
            url2 = url.replace("query1", "query2")
            raw = req(url2)
        if not raw:
            time.sleep(0.3)
            continue
        try:
            d = json.loads(raw)
            result = d.get("chart", {}).get("result")
            if not result:
                time.sleep(0.3)
                continue
            meta = result[0].get("meta", {})
            price = meta.get("regularMarketPrice")
            prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")
            if price is None:
                time.sleep(0.3)
                continue
            chg_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0
            # v8/chart 沒有當天最高/最低/成交量欄位，退回抓當天K棒的 high/low/volume（如果有）
            quote = result[0].get("indicators", {}).get("quote", [{}])[0]
            highs = [v for v in (quote.get("high") or []) if v is not None]
            lows = [v for v in (quote.get("low") or []) if v is not None]
            vols = [v for v in (quote.get("volume") or []) if v is not None]
            out[sym] = {
                "price":  price,
                "high":   max(highs) if highs else meta.get("regularMarketDayHigh"),
                "low":    min(lows) if lows else meta.get("regularMarketDayLow"),
                "vol":    sum(vols) if vols else meta.get("regularMarketVolume"),
                "chgPct": chg_pct,
                "name":   meta.get("shortName") or meta.get("longName") or sym,
            }
        except Exception as e:
            print(f"    Yahoo parse error ({sym}): {e}")
        time.sleep(0.3)  # 每檔之間留點間隔，避免被判定成濫用
    return out

def fetch_institutional(date_str):
    """
    精確抓取台股三大法人買賣超淨額（修正證交所欄位索引與張數換算）
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
                # 證交所公告為「股數」，除以 1000 換算為精確的「張數」
                val = float(str(s).replace(",", "").replace("+", "").strip())
                return round(val / 1000)
            except Exception:
                return 0
                
        for row in d.get("data", []):
            if len(row) < 15:
                continue
            # 自動清洗股票代碼
            code = row[0].strip()
            
            # 修正證交所精確買賣超淨額欄位（第11欄外資、第12欄投信、第14欄自營商買賣超總計）
            result[code] = {
                "foreign": parse(row[11]),  # 外資自營商合計買賣超張數
                "trust":   parse(row[12]),  # 投信買賣超張數
                "dealer":  parse(row[14]),  # 自營商買賣超總計張數
            }
        return result, date_str
    except Exception as e:
        print(f"    法人資料解析失敗: {e}")
        return {}, date_str

def fetch_chart_series(sym, interval, range_):
    """抓單一標的的走勢圖資料（日線或分鐘線皆可），回傳 [{t, c, v}] 陣列（時間戳、收盤價、成交量）"""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym, safe='')}?interval={interval}&range={range_}"
    raw = req(url)
    if not raw:
        raw = req(url.replace("query1", "query2"))
    if not raw:
        return None
    try:
        d = json.loads(raw)
        result = d.get("chart", {}).get("result")
        if not result:
            return None
        r = result[0]
        timestamps = r.get("timestamp") or []
        quote = r.get("indicators", {}).get("quote", [{}])[0]
        closes = quote.get("close") or []
        volumes = quote.get("volume") or []
        out = []
        for i, (t, c) in enumerate(zip(timestamps, closes)):
            if c is None:
                continue
            v = volumes[i] if i < len(volumes) and volumes[i] is not None else 0
            out.append({"t": t, "c": round(c, 4), "v": v})
        return out if out else None
    except Exception:
        return None

def fetch_history():
    """幫每檔追蹤股票抓走勢圖用的歷史資料（日線5年 + 5天分鐘線），存進 stock_history.json，
    讓走勢圖也能直接讀這份後端穩定產生的資料，不用再依賴瀏覽器那幾個不穩定的免費代理伺服器。
    歷史資料不需要每15分鐘更新（daily bar 收盤前都不會變），所以比照匯率的做法，一天只真的抓一次。"""
    today = now_tw().strftime("%Y-%m-%d")
    try:
        with open("public/stock_history.json", "r", encoding="utf-8") as f:
            existing = json.load(f)
        if existing.get("_meta", {}).get("last_updated", "").startswith(today):
            print(f"  ⏭️ 走勢圖資料今天（{today}）已經更新過了，跳過")
            return
    except Exception:
        existing = {}

    history = {}
    all_syms = [(f"{s}.TW", s) for s in TW_STOCKS] + [(s, s) for s in US_STOCKS] + [(s, s) for s in INDEXES.keys()]
    print(f"📊 抓取走勢圖歷史資料（{len(all_syms)} 檔，daily + intraday）...")
    for yahoo_sym, key in all_syms:
        daily = fetch_chart_series(yahoo_sym, "1d", "5y")
        time.sleep(0.3)
        intraday = fetch_chart_series(yahoo_sym, "15m", "5d")
        time.sleep(0.3)
        if daily or intraday:
            history[key] = {"daily": daily or [], "intraday": intraday or []}
            print(f"  ✅ {key}: daily {len(daily or [])} 筆, intraday {len(intraday or [])} 筆")
        else:
            print(f"  ❌ {key}: 走勢圖資料抓取失敗")

    history["_meta"] = {"last_updated": now_tw().strftime("%Y-%m-%d %H:%M:%S")}
    with open("public/stock_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    print(f"  ✅ 走勢圖資料更新完成（{len(history)-1} 檔）")

def main():
    now_str = now_tw().strftime("%Y-%m-%d %H:%M:%S")
    print(f"🕐 開始更新 {now_str}")
    prices = {}

    try:
        with open("public/stock_prices.json", "r", encoding="utf-8") as f:
            prices = json.load(f)
    except Exception:
        pass

    # ── 抓取三大法人資料 ──
    print("🏛  抓取三大法人資料...")
    today = now_tw().strftime("%Y%m%d")
    inst_data, inst_date = fetch_institutional(today)
    if not inst_data:
        # 如果還沒收盤公布，往回推 1-3 天尋找最近一交易日
        for i in range(1, 4):
            check_date = (now_tw() - timedelta(days=i)).strftime("%Y%m%d")
            inst_data, inst_date = fetch_institutional(check_date)
            if inst_data:
                print(f"    ⚠ 使用最近交易日({inst_date})法人籌碼，共 {len(inst_data)} 支")
                break
                
    if not inst_data:
        print("    ❌ 全新法人資料取得失敗，將使用上次舊緩存")
        # 繼承舊資料中的 inst_date 避免報錯
        inst_date = prices.get("_meta", {}).get("institutional_date", today)

    # ── 台股處理 ──
    print(f"📈 抓取台股 ({len(TW_STOCKS)} 檔)...")
    tw_syms = ",".join(f"{s}.TW" for s in TW_STOCKS)
    tw_res = fetch_yahoo(tw_syms)
    for sym in TW_STOCKS:
        q = tw_res.get(f"{sym}.TW") or tw_res.get(sym)
        if q and q.get("price"):
            # 取出該股票的法人資料，如果找不到就補 0
            inst = inst_data.get(sym) or prices.get(sym, {}).get("institutional", {"foreign": 0, "trust": 0, "dealer": 0})
            entry = {
                **q,
                "market": "TW",
                "institutional": inst,
                "institutional_date": inst_date,
                "updated": now_tw().strftime("%Y-%m-%d %H:%M"),
            }
            prices[sym] = entry
            prices[f"{sym}.TW"] = entry
            chg = f"({q['chgPct']:+.2f}%)" if q.get("chgPct") is not None else ""
            print(f"  ✅ {sym} {q['name']}: {q['price']} {chg}")
        else:
            print(f"  ❌ {sym}: 抓取失敗")

    # ── 美股處理 ──
    print(f"🇺🇸 抓取美股 ({len(US_STOCKS)} 檔)...")
    us_syms = ",".join(US_STOCKS)
    us_res = fetch_yahoo(us_syms)
    for sym in US_STOCKS:
        q = us_res.get(sym)
        if q and q.get("price"):
            entry = {
                **q,
                "market": "US",
                "updated": now_tw().strftime("%Y-%m-%d %H:%M"),
            }
            prices[sym] = entry
            chg = f"({q['chgPct']:+.2f}%)" if q.get("chgPct") is not None else ""
            print(f"  ✅ {sym} {q['name']}: ${q['price']} {chg}")
        else:
            print(f"  ❌ {sym}: 抓取失敗")

    # ── 大盤指數處理（用來跟投資組合比較的基準）──
    print(f"📊 抓取大盤指數 ({len(INDEXES)} 檔)...")
    idx_res = fetch_yahoo(",".join(INDEXES.keys()))
    for sym, label in INDEXES.items():
        q = idx_res.get(sym)
        if q and q.get("price"):
            entry = {
                **q,
                "name": label,
                "market": "INDEX",
                "updated": now_tw().strftime("%Y-%m-%d %H:%M"),
            }
            prices[sym] = entry
            chg = f"({q['chgPct']:+.2f}%)" if q.get("chgPct") is not None else ""
            print(f"  ✅ {sym} {label}: {q['price']} {chg}")
        else:
            print(f"  ❌ {sym} {label}: 抓取失敗")

    # ── 寫入 JSON ──
    prices["_meta"] = {
        "last_updated": now_str,
        "tw_count": len(TW_STOCKS),
        "us_count": len(US_STOCKS),
        "institutional_date": inst_date,
    }
    with open("public/stock_prices.json", "w", encoding="utf-8") as f:
        json.dump(prices, f, ensure_ascii=False, indent=2)

    real = [k for k in prices if not k.startswith("_") and not k.endswith(".TW")]
    print(f"\n✅ 完成！共更新 {len(real)} 檔股票資料")

def fetch_rates():
    """抓取匯率（對 TWD），存入 rates.json；一天只真的抓一次，避免現在改成15分鐘跑一次之後，
    對免費匯率 API 一天打將近100次那麼頻繁（匯率本來就不需要抓那麼勤）"""
    today = now_tw().strftime("%Y-%m-%d")
    try:
        with open("public/rates.json", "r", encoding="utf-8") as f:
            existing = json.load(f)
        if existing.get("_updated", "").startswith(today):
            print(f"  ⏭️ 匯率今天（{today}）已經更新過了，跳過")
            return
    except Exception:
        pass
    TWD_CURS = ["USD","EUR","JPY","GBP","HKD","SGD","CNY","KRW","AUD","CAD","CHF","MYR","THB"]
    to = ",".join(TWD_CURS)
    apis = [
        f"https://api.frankfurter.app/latest?from=TWD&to={to}",
        f"https://open.er-api.com/v6/latest/TWD",
    ]
    for url in apis:
        raw = req(url, timeout=10)
        if not raw:
            continue
        try:
            d = json.loads(raw)
            r = d.get("rates") or d.get("conversion_rates")
            if not r:
                continue
            rates = {"TWD": 1.0}
            for cur in TWD_CURS:
                if cur in r and r[cur]:
                    rates[cur] = round(1 / r[cur], 6)
            rates["_updated"] = now_tw().strftime("%Y-%m-%d %H:%M")
            with open("public/rates.json", "w", encoding="utf-8") as f:
                json.dump(rates, f, ensure_ascii=False, indent=2)
            print(f"  ✅ 匯率更新完成（{len(rates)-1} 種貨幣）")
            return
        except Exception as e:
            print(f"  匯率解析失敗: {e}")
    print("  ❌ 匯率更新失敗，保留上次資料")

if __name__ == "__main__":
    main()
    print("\n💱 更新匯率...")
    fetch_rates()
    fetch_history()
