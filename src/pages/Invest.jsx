import { useState } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function InvestPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, DAYS,
  chartData, chartRange, setChartRange, isSingleMo, allocPie, holdPie, invGrowth,
  incCat, expCat, chartView, setChartView, healthRange, setHealthRange,
  useMvForAssets, toggleMv, poolThisMo, fetchAllPrices, ALL_CURS, theme,
  collapsed, toggleSection, setNT, T0, descHistoryByCat, tagsHistory,
  invTab, setInvTab, invPie, setInvPie, LEARN_DATA, MANUAL_DATA,
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF,
  setSettleDebt, setEditDebt, setSelPool, setSelAcc, selAcc,
  setNAcc, setPayF, setSelSub, setSelBill, setSelPolicy, setSelTxn,
  nG, setNG, editGoal, setEditGoal, nPL, setNPL,
  moDate, setMoDate, searchQ, setSearchQ, APP_VER, changeTheme, THEMES,
  showHDP, setShowHDP, nS, setNS, nB, setNB, sortMode, setSortMode, visMode, setVisMode, nD, setND,
  // 關鍵！精確接收大腦配送過來的基礎 UI 元件
  Card, SH, Bdg, SwipeRow, Btn, InfoBtn
}) {

  return (
    <>
      {/* 修正致命的語法錯誤：{tab} "invest" ➜ tab === "invest" */}
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
            {[{ v:"holdings", l:"持股" }, { v:"news", l:"新聞" }, { v:"learn", l:"學習" }].map(t => <button key={t.v} onClick={() => setInvTab(t.v)} style={{ flex:1, padding:"8px 4px", borderRadius:10, fontSize:12, fontWeight:900, background:invTab === t.v ? C.accent : "transparent", color:invTab === t.v ? "#fff" : C.muted, border:"none", cursor:"pointer" }}>{t.l}</button>)}
          </div>
          
          {invTab === "holdings" && (
            <div>
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
                  ? invGrowth.length > 1
                    ? (
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
                    )
                    : <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>需要至少兩筆買入記錄才能顯示成長圖</div>
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
                items:[{ title:"新手理財入門指南", tag:"入門", url:"https://rich01.com/mr-market-for-new/" }]
              },{
                section:"📈 股票投資", key:"learn_stock",
                items:[
                  { title:"股票是什麼？買股票就是買公司的一部分", tag:"基礎", url:"https://rich01.com/what-is-stock/" },
                  { title:"ETF 是什麼？為什麼適合一般投資人", tag:"基礎", url:"https://rich01.com/etf-intro/" },
                  { title:"0050 vs 0056，哪個適合你？", tag:"台股", url:"https://rich01.com/0050-vs-0056/" },
                  { title:"定期定額投資法，降低進場時機風險", tag:"策略", url:"https://rich01.com/dollar-cost-averaging/" },
                  { title:"股票的本益比（PE）怎麼看？", tag:"進階", url:"https://rich01.com/pe-ratio/" },
                ]
              },{
                section:"🏦 資產配置", key:"learn_alloc",
                items:[
                  { title:"資產配置是什麼？分散風險的核心概念", tag:"重要", url:"https://rich01.com/asset-allocation/" },
                  { title:"股債配置：股票與債券的比例怎麼決定", tag:"策略", url:"https://rich01.com/stock-bond-allocation/" },
                  { title:"全球分散投資：為什麼不要只買台股", tag:"策略", url:"https://rich01.com/global-diversification/" },
                  { title:"懶人投資法：長期持有 ETF 的優缺點", tag:"策略", url:"https://rich01.com/passive-investing/" },
                ]
              },{
                section:"🛡️ 風險管理", key:"learn_risk",
                items:[
                  { title:"投資風險有哪些？如何評估自己的風險承受度", tag:"重要", url:"https://rich01.com/investment-risk/" },
                  { title:"停損是什麼？設停損點的邏輯", tag:"策略", url:"https://rich01.com/stop-loss/" },
                  { title:"不要把雞蛋放在同一個籃子裡", tag:"基礎", url:"https://rich01.com/diversification/" },
                ]
              },{
                section:"💰 理財規劃", key:"learn_plan",
                items:[
                  { title:"50/30/20 法則：收入分配的簡單框架", tag:"入門", url:"https://rich01.com/50-30-20-rule/" },
                  { title:"財務自由是什麼？FIRE 運動介紹", tag:"目標", url:"https://rich01.com/fire-movement/" },
                  { title:"退休規劃：幾歲開始存才夠？", tag:"規劃", url:"https://rich01.com/retirement-planning/" },
                  { title:"保險怎麼買？先保障再儲蓄的原則", tag:"規劃", url:"https://rich01.com/insurance-basic/" },
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
