import { useState, useEffect } from "react";
import { translateText } from "../i18nRuntime";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ReferenceLine, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function InvestPage({ 
  C, tab, iSt, fmt, fmtPrice, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, DAYS,
  chartData, chartRange, setChartRange, isSingleMo, allocPie, holdPie, invGrowth,
  dailyGrowth, loadingDaily, fetchDailyGrowth,
  incCat, expCat, chartView, setChartView, healthRange, setHealthRange,
  useMvForAssets, toggleMv, poolThisMo, fetchAllPrices, ALL_CURS, theme,
  collapsed, toggleSection, setNT, T0, descHistoryByCat, tagsHistory,
  invTab, setInvTab, invPie, setInvPie, LEARN_DATA, MANUAL_DATA, EMOTIONS, emotionReview,
  watchlist, addToWatchlist, removeFromWatchlist, COOLDOWN_MS, recentTradeCount, TRADE_FREQ_WARN,
  tradeStats, maxDrawdown, benchmarkData, loadingBenchmark, fetchBenchmarkCompare, totalRealizedPnl,
  watchStocks, addWatchStock, removeWatchStock, refreshWatchStocks, loadingWatch,
  dailyPnlHeatmap, sectorPie, updateStockMeta, portfolioHistory, portfolioNow,
  dividendEst, loadingDiv, fetchDividendEstimate, dividendAnnounce, loadingDivAnn, divAnnFetched, fetchDividendAnnounce,
  StockPriceChart,
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF,
  setSettleDebt, setEditDebt, setSelPool, setSelAcc, selAcc,
  setNAcc, setPayF, setSelSub, setSelBill, setSelPolicy, setSelTxn,
  nG, setNG, editGoal, setEditGoal, nPL, setNPL,
  moDate, setMoDate, searchQ, setSearchQ, APP_VER, changeTheme, THEMES,
  showHDP, setShowHDP, nS, setNS, nB, setNB, sortMode, setSortMode, visMode, setVisMode, nD, setND,
  // 共用 UI atoms
  Card, SH, Bdg, SwipeRow, Btn, InfoBtn, tr, hideAmounts
}) {

  const [growthMode, setGrowthMode] = useState("monthly");
  const [peek, setPeek] = useState(false);
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const doPeek = () => { setPeek(true); setTimeout(() => setPeek(false), 3000); };
  const maskStyle = (hideAmounts && !peek) ? { filter:"blur(6px)", userSelect:"none" } : {};
  const [expandedWatch, setExpandedWatch] = useState(null);
  const [allTradeMonth, setAllTradeMonth] = useState(null);
  const [logFilter, setLogFilter] = useState("all");

  return (
    <>
      {tab === "invest" && (
        <div style={{ padding:"12px 16px" }}>
          {/* ── 標題列＋買入／賣出：兩個一樣大的按鈕並排，不用再點進個股才能賣 ── */}
          {(() => {
            const held = stSum.filter(x => x.totalSh > 0);
            const openSell = () => {
              const st = held[0];
              if (!st) return;
              const hasPrice = st.curPrice > 0;
              setSellF({ stockId:st.id, shares:String(st.totalSh), totalProceeds:hasPrice?String(Math.round(st.curPrice*st.totalSh)):"", fee:"", pnl:hasPrice?String(Math.round(Math.abs(st.upnl))):"", pnlType:st.upnl>=0?"income":"expense", returnAcc:"" });
              setModal("sellStock");
            };
            const actBtn = { flex:1, padding:"12px 0", borderRadius:14, fontSize:14, fontWeight:800, cursor:"pointer", border:"none" };
            return <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>📈</span><span style={{ fontWeight:900, fontSize:16, color:C.text }}>{tr("投資追蹤")}</span></div>
                <button onClick={() => setModal("initStock")} style={{ background:"none", border:"none", padding:"4px 2px", color:C.muted, fontSize:12, fontWeight:600, cursor:"pointer" }}>📋 {tr("登錄現有持股")}</button>
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <button onClick={() => setModal("buyStock")} style={{ ...actBtn, background:C.accent, color:"#fff" }}>＋ {tr("買入")}</button>
                <button onClick={openSell} disabled={!held.length} style={{ ...actBtn, background:C.card, color:held.length?C.text:C.muted, opacity:held.length?1:0.6, cursor:held.length?"pointer":"default" }}>− {tr("賣出")}</button>
              </div>
            </>;
          })()}

          <div style={{ display:"flex", gap:4, padding:4, borderRadius:14, background:C.surface, marginBottom:20, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
            {[{ v:"dashboard", l:tr("總覽") }, { v:"holdings", l:tr("持股") }, { v:"log", l:tr("交易記錄") }, { v:"perf", l:tr("績效") }, { v:"watch", l:tr("自選股") }, { v:"news", l:tr("新聞") }, { v:"learn", l:tr("學習") }].map(t => <button key={t.v} onClick={() => setInvTab(t.v)} style={{ flex:"0 0 auto", padding:"8px 14px", borderRadius:10, fontSize:12, fontWeight:900, background:invTab === t.v ? C.accent : "transparent", color:invTab === t.v ? "#fff" : C.muted, border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>{t.l}</button>)}
          </div>
          
          {invTab === "dashboard" && (
            <div>

              {/* ── 總覽卡：市值當主角，下面一排損益；台股＋美股都換算成台幣（以前美股是直接把美元數字加進去） ── */}
              {(() => {
                const mv = portfolioNow?.mv || 0, cost = portfolioNow?.cost || 0;
                const shownMv = mv > 0 ? mv : cost;
                const upnl = mv - cost;
                const stat = (label, value, color) => (
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:10.5, color:C.muted }}>{label}</div>
                    <div style={{ fontSize:14, fontWeight:800, color, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", ...maskStyle }}>{value}</div>
                  </div>
                );
                return (
                  <Card style={{ padding:"16px 16px 14px", marginBottom:16, cursor:hideAmounts?"pointer":"default" }} onClick={() => hideAmounts && doPeek()}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:11, color:C.textSub, fontWeight:700 }}>{tr("投資市值")}</div>
                        <div style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:"-0.02em", marginTop:2, ...maskStyle }}>{fmt(shownMv)}</div>
                        {mv > 0 && cost > 0 && (
                          <div style={{ fontSize:13, fontWeight:800, color:pnlColor(upnl, C), marginTop:2, ...maskStyle }}>
                            {upnl >= 0 ? "▲ +" : "▼ −"}{fmt(Math.abs(upnl))}<span style={{ fontWeight:700, marginLeft:6 }}>{upnl >= 0 ? "+" : ""}{(upnl / cost * 100).toFixed(2)}%</span>
                          </div>
                        )}
                      </div>
                      <button onClick={async (e) => { e.stopPropagation(); setLoadingHoldings(true); try { await Promise.all([fetchAllPrices(undefined, { live:true }), refreshWatchStocks({ live:true })]); } finally { setLoadingHoldings(false); } }}
                        style={{ flexShrink:0, padding:"6px 10px", borderRadius:10, background:C.bg, border:"none", color:C.accentL, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                        {loadingHoldings ? tr("讀取中…") : `🔄 ${tr("更新報價")}`}
                      </button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                      {stat(tr("投入成本"), fmt(cost), C.text)}
                      {stat(tr("已實現損益"), tradeStats.totalSells > 0 ? `${totalRealizedPnl >= 0 ? "+" : "−"}${fmt(Math.abs(Math.round(totalRealizedPnl)))}` : "—", tradeStats.totalSells > 0 ? pnlColor(totalRealizedPnl, C) : C.muted)}
                      {stat(tr("即時現金"), fmt(cashBal), C.text)}
                    </div>
                  </Card>
                );
              })()}

              <DailySwingCard history={portfolioHistory} C={C} fmt={fmt} pnlColor={pnlColor} maskStyle={maskStyle} tr={tr} Card={Card} />

              <Card style={{ padding:20, marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:900, color:C.muted, marginBottom:10, letterSpacing:"0.05em" }}>{tr("投組佔比")}</div>
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  {[{ v:"alloc", l:tr("資產配置") }, { v:"hold", l:tr("持股比例") }, { v:"growth", l:tr("投資成長") }].map(o => <button key={o.v} onClick={() => setInvPie(o.v)} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:12, fontWeight:700, background:invPie === o.v ? `${C.accent}30` : C.card, color:invPie === o.v ? C.accentL : C.muted, border:`1px solid ${invPie === o.v ? C.accent : C.border}`, cursor:"pointer" }}>{o.l}</button>)}
                </div>
                {invPie === "growth"
                  ? (
                    <div>
                      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                        <button onClick={() => setGrowthMode("monthly")} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:11, fontWeight:700, background:growthMode==="monthly"?`${C.accent}28`:C.card, color:growthMode==="monthly"?C.accentL:C.muted, border:`1px solid ${growthMode==="monthly"?C.accent:C.border}`, cursor:"pointer" }}>累積投入成本</button>
                        <button onClick={() => { setGrowthMode("daily"); if (!dailyGrowth.length && !loadingDaily) fetchDailyGrowth(); }} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:11, fontWeight:700, background:growthMode==="daily"?`${C.accent}28`:C.card, color:growthMode==="daily"?C.accentL:C.muted, border:`1px solid ${growthMode==="daily"?C.accent:C.border}`, cursor:"pointer" }}>每日收盤走勢（真實市值）</button>
                      </div>
                      {growthMode === "monthly" ? (
                        invGrowth.length > 1 ? (
                          <div>
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={invGrowth} margin={{ top:5, right:5, bottom:14, left:0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                                <XAxis dataKey="m" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.ceil(invGrowth.length / 6) - 1)} />
                                <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => translateText(`${(v/10000).toFixed(0)}萬`)} />
                                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={(v) => [fmt(v), translateText("投入成本")]} />
                                <Line type="monotone" dataKey="cost" stroke={theme==="dark"?"#eee":"#222"} strokeWidth={2} dot={false} name="cost" />
                              </LineChart>
                            </ResponsiveContainer>
                            <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.textSub }}><div style={{ width:16, height:2, background:theme==="dark"?"#eee":"#222" }} />投入成本</div>
                            </div>
                            <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:6 }}>這裡只算累積投入的成本，不是市值——想看真實市值走勢，切換到上面的「每日收盤走勢」</div>
                          </div>
                        ) : <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>需要至少兩筆買入記錄才能顯示成長圖</div>
                      ) : (
                        loadingDaily ? (
                          <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>讀取每日收盤價中…</div>
                        ) : dailyGrowth.length > 1 ? (
                          <div>
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={dailyGrowth} margin={{ top:5, right:5, bottom:14, left:0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                                <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} interval={Math.ceil(dailyGrowth.length/6)} />
                                <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => translateText(`${(v/10000).toFixed(0)}萬`)} domain={["auto","auto"]} />
                                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v => [fmt(v), translateText("市值")]} />
                                <Line type="linear" dataKey="mv" stroke={C.income} strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                            <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:6 }}>依實際每日收盤價計算的持股市值（近一年）</div>
                          </div>
                        ) : (
                          <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>
                            <div style={{ marginBottom:8 }}>尚無每日走勢資料</div>
                            <button onClick={fetchDailyGrowth} style={{ padding:"6px 14px", borderRadius:10, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:12, cursor:"pointer" }}>點此讀取</button>
                          </div>
                        )
                      )}
                    </div>
                  )
                  : <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={invPie === "alloc" ? allocPie : holdPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={30}>{(invPie === "alloc" ? allocPie : holdPie).map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} formatter={(v, n) => [fmt(v), translateText(String(n))]} /></PieChart></ResponsiveContainer>
                }

                {invPie !== "growth" && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:10, justifyContent:"center" }}>
                    {(invPie === "alloc" ? allocPie : holdPie).map((item, i) => {
                      const total = (invPie === "alloc" ? allocPie : holdPie).reduce((s,x)=>s+x.value,0);
                      const pct = total > 0 ? (item.value/total*100).toFixed(1) : "0";
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:10, height:10, borderRadius:3, background:PIE[i%PIE.length], flexShrink:0 }}/>
                          <span style={{ fontSize:12, color:C.text, fontWeight:700 }}>{item.name}</span>
                          <span style={{ fontSize:11, color:C.muted }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {invTab === "holdings" && (
            <div>
              {recentTradeCount > TRADE_FREQ_WARN && (
                <Card style={{ padding:14, marginBottom:14, background:`${C.warn}15`, border:`1px solid ${C.warn}55` }}>
                  <div style={{ fontSize:13, fontWeight:900, color:C.warn, marginBottom:4 }}>⚠️ {tr("交易有點頻繁")}</div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.5 }}>{tr("近 7 天你已經買賣了")} {recentTradeCount} {tr("次，留意一下是不是進出太密集、有點失去紀律。")}</div>
                </Card>
              )}

              {watchlist.length > 0 && (
                <Card style={{ padding:16, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:900, color:C.text, marginBottom:10 }}>🧊 {tr("冷靜清單")}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {watchlist.map(w => {
                      const elapsed = Date.now() - w.addedAt;
                      const ready = elapsed >= COOLDOWN_MS;
                      const remainMin = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
                      const remainH = Math.floor(remainMin / 60), remainM = remainMin % 60;
                      return (
                        <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{w.ticker} {w.name}</div>
                            {w.note && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{w.note}</div>}
                            <div style={{ fontSize:11, color:ready?C.income:C.muted, marginTop:2, fontWeight:ready?700:400 }}>{ready ? `✅ ${tr("冷靜期已過，可以下單了")}` : `${tr("還要等")} ${remainH > 0 ? `${remainH}${tr("小時")}` : ""}${remainM}${tr("分鐘")}`}</div>
                          </div>
                          {ready && <button onClick={() => { setBuyF(p => ({ ...p, ticker:w.ticker, name:w.name, market:w.market, acc:w.acc || p.acc })); removeFromWatchlist(w.id); setModal("buyStock"); }} style={{ padding:"6px 12px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>{tr("前往買入")}</button>}
                          <button onClick={() => removeFromWatchlist(w.id)} style={{ padding:"6px 8px", borderRadius:10, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontSize:12, cursor:"pointer", flexShrink:0 }}>{tr("移除")}</button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}


              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, color:C.muted }}>{tr("持股")} {new Set(stSum.filter(s=>s.totalSh>0).map(s=>`${s.ticker}_${s.market}`)).size} {tr("檔")} · {tr("市值")} {fmt(stTotMv > 0 ? stTotMv : stTotCost)}</div>
                <button onClick={async () => { setLoadingHoldings(true); try { await Promise.all([fetchAllPrices(undefined, { live:true }), refreshWatchStocks({ live:true })]); } finally { setLoadingHoldings(false); } }} style={{ padding:"5px 10px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:11, cursor:"pointer" }}>{loadingHoldings ? tr("讀取中…") : `🔄 ${tr("更新報價")}`}</button>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:10, background:`${C.accent}12`, border:`1px solid ${C.accent}33`, marginBottom:16 }}>
                <div>
                  <span style={{ fontSize:12, color:C.accentL }}>{tr("總資產計入未實現損益")}</span>
                  {useMvForAssets && <div style={{ fontSize:10, color:stTotMv>0?C.teal:C.muted, marginTop:2 }}>{stTotMv>0 ? `${tr("市值")} ${fmt(stTotMv)}` : `⏳ ${tr("等待市價載入…")}`}</div>}
                </div>
                <button onClick={toggleMv} style={{ width:44, height:24, borderRadius:12, background:useMvForAssets?C.income:C.muted, border:"none", cursor:"pointer", position:"relative", flexShrink:0 }}>
                  <span style={{ position:"absolute", top:2, left:useMvForAssets?22:2, width:20, height:20, borderRadius:10, background:"#fff", transition:"left .2s", display:"block" }} />
                </button>
              </div>

              {Object.entries(stByAcc).map(([accN, stks]) => {
                const accMv   = stks.reduce((s, x) => s + (x.mv > 0 ? x.mv : x.totalCost), 0);
                const accCost = stks.reduce((s, x) => s + x.totalCost, 0);
                const accPnl  = accMv - accCost;
                const hasPrices = stks.some(x => x.curPrice > 0);
                const isCollapsed = collapsed[`inv_${accN}`];
                return (
                  <div key={accN} style={{ marginBottom:16 }}>
                    <button onClick={() => toggleSection(`inv_${accN}`)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:isCollapsed?0:6 }}>
                      <span style={{ fontWeight:900, fontSize:13, color:C.text }}>{accN}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ textAlign:"right" }} onClick={(e) => { if (hideAmounts) { e.stopPropagation(); doPeek(); } }}>
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ fontSize:10, color:C.muted, background:`${C.muted}18`, padding:"1px 5px", borderRadius:4 }}>{hasPrices?"市值":"成本"}</span>
                            <div style={{ fontWeight:900, fontSize:13, color:C.text, ...maskStyle }}>{fmt(hasPrices ? accMv : accCost)}</div>
                          </div>
                          {hasPrices && accPnl !== 0 && <div style={{ fontSize:11, color:pnlColor(accPnl, C), ...maskStyle }}>{accPnl>0?"▲ +":"▼ "}{fmt(Math.abs(accPnl))}</div>}
                        </div>
                        <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
                      </div>
                    </button>
                    {!isCollapsed && (
                      <Card style={{ overflow:"hidden" }}>
                        {stks.map((st, i) => {
                          const hasPrice = st.curPrice > 0;
                          const dispMv   = hasPrice ? st.mv : st.totalCost;
                          const pnl      = hasPrice ? st.upnl : 0;
                          const pnlPct   = st.totalCost > 0 && hasPrice ? (pnl / st.totalCost * 100) : 0;
                          const stCur    = st.market === "US" ? "USD" : "TWD"; // 美股原幣顯示美元，不要一律當台幣
                          return (
                            <SwipeRow key={st.id} onDelete={() => confirm(`${tr("確定刪除")} ${st.ticker}？`, () => upd("stocks", p => p.filter(s => s.id !== st.id)))} onEdit={() => { setSelStock(st); setModal("stockDetail"); }} onClick={() => { setSelStock(st); setModal("stockDetail"); }}>
                              <div style={{ padding:"12px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                    <span style={{ fontWeight:900, fontSize:14, color:C.text }}>{st.ticker}</span>
                                    <span style={{ fontSize:12, color:C.textSub }}>{st.name}</span>
                                    <Bdg color={st.market === "US" ? C.accent : C.teal}>{st.market}</Bdg>
                                  </div>
                                  <div style={{ textAlign:"right", flexShrink:0 }} onClick={(e) => { if (hideAmounts) { e.stopPropagation(); doPeek(); } }}>
                                    <div style={{ fontWeight:900, fontSize:14, color:C.text, ...maskStyle }}>{fmt(dispMv, stCur)}</div>
                                    {hasPrice ? (
                                      <div style={{ fontSize:11, color:pnlColor(pnl, C), fontWeight:700, ...maskStyle }}>
                                        {pnl > 0 ? "▲ +" : pnl < 0 ? "▼ " : ""}{fmt(Math.abs(pnl), stCur)} ({pnlPct > 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                                        {st.stopLossPct && pnlPct <= -Math.abs(st.stopLossPct) && <span style={{ marginLeft:4, color:C.danger, fontWeight:900 }}>🔴 達停損</span>}
                                      </div>
                                    ) : <div style={{ fontSize:11, color:C.muted }}>載入市價中…</div>}
                                  </div>
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, ...maskStyle }}>
                                  <span>{st.totalSh}股 · 均 {fmtPrice(st.avgCost || 0, stCur)}/股</span>
                                  {hasPrice ? <span style={{ color:C.textSub }}>市價 {fmtPrice(st.curPrice, stCur)}{st.lastUpdated ? ` · ${st.lastUpdated}` : ""}</span> : <span>成本 {fmt(st.totalCost, stCur)}</span>}
                                </div>
                              </div>
                            </SwipeRow>
                          );
                        })}
                      </Card>
                    )}
                  </div>
                );
              })}
              {Object.keys(stByAcc).length === 0 && <div style={{ padding:"40px 0", textAlign:"center", color:C.muted }}><div style={{ fontSize:38, marginBottom:8 }}>📊</div>尚無持股，點右上角「＋買入」</div>}

              {(() => {
                const closed = stSum.filter(s => s.totalSh <= 0 && (s.trades?.length > 0 || s.manualShares != null));
                if (!closed.length) return null;
                return (
                  <div style={{ marginBottom:16 }}>
                    <button onClick={() => toggleSection("inv_closed")} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:collapsed["inv_closed"]?0:6 }}>
                      <span style={{ fontWeight:900, fontSize:13, color:C.muted }}>🗂️ {tr("已出清")}（{closed.length}）</span>
                      <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["inv_closed"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
                    </button>
                    {!collapsed["inv_closed"] && (
                      <Card style={{ overflow:"hidden" }}>
                        {closed.map((st, i) => {
                          const stCur = st.market === "US" ? "USD" : "TWD";
                          const sells = (st.trades||[]).filter(t => t.type === "sell");
                          const realized = sells.reduce((s,t) => s + (t.pnl||0), 0);
                          return (
                            <div key={st.id} onClick={() => { setSelStock(st); setModal("stockDetail"); }} style={{ padding:"12px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <div>
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={{ fontWeight:700, fontSize:13, color:C.textSub }}>{st.ticker}</span>
                                  <span style={{ fontSize:12, color:C.muted }}>{st.name}</span>
                                  <Bdg color={C.muted}>{st.market}</Bdg>
                                </div>
                                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{tr("已出清")}，{sells.length} {tr("次賣出")}</div>
                              </div>
                              {sells.length > 0 && <div style={{ fontWeight:900, fontSize:13, color:pnlColor(realized, C) }}>{realized>=0?"+":""}{fmt(Math.round(realized), stCur)}</div>}
                            </div>
                          );
                        })}
                      </Card>
                    )}
                    <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>＊資料都還在，只是不算目前持股——點進去可以看完整交易歷史，或到「交易記錄」分頁查</div>
                  </div>
                );
              })()}

              {sectorPie.length > 1 && (
                <Card style={{ padding:16, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:900, color:C.muted, marginBottom:10, letterSpacing:"0.05em" }}>產業/類股分佈</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart><Pie data={sectorPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={30}>{sectorPie.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} formatter={(v, n) => [fmt(v), translateText(String(n))]} /></PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:10, justifyContent:"center" }}>
                    {sectorPie.map((item, i) => {
                      const total = sectorPie.reduce((s,x)=>s+x.value,0);
                      const pct = total > 0 ? (item.value/total*100).toFixed(1) : "0";
                      return <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:PIE[i%PIE.length], flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:C.text, fontWeight:700 }}>{item.name}</span>
                        <span style={{ fontSize:11, color:C.muted }}>{pct}%</span>
                      </div>;
                    })}
                  </div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:8 }}>＊到個股詳細頁設定「產業別」即可分類</div>
                </Card>
              )}

            </div>
          )}
          
          {invTab === "log" && (() => {
            const allTrades = [];
            stocks.forEach(s => (s.trades||[]).forEach(t => allTrades.push({ ...t, ticker:s.ticker, name:s.name, market:s.market })));
            allTrades.sort((a,b) => b.date.localeCompare(a.date));
            const filtered = allTrades.filter(t => logFilter === "all" ? true : t.type === logFilter);
            const allTMonths = [...new Set(filtered.map(t => t.date.slice(0,7)))].sort().reverse();
            const curAllYm = allTradeMonth && allTMonths.includes(allTradeMonth) ? allTradeMonth : allTMonths[0];
            const curAllTrades = filtered.filter(t => t.date.slice(0,7) === curAllYm);
            const curAllIdx = allTMonths.indexOf(curAllYm);
            return (
              <div>
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {[{ v:"all", l:tr("全部") }, { v:"buy", l:tr("買入") }, { v:"sell", l:tr("賣出") }].map(o => <button key={o.v} onClick={() => setLogFilter(o.v)} style={{ flex:1, padding:"7px", borderRadius:10, fontSize:12, fontWeight:700, background:logFilter === o.v ? `${C.accent}30` : C.card, color:logFilter === o.v ? C.accentL : C.muted, border:`1px solid ${logFilter === o.v ? C.accent : C.border}`, cursor:"pointer" }}>{o.l}</button>)}
                </div>
                {!allTrades.length ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}><div style={{ fontSize:38, marginBottom:8 }}>📒</div>{tr("尚無交易紀錄")}</div>
                ) : (
                  <Card style={{ padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:900, color:C.muted, letterSpacing:"0.05em" }}>{tr("交易記錄")}（共 {filtered.length} 筆）</div>
                      {allTMonths.length > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <button onClick={() => setAllTradeMonth(allTMonths[curAllIdx+1])} disabled={curAllIdx>=allTMonths.length-1} style={{ background:"none", border:"none", cursor:curAllIdx>=allTMonths.length-1?"default":"pointer", color:C.textSub, fontSize:16, opacity:curAllIdx>=allTMonths.length-1?0.3:1 }}>‹</button>
                          <span style={{ fontSize:12, fontWeight:700, color:C.text, minWidth:50, textAlign:"center" }}>{curAllYm?.slice(0,4)}/{curAllYm?.slice(5,7)}</span>
                          <button onClick={() => setAllTradeMonth(allTMonths[curAllIdx-1])} disabled={curAllIdx<=0} style={{ background:"none", border:"none", cursor:curAllIdx<=0?"default":"pointer", color:C.textSub, fontSize:16, opacity:curAllIdx<=0?0.3:1 }}>›</button>
                        </div>
                      )}
                    </div>
                    {curAllTrades.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"20px 0", color:C.muted, fontSize:12 }}>{tr("尚無交易紀錄")}</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:1, maxHeight:520, overflowY:"auto" }}>
                        {curAllTrades.map((t, i) => (
                          <div key={t.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px", borderTop:i>0?`1px solid ${C.border}`:undefined }}>
                            <div style={{ width:28, height:28, borderRadius:8, background:t.type==="buy"?`${C.income}15`:`${C.expense}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:t.type==="buy"?C.income:C.expense, flexShrink:0 }}>{t.type==="buy"?"買":"賣"}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, color:C.text, fontWeight:700 }}>{t.ticker} {t.name} · {t.shares}股 ＠{fmtPrice(t.price, t.market === "US" ? "USD" : "TWD")}</div>
                              <div style={{ fontSize:10, color:C.muted }}>{t.date}{t.emotion ? ` · ${t.emotion}` : ""}</div>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <div style={{ fontWeight:900, fontSize:12, color:C.text }}>{fmt(Math.round(t.type==="buy" ? (t.totalCost||(t.shares*t.price+(t.fee||0))) : (t.shares*t.price-(t.fee||0))), t.market === "US" ? "USD" : "TWD")}</div>
                              {t.type === "sell" && t.pnl != null && <div style={{ fontSize:10, fontWeight:700, color:pnlColor(t.pnl, C) }}>{t.pnl>=0?"+":""}{fmt(Math.round(t.pnl), t.market === "US" ? "USD" : "TWD")}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize:10, color:C.muted, marginTop:8 }}>＊點進個股詳細頁可以編輯或刪除單筆紀錄</div>
                  </Card>
                )}
              </div>
            );
          })()}

          {invTab === "perf" && (
            <PerfTab C={C} tr={tr} fmt={fmt} pnlColor={pnlColor} maskStyle={maskStyle}
              tradeStats={tradeStats} maxDrawdown={maxDrawdown} benchmarkData={benchmarkData} loadingBenchmark={loadingBenchmark} fetchBenchmarkCompare={fetchBenchmarkCompare}
              emotionReview={emotionReview} dividendEst={dividendEst} loadingDiv={loadingDiv} fetchDividendEstimate={fetchDividendEstimate}
              dividendAnnounce={dividendAnnounce} loadingDivAnn={loadingDivAnn} divAnnFetched={divAnnFetched} fetchDividendAnnounce={fetchDividendAnnounce} />
          )}

          {invTab === "watch" && (
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:C.textSub, margin:"0 2px 8px" }}>{tr("大盤指數")}</div>
              <IndexBar C={C} tr={tr} StockPriceChart={StockPriceChart} theme={theme} />
              <div style={{ fontSize:12, fontWeight:800, color:C.textSub, margin:"18px 2px 8px" }}>{tr("自選股")}</div>
              <WatchStockAdder addWatchStock={addWatchStock} refreshWatchStocks={refreshWatchStocks} C={C} iSt={iSt} tr={tr} />
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
                <button onClick={() => { refreshWatchStocks({ live:true }); fetchAllPrices(undefined, { live:true }); }} style={{ padding:"5px 10px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:11, cursor:"pointer" }}>{loadingWatch?tr("讀取中…"):`🔄 ${tr("更新報價")}`}</button>
              </div>
              {watchStocks.length === 0 ? (
                <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>{tr("還沒有自選股，上面加一支想追蹤的股票吧")}</div>
              ) : (
                /* 分成台股、美股兩區；沒標市場的舊資料當台股（報價也是這樣查的） */
                [{ key:"TW", label:`🇹🇼 ${tr("台股")}`, list: watchStocks.filter(w => w.market !== "US") },
                 { key:"US", label:`🇺🇸 ${tr("美股")}`, list: watchStocks.filter(w => w.market === "US") }]
                .filter(g => g.list.length > 0).map(g => (
                  <div key={g.key} style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", margin:"4px 2px 8px" }}>
                      <span style={{ fontSize:13, fontWeight:800, color:C.textSub }}>{g.label}</span>
                      <span style={{ fontSize:11, color:C.muted }}>{g.list.length} {tr("檔")}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {g.list.map(w => (
                        <Card key={w.id} style={{ padding:0, overflow:"hidden" }}>
                          <SwipeRow onDelete={() => confirm(`${tr("移除自選股")}「${w.ticker}」？`, () => removeWatchStock(w.id), tr("確認移除"))} onClick={() => setExpandedWatch(p => p===w.id?null:w.id)}>
                            <div style={{ padding:14, display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                              <div style={{ minWidth:0 }}>
                                <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{w.ticker}</div>
                                {w.name && <div style={{ fontSize:11, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.name}</div>}
                              </div>
                              <div style={{ textAlign:"right", flexShrink:0 }}>
                                <div style={{ fontWeight:900, fontSize:15, color:C.text }}>{w.curPrice > 0 ? fmtPrice(w.curPrice, w.market === "US" ? "USD" : "TWD") : "—"}</div>
                                {w._extra?.chgPct != null && <div style={{ fontSize:11, color:pnlColor(w._extra.chgPct, C) }}>{w._extra.chgPct>=0?"+":""}{w._extra.chgPct}%</div>}
                              </div>
                            </div>
                          </SwipeRow>
                          {expandedWatch === w.id && (
                            <div style={{ padding:14, paddingTop:0 }}>
                              <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                                <StockPriceChart ticker={w.ticker} market={w.market} theme={theme} />
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {invTab === "news" && (
            <div>
              <div style={{ fontSize:12, color:C.teal, marginBottom:12 }}>📰 點擊新聞標題開啟原始頁面</div>
              {[{ ticker:"TW大盤", title:"加權指數 — 查看台股最新走勢", url:"https://tw.stock.yahoo.com/tw-market/" }, { ticker:"S&P500", title:"S&P 500 — 美股市場最新動態", url:"https://finance.yahoo.com/quote/%5EGSPC/" }, { ticker:"財經", title:"Yahoo Finance 財經頭條新聞", url:"https://finance.yahoo.com/news/" }].map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ display:"block", textDecoration:"none", marginBottom:8 }}>
                  <Card style={{ padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:`${C.accent}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📰</div>
                      <div style={{ flex:1 }}><div style={{ marginBottom:4 }}><Bdg color={C.accentL}>{n.ticker}</Bdg></div><div style={{ fontSize:14, fontWeight:700, color:C.text, lineHeight:1.4 }}>{n.title}</div></div>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          )}

          {invTab === "learn" && (
            <div>
              {[{
                section:"🌱 入門", key:"learn_basic",
                items:[
                  { title:"股票新手入門教學懶人包 — 帶你買進第一支股票", tag:"入門", url:"https://rich01.com/learn-stock-all/" },
                  { title:"美股新手入門教學懶人包 — 帶你買進第一支美股", tag:"入門", url:"https://rich01.com/us-stock-invest-all/" },
                ]
              },{
                section:"📈 股票投資", key:"learn_stock",
                items:[
                  { title:"股票分類文章總覽", tag:"索引", url:"https://rich01.com/category/learn-invest/stock-invest/" },
                  { title:"股價淨值比（PBR）是什麼？跟本益比有什麼差別？", tag:"進階", url:"https://rich01.com/what-is-pb-ratio/" },
                  { title:"初級市場 vs 次級市場是什麼？要怎麼交易", tag:"基礎", url:"https://rich01.com/centralized-order-market-vs-ipo/" },
                  { title:"ROD / IOC / FOK 差在哪？逐筆交易懶人包", tag:"進階", url:"https://rich01.com/what-rod-ioc-fok/" },
                ]
              },{
                section:"📊 ETF 與基金", key:"learn_etf",
                items:[
                  { title:"ETF 是什麼？怎麼買？ETF 新手入門教學", tag:"基礎", url:"https://rich01.com/etf0050/" },
                  { title:"ETF 怎麼買？管道及注意事項（附圖解教學）", tag:"教學", url:"https://rich01.com/how-buy-etfs/" },
                  { title:"ETF 投資懶人包：市場先生教學文章完整清單", tag:"索引", url:"https://rich01.com/learn-etf-all/" },
                  { title:"ETF 分類文章總覽", tag:"索引", url:"https://rich01.com/category/learn-invest/etf-invest/" },
                ]
              },{
                section:"🏦 資產配置", key:"learn_alloc",
                items:[
                  { title:"資產配置投資策略是什麼？比例分配怎麼做？", tag:"重要", url:"https://rich01.com/how-asset-allocation-1/" },
                  { title:"資產配置的「再平衡」是什麼意思？頻率多久一次？", tag:"策略", url:"https://rich01.com/what-asset-rebalancing/" },
                  { title:"資產配置分類文章總覽", tag:"索引", url:"https://rich01.com/category/invest-master/asset-allocation/" },
                ]
              },{
                section:"💰 財務自由與退休規劃", key:"learn_plan",
                items:[
                  { title:"FIRE 運動是什麼？你適合哪一種財富自由模式？", tag:"目標", url:"https://rich01.com/fire-5-types/" },
                  { title:"4% 法則是什麼？如何用 4% 法則達成財務自由退休？", tag:"規劃", url:"https://rich01.com/four-percent-rule/" },
                ]
              }].map(sec => (
                <div key={sec.key} style={{ marginBottom:16 }}>
                  <button onClick={() => toggleSection(sec.key)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:900, color:C.textSub }}>{sec.section}</span>
                    <span style={{ fontSize:13, color:C.muted, display:"inline-block", transform:collapsed[sec.key]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
                  </button>
                  {!collapsed[sec.key] && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {sec.items.map((item, i) => (
                        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                          <Card style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.4, marginBottom:4 }}>{item.title}</div>
                                <Bdg color={C.accent}>{item.tag}</Bdg>
                              </div>
                              <span style={{ color:C.muted, fontSize:16, flexShrink:0 }}>↗</span>
                            </div>
                          </Card>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ fontSize:11, color:C.muted, textAlign:"center", padding:"8px 0 16px" }}>
                文章來源：<a href="https://rich01.com" target="_blank" rel="noopener noreferrer" style={{ color:C.accentL }}>市場先生 Mr. Market</a>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── 自選股新增小表單 ── */
/* ── 大盤指數列：台灣加權指數／費半指數／S&P 500，讓你一眼看到大盤現在的位置 ── */
function IndexBar({ C, tr, StockPriceChart, theme }) {
  const [idx, setIdx] = useState(null); // null=讀取中
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
        const res = await fetch(`${base}stock_prices.json?t=${Date.now()}`, { signal:AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const syms = [
          { key:"^TWII", label:"加權指數" },
          { key:"^SOX", label:"費半指數" },
          { key:"^GSPC", label:"S&P 500" },
        ];
        const rows = syms.map(s => ({ ...s, price:data[s.key]?.price, chgPct:data[s.key]?.chgPct })).filter(r => r.price != null);
        if (!cancelled) setIdx(rows);
      } catch { if (!cancelled) setIdx([]); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (idx === null || idx.length === 0) return null;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
        {idx.map(r => {
          const up = (r.chgPct||0) >= 0;
          const color = up ? C.income : C.expense;
          const isOpen = expanded === r.key;
          return (
            <div key={r.key} onClick={() => setExpanded(p => p===r.key?null:r.key)} style={{ flex:"0 0 auto", padding:"8px 12px", borderRadius:10, background:isOpen?`${C.accent}18`:C.card, border:`1px solid ${isOpen?C.accent:C.border}`, minWidth:100, cursor:"pointer" }}>
              <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>{r.label}</div>
              <div style={{ fontWeight:900, fontSize:13, color:C.text }}>{Number(r.price).toLocaleString("en", { maximumFractionDigits:2 })}</div>
              <div style={{ fontSize:11, fontWeight:700, color }}>{up?"▲ +":"▼ "}{Math.abs(r.chgPct).toFixed(2)}%</div>
            </div>
          );
        })}
      </div>
      {expanded && (
        <div style={{ marginTop:8, padding:12, borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
          {/* 指數不分台股/美股市場別，市場參數固定傳 "TW" 是為了走我們自己畫的圖表（讀 stock_history.json），不是真的代表這是台股 */}
          <StockPriceChart ticker={expanded} market="TW" theme={theme} />
        </div>
      )}
    </div>
  );
}

function WatchStockAdder({ addWatchStock, refreshWatchStocks, C, iSt, tr }) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [market, setMarket] = useState("TW");
  const add = () => {
    if (!ticker.trim()) return;
    addWatchStock({ ticker:ticker.trim().toUpperCase(), name:name.trim(), market, curPrice:0 });
    setTicker(""); setName("");
    // 加入後不用等使用者自己再按一次「更新報價」，直接自動抓一次名稱跟現價
    setTimeout(() => refreshWatchStocks(), 100);
  };
  return (
    <div style={{ marginBottom:14, padding:12, borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder={tr("代號 如 2330")} style={{ ...iSt, flex:1, minWidth:0 }} />
        <select value={market} onChange={e => setMarket(e.target.value)} style={{ ...iSt, flex:"0 0 68px" }}>
          <option value="TW">TW</option>
          <option value="US">US</option>
        </select>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={tr("名稱（選填）")} style={{ ...iSt, flex:1, minWidth:0 }} onKeyDown={e => { if (e.key==="Enter") add(); }} />
        <button onClick={add} style={{ flexShrink:0, padding:"0 20px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer" }}>{tr("加入")}</button>
      </div>
    </div>
  );
}

/* ── 每日投資波動：每個交易日一根柱子＝那天投資組合賺了或賠了多少（未實現＋已實現損益的變化，台幣）。
   資料來自 App 每個交易日記的一筆快照，從開始記錄那天起才會有，前面的日子補不回來 ── */
function DailySwingCard({ history, C, fmt, pnlColor, maskStyle, tr, Card }) {
  const [range, setRange] = useState(30);
  const hist = history || [];
  const days = [];
  for (let i = 1; i < hist.length; i++) {
    const prev = hist[i - 1], cur = hist[i];
    days.push({ date: cur.date, label: `${+cur.date.slice(5, 7)}/${+cur.date.slice(8)}`, change: cur.pnl - prev.pnl, pct: prev.mv > 0 ? (cur.pnl - prev.pnl) / prev.mv * 100 : null, mv: cur.mv });
  }
  const shown = days.slice(-range);
  const latest = days[days.length - 1];
  const total = shown.reduce((s, d) => s + d.change, 0);
  const upDays = shown.filter(d => d.change > 0).length, downDays = shown.filter(d => d.change < 0).length;
  const signed = (v) => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v))}`;

  return (
    <Card style={{ padding:"16px 16px 12px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:900, color:C.muted, letterSpacing:"0.05em" }}>{tr("每日投資波動")}</span>
        {days.length > 0 && (
          <div style={{ display:"flex", gap:4 }}>
            {[30, 90].map(n => (
              <button key={n} onClick={() => setRange(n)} style={{ padding:"3px 9px", borderRadius:8, border:"none", fontSize:11, fontWeight:700, cursor:"pointer", background:range===n?C.accent:C.bg, color:range===n?"#fff":C.muted }}>{n}{tr("天")}</button>
            ))}
          </div>
        )}
      </div>
      {days.length === 0 ? (
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, padding:"6px 0 4px" }}>
          {hist.length === 1 ? `${tr("已記錄")} ${hist[0].date}。` : ""}{tr("每個交易日下午報價更新後，會記一筆你的投資組合，從第二天起這裡就會出現每天賺賠的柱狀圖。")}
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:10, color:C.textSub }}>{latest.label} {tr("單日")}</div>
              <div style={{ fontSize:20, fontWeight:900, color:pnlColor(latest.change, C), ...maskStyle }}>{signed(latest.change)}</div>
              {latest.pct != null && <div style={{ fontSize:11, fontWeight:700, color:pnlColor(latest.change, C) }}>{latest.pct >= 0 ? "+" : ""}{latest.pct.toFixed(2)}%</div>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:C.textSub }}>{tr("近")} {shown.length} {tr("個交易日")}</div>
              <div style={{ fontSize:20, fontWeight:900, color:pnlColor(total, C), ...maskStyle }}>{signed(total)}</div>
              <div style={{ fontSize:11, color:C.muted }}>{tr("漲")} {upDays}・{tr("跌")} {downDays}</div>
            </div>
          </div>
          <div style={{ height:150, ...maskStyle }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shown} margin={{ top:4, right:4, left:4, bottom:0 }} barCategoryGap={shown.length > 40 ? 1 : 2}>
                <XAxis dataKey="label" tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis hide domain={["auto", "auto"]} />
                <ReferenceLine y={0} stroke={C.border} />
                <Tooltip cursor={{ fill:`${C.text}10` }} contentStyle={{ background:C.surface || C.card, border:`1px solid ${C.border}`, borderRadius:10, fontSize:12 }} labelStyle={{ color:C.textSub }}
                  formatter={(v, _n, item) => [`${signed(v)}${item.payload.pct != null ? `（${item.payload.pct >= 0 ? "+" : ""}${item.payload.pct.toFixed(2)}%）` : ""}`, tr("當日")]} />
                <Bar dataKey="change" radius={[3, 3, 3, 3]} maxBarSize={18}>
                  {shown.map(d => <Cell key={d.date} fill={pnlColor(d.change, C)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>{tr("每根柱子＝當天投資組合損益的變化（含已實現），已換算台幣。")}</div>
        </>
      )}
    </Card>
  );
}

/* ── 績效：這段原本被誤刪只剩大盤指數（大盤搬到「自選股」分頁），這裡補回真正的績效內容：
   勝率與賺賠比、最大回撤、跟 0050 比較、股息、不同心態下的成績 ── */
function PerfTab({ C, tr, fmt, pnlColor, maskStyle, tradeStats, maxDrawdown, benchmarkData, loadingBenchmark, fetchBenchmarkCompare, emotionReview,
  dividendEst, loadingDiv, fetchDividendEstimate, dividendAnnounce, loadingDivAnn, divAnnFetched, fetchDividendAnnounce }) {
  const card = { borderRadius:16, background:C.card, padding:"14px 16px", marginBottom:12 };
  const title = (t, right) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
      <span style={{ fontSize:13, fontWeight:800, color:C.text }}>{t}</span>{right}
    </div>
  );
  const refreshBtn = (onClick, loading) => (
    <button onClick={onClick} style={{ padding:"5px 10px", borderRadius:10, background:C.bg, border:"none", color:C.accentL, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>{loading ? tr("讀取中…") : `🔄 ${tr("讀取")}`}</button>
  );
  const stat = (label, value, color, sub) => (
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:10.5, color:C.muted }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:900, color, marginTop:2, ...maskStyle }}>{value}</div>
      {sub && <div style={{ fontSize:10.5, color:C.muted, marginTop:1, ...maskStyle }}>{sub}</div>}
    </div>
  );
  const empty = (t) => <div style={{ fontSize:12, color:C.muted, padding:"6px 0 2px", lineHeight:1.6 }}>{t}</div>;
  const ts = tradeStats || {};

  return (
    <div>
      {/* 勝率與賺賠比 */}
      <div style={card}>
        {title(tr("勝率與賺賠比"))}
        {!ts.totalSells ? empty(tr("還沒有賣出紀錄，賣出後這裡會統計你的勝率和平均賺賠")) : <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {stat(tr("勝率"), `${ts.winRate.toFixed(0)}%`, ts.winRate >= 50 ? C.income : C.expense, `${ts.wins} ${tr("勝")}・${ts.losses} ${tr("敗")}`)}
            {stat(tr("賺賠比"), ts.winLossRatio ? `${ts.winLossRatio.toFixed(2)} : 1` : "—", C.text, `${tr("平均賺")} ${fmt(Math.round(ts.avgWin || 0))}・${tr("平均賠")} ${fmt(Math.round(Math.abs(ts.avgLoss || 0)))}`)}
          </div>
          <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
            {ts.avgR != null ? <>
              <div style={{ fontSize:10.5, color:C.muted }}>{tr("平均 R 值")}（{ts.rCount} {tr("筆有設停損")}）</div>
              <div style={{ fontSize:16, fontWeight:900, color:ts.avgR >= 0 ? C.income : C.expense }}>{ts.avgR >= 0 ? "+" : ""}{ts.avgR.toFixed(2)} R</div>
              <div style={{ fontSize:10.5, color:C.muted, marginTop:2, lineHeight:1.5 }}>{tr("賺賠相對於停損風險的倍數，+2R＝賺到當初願意承受虧損的 2 倍")}</div>
            </> : <div style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>{tr("在個股詳細頁設定「停損%」，之後賣出就會算 R 值")}</div>}
          </div>
          {ts.disciplinedCount > 0 && (
            <div style={{ marginTop:10, padding:"8px 10px", borderRadius:10, background:ts.brokeStopCount > 0 ? `${C.warn}15` : `${C.teal}15`, fontSize:12, fontWeight:700, color:ts.brokeStopCount > 0 ? C.warn : C.teal }}>
              {tr("停損紀律")}：{ts.disciplinedCount} {tr("筆有設停損，其中")} {ts.brokeStopCount} {tr("筆是跌破停損後才賣")}
            </div>
          )}
        </>}
      </div>

      {/* 最大回撤 */}
      <div style={card}>
        {title(tr("最大回撤"))}
        {maxDrawdown ? <>
          <div style={{ fontSize:22, fontWeight:900, color:C.expense }}>−{maxDrawdown.pct.toFixed(1)}%</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{tr("資產從最高點往下掉最多的幅度")}（{maxDrawdown.source === "daily" ? tr("依每日市值") : tr("依每月資產估算")}）</div>
        </> : empty(tr("資料還不夠；到「總覽 → 投資成長 → 每日」讀一次走勢就會有"))}
      </div>

      {/* 跟大盤比較 */}
      <div style={card}>
        {title(tr("跟大盤（0050）比"), refreshBtn(fetchBenchmarkCompare, loadingBenchmark))}
        {benchmarkData.length > 1 ? (() => {
          const last = benchmarkData[benchmarkData.length - 1] || {};
          const diff = (last.portfolio ?? 0) - (last.benchmark ?? 0);
          return <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:10 }}>
              {stat(tr("我的投組"), `${(last.portfolio ?? 0) >= 0 ? "+" : ""}${last.portfolio ?? 0}%`, pnlColor(last.portfolio ?? 0, C))}
              {stat("0050", `${(last.benchmark ?? 0) >= 0 ? "+" : ""}${last.benchmark ?? 0}%`, C.textSub, diff >= 0 ? `${tr("贏大盤")} ${diff.toFixed(1)}%` : `${tr("輸大盤")} ${Math.abs(diff).toFixed(1)}%`)}
            </div>
            <div style={{ height:150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={benchmarkData} margin={{ top:4, right:4, bottom:0, left:-8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                  <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={40} />
                  <Tooltip contentStyle={{ background:C.surface || C.card, border:`1px solid ${C.border}`, borderRadius:10, fontSize:12 }} formatter={(v, n) => [`${v}%`, n === "portfolio" ? tr("我的投組") : "0050"]} />
                  <Line type="monotone" dataKey="portfolio" stroke={C.accent} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" stroke={C.muted} strokeWidth={2} dot={false} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:6, fontSize:11, color:C.textSub }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:14, height:2, background:C.accent }} />{tr("我的投組")}</span>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:14, height:0, borderTop:`2px dashed ${C.muted}` }} />0050</span>
            </div>
          </>;
        })() : empty(loadingBenchmark ? tr("讀取中…") : tr("按右上角「讀取」，比較你的投組和 0050 同期間的報酬"))}
      </div>

      {/* 股息 */}
      <div style={card}>
        {title(tr("股息（近一年實際配息估算）"), refreshBtn(fetchDividendEstimate, loadingDiv))}
        {dividendEst.length > 0 ? <>
          <div style={{ fontSize:20, fontWeight:900, color:C.income, ...maskStyle }}>{fmt(Math.round(dividendEst.reduce((s, x) => s + x.annualDiv, 0)))}<span style={{ fontSize:12, fontWeight:600, color:C.muted }}> / {tr("年")}</span></div>
          <div style={{ marginTop:8 }}>
            {dividendEst.map(x => (
              <div key={x.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"6px 0", borderTop:`1px solid ${C.border}`, color:C.textSub }}>
                <span>{x.ticker} {x.name}</span><span style={{ fontWeight:700, color:C.text, ...maskStyle }}>{fmt(Math.round(x.annualDiv))}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10.5, color:C.muted, marginTop:6 }}>{tr("用過去 12 個月實際配息 × 目前股數估算，美股已換算台幣；不是未來預測")}</div>
        </> : empty(loadingDiv ? tr("讀取中…") : tr("按右上角「讀取」，估算持股一年大約能領多少股息"))}
      </div>

      <div style={card}>
        {title(tr("股利公告（證交所）"), refreshBtn(fetchDividendAnnounce, loadingDivAnn))}
        {!divAnnFetched ? empty(loadingDivAnn ? tr("讀取中…") : tr("按右上角「讀取」，查上市持股公司已公告的現金股利"))
          : dividendAnnounce.length === 0 ? empty(tr("沒有上市持股，或查不到資料（上櫃、美股不在這份公告裡）"))
          : dividendAnnounce.map((x, i) => (
            <div key={x.ticker} style={{ padding:"8px 0", borderTop:i>0?`1px solid ${C.border}`:"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{x.ticker} {x.name}</span>
                {x.announced ? <span style={{ fontSize:13, fontWeight:900, color:C.income, ...maskStyle }}>{fmt(Math.round(x.estIncome))}</span> : <span style={{ fontSize:11, color:C.muted }}>{tr("尚未公告")}</span>}
              </div>
              {x.announced && <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>{x.year}{tr("年度")}・{tr("每股")} {x.cashDivPerShare} {tr("元")}・{x.distDate || tr("分派日未定")}</div>}
            </div>
          ))}
      </div>

      {/* 心態回顧 */}
      <div style={card}>
        {title(tr("不同心態下的成績"))}
        <div style={{ fontSize:11, color:C.muted, marginBottom:8, lineHeight:1.6 }}>{tr("買賣時標記當下心態，累積夠多筆就看得出「衝動下的單」和「計畫內的單」差多少")}</div>
        {emotionReview.length === 0 ? empty(tr("還沒有標記過心態的交易")) : emotionReview.map((em, i) => {
          const winRate = em.sellCount > 0 ? em.sellWin / em.sellCount * 100 : null;
          const avgPnl = em.sellCount > 0 ? em.sellPnl / em.sellCount : null;
          return (
            <div key={em.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderTop:i>0?`1px solid ${C.border}`:"none" }}>
              <div style={{ width:32, height:32, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{em.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{em.label}</div>
                <div style={{ fontSize:10.5, color:C.muted }}>{tr("買進")} {em.buyCount} {tr("次")}・{tr("賣出")} {em.sellCount} {tr("次")}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:winRate == null ? C.muted : winRate >= 50 ? C.income : C.expense }}>{winRate == null ? "—" : `${tr("勝率")} ${winRate.toFixed(0)}%`}</div>
                {avgPnl != null && <div style={{ fontSize:10.5, color:pnlColor(avgPnl, C), ...maskStyle }}>{tr("平均")} {avgPnl >= 0 ? "+" : "−"}{fmt(Math.abs(Math.round(avgPnl)))}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
