import { useState } from "react";

export default function OverviewPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, expensePools, cats, rates, goals, policies, buckets,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, DAYS,
  useMvForAssets, setNT, T0, descHistoryByCat, tagsHistory, month,
  selTxn, setSelTxn, delTxn, alertR, alertAmt, passiveMo, grpTxns, rl, prevMo, nextMo, totPools, totExpensePools,
  savingsTargets, setSavingsTarget, removeSavingsTarget, savingsProgress, curYm, nextYm, curSavingsTarget, nextSavingsTarget, showNextMonthReminder, goalCurrentAmount, goalDisplayAmount, guiltFreeGauge, allocSettings,
  setEditGoal, getGoalSavingsTarget, isGoalSpendTxn,
  livingStreak, STREAK_MILESTONES, DEFAULT_STREAK_REWARDS, setStreakReward,
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

  /* ── 連續達標獎勵：點下一個里程碑的文字可以直接編輯成自己想要的獎勵 ── */
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [selMilestone, setSelMilestone] = useState(null);
  const [milestoneDraft, setMilestoneDraft] = useState("");
  const streakRewards = { ...DEFAULT_STREAK_REWARDS, ...(allocSettings.streakRewards||{}) };
  const nextMilestone = STREAK_MILESTONES.find(m => m > livingStreak.current) || null;

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

          {/* ── 生活區安全水位 + 生活費連續達標：左右各半，直的分成兩欄，不再各佔一整排 ── */}
          <div style={{ display:"flex", gap:10, margin:"0 16px 12px", alignItems:"stretch" }}>
            {(() => {
              // 如果設定了「計畫起始月份」而且還沒到，這個月先不顯示生活費安全水位（避免規劃還沒開始就被判定超支/安全）
              if (allocSettings.planStartYm && curYm < allocSettings.planStartYm) return <div style={{ flex:1 }} />;
              const g = guiltFreeGauge;
              const isSafe = g.hasAllocated && g.remaining >= 0;
              const dayOfMonth = new Date(TODAY).getDate();
              const isMonthEnd = dayOfMonth >= 25;
              return (
                <div style={{
                  flex:1, minWidth:0, padding:"14px 14px", borderRadius:20,
                  background: isSafe ? `linear-gradient(160deg, ${C.income}1c, ${C.card})` : g.hasAllocated ? `linear-gradient(160deg, ${C.expense}14, ${C.card})` : C.card,
                  boxShadow:`0 1px 0 ${C.border}`, display:"flex", flexDirection:"column"
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                    <span style={{ fontSize:14 }}>🍜</span>
                    <span style={{ fontSize:11, fontWeight:700, color:C.textSub }}>{tr("生活水位")}</span>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", color:isSafe?C.income:g.remaining<0?C.expense:C.text, ...maskStyle }}>{g.remaining>=0?"":"−"}{fmt(Math.abs(g.remaining))}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:4, lineHeight:1.5 }}>{tr("已花")} {fmt(g.spentSoFar)} ／ {fmt(g.livingBudget)}</div>
                  {g.hasAllocated && <div style={{ fontSize:9, fontWeight:700, color:isSafe?C.income:C.warn, marginTop:6 }}>{isSafe?`✅ ${tr("可以放心花")}`:`⚠️ ${tr("已經超支")}`}</div>}
                  <div style={{ flex:1 }} />
                  {!g.hasAllocated && (
                    <button onClick={() => setModal("allocEngine")} style={{ width:"100%", marginTop:10, padding:"9px 8px", borderRadius:14, background:C.accent, border:"none", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer" }}>🧠 {tr("智慧分流")}</button>
                  )}
                  {isMonthEnd && g.hasAllocated && g.remaining > 0 && (
                    <button onClick={() => setModal("sweepMoney")} style={{ width:"100%", marginTop:10, padding:"9px 8px", borderRadius:14, background:C.teal, border:"none", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer" }}>🧹 {tr("掃入")} {fmt(g.remaining)}</button>
                  )}
                </div>
              );
            })()}

            {/* ── 生活費連續達標：跟左邊生活水位各半，一樣濃縮成小格 ── */}
            {livingStreak.months.length > 0 && (
              <div style={{ flex:1, minWidth:0, padding:"14px 14px", borderRadius:20, background:C.card, display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>🔥</span>
                  <span style={{ fontSize:11, fontWeight:700, color:C.textSub }}>{tr("連續達標")}</span>
                </div>
                {livingStreak.current > 0 ? (
                  <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", color:C.text }}>{livingStreak.current}<span style={{ fontSize:12, fontWeight:600, color:C.muted }}> {tr("個月")}</span></div>
                ) : (
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{tr("這個月開始重新累積")}</div>
                )}
                {/* 里程碑：點圓圈看／改那一關的獎勵，預設顯示下一關 */}
                {(() => {
                  const shownM = (selMilestone && STREAK_MILESTONES.includes(selMilestone)) ? selMilestone : (nextMilestone || STREAK_MILESTONES[STREAK_MILESTONES.length-1]);
                  const achievedShown = livingStreak.longest >= shownM;
                  return <>
                    <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                      {STREAK_MILESTONES.map(m => {
                        const achieved = livingStreak.longest >= m;
                        const sel = m === shownM;
                        return (
                          <button key={m} onClick={() => { setSelMilestone(m); setEditingMilestone(null); }} title={`${m}${tr("個月")}`} style={{ width:20, height:20, padding:0, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, cursor:"pointer", color:C.textSub,
                            border: sel ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
                            background: achieved ? `${C.teal}22` : sel ? `${C.accent}18` : C.border, opacity: achieved || sel ? 1 : 0.6 }}>
                            {achieved ? "🏅" : m}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ flex:1 }} />
                    {editingMilestone === shownM ? (
                      <input autoFocus value={milestoneDraft} onChange={e => setMilestoneDraft(e.target.value)}
                        onBlur={() => { setStreakReward(shownM, milestoneDraft.trim() || streakRewards[shownM]); setEditingMilestone(null); }}
                        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        style={{ ...iSt, fontSize:11, padding:"5px 7px", marginTop:8 }} />
                    ) : (
                      <div onClick={() => { setEditingMilestone(shownM); setMilestoneDraft(streakRewards[shownM]); }} style={{ marginTop:8, padding:"7px 8px", borderRadius:10, background: achievedShown ? `${C.teal}14` : C.bg, cursor:"pointer" }}>
                        <div style={{ fontSize:9.5, fontWeight:700, color: achievedShown ? C.teal : C.accentL }}>
                          {achievedShown ? `🏅 ${shownM}${tr("個月")}・${tr("已達成")}` : `🎁 ${shownM}${tr("個月")}・${tr("再")} ${shownM - livingStreak.current} ${tr("個月")}`}
                        </div>
                        <div style={{ fontSize:11, color:C.text, marginTop:2, lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                          {streakRewards[shownM]} <span style={{ fontSize:9, color:C.muted }}>✏️</span>
                        </div>
                      </div>
                    )}
                  </>;
                })()}
              </div>
            )}
          </div>

          {/* ── Tier 2+3：待處理 + 目標進度：左右各半，只有一邊有東西時就佔滿整排 ── */}
          {(pendingChips.length > 0 || pinnedGoals.length > 0) && (
            <div style={{ display:"flex", gap:10, margin:"0 16px 12px", alignItems:"stretch" }}>
              {pendingChips.length > 0 && (
                <div style={{ flex:1, minWidth:0, padding:"14px 14px", borderRadius:20, background:C.card }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:8, letterSpacing:"0.02em" }}>⚡ {tr("待處理")}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {pendingChips.map(chip => (
                      <div key={chip.key} onClick={chip.onClick || undefined} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 10px", borderRadius:14, background:`${chip.color}14`, cursor:chip.onClick?"pointer":"default", minWidth:0 }}>
                        <span style={{ fontSize:12, flexShrink:0 }}>{chip.icon}</span>
                        <span style={{ flex:1, minWidth:0, fontSize:12, fontWeight:700, color:chip.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{chip.label}</span>
                        {chip.onClick && <span style={{ fontSize:11, color:chip.color, opacity:0.7, flexShrink:0 }}>›</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pinnedGoals.length > 0 && (
                <div style={{ flex:1, minWidth:0, padding:"14px 14px", borderRadius:20, background:C.card }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:10, letterSpacing:"0.02em" }}>🎯 {tr("目標進度")}</div>
                  {pinnedGoals.map((g, i) => {
                    const cur = goalDisplayAmount[g.id] ?? goalCurrentAmount(g);
                    const pct = Math.min(100, cur>0?(cur/g.target*100):0);
                    const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
                    const col = daysLeft!==null&&daysLeft<=30 ? C.warn : C.accent;
                    const applied = getGoalSavingsTarget ? getGoalSavingsTarget(curYm, g.id) : null;
                    return (
                      <div key={g.id} onClick={() => { setEditGoal({ ...g }); setModal("editGoal"); }} style={{ cursor:"pointer", paddingBottom:i<pinnedGoals.length-1?10:0, marginBottom:i<pinnedGoals.length-1?10:0, borderBottom:i<pinnedGoals.length-1?`1px solid ${C.border}`:"none" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:6, fontSize:12, marginBottom:6 }}>
                          <span style={{ flex:1, minWidth:0, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.emoji} {g.name}</span>
                          <span style={{ fontWeight:700, color:col, flexShrink:0 }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height:6, borderRadius:3, background:C.border, overflow:"hidden" }}><div style={{ height:"100%", borderRadius:3, background:col, width:`${pct}%`, transition:"width .5s" }} /></div>
                        <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", fontSize:10, color:C.muted, marginTop:5 }}>
                          <span>{tr("差")} {fmt(Math.max(0,g.target-cur))}{daysLeft!==null?` · ${tr("剩")}${daysLeft}${tr("天")}`:""}</span>
                          {applied != null && <span style={{ fontSize:9, fontWeight:700, color:C.teal, background:`${C.teal}18`, padding:"1px 6px", borderRadius:8 }}>✅ {tr("已套用")}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                            {isGoalSpendTxn(t) && <Bdg color={C.teal}>🎯 {t.goalName || tr("目標")}</Bdg>}
                          </div>
                          <div style={{ fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {t.desc}{t.acc && <span style={{ color:C.muted }}> · {accFieldLabel(t.acc)}</span>}{t.tags && !isGoalSpendTxn(t) && <span style={{ color:C.accentL }}> {t.tags}</span>}
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
