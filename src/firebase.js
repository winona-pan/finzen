/* ══════════════════════════════════════════════════════
   Firebase 設定：雲端同步用 + AI 理財顧問（Firebase AI Logic / Gemini）
   ══════════════════════════════════════════════════════
   1. 去 https://console.firebase.google.com 建立專案
   2. 打開 Authentication → 啟用「Google」登入，也可以順便啟用「Email/Password」（信箱/密碼）、「匿名」、「Apple」當備用登入方式（Apple 需要額外的 Apple Developer 設定，比較麻煩，可以先跳過）
   3. 打開 Firestore Database（正式環境模式）
   4. 專案設定 → 你的應用程式 → 新增網頁應用程式，把 config 貼在下面
   5. 左側選單「AI Services → AI Logic」→「開始使用」→ 選「Gemini Developer API」
      （免費、不用連信用卡，專案會留在 Spark 方案）→ 照精靈跑完
   ══════════════════════════════════════════════════════ */
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithRedirect, signInWithPopup, getRedirectResult, signOut, onAuthStateChanged, updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, deleteDoc, runTransaction, onSnapshot } from "firebase/firestore";
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

let app = null, auth = null, db = null, googleProvider = null, appleProvider = null, aiModel = null, aiModelGrounded = null;
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // 只在本機開發測試時（npm run dev 加上 VITE_FIREBASE_EMULATOR=1）連到本機模擬器，正式網站不會用到
    if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
    googleProvider = new GoogleAuthProvider();
    appleProvider = new OAuthProvider("apple.com");
  } catch (e) {
    console.error("Firebase 初始化失敗", e);
  }
  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    // 模型名稱會隨時間更新／退役：2.5-flash 已經被 Google 停用，改用 3.6-flash（如果顧問又報錯，錯誤訊息通常會直接告訴你該換成哪個新模型名稱）
    aiModel = getGenerativeModel(ai, { model: "gemini-3.6-flash" });
    // 帶「Google 搜尋」工具的版本：問新聞、股價漲跌這種即時性問題時才用這個，一般聊天用上面那個就好
    aiModelGrounded = getGenerativeModel(ai, { model: "gemini-3.6-flash", tools: [{ googleSearch: {} }] });
  } catch (e) {
    console.error("Firebase AI Logic 初始化失敗（要先在 Firebase 主控台開通 AI Logic）", e);
  }
}

export const firebaseEnabled = !!auth;
export const aiEnabled = !!aiModel;
export const aiGroundedEnabled = !!aiModelGrounded;

/* 手機瀏覽器（尤其 iOS Safari）的隱私保護機制，常常會讓整頁導轉（signInWithRedirect）
   卡在 firebaseapp.com 那個空白頁面回不來——這是 Firebase 導轉登入在 iOS Safari 上一個滿常見的相容性問題，
   沒有保證有效的純程式解法。改成優先試「彈出視窗」，卡住/被瀏覽器擋掉彈窗的話才退回整頁導轉當備援。 */
export async function loginWithGoogle() {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") {
      return signInWithRedirect(auth, googleProvider);
    }
    throw e;
  }
}

/* Apple 登入：跟 Google 一樣，先試彈出視窗，卡住才退回整頁導轉。要先在 Firebase 主控台 Authentication 開啟「Apple」提供者，
   而且要有 Apple Developer 帳號設定 Service ID，比 Google 麻煩一些，沒設定的話按下去會直接報錯 */
export async function loginWithApple() {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  try {
    return await signInWithPopup(auth, appleProvider);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") {
      return signInWithRedirect(auth, appleProvider);
    }
    throw e;
  }
}

/* 匿名登入：不用任何帳號就能用雲端同步，缺點是換瀏覽器/清資料就找不回來了，沒有辦法「登入」回同一個匿名帳號 */
export function loginAnonymously() {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  return signInAnonymously(auth);
}

/* 從 Google 登入頁導回來後，要呼叫這個把登入結果撈出來（主要是為了抓錯誤訊息；
   實際登入狀態 onAuthStateChanged 也會自動收到，這裡才能拿到失敗原因） */
export function checkRedirectResult() {
  if (!auth) return Promise.resolve(null);
  // 不要在這裡吞掉錯誤——外面呼叫的地方要能看到真正的失敗原因（例如網域沒授權、Apple 還沒在後台開通），
  // 不然使用者按了登入、被導去 Google/Apple 頁面繞一圈回來，畫面上什麼都沒發生，完全不知道發生了什麼事
  return getRedirectResult(auth);
}

