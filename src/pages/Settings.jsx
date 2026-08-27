import { useState } from "react";

export default function SettingsPage({ 
  C, tab, setTab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo,
  collapsed, toggleSection, APP_VER, changeTheme, THEMES, theme,
  customCE, buckets, expensePools, watchStocks, watchlist, savingsTargets,
  allocSettings, setAllocSettings,
  firebaseEnabled, cloudUser, authLoading, syncStatus, doCloudLogin, doCloudLogout, doUpdateNickname, doDeleteCloudData, wipeAllData,
  doEmailRegister, doEmailLogin, doPasswordReset,
  hideAmounts, toggleHideAmounts,
  lang, changeLang, tr, LANGUAGES,
  aiEnabled,
  // 接收全域共用 UI 元件
  Card, SH, Btn, Sl
}) {

  return (
    <>
      {tab === "settings" && (
        <div>
          <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>☰</span>
              <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{tr("more_title")}</span>
            </div>
          </div>
          
          <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>

            {/* 快速導覽：搬出底部導覽列的功能 + 各自獨立成頁的功能 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <button onClick={() => setTab("goals")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🎯</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{tr("more_goals_card")}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{(goals||[]).length} 個目標</div>
              </button>
              <button onClick={() => setTab("subsbills")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🔁</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{tr("more_subs_card")}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{(subs||[]).filter(s=>s.active).length + (bills||[]).filter(b=>b.active).length} 個進行中</div>
              </button>
              <button onClick={() => setTab("account")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>👤</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>帳戶</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{cloudUser ? "已同步" : "登入 / 資料管理"}</div>
              </button>
              <button onClick={() => setTab("userGuide")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>📖</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>使用手冊</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>怎麼用每一頁功能</div>
              </button>
              <button onClick={() => setTab("theme")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🎨</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>外觀主題</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{THEMES[theme]?.name || "深色"}</div>
              </button>
              <button onClick={() => setTab("language")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🌐</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>語言</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{LANGUAGES[lang]?.name || "繁體中文"}</div>
              </button>
              <button onClick={() => setModal("catSet")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>🏷️</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>類別管理</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{[...cats.expense, ...cats.income].length} 個類別</div>
              </button>
              <button onClick={() => setTab("advisor")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left", gridColumn:"1 / -1" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:26 }}>🤖</div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:14, color:C.text }}>AI 理財顧問</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{aiEnabled ? "問問題，會參考你的財務資料回答" : "還沒設定，點進去看怎麼開通"}</div>
                  </div>
                </div>
              </button>
            </div>

            {/* 分享 */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <SH title="分享給親友" />
              <div style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.6 }}>
                覺得好用的話，把這個 app 分享給朋友或家人吧！
              </div>
              <Btn style={{ width:"100%" }} onClick={async () => {
                const shareUrl = "https://winona-pan.github.io/finzen";
                const shareData = { title: "FinZen 財務管理", text: "我在用這個記帳/理財規劃 app，你也可以試試看！", url: shareUrl };
                if (navigator.share) {
                  try { await navigator.share(shareData); } catch (e) { /* 使用者取消分享，不用特別處理 */ }
                } else {
                  try { await navigator.clipboard.writeText(shareUrl); alert("連結已複製，貼給朋友吧！"); } catch (e) { alert(shareUrl); }
                }
              }}>📤 分享 FinZen</Btn>
            </Card>

            {/* App info */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <SH title={tr("settings_about")} />
              <div style={{ fontSize:13, color:C.textSub, lineHeight:1.8 }}>
                <div>{tr("app_name")}</div>
                <div style={{ color:C.muted }}>版本 {APP_VER}</div>
                <div style={{ marginTop:8, color:C.muted, fontSize:12 }}>資料預設只存在這台裝置；如果你有登入雲端同步，也會備份到你自己的 Firebase 帳號，不會有其他人看得到。</div>
              </div>
            </Card>

          </div>
        </div>
      )}
    </>
  );
}

