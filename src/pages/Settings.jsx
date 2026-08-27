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

  /* ── 內部封裝的備份匯出函數 ── */
  const exportData = () => { 
    const b = new Blob([JSON.stringify({ accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, customCE, buckets, expensePools, watchStocks, watchlist, savingsTargets }, null, 2)], { type:"application/json" }); 
    const u = URL.createObjectURL(b), a = document.createElement("a"); 
    a.href = u; a.download = `finzen_${TODAY}.json`; a.click(); URL.revokeObjectURL(u); 
  };

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

            {/* 快速導覽：搬出底部導覽列的功能 + 帳戶/使用手冊獨立頁 */}
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
              <button onClick={() => setModal("account")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>👤</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>帳戶</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{cloudUser ? "已同步" : "登入 / 隱私設定"}</div>
              </button>
              <button onClick={() => setModal("userGuide")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:26, marginBottom:6 }}>📖</div>
                <div style={{ fontWeight:900, fontSize:14, color:C.text }}>使用手冊</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>怎麼用每一頁功能</div>
              </button>
              <button onClick={() => setModal("advisor")} style={{ padding:"18px 14px", borderRadius:16, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left", gridColumn:"1 / -1" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:26 }}>🤖</div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:14, color:C.text }}>AI 理財顧問</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{aiEnabled ? "問問題，會參考你的財務資料回答" : "還沒設定，點進去看怎麼開通"}</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Theme */}
            <Card style={{ padding:14, marginBottom:12 }}>
              <SH title="外觀主題" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {Object.entries(THEMES).map(([k, th]) => (
                  <button key={k} onClick={() => changeTheme(k)}
                    style={{ padding:"10px 12px", borderRadius:12, border:`2px solid ${theme===k ? th.accent : C.border}`,
                      background: theme===k ? `${th.accent}20` : C.card, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                    <span style={{ fontSize:20 }}>{th.icon}</span>
                    <div>
                      <div style={{ fontWeight:900, fontSize:13, color: theme===k ? th.accent : C.text }}>{th.name}</div>
                      <div style={{ display:"flex", gap:3, marginTop:3 }}>
                        {[th.bg, th.accent, th.income, th.expense].map((col,i) => (
                          <div key={i} style={{ width:10, height:10, borderRadius:3, background:col, border:"1px solid rgba(128,128,128,0.2)" }} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Language */}
            <Card style={{ padding:14, marginBottom:12 }}>
              <SH title={`🌐 ${tr("settings_language")}`} />
              <div style={{ fontSize:11, color:C.muted, marginBottom:10, lineHeight:1.6 }}>
                目前涵蓋底部導覽、常用按鈕、設定頁主要標題；其他頁面的詳細文字還在陸續翻譯中，沒翻到的地方會顯示繁體中文。
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {Object.entries(LANGUAGES).map(([k, l]) => (
                  <button key={k} onClick={() => changeLang(k)}
                    style={{ padding:"10px 12px", borderRadius:12, border:`2px solid ${lang===k ? C.accent : C.border}`,
                      background: lang===k ? `${C.accent}20` : C.card, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:8, textAlign:"left" }}>
                    <span style={{ fontSize:18 }}>{l.flag}</span>
                    <span style={{ fontWeight:700, fontSize:13, color: lang===k ? C.accentL : C.text }}>{l.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Category management */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <SH title="類別管理" right={<button onClick={() => setModal("catSet")} style={{ fontSize:12, color:C.accentL, background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>編輯 →</button>} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {[...cats.expense, ...cats.income].slice(0,12).map(cat => (
                  <div key={cat} style={{ padding:"4px 10px", borderRadius:10, background:`${C.accent}15`, fontSize:12, color:C.textSub }}>
                    {ceMap[cat]||"📦"} {cat}
                  </div>
                ))}
              </div>
            </Card>

            {/* Data management */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <SH title="資料管理" />
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
                        // 安全調用全域狀態更新通道
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
                  const step3 = () => confirm("最後一次確認：這個動作無法復原，所有記帳、投資、往來帳資料都會永久消失。真的要清空嗎？", () => {
                    wipeAllData();
                  }, "確認清空");
                  const step2 = () => confirm(cloudUser ? "再次確認：所有帳戶、交易、投資、往來帳資料都會消失（連同雲端備份），建議先匯出備份。要繼續嗎？" : "再次確認：所有帳戶、交易、投資、往來帳資料都會消失，建議先匯出備份。要繼續嗎？", step3, "繼續", true);
                  confirm("確定要清空所有資料嗎？這無法復原！", step2, "繼續", true);
                }} v="danger" sz="sm">🗑 清空</Btn>
              </div>
              <div style={{ fontSize:11, color:C.muted }}>資料存在本機瀏覽器，建議定期匯出備份。</div>
            </Card>


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

