import { useState } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ChartsPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, buckets,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, hTxns, hInc, hExp, subsMo, billsMo,
  chartData, chartRange, setChartRange, isSingleMo, allocPie, holdPie, invGrowth, assetView, setAssetView, changeData,
  chartView, setChartView, healthRange, setHealthRange,
  useMvForAssets, setUseMvForAssets, poolThisMo, fetchAllPrices, ALL_CURS, theme,
  collapsed, toggleSection, setNT, T0, descHistoryByCat, tagsHistory,
  invTab, setInvTab, invPie, setInvPie, LEARN_DATA, MANUAL_DATA,
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF,
  setSettleDebt, setEditDebt, setSelPool, setSelAcc, selAcc,
  setNAcc, setPayF, setSelSub, setSelBill, setSelPolicy, setSelTxn,
  nG, setNG, editGoal, setEditGoal, nPL, setNPL, setSelPolicy: _sp, goalCurrentAmount,
  moDate, setMoDate, searchQ, setSearchQ, APP_VER, changeTheme, THEMES,
  showHDP, setShowHDP, nS, setNS, nB, setNB, sortMode, setSortMode, visMode, setVisMode, nD, setND,
  // 接收全域 UI Atoms 元件
  Card, SH, Bdg, Btn, DatePicker
}) {

  /* ── 局部狀態與月份切換 ── */
  const [showDP, setShowDP] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);
  const [catRange, setCatRange] = useState(null);
  const [showCatDP, setShowCatDP] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });
  
  const prevMo = () => setMonth(({ y, m }) => m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 });
  const nextMo = () => setMonth(({ y, m }) => m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 });

  /* ── 依本頁自己的月份重新計算收支（不依賴總覽頁的全域月份）── */
  const moTxns = catRange
    ? txns.filter(t => t.date >= catRange.s && t.date <= catRange.e)
    : txns.filter(t => { const [y, m] = t.date.split("-").map(Number); return y === month.y && m === month.m; });
  const moInc = moTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").reduce((s, t) => s + t.amt, 0);
  const moExp = moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + (t.proxyAmt ? t.amt - t.proxyAmt : t.amt), 0);
  const expCat = (() => { const m = {}; moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").forEach(t => { const own = t.proxyAmt ? t.amt - t.proxyAmt : t.amt; m[t.cat] = (m[t.cat] || 0) + own; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); })();
  const incCat = (() => { const m = {}; moTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amt; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); })();

  /* ── 資產水位圖 Y 軸：依實際資料範圍動態縮放，不是每次都從 0 開始 ── */
  const assetYDomain = (() => {
    const vals = chartData.map(d => d.assets).filter(v => v != null && !isNaN(v));
    if (!vals.length) return [0, "auto"];
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const span = maxV - minV;
    const pad = span > 0 ? span * 0.2 : Math.max(maxV * 0.05, 5000);
    const lo = Math.max(0, minV - pad), hi = maxV + pad;
    const step = hi - lo > 200000 ? 50000 : hi - lo > 50000 ? 10000 : 5000;
    return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  })();

  const rl = r => { 
    if (!r.s || !r.e) return "—"; 
    if (r.s === r.e) return r.s; 
    const s = new Date(r.s), e = new Date(r.e); 
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) return `${s.getFullYear()}/${s.getMonth() + 1}月`; 
    return `${r.s.slice(5)}~${r.e.slice(5)}`; 
  };

  return (
    <>
      {tab === "charts" && (
        <div style={{ padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {catRange ? (
                <button onClick={() => setCatRange(null)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:10, background:`${C.accent}22`, color:C.accentL, border:`1px solid ${C.accent}44`, cursor:"pointer", fontSize:13, fontWeight:700 }}>📅 {rl(catRange)} ✕</button>
              ) : (
                <>
                  <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>‹</button>
                  <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{month.m}/{month.y}</span>
                  <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>›</button>
                </>
              )}
              <button onClick={() => setShowCatDP(true)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:14, marginLeft:2 }}>📅</button>
            </div>
          </div>
          {showCatDP && <DatePicker value={catRange || { s:`${month.y}-${String(month.m).padStart(2,"0")}-01`, e:TODAY }} onChange={setCatRange} onClose={() => setShowCatDP(false)} />}
          
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {[{ v:"expense", l:"🛒 支出", c:C.expense }, { v:"income", l:"💰 收入", c:C.income }].map(o => <button key={o.v} onClick={() => setChartView(o.v)} style={{ flex:1, padding:"10px 4px", borderRadius:12, fontSize:14, fontWeight:700, background:chartView === o.v ? `${o.c}28` : C.card, color:chartView === o.v ? o.c : C.muted, border:`1px solid ${chartView === o.v ? o.c : C.border}`, cursor:"pointer" }}>{o.l}</button>)}
          </div>
          
          {(() => {
            const data = chartView === "expense" ? expCat : incCat;
            const total = data.reduce((s, x) => s + x.value, 0);
            if (!data.length) return <Card style={{ padding:"50px 16px", textAlign:"center", marginBottom:16 }}><div style={{ color:C.muted }}>本月無{chartView === "expense" ? "支出" : "收入"}記錄</div></Card>;
            return (
              <Card style={{ padding:20, marginBottom:16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} innerRadius={42}>
                      {data.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={(v, n) => [fmt(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign:"center", marginTop:-8, marginBottom:14 }}><div style={{ fontSize:11, color:C.textSub }}>Total</div><div style={{ fontWeight:900, fontSize:22, color:C.text }}>{fmt(total)}</div></div>
                {data.map((dv, i) => {
                  const isOpen = expandedCat === dv.name;
                  const catTxns = moTxns.filter(t => t.cat === dv.name && (chartView==="expense" ? t.type==="expense" : (t.type==="income" && t.tags!=="#往來帳"))).sort((a,b)=>b.date.localeCompare(a.date));
                  return (
                    <div key={dv.name} style={{ marginBottom:10 }}>
                      <div onClick={() => setExpandedCat(isOpen ? null : dv.name)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:`${PIE[i % PIE.length]}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{ceMap[dv.name] || "📦"}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span style={{ color:C.text }}>{dv.name}</span><span style={{ fontWeight:900, color:PIE[i % PIE.length] }}>{fmt(dv.value)}</span></div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}><div style={{ flex:1, height:4, borderRadius:2, background:C.border }}><div style={{ height:"100%", borderRadius:2, width:`${(dv.value / total * 100).toFixed(0)}%`, background:PIE[i % PIE.length] }} /></div><span style={{ fontSize:11, color:C.muted, width:28, textAlign:"right" }}>{(dv.value / total * 100).toFixed(0)}%</span></div>
                        </div>
                        <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop:8, marginLeft:44, paddingLeft:10, borderLeft:`2px solid ${C.border}` }}>
                          {catTxns.length === 0 ? <div style={{ fontSize:12, color:C.muted, padding:"4px 0" }}>沒有明細</div> : catTxns.map(t => (
                            <div key={t.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:12 }}>
                              <span style={{ color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:8 }}>{t.date.slice(5)} {t.desc||dv.name}</span>
                              <span style={{ color:C.text, fontWeight:700, flexShrink:0 }}>{fmt(t.proxyAmt ? t.amt-t.proxyAmt : t.amt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            );
          })()}
          
          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:C.textSub }}>資產{assetView==="level"?"成長":"變動"}</div><div style={{ fontWeight:900, fontSize:18, color:C.accentL }}>{assetView==="level"?fmt(totAssets):fmt(changeData.reduce((s,x)=>s+(x.change||0),0))}</div></div>
              <button onClick={() => setShowDP(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:10, background:`${C.accent}22`, color:C.accentL, border:`1px solid ${C.accent}44`, cursor:"pointer", fontSize:12, fontWeight:700 }}>📅 {rl(chartRange)} ▾</button>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[{v:"level",l:"資產水位"},{v:"change",l:"每期變動"}].map(o => <button key={o.v} onClick={() => setAssetView(o.v)} style={{ flex:1, padding:"7px 4px", borderRadius:10, fontSize:12, fontWeight:700, background:assetView===o.v?`${C.accent}28`:C.card, color:assetView===o.v?C.accentL:C.muted, border:`1px solid ${assetView===o.v?C.accent:C.border}`, cursor:"pointer" }}>{o.l}</button>)}
            </div>
            {chartData.length > 1 ? (
              assetView === "level" ? (
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={.35} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="d" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)} />
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 10000).toFixed(0)}萬`} domain={assetYDomain} />
                    <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v => [fmt(v), "資產"]} />
                    <Area type="monotone" dataKey="assets" stroke={C.accent} strokeWidth={2.5} fill="url(#ag)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={changeData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="d" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.ceil(changeData.length / 8) - 1)} />
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 10000).toFixed(0)}萬`} />
                    <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v => [(v>=0?"+":"")+fmt(v), "淨變動"]} />
                    <Line type="linear" dataKey="change" stroke={C.warn} strokeWidth={2.5} dot={{ r:3, fill:C.warn }} />
                  </LineChart>
                </ResponsiveContainer>
              )
            ) : <div style={{ height:150, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:13 }}>記錄更多交易後顯示成長曲線</div>}
          </Card>
          
          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontWeight:900, fontSize:14, color:C.text }}>收支健康度</span>
              <button onClick={() => setShowHDP(true)} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:10, background:`${C.warn}22`, color:C.warn, border:`1px solid ${C.warn}44`, cursor:"pointer", fontSize:11, fontWeight:700 }}>📅 {rl(healthRange)} ▾</button>
            </div>
            {[{ l:"區間收入", v:fmt(hInc), c:C.income }, { l:"區間支出", v:fmt(hExp), c:C.expense }, { l:"區間結餘", v:fmt(hInc - hExp), c:hInc >= hExp ? C.income : C.expense }, { l:"儲蓄率", v:hInc > 0 ? `${(((hInc - hExp) / hInc) * 100).toFixed(1)}%` : "—", c:C.accentL }, { l:"支出佔收入", v:hInc > 0 ? `${(hExp / hInc * 100).toFixed(1)}%` : "—", c:hExp / hInc > 0.4 ? C.warn : C.expense }, { l:"訂閱月費", v:fmt(subsMo), c:C.textSub }].map(r => (
              <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.textSub }}>{r.l}</span>
                <span style={{ fontWeight:900, fontSize:13, color:r.c }}>{r.v}</span>
              </div>
            ))}
          </Card>

          {/* Goals */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, marginTop:8 }}>
            <span style={{ fontWeight:900, fontSize:14, color:C.text }}>🎯 我的目標</span>
            <Btn sz="sm" onClick={() => setModal("addGoal")}>＋ 新增目標</Btn>
          </div>
          {(!goals || goals.length === 0) && (
            <Card style={{ padding:20, textAlign:"center", marginBottom:16 }}>
              <div style={{ color:C.muted, fontSize:13 }}>還沒有設定目標，點右上角新增！</div>
            </Card>
          )}
          {(goals||[]).map(g => {
            const goalUseMv = g.useMv != null ? g.useMv : useMvForAssets;
            const current = goalCurrentAmount(g);
            const pct = Math.min(100, current > 0 ? (current / g.target * 100) : 0);
            const remaining = Math.max(0, g.target - current);
            const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
            const isExpired = g.deadline && daysLeft === 0;
            const col = daysLeft !== null && daysLeft <= 30 ? C.warn : C.accent;
            return (
              <Card key={g.id} style={{ padding:20, marginBottom:12, border:`1px solid ${pct>=100?C.teal:C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:24 }}>{g.emoji}</span>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{g.name}</div>
                        {(g.priority||0) > 0 && <span style={{ fontSize:10, fontWeight:700, color:g.priority===2?C.expense:C.warn, background:`${g.priority===2?C.expense:C.warn}18`, padding:"1px 6px", borderRadius:6 }}>{g.priority===2?"最優先":"優先"}</span>}
                      </div>
                      {g.deadline && <div style={{ fontSize:11, color:isExpired?C.danger:daysLeft<=30?C.warn:C.muted, marginTop:2 }}>{isExpired ? "⚠️ 已到期" : `⏳ 還有 ${daysLeft} 天（${g.deadline}）`}</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => upd("goals", p => p.map(x => x.id===g.id ? { ...x, pinned:!x.pinned } : x))} title="顯示在總覽頁" style={{ background:"none", border:"none", cursor:"pointer", color:g.pinned?C.accent:C.muted, fontSize:16 }}>{g.pinned?"📌":"📍"}</button>
                    <button onClick={() => { setEditGoal({...g}); setModal("editGoal"); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:16 }}>✏️</button>
                    <button onClick={() => confirm(`刪除目標「${g.name}」？`, () => upd("goals", p => p.filter(x => x.id !== g.id)))} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16 }}>✕</button>
                  </div>
                </div>
                <div style={{ height:10, borderRadius:5, background:C.border, marginBottom:8 }}>
                  <div style={{ height:"100%", borderRadius:5, background:pct>=100?C.teal:col, width:`${pct}%`, transition:"width .5s" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                  <span style={{ color:C.textSub }}>目前 {fmt(current)}</span>
                  <span style={{ fontWeight:900, color:pct>=100?C.teal:col }}>{pct.toFixed(1)}%</span>
                  <span style={{ color:C.textSub }}>目標 {fmt(g.target)}</span>
                </div>
                <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
                  {(g.accIds&&g.accIds.length>0)||(g.bucketIds&&g.bucketIds.length>0) ? `計算範圍：${[...accs.filter(a=>(g.accIds||[]).includes(a.id)).map(a=>a.name), ...buckets.filter(b=>(g.bucketIds||[]).includes(b.id)).map(b=>b.name)].join("、")}${g.accIds?.some(id=>accs.find(a=>a.id===id)?.type==="investment") ? `（${goalUseMv?"市值":"成本"}）` : ""}` : `總資產淨值 = 資產${useMvForAssets&&stTotMv>0?"（市值）":""} - 負債 + 應收 - 應付`}
                </div>
                {remaining > 0 && <div style={{ marginTop:6, fontSize:12, color:C.muted, textAlign:"center" }}>還差 <strong style={{ color:pct>=100?C.teal:col }}>{fmt(remaining)}</strong></div>}
                {pct >= 100 && <div style={{ marginTop:6, fontSize:13, fontWeight:700, color:C.teal, textAlign:"center" }}>🎉 已達成目標！</div>}
              </Card>
            );
          })}
        </div>
      )}
      
      {showDP && <DatePicker value={chartRange} onChange={setChartRange} onClose={() => setShowDP(false)} />}
    </>
  );
}
