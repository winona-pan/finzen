"""臨時探測腳本（第三輪）：上櫃清單換方法、上櫃盤中即時（測完會刪掉）"""
import json, subprocess, time
def curl(url, extra=()):
    t = time.time()
    r = subprocess.run(["curl", "-sS", "--compressed", "-m", "90", "--retry", "2", "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36", *extra, url], capture_output=True)
    return r.returncode, r.stdout, time.time() - t, r.stderr.decode()[:150]
def show(name, url, extra=()):
    rc, raw, dt, err = curl(url, extra)
    print(f"\n=== {name}: rc={rc} size={len(raw)/1024:.0f}KB time={dt:.1f}s {err}")
    try:
        j = json.loads(raw)
        if isinstance(j, list): print("rows:", len(j), "sample:", json.dumps(j[0], ensure_ascii=False)[:300]); return j
        if "msgArray" in j: print("rows:", len(j["msgArray"]), "sample:", json.dumps(j["msgArray"][0], ensure_ascii=False)[:300]); return j["msgArray"]
        print(json.dumps(j, ensure_ascii=False)[:300])
    except Exception as e: print("parse fail", e, raw[:150])
otc = show("TPEx 日收盤（curl）", "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes") or []
show("TPEx 本益比清單", "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis")
show("TPEx 上櫃公司基本資料", "https://www.tpex.org.tw/openapi/v1/mopsfe_company_basic_info")
show("TWSE 本益比清單（上市，比較小）", "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL")
codes = [r.get("SecuritiesCompanyCode") or r.get("Code") for r in otc][:100] or ["6488","8069","5347","3105","6547"]
show("上櫃 盤中即時 一次 100 檔", "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=" + "|".join(f"otc_{c}.tw" for c in codes))
