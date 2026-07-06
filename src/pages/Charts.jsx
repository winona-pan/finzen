import { useState } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ChartsPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo,
  chartData, chartRange, setChartRange, isSingleMo, allocPie, holdPie, invGrowth, assetView, setAssetView, changeData,
  incCat, expCat, chartView, setChartView, healthRange, setHealthRange,
  useMvForAssets, setUseMvForAssets, poolThisMo, fetchAllPrices, ALL_CURS, theme,
  collapsed, toggleSection, setNT, T0, descHistoryByCat, tagsHistory,
  invTab, setInvTab, invPie, setInvPie, LEARN_DATA, MANUAL_DATA,
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF,
  setSettleDebt, setEditDebt, setSelPool, setSelAcc, selAcc,
  setNAcc, setPayF, setSelSub, setSelBill, setSelPolicy, setSelTxn,
  nG, setNG, editGoal, setEditGoal, nPL, setNPL, setSelPolicy: _sp,
  moDate, setMoDate, searchQ, setSearchQ, APP_VER, changeTheme, THEMES,
  showHDP, setShowHDP, nS, setNS, nB, setNB, sortMode, setSortMode, visMode, setVisMode, nD, setND,
  // 接收全域 UI Atoms 元件
  Card, SH, Bdg, Btn, DatePicker
}) {

  /* ── 局部狀態與月份切換 ── */
  const [showDP, setShowDP] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });
  
  const prevMo = () => setMonth(({ y, m }) => m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 });
  const nextMo = () => setMonth(({ y, m }) => m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 });
  
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
              <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>‹</button>
              <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{month.m}/{month.y}</span>
              <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>›</button>
            </div>
            <button onClick={() => setModal("catSet")} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:10, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSub, fontSize:12, fontWeight:700 }}>⚙️ 類別</button>
          </div>
          
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
                {data.map((dv, i) => (
                  <div key={dv.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`${PIE[i % PIE.length]}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{ceMap[dv.name] || "📦"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span style={{ color:C.text }}>{dv.name}</span><span style={{ fontWeight:900, color:PIE[i % PIE.length] }}>{fmt(dv.value)}</span></div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}><div style={{ flex:1, height:4, borderRadius:2, background:C.border }}><div style={{ height:"100%", borderRadius:2, width:`${(dv.value / total * 100).toFixed(0)}%`, background:PIE[i % PIE.length] }} /></div><span style={{ fontSize:11, color:C.muted, width:28, textAlign:"right" }}>{(dv.value / total * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                ))}
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
                    <XAxis dataKey={isSingleMo ? "d" : "m"} tick={{ fill:C.muted, fontSize:isSingleMo ? 8 : 10 }} axisLine={false} tickLine={false} interval={isSingleMo ? 4 : 0} />
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 10000).toFixed(0)}萬`} />
                    <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v => [fmt(v), "資產"]} />
                    <Area type="monotone" dataKey="assets" stroke={C.accent} strokeWidth={2.5} fill="url(#ag)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={changeData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey={isSingleMo ? "d" : "m"} tick={{ fill:C.muted, fontSize:isSingleMo ? 8 : 10 }} axisLine={false} tickLine={false} interval={isSingleMo ? 4 : 0} />
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
            const current = g.accIds && g.accIds.length > 0
              ? accs.filter(a => g.accIds.includes(a.id)).reduce((s,a) => {
                  if (useMvForAssets && a.type==="investment") {
                    const mv = stSum.filter(st=>st.acc===a.name).reduce((ss,st)=>ss+(st.mv>0?st.mv:st.totalCost),0);
                    return s + (mv > 0 ? mv : toTWD(a.bal,a.cur,rates));
                  }
                  return s + toTWD(a.bal,a.cur,rates);
                }, 0)
              : netWorth;
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
                      <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{g.name}</div>
                      {g.deadline && <div style={{ fontSize:11, color:isExpired?C.danger:daysLeft<=30?C.warn:C.muted, marginTop:2 }}>{isExpired ? "⚠️ 已到期" : `⏳ 還有 ${daysLeft} 天（${g.deadline}）`}</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
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
                  {g.accIds&&g.accIds.length>0 ? `指定帳戶：${accs.filter(a=>g.accIds.includes(a.id)).map(a=>a.name).join("、")}` : `總資產淨值 = 資產${useMvForAssets&&stTotMv>0?"（市值）":""} - 負債 + 應收 - 應付`}
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
