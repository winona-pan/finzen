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

function LoggedOutView({ doCloudLogin, doAppleLogin, doAnonLogin, doEmailRegister, doEmailLogin, doPasswordReset, confirm, C, iSt, Btn, tr }) {
  return (
    <div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
        登入後可以在多個裝置之間同步資料。第一次登入會把這台裝置目前的資料上傳成雲端的起始版本；之後每台登入同一個帳號的裝置都會用雲端最新的資料。
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <Btn onClick={doCloudLogin}>使用 Google 帳號登入</Btn>
        <Btn v="secondary" onClick={doAppleLogin}>使用 Apple 登入</Btn>
        <button onClick={() => confirm(tr("匿名登入沒有帳號/密碼，換瀏覽器或清除瀏覽器資料後就沒辦法登入回這個帳號，資料等於救不回來。真的要用匿名登入嗎？"), doAnonLogin)}
          style={{ width:"100%", padding:"10px 12px", borderRadius:10, background:"none", border:`1px dashed ${C.border}`, color:C.muted, fontWeight:700, fontSize:12, cursor:"pointer" }}>
          先不綁帳號，用匿名登入試試看
        </button>
      </div>
      <EmailLoginPanel doEmailRegister={doEmailRegister} doEmailLogin={doEmailLogin} doPasswordReset={doPasswordReset} C={C} iSt={iSt} Btn={Btn} />
    </div>
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
      {open && (
        <div style={{ padding:12, borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <button onClick={() => { setMode("login"); setMsg(null); }} style={{ flex:1, padding:6, borderRadius:8, background:mode==="login"?`${C.accent}20`:C.bg, border:`1px solid ${mode==="login"?C.accent:C.border}`, color:mode==="login"?C.accentL:C.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>登入</button>
            <button onClick={() => { setMode("register"); setMsg(null); }} style={{ flex:1, padding:6, borderRadius:8, background:mode==="register"?`${C.accent}20`:C.bg, border:`1px solid ${mode==="register"?C.accent:C.border}`, color:mode==="register"?C.accentL:C.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>註冊新帳號</button>
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="信箱" style={{ ...iSt, marginBottom:8 }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密碼（至少6碼）" style={{ ...iSt, marginBottom:8 }} />
          {msg && <div style={{ fontSize:11, color:msg.ok?C.teal:C.danger, marginBottom:8 }}>{msg.text}</div>}
          <Btn style={{ width:"100%" }} disabled={busy} onClick={submit}>{busy ? "處理中…" : mode==="login" ? "登入" : "註冊並登入"}</Btn>
          {mode === "login" && <button onClick={forgot} disabled={busy} style={{ width:"100%", marginTop:8, background:"none", border:"none", color:C.accentL, fontSize:11, cursor:"pointer" }}>忘記密碼？</button>}
        </div>
      )}
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
