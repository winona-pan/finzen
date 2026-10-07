"""臨時探測腳本：測試「一次抓全部台股／美股」的資料來源能不能用、有多大（測完會刪掉）"""
import json, time, urllib.request, gzip
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept": "application/json, text/plain, */*"}
def get(url):
    t = time.time()
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=40) as r:
            raw = r.read()
            if r.headers.get("Content-Encoding") == "gzip": raw = gzip.decompress(raw)
            return r.status, raw, time.time() - t
    except Exception as e:
        return str(e)[:120], b"", time.time() - t
tests = {
  "TWSE 上市 全部日收盤": "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
  "TPEx 上櫃 全部日收盤": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes",
  "TWSE 盤中即時(批次)": "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=" + "|".join(f"tse_{s}.tw" for s in ["2330","2317","2454","0050","2881","2882","2303","3711","2412","1301"]) + "|otc_6488.tw|otc_8069.tw",
  "Nasdaq 美股全部": "https://api.nasdaq.com/api/screener/stocks?tableonly=true&download=true",
  "Nasdaq ETF 全部": "https://api.nasdaq.com/api/screener/etf?download=true",
}
for name, url in tests.items():
    st, raw, dt = get(url)
    print(f"\n=== {name}: status={st} size={len(raw)/1024:.0f}KB time={dt:.1f}s")
    try:
        j = json.loads(raw)
        if isinstance(j, list): print("rows:", len(j), "sample:", json.dumps(j[0], ensure_ascii=False)[:300])
        elif "msgArray" in j: print("rows:", len(j["msgArray"]), "sample:", json.dumps(j["msgArray"][0], ensure_ascii=False)[:400])
        else:
            d = j.get("data") or {}
            rows = d.get("rows") or (d.get("data") or {}).get("rows") or []
            print("rows:", len(rows), "keys:", list(d.keys())[:8], "sample:", json.dumps(rows[:2], ensure_ascii=False)[:400])
    except Exception as e:
        print("parse fail", e, raw[:200])
