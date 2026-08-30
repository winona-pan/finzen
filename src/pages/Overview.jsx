import { useState } from "react";

export default function OverviewPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, buckets,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, DAYS,
  useMvForAssets, setNT, T0, descHistoryByCat, tagsHistory, month,
  selTxn, setSelTxn, delTxn, alertR, alertAmt, passiveMo, grpTxns, rl, prevMo, nextMo, totPools, totExpensePools,
  savingsTargets, setSavingsTarget, removeSavingsTarget, savingsProgress, curYm, nextYm, curSavingsTarget, nextSavingsTarget, showNextMonthReminder, goalCurrentAmount, goalDisplayAmount, guiltFreeGauge, allocSettings,
  hideAmounts, tr, accFieldLabel,
  // 共用 UI atoms
  InfoBtn, Card, SH, Bdg, SwipeRow, Btn
}) {

  /* ── 隱藏金額模式：預設模糊，點一下暫時看 3 秒 ── */
  const [peek, setPeek] = useState(false);
  const doPeek = () => { setPeek(true); setTimeout(() => setPeek(false), 3000); };
  const maskStyle = (hideAmounts && !peek) ? { filter:"blur(6px)", userSelect:"none" } : {};

  /* ── 搜尋框局部狀態 ── */
  const [showSq, setShowSq] = useState(false);
  const [sq, setSq] = useState("");

  /* ── 清單行樣式 ── */
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
          <div style={{ background:C.bg, padding:"12px 16px 8px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>‹</button>
                <span style={{ fontWeight:900, fontSize:20, color:C.text }}>{month.m}月 {month.y}</span>
                <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>›</button>
              </div>
              <button onClick={() => setShowSq(p => !p)} style={{ width:36, height:36, borderRadius:10, background:showSq ? `${C.accent}30` : C.card, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSub, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>🔍</button>
            </div>
            {showSq && <input value={sq} onChange={e => setSq(e.target.value)} placeholder={tr("搜尋…")} style={{ ...iSt, marginBottom:8 }} />}
            <div onClick={() => hideAmounts && doPeek()} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:4, cursor:hideAmounts?"pointer":"default" }}>
              {[{ l:tr("收入"), v:moInc, c:C.income }, { l:tr("支出"), v:moExp, c:C.expense }, { l:tr("結餘"), v:moInc - moExp, c:moInc >= moExp ? C.income : C.expense }].map(k => (
                <div key={k.l} style={{ padding:"10px 12px", borderRadius:14, background:C.surface }}>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{k.l}</div>
                  <div style={{ fontWeight:900, fontSize:13, color:k.c, ...maskStyle }}>{fmt(k.v)}</div>
                </div>
              ))}
            </div>
            {hideAmounts && !peek && <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:-2, marginBottom:4 }}>👁️ 點數字看 3 秒</div>}
          </div>

          {(() => {
            // 如果設定了「計畫起始月份」而且還沒到，這個月先不顯示生活費安全水位（避免規劃還沒開始就被判定超支/安全）
            if (allocSettings.planStartYm && curYm < allocSettings.planStartYm) return null;
            const g = guiltFreeGauge;
            const isSafe = g.hasAllocated && g.remaining >= 0;
            const dayOfMonth = new Date(TODAY).getDate();
            const isMonthEnd = dayOfMonth >= 25;
            return (
              <div style={{ margin:"0 16px 12px", padding:14, borderRadius:14, background:isSafe?`${C.income}10`:C.card, border:`1px solid ${isSafe?C.income+"44":C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:C.text }}>🍜 {tr("生活區安全水位")}</span>
                  {g.hasAllocated && <span style={{ fontSize:10, fontWeight:700, color:isSafe?C.income:C.warn, background:`${isSafe?C.income:C.warn}18`, padding:"2px 8px", borderRadius:8 }}>{isSafe?`✅ ${tr("可以放心花")}`:`⚠️ ${tr("已經超支")}`}</span>}
                </div>
                <div style={{ fontSize:20, fontWeight:900, color:isSafe?C.income:g.remaining<0?C.expense:C.text }}>{g.remaining>=0?"":"−"}{fmt(Math.abs(g.remaining))}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{tr("已花")} {fmt(g.spentSoFar)} ／ {tr("生活費預算")} {fmt(g.livingBudget)}</div>
                {!g.hasAllocated && <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{tr("還沒套用過本月分流建議，先點上面「🧠 智慧分流」規劃一下吧")}</div>}
                {isMonthEnd && g.hasAllocated && g.remaining > 0 && (
                  <button onClick={() => setModal("sweepMoney")} style={{ width:"100%", marginTop:10, padding:9, borderRadius:10, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, color:C.teal, fontWeight:700, fontSize:12, cursor:"pointer" }}>🧹 {tr("月底了，把剩下")} {fmt(g.remaining)} {tr("一鍵掃入願望池／存錢區")}</button>
                )}
              </div>
            );
          })()}

          {totPools > 0 && <div onClick={() => setModal("pools")} style={{ margin:"0 16px 8px", display:"flex", justifyContent:"space-between", padding:"7px 12px", borderRadius:10, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, cursor:"pointer" }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>📅 {tr("待認列收入池")}：{fmt(totPools)}</span>
            <span style={{ fontSize:12, color:C.teal }}>{tr("認列")} →</span>
          </div>}
          {totExpensePools > 0 && <div onClick={() => setModal("expensePools")} style={{ margin:"0 16px 8px", display:"flex", justifyContent:"space-between", padding:"7px 12px", borderRadius:10, background:`${C.warn}18`, border:`1px solid ${C.warn}44`, cursor:"pointer" }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.warn }}>📦 {tr("年繳分攤中")}：{fmt(totExpensePools)} {tr("未認列")}</span>
            <span style={{ fontSize:12, color:C.warn }}>{tr("查看")} →</span>
          </div>}
          {passiveMo > 0 && <button onClick={() => setModal("sweepPassive")} style={{ width:"calc(100% - 32px)", margin:"0 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 12px", borderRadius:10, background:`${C.accentL}12`, border:`1px solid ${C.accentL}33`, cursor:"pointer" }}>
            <span style={{ fontSize:12, color:C.accentL }}>🏦 {tr("非勞務收入")} {fmt(passiveMo)}</span>
            <span style={{ fontSize:12, color:C.accentL, fontWeight:700 }}>{tr("分配存起來")} →</span>
          </button>}

          {showNextMonthReminder && (
            <div onClick={() => setModal("savingsTarget")} style={{ margin:"0 16px 12px", padding:"10px 14px", borderRadius:12, background:`${C.teal}15`, border:`1px solid ${C.teal}44`, cursor:"pointer" }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>📅 {tr("月底了，要不要先想想下個月要存多少錢？點這裡設定")}</span>
            </div>
          )}
          {alertR > 0.4 && <div style={{ margin:"0 16px 10px", display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:14, background:`${C.warn}18`, border:`1px solid ${C.warn}44`, fontSize:12, fontWeight:700, color:C.warn }}>⚠️ {tr("生活支出")} {(alertR * 100).toFixed(0)}% {tr("超過收入 40%！")}</div>}
          
          {/* Goal progress bars in overview */}
          {(goals||[]).filter(g=>g.target>0 && g.pinned).map(g => {
            const cur = goalDisplayAmount[g.id] ?? goalCurrentAmount(g);
            const pct = Math.min(100, cur>0?(cur/g.target*100):0);
            const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
            const col = daysLeft!==null&&daysLeft<=30 ? C.warn : C.accent;
            return <div key={g.id} style={{ margin:"0 16px 8px", padding:"8px 12px", borderRadius:12, background:`${col}14`, border:`1px solid ${col}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, marginBottom:4 }}>
                <span style={{ color:col }}>{g.emoji} {g.name}{daysLeft!==null?` · ${tr("剩")}${daysLeft}${tr("天")}`:""}</span>
                <span style={{ color:col }}>{pct.toFixed(0)}% · {tr("差")} {fmt(Math.max(0,g.target-cur))}</span>
              </div>
              <div style={{ height:5, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, background:col, width:`${pct}%`, transition:"width .5s" }} /></div>
            </div>;
          })}
          
          <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12 }}>
            {grpTxns.length === 0 && <div style={{ padding:"60px 0", textAlign:"center", color:C.muted }}><div style={{ fontSize:44, marginBottom:10 }}>📭</div><div>{tr("本月尚無記錄，點右下角 ✏️ 開始記帳")}</div></div>}
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
                    <SwipeRow key={t.id} onDelete={() => confirm(debts.some(x=>x.srcTxnId===t.id && !x.settled) ? "確定刪除此筆交易？連動的代墊應收款也會一併刪除" : "確定刪除此筆交易？", () => delTxn(t.id))} onEdit={() => { setSelTxn({ ...t }); setModal("editTxn"); }} onClick={() => { setSelTxn({ ...t }); setModal("txnDet"); }}>
                      <div style={rowSt(i, true)}>
                        <div style={{ width:44, height:44, borderRadius:14, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{ceMap[t.cat] || "📦"}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                            <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{t.cat}</span>
                            {t.proxyAmt > 0 && <Bdg color={C.warn}>{tr("含代墊")}</Bdg>}
                            {t.type === "adjust" && <Bdg color={C.muted}>{tr("調整")}</Bdg>}
                          </div>
                          <div style={{ fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {t.desc}{t.acc && <span style={{ color:C.muted }}> · {accFieldLabel(t.acc)}</span>}{t.tags && <span style={{ color:C.accentL }}> {t.tags}</span>}
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
                          {t.type === "transfer" && t.toAcc && <div style={{ fontSize:11, color:C.muted }}>{accFieldLabel(t.acc)} ➜ {accFieldLabel(t.toAcc)}</div>}
                          {t.proxyAmt > 0 && <div style={{ fontSize:11, color:C.warn }}>{tr("代墊")} {fmt(t.proxyAmt)}</div>}
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
