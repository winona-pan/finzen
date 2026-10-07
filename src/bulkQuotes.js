/* ══════════════════════════════════════════════════════
   全市場報價（排程 fetch_all_quotes.py 產生的 quotes/ 檔案）
   ══════════════════════════════════════════════════════
   台股全部在一份 tw.json（壓縮後約 30KB）；美股依代號第一個字母分成 26 份（每份壓縮後約 20KB）。
   只下載持股／自選股用得到的那幾份，例如只有台股＋VOO、QQQ，就只會下載 tw.json、us/V.json、us/Q.json。
   同一份檔案 1 分鐘內重複要用就直接用記憶體裡的，不重複下載。 */

const CACHE_MS = 60 * 1000;
const cache = new Map(); // path -> { at, data }

function baseUrl() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
}

async function loadFile(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  try {
    const res = await fetch(`${baseUrl()}quotes/${path}?t=${Math.floor(Date.now() / CACHE_MS)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    cache.set(path, { at: Date.now(), data });
    return data;
  } catch {
    return hit?.data || null; // 下載失敗就用上次的（可能是空的）
  }
}

const usShard = (sym) => { const c = sym[0]; return c >= "A" && c <= "Z" ? c : "_"; };
const normUs = (t) => String(t || "").trim().toUpperCase().replace(/[./]/g, "-"); // BRK.B / BRK/B → BRK-B
const normTw = (t) => String(t || "").trim().toUpperCase().replace(/\.(TW|TWO)$/, "");

/* list: [{ ticker, market }] → Map「market:ticker」→ { price, chgPct, name } ；查不到的就不會在 Map 裡 */
export async function getBulkQuotes(list) {
  const out = new Map();
  const items = (list || []).filter(s => s && s.ticker);
  if (!items.length) return out;
  const tw = items.filter(s => s.market !== "US");
  const us = items.filter(s => s.market === "US");
  const [twData, ...usParts] = await Promise.all([
    tw.length ? loadFile("tw.json") : null,
    ...[...new Set(us.map(s => usShard(normUs(s.ticker))))].map(k => loadFile(`us/${k}.json`)),
  ]);
  const put = (s, row) => { if (row && row[0]) out.set(`${s.market}:${s.ticker}`, { price: row[0], chgPct: row[1], name: row[2] }); };
  if (twData) tw.forEach(s => put(s, twData[normTw(s.ticker)]));
  const usData = Object.assign({}, ...usParts.filter(Boolean));
  us.forEach(s => put(s, usData[normUs(s.ticker)]));
  return out;
}
