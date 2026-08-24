import { useState } from "react";

export default function OtherModals({ 
  C, modal, close, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, buckets,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec,
  cashBal, ceMap, CE, AT, PIE, ALL_CURS, theme,
  collapsed, toggleSection, nT, setNT, T0, descHistory, descHistoryByCat, tagsHistory,
  isSingleMo, chartRange, healthRange, setHealthRange, useMvForAssets, fetchAllPrices,
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF, initF, setInitF,
  selPool, setSelPool, recAmt, setRecAmt, doRecognize, adjBal,
  selAcc, setSelAcc, newBal, setNewBal, adjDesc, setAdjDesc,
  nG, setNG, editGoal, setEditGoal,
  selPolicy, setSelPolicy, nPL, setNPL,
  premAmt, setPremAmt, premAcc, setPremAcc,
  surrenderAmt, setSurrenderAmt, surrenderAcc, setSurrenderAcc,
  showGoalEP, setShowGoalEP, LEARN_DATA, MANUAL_DATA,
  nS, setNS, S0, selSub, setSelSub, saveSub, addSub,
  nB, setNB, B0, selBill, setSelBill, saveBill, addBill,
  nAcc, setNAcc, addAcc, payF, setPayF, doPayCred,
  showHDP, setShowHDP, doBuy, doSell, doInit,
  nD, setND, addDebt, editDebt, setEditDebt,
  settleDebt, setSettleDebt, settleAcc, setSettleAcc,
  settleCustomAmt, setSettleCustomAmt, selTxn, setSelTxn,
  saveTxn, delTxn, moExp, moInc, moTxns, addCustomCE, ceMap: _ce,
  // 共用 UI atoms
  Sheet, Inp, Sl, Fld, CalcInp, Btn, Card, Bdg, EmojiPicker, Sl: SlComponent, guessEmoji
}) {

  /* ── 類別管理局部狀態 ── */
  const [editCat, setEditCat] = useState(null); // {type, oldName, name, emoji}
  const [showEditEP, setShowEditEP] = useState(false);
  const [newCatType, setNewCatType] = useState("expense");
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [emojiTouched, setEmojiTouched] = useState(false);
  const [showCatEP, setShowCatEP] = useState(false);

  /* ── 表單預設值 ── */
  const G0 = { name: "", target: "", deadline: "", emoji: "🎯", accIds: [], bucketIds: [], useMv: null, includeDebts: false, priority: 5, goalType: "sinking" };
  const PL0 = { name: "", insurer: "", premium: "", premiumFreq: "year", startDate: TODAY, maturityDate: "", surrenderVal: "", totalPaid: "", cur: "TWD", emoji: "🛡️" };

  /* ── 新增理財目標 ── */
  const addGoal = () => { 
    if (!nG.name || !nG.target) return; 
    upd("goals", p => [...(p || []), { ...nG, id: "g" + Date.now(), target: +nG.target }]); 
    setNG(G0); close(); 
  };

  /* ── 新增儲蓄保單 ── */
  const addPolicy = () => { 
    if (!nPL.name) return; 
    upd("policies", p => [...(p || []), { ...nPL, id: "pl" + Date.now(), premium: +nPL.premium || 0, surrenderVal: +nPL.surrenderVal || 0 }]); 
    setNPL(PL0); close(); 
  };

  /* ── 新增自訂記帳類別 ── */
  const addCat = () => { 
    if (!newCatName.trim()) return; 
    upd("cats", p => ({ ...p, [newCatType]: [...p[newCatType], newCatName.trim()] })); 
    addCustomCE(newCatName.trim(), newCatEmoji); 
    setNewCatName(""); setNewCatEmoji("📦"); setEmojiTouched(false);
  };

  return (
    <>
        {modal === "addGoal" && <Sheet title="新增目標" onClose={close}>
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:12 }}>
            <button onClick={() => setShowGoalEP(true)} style={{ width:52, height:52, borderRadius:14, background:C.card, border:`2px solid ${C.accent}`, fontSize:26, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{nG.emoji}</button>
            <div style={{ flex:1 }}><Inp label="目標名稱" placeholder="買新電腦、旅遊基金、緊急預備金…" value={nG.name} onChange={e => setNG(p => ({ ...p, name:e.target.value }))} /></div>
          </div>
          <CalcInp label="目標金額" value={nG.target} onChange={v => setNG(p => ({ ...p, target:v }))} />
          <Fld label="目標性質">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                { v:"milestone", l:"🏔️ 純資產里程碑", d:"只用來追蹤總淨值，不參與每月分流扣款" },
                { v:"sinking", l:"🎯 專案存錢池", d:"有截止日，系統自動算每月該存多少" },
                { v:"wishlist", l:"🎁 自由願望池", d:"沒有截止日，用分流剩下的錢慢慢存滿" },
              ].map(o => (
                <button key={o.v} onClick={() => setNG(p => ({ ...p, goalType:o.v, deadline: o.v==="sinking" ? p.deadline : "" }))}
                  style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", padding:"8px 12px", borderRadius:10, background:nG.goalType===o.v?`${C.accent}20`:C.card, border:`1px solid ${nG.goalType===o.v?C.accent:C.border}`, cursor:"pointer", textAlign:"left" }}>
                  <span style={{ fontSize:13, fontWeight:700, color:nG.goalType===o.v?C.accentL:C.text }}>{o.l}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{o.d}</span>
                </button>
              ))}
            </div>
          </Fld>
          {nG.goalType === "sinking" && (
            <Fld label="截止日期（專案存錢池必填）">
              <input type="date" value={nG.deadline||""} onChange={e => setNG(p => ({ ...p, deadline:e.target.value }))} style={iSt} min={TODAY} />
              {nG.deadline && <div style={{ fontSize:12, color:C.accentL, marginTop:4 }}>
                ⏳ 還有 {Math.max(0, Math.ceil((new Date(nG.deadline)-new Date(TODAY))/(86400000)))} 天
              </div>}
            </Fld>
          )}
          {nG.goalType !== "milestone" && (
            <Fld label="優先級（1-10，數字越小分流時越優先）">
              <input type="number" min="1" max="10" value={nG.priority}
                onChange={e => { const raw = e.target.value; setNG(p => ({ ...p, priority: raw === "" ? "" : Math.max(1,Math.min(10,parseInt(raw,10)||1)) })); }}
                onBlur={() => setNG(p => ({ ...p, priority: p.priority === "" || p.priority == null ? 5 : p.priority }))}
                style={iSt} />
            </Fld>
          )}
          <Fld label="計算哪些帳戶（不選則用總資產）">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {accs.filter(a => a.type !== "credit").map(a => (
                <button key={a.id} onClick={() => setNG(p => ({ ...p, accIds:p.accIds.includes(a.id)?p.accIds.filter(x=>x!==a.id):[...p.accIds, a.id] }))}
                  style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:nG.accIds.includes(a.id)?`${C.accent}28`:C.card, color:nG.accIds.includes(a.id)?C.accentL:C.muted, border:`1px solid ${nG.accIds.includes(a.id)?C.accent:C.border}`, cursor:"pointer" }}>
                  {a.icon||AT[a.type]||""} {a.name}
                </button>
              ))}
            </div>
          </Fld>
          {buckets.length > 0 && <Fld label="或指定子帳戶（願望、旅費等）">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {buckets.map(b => {
                const parentSelected = (nG.accIds||[]).includes(b.accId);
                return (
                  <button key={b.id} disabled={parentSelected} onClick={() => setNG(p => ({ ...p, bucketIds:(p.bucketIds||[]).includes(b.id)?p.bucketIds.filter(x=>x!==b.id):[...(p.bucketIds||[]), b.id] }))}
                    style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:(nG.bucketIds||[]).includes(b.id)?`${C.teal}28`:C.card, color:parentSelected?C.muted:(nG.bucketIds||[]).includes(b.id)?C.teal:C.muted, border:`1px solid ${(nG.bucketIds||[]).includes(b.id)?C.teal:C.border}`, cursor:parentSelected?"not-allowed":"pointer", opacity:parentSelected?0.4:1 }}>
                    {b.emoji} {b.name}{parentSelected?"（母帳戶已選）":""}
                  </button>
                );
              })}
            </div>
          </Fld>}
          {stocks.length > 0 && (
            <Fld label="證券部分要不要算未實現損益">
              <div style={{ display:"flex", gap:8 }}>
                {[{v:null,l:"跟隨全域設定"},{v:true,l:"計入市值"},{v:false,l:"只算成本"}].map(o => (
                  <button key={String(o.v)} onClick={() => setNG(p => ({ ...p, useMv:o.v }))} style={{ flex:1, padding:"7px 4px", borderRadius:10, fontSize:11, fontWeight:700, background:(nG.useMv??null)===o.v?`${C.accent}28`:C.card, color:(nG.useMv??null)===o.v?C.accentL:C.muted, border:`1px solid ${(nG.useMv??null)===o.v?C.accent:C.border}`, cursor:"pointer" }}>{o.l}</button>
                ))}
              </div>
            </Fld>
          )}
          {((nG.accIds||[]).length>0 || (nG.bucketIds||[]).length>0) && (
            <button onClick={() => setNG(p => ({ ...p, includeDebts:!p.includeDebts }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:nG.includeDebts ? `${C.teal}22` : C.card, color:nG.includeDebts ? C.teal : C.textSub, border:`1px solid ${nG.includeDebts ? C.teal : C.border}`, cursor:"pointer", marginBottom:12 }}>
              <span>{nG.includeDebts ? "✅" : "⬜"}</span>
              <span style={{ textAlign:"left" }}>指定帳戶時，也把「負債＋往來帳」的應收應付算進這個目標</span>
            </button>
          )}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addGoal}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          {showGoalEP && <EmojiPicker onSelect={e => { setNG(p => ({ ...p, emoji:e })); setShowGoalEP(false); }} onClose={() => setShowGoalEP(false)} />}
        </Sheet>}

        {modal === "editGoal" && editGoal && <Sheet title="編輯目標" onClose={close}>
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:12 }}>
            <button onClick={() => setShowGoalEP(true)} style={{ width:52, height:52, borderRadius:14, background:C.card, border:`2px solid ${C.accent}`, fontSize:26, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{editGoal.emoji||"🎯"}</button>
            <div style={{ flex:1 }}><Inp label="目標名稱" value={editGoal.name||""} onChange={e => setEditGoal(p => ({ ...p, name:e.target.value }))} /></div>
          </div>
          <CalcInp label="目標金額" value={String(editGoal.target||"")} onChange={v => setEditGoal(p => ({ ...p, target:+v }))} />
          <Fld label="目標性質">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                { v:"milestone", l:"🏔️ 純資產里程碑", d:"只用來追蹤總淨值，不參與每月分流扣款" },
                { v:"sinking", l:"🎯 專案存錢池", d:"有截止日，系統自動算每月該存多少" },
                { v:"wishlist", l:"🎁 自由願望池", d:"沒有截止日，用分流剩下的錢慢慢存滿" },
              ].map(o => (
                <button key={o.v} onClick={() => setEditGoal(p => ({ ...p, goalType:o.v, deadline: o.v==="sinking" ? p.deadline : "" }))}
                  style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", padding:"8px 12px", borderRadius:10, background:editGoal.goalType===o.v?`${C.accent}20`:C.card, border:`1px solid ${editGoal.goalType===o.v?C.accent:C.border}`, cursor:"pointer", textAlign:"left" }}>
                  <span style={{ fontSize:13, fontWeight:700, color:editGoal.goalType===o.v?C.accentL:C.text }}>{o.l}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{o.d}</span>
                </button>
              ))}
            </div>
          </Fld>
          {editGoal.goalType === "sinking" && (
            <Fld label="截止日期">
              <input type="date" value={editGoal.deadline||""} onChange={e => setEditGoal(p => ({ ...p, deadline:e.target.value }))} style={iSt} />
              {editGoal.deadline && <div style={{ fontSize:12, color:C.accentL, marginTop:4 }}>
                ⏳ 還有 {Math.max(0, Math.ceil((new Date(editGoal.deadline)-new Date(TODAY))/86400000))}天
              </div>}
            </Fld>
          )}
          {editGoal.goalType !== "milestone" && (
            <Fld label="優先級（1-10，數字越小分流時越優先）">
              <input type="number" min="1" max="10" value={editGoal.priority??5}
                onChange={e => { const raw = e.target.value; setEditGoal(p => ({ ...p, priority: raw === "" ? "" : Math.max(1,Math.min(10,parseInt(raw,10)||1)) })); }}
                onBlur={() => setEditGoal(p => ({ ...p, priority: p.priority === "" || p.priority == null ? 5 : p.priority }))}
                style={iSt} />
            </Fld>
          )}
          <Fld label="計算哪些帳戶（不選則用總資產）">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {accs.filter(a => a.type !== "credit").map(a => (
                <button key={a.id} onClick={() => setEditGoal(p => ({ ...p, accIds:(p.accIds||[]).includes(a.id)?p.accIds.filter(x=>x!==a.id):[...(p.accIds||[]), a.id] }))}
                  style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:(editGoal.accIds||[]).includes(a.id)?`${C.accent}28`:C.card, color:(editGoal.accIds||[]).includes(a.id)?C.accentL:C.muted, border:`1px solid ${(editGoal.accIds||[]).includes(a.id)?C.accent:C.border}`, cursor:"pointer" }}>
                  {a.icon||AT[a.type]||""} {a.name}
                </button>
              ))}
            </div>
          </Fld>
          {buckets.length > 0 && <Fld label="或指定子帳戶（願望、旅費等）">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {buckets.map(b => {
                const parentSelected = (editGoal.accIds||[]).includes(b.accId);
                return (
                  <button key={b.id} disabled={parentSelected} onClick={() => setEditGoal(p => ({ ...p, bucketIds:(p.bucketIds||[]).includes(b.id)?p.bucketIds.filter(x=>x!==b.id):[...(p.bucketIds||[]), b.id] }))}
                    style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:(editGoal.bucketIds||[]).includes(b.id)?`${C.teal}28`:C.card, color:parentSelected?C.muted:(editGoal.bucketIds||[]).includes(b.id)?C.teal:C.muted, border:`1px solid ${(editGoal.bucketIds||[]).includes(b.id)?C.teal:C.border}`, cursor:parentSelected?"not-allowed":"pointer", opacity:parentSelected?0.4:1 }}>
                    {b.emoji} {b.name}{parentSelected?"（母帳戶已選）":""}
                  </button>
                );
              })}
            </div>
          </Fld>}
          {stocks.length > 0 && (
            <Fld label="證券部分要不要算未實現損益">
              <div style={{ display:"flex", gap:8 }}>
                {[{v:null,l:"跟隨全域設定"},{v:true,l:"計入市值"},{v:false,l:"只算成本"}].map(o => (
                  <button key={String(o.v)} onClick={() => setEditGoal(p => ({ ...p, useMv:o.v }))} style={{ flex:1, padding:"7px 4px", borderRadius:10, fontSize:11, fontWeight:700, background:(editGoal.useMv??null)===o.v?`${C.accent}28`:C.card, color:(editGoal.useMv??null)===o.v?C.accentL:C.muted, border:`1px solid ${(editGoal.useMv??null)===o.v?C.accent:C.border}`, cursor:"pointer" }}>{o.l}</button>
                ))}
              </div>
            </Fld>
          )}
          {((editGoal.accIds||[]).length>0 || (editGoal.bucketIds||[]).length>0) && (
            <button onClick={() => setEditGoal(p => ({ ...p, includeDebts:!p.includeDebts }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:editGoal.includeDebts ? `${C.teal}22` : C.card, color:editGoal.includeDebts ? C.teal : C.textSub, border:`1px solid ${editGoal.includeDebts ? C.teal : C.border}`, cursor:"pointer", marginBottom:12 }}>
              <span>{editGoal.includeDebts ? "✅" : "⬜"}</span>
              <span style={{ textAlign:"left" }}>指定帳戶時，也把「負債＋往來帳」的應收應付算進這個目標</span>
            </button>
          )}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm("確定儲存這個目標的修改？", () => { upd("goals", p => p.map(x => x.id===editGoal.id ? editGoal : x)); close(); }, "確認編輯")}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          {showGoalEP && <EmojiPicker onSelect={e => { setEditGoal(p => ({ ...p, emoji:e })); setShowGoalEP(false); }} onClose={() => setShowGoalEP(false)} />}
        </Sheet>}

        {modal === "addPolicy" && <Sheet title="新增儲蓄保單" onClose={close}>
          <div style={{ padding:"8px 12px", borderRadius:10, background:`${C.accent}12`, border:`1px solid ${C.accent}33`, fontSize:12, color:C.accentL, marginBottom:12 }}>
            🛡️ <strong>怎麼用：</strong> 填入保單基本資料和目前解約金，每年收到保單對帳單後更新一次解約金，就能追蹤損益。
            <div style={{ marginTop:4, color:C.muted }}>醫療險、意外險等純保障型 → 放「基本開銷」設定每年自動記帳即可。</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:8 }}>
            <button onClick={() => setShowGoalEP(true)} style={{ width:48, height:48, borderRadius:12, background:C.card, border:`2px solid ${C.accent}`, fontSize:24, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{nPL.emoji || "🛡️"}</button>
            <div style={{ flex:1 }}><Inp label="保單名稱" placeholder="例：南山利率變動型年金" value={nPL.name} onChange={e => setNPL(p=>({...p,name:e.target.value}))} /></div>
          </div>
          <Inp label="保險公司" placeholder="例：南山人壽" value={nPL.insurer} onChange={e => setNPL(p=>({...p,insurer:e.target.value}))} />
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8 }}>
            <CalcInp label="目前解約金（現值，每年更新）" value={nPL.surrenderVal} onChange={v => setNPL(p=>({...p,surrenderVal:v}))} />
            <Fld label="幣別"><select value={nPL.cur||"TWD"} onChange={e=>setNPL(p=>({...p,cur:e.target.value}))} style={iSt}>{ALL_CURS.map(c=><option key={c} value={c}>{c}</option>)}</select></Fld>
          </div>
          <CalcInp label="已繳總保費（到目前為止，同幣別）" value={nPL.totalPaid||""} onChange={v => setNPL(p=>({...p,totalPaid:+v}))} />
          <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>💡 儲蓄險每年保費可能不同，請直接填截至今日的累計總額</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Fld label="起保日期"><input type="date" value={nPL.startDate} onChange={e=>setNPL(p=>({...p,startDate:e.target.value}))} style={iSt} /></Fld>
            <Fld label="到期日（選填）"><input type="date" value={nPL.maturityDate} onChange={e=>setNPL(p=>({...p,maturityDate:e.target.value}))} style={iSt} /></Fld>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addPolicy}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          {showGoalEP && <EmojiPicker onSelect={e=>{setNPL(p=>({...p,emoji:e}));setShowGoalEP(false);}} onClose={()=>setShowGoalEP(false)} />}
        </Sheet>}

        {modal === "editPolicy" && selPolicy && <Sheet title="更新保單" onClose={close}>
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:8 }}>
            <button onClick={() => setShowGoalEP(true)} style={{ width:48, height:48, borderRadius:12, background:C.card, border:`2px solid ${C.accent}`, fontSize:24, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{selPolicy.emoji||"🛡️"}</button>
            <div style={{ flex:1 }}><Inp label="保單名稱" value={selPolicy.name} onChange={e=>setSelPolicy(p=>({...p,name:e.target.value}))} /></div>
          </div>
          <Inp label="保險公司" value={selPolicy.insurer||""} onChange={e=>setSelPolicy(p=>({...p,insurer:e.target.value}))} />
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8 }}>
            <CalcInp label="目前解約金（現值）" value={String(selPolicy.surrenderVal||"")} onChange={v=>setSelPolicy(p=>({...p,surrenderVal:+v}))} />
            <Fld label="幣別"><select value={selPolicy.cur||"TWD"} onChange={e=>setSelPolicy(p=>({...p,cur:e.target.value}))} style={iSt}>{ALL_CURS.map(c=><option key={c} value={c}>{c}</option>)}</select></Fld>
          </div>
          <CalcInp label="已繳總保費（累計，同幣別）" value={String(selPolicy.totalPaid||"")} onChange={v=>setSelPolicy(p=>({...p,totalPaid:+v}))} />
          <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>💡 每年收到對帳單後更新解約金和已繳總額</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Fld label="起保日期"><input type="date" value={selPolicy.startDate||TODAY} onChange={e=>setSelPolicy(p=>({...p,startDate:e.target.value}))} style={iSt} /></Fld>
            <Fld label="到期日"><input type="date" value={selPolicy.maturityDate||""} onChange={e=>setSelPolicy(p=>({...p,maturityDate:e.target.value}))} style={iSt} /></Fld>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm("確定儲存這張保單的修改？", () => { upd("policies", p=>p.map(x=>x.id===selPolicy.id?selPolicy:x)); close(); }, "確認編輯")}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          {showGoalEP && <EmojiPicker onSelect={e=>{setSelPolicy(p=>({...p,emoji:e}));setShowGoalEP(false);}} onClose={()=>setShowGoalEP(false)} />}
        </Sheet>}

        {modal === "payPremium" && selPolicy && (() => {
          return <Sheet title={`繳保費 — ${selPolicy.name}`} onClose={close}>
            <div style={{ padding:12, borderRadius:12, background:C.card, marginBottom:12 }}>
              <div style={{ fontSize:13, color:C.textSub }}>幣別：<strong style={{ color:C.accentL }}>{selPolicy.cur||"TWD"}</strong> 已繳總額：<strong style={{ color:C.text }}>{selPolicy.cur&&selPolicy.cur!=="TWD"?`${selPolicy.cur} `:"NT$"}{(selPolicy.totalPaid||0).toLocaleString()}</strong></div>
            </div>
            <CalcInp label={`本次繳費金額（${selPolicy.cur||"TWD"}）`} value={premAmt} onChange={v => setPremAmt(v)} />
            <Sl label="從哪個帳戶扣款" value={premAcc} onChange={e => setPremAcc(e.target.value)}>
              <option value="">— 選擇帳戶 —</option>
              {accs.filter(a=>a.type!=="credit"&&a.type!=="investment").map(a=><option key={a.id} value={a.name}>{a.icon||AT[a.type]||""} {a.name} ({fmt(a.bal,a.cur)})</option>)}
            </Sl>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn style={{ flex:1 }} onClick={() => {
                if (!premAmt || +premAmt <= 0) return;
                const amt = +premAmt;
                upd("policies", p=>p.map(x=>x.id===selPolicy.id ? {...x, totalPaid:(x.totalPaid||0)+amt, lastPremium:amt} : x));
                if (premAcc) {
                  const acc = accs.find(a=>a.name===premAcc);
                  if (acc?.type==="credit") upd("accs", p=>p.map(a=>a.name===premAcc ? {...a, payable:(a.payable||0)+amt} : a));
                  else upd("accs", p=>p.map(a=>a.name===premAcc ? {...a, bal:a.bal-amt} : a));
                }
                upd("txns", p=>[...p, { id:Date.now(), type:"expense", cat:"保費", amt, desc:`${selPolicy.name} 保費`, acc:premAcc||"", date:TODAY, tags:"#保單" }]);
                setPremAmt(""); setPremAcc(""); close();
              }}>確認繳費</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}

        {modal === "surrenderPolicy" && selPolicy && (() => {
          const totalPaid = selPolicy.totalPaid || 0;
          const isForeign = selPolicy.cur && selPolicy.cur !== "TWD";
          const surrenderTWD = toTWD(+surrenderAmt||0, selPolicy.cur||"TWD", rates);
          const totalPaidTWD = toTWD(totalPaid, selPolicy.cur||"TWD", rates);
          const pnl = surrenderTWD - totalPaidTWD;
          return <Sheet title={`解約 — ${selPolicy.name}`} onClose={close}>
            <div style={{ padding:12, borderRadius:12, background:C.card, marginBottom:12 }}>
              <div style={{ fontSize:13, color:C.textSub }}>
                幣別：<strong style={{ color:C.accentL }}>{selPolicy.cur||"TWD"}</strong> 
                已繳總保費：<strong style={{ color:C.text }}>{isForeign?`${selPolicy.cur} `:""}{totalPaid.toLocaleString()}</strong>
                {isForeign && <span style={{ color:C.muted }}> ≈ {fmt(totalPaidTWD)}</span>}
              </div>
            </div>
            <CalcInp label={`實際領回金額（${selPolicy.cur||"TWD"}）`} value={surrenderAmt} onChange={v => setSurrenderAmt(v)} />
            {surrenderAmt && <div style={{ padding:"10px 12px", borderRadius:10, background:`${pnlColor(pnl,C)}15`, marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:900, color:pnlColor(pnl,C) }}>
                {pnl >= 0 ? "▲ 獲利" : "▼ 虧損"} {fmt(Math.abs(pnl))}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                領回 {isForeign?`${selPolicy.cur} `:""}{(+surrenderAmt).toLocaleString()}{isForeign?` ≈ ${fmt(surrenderTWD)}`:""} − 已繳 {fmt(totalPaidTWD)}
              </div>
            </div>}
            <Sl label="款項存入哪個帳戶" value={surrenderAcc} onChange={e => setSurrenderAcc(e.target.value)}>
              <option value="">— 選擇帳戶 —</option>
              {accs.filter(a=>a.type!=="credit"&&a.type!=="investment").map(a=><option key={a.id} value={a.name}>{a.icon||AT[a.type]||""} {a.name}</option>)}
            </Sl>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn style={{ flex:1 }} onClick={() => {
                const amt = +surrenderAmt;
                if (!amt) return;
                const now = Date.now();
                if (surrenderAcc) upd("accs", p=>p.map(a=>a.name===surrenderAcc ? {...a, bal:a.bal+surrenderTWD} : a));
                upd("txns", p=>[...p,
                  { id:now, type:"transfer", cat:"往來帳", amt:totalPaidTWD, desc:`${selPolicy.name} 解約 — 本金回收${isForeign?` (${selPolicy.cur})`:""}`, acc:"", toAcc:surrenderAcc||"", date:TODAY, tags:"#保單" },
                  ...(pnl !== 0 ? [{ id:now+1, type: pnl > 0 ? "income" : "expense", cat: pnl > 0 ? "投資收益" : "其他", amt: Math.abs(pnl), desc:`${selPolicy.name} 解約 — ${pnl>0?"獲利":"虧損"}${isForeign?` (${selPolicy.cur}換算)`:""}`, acc: surrenderAcc||"", date:TODAY, tags:"#保單" }] : []),
                ]);
                upd("policies", p=>p.filter(x=>x.id!==selPolicy.id));
                setSurrenderAmt(""); setSurrenderAcc(""); close();
              }}>確認解約</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}

        {modal === "catSet" && <Sheet title="類別管理" onClose={close}>
            {["expense","income"].map(type => <div key={type} style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10, color:type === "expense" ? C.expense : C.income }}>{type === "expense" ? "💸 支出類別" : "💰 收入類別"}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {cats[type].map(cat => (
                  <button key={cat}
                    onClick={() => setEditCat({ type, oldName:cat, name:cat, emoji:ceMap[cat]||"📦" })}
                    style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:10, fontSize:13, fontWeight:700,
                      background: editCat?.oldName===cat && editCat?.type===type ? `${C.accent}30` : `${C.accent}18`,
                      border:`1px solid ${editCat?.oldName===cat && editCat?.type===type ? C.accent : C.border}`, cursor:"pointer" }}>
                    <span>{ceMap[cat]||"📦"}</span>
                    <span style={{ color:C.text }}>{cat}</span>
                    <span style={{ color:C.muted, fontSize:11 }}>✏️</span>
                  </button>
                ))}
              </div>
              {editCat?.type === type && (
                <div style={{ padding:12, borderRadius:12, background:`${C.accent}12`, border:`1px solid ${C.accent}44`, marginBottom:10 }}>
                  <div style={{ fontSize:11, color:C.accentL, marginBottom:8, fontWeight:700 }}>編輯「{editCat.oldName}」</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                    <button onClick={() => setShowEditEP(true)}
                      style={{ width:44, height:44, borderRadius:12, background:C.card, border:`2px solid ${C.accent}`, fontSize:22, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {editCat.emoji}
                    </button>
                    <input value={editCat.name} onChange={e => setEditCat(p => ({ ...p, name:e.target.value }))}
                      style={{ ...iSt, flex:1 }} />
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => {
                      if (!editCat.name.trim()) return;
                      upd("cats", p => ({ ...p, [type]:p[type].map(c => c===editCat.oldName ? editCat.name.trim() : c) }));
                      addCustomCE(editCat.name.trim(), editCat.emoji);
                      if (editCat.name.trim() !== editCat.oldName) {
                        upd("customCE", p => { const n = {...(p||{})}; delete n[editCat.oldName]; n[editCat.name.trim()] = editCat.emoji; return n; });
                      }
                      setEditCat(null);
                    }} style={{ flex:1, padding:"8px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:700, cursor:"pointer" }}>儲存</button>
                    <button onClick={() => { upd("cats", p => ({ ...p, [type]:p[type].filter(c => c!==editCat.oldName) })); setEditCat(null); }}
                      style={{ padding:"8px 14px", borderRadius:10, background:`${C.danger}22`, color:C.danger, border:`1px solid ${C.danger}44`, cursor:"pointer", fontWeight:700 }}>刪除</button>
                    <button onClick={() => setEditCat(null)}
                      style={{ padding:"8px 12px", borderRadius:10, background:C.card, color:C.muted, border:`1px solid ${C.border}`, cursor:"pointer" }}>✕</button>
                  </div>
                  {showEditEP && <EmojiPicker onSelect={e => { setEditCat(p => ({ ...p, emoji:e })); setShowEditEP(false); }} onClose={() => setShowEditEP(false)} />}
                </div>
              )}
              <div style={{ padding:10, borderRadius:12, background:`${C.accent}10`, border:`1px solid ${C.accent}33` }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                  <button onClick={() => { setNewCatType(type); setShowCatEP(true); }}
                    style={{ width:40, height:40, borderRadius:10, background:C.card, border:`2px solid ${C.accent}`, fontSize:20, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {newCatType===type ? newCatEmoji : "📦"}
                  </button>
                  <input value={newCatType === type ? newCatName : ""}
                    onChange={e => { setNewCatType(type); setNewCatName(e.target.value); if (!emojiTouched) setNewCatEmoji(guessEmoji(e.target.value)); }}
                    placeholder={`新增${type === "expense" ? "支出" : "收入"}類別…`}
                    style={{ ...iSt, flex:1 }}
                    onKeyDown={e => { if (e.key === "Enter") { setNewCatType(type); addCat(); } }} />
                </div>
                <Btn sz="sm" style={{ width:"100%" }} onClick={() => { setNewCatType(type); addCat(); }}>＋ 新增</Btn>
              </div>
            </div>)}
            {showCatEP && <EmojiPicker onSelect={e => { setNewCatEmoji(e); setEmojiTouched(true); }} onClose={() => setShowCatEP(false)} />}
            <Btn v="secondary" style={{ width:"100%", marginTop:8 }} onClick={close}>關閉</Btn>
          </Sheet>}
    </>
  );
}
