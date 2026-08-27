/* ══════════════════════════════════════════════════════
   Firebase 設定：雲端同步用 + AI 理財顧問（Firebase AI Logic / Gemini）
   ══════════════════════════════════════════════════════
   1. 去 https://console.firebase.google.com 建立專案
   2. 打開 Authentication → Google 登入
   3. 打開 Firestore Database（正式環境模式）
   4. 專案設定 → 你的應用程式 → 新增網頁應用程式，把 config 貼在下面
   5. 左側選單「AI Services → AI Logic」→「開始使用」→ 選「Gemini Developer API」
      （免費、不用連信用卡，專案會留在 Spark 方案）→ 照精靈跑完
   ══════════════════════════════════════════════════════ */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

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

let app = null, auth = null, db = null, googleProvider = null, aiModel = null, aiModelGrounded = null;
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase 初始化失敗", e);
  }
  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    // 模型名稱會隨時間更新／退役，如果顧問突然報錯，先去 https://firebase.google.com/docs/ai-logic/models 確認目前可用的模型名稱
    aiModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
    // 帶「Google 搜尋」工具的版本：問新聞、股價漲跌這種即時性問題時才用這個，一般聊天用上面那個就好，
    // 這個 Gemini 2.5 系列模型每天有 1500 次免費額度，超過才會開始收費，個人使用量不太可能碰到上限
    aiModelGrounded = getGenerativeModel(ai, { model: "gemini-2.5-flash", tools: [{ googleSearch: {} }] });
  } catch (e) {
    console.error("Firebase AI Logic 初始化失敗（要先在 Firebase 主控台開通 AI Logic）", e);
  }
}

export const firebaseEnabled = !!auth;
export const aiEnabled = !!aiModel;
export const aiGroundedEnabled = !!aiModelGrounded;

/* 手機瀏覽器（尤其 iOS Safari）常常會擋掉 signInWithPopup，改用 signInWithRedirect：
   整個頁面導去 Google 登入頁，登入完再導回來，比較不會被瀏覽器的彈窗/第三方限制擋掉 */
export function loginWithGoogle() {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  return signInWithRedirect(auth, googleProvider);
}

/* 從 Google 登入頁導回來後，要呼叫這個把登入結果撈出來（主要是為了抓錯誤訊息；
   實際登入狀態 onAuthStateChanged 也會自動收到，這裡才能拿到失敗原因） */
export function checkRedirectResult() {
  if (!auth) return Promise.resolve(null);
  return getRedirectResult(auth).catch(e => { console.error("登入導回失敗", e); return null; });
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

/* 刪除這個帳號在雲端存的資料（本機資料不會動） */
export async function deleteCloudData(uid) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (e) {
    console.error("刪除雲端資料失敗", e);
    throw e;
  }
}

/* 改暱稱／大頭貼（Firebase Auth 個人資料） */
export async function updateCloudProfile({ displayName, photoURL }) {
  if (!auth?.currentUser) return;
  await updateProfile(auth.currentUser, { displayName, photoURL });
}

/* ── AI 理財顧問：history 是 [{role:"user"|"model", text}]，systemContext 是這次對話要附帶的財務資料摘要。
   grounded=true 會用有連上 Google 搜尋的模型（適合問新聞、股價漲跌這種即時性問題），回傳會多附上參考來源網址。 ── */
export async function askAdvisor(history, systemContext, grounded) {
  const model = grounded ? aiModelGrounded : aiModel;
  if (!model) throw new Error(grounded ? "查新聞功能還沒設定好" : "AI 顧問還沒設定好，先去 Firebase 主控台開通 AI Logic");
  const chatHistory = [
    { role: "user", parts: [{ text: systemContext }] },
    { role: "model", parts: [{ text: "了解，我會根據這些資料回答你的問題。" }] },
    ...history.slice(0, -1).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
  ];
  const chat = model.startChat({ history: chatHistory });
  const lastMsg = history[history.length - 1];
  const result = await chat.sendMessage(lastMsg.text);
  const text = result.response.text();
  // 有連網搜尋時，把參考來源的網址一起附上，讓使用者可以自己點進去看
  const chunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks.map(c => c.web).filter(Boolean).map(w => ({ title: w.title, uri: w.uri }));
  return { text, sources };
}

