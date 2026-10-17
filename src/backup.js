/* ══════════════════════════════════════════════════════
   本機自動備份（IndexedDB）
   ══════════════════════════════════════════════════════
   雲端同步要把這台裝置的資料換掉或合併之前，先在這裡存一份快照，只留最近 3 份。
   放 IndexedDB 不放 localStorage：localStorage 全部只有約 5MB，資料本身就可能快 1MB，
   多放幾份備份很容易塞爆，連正常資料都存不進去。
   任何一步失敗都只記 log、不丟錯誤——備份是安全網，不能因為它壞掉就擋住同步。 */

const DB_NAME = "finzen_backups";
const STORE = "snapshots";
const KEEP = 3;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "at" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

/* 列出備份，新的在前；回傳 [{ at, reason, data }] */
export async function listBackups() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const all = await new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return all.sort((a, b) => b.at - a.at);
  } catch (e) {
    console.error("讀取本機備份失敗", e);
    return [];
  }
}

/* 存一份快照，超過 3 份就把最舊的刪掉 */
export async function saveBackup(data, reason) {
  if (!data) return;
  try {
    const old = await listBackups();
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ at: Date.now(), reason, data });
    old.slice(KEEP - 1).forEach(b => store.delete(b.at));
    await done(tx);
    db.close();
  } catch (e) {
    console.error("存本機備份失敗", e);
  }
}

/* 「清空所有資料」時連備份一起清掉，不然說清空了其實還留著 */
export async function clearBackups() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    await done(tx);
    db.close();
  } catch (e) {
    console.error("清除本機備份失敗", e);
  }
}
