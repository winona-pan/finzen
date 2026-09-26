import { useState, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  dailyPnlHeatmap, sectorPie, updateStockMeta,
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
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>📈</span><span style={{ fontWeight:900, fontSize:16, color:C.text }}>{tr("投資追蹤")}</span></div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn sz="sm" v="secondary" onClick={() => setModal("initStock")}>📋 現有持股</Btn>
              <Btn sz="sm" onClick={() => setModal("buyStock")}>＋ 買入</Btn>
            </div>
          </div>
          
          <div style={{ display:"flex", gap:4, padding:4, borderRadius:14, background:C.surface, marginBottom:20, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
            {[{ v:"dashboard", l:tr("總覽") }, { v:"holdings", l:tr("持股") }, { v:"log", l:tr("交易記錄") }, { v:"perf", l:tr("績效") }, { v:"watch", l:tr("自選股") }, { v:"news", l:tr("新聞") }, { v:"learn", l:tr("學習") }].map(t => <button key={t.v} onClick={() => setInvTab(t.v)} style={{ flex:"0 0 auto", padding:"8px 14px", borderRadius:10, fontSize:12, fontWeight:900, background:invTab === t.v ? C.accent : "transparent", color:invTab === t.v ? "#fff" : C.muted, border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>{t.l}</button>)}
          </div>
          
          {invTab === "dashboard" && (
            <div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8 }}>
                <button onClick={async () => { setLoadingHoldings(true); try { await Promise.all([fetchAllPrices(), refreshWatchStocks()]); } finally { setLoadingHoldings(false); } }} style={{ padding:"5px 10px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:11, cursor:"pointer" }}>{loadingHoldings ? tr("讀取中…") : `🔄 ${tr("更新報價")}`}</button>
              </div>

              <Card style={{ padding:20, marginBottom:16, background:`linear-gradient(135deg,${C.surface},${C.bg})` }} onClick={() => hideAmounts && doPeek()}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12, cursor:hideAmounts?"pointer":"default" }}>
                  <div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>{tr("投資市值")}</div>
                    <div style={{ fontWeight:900, fontSize:20, color:C.accentL, ...maskStyle }}>{fmt(stTotMv > 0 ? stTotMv : stTotCost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>{tr("即時現金")}</div>
                    <div style={{ fontWeight:900, fontSize:20, color:C.teal, ...maskStyle }}>{fmt(cashBal)}</div>
                  </div>
                </div>

                {stTotMv > 0 && stTotCost > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:`1px solid ${C.border}`, marginBottom:12, cursor:hideAmounts?"pointer":"default" }}>
                    <div>
                      <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{tr("未實現損益")}</div>
                      <div style={{ fontWeight:900, fontSize:16, color:pnlColor(stTotMv-stTotCost, C), ...maskStyle }}>
                        {stTotMv-stTotCost >= 0 ? "▲ +" : "▼ "}{fmt(Math.abs(stTotMv-stTotCost))}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{tr("報酬率")}</div>
                      <div style={{ fontWeight:900, fontSize:16, color:pnlColor(stTotMv-stTotCost, C), ...maskStyle }}>
                        {stTotCost > 0 ? `${stTotMv-stTotCost >= 0 ? "+" : ""}${((stTotMv-stTotCost)/stTotCost*100).toFixed(2)}%` : "—"}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{tr("已實現損益")}</div>
                    <div style={{ fontWeight:900, fontSize:16, color:pnlColor(totalRealizedPnl, C), ...maskStyle }}>
                      {tradeStats.totalSells > 0 ? `${totalRealizedPnl >= 0 ? "▲ +" : "▼ "}${fmt(Math.abs(Math.round(totalRealizedPnl)))}` : "—"}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{tr("總資產淨值")}</div>
                    <div style={{ fontWeight:900, fontSize:16, color:C.text, ...maskStyle }}>{fmt(netWorth != null ? netWorth : totAssets)}</div>
                  </div>
                </div>
              </Card>

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
                                <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/10000).toFixed(0)}萬`} />
                                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={(v) => [fmt(v), "投入成本"]} />
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
                                <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/10000).toFixed(0)}萬`} domain={["auto","auto"]} />
                                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v => [fmt(v), "市值"]} />
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
                  : <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={invPie === "alloc" ? allocPie : holdPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={30}>{(invPie === "alloc" ? allocPie : holdPie).map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} formatter={(v, n) => [fmt(v), n]} /></PieChart></ResponsiveContainer>
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
                <button onClick={async () => { setLoadingHoldings(true); try { await Promise.all([fetchAllPrices(), refreshWatchStocks()]); } finally { setLoadingHoldings(false); } }} style={{ padding:"5px 10px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:11, cursor:"pointer" }}>{loadingHoldings ? tr("讀取中…") : `🔄 ${tr("更新報價")}`}</button>
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
                                  <span>{st.totalSh}股 · 均 {fmt(Math.round(st.avgCost || 0), stCur)}/股</span>
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
                    <PieChart><Pie data={sectorPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={30}>{sectorPie.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} formatter={(v, n) => [fmt(v), n]} /></PieChart>
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

              {Object.keys(dailyPnlHeatmap).length > 0 && (
                <Card style={{ padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:900, color:C.muted, marginBottom:10, letterSpacing:"0.05em" }}>每日損益熱力圖（近 90 天）</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(15, 1fr)", gap:3 }}>
                    {Array.from({ length:90 }).map((_, i) => {
                      const d = new Date(TODAY+"T00:00:00"); d.setDate(d.getDate() - (89 - i));
                      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                      const val = dailyPnlHeatmap[key] || 0;
                      const intensity = Math.min(Math.abs(val) / 2000, 1);
                      const bg = val > 0 ? `rgba(74,222,128,${0.15+intensity*0.7})` : val < 0 ? `rgba(244,63,94,${0.15+intensity*0.7})` : C.border;
                      return <div key={i} title={`${key}: ${val>=0?"+":""}${Math.round(val)}`} style={{ aspectRatio:"1", borderRadius:3, background:bg }} />;
                    })}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10, color:C.muted }}>
                    <span>綠＝淨收入　紅＝淨支出</span>
                    <span>顏色越深代表金額越大</span>
                  </div>
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
            <div>
              <IndexBar C={C} tr={tr} StockPriceChart={StockPriceChart} theme={theme} />
            </div>
          )}

          {invTab === "watch" && (
            <div>
              <WatchStockAdder addWatchStock={addWatchStock} refreshWatchStocks={refreshWatchStocks} C={C} iSt={iSt} tr={tr} />
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
                <button onClick={() => { refreshWatchStocks(); fetchAllPrices(); }} style={{ padding:"5px 10px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:11, cursor:"pointer" }}>{loadingWatch?tr("讀取中…"):`🔄 ${tr("更新報價")}`}</button>
              </div>
              {watchStocks.length === 0 ? (
                <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>{tr("還沒有自選股，上面加一支想追蹤的股票吧")}</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {watchStocks.map(w => (
                    <Card key={w.id} style={{ padding:0, overflow:"hidden" }}>
                      <SwipeRow onDelete={() => confirm(`${tr("移除自選股")}「${w.ticker}」？`, () => removeWatchStock(w.id))} onClick={() => setExpandedWatch(p => p===w.id?null:w.id)}>
                        <div style={{ padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{w.ticker} {w.name}</div>
                            <div style={{ fontSize:11, color:C.muted }}>{w.market}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontWeight:900, fontSize:15, color:C.text }}>{w.curPrice > 0 ? fmtPrice(w.curPrice, w.market === "US" ? "USD" : "TWD") : "—"}</div>
                            {w._extra?.chgPct !== undefined && <div style={{ fontSize:11, color:pnlColor(w._extra.chgPct, C) }}>{w._extra.chgPct>=0?"+":""}{w._extra.chgPct}%</div>}
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
