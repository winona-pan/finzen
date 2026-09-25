import { useState } from "react";

/* ── 帳戶：獨立一頁，跟目標、訂閱一樣是底部導覽切換的頁面，不是彈窗 ── */
export default function AccountPage({
  tab, setTab, C, iSt, Btn, confirm, upd, TODAY,
  firebaseEnabled, cloudUser, authLoading, syncStatus,
  doCloudLogin, doAppleLogin, doAnonLogin, doCloudLogout, doUpdateNickname, doDeleteCloudData, wipeAllData,
  hideAmounts, toggleHideAmounts, tr,
  doEmailRegister, doEmailLogin, doPasswordReset,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  customCE, buckets, expensePools, watchStocks, watchlist, savingsTargets,
}) {
  if (tab !== "account") return null;

  const exportData = () => {
    const b = new Blob([JSON.stringify({ accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, customCE, buckets, expensePools, watchStocks, watchlist, savingsTargets }, null, 2)], { type:"application/json" });
    const u = URL.createObjectURL(b), a = document.createElement("a");
    a.href = u; a.download = `finzen_${TODAY}.json`; a.click(); URL.revokeObjectURL(u);
  };

  return (
    <div>
      <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTab("settings")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:18, padding:0, marginRight:4 }}>←</button>
          <span style={{ fontSize:18 }}>👤</span>
          <span style={{ fontWeight:900, fontSize:16, color:C.text }}>帳戶</span>
        </div>
      </div>
      <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>
          {!firebaseEnabled ? (
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>還沒設定雲端同步。目前資料只存在這台裝置上。</div>
          ) : authLoading ? (
            <div style={{ fontSize:12, color:C.muted }}>檢查登入狀態中…</div>
          ) : cloudUser ? (
            <LoggedInView cloudUser={cloudUser} syncStatus={syncStatus} doCloudLogout={doCloudLogout} doUpdateNickname={doUpdateNickname} doDeleteCloudData={doDeleteCloudData} confirm={confirm} C={C} iSt={iSt} Btn={Btn} tr={tr} />
          ) : (
            <LoggedOutView doCloudLogin={doCloudLogin} doAppleLogin={doAppleLogin} doAnonLogin={doAnonLogin} doEmailRegister={doEmailRegister} doEmailLogin={doEmailLogin} doPasswordReset={doPasswordReset} confirm={confirm} C={C} iSt={iSt} Btn={Btn} tr={tr} />
          )}

          <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.textSub, marginBottom:8 }}>隱私</div>
            <button onClick={toggleHideAmounts} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, background:hideAmounts?`${C.teal}18`:C.card, border:`1px solid ${hideAmounts?C.teal:C.border}`, cursor:"pointer" }}>
              <span style={{ fontSize:13, fontWeight:700, color:hideAmounts?C.teal:C.text }}>👁️ 隱藏金額（總覽/錢包的數字先模糊，點一下才顯示）</span>
              <span style={{ fontSize:12, color:hideAmounts?C.teal:C.muted }}>{hideAmounts?"開":"關"}</span>
            </button>
          </div>

          <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.textSub, marginBottom:8 }}>資料管理</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              <Btn onClick={exportData} v="secondary" sz="sm">📤 匯出備份</Btn>
              <label style={{ padding:"6px 14px", borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                📥 匯入備份
                <input type="file" accept=".json" onChange={e => {
                  const f = e.target.files[0]; if (!f) return;
                  const r = new FileReader();
                  r.onload = ev => {
                    try {
                      const nd = JSON.parse(ev.target.result);
                      upd("accs", () => nd.accs || []);
                      upd("txns", () => nd.txns || []);
                      upd("debts", () => nd.debts || []);
                      upd("subs", () => nd.subs || []);
                      upd("bills", () => nd.bills || []);
                      upd("stocks", () => nd.stocks || []);
                      upd("pools", () => nd.pools || []);
                      upd("cats", () => nd.cats || cats);
                      upd("rates", () => nd.rates || rates);
                      upd("goals", () => nd.goals || []);
                      upd("policies", () => nd.policies || []);
                      upd("customCE", () => nd.customCE || {});
                      upd("buckets", () => nd.buckets || []);
                      upd("expensePools", () => nd.expensePools || []);
                      upd("watchStocks", () => nd.watchStocks || []);
                      upd("watchlist", () => nd.watchlist || []);
                      upd("savingsTargets", () => nd.savingsTargets || []);
                      alert("✅ 匯入成功！頁面即將重新整理");
                      window.location.reload();
                    } catch { alert("❌ 備份檔案格式毀損或錯誤"); }
                  };
                  r.readAsText(f);
                }} style={{ display:"none" }} />
              </label>
              <Btn onClick={() => {
                confirm(cloudUser ? "確定要清空所有資料嗎？本機跟雲端備份都會一起清空，無法復原，建議先匯出備份。" : "確定要清空所有資料嗎？無法復原，建議先匯出備份。", () => wipeAllData(), "確認清空");
              }} v="danger" sz="sm">🗑 清空</Btn>
            </div>
            <div style={{ fontSize:11, color:C.muted }}>資料存在本機瀏覽器，建議定期匯出備份。</div>
          </div>
      </div>
    </div>
  );
}

