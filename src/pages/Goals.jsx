import { useState, useRef } from "react";

export default function GoalsPage({
  C, tab, fmt, upd, setModal, confirm, TODAY,
  accs, buckets, goals, useMvForAssets, stTotMv,
  setEditGoal, goalCurrentAmount, isGoalArchived, isGoalComplete, setGoalArchived, setOffsetGoal, setDepositGoal,
  curSavingsTarget, savingsProgress, curYm, getGoalSavingsTarget, allocSettings, setAllocSettings, yearlyGoalSchedule, goalRecurringAmount, goalStockShares, priceForTicker,
  pendingAutoInvest, confirmAutoInvest, iSt, createEmergencyFund,
  Card, Btn, SH, Sl
}) {
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showAllocSettings, setShowAllocSettings] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const hasEmergencyFund = (goals||[]).some(g => g.isEmergencyFund);

  const GoalCard = ({ g, compact }) => {
    const goalUseMv = g.useMv != null ? g.useMv : useMvForAssets;
    const current = goalCurrentAmount(g);
    const pct = Math.min(100, current > 0 ? (current / g.target * 100) : 0);
    const remaining = Math.max(0, g.target - current);
    const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline)-new Date(TODAY))/86400000)) : null;
    const isExpired = g.deadline && daysLeft === 0;
    const col = daysLeft !== null && daysLeft <= 30 ? C.warn : C.accent;
    const typeLabel = { milestone:"🏔️ 里程碑", sinking:"🎯 專案存錢", wishlist:"🎁 願望池" }[g.goalType || "sinking"];
    const pendingInvest = g.goalType === "sinking" ? pendingAutoInvest(g) : null;
    const priceInputRef = useRef(null);
    return (
      <Card style={{ padding:compact?14:20, marginBottom:compact?8:12, border:`1px solid ${pct>=100?C.teal:C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:compact?8:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:compact?18:24 }}>{g.emoji}</span>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <div style={{ fontWeight:900, fontSize:compact?13:14, color:C.text }}>{g.name}</div>
                {!compact && <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:`${C.muted}18`, padding:"1px 6px", borderRadius:6 }}>{typeLabel}</span>}
                {g.goalType !== "milestone" && <span style={{ fontSize:10, fontWeight:700, color:g.priority<=3?C.expense:g.priority<=6?C.warn:C.muted, background:`${g.priority<=3?C.expense:g.priority<=6?C.warn:C.muted}18`, padding:"1px 6px", borderRadius:6 }}>P{g.priority??5}</span>}
              </div>
              {g.deadline && <div style={{ fontSize:11, color:isExpired?C.danger:daysLeft<=30?C.warn:C.muted, marginTop:2 }}>{isExpired ? "⚠️ 已到期" : `⏳ 還有 ${daysLeft} 天（${g.deadline}）`}</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => upd("goals", p => p.map(x => x.id===g.id ? { ...x, pinned:!x.pinned } : x))} title="顯示在總覽頁" style={{ background:"none", border:"none", cursor:"pointer", color:g.pinned?C.accent:C.muted, fontSize:16 }}>{g.pinned?"📌":"📍"}</button>
            <button onClick={() => confirm(`把「${g.name}」移到已封存？可以隨時從已封存清單恢復。`, () => setGoalArchived(g.id, true))} title="封存" style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16 }}>📦</button>
            <button onClick={() => { setEditGoal({...g}); setModal("editGoal"); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:16 }}>✏️</button>
            <button onClick={() => confirm(`刪除目標「${g.name}」？`, () => upd("goals", p => p.filter(x => x.id !== g.id)))} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16 }}>✕</button>
          </div>
        </div>
        <div style={{ height:compact?7:10, borderRadius:5, background:C.border, marginBottom:8 }}>
          <div style={{ height:"100%", borderRadius:5, background:pct>=100?C.teal:col, width:`${pct}%`, transition:"width .5s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:compact?11:12 }}>
          <span style={{ color:C.textSub }}>目前 {fmt(current)}</span>
          <span style={{ fontWeight:900, color:pct>=100?C.teal:col }}>{pct.toFixed(1)}%</span>
          <span style={{ color:C.textSub }}>目標 {fmt(g.target)}</span>
        </div>
        {!compact && <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
          {(g.accIds&&g.accIds.length>0)||(g.bucketIds&&g.bucketIds.length>0) ? `計算範圍：${[...accs.filter(a=>(g.accIds||[]).includes(a.id)).map(a=>a.name), ...buckets.filter(b=>(g.bucketIds||[]).includes(b.id)).map(b=>b.name)].join("、")}${g.accIds?.some(id=>accs.find(a=>a.id===id)?.type==="investment") ? `（${goalUseMv?"市值":"成本"}${g.recurringMode==="shares"&&g.shareTicker?`，只算標記給這個目標的 ${g.shareTicker} 股數`:"，帳戶內所有持股"}）` : ""}` : `總資產淨值 = 資產${useMvForAssets&&stTotMv>0?"（市值）":""} - 負債 + 應收 - 應付`}
        </div>}
        {!compact && g.recurringMode === "shares" && g.shareTicker && (() => {
          const gs = goalStockShares(g);
          if (!(gs.shares > 0)) return <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>還沒有透過這個目標買進任何 {g.shareTicker}，進度會在確認買進後開始累加</div>;
          const price = g.sharePriceOverride > 0 ? +g.sharePriceOverride : priceForTicker(g.shareTicker);
          return <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>算法：{gs.shares} 股 × {goalUseMv ? `目前股價 ${fmt(price)}` : `平均成本 ${fmt(gs.shares>0?gs.cost/gs.shares:0)}`} = {fmt(current)}</div>;
        })()}
        {remaining > 0 && <div style={{ marginTop:6, fontSize:compact?11:12, color:C.muted, textAlign:"center" }}>還差 <strong style={{ color:pct>=100?C.teal:col }}>{fmt(remaining)}</strong></div>}
        {pct >= 100 && (
          <div style={{ marginTop:8, padding:"8px 10px", borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}33`, textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.teal, marginBottom:6 }}>🎉 已達成目標！</div>
            <button onClick={() => setGoalArchived(g.id, true)} style={{ padding:"6px 14px", borderRadius:8, background:C.teal, border:"none", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>📦 封存這個目標</button>
            <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>不封存也沒關係，會繼續留在這裡</div>
          </div>
        )}
        {(() => {
          // 這個月「已套用」的提醒：如果有設定計畫起始月份、而且這個月還沒到規劃起點，就不顯示（避免已排除的月份還殘留舊資料的badge）
          const monthStarted = !allocSettings.planStartYm || curYm >= allocSettings.planStartYm;
          const applied = (monthStarted && g.goalType !== "milestone") ? getGoalSavingsTarget(curYm, g.id) : null;
          if (applied != null) return (
            <div style={{ marginTop:8, padding:"6px 10px", borderRadius:8, background:`${C.teal}12`, border:`1px solid ${C.teal}33`, fontSize:11, color:C.teal, textAlign:"center" }}>🧠 這個月分流引擎已套用：存 {fmt(applied)}</div>
          );
          if (g.goalType !== "sinking") return null;
          const thisMonthAmt = goalRecurringAmount(g, curYm);
          if (!(thisMonthAmt > 0)) return null;
          const isShares = g.recurringMode === "shares" && g.shareTicker;
          // 有沒有排未來會生效的調整（下個月以後）
          const upcoming = (g.recurringSchedule||[]).filter(r => r.fromYm && r.fromYm > curYm).sort((a,b) => a.fromYm.localeCompare(b.fromYm))[0];
          return (
            <div style={{ marginTop:8, padding:"6px 10px", borderRadius:8, background:`${C.accentL}12`, border:`1px solid ${C.accentL}33`, fontSize:11, color:C.accentL, textAlign:"center" }}>
              🔁 定期定額：這個月{isShares?`約 ${g.recurringShares || upcoming?.value} 股 ${g.shareTicker}（≈${fmt(thisMonthAmt)}）`:`存 ${fmt(thisMonthAmt)}`}
              {upcoming && <div style={{ marginTop:2, fontSize:10, color:C.muted }}>📅 {upcoming.fromYm} 起會調整為 {isShares?`${upcoming.value} 股`:fmt(upcoming.value)}</div>}
            </div>
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
        {pendingInvest && (
          <div style={{ marginTop:8, padding:10, borderRadius:10, background:`${C.accent}15`, border:`1px solid ${C.accent}44` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.accentL, marginBottom:6 }}>🔁 這個月的定期定額還沒買，計畫買 {pendingInvest.shares} 股</div>
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>股價</span>
              <input ref={priceInputRef} type="number" defaultValue={pendingInvest.price} style={{ flex:1, padding:"5px 8px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:12 }} />
              <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>≈{fmt(pendingInvest.shares * pendingInvest.price)}</span>
            </div>
            <Btn style={{ width:"100%" }} onClick={() => {
              const price = +priceInputRef.current?.value || pendingInvest.price;
              const shares = pendingInvest.shares; // 股數是「定期定額」排程裡設定的，改股價不會連動改股數
              confirm(`確定用股價 ${fmt(price)} 買進 ${shares} 股「${g.shareTicker}」，共 ${fmt(shares*price)}？`, () => confirmAutoInvest(g, { price, shares }), "確認買進");
            }}>✅ 確認買進</Btn>
          </div>
        )}
      </Card>
    );
  };

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
            釘選（📌）的目標會顯示在總覽頁最上方；設定同一個「分類」的目標會合併顯示在一個大框裡。
          </div>

          <Card style={{ padding:16, marginBottom:16 }}>
            <button onClick={() => setShowAllocSettings(p=>!p)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", padding:0 }}>
              <span style={{ fontWeight:900, fontSize:14, color:C.text }}>🧠 智慧分流：預設參數</span>
              <span style={{ fontSize:12, color:C.muted }}>{showAllocSettings?"▲":"▼"}</span>
            </button>
            {showAllocSettings && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:12, lineHeight:1.6 }}>
                  分流引擎和年度現金流預測排程，沒有特別設定時都會用這裡的預設值。
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, marginBottom:6 }}>預設每月收入</label>
                  <input type="number" defaultValue={allocSettings.defaultIncome} onBlur={e => setAllocSettings({ defaultIncome:+e.target.value||0 })} style={iSt} />
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, marginBottom:6 }}>預設生活費上限</label>
                  <input type="number" defaultValue={allocSettings.defaultLivingCap} onBlur={e => setAllocSettings({ defaultLivingCap:+e.target.value||0 })} style={iSt} />
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, marginBottom:6 }}>預設投資額</label>
                  <input type="number" defaultValue={allocSettings.defaultInvestAmt} onBlur={e => setAllocSettings({ defaultInvestAmt:+e.target.value||0 })} style={iSt} />
                </div>
                <Sl label="預設證券帳戶" value={allocSettings.defaultInvestAccId||""} onChange={e => setAllocSettings({ defaultInvestAccId:e.target.value })}>
                  <option value="">— 不指定 —</option>
                  {accs.filter(a=>a.type==="investment").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Sl>
                <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, marginBottom:6 }}>計畫起始月份（選填）</label>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:8, lineHeight:1.6 }}>
                    年度現金流預測、各專案的每月排程，都會從這個月開始算，比這個月更早的月份不會出現、也不會被算進「已存了多少」。留空＝從這個月開始。
                  </div>
                  <input type="month" value={allocSettings.planStartYm||""} onChange={e => setAllocSettings({ planStartYm:e.target.value })} style={iSt} />
                </div>
              </div>
            )}
          </Card>

          <Card style={{ padding:16, marginBottom:16 }}>
            <button onClick={() => setShowStrategies(p=>!p)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", padding:0 }}>
              <span style={{ fontWeight:900, fontSize:14, color:C.text }}>📚 理財策略</span>
              <span style={{ fontSize:12, color:C.muted }}>{showStrategies?"▲":"▼"}</span>
            </button>
            {showStrategies && (
              <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ padding:12, borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>🚨 緊急預備金</div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:10, lineHeight:1.6 }}>
                    建議先存 3-6 個月的生活費，當意外狀況的緩衝，跟旅費、3C 這種「想要型」目標分開看待。
                  </div>
                  {hasEmergencyFund ? (
                    <div style={{ fontSize:11, color:C.teal }}>✅ 已經有這個目標了，在下面的清單可以看到</div>
                  ) : (
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => confirm("用「生活費預算 × 3個月」建立一個優先級最高的緊急預備金目標？", () => createEmergencyFund(3))} style={{ flex:1, padding:8, borderRadius:8, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer" }}>建立 3 個月份</button>
                      <button onClick={() => confirm("用「生活費預算 × 6個月」建立一個優先級最高的緊急預備金目標？", () => createEmergencyFund(6))} style={{ flex:1, padding:8, borderRadius:8, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer" }}>建立 6 個月份</button>
                    </div>
                  )}
                </div>
                <div style={{ padding:12, borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>🪣 多桶理財法</div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>
                    依時間長短分桶：短期（1年內要用）、中期（3-5年）、長期（退休/財富累積）。新增或編輯目標時，「分類」欄位可以直接填「短期」「中期」「長期」，同分類的目標會在上面自動合併成一個大框，方便你照時間長短管理。
                  </div>
                </div>
                <div style={{ padding:12, borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>0️⃣ 零基預算</div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>
                    每一塊錢都要有明確去處，分配到剩 0 為止——上面的「🧠 智慧分流」本來就是照這個邏輯運作的：收入先扣投資、生活費，剩下依序分給各個目標，分不完的才進「剩餘資金」，不會憑空消失。
                  </div>
                </div>
                <div style={{ padding:12, borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>📊 50/30/20 法則</div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>
                    收入分成需要50%／想要30%／儲蓄20%。這個月實際的比例，可以到「圖表」頁最上面看。
                  </div>
                </div>
                <div style={{ padding:12, borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>❄️ 債務雪球／雪崩法</div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>
                    這個還沒做——因為現在的「往來帳」記的是代墊/應收應付，不是真正的貸款/信用卡分期債務管理，需要一個新的功能才能好好做這個，之後有需要再跟我說。
                  </div>
                </div>
              </div>
            )}
          </Card>


          {(!goals || goals.length === 0) && (
            <Card style={{ padding:20, textAlign:"center", marginBottom:16 }}>
              <div style={{ color:C.muted, fontSize:13 }}>還沒有設定目標，點右上角新增！</div>
            </Card>
          )}

          {(() => {
            const activeGoals = (goals||[]).filter(g => !isGoalArchived(g));
            const groupNames = [...new Set(activeGoals.map(g => g.group).filter(Boolean))];
            const ungrouped = activeGoals.filter(g => !g.group);
            return (
              <>
                {groupNames.map(gname => {
                  const members = activeGoals.filter(g => g.group === gname);
                  const groupCurrent = members.reduce((s,g) => s + goalCurrentAmount(g), 0);
                  const groupTarget = members.reduce((s,g) => s + (g.target||0), 0);
                  const groupPct = groupTarget > 0 ? Math.min(100, groupCurrent/groupTarget*100) : 0;
                  const isCollapsed = collapsedGroups[gname];
                  return (
                    <Card key={gname} style={{ padding:16, marginBottom:14, background:C.bg, border:`1px solid ${C.border}` }}>
                      <button onClick={() => setCollapsedGroups(p => ({ ...p, [gname]: !p[gname] }))} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0, marginBottom:isCollapsed?0:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontWeight:900, fontSize:15, color:C.text }}>📁 {gname}<span style={{ fontSize:11, fontWeight:400, color:C.muted }}>（{members.length} 個）</span></span>
                          <span style={{ fontSize:12, color:C.muted }}>{isCollapsed?"▼":"▲"}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginTop:4 }}>
                          <span>合計 {fmt(groupCurrent)} / {fmt(groupTarget)}</span>
                          <span style={{ fontWeight:700, color:groupPct>=100?C.teal:C.accentL }}>{groupPct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height:6, borderRadius:4, background:C.border, marginTop:6 }}>
                          <div style={{ height:"100%", borderRadius:4, background:groupPct>=100?C.teal:C.accent, width:`${groupPct}%` }} />
                        </div>
                      </button>
                      {!isCollapsed && members.map(g => <GoalCard key={g.id} g={g} compact />)}
                    </Card>
                  );
                })}
                {ungrouped.map(g => <GoalCard key={g.id} g={g} compact={false} />)}
              </>
            );
          })()}

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
                          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{g.name}{g.group ? <span style={{ fontSize:10, fontWeight:400, color:C.muted }}> ・{g.group}</span> : null}</div>
                          <div style={{ fontSize:10, color:g.wishPurchased?C.teal:C.muted }}>{g.wishPurchased ? "🎁 已實現願望" : pct>=100 ? "🎉 已達標" : isGoalComplete(g) ? "⚠️ 已過期" : "📦 已封存"}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:13, fontWeight:900, color:C.text }}>{fmt(current)}</span>
                        <button onClick={() => setGoalArchived(g.id, false)} title="恢復到進行中" style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14 }}>↩️</button>
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
