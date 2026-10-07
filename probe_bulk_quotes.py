"""臨時探測腳本（第二輪）：上櫃清單、盤中即時一次能查幾檔（測完會刪掉）"""
import json, time, urllib.request, gzip, http.client
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept": "application/json, text/plain, */*", "Accept-Encoding": "gzip"}
def get(url, timeout=60):
    t = time.time()
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            try: raw = r.read()
            except http.client.IncompleteRead as e: return "incomplete", e.partial, time.time()-t
            if r.headers.get("Content-Encoding") == "gzip": raw = gzip.decompress(raw)
            return r.status, raw, time.time() - t
    except Exception as e:
        return str(e)[:120], b"", time.time() - t
def show(name, url):
    st, raw, dt = get(url)
    print(f"\n=== {name}: status={st} size={len(raw)/1024:.0f}KB time={dt:.1f}s")
    try:
        j = json.loads(raw)
        if isinstance(j, list): print("rows:", len(j), "sample:", json.dumps(j[0], ensure_ascii=False)[:350]); return j
        if "msgArray" in j: print("rows:", len(j["msgArray"]), "sample:", json.dumps(j["msgArray"][-1], ensure_ascii=False)[:350]); return j["msgArray"]
        print("keys", list(j.keys())[:10], json.dumps(j, ensure_ascii=False)[:400]); return j
    except Exception as e:
        print("parse fail", e, raw[:200])
# 上櫃：gzip 再試一次；以及較小的「公司基本資料」清單
show("TPEx 上櫃 日收盤（gzip）", "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes")
show("TPEx 上櫃 盤後行情（舊版）", "https://www.tpex.org.tw/web/stock/aftertrading/otc_quotes_no1430/stk_wn1430_result.php?l=zh-tw&o=json")
show("證交所 ISIN 上櫃清單", "https://isin.twse.com.tw/isin/C_public.jsp?strMode=4")
twse = show("TWSE 上市 全部日收盤", "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL") or []
codes = [r["Code"] for r in twse][:400]
for n in (50, 100, 200):
    q = "|".join(f"tse_{c}.tw" for c in codes[:n])
    rows = show(f"盤中即時 一次 {n} 檔", "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=" + q)
    time.sleep(2)
show("GitHub Pages 目前網站", "https://winona-pan.github.io/finzen/stock_prices.json")
