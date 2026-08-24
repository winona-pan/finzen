import { useState } from "react";

export default function WalletPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, modal, close, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, monthlyEquiv,
  ALL_CURS, rates: _rates,
  collapsed, toggleSection, selAcc, setSelAcc, newBal, setNewBal, buckets, updateBucket, deleteBucket, moveBucket, growthBucket, setGrowthBucket,
  selSub, setSelSub, selBill, setSelBill, selPolicy, setSelPolicy, toggleSub, toggleBill,
  premAmt, setPremAmt, premAcc, setPremAcc, surrenderAmt, setSurrenderAmt, surrenderAcc, setSurrenderAcc,
  // 共用 UI atoms
  InfoBtn, SH, Card, SwipeRow, Bdg, Btn, EmojiPicker
}) {

  /* ── 局部狀態 ── */
  const [wMode, setWMode] = useState("normal");
  const [editingBucket, setEditingBucket] = useState(null);
  const [bucketEPFor, setBucketEPFor] = useState(null);
  const [localRates, setLocalRates] = useState(() => ({ ...rates }));

  /* ── 重新啟用訂閱/開銷時，把 lastBilled 重設為「上個月最後一天」，
        讓自動記帳只從當月開始算，不補停用期間錯過的月份 ── */
  const [accDetailMonth, setAccDetailMonth] = useState(null);

  /* ── 資料匯出 ── */
  const exportData = () => { 
    const b = new Blob([JSON.stringify({ accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies }, null, 2)], { type:"application/json" }); 
    const u = URL.createObjectURL(b), a = document.createElement("a"); 
    a.href = u; a.download = `finzen_${TODAY}.json`; a.click(); URL.revokeObjectURL(u); 
  };

  return (
    <>

      {tab === "wallet" && (
        <div>
          {wMode === "sort" && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:`${C.accent}22`, borderBottom:`1px solid ${C.accent}55` }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.accentL }}>⠿ 拖曳調整順序</span>
            <button onClick={() => setWMode("normal")} style={{ padding:"6px 16px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:900, fontSize:14, cursor:"pointer" }}>✓ 完成</button>
          </div>}
          <div style={{ position:"relative", padding:"20px 20px 28px", background:`linear-gradient(150deg,${C.surface} 0%,${C.bg} 100%)` }}>
            <div style={{ position:"absolute", right:-30, top:-30, width:200, height:200, borderRadius:"50%", background:C.accent, filter:"blur(60px)", opacity:.07, pointerEvents:"none" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, position:"relative", zIndex:2 }}>
              <span style={{ fontWeight:900, fontSize:24, color:C.text }}>錢包</span>
              <div style={{ display:"flex", gap:6 }}>
                {[{ icon:"👁", mode:"vis" }, { icon:"⠿", mode:"sort" }, { icon:"➕", cb:() => setModal("addAccType") }].map((b, i) => (
                  <button key={i} onClick={b.cb || (() => setWMode(p => p === b.mode ? "normal" : b.mode))}
                    style={{ width:36, height:36, borderRadius:10,
                      background: b.mode && wMode === b.mode ? `${C.accent}40` : `${C.text}12`,
                      border:`1px solid ${b.mode && wMode === b.mode ? C.accent : `${C.text}30`}`,
                      cursor:"pointer",
                      color: b.mode && wMode === b.mode ? C.accent : C.text,
                      fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {b.icon}
                  </button>
                ))}
              </div>
            </div>
            {wMode === "vis" && <div style={{ borderRadius:14, padding:12, marginBottom:16, background:C.card, border:`1px solid ${C.borderL}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textSub, marginBottom:8 }}>點擊切換顯示（帳戶）</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:buckets.length>0?14:0 }}>{accs.map(a => <button key={a.id} onClick={() => upd("accs", p => p.map(x => x.id === a.id ? { ...x, vis:!x.vis } : x))} style={{ fontSize:12, padding:"4px 10px", borderRadius:10, fontWeight:700, background:a.vis ? `${C.accent}28` : C.surface, color:a.vis ? C.accentL : C.muted, border:`1px solid ${a.vis ? C.accent : C.border}`, cursor:"pointer" }}>{AT[a.type] || ""} {a.name}</button>)}</div>
              {buckets.length > 0 && <>
                <div style={{ fontSize:11, fontWeight:700, color:C.textSub, marginBottom:8 }}>點擊切換顯示（子帳戶，隱藏的不計入總資產）</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{buckets.map(b => { const acc = accs.find(a=>a.id===b.accId); return <button key={b.id} onClick={() => confirm(b.vis===false ? `確定讓「${b.name}」計入總資產？` : `確定隱藏「${b.name}」？金額將不計入總資產`, () => updateBucket(b.id, { vis: b.vis===false ? true : false }), b.vis===false ? "確認顯示" : "確認隱藏")} style={{ fontSize:12, padding:"4px 10px", borderRadius:10, fontWeight:700, background:b.vis!==false ? `${C.teal}28` : C.surface, color:b.vis!==false ? C.teal : C.muted, border:`1px solid ${b.vis!==false ? C.teal : C.border}`, cursor:"pointer" }}>{b.emoji} {acc?.name}・{b.name}</button>; })}</div>
              </>}
            </div>}
            <div style={{ fontSize:12, fontWeight:700, color:C.textSub, marginBottom:3 }}>總資產淨值</div>
            <div style={{ fontWeight:900, fontSize:34, color:C.text, letterSpacing:"-1.5px", marginBottom:18 }}>{fmt(netWorth)}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, textAlign:"center" }}>
              {[{ l:"資產", v:totAssets, c:C.income }, { l:"負債", v:totDebt, c:C.expense }, { l:"應收", v:totRec, c:C.teal }, { l:"應付", v:totPay, c:C.warn }].map(k => (
                <div key={k.l}><div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{k.l}</div><div style={{ fontWeight:900, fontSize:13, color:k.c }}>{fmt(k.v)}</div></div>
              ))}
            </div>
          </div>
          <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:16 }}>
            {/* Quick actions */}
            <div style={{ display:"flex", gap:8 }}>
              {(accs.filter(a=>a.type!=="credit").length + buckets.length) > 1 && (
                <button onClick={() => setModal("bucketTransfer")} style={{ flex:1, padding:10, borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontWeight:700, fontSize:13, cursor:"pointer" }}>🔄 轉帳</button>
              )}
              <button onClick={() => { const c = accs.find(a => a.type === "credit" && (a.payable || 0) > 0) || accs.find(a => a.type === "credit"); if (c) setModal("payCred"); }} style={{ flex:1, padding:10, borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.teal, fontWeight:700, fontSize:13, cursor:"pointer" }}>💳 信用卡繳費</button>
            </div>

            {/* Account groups */}
            {/* ── 資產（暫不拆分流動／非流動，之後再設計）── */}
            <button onClick={() => toggleSection("assets")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:collapsed["assets"]?4:8, marginTop:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:13, fontWeight:900, color:C.textSub }}>資產</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:C.textSub }}>{fmt(visA.reduce((s,a)=>s+toTWD(a.bal,a.cur,rates),0))}</span>
                <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["assets"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
              </div>
            </button>
            {!collapsed["assets"] && [{ label:"現金", type:"cash" }, { label:"金融卡", type:"debit" }, { label:"證券帳戶", type:"investment" }].map(grp => {
              const items = accs.filter(a => a.type === grp.type).sort((a,b) => (a.order||0)-(b.order||0));
              const all = accs.filter(a => a.type === grp.type).sort((a,b) => (a.order||0)-(b.order||0));
              const total = items.filter(a=>a.vis).reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0);
              if (!all.length) return null;
              const moveAcc = (id, dir) => {
                const sorted = [...all], idx = sorted.findIndex(a => a.id === id), swapIdx = idx + dir;
                if (swapIdx < 0 || swapIdx >= sorted.length) return;
                const reordered = [...sorted];
                [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
                const orderMap = {};
                reordered.forEach((a, i) => { orderMap[a.id] = i; });
                upd("accs", p => p.map(a => orderMap[a.id] !== undefined ? { ...a, order:orderMap[a.id] } : a));
              };
              return <div key={grp.type}>
                <SH title={grp.label} right={fmt(total)} />
                <Card style={{ overflow:"hidden" }}>
                  {all.map((a, i) => {
                    const accRowContent = (
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined, opacity:a.vis?1:0.45 }}>
                        {wMode === "sort" && <div style={{ display:"flex", flexDirection:"column", gap:2, marginRight:2 }}>
                          <button onClick={() => moveAcc(a.id, -1)} disabled={i === 0} style={{ width:24, height:22, borderRadius:6, background:i === 0 ? C.muted + "22" : C.accent + "33", border:"none", cursor:i === 0 ? "default" : "pointer", color:i === 0 ? C.muted : C.accentL, fontSize:13 }}>▲</button>
                          <button onClick={() => moveAcc(a.id, 1)} disabled={i === all.length - 1} style={{ width:24, height:22, borderRadius:6, background:i === all.length - 1 ? C.muted + "22" : C.accent + "33", border:"none", cursor:i === all.length - 1 ? "default" : "pointer", color:i === all.length - 1 ? C.muted : C.accentL, fontSize:13 }}>▼</button>
                        </div>}
                        <div style={{ width:44, height:44, borderRadius:14, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{a.icon || AT[a.type] || "💳"}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:a.vis?C.text:C.muted }}>{a.name}</div>
                            {!a.vis && <span style={{ fontSize:11, color:C.muted, background:`${C.muted}22`, padding:"1px 6px", borderRadius:6 }}>已隱藏</span>}
                          </div>
                          <div style={{ fontSize:12, color:C.muted }}>{a.cur}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{fmt(a.bal, a.cur)}</div>
                          {a.cur !== "TWD" && <div style={{ fontSize:11, color:C.muted }}>≈{fmt(toTWD(a.bal, a.cur, rates))}</div>}
                        </div>
                        {wMode !== "sort" && <span style={{ color:C.muted, fontSize:13, marginLeft:4 }}>✏️</span>}
                      </div>
                    );
                    return wMode === "sort" ? (
                      <div key={a.id} style={{ borderTop:i > 0 ? `1px solid ${C.border}` : undefined }}>{accRowContent}</div>
                    ) : (
                      <SwipeRow key={a.id} onDelete={() => { confirm(`確定刪除「${a.name}」？`, () => { upd("accs", p => p.filter(x => x.id !== a.id)); upd("buckets", p => (p||[]).filter(b => b.accId !== a.id)); }); }} onEdit={() => { setSelAcc({ ...a }); setNewBal(String(a.bal)); setModal("adjBal"); }} onClick={() => { setSelAcc({ ...a }); setNewBal(String(a.bal)); setModal("accDetail"); }}>
                        {accRowContent}
                      </SwipeRow>
                    );
                  })}
                </Card>
                {grp.type === "debit" && all.map(a => {
                  const myBuckets = buckets.filter(b => b.accId === a.id).sort((x,y) => (x.order||0)-(y.order||0));
                  if (!myBuckets.length) return null;
                  return <div key={a.id + "_bk"} style={{ margin:"4px 0 8px", paddingLeft:8 }}>
                    {myBuckets.map((b, bi) => {
                      const bucketRowContent = editingBucket === b.id ? (
                        <div style={{ padding:"8px 12px", background:`${C.accent}08`, borderRadius:10 }}>
                          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                            <button onClick={() => setBucketEPFor(b.id)} style={{ width:32, height:32, borderRadius:9, background:C.card, border:`1px solid ${C.border}`, fontSize:15, cursor:"pointer", flexShrink:0 }}>{b.emoji}</button>
                            <input value={b.name} onChange={e => updateBucket(b.id, { name:e.target.value })} style={{ ...iSt, flex:1, padding:"6px 8px" }} />
                            <input type="number" value={b.allocated} onChange={e => updateBucket(b.id, { allocated:+e.target.value||0 })} style={{ ...iSt, width:80, padding:"6px 8px" }} />
                          </div>
                          <button onClick={() => setEditingBucket(null)} style={{ width:"100%", marginTop:6, padding:6, borderRadius:8, background:C.accent, color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>完成</button>
                        </div>
                      ) : (
                        <div onClick={() => wMode !== "sort" && setEditingBucket(b.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", opacity:b.vis===false?0.4:1, cursor:wMode==="sort"?"default":"pointer" }}>
                          {wMode === "sort" && <div style={{ display:"flex", flexDirection:"column", gap:2, marginRight:2 }}>
                            <button onClick={() => moveBucket(a.id, b.id, -1)} disabled={bi===0} style={{ width:20, height:18, borderRadius:5, background:bi===0?C.muted+"22":C.accent+"33", border:"none", cursor:bi===0?"default":"pointer", color:bi===0?C.muted:C.accentL, fontSize:11 }}>▲</button>
                            <button onClick={() => moveBucket(a.id, b.id, 1)} disabled={bi===myBuckets.length-1} style={{ width:20, height:18, borderRadius:5, background:bi===myBuckets.length-1?C.muted+"22":C.accent+"33", border:"none", cursor:bi===myBuckets.length-1?"default":"pointer", color:bi===myBuckets.length-1?C.muted:C.accentL, fontSize:11 }}>▼</button>
                          </div>}
                          <span style={{ fontSize:12, color:C.muted }}>└</span>
                          <span style={{ fontSize:15 }}>{b.emoji}</span>
                          <span style={{ flex:1, fontSize:13, color:C.textSub }}>{a.name}・{b.name}</span>
                          {b.vis===false && <span style={{ fontSize:10, color:C.muted, background:`${C.muted}22`, padding:"1px 6px", borderRadius:6 }}>不計入資產</span>}
                          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{fmt(b.allocated)}</span>
                        </div>
                      );
                      const bucketActionBtns = wMode !== "sort" && editingBucket !== b.id && (b.history||[]).length > 1 ? (
                        <button onClick={() => { setGrowthBucket(b.id); setModal("bucketGrowth"); }} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, padding:"0 10px" }}>📈</button>
                      ) : null;
                      if (wMode === "sort") return <div key={b.id}>{bucketRowContent}</div>;
                      return (
                        <div key={b.id} style={{ display:"flex", gap:6, alignItems:"stretch", marginBottom: editingBucket===b.id ? 0 : 1 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            {editingBucket === b.id ? bucketRowContent : (
                              <SwipeRow onDelete={() => confirm(`刪除子帳戶「${b.name}」？`, () => deleteBucket(b.id))}>{bucketRowContent}</SwipeRow>
                            )}
                          </div>
                          {bucketActionBtns}
                        </div>
                      );
                    })}
                  </div>;
                })}
                {bucketEPFor && <EmojiPicker onSelect={e => { updateBucket(bucketEPFor, { emoji:e }); setBucketEPFor(null); }} onClose={() => setBucketEPFor(null)} />}
              </div>;
            })}

            {/* ── 負債（信用卡）── */}
            <button onClick={() => toggleSection("credit")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:collapsed["credit"]?4:8, marginTop:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:13, fontWeight:900, color:C.textSub }}>負債（信用卡）</span>
                <InfoBtn msg="信用卡應付金額是你欠銀行的錢，已從總資產中扣除。" />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:totDebt>0?C.expense:C.textSub }}>{totDebt>0?`-${fmt(totDebt)}`:fmt(0)}</span>
                <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["credit"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
              </div>
            </button>
            {!collapsed["credit"] && accs.filter(a => a.type === "credit").length > 0 && <div>
              <Card style={{ overflow:"hidden" }}>
                {accs.filter(a => a.type === "credit").map((c, i) => {
                  const pct = c.limit > 0 ? Math.round(c.payable / c.limit * 100) : 0;
                  const overLimit = pct > 100;
                  const col = overLimit ? C.danger : pct > 70 ? C.warn : pct > 40 ? C.income : C.textSub;
                  return <SwipeRow key={c.id} onDelete={() => confirm(`確定刪除「${c.name}」？`, () => upd("accs", p => p.filter(a => a.id !== c.id)))} onEdit={() => { setSelAcc({ ...c }); setModal("editCredit"); }}>
                    <div style={{ padding:"14px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined, cursor:"pointer" }}
                      onClick={() => { setSelAcc({ ...c }); setNewBal(String(c.payable || 0)); setModal("accDetail"); }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                        <div style={{ width:44, height:44, borderRadius:14, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>💳</div>
                        <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.name}</div><div style={{ fontSize:12, color:C.muted }}>應付 <span style={{ color:col, fontWeight:overLimit?700:400 }}>{fmt(c.payable)}</span> / {fmt(c.limit)}</div></div>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <Bdg color={col}>{overLimit ? `⚠️ ${pct}%` : `${pct}%`}</Bdg>
                        </div>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:C.border, overflow:"hidden" }}><div style={{ height:"100%", borderRadius:3, width:`${Math.min(100, pct)}%`, background:col }} /></div>
                      {overLimit && <div style={{ fontSize:11, color:C.danger, marginTop:4 }}>已超過信用額度 {fmt(c.payable - c.limit)}</div>}
                    </div>
                  </SwipeRow>;
                })}
              </Card>
            </div>}

            {/* ── 儲蓄險/投資型保單 ── */}
            {(policies||[]).length > 0 && <div style={{ marginBottom:8 }}>
              <button onClick={() => toggleSection("policies")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:collapsed["policies"]?4:6, marginTop:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:C.textSub }}>儲蓄保單</span>
                  <InfoBtn msg="純追蹤損益，不計入總資產。繳保費時帳戶餘額減少，解約時記錄領回與損益。" />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, color:C.muted, background:`${C.muted}18`, padding:"1px 6px", borderRadius:4 }}>追蹤用</span>
                  <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["policies"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
                </div>
              </button>
              {!collapsed["policies"] && <Card style={{ overflow:"hidden" }}>
                {(policies||[]).map((pl, i) => {
                  const totalPaid = pl.totalPaid || 0;
                  const surrenderTWD = toTWD(pl.surrenderVal||0, pl.cur||"TWD", rates);
                  const totalPaidTWD = toTWD(totalPaid, pl.cur||"TWD", rates);
                  const pnl = surrenderTWD - totalPaidTWD;
                  const isForeign = pl.cur && pl.cur !== "TWD";
                  return <div key={pl.id} style={{ padding:"12px 16px", borderTop:i>0?`1px solid ${C.border}`:undefined }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:20 }}>{pl.emoji||"🛡️"}</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{pl.name}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{pl.insurer}</div>
                          {pl.maturityDate && <div style={{ fontSize:11, color:C.muted }}>到期 {pl.maturityDate}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:C.textSub }}>解約金</div>
                        <div style={{ fontWeight:900, fontSize:14, color:C.accentL }}>
                          {isForeign ? `${pl.cur} ${(pl.surrenderVal||0).toLocaleString()}` : fmt(pl.surrenderVal||0)}
                        </div>
                        {isForeign && <div style={{ fontSize:11, color:C.muted }}>≈ {fmt(surrenderTWD)}</div>}
                        <div style={{ fontSize:11, color:C.muted }}>已繳 {isForeign ? `${pl.cur} ${totalPaid.toLocaleString()}` : fmt(totalPaid)}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:pnlColor(pnl,C) }}>{pnl>=0?"▲ +":"▼ "}{fmt(Math.abs(pnl))}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <Btn sz="sm" v="secondary" onClick={() => { setSelPolicy({...pl}); setPremAmt(String(pl.lastPremium||"")); setPremAcc(""); setModal("payPremium"); }}>💰 繳保費</Btn>
                      <Btn sz="sm" v="secondary" onClick={() => { setSelPolicy({...pl}); setModal("editPolicy"); }}>✏️ 更新</Btn>
                      <Btn sz="sm" v="warn" onClick={() => { setSelPolicy({...pl}); setSurrenderAmt(String(pl.surrenderVal||"")); setSurrenderAcc(""); setModal("surrenderPolicy"); }}>📋 解約</Btn>
                      <Btn sz="sm" v="danger" onClick={() => confirm(`刪除「${pl.name}」？`, () => upd("policies", p=>p.filter(x=>x.id!==pl.id)))}>🗑</Btn>
                    </div>
                  </div>;
                })}
                <div style={{ padding:"8px 16px" }}>
                  <Btn v="secondary" style={{ width:"100%" }} onClick={() => { setModal("addPolicy"); }}>＋ 新增保單</Btn>
                </div>
              </Card>}
            </div>}
          </div>
        </div>
      )}
    </>
  );
}
