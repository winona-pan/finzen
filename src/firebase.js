/* ══════════════════════════════════════════════════════
   Firebase 設定：雲端同步用
   ══════════════════════════════════════════════════════
   1. 去 https://console.firebase.google.com 建立專案
   2. 打開 Authentication → Google 登入
   3. 打開 Firestore Database（正式環境模式）
   4. 專案設定 → 你的應用程式 → 新增網頁應用程式，把 config 貼在下面
   ══════════════════════════════════════════════════════ */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// TODO：把這裡換成你自己 Firebase 專案設定頁複製出來的物件
const firebaseConfig = {
  apiKey: "AIzaSyCgfpMSsAz-LqBqlsT5kJTG17HipDaRTBI",
  authDomain: "finzen-60788.firebaseapp.com",
  projectId: "finzen-60788",
  storageBucket: "finzen-60788.firebasestorage.app",
  messagingSenderId: "412465817454",
  appId: "1:412465817454:web:b64718d8ee5ab34d5c837f",
  measurementId: "G-DLWK2CWPZH",
};

// 如果還沒填真的 config，就不要讓整個 App 掛掉——雲端同步功能會自動停用，本機 localStorage 照常運作
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let app = null, auth = null, db = null, googleProvider = null;
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase 初始化失敗", e);
  }
}

export const firebaseEnabled = !!auth;

export function loginWithGoogle() {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  return signInWithPopup(auth, googleProvider);
}

export function logoutFirebase() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

/* cb(user | null) 會在登入狀態改變時被呼叫；回傳一個 unsubscribe 函式 */
export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

/* 讀取這個帳號雲端存的完整資料，沒有的話回傳 null */
export async function loadCloudData(uid) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data().appData || null : null;
  } catch (e) {
    console.error("讀取雲端資料失敗", e);
    return null;
  }
}

/* 把整包資料存到這個帳號的雲端 */
export async function saveCloudData(uid, data) {
  if (!db) return;
  try {
    await setDoc(doc(db, "users", uid), { appData: data, updatedAt: Date.now() });
  } catch (e) {
    console.error("寫入雲端資料失敗", e);
  }
}
