import { useState } from "react";

export default function SettingsPage({ 
  C, tab, setTab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo,
  collapsed, toggleSection, APP_VER, changeTheme, THEMES, theme,
  customCE, buckets, expensePools, watchStocks, watchlist, savingsTargets,
  allocSettings, setAllocSettings,
  firebaseEnabled, cloudUser, authLoading, syncStatus, doCloudLogin, doCloudLogout, doUpdateNickname, doDeleteCloudData,
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
          <div style={{ position:"sticky", top:0, zIndex:20, background:`${C.bg}f2`, backdropFilter:"blur(16px)", padding:"12px 16px 10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>☰</span>
              <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{tr("more_title")}</span>
            </div>
          </div>
          
          <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>

            {/* 快速導覽：搬出底部導覽列的功能 */}
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

            {/* 帳戶（雲端同步 + 個人資料 + 隱私） */}
            <Card style={{ padding:20, marginBottom:16 }}>
              <SH title={`👤 ${tr("settings_account")}`} />
              {!firebaseEnabled ? (
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
                  還沒設定雲端同步。目前資料只存在這台裝置上。
                </div>
              ) : authLoading ? (
                <div style={{ fontSize:12, color:C.muted }}>檢查登入狀態中…</div>
              ) : cloudUser ? (
                <AccountPanel cloudUser={cloudUser} syncStatus={syncStatus} doCloudLogout={doCloudLogout} doUpdateNickname={doUpdateNickname} doDeleteCloudData={doDeleteCloudData} confirm={confirm} C={C} iSt={iSt} Btn={Btn} />
              ) : (
                <div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.6 }}>
                    登入後可以在多個裝置之間同步資料。第一次登入會把這台裝置目前的資料上傳成雲端的起始版本；之後每台登入同一個帳號的裝置都會用雲端最新的資料。
                  </div>
                  <Btn style={{ width:"100%" }} onClick={doCloudLogin}>使用 Google 帳號登入</Btn>
                </div>
              )}
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.textSub, marginBottom:8 }}>隱私</div>
                <button onClick={toggleHideAmounts} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, background:hideAmounts?`${C.teal}18`:C.card, border:`1px solid ${hideAmounts?C.teal:C.border}`, cursor:"pointer" }}>
                  <span style={{ fontSize:13, fontWeight:700, color:hideAmounts?C.teal:C.text }}>👁️ 隱藏金額（總覽/錢包的數字先模糊，點一下才顯示）</span>
                  <span style={{ fontSize:12, color:hideAmounts?C.teal:C.muted }}>{hideAmounts?"開":"關"}</span>
                </button>
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
                    localStorage.removeItem("finzen_v3");
                    alert("資料已完全清除");
                    window.location.reload();
                  }, "確認清空");
                  const step2 = () => confirm("再次確認：所有帳戶、交易、投資、往來帳資料都會消失，建議先匯出備份。要繼續嗎？", step3, "繼續", true);
                  confirm("確定要清空所有資料嗎？這無法復原！", step2, "繼續", true);
                }} v="danger" sz="sm">🗑 清空</Btn>
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
                  "左滑記錄可刪除、右滑可編輯；會依動作類型跳出對應的確認訊息（刪除/編輯/隱藏等），刪除或編輯後畫面下方 6 秒內可以按「復原」整批救回來",
                  "代墊：開啟「代墊」後填朋友名字和金額，自動拆成兩筆（自己那份支出 + 代墊轉帳），並在往來帳建立應收",
                  "分月認列（收入）：收到一次性大額收入（如學費）可開啟，之後每月到「待認列收入池」手動認列，不影響月份統計",
                  "分期付款（支出）：買東西要分期的話可開啟，設定期數，之後每月自動認列一部分支出，不會整筆一次算進當月支出",
                  "認列紀錄現在也能編輯或刪除，刪除會把金額退回分攤池（變回未認列），不會動到帳戶餘額",
                  "「這個月的存錢目標」卡片：依這個月收支狀況，設定要存多少錢到哪個帳戶或子帳戶，會顯示實際存了多少；月底會提醒先想下個月的目標",
                  "釘選的理財目標會顯示在這頁最上方",
                ]
              },{
                key:"m_wallet", icon:"👛", title:"錢包 — 帳戶管理",
                steps:[
                  "右上角 ➕ 可新增：現金、金融卡、證券帳戶、信用卡、儲蓄保單",
                  "點帳戶名稱 → 查看該帳戶所有交易細項，依月份分組、可以左右切換月份；右滑帳戶列可拉出編輯/刪除",
                  "帳戶順序：進入排序模式後用 ▲▼ 調整順序",
                  "子帳戶：金融卡帳戶下可以開子帳戶（願望、旅費、存錢等），直接顯示在錢包列表不用點進去",
                  "子帳戶可以改名、換 emoji、調金額、切換隱藏（隱藏的不計入總資產，適合薪水預支這類不算自己的錢）、排序、刪除",
                  "🔄 子帳戶互轉：同一銀行帳戶底下的子帳戶互轉是純調整分類；跨銀行帳戶的子帳戶互轉，會真的搬動現金並記一筆轉帳",
                  "子帳戶旁的 📈：查看這個子帳戶的每日金額成長趨勢圖",
                  "信用卡：輸入「應付金額」，點 Pay 繳費時選扣款帳戶；繳費、編輯、刪除都會正確連動應付金額",
                  "訂閱/基本開銷：設定固定扣款頻率，新增當下就會立刻記一筆本期扣款，之後到期自動記帳",
                  "訂閱若選「每年」扣款，可開「年繳分攤認列」：扣款當下不整筆算進支出，新增當下就會立刻認列當月那一份，之後每月自動認列",
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
                  "之後買入：點「＋買入」。如果今天已經大漲或買價明顯高於均成本，會跳出「追高警示」，要求先寫理由才能送出；也可以先按「🧊 先冷靜一下」加進冷靜清單，過幾小時再回來決定",
                  "買進若這筆佔總資產超過 20%，會跳出部位偏重警示",
                  "賣出：點個股 → 賣出，下拉選擇持股，自動帶入市價損益",
                  "買賣時都可以標記當下心態（計畫內/追高/恐慌/從眾/衝動），「績效」分頁的情緒回顧會統計不同心態下的勝率",
                  "個股詳細頁「股價走勢」：1日～1年區間切換的走勢圖",
                  "個股詳細頁「交易紀錄」：依月份分組，點一筆可以編輯股數/單價，左滑可以刪除（編輯或刪除都不會自動調整帳戶餘額，需要的話自己到錢包調）",
                  "個股詳細頁可以設「停損%」「產業別」，達到停損會顯示警示；產業別填了會出現在持股頁的產業分佈圖",
                  "「績效」分頁：勝率/賺賠比/R值、最大回撤、與大盤(0050)比較、股息估算、官方股利公告，都要點「重新整理」才會抓即時資料",
                  "「自選股」分頁：還沒買、想追蹤的股票，輸入代號加入，點一支可以展開股價走勢圖（1日～1年切換）",
                  "「持股」分頁最下面：全部交易紀錄（依月份分組）、每日損益熱力圖、產業分佈圖",
                  "「計入未實現損益」開關：預設全域套用，也可以在單一目標裡個別覆蓋（不跟隨全域）",
                ]
              },{
                key:"m_notes", icon:"👥", title:"往來帳 — 借貸管理",
                steps:[
                  "別人欠我 💚：記錄應收款；我欠別人 🟡：記錄應付款",
                  "分期付款：新增或編輯時都可以設 2-48 期，每期金額可手動修改（不一定要等額），事後也能調整期數",
                  "收款/付款：點「收一期」或「付一期」，選帳戶，餘額自動更新（付款來源如果選信用卡，會正確計入應付金額而不是扣餘額）",
                  "應收收款不算收入（本來就是你的錢）；應付付款才算支出",
                  "7 天內到期顯示提醒，逾期顯示紅色 ⚠️ 警告",
                  "代墊：記支出時開啟代墊，自動在往來帳建立應收，等對方還錢再結清",
                ]
              },{
                key:"m_charts", icon:"🗂️", title:"圖表 — 收支分析",
                steps:[
                  "本頁月份切換是獨立的，跟總覽頁的月份互不影響；也可以點 📅 選自訂日期區間，不限定整月",
                  "圓餅圖：點一個類別可以展開，看當月/當前區間屬於這個類別的所有交易明細",
                  "收支健康度：自訂區間查看儲蓄率、支出佔比、訂閱月費",
                  "資產成長：可切換「資產水位」（Y軸會依你的資產範圍動態縮放）跟「每期變動」——不管單月還是跨月查看，一律以「每天」為單位計算，波動會更明顯",
                  "資產配置圖：依帳戶類型（現金/金融卡/證券帳戶）呈現",
                  "目標管理：點「＋新增目標」設定金額、期限、追蹤帳戶或子帳戶（選了母帳戶就不能再重複選底下的子帳戶，避免金額算兩次）；30 天內到期變橘色；點📍可以釘選在總覽頁顯示",
                  "目標計算：不指定帳戶/子帳戶 = 用總資產淨值（資產−負債+應收−應付）",
                ]
              },{
                key:"m_settings", icon:"⚙️", title:"設定 — 個人化",
                steps:[
                  "主題：深色🌙 / 北歐風🌲 / 地中海風🌊 / 韓式🌸 / 日式🍃 / 美式🦅，即時切換",
                  "類別管理：點類別可改名稱和 emoji；可新增自訂類別",
                  "匯出備份：定期點「📤 匯出備份」存成 JSON 檔，換裝置前必做",
                  "📥 匯入備份：點選檔案還原所有資料",
                  "🗑 清空：會連續跳出三次確認，第三次才會真的清空，避免手滑",
                  "資料只存在你的瀏覽器，不會上傳任何伺服器",
                  "加入主畫面：Safari → 分享 → 加入主畫面，像 App 一樣使用",
                ]
              },{
                key:"m_tips", icon:"💡", title:"常見問題 & 小技巧",
                steps:[
                  "Q：帳戶餘額沒更新？→ 記帳時確認有選帳戶",
                  "Q：投資市價沒顯示？→ 重新開啟 App，等幾秒讓市價載入",
                  "Q：往來帳收款為什麼不算收入？→ 那是別人還你本來就是你的錢",
                  "Q：代墊記帳後支出為什麼少了？→ 代墊那份是轉帳不是支出，只算你自己的那份",
                  "Q：儲蓄保單不在總資產裡？→ 正確，純追蹤損益，解約時才結算",
                  "Q：刪錯東西了怎麼辦？→ 刪除或編輯後畫面下方 6 秒內會有對應的「復原」按鈕",
                  "小技巧：支出綠色、收入紅色（台灣股市漲紅跌綠慣例）",
                  "小技巧：帳戶餘額調整時填說明，之後看細項才知道為何調整",
                  "小技巧：股票交易紀錄的編輯/刪除不會自動連動帳戶餘額，需要的話記得自己到錢包調整；但帳戶調整、轉帳、信用卡繳費的編輯/刪除都會正確連動",
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

/* ── 帳戶面板：已登入時顯示大頭貼／暱稱（可編輯）／同步狀態／登出／清除雲端資料 ── */
function AccountPanel({ cloudUser, syncStatus, doCloudLogout, doUpdateNickname, doDeleteCloudData, confirm, C, iSt, Btn }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(cloudUser.displayName || "");
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        {cloudUser.photoURL && <img src={cloudUser.photoURL} alt="" style={{ width:40, height:40, borderRadius:"50%" }} />}
        <div style={{ flex:1 }}>
          {editingName ? (
            <div style={{ display:"flex", gap:6 }}>
              <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)} style={{ ...iSt, padding:"5px 8px", fontSize:13 }} />
              <button disabled={saving} onClick={async () => { setSaving(true); await doUpdateNickname(nameDraft.trim() || cloudUser.email); setSaving(false); setEditingName(false); }} style={{ padding:"5px 10px", borderRadius:8, background:C.accent, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>{saving?"…":"儲存"}</button>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{cloudUser.displayName || cloudUser.email}</div>
              <button onClick={() => { setNameDraft(cloudUser.displayName || ""); setEditingName(true); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:12 }}>✏️</button>
            </div>
          )}
          <div style={{ fontSize:11, color:C.muted }}>{cloudUser.email}</div>
        </div>
      </div>
      <div style={{ fontSize:11, color:syncStatus==="error"?C.expense:C.teal, marginBottom:12 }}>
        {syncStatus === "pending" ? "⏳ 同步中…" : syncStatus === "error" ? "⚠️ 同步失敗，稍後會自動重試" : "✅ 已同步到雲端"}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Btn v="danger" style={{ flex:1 }} onClick={() => confirm("確定登出嗎？這台裝置的資料還是會留著，只是不再同步。", doCloudLogout)}>登出</Btn>
      </div>
      <button onClick={() => confirm("確定清除雲端備份的資料嗎？這台裝置上的資料不會被刪除，但其他有登入這個帳號的裝置會失去雲端備份可以還原的版本。", async () => { await doDeleteCloudData(); })} style={{ width:"100%", marginTop:10, padding:8, background:"none", border:"none", color:C.muted, fontSize:11, cursor:"pointer", textDecoration:"underline" }}>清除雲端備份的資料</button>
    </div>
  );
}
