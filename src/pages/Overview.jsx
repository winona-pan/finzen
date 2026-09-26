import { useState } from "react";

export default function OverviewPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, expensePools, cats, rates, goals, policies, buckets,
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

  /* ── Tier 2：把「待認列收入池／年繳分攤中／非勞務收入／月底提示／支出偏高」
     這幾個原本各自佔一整條的提示，濃縮成一列可橫向滑動的小標籤 ── */
  const pendingPoolCount = (pools||[]).filter(p => (p.totalAmt - p.recognized) > 0.01).length;
  const pendingExpPoolCount = (expensePools||[]).filter(p => (p.totalAmt - p.recognized) > 0.01).length;
  const pendingChips = [
    pendingPoolCount > 0 && { key:"pools", icon:"📅", label:`${pendingPoolCount}${tr("筆待認列")}`, color:C.teal, onClick:() => setModal("pools") },
    pendingExpPoolCount > 0 && { key:"expPools", icon:"📦", label:`${pendingExpPoolCount}${tr("筆年繳分攤")}`, color:C.warn, onClick:() => setModal("expensePools") },
    passiveMo > 0 && { key:"passive", icon:"🏦", label:`${tr("非勞務")} ${fmt(passiveMo)}`, color:C.accentL, onClick:() => setModal("sweepPassive") },
    showNextMonthReminder && { key:"nextMo", icon:"🗓️", label:tr("設定下月存款"), color:C.teal, onClick:() => setModal("savingsTarget") },
    alertR > 0.4 && { key:"alert", icon:"⚠️", label:`${tr("支出偏高")} ${(alertR*100).toFixed(0)}%`, color:C.expense, onClick:null },
  ].filter(Boolean);

  const pinnedGoals = (goals||[]).filter(g=>g.target>0 && g.pinned);

  return (
    <>
      {tab === "overview" && (
        <div>
          <div style={{ background:C.bg, padding:"16px 16px 10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:20, width:28, height:28 }}>‹</button>
                <span style={{ fontWeight:800, fontSize:19, color:C.text, letterSpacing:"-0.02em" }}>{month.m}月 {month.y}</span>
                <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:20, width:28, height:28 }}>›</button>
              </div>
              <button onClick={() => setShowSq(p => !p)} style={{ width:34, height:34, borderRadius:11, background:showSq ? `${C.accent}22` : C.card, border:"none", cursor:"pointer", color:C.textSub, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>🔍</button>
            </div>
            {showSq && <input value={sq} onChange={e => setSq(e.target.value)} placeholder={tr("搜尋…")} style={{ ...iSt, marginBottom:10 }} />}

            {/* ── Tier 1：極簡月度總結，同一張卡、用分隔線區分三欄，不再用色塊互搶注意力 ── */}
            <div onClick={() => hideAmounts && doPeek()} style={{ display:"flex", borderRadius:18, background:C.card, overflow:"hidden", cursor:hideAmounts?"pointer":"default" }}>
              {[{ l:tr("收入"), v:moInc, c:C.income }, { l:tr("支出"), v:moExp, c:C.expense }, { l:tr("結餘"), v:moInc - moExp, c:moInc >= moExp ? C.income : C.expense }].map((k, i) => (
                <div key={k.l} style={{ flex:1, padding:"13px 6px", textAlign:"center", borderLeft: i>0 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:4, fontWeight:600 }}>{k.l}</div>
                  <div style={{ fontWeight:800, fontSize:15, color:k.c, letterSpacing:"-0.01em", ...maskStyle }}>{fmt(k.v)}</div>
                </div>
              ))}
            </div>
            {hideAmounts && !peek && <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:6 }}>👁️ {tr("點數字看 3 秒")}</div>}
          </div>

          {(() => {
            // 如果設定了「計畫起始月份」而且還沒到，這個月先不顯示生活費安全水位（避免規劃還沒開始就被判定超支/安全）
            if (allocSettings.planStartYm && curYm < allocSettings.planStartYm) return null;
            const g = guiltFreeGauge;
            const isSafe = g.hasAllocated && g.remaining >= 0;
            const dayOfMonth = new Date(TODAY).getDate();
            const isMonthEnd = dayOfMonth >= 25;
            return (
              <div style={{
                margin:"0 16px 12px", padding:22, borderRadius:24,
                background: isSafe ? `linear-gradient(160deg, ${C.income}1c, ${C.card})` : g.hasAllocated ? `linear-gradient(160deg, ${C.expense}14, ${C.card})` : C.card,
                boxShadow:`0 1px 0 ${C.border}`
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:34, height:34, borderRadius:11, background:`${isSafe?C.income:C.text}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🍜</div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.textSub }}>{tr("生活區安全水位")}</span>
                  </div>
                  {g.hasAllocated && <span style={{ fontSize:10, fontWeight:700, color:isSafe?C.income:C.warn, background:`${isSafe?C.income:C.warn}18`, padding:"3px 10px", borderRadius:20 }}>{isSafe?tr("可以放心花"):tr("已經超支")}</span>}
                </div>
                <div style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em", color:isSafe?C.income:g.remaining<0?C.expense:C.text, ...maskStyle }}>{g.remaining>=0?"":"−"}{fmt(Math.abs(g.remaining))}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{tr("已花")} {fmt(g.spentSoFar)} ／ {tr("生活費預算")} {fmt(g.livingBudget)}</div>
                {!g.hasAllocated && <div style={{ fontSize:12, color:C.muted, marginTop:10, lineHeight:1.5 }}>{tr("還沒套用過本月分流建議，先點上面「🧠 智慧分流」規劃一下吧")}</div>}
                {isMonthEnd && g.hasAllocated && g.remaining > 0 && (
                  <button onClick={() => setModal("sweepMoney")} style={{ width:"100%", marginTop:16, padding:"13px 16px", borderRadius:16, background:C.teal, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", letterSpacing:"-0.01em" }}>🧹 {tr("一鍵掃入")} {fmt(g.remaining)} → {tr("願望池／存錢區")}</button>
                )}
              </div>
            );
          })()}

          {/* ── Tier 2：待處理摘要列——把原本四五條各自獨立的橫幅濃縮成一列標籤 ── */}
          {pendingChips.length > 0 && (
            <div style={{ margin:"0 16px 12px", padding:"12px 14px", borderRadius:18, background:C.card }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:8, letterSpacing:"0.02em" }}>⚡ {tr("待處理")}</div>
              <div style={{ display:"flex", gap:8, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                {pendingChips.map(chip => (
                  <div key={chip.key} onClick={chip.onClick || undefined} style={{ flex:"0 0 auto", display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:20, background:`${chip.color}14`, cursor:chip.onClick?"pointer":"default", whiteSpace:"nowrap" }}>
                    <span style={{ fontSize:12 }}>{chip.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:chip.color }}>{chip.label}</span>
                    {chip.onClick && <span style={{ fontSize:11, color:chip.color, opacity:0.7 }}>›</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tier 3：目標進度整合成一張卡，柔和進度條 ── */}
          {pinnedGoals.length > 0 && (
            <div style={{ margin:"0 16px 12px", padding:"16px 16px 6px", borderRadius:20, background:C.card }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:10, letterSpacing:"0.02em" }}>🎯 {tr("目標進度")}</div>
              {pinnedGoals.map((g, i) => {
                const cur = goalDisplayAmount[g.id] ?? goalCurrentAmount(g);
                const pct = Math.min(100, cur>0?(cur/g.target*100):0);
                const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
                const col = daysLeft!==null&&daysLeft<=30 ? C.warn : C.accent;
                return (
                  <div key={g.id} style={{ paddingBottom:14, marginBottom:i<pinnedGoals.length-1?14:0, borderBottom:i<pinnedGoals.length-1?`1px solid ${C.border}`:"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", fontSize:12, marginBottom:7 }}>
                      <span style={{ fontWeight:700, color:C.text }}>{g.emoji} {g.name}{daysLeft!==null?` · ${tr("剩")}${daysLeft}${tr("天")}`:""}</span>
                      <span style={{ fontWeight:700, color:col }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:C.border, overflow:"hidden" }}><div style={{ height:"100%", borderRadius:3, background:col, width:`${pct}%`, transition:"width .5s" }} /></div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{tr("差")} {fmt(Math.max(0,g.target-cur))}</div>
                  </div>
                );
              })}
            </div>
          )}

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
