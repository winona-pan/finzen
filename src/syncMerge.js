/* ══════════════════════════════════════════════════════
   雲端同步的三方合併
   ══════════════════════════════════════════════════════
   兩台裝置都改過資料時，不能直接拿其中一份整包蓋掉另一份（那就是「最新幾筆消失」的原因）。
   做法是拿「上次同步時的版本（base）」當基準，比對：
     - 只有本機改過的地方 → 用本機的
     - 只有雲端改過的地方 → 用雲端的
     - 兩邊都改過 → 物件逐欄再合併一次，同一個欄位兩邊都改才以本機為準
   清單（交易、帳戶、目標…）用 id 一筆一筆對：兩邊新增的都留下，
   一邊刪掉、另一邊沒動的就刪掉，一邊刪掉、另一邊有改的就留下（寧可多留也不要弄丟）。 */

const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isIdList = (v) => Array.isArray(v) && v.length > 0 && v.every(x => isObj(x) && x.id != null);

function mergeIdList(base, local, remote) {
  const b = new Map((Array.isArray(base) ? base : []).filter(x => isObj(x) && x.id != null).map(x => [String(x.id), x]));
  const l = new Map(local.map(x => [String(x.id), x]));
  const r = new Map(remote.map(x => [String(x.id), x]));
  const pick = (id) => {
    const bi = b.get(id), li = l.get(id), ri = r.get(id);
    if (li && ri) return mergeValue(bi, li, ri);
    if (li) return bi && same(li, bi) ? undefined : li; // 雲端刪了、本機沒動 → 刪；本機新增或有改 → 留
    if (ri) return bi && same(ri, bi) ? undefined : ri; // 本機刪了、雲端沒動 → 刪；雲端新增或有改 → 留
    return undefined;
  };
  const out = [];
  const seen = new Set();
  // 照雲端的順序，再把只有本機有的接在它原本前一筆的後面（大多數清單是時間順序，新的在後面）
  for (const x of remote) { const id = String(x.id); seen.add(id); const v = pick(id); if (v !== undefined) out.push(v); }
  for (const x of local) { const id = String(x.id); if (seen.has(id)) continue; seen.add(id); const v = pick(id); if (v !== undefined) out.push(v); }
  return out;
}

export function mergeValue(base, local, remote) {
  if (same(local, remote)) return local;
  if (same(local, base)) return remote;   // 只有雲端改了
  if (same(remote, base)) return local;   // 只有本機改了
  // 兩邊都改了
  if ((isIdList(local) || isIdList(remote)) && Array.isArray(local) && Array.isArray(remote)) return mergeIdList(base, local, remote);
  if (Array.isArray(local) && Array.isArray(remote) && local.every(x => !isObj(x)) && remote.every(x => !isObj(x))) {
    // 例如分類名稱清單：兩邊新增的都留，兩邊都沒刪的才留
    const bs = new Set((Array.isArray(base) ? base : []).map(String));
    const ls = new Set(local.map(String)), rs = new Set(remote.map(String));
    const keep = (x) => { const k = String(x); return !(bs.has(k) && (!ls.has(k) || !rs.has(k))); };
    return [...new Set([...remote, ...local])].filter(keep);
  }
  if (isObj(local) && isObj(remote)) {
    const bo = isObj(base) ? base : {};
    const out = {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const inL = k in local, inR = k in remote, inB = k in bo;
      if (inL && inR) out[k] = mergeValue(bo[k], local[k], remote[k]);
      else if (inL) { if (!(inB && same(local[k], bo[k]))) out[k] = local[k]; }
      else if (inR) { if (!(inB && same(remote[k], bo[k]))) out[k] = remote[k]; }
    }
    return out;
  }
  return local; // 單一數值兩邊都改：以這台裝置為準
}

/* base 可能是 null（這台裝置從來沒同步過）：當作空的，兩邊的東西都會留下 */
export function mergeAppData(base, local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  return mergeValue(base || {}, local, remote);
}
