import { useState } from "react";

export default function GoalsPage({
  C, tab, fmt, upd, setModal, confirm, TODAY,
  accs, buckets, goals, useMvForAssets, stTotMv,
  setEditGoal, goalCurrentAmount, isGoalArchived, setOffsetGoal, setDepositGoal,
  curSavingsTarget, savingsProgress, curYm, getGoalSavingsTarget, allocSettings, yearlyGoalSchedule,
  Card, Btn
}) {
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);

  return (
    <>
      {tab === "goals" && (
        <div style={{ padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ fontWeight:900, fontSize:18, color:C.text }}>🎯 我的目標</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setModal("allocEngine")} style={{ padding:"8px 12px", borderRadius:10, background:"none", border:`1px solid ${C.teal}44`, color:C.teal, fontWeight:700, fontSize:13, cursor:"pointer" }}>🧠 智慧分流</button>
              <Btn sz="sm" onClick={() => setModal("addGoal")}>＋ 新增目標</Btn>
            </div>
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:16, lineHeight:1.6 }}>
            釘選（📌）的目標會顯示在總覽頁最上方，其他都在這裡管理。
          </div>


          {(!goals || goals.length === 0) && (
            <Card style={{ padding:20, textAlign:"center", marginBottom:16 }}>
              <div style={{ color:C.muted, fontSize:13 }}>還沒有設定目標，點右上角新增！</div>
            </Card>
          )}
          {(goals||[]).filter(g => !isGoalArchived(g)).map(g => {
            const goalUseMv = g.useMv != null ? g.useMv : useMvForAssets;
            const current = goalCurrentAmount(g);
            const pct = Math.min(100, current > 0 ? (current / g.target * 100) : 0);
            const remaining = Math.max(0, g.target - current);
            const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
            const isExpired = g.deadline && daysLeft === 0;
            const col = daysLeft !== null && daysLeft <= 30 ? C.warn : C.accent;
            const typeLabel = { milestone:"🏔️ 里程碑", sinking:"🎯 專案存錢", wishlist:"🎁 願望池" }[g.goalType || "sinking"];
            return (
              <Card key={g.id} style={{ padding:20, marginBottom:12, border:`1px solid ${pct>=100?C.teal:C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:24 }}>{g.emoji}</span>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{g.name}</div>
                        <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:`${C.muted}18`, padding:"1px 6px", borderRadius:6 }}>{typeLabel}</span>
                        {g.goalType !== "milestone" && <span style={{ fontSize:10, fontWeight:700, color:g.priority<=3?C.expense:g.priority<=6?C.warn:C.muted, background:`${g.priority<=3?C.expense:g.priority<=6?C.warn:C.muted}18`, padding:"1px 6px", borderRadius:6 }}>優先級 {g.priority??5}</span>}
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
                {(() => {
                  // 這個月「已套用」的提醒：如果有設定計畫起始月份、而且這個月還沒到規劃起點，就不顯示（避免已排除的月份還殘留舊資料的badge）
                  const monthStarted = !allocSettings.planStartYm || curYm >= allocSettings.planStartYm;
                  const applied = (monthStarted && g.goalType !== "milestone") ? getGoalSavingsTarget(curYm, g.id) : null;
                  return applied == null ? null : (
                    <div style={{ marginTop:8, padding:"6px 10px", borderRadius:8, background:`${C.teal}12`, border:`1px solid ${C.teal}33`, fontSize:11, color:C.teal, textAlign:"center" }}>🧠 這個月分流引擎已套用：存 {fmt(applied)}</div>
                  );
                })()}
                {(() => {
                  // 照目前「已規劃」的節奏（年度預測裡各月的套用/估算值加總），到期時是否還會有缺口
                  if (g.goalType !== "sinking" || remaining <= 0) return null;
                  const sched = (yearlyGoalSchedule||[]).find(x => x.id === g.id);
                  if (!sched) return null;
                  const plannedTotal = sched.perMonth.reduce((s,m) => s + (m.alloc||0), 0);
                  const stillShort = Math.max(0, sched.totalNeeded - plannedTotal);
                  if (stillShort <= 0) return <div style={{ marginTop:4, fontSize:11, color:C.teal, textAlign:"center" }}>✅ 照目前規劃的節奏，到期前存得完</div>;
                  return <div style={{ marginTop:4, fontSize:11, color:C.warn, textAlign:"center" }}>⚠️ 照目前規劃的節奏，到期時預估還會差 {fmt(stillShort)}</div>;
                })()}
                {g.goalType === "sinking" && current > 0 && (
                  <button onClick={() => { setOffsetGoal(g); setModal("wishOffset"); }} style={{ width:"100%", marginTop:8, padding:8, borderRadius:8, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, color:C.teal, fontWeight:700, fontSize:12, cursor:"pointer" }}>💸 花這筆錢了，記一筆支出（不算進生活費）</button>
                )}
                {g.goalType !== "milestone" && ((g.accIds&&g.accIds.length>0)||(g.bucketIds&&g.bucketIds.length>0)) && (
                  <button onClick={() => { setDepositGoal(g); setModal("goalDeposit"); }} style={{ width:"100%", marginTop:8, padding:8, borderRadius:8, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer" }}>💰 這個月多存的錢，存入這個目標</button>
                )}
              </Card>
            );
          })}

          {(goals||[]).some(g => isGoalArchived(g)) && (
            <div style={{ marginTop:8 }}>
              <button onClick={() => setShowArchivedGoals(p=>!p)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 4px", background:"none", border:"none", cursor:"pointer" }}>
                <span style={{ fontSize:12, fontWeight:700, color:C.muted }}>📦 已封存目標（{(goals||[]).filter(g=>isGoalArchived(g)).length}）</span>
                <span style={{ fontSize:12, color:C.muted }}>{showArchivedGoals?"▲":"▼"}</span>
              </button>
              {showArchivedGoals && (goals||[]).filter(g=>isGoalArchived(g)).map(g => {
                const current = goalCurrentAmount(g);
                const pct = Math.min(100, current > 0 ? (current / g.target * 100) : 0);
                const isWishlist = g.goalType === "wishlist";
                const canOffset = isWishlist ? (pct >= 100 && !g.wishPurchased) : current > 0;
                return (
                  <Card key={g.id} style={{ padding:14, marginBottom:8, opacity:0.75 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:18 }}>{g.emoji}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{g.name}</div>
                          <div style={{ fontSize:10, color:g.wishPurchased?C.teal:C.muted }}>{g.wishPurchased ? "🎁 已實現願望" : pct>=100 ? "🎉 已達標" : "⚠️ 已過期"}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:13, fontWeight:900, color:C.text }}>{fmt(current)}</span>
                        <button onClick={() => confirm(`確定刪除已封存目標「${g.name}」？`, () => upd("goals", p => p.filter(x=>x.id!==g.id)))} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:14 }}>✕</button>
                      </div>
                    </div>
                    {canOffset && (
                      <button onClick={() => { setOffsetGoal(g); setModal("wishOffset"); }} style={{ width:"100%", marginTop:8, padding:8, borderRadius:8, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, color:C.teal, fontWeight:700, fontSize:12, cursor:"pointer" }}>{isWishlist ? "🎁 已實現願望，記一筆對沖" : "💸 開始花這筆錢了，記一筆支出（不算進生活費）"}</button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
