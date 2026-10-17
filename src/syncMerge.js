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

/* 登入讀到雲端資料（雲端已經有資料）時，決定這台裝置最後要用哪一份。
   回傳 { data, upload, backupReason }：data 是要用的資料；upload 為 true 代表結果跟雲端不同、要傳上去；
   backupReason 有值代表本機資料會被換掉或合併，套用前要先備份。
   以前是「沒有待上傳標記就直接用雲端整包蓋掉本機」——打開 App 時雲端還在讀、或沒登入時記的帳都沒有標記，就這樣不見。現在：
   - 這台裝置沒有自己的資料，或資料屬於別的帳號 → 用雲端的（別的帳號的資料不能混進來）
   - 有上次同步的版本當基準 → 三方合併，兩邊各自改的都留下
   - 沒有基準（這台裝置沒跟這個帳號同步過）→ 清單兩邊都留，同一個欄位兩邊不一樣時以雲端為準
     （本機那份可能是從預設值開始記的，例如帳戶餘額，不能拿來蓋掉雲端的） */
export function reconcileOnLogin({ local, hasLocal, owner, uid, base, cloud }) {
  if (!hasLocal || (owner && owner !== uid)) {
    return { data: cloud, upload: false, backupReason: hasLocal ? "換成另一個帳號的雲端資料前" : null };
  }
  const merged = base ? mergeAppData(base, local, cloud) : mergeAppData(null, cloud, local);
  // 結果跟雲端一樣：有基準時代表本機改的都已經在雲端了，不用備份；沒基準時本機某些欄位會被雲端的值取代，先備份
  if (same(merged, cloud)) return { data: cloud, upload: false, backupReason: base || same(local, cloud) ? null : "登入時換成雲端資料前" };
  return { data: merged, upload: true, backupReason: "登入時跟雲端合併前" };
}