/* Email／密碼登入：Google 登入不方便時的替代方案（例如某些瀏覽器環境擋掉導轉） */
export function registerWithEmail(email, password) {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  return createUserWithEmailAndPassword(auth, email, password);
}
export function loginWithEmail(email, password) {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  return signInWithEmailAndPassword(auth, email, password);
}
export function resetPassword(email) {
  if (!auth) return Promise.reject(new Error("Firebase 尚未設定"));
  return sendPasswordResetEmail(auth, email);
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

/* 讀取這個帳號雲端存的完整資料：回傳 { data, updatedAt }，雲端還沒有資料時 data 是 null。
   讀取失敗（網路斷掉等）一定要丟出錯誤，不能回傳 null——不然外面會誤以為「雲端沒資料」，
   把這台裝置可能是舊的資料傳上去蓋掉雲端，資料就不見了 */
export async function loadCloudData(uid) {
  if (!db) return { data: null, updatedAt: 0 };
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return { data: null, updatedAt: 0 };
  const v = snap.data();
  return { data: v.appData || null, updatedAt: v.updatedAt || 0 };
}

/* 把整包資料存到這個帳號的雲端，回傳這次寫入的時間戳。失敗會丟出錯誤，讓外面知道沒存成功、之後要重試 */
export async function saveCloudData(uid, data) {
  if (!db) return 0;
  const updatedAt = Date.now();
  await setDoc(doc(db, "users", uid), { appData: data, updatedAt });
  return updatedAt;
}

/* 只在「雲端還是上次同步的那一版」時才寫入（用 transaction 確認），避免把別台裝置剛存的新資料整包蓋掉。
   回傳 { ok:true, updatedAt }；雲端已經被別台裝置改過的話回傳 { ok:false, remote:{ data, updatedAt } }，讓外面先合併再重試 */
export async function saveCloudDataIfUnchanged(uid, data, expectedUpdatedAt) {
  if (!db) return { ok: true, updatedAt: 0 };
  const ref = doc(db, "users", uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const remoteAt = snap.exists() ? (snap.data().updatedAt || 0) : 0;
    if (snap.exists() && snap.data().appData && remoteAt !== expectedUpdatedAt) {
      return { ok: false, remote: { data: snap.data().appData, updatedAt: remoteAt } };
    }
    const updatedAt = Math.max(Date.now(), remoteAt + 1);
    tx.set(ref, { appData: data, updatedAt });
    return { ok: true, updatedAt };
  });
}

/* 即時監聽雲端資料：別台裝置一存檔，這台開著的 App 馬上收到，不會拿著舊資料繼續用。回傳取消監聽的函式 */
export function watchCloudData(uid, cb) {
  if (!db) return () => {};
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.metadata.hasPendingWrites || !snap.exists()) return; // 自己還在送出中的寫入不用理
    const v = snap.data();
    if (v.appData) cb({ data: v.appData, updatedAt: v.updatedAt || 0 });
  }, (e) => console.error("監聽雲端資料失敗", e));
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
  ];
  /* Gemini 規定 user/model 一定要輪流出現：之前某一題問失敗（例如撞到額度）時，那句 user 留在紀錄裡卻沒有 model 回覆，
     下一題就會變成 user 接 user 而整個被拒絕。這裡把沒被回答的問題略過，只送一問一答成對的歷史 */
  for (const m of history.slice(0, -1)) {
    const last = chatHistory[chatHistory.length - 1];
    if (m.role === last.role) {
      if (m.role === "user") last.parts = [{ text: m.text }];
      else last.parts = [{ text: last.parts[0].text + "\n\n" + m.text }];
    } else {
      chatHistory.push({ role: m.role, parts: [{ text: m.text }] });
    }
  }
  if (chatHistory[chatHistory.length - 1].role === "user") chatHistory.pop();
  const chat = model.startChat({ history: chatHistory });
  const lastMsg = history[history.length - 1];
  const result = await chat.sendMessage(lastMsg.text);
  const text = result.response.text();
  // 有連網搜尋時，把參考來源的網址一起附上，讓使用者可以自己點進去看
  const chunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks.map(c => c.web).filter(Boolean).map(w => ({ title: w.title, uri: w.uri }));
  return { text, sources };
}

