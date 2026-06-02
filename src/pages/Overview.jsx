import { useState } from "react";

export default function OverviewPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, DAYS,
  useMvForAssets, setNT, T0, descHistoryByCat, tagsHistory,
  selTxn, setSelTxn, alertR, alertAmt, passiveMo, grpTxns, rl, prevMo, nextMo, totPools,
  // 接收大腦配送過來的共用 UI Atoms 元件
  InfoBtn, Card, SH, Bdg, SwipeRow, Btn
}) {

  /* ── 補上總覽頁面專屬的搜尋框局部狀態 (Local States) ── */
  const [showSq, setShowSq] = useState(false);
  const [sq, setSq] = useState("");

  /* ── 補上漏失的清單行底層樣式函數 (rowSt) ── */
  const rowSt = (i, border = true) => ({ 
    display: "flex", 
    alignItems: "center", 
    gap: 12, 
    padding: "12px 16px", 
    borderTop: border && i > 0 ? `1px solid ${C.border}` : undefined 
  });

  return (
    <>
      {tab === "overview" && (
        <div>
          <div style={{ position:"sticky", top:0, zIndex:20, background:`${C.bg}f2`, backdropFilter:"blur(16px)", padding:"12px 16px 8px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>‹</button>
                <span style={{ fontWeight:900, fontSize:20, color:C.text }}>{month.m}月 {month.y}</span>
                <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>›</button>
              </div>
              <button onClick={() => setShowSq(p => !p)} style={{ width:36, height:36, borderRadius:10, background:showSq ? `${C.accent}30` : C.card, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSub, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>🔍</button>
            </div>
            {showSq && <input value={sq} onChange={e => setSq(e.target.value)} placeholder="搜尋…" style={{ ...iSt, marginBottom:8 }} />}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:4 }}>
              {[{ l:"收入", v:moInc, c:C.income }, { l:"支出", v:moExp, c:C.expense }, { l:"結餘", v:moInc - moExp, c:moInc >= moExp ? C.income : C.expense }].map(k => (
                <div key={k.l} style={{ padding:"10px 12px", borderRadius:14, background:C.surface }}>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{k.l}</div>
                  <div style={{ fontWeight:900, fontSize:13, color:k.c }}>{fmt(k.v)}</div>
                </div>
              ))}
            </div>
            {totPools > 0 && <div onClick={() => setModal("pools")} style={{ display:"flex", justifyContent:"space-between", padding:"7px 12px", borderRadius:10, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, cursor:"pointer", marginTop:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>📅 待認列收入池：{fmt(totPools)}</span>
              <span style={{ fontSize:12, color:C.teal }}>認列 →</span>
            </div>}
            {passiveMo > 0 && <div style={{ padding:"7px 12px", borderRadius:10, background:`${C.accentL}12`, border:`1px solid ${C.accentL}33`, marginTop:4 }}>
              <span style={{ fontSize:12, color:C.accentL }}>🏦 非勞務收入 {fmt(passiveMo)}（建議存起來）</span>
            </div>}
          </div>
          {alertR > 0.4 && <div style={{ margin:"0 16px 10px", display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:14, background:`${C.warn}18`, border:`1px solid ${C.warn}44`, fontSize:12, fontWeight:700, color:C.warn }}>⚠️ 生活支出 {(alertR * 100).toFixed(0)}% 超過收入 40%！</div>}
          
          {/* Goal progress bars in overview */}
          {(goals||[]).filter(g=>g.target>0).map(g => {
            const cur = g.accIds&&g.accIds.length>0
              ? accs.filter(a=>g.accIds.includes(a.id)).reduce((s,a)=>{
                  if (useMvForAssets && a.type==="investment") {
                    const mv = stSum.filter(st=>st.acc===a.name).reduce((ss,st)=>ss+(st.mv>0?st.mv:st.totalCost),0);
                    return s + (mv > 0 ? mv : toTWD(a.bal,a.cur,rates));
                  }
                  return s + toTWD(a.bal,a.cur,rates);
                },0)
              : netWorth;
            const pct = Math.min(100, cur>0?(cur/g.target*100):0);
            const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
            const col = daysLeft!==null&&daysLeft<=30 ? C.warn : C.accent;
            return <div key={g.id} style={{ margin:"0 16px 8px", padding:"8px 12px", borderRadius:12, background:`${col}14`, border:`1px solid ${col}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, marginBottom:4 }}>
                <span style={{ color:col }}>{g.emoji} {g.name}{daysLeft!==null?` · 剩${daysLeft}天`:""}</span>
                <span style={{ color:col }}>{pct.toFixed(0)}% · 差 {fmt(Math.max(0,g.target-cur))}</span>
              </div>
              <div style={{ height:5, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, background:col, width:`${pct}%`, transition:"width .5s" }} /></div>
            </div>;
          })}
          
          <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12 }}>
            {grpTxns.length === 0 && <div style={{ padding:"60px 0", textAlign:"center", color:C.muted }}><div style={{ fontSize:44, marginBottom:10 }}>📭</div><div>本月尚無記錄，點右下角 ✏️ 開始記帳</div></div>}
            {grpTxns.map(([date, dayT]) => {
              const dv = new Date(date + "T00:00:00");
              const dE = dayT.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + t.amt, 0);
              const dI = dayT.filter(t => t.type === "income").reduce((s, t) => s + t.amt, 0);
              return <div key={date}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"0 4px", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:900, fontSize:22, color:C.text }}>{dv.getDate()}</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:C.card, color:C.textSub }}>{DAYS[dv.getDay()]}</span>
                  </div>
                  <div style={{ display:"flex", gap:10, fontSize:12 }}>
                    {dI > 0 && <span style={{ color:C.income }}>+{fmt(dI)}</span>}
                    {dE > 0 && <span style={{ color:C.expense }}>-{fmt(dE)}</span>}
                  </div>
                </div>
                <Card style={{ overflow:"hidden" }}>
                  {dayT.map((t, i) => (
                    <SwipeRow key={t.id} onDelete={() => confirm("確定刪除此筆交易？", () => upd("txns", p => p.filter(x => x.id !== t.id)))} onEdit={() => { setSelTxn({ ...t }); setModal("editTxn"); }} onClick={() => { setSelTxn({ ...t }); setModal("txnDet"); }}>
                      <div style={rowSt(i, true)}>
                        <div style={{ width:44, height:44, borderRadius:14, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{ceMap[t.cat] || "📦"}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                            <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{t.cat}</span>
                            {t.proxyAmt > 0 && <Bdg color={C.warn}>含代墊</Bdg>}
                            {t.type === "adjust" && <Bdg color={C.muted}>調整</Bdg>}
                          </div>
                          <div style={{ fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {t.desc}{t.acc && <span style={{ color:C.muted }}> · {t.acc}</span>}{t.tags && <span style={{ color:C.accentL }}> {t.tags}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontWeight:900, fontSize:14,
                            color: t.type === "income" ? C.income
                                 : t.type === "transfer" ? C.accentL
                                 : t.type === "adjust" ? (t.adjDiff > 0 ? C.income : C.expense)
                                 : C.expense }}>
                            {t.type === "income" ? "+"
                             : t.type === "transfer" ? "↔"
                             : t.type === "adjust" ? (t.adjDiff > 0 ? "+" : "-")
                             : "-"}{fmt(t.amt)}
                          </div>
                          {t.type === "transfer" && t.toAcc && <div style={{ fontSize:11, color:C.muted }}>{t.acc} ➜ {t.toAcc}</div>}
                          {t.proxyAmt > 0 && <div style={{ fontSize:11, color:C.warn}>代墊 {fmt(t.proxyAmt)}</div>}
                        </div>
                      </div>
                    </SwipeRow>
                  ))}
                </Card>
              </div>;
            })}
          </div>
        </div>
      )}
    </>
  );
}