/* 品牌圖示：Google 官方四色 G、Apple logo ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.9 29.6 5 24 5c-7.4 0-13.7 4.1-17 10.2z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.6 5.6C41.4 36 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 384 512" fill="#fff" style={{ flexShrink:0 }}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

function LoggedOutView({ doCloudLogin, doAppleLogin, doAnonLogin, doEmailRegister, doEmailLogin, doPasswordReset, confirm, C, iSt, Btn, tr }) {
  const [busy, setBusy] = useState(null); // "google" | "apple" | null
  const runLogin = async (which, fn) => {
    setBusy(which);
    try { await fn(); } finally { setBusy(null); }
  };
  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:22 }}>
        <div style={{ width:56, height:56, borderRadius:16, margin:"0 auto 12px", background:`linear-gradient(135deg,${C.accent},${C.accentD||C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:`0 8px 24px ${C.accent}44` }}>💰</div>
        <div style={{ fontSize:16, fontWeight:900, color:C.text, marginBottom:4 }}>歡迎回來</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, padding:"0 8px" }}>
          登入後可以在多個裝置之間同步資料。第一次登入會把這台裝置目前的資料上傳成雲端的起始版本；之後每台登入同一個帳號的裝置都會用雲端最新的資料。
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={() => runLogin("google", doCloudLogin)} disabled={busy!==null}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"12px 16px", borderRadius:12, background:"#fff", border:"1px solid #dadce0", color:"#3c4043", fontWeight:700, fontSize:14, cursor:busy?"default":"pointer", opacity:busy&&busy!=="google"?0.5:1, transition:"opacity .15s" }}>
          {busy==="google" ? <Spinner color="#3c4043" /> : <GoogleIcon />}
          {busy==="google" ? "登入中…" : "使用 Google 帳號登入"}
        </button>
        <button onClick={() => runLogin("apple", doAppleLogin)} disabled={busy!==null}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"12px 16px", borderRadius:12, background:"#000", border:"1px solid #000", color:"#fff", fontWeight:700, fontSize:14, cursor:busy?"default":"pointer", opacity:busy&&busy!=="apple"?0.5:1, transition:"opacity .15s" }}>
          {busy==="apple" ? <Spinner color="#fff" /> : <AppleIcon />}
          {busy==="apple" ? "登入中…" : "使用 Apple 登入"}
        </button>
        <button onClick={() => confirm(tr("匿名登入沒有帳號/密碼，換瀏覽器或清除瀏覽器資料後就沒辦法登入回這個帳號，資料等於救不回來。真的要用匿名登入嗎？"), doAnonLogin)}
          style={{ width:"100%", padding:"10px 12px", borderRadius:10, background:"none", border:`1px dashed ${C.border}`, color:C.muted, fontWeight:700, fontSize:12, cursor:"pointer" }}>
          先不綁帳號，用匿名登入試試看
        </button>
      </div>
      <EmailLoginPanel doEmailRegister={doEmailRegister} doEmailLogin={doEmailLogin} doPasswordReset={doPasswordReset} C={C} iSt={iSt} Btn={Btn} />
    </div>
  );
}

function Spinner({ color = "#fff", size = 16 }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size, borderRadius:"50%",
      border:`2px solid ${color}33`, borderTopColor:color,
      animation:"finzenSpin .7s linear infinite", flexShrink:0,
    }} />
  );
}

/* ── Email／密碼登入面板：收合起來預設不打開，不想用信箱登入的人不會被打擾 ── */
function EmailLoginPanel({ doEmailRegister, doEmailLogin, doPasswordReset, C, iSt, Btn }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) { setMsg({ ok:false, text:"信箱跟密碼都要填" }); return; }
    setBusy(true); setMsg(null);
    const fn = mode === "login" ? doEmailLogin : doEmailRegister;
    const res = await fn(email, password);
    setBusy(false);
    if (!res.ok) setMsg({ ok:false, text: res.error });
  };

  const forgot = async () => {
    if (!email) { setMsg({ ok:false, text:"先在上面填信箱，才能寄重設密碼信" }); return; }
    setBusy(true);
    const res = await doPasswordReset(email);
    setBusy(false);
    setMsg(res.ok ? { ok:true, text:"重設密碼信已寄出，去信箱收信吧" } : { ok:false, text:res.error });
  };

  return (
    <div style={{ marginTop:10 }}>
      <button onClick={() => setOpen(p=>!p)} style={{ width:"100%", textAlign:"center", padding:8, background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer" }}>
        {open ? "▲ 收起" : "或用信箱＋密碼登入 ▼"}
      </button>
      <div style={{ display:"grid", gridTemplateRows: open ? "1fr" : "0fr", transition:"grid-template-rows .25s ease", overflow:"hidden" }}>
        <div style={{ minHeight:0, overflow:"hidden" }}>
          <div style={{ padding:12, borderRadius:12, background:C.card, border:`1px solid ${C.border}`, opacity:open?1:0, transition:"opacity .2s ease .05s" }}>
            <div style={{ display:"flex", gap:6, marginBottom:10 }}>
              <button onClick={() => { setMode("login"); setMsg(null); }} style={{ flex:1, padding:6, borderRadius:8, background:mode==="login"?`${C.accent}20`:C.bg, border:`1px solid ${mode==="login"?C.accent:C.border}`, color:mode==="login"?C.accentL:C.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>登入</button>
              <button onClick={() => { setMode("register"); setMsg(null); }} style={{ flex:1, padding:6, borderRadius:8, background:mode==="register"?`${C.accent}20`:C.bg, border:`1px solid ${mode==="register"?C.accent:C.border}`, color:mode==="register"?C.accentL:C.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>註冊新帳號</button>
            </div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="信箱" style={{ ...iSt, marginBottom:8 }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密碼（至少6碼）" style={{ ...iSt, marginBottom:8 }} />
            {msg && <div style={{ fontSize:11, color:msg.ok?C.teal:C.danger, marginBottom:8 }}>{msg.text}</div>}
            <Btn style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }} disabled={busy} onClick={submit}>{busy && <Spinner size={14} />}{busy ? "處理中…" : mode==="login" ? "登入" : "註冊並登入"}</Btn>
            {mode === "login" && <button onClick={forgot} disabled={busy} style={{ width:"100%", marginTop:8, background:"none", border:"none", color:C.accentL, fontSize:11, cursor:"pointer" }}>忘記密碼？</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 已登入畫面：個人資料、同步狀態、登出、清除雲端備份——三個動作分開放，標示清楚各自的影響範圍 ── */
function LoggedInView({ cloudUser, syncStatus, doCloudLogout, doUpdateNickname, doDeleteCloudData, confirm, C, iSt, Btn, tr }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(cloudUser.displayName || "");
  const [saving, setSaving] = useState(false);
  const isAnon = cloudUser.isAnonymous;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        {cloudUser.photoURL && <img src={cloudUser.photoURL} alt="" style={{ width:44, height:44, borderRadius:"50%" }} />}
        <div style={{ flex:1 }}>
          {editingName ? (
            <div style={{ display:"flex", gap:6 }}>
              <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)} style={{ ...iSt, padding:"5px 8px", fontSize:13 }} />
              <button disabled={saving} onClick={async () => { setSaving(true); await doUpdateNickname(nameDraft.trim() || cloudUser.email || "使用者"); setSaving(false); setEditingName(false); }} style={{ padding:"5px 10px", borderRadius:8, background:C.accent, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>{saving?"…":"儲存"}</button>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{cloudUser.displayName || (isAnon ? "匿名使用者" : cloudUser.email)}</div>
              <button onClick={() => { setNameDraft(cloudUser.displayName || ""); setEditingName(true); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:12 }}>✏️</button>
            </div>
          )}
          <div style={{ fontSize:11, color:C.muted }}>{isAnon ? "匿名帳號（沒有信箱，換裝置無法登入回來）" : cloudUser.email}</div>
        </div>
      </div>
      <div style={{ fontSize:11, color:syncStatus==="error"?C.expense:C.teal, marginBottom:16 }}>
        {syncStatus === "pending" ? "⏳ 同步中…" : syncStatus === "error" ? "⚠️ 同步失敗，稍後會自動重試" : "✅ 已同步到雲端"}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ padding:12, borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:6 }}>登出</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:8, lineHeight:1.6 }}>這台裝置的資料還是會留著，只是不再同步。</div>
          <Btn v="secondary" style={{ width:"100%" }} onClick={() => confirm(tr("確定登出嗎？"), doCloudLogout)}>{tr("登出")}</Btn>
        </div>

        <div style={{ padding:12, borderRadius:12, background:`${C.warn}10`, border:`1px solid ${C.warn}33` }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.warn, marginBottom:6 }}>清除雲端備份的資料</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:8, lineHeight:1.6 }}>只刪雲端那份備份，這台裝置本機的資料完全不會動；刪除後系統會馬上用這台裝置目前的資料重新備份一份上去。</div>
          <Btn v="secondary" style={{ width:"100%" }} onClick={() => confirm(tr("確定清除雲端備份的資料嗎？"), () => doDeleteCloudData())}>{tr("清除雲端備份")}</Btn>
        </div>
      </div>
    </div>
  );
}
