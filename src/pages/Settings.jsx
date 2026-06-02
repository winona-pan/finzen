import { useState } from "react";

export default function SettingsPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo,
  collapsed, toggleSection, APP_VER, changeTheme, THEMES, theme,
  // 接收全域共用 UI 元件
  Card, SH, Btn
}) {

  /* ── 內部封裝的備份匯出函數 ── */
  const exportData = () => { 
    const b = new Blob([JSON.stringify({ accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies }, null, 2)], { type:"application/json" }); 
    const u = URL.createObjectURL(b), a = document.createElement("a"); 
    a.href = u; a.download = `finzen_${TODAY}.json`; a.click(); URL.revokeObjectURL(u); 
  };

  return (
    <>
      {/* 修正致命大括號損壞：{tab === "settings" ➜ tab === "settings" */}
      {tab === "settings" && (
        <div>
          <div style={{ position:"sticky", top:0, zIndex:20, background:`${C.bg}f2`, backdropFilter:"blur(16px)", padding:"12px 16px 10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>⚙️</span>
              <span style={{ fontWeight:900, fontSize:16, color:C.text }}>設定</span>
            </div>
          </div>
          
          <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>

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
                        alert("✅ 匯入成功！頁面即將重新整理");
                        window.location.reload();
                      } catch { alert("❌ 備份檔案格式毀損或錯誤"); } 
                    }; 
                    r.readAsText(f); 
                  }} style={{ display:"none" }} />
                </label>
                <Btn onClick={() => confirm("確定清空所有資料？這無法復原！", () => { 
                  localStorage.removeItem("finzen_v3");
                  alert("資料已完全清除");
                  window.location.reload();
                })} v="danger" sz="sm">🗑 清空</Btn>
              </div>
              <div style={{ fontSize:11, color:C.muted }}>資料存在本機瀏覽器，建議定期匯出備份。</div>
            </Card>

            {/* 使用手冊 */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <button onClick={() => toggleSection("manual")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom: collapsed["manual"] ? 0 : 12 }}>
                <SH title="📖 使用手冊" />
                <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["manual"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s", flexShrink:0 }}>▾</span>
              </button>
              {!collapsed["manual"] && [{
                key:"m_overview", icon:"📊", title:"總覽 — 每日記帳",
                steps:[
                  "點右下角 ✏️ 新增一筆收入或支出",
                  "選類別、填金額、選帳戶 → 帳戶餘額自動更新",
                  "說明欄會記憶同類別的歷史輸入，方便快速帶入",
                  "左滑記錄可刪除（帳戶餘額自動還原）；右滑可編輯",
                  "代墊：開啟「代墊」後填朋友名字和金額，自動拆成兩筆（自己那份支出 + 代墊轉帳），並在往來帳建立應收",
                  "分月認列：收到一次性大額收入（如學費）可開啟，之後每月到「待認列收入池」手動認列，不影響月份統計",
                ]
              },{
                key:"m_wallet", icon:"👛", title:"錢包 — 帳戶管理",
                steps:[
                  "右上角 ➕ 可新增：現金、金融卡、證券帳戶、信用卡、儲蓄保單",
                  "帳戶分區：流動資產（現金/金融卡）、負債（信用卡）、非流動資產（證券）、儲蓄保單（追蹤用，不計入總資產）",
                  "點帳戶名稱 → 查看該帳戶所有交易細項",
                  "右滑帳戶 → 編輯餘額、圖示、名稱；編輯餘額時可填調整說明",
                  "信用卡：輸入「應付金額」，點 Pay 繳費時選扣款帳戶",
                  "訂閱管理：設定固定扣款（每月/每週/每年），到期自動記帳（需重新開啟 App）",
                  "基本開銷：水電費、房租等固定支出，同上自動記帳邏輯",
                ]
              },{
                key:"m_policy", icon:"🛡️", title:"儲蓄保單 — 保單追蹤",
                steps:[
                  "點 ➕ → 選「儲蓄保單」新增（儲蓄險、投資型保單適用；醫療險請放基本開銷）",
                  "填保單名稱、保險公司、目前解約金、已繳總保費、起保日",
                  "儲蓄保單不計入總資產，純追蹤損益用",
                  "💰 繳保費：帳戶餘額自動扣除，已繳總保費自動累加，不記支出（不影響月收支統計）",
                  "✏️ 更新：每年收到對帳單後，更新解約金和已繳總額",
                  "📋 解約：填實際領回金額，自動記兩筆（收入：領回；支出：已繳總保費），損益立刻結算，保單移除",
                  "損益 = 解約金 − 已繳總保費（負數代表還沒回本）",
                ]
              },{
                key:"m_invest", icon:"📈", title:"投資 — 股票追蹤",
                steps:[
                  "首次使用：點「📋 現有持股」登錄目前持有的股票，代號不要加 .TW，填股數和總成本",
                  "之後買入：點「＋買入」，可從上方快速選擇重複買入的股票，股數×均成本自動計算總成本",
                  "賣出：點個股 → 賣出，下拉選擇持股，自動帶入市價損益",
                  "市價開啟 App 時自動更新；點個股看損益、今日行情、三大法人（台股）",
                  "技術線圖 → TradingView；個股新聞 → Google News（代號+名稱搜尋）",
                  "停損提醒：在個股細項設虧損%門檻，達到時顯示 🔴 警示",
                  "「計入未實現損益」開關：開=總資產用市值計算；關=用成本",
                  "學習 Tab：市場先生文章分區整理，從基礎到進階",
                ]
              },{
                key:"m_notes", icon:"👥", title:"往來帳 — 借貸管理",
                steps:[
                  "別人欠我 💚：記錄應收款；我欠別人 🟡：記錄應付款",
                  "分期付款：可設 2-48 期，每期金額可手動修改（不一定要等額）",
                  "收款/付款：點「收一期」或「付一期」，選帳戶，餘額自動更新",
                  "應收收款不算收入（本來就是你的錢）；應付付款才算支出",
                  "7 天內到期顯示提醒，逾期顯示紅色 ⚠️ 警告",
                  "代墊：記支出時開啟代墊，自動在往來帳建立應收，等對方還錢再結清",
                ]
              },{
                key:"m_charts", icon:"🗂️", title:"圖表 — 收支分析",
                steps:[
                  "圓餅圖：查看本月各類別支出/收入佔比（代墊只算自己那份，往來帳收款不算收入）",
                  "收支健康度：自訂區間查看儲蓄率、支出佔比、訂閱月費",
                  "資產成長：預設本月，可切換多月。帳戶調整和轉帳不計入（避免失真）",
                  "投資圖表：資產配置（流動/非流動）、持股比例、投資成長（成本線 vs 市值線）",
                  "目標管理：點「＋新增目標」設定金額、期限、追蹤帳戶；30 天內到期變橘色",
                  "目標計算：不指定帳戶 = 用總資產淨值（資產−負債+應收−應付）",
                ]
              },{
                key:"m_settings", icon:"⚙️", title:"設定 — 個人化",
                steps:[
                  "主題：深色🌙 / 淺色☀️ / 紫色💜 / 海洋🌊，即時切換",
                  "類別管理：點類別可改名稱 and emoji；可新增自訂類別",
                  "匯出備份：定期點「📤 匯出備份」存成 JSON 檔，換裝置前必做",
                  "📥 匯入備份：點選檔案還原所有資料",
                  "資料只存在你的瀏覽器，不會上傳任何伺服器",
                  "加入主畫面：Safari → 分享 → 加入主畫面，像 App 一樣使用",
                ]
              },{
                key:"m_tips", icon:"💡", title:"常見問題 & 小技巧",
                steps:[
                  "Q：帳戶餘額沒更新？→ 記帳時確認有選帳戶",
                  "Q：投資市價沒顯示？→ 重新開啟 App，等幾秒讓市價載入",
                  "Q：訂閱沒自動記帳？→ 需要關掉重新開啟 App 才觸發",
                  "Q：往來帳收款為什麼不算收入？→ 那是別人還你本來就是你的錢",
                  "Q：代墊記帳後支出為什麼少了？→ 代墊那份是轉帳不是支出，只算你自己的那份",
                  "Q：儲蓄保單不在總資產裡？→ 正確，純追蹤損益，解約時才結算",
                  "小技巧：支出綠色、收入紅色（台灣股市漲紅跌綠慣例）",
                  "小技巧：刪除記錄後帳戶餘額自動還原",
                  "小技巧：帳戶餘額調整時填說明，之後看細項才知道為何調整",
                ]
              }].map((item) => (
                <div key={item.key} style={{ borderBottom:`1px solid ${C.border}`, marginBottom:4 }}>
                  <button onClick={() => toggleSection(item.key)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"10px 0" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:18 }}>{item.icon}</span>
                      <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{item.title}</span>
                    </div>
                    <span style={{ fontSize:13, color:C.muted, display:"inline-block", transform:collapsed[item.key]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s", flexShrink:0 }}>▾</span>
                  </button>
                  {!collapsed[item.key] && (
                    <div style={{ paddingBottom:10 }}>
                      {item.steps.map((step, si) => (
                        <div key={si} style={{ display:"flex", gap:8, padding:"4px 0" }}>
                          <span style={{ color:C.accent, fontWeight:900, fontSize:12, flexShrink:0, marginTop:1 }}>{si+1}.</span>
                          <span style={{ fontSize:12, color:C.textSub, lineHeight:1.6 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>

            {/* App info */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <SH title="關於" />
              <div style={{ fontSize:13, color:C.textSub, lineHeight:1.8 }}>
                <div>FinZen 財務管理</div>
                <div style={{ color:C.muted }}>版本 {APP_VER}</div>
                <div style={{ marginTop:8, color:C.muted, fontSize:12 }}>資料僅存在你的裝置，不會上傳到任何伺服器。</div>
              </div>
            </Card>

          </div>
        </div>
      )}
    </>
  );
}
