import { useState } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function InvestPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
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
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF,
  setSettleDebt, setEditDebt, setSelPool, setSelAcc, selAcc,
  setNAcc, setPayF, setSelSub, setSelBill, setSelPolicy, setSelTxn,
  nG, setNG, editGoal, setEditGoal, nPL, setNPL,
  moDate, setMoDate, searchQ, setSearchQ, APP_VER, changeTheme, THEMES,
  showHDP, setShowHDP, nS, setNS, nB, setNB, sortMode, setSortMode, visMode, setVisMode, nD, setND,
  // 共用 UI atoms
  Card, SH, Bdg, SwipeRow, Btn, InfoBtn
}) {

  const [growthMode, setGrowthMode] = useState("monthly");

  return (
    <>
      {tab === "invest" && (
        <div style={{ padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>📈</span><span style={{ fontWeight:900, fontSize:16, color:C.text }}>投資追蹤</span></div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn sz="sm" v="secondary" onClick={() => setModal("initStock")}>📋 現有持股</Btn>
              <Btn sz="sm" onClick={() => setModal("buyStock")}>＋ 買入</Btn>
            </div>
          </div>
          
          <div style={{ display:"flex", gap:4, padding:4, borderRadius:14, background:C.surface, marginBottom:20 }}>
            {[{ v:"holdings", l:"持股" }, { v:"review", l:"情緒回顧" }, { v:"news", l:"新聞" }, { v:"learn", l:"學習" }].map(t => <button key={t.v} onClick={() => setInvTab(t.v)} style={{ flex:1, padding:"8px 4px", borderRadius:10, fontSize:12, fontWeight:900, background:invTab === t.v ? C.accent : "transparent", color:invTab === t.v ? "#fff" : C.muted, border:"none", cursor:"pointer" }}>{t.l}</button>)}
          </div>
          
          {invTab === "holdings" && (
            <div>
              {recentTradeCount > TRADE_FREQ_WARN && (
                <Card style={{ padding:14, marginBottom:14, background:`${C.warn}15`, border:`1px solid ${C.warn}55` }}>
                  <div style={{ fontSize:13, fontWeight:900, color:C.warn, marginBottom:4 }}>⚠️ 交易有點頻繁</div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.5 }}>近 7 天你已經買賣了 {recentTradeCount} 次，留意一下是不是進出太密集、有點失去紀律。</div>
                </Card>
              )}

              {watchlist.length > 0 && (
                <Card style={{ padding:16, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:900, color:C.text, marginBottom:10 }}>🧊 冷靜清單</div>
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
                            <div style={{ fontSize:11, color:ready?C.income:C.muted, marginTop:2, fontWeight:ready?700:400 }}>{ready ? "✅ 冷靜期已過，可以下單了" : `還要等 ${remainH > 0 ? `${remainH}小時` : ""}${remainM}分鐘`}</div>
                          </div>
                          {ready && <button onClick={() => { setBuyF(p => ({ ...p, ticker:w.ticker, name:w.name, market:w.market, acc:w.acc || p.acc })); removeFromWatchlist(w.id); setModal("buyStock"); }} style={{ padding:"6px 12px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>前往買入</button>}
                          <button onClick={() => removeFromWatchlist(w.id)} style={{ padding:"6px 8px", borderRadius:10, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontSize:12, cursor:"pointer", flexShrink:0 }}>移除</button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card style={{ padding:20, marginBottom:16, background:`linear-gradient(135deg,${C.surface},${C.bg})` }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>投資市值</div>
                    <div style={{ fontWeight:900, fontSize:20, color:C.accentL }}>{fmt(stTotMv > 0 ? stTotMv : stTotCost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>持股 {new Set(stSum.filter(s=>s.totalSh>0).map(s=>`${s.ticker}_${s.market}`)).size} 檔</div>
                    <div style={{ fontWeight:700, fontSize:14, color:C.muted }}>成本 {fmt(stTotCost)}</div>
                  </div>
                </div>
                
                {stTotMv > 0 && stTotCost > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:`1px solid ${C.border}`, marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>未實現損益</div>
                      <div style={{ fontWeight:900, fontSize:16, color:pnlColor(stTotMv-stTotCost, C) }}>
                        {stTotMv-stTotCost >= 0 ? "▲ +" : "▼ "}{fmt(Math.abs(stTotMv-stTotCost))}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>報酬率</div>
                      <div style={{ fontWeight:900, fontSize:16, color:pnlColor(stTotMv-stTotCost, C) }}>
                        {stTotCost > 0 ? `${stTotMv-stTotCost >= 0 ? "+" : ""}${((stTotMv-stTotCost)/stTotCost*100).toFixed(2)}%` : "—"}
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:10, background:`${C.accent}12`, border:`1px solid ${C.accent}33` }}>
                  <div>
                    <span style={{ fontSize:12, color:C.accentL }}>總資產計入未實現損益</span>
                    {useMvForAssets && <div style={{ fontSize:10, color:stTotMv>0?C.teal:C.muted, marginTop:2 }}>{stTotMv>0 ? `市值 ${fmt(stTotMv)}` : "⏳ 等待市價載入…"}</div>}
                  </div>
                  <button onClick={toggleMv} style={{ width:44, height:24, borderRadius:12, background:useMvForAssets?C.income:C.muted, border:"none", cursor:"pointer", position:"relative", flexShrink:0 }}>
                    <span style={{ position:"absolute", top:2, left:useMvForAssets?22:2, width:20, height:20, borderRadius:10, background:"#fff", transition:"left .2s", display:"block" }} />
                  </button>
                </div>
              </Card>
              
              <Card style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  {[{ v:"alloc", l:"資產配置" }, { v:"hold", l:"持股比例" }, { v:"growth", l:"投資成長" }].map(o => <button key={o.v} onClick={() => setInvPie(o.v)} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:12, fontWeight:700, background:invPie === o.v ? `${C.accent}30` : C.card, color:invPie === o.v ? C.accentL : C.muted, border:`1px solid ${invPie === o.v ? C.accent : C.border}`, cursor:"pointer" }}>{o.l}</button>)}
                </div>
                {invPie === "growth"
                  ? (
                    <div>
                      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                        <button onClick={() => setGrowthMode("monthly")} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:11, fontWeight:700, background:growthMode==="monthly"?`${C.accent}28`:C.card, color:growthMode==="monthly"?C.accentL:C.muted, border:`1px solid ${growthMode==="monthly"?C.accent:C.border}`, cursor:"pointer" }}>月度成本/市值</button>
                        <button onClick={() => { setGrowthMode("daily"); if (!dailyGrowth.length && !loadingDaily) fetchDailyGrowth(); }} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:11, fontWeight:700, background:growthMode==="daily"?`${C.accent}28`:C.card, color:growthMode==="daily"?C.accentL:C.muted, border:`1px solid ${growthMode==="daily"?C.accent:C.border}`, cursor:"pointer" }}>每日收盤走勢</button>
                      </div>
                      {growthMode === "monthly" ? (
                        invGrowth.length > 1 ? (
                          <div>
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={invGrowth} margin={{ top:5, right:5, bottom:0, left:0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                                <XAxis dataKey="m" tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/10000).toFixed(0)}萬`} />
                                <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={(v,n) => [fmt(v), n==="cost"?"投入成本":"當前市值"]} />
                                <Line type="monotone" dataKey="cost" stroke={theme==="light"?"#222":"#eee"} strokeWidth={2} dot={false} name="cost" />
                                {stTotMv > 0 && <Line type="monotone" dataKey="mv" stroke={C.income} strokeWidth={2.5} dot={false} name="mv" />}
                              </LineChart>
                            </ResponsiveContainer>
                            <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.textSub }}><div style={{ width:16, height:2, background:theme==="light"?"#222":"#eee" }} />投入成本</div>
                              {stTotMv > 0 && <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.textSub }}><div style={{ width:16, height:2, background:C.income }} />市值</div>}
                            </div>
                            {stTotMv === 0 && <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:6 }}>市價載入後顯示市值曲線</div>}
                          </div>
                        ) : <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>需要至少兩筆買入記錄才能顯示成長圖</div>
                      ) : (
                        loadingDaily ? (
                          <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>讀取每日收盤價中…</div>
                        ) : dailyGrowth.length > 1 ? (
                          <div>
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={dailyGrowth} margin={{ top:5, right:5, bottom:0, left:0 }}>
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
                        <div style={{ textAlign:"right" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ fontSize:10, color:C.muted, background:`${C.muted}18`, padding:"1px 5px", borderRadius:4 }}>{hasPrices?"市值":"成本"}</span>
                            <div style={{ fontWeight:900, fontSize:13, color:C.text }}>{fmt(hasPrices ? accMv : accCost)}</div>
                          </div>
                          {hasPrices && accPnl !== 0 && <div style={{ fontSize:11, color:pnlColor(accPnl, C) }}>{accPnl>0?"▲ +":"▼ "}{fmt(Math.abs(accPnl))}</div>}
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
                          return (
                            <SwipeRow key={st.id} onDelete={() => confirm(`確定刪除 ${st.ticker}？`, () => upd("stocks", p => p.filter(s => s.id !== st.id)))} onEdit={() => { setSelStock(st); setModal("stockDetail"); }} onClick={() => { setSelStock(st); setModal("stockDetail"); }}>
                              <div style={{ padding:"12px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                    <span style={{ fontWeight:900, fontSize:14, color:C.text }}>{st.ticker}</span>
                                    <span style={{ fontSize:12, color:C.textSub }}>{st.name}</span>
                                    <Bdg color={st.market === "US" ? C.accent : C.teal}>{st.market}</Bdg>
                                  </div>
                                  <div style={{ textAlign:"right", flexShrink:0 }}>
                                    <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{fmt(dispMv)}</div>
                                    {hasPrice ? (
                                      <div style={{ fontSize:11, color:pnlColor(pnl, C), fontWeight:700 }}>
                                        {pnl > 0 ? "▲ +" : pnl < 0 ? "▼ " : ""}{fmt(Math.abs(pnl))} ({pnlPct > 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                                        {st.stopLossPct && pnlPct <= -Math.abs(st.stopLossPct) && <span style={{ marginLeft:4, color:C.danger, fontWeight:900 }}>🔴 達停損</span>}
                                      </div>
                                    ) : <div style={{ fontSize:11, color:C.muted }}>載入市價中…</div>}
                                  </div>
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted }}>
                                  <span>{st.totalSh}股 · 均 {fmt(Math.round(st.avgCost || 0))}/股</span>
                                  {hasPrice ? <span style={{ color:C.textSub }}>市價 {fmt(st.curPrice)}{st.lastUpdated ? ` · ${st.lastUpdated}` : ""}</span> : <span>成本 {fmt(st.totalCost)}</span>}
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
              {stSum.length === 0 && <div style={{ padding:"40px 0", textAlign:"center", color:C.muted }}><div style={{ fontSize:38, marginBottom:8 }}>📊</div>尚無持股，點右上角「＋買入」</div>}
            </div>
          )}
          
          {invTab === "review" && (
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
                每次買賣時標記當下的心態，累積夠多筆之後，這裡會告訴你「衝動下的單」跟「計畫內的單」績效差多少——用數據戳破自己的僥倖心理。
              </div>
              {emotionReview.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:13 }}>
                  還沒有標記過情緒的交易紀錄<br/>下次買賣股票時，記得選一下當下的心態
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {emotionReview.map(em => {
                    const winRate = em.sellCount > 0 ? (em.sellWin / em.sellCount * 100) : null;
                    const avgPnl = em.sellCount > 0 ? em.sellPnl / em.sellCount : null;
                    return (
                      <Card key={em.key} style={{ padding:16 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                          <span style={{ fontSize:20 }}>{em.icon}</span>
                          <span style={{ fontWeight:900, fontSize:14, color:C.text }}>{em.label}</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                          <div>
                            <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>買進次數</div>
                            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{em.buyCount} 次{em.buyTotal > 0 ? `　${fmt(em.buyTotal)}` : ""}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>賣出勝率</div>
                            <div style={{ fontWeight:700, fontSize:14, color:winRate===null?C.muted:winRate>=50?C.income:C.expense }}>{winRate===null ? "尚無資料" : `${winRate.toFixed(0)}% (${em.sellWin}/${em.sellCount})`}</div>
                          </div>
                        </div>
                        {avgPnl !== null && (
                          <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:11, color:C.textSub }}>平均每筆損益</span>
                            <span style={{ fontWeight:900, fontSize:14, color:pnlColor(avgPnl, C) }}>{avgPnl >= 0 ? "+" : ""}{fmt(Math.round(avgPnl))}</span>
                          </div>
                        )}
                      </Card>
                    );
                  })}
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
