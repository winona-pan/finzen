import { useState, useEffect } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WalletModals({ 
  C, modal, close, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec,
  cashBal, ceMap, CE, AT, PIE, ALL_CURS, theme,
  collapsed, toggleSection, nT, setNT, T0, descHistory, descHistoryByCat, tagsHistory,
  isSingleMo, chartRange, setChartRange, healthRange, setHealthRange, useMvForAssets, fetchAllPrices,
  buckets, addBucket, updateBucket, deleteBucket, moveBucket, transferBucket, doTransfer, growthBucket,
  selStock, setSelStock, sellF, setSellF, buyF, setBuyF, initF, setInitF,
  selPool, setSelPool, recAmt, setRecAmt, doRecognize, adjBal,
  selAcc, setSelAcc, newBal, setNewBal, adjDesc, setAdjDesc,
  nG, setNG, addGoal, editGoal, setEditGoal,
  selPolicy, setSelPolicy, nPL, setNPL, addPolicy,
  premAmt, setPremAmt, premAcc, setPremAcc,
  surrenderAmt, setSurrenderAmt, surrenderAcc, setSurrenderAcc,
  showGoalEP, setShowGoalEP, LEARN_DATA, MANUAL_DATA,
  nS, setNS, S0, selSub, setSelSub, saveSub, addSub,
  nB, setNB, B0, selBill, setSelBill, saveBill, addBill,
  nAcc, setNAcc, addAcc: addAccFn, payF, setPayF,
  showHDP, setShowHDP, doBuy, doSell, doInit,
  nD, setND, addDebt, editDebt, setEditDebt,
  settleDebt, setSettleDebt, settleAcc, setSettleAcc,
  settleCustomAmt, setSettleCustomAmt, selTxn, setSelTxn,
  saveTxn, delTxn, moExp, moInc, moTxns, addCustomCE, PL0,
  // 共用 UI atoms 與資料
  CUR_NAME, Sheet, Inp, Sl, Fld, CalcInp, CatPicker, Btn, EmojiPicker, TP, DatePicker, ConfirmDialog, Card, SwipeRow
}) {

  /* ── 局部狀態 ── */
  const [curSearch, setCurSearch] = useState("");
  const [localRates, setLocalRates] = useState(() => ({ ...rates }));
  const [showAccEP, setShowAccEP] = useState(false);
  const [showDP, setShowDP] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [editingBucketId, setEditingBucketId] = useState(null);
  const [bucketEPFor, setBucketEPFor] = useState(null);
  const [accDetailMonth, setAccDetailMonth] = useState(null);
  const [bkFrom, setBkFrom] = useState(null);
  const [bkTo, setBkTo] = useState(null);
  const [bkAmt, setBkAmt] = useState("");
  useEffect(() => { setAccDetailMonth(null); }, [selAcc?.id]);
  const closeConfirm = () => setConfirmDlg(null);

  /* ── 信用卡繳費處理 ── */
  const payCredit = () => {
    const a = +payF.amt; if (!a || !payF.creditId || !payF.fromId) return;
    const creditAcc = accs.find(x => x.id === payF.creditId);
    const fromAcc = accs.find(x => x.id === payF.fromId);
    upd("accs", p => p.map(ac => { 
      if (ac.id === payF.creditId) return { ...ac, payable: Math.max(0, (ac.payable || 0) - a) }; 
      if (ac.id === payF.fromId) return { ...ac, bal: ac.bal - a }; 
      return ac; 
    }));
    upd("txns", p => [...p, { 
      id: Date.now(), type: "transfer", cat: "帳戶調整", amt: a, 
      desc: payF.note || "信用卡繳費", 
      acc: fromAcc?.name || "", toAcc: creditAcc?.name || "", date: payF.date, tags: "#繳費" 
    }]);
    setPayF({ creditId: "", fromId: "", amt: "", date: TODAY, note: "" }); close();
  };

  return (
    <>
        {modal === "addAccType" && <Sheet title="新增項目" onClose={close}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"💰", label:"現金帳戶", sub:"錢包現金", cb:() => { setNAcc({...nAcc, type:"cash"}); setModal("addAcc"); } },
              { icon:"🏦", label:"金融卡帳戶", sub:"銀行存款、活存", cb:() => { setNAcc({...nAcc, type:"debit"}); setModal("addAcc"); } },
              { icon:"📊", label:"證券帳戶", sub:"股票投資帳戶", cb:() => { setNAcc({...nAcc, type:"investment"}); setModal("addAcc"); } },
              { icon:"💳", label:"信用卡", sub:"記錄應付帳款", cb:() => { setNAcc({...nAcc, type:"credit"}); setModal("addAcc"); } },
              { icon:"🛡️", label:"儲蓄保單", sub:"儲蓄險、投資型保單（追蹤解約金損益）", cb:() => { setNPL(PL0); setModal("addPolicy"); } },
            ].map((item, i) => (
              <button key={i} onClick={() => { close(); setTimeout(item.cb, 50); }}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left", width:"100%" }}>
                <div style={{ width:46, height:46, borderRadius:14, background:`${C.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{item.sub}</div>
                </div>
                <span style={{ marginLeft:"auto", color:C.muted, fontSize:16 }}>›</span>
              </button>
            ))}
          </div>
        </Sheet>}

        {modal === "addAcc" && <Sheet title="新增帳戶" onClose={close}>
          <Inp label="帳戶名稱" placeholder="玉山銀行" value={nAcc.name} onChange={e => setNAcc(p => ({ ...p, name:e.target.value }))} />
          <Sl label="帳戶類型" value={nAcc.type} onChange={e => setNAcc(p => ({ ...p, type:e.target.value }))}>
            <option value="cash">💰 現金</option>
            <option value="debit">🏦 金融卡</option>
            <option value="investment">📊 證券帳戶</option>
            <option value="credit">💳 信用卡</option>
          </Sl>
          <Fld label="幣別">
            <input placeholder="搜尋幣別（如 USD、EUR、日圓）" value={curSearch} onChange={e => setCurSearch(e.target.value)} style={{ ...iSt, marginBottom:6 }} />
            <select value={nAcc.cur} onChange={e => setNAcc(p => ({ ...p, cur:e.target.value }))} style={iSt}>
              {ALL_CURS.filter(c => !curSearch || c.toLowerCase().includes(curSearch.toLowerCase()) || (CUR_NAME[c] || "").includes(curSearch)).map(c => <option key={c} value={c}>{c} {CUR_NAME[c] || ""} (1{c}≈{toTWD(1, c, rates) >= 1 ? toTWD(1, c, rates).toFixed(2) : toTWD(1, c, rates).toFixed(4)} TWD)</option>)}
            </select>
          </Fld>
          {nAcc.type === "credit" && <Inp label="信用額度" type="number" value={nAcc.limit} onChange={e => setNAcc(p => ({ ...p, limit:e.target.value }))} />}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addAccFn}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "adjBal" && selAcc && (() => {
          const isFirst = selAcc.bal === 0 && !txns.some(t => t.acc === selAcc.name);
          const moAdj = moTxns.filter(t => t.cat === "帳戶調整" && t.acc === selAcc.name);
          const moAdjTotal = moAdj.reduce((s, t) => s + (t.adjDiff || 0), 0);
          return <Sheet title={`編輯帳戶 — ${selAcc.name}`} onClose={close}>
            <Fld label="圖示（點擊更換）">
              <button onClick={() => setShowAccEP(true)} style={{ width:56, height:56, borderRadius:16, background:C.card, border:`2px solid ${C.accent}`, fontSize:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {selAcc.icon || AT[selAcc.type] || "💳"}
              </button>
            </Fld>
            <Inp label="帳戶名稱" value={selAcc.name} onChange={e => setSelAcc(p => ({ ...p, name:e.target.value }))} />
            <Fld label="帳戶類型"><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[{ v:"cash", l:"💰 現金" }, { v:"debit", l:"🏦 金融卡" }, { v:"investment", l:"📊 證券" }, { v:"credit", l:"💳 信用卡" }].map(o => <button key={o.v} onClick={() => setSelAcc(p => ({ ...p, type:o.v }))} style={{ flex:1, padding:"7px 4px", borderRadius:10, fontSize:11, fontWeight:700, background:selAcc.type === o.v ? `${C.accent}30` : C.card, color:selAcc.type === o.v ? C.accentL : C.muted, border:`1px solid ${selAcc.type === o.v ? C.accent : C.border}`, cursor:"pointer", minWidth:60 }}>{o.l}</button>)}
            </div></Fld>
            <div style={{ borderRadius:14, padding:16, marginBottom:12, background:C.surface }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>目前餘額</div><div style={{ fontWeight:900, fontSize:24, color:C.accentL }}>{fmt(selAcc.bal, selAcc.cur)}</div></div>
                {moAdjTotal !== 0 && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>本月已調整</div><div style={{ fontWeight:700, fontSize:15, color:moAdjTotal > 0 ? C.income : C.expense }}>{moAdjTotal > 0 ? "+" : ""}{fmt(moAdjTotal, selAcc.cur)}</div></div>}
              </div>
            </div>
            <Inp label="輸入新餘額" type="number" value={newBal} onChange={e => setNewBal(e.target.value)} placeholder={String(selAcc.bal)} />
            {newBal && +newBal !== selAcc.bal && <Inp label="調整說明（選填）" placeholder="例：現金盤點差異" value={adjDesc} onChange={e => setAdjDesc(e.target.value)} />}
            {newBal && +newBal !== selAcc.bal && <div style={{ marginBottom:12, padding:12, borderRadius:10, fontSize:14, fontWeight:700, background:C.card, border:`1px solid ${C.borderL}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ color:C.textSub }}>調整金額</span><span style={{ color:+newBal > selAcc.bal ? C.income : C.expense, fontWeight:900 }}>{+newBal > selAcc.bal ? "+" : ""}{fmt(+newBal - selAcc.bal, selAcc.cur)}</span></div>
              <div style={{ fontSize:12, color:isFirst ? C.teal : C.muted }}>{isFirst ? "✅ 初次設定，不計入收支" : "📝 調整記錄只用於對帳，不計入收支"}</div>
            </div>}
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <Btn style={{ flex:1 }} onClick={() => {
                upd("accs", p => p.map(a => a.id === selAcc.id ? { ...a, name:selAcc.name, type:selAcc.type, icon:selAcc.icon } : a));
                if (newBal && +newBal !== selAcc.bal) adjBal(selAcc, newBal, isFirst, adjDesc);
                setNewBal(""); setAdjDesc(""); close();
              }}>{isFirst && newBal && +newBal !== selAcc.bal ? "設為初始金額" : "儲存"}</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
            <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selAcc.name}」？`, () => { upd("accs", p => p.filter(a => a.id !== selAcc.id)); upd("buckets", p => (p||[]).filter(b => b.accId !== selAcc.id)); close(); })}>🗑 刪除此帳戶</Btn>
            {showAccEP && <EmojiPicker onSelect={e => { setSelAcc(p => ({ ...p, icon:e })); setShowAccEP(false); }} onClose={() => setShowAccEP(false)} />}
          </Sheet>;
        })()}

        {modal === "editCredit" && selAcc && <Sheet title={`編輯信用卡 — ${selAcc.name}`} onClose={close}>
          <Inp label="卡片名稱" value={selAcc.name} onChange={e => setSelAcc(p => ({ ...p, name:e.target.value }))} />
          <Inp label="信用額度" type="number" value={selAcc.limit || ""} onChange={e => setSelAcc(p => ({ ...p, limit:+e.target.value }))} />
          <Inp label="目前應付金額" type="number" value={selAcc.payable != null ? String(selAcc.payable) : "0"} onChange={e => setSelAcc(p => ({ ...p, payable:+e.target.value }))} />
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm("確定儲存這張信用卡的修改？", () => { upd("accs", p => p.map(a => a.id === selAcc.id ? { ...a, name:selAcc.name, limit:selAcc.limit, payable:selAcc.payable } : a)); close(); }, "確認編輯")}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selAcc.name}」？`, () => { upd("accs", p => p.filter(a => a.id !== selAcc.id)); upd("buckets", p => (p||[]).filter(b => b.accId !== selAcc.id)); close(); })}>🗑 刪除此信用卡</Btn>
        </Sheet>}

        {modal === "payCred" && <Sheet title="信用卡繳費 / Pay" onClose={close}>
          <Fld label="Date（日期）"><input type="date" value={payF.date} onChange={e => setPayF(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          <Sl label="信用卡 (To)" value={payF.creditId} onChange={e => { const c = accs.find(a => a.id === e.target.value); setPayF(p => ({ ...p, creditId:e.target.value, amt:String(c?.payable || 0) })); }}><option value="">— 選擇 —</option>{accs.filter(a => a.type === "credit").map(c => <option key={c.id} value={c.id}>{c.name}（應付 {fmt(c.payable)}）</option>)}</Sl>
          <Sl label="From（扣款帳戶）" value={payF.fromId} onChange={e => setPayF(p => ({ ...p, fromId:e.target.value }))}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.id}>{AT[a.type] || ""} {a.name} ({fmt(a.bal, a.cur)})</option>)}</Sl>
          <CalcInp label="Amount（金額）" value={payF.amt} onChange={v => setPayF(p => ({ ...p, amt:v }))} />
          <Inp label="Note（備註）" placeholder="4月卡費" value={payF.note} onChange={e => setPayF(p => ({ ...p, note:e.target.value }))} />
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button onClick={payCredit} style={{ flex:1, padding:13, borderRadius:12, background:"#fff", color:"#000", border:"none", fontWeight:900, fontSize:15, cursor:"pointer" }}>Save</button>
            <button onClick={close} style={{ padding:"13px 20px", borderRadius:12, background:C.card, color:C.text, border:`1px solid ${C.border}`, fontWeight:700, fontSize:14, cursor:"pointer" }}>取消</button>
          </div>
        </Sheet>}

        {modal === "accDetail" && selAcc && (() => {
          const allAccTxns = txns
            .filter(t => t.acc === selAcc.name || t.toAcc === selAcc.name)
            .sort((a,b) => b.date.localeCompare(a.date));
          const monthsAvail = [...new Set(allAccTxns.map(t => t.date.slice(0,7)))].sort().reverse();
          const curYm = accDetailMonth || monthsAvail[0] || TODAY.slice(0,7);
          const accTxns = allAccTxns.filter(t => t.date.slice(0,7) === curYm);
          const curIdx = monthsAvail.indexOf(curYm);
          const isCredit = selAcc.type === "credit";
          return <Sheet title={`${selAcc.icon||AT[selAcc.type]||""} ${selAcc.name}`} onClose={close}>
            <Card style={{ padding:16, marginBottom:16, background:`linear-gradient(135deg,${C.surface},${C.bg})` }}>
              <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>{isCredit ? "應付金額" : "目前餘額"}</div>
              <div style={{ fontWeight:900, fontSize:28, color:C.accentL }}>{isCredit ? fmt(selAcc.payable||0) : fmt(selAcc.bal, selAcc.cur)}</div>
              {selAcc.cur !== "TWD" && !isCredit && <div style={{ fontSize:13, color:C.muted }}>≈ {fmt(toTWD(selAcc.bal, selAcc.cur, rates))} TWD</div>}
              {isCredit && <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>信用額度 {fmt(selAcc.limit||0)} · 使用 {selAcc.limit>0?((selAcc.payable||0)/selAcc.limit*100).toFixed(0):0}%</div>}
            </Card>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <Btn style={{ flex:1 }} onClick={() => { const target = isCredit ? "editCredit" : "adjBal"; close(); setTimeout(() => setModal(target), 50); }}>✏️ 編輯帳戶</Btn>
              {isCredit && <Btn v="teal" style={{ flex:1 }} onClick={() => { setPayF({ creditId:selAcc.id, fromId:"", amt:String(selAcc.payable||0), date:TODAY, note:"" }); close(); setTimeout(() => setModal("payCred"), 50); }}>💳 繳費</Btn>}
            </div>

            {selAcc.type === "debit" && (() => {
              const myBuckets = buckets.filter(b => b.accId === selAcc.id);
              const allocated = myBuckets.reduce((s,b)=>s+b.allocated, 0);
              const unassigned = selAcc.bal - allocated;
              return <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted, marginBottom:8 }}>子帳戶（願望、旅費、存錢等分類）</div>
                {myBuckets.map(b => (
                  <div key={b.id}>
                  {editingBucketId === b.id ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px", borderBottom:`1px solid ${C.border}` }}>
                      <button onClick={() => setBucketEPFor(b.id)} style={{ width:32, height:32, borderRadius:9, background:`${C.border}88`, border:"none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, cursor:"pointer" }}>{b.emoji}</button>
                      <input autoFocus value={b.name} onChange={e => updateBucket(b.id, { name:e.target.value })} style={{ ...iSt, flex:1, padding:"4px 8px" }} />
                      <input type="number" value={b.allocated} onChange={e => updateBucket(b.id, { allocated:+e.target.value||0 })} style={{ ...iSt, width:90, textAlign:"right", padding:"6px 8px" }} />
                      <button onClick={() => setEditingBucketId(null)} style={{ padding:"6px 10px", borderRadius:8, background:C.accent, color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0 }}>完成</button>
                    </div>
                  ) : (
                    <SwipeRow onDelete={() => confirm(`刪除子帳戶「${b.name}」？`, () => deleteBucket(b.id))} onClick={() => setEditingBucketId(b.id)}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px", borderBottom:`1px solid ${C.border}`, opacity:b.vis===false?0.5:1, cursor:"pointer" }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:`${C.border}88`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{b.emoji}</div>
                        <div style={{ flex:1, fontWeight:700, fontSize:13, color:C.text }}>{b.name}{b.vis===false && <span style={{ fontSize:10, fontWeight:400, color:C.muted, marginLeft:6 }}>不計入資產</span>}</div>
                        <span style={{ fontSize:13, fontWeight:700, color:C.text, minWidth:70, textAlign:"right" }}>{fmt(b.allocated)}</span>
                      </div>
                    </SwipeRow>
                  )}
                  </div>
                ))}
                <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>💡 要隱藏子帳戶（不計入總資產）？到錢包頁點「顯示/隱藏」統一管理</div>
                {bucketEPFor && <EmojiPicker onSelect={e => { updateBucket(bucketEPFor, { emoji:e }); setBucketEPFor(null); }} onClose={() => setBucketEPFor(null)} />}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 4px", fontSize:12, color:unassigned<0?C.expense:C.muted, fontWeight:700 }}>
                  <span>未分配</span><span>{fmt(unassigned)}</span>
                </div>
                {unassigned < 0 && <div style={{ fontSize:11, color:C.expense, marginBottom:8 }}>⚠️ 子帳戶總額超過實際餘額了</div>}
                <BucketAdder accId={selAcc.id} addBucket={addBucket} C={C} iSt={iSt} EmojiPicker={EmojiPicker} />
              </div>;
            })()}

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted }}>交易紀錄</div>
              {monthsAvail.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <button onClick={() => setAccDetailMonth(monthsAvail[curIdx+1])} disabled={curIdx>=monthsAvail.length-1} style={{ background:"none", border:"none", cursor:curIdx>=monthsAvail.length-1?"default":"pointer", color:curIdx>=monthsAvail.length-1?C.muted:C.textSub, fontSize:18, opacity:curIdx>=monthsAvail.length-1?0.3:1 }}>‹</button>
                  <span style={{ fontSize:13, fontWeight:700, color:C.text, minWidth:56, textAlign:"center" }}>{curYm.slice(0,4)}/{curYm.slice(5,7)}</span>
                  <button onClick={() => setAccDetailMonth(monthsAvail[curIdx-1])} disabled={curIdx<=0} style={{ background:"none", border:"none", cursor:curIdx<=0?"default":"pointer", color:curIdx<=0?C.muted:C.textSub, fontSize:18, opacity:curIdx<=0?0.3:1 }}>›</button>
                </div>
              )}
            </div>
            {accTxns.length === 0 && <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>這個月沒有交易記錄</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
              {accTxns.map((t, i) => {
                const isFrom = t.acc === selAcc.name;
                const sign = t.type === "income" ? "+" : t.type === "transfer" ? (isFrom ? "↔出" : "↔入") : t.type === "adjust" ? (t.adjDiff > 0 ? "+" : "-") : "-";
                const col = t.type === "income" ? C.income : t.type === "transfer" ? C.accentL : t.type === "adjust" ? (t.adjDiff > 0 ? C.income : C.expense) : C.expense;
                return <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${C.border}88`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{ceMap[t.cat]||"📦"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{t.cat}</div>
                    <div style={{ fontSize:11, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.date} {t.desc||""}</div>
                  </div>
                  <div style={{ fontWeight:900, fontSize:13, color:col, flexShrink:0 }}>{sign}{fmt(t.amt)}</div>
                </div>;
              })}
            </div>
          </Sheet>;
        })()}

        {modal === "rateSettings" && (() => {
          const usedCurs = [...new Set(accs.map(a => a.cur).filter(c => c !== "TWD"))];
          return <Sheet title="💱 匯率設定（對 TWD）" onClose={close}>
            <div style={{ fontSize:12, color:C.textSub, marginBottom:12 }}>調整後點儲存，所有外幣換算立即更新。</div>
            {usedCurs.length === 0 && <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>目前沒有外幣帳戶</div>}
            {ALL_CURS.filter(c => c !== "TWD" && usedCurs.includes(c)).map(c => <div key={c} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:48, fontWeight:700, fontSize:14, color:C.text }}>{c}</div>
              <div style={{ fontSize:12, color:C.textSub, flex:1 }}>{CUR_NAME[c] || ""}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12, color:C.muted }}>1{c}=</span>
                <input type="number" value={localRates[c] || ""} onChange={e => setLocalRates(p => ({ ...p, [c]:+e.target.value }))} style={{ ...iSt, width:90, padding:"6px 10px", fontSize:13 }} />
                <span style={{ fontSize:12, color:C.muted }}>TWD</span>
              </div>
            </div>)}
            <div style={{ marginTop:12, display:"flex", gap:8 }}>
              <Btn style={{ flex:1 }} onClick={() => { upd("rates", () => localRates); close(); }}>儲存匯率</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}

        {showDP && <DatePicker value={chartRange} onChange={setChartRange} onClose={() => setShowDP(false)} />}
        {showHDP && <DatePicker value={healthRange} onChange={setHealthRange} onClose={() => setShowHDP(false)} />}

        {confirmDlg && <ConfirmDialog msg={confirmDlg.msg} onOk={() => { confirmDlg.onOk(); closeConfirm(); }} onCancel={closeConfirm} />}

        {modal === "addSub" && <Sheet title="新增訂閱" onClose={close}>
          <Inp label="名稱" placeholder="Netflix" value={nS.name} onChange={e => setNS(p => ({ ...p, name:e.target.value }))} />
          <CalcInp label="金額" value={nS.amt} onChange={v => setNS(p => ({ ...p, amt:v }))} />
          <Sl label="扣款帳戶" value={nS.acc} onChange={e => setNS(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label="扣款頻率">
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"month",l:"每月"},{v:"week",l:"每週"},{v:"year",l:"每年"}].map(o => (
                <button key={o.v} onClick={() => setNS(p=>({...p,freq:o.v}))}
                  style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer",
                    background:nS.freq===o.v?`${C.accent}28`:C.card, color:nS.freq===o.v?C.accentL:C.muted,
                    border:`1px solid ${nS.freq===o.v?C.accent:C.border}` }}>{o.l}</button>
              ))}
            </div>
          </Fld>
          {nS.freq==="week"
            ? <Fld label="星期幾">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                  {["日","一","二","三","四","五","六"].map((d,i) => (
                    <button key={i} onClick={() => setNS(p=>({...p,weekday:String(i)}))}
                      style={{ padding:"8px 0", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer",
                        background:+nS.weekday===i?`${C.accent}28`:C.card, color:+nS.weekday===i?C.accentL:C.muted,
                        border:`1px solid ${+nS.weekday===i?C.accent:C.border}` }}>{d}</button>
                  ))}
                </div>
              </Fld>
            : nS.freq==="year"
            ? <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <Fld label="月份"><select value={nS.yearMonth||"1"} onChange={e => setNS(p=>({...p,yearMonth:e.target.value}))} style={iSt}>
                  {["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"].map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
                </select></Fld>
                <Inp label="日期（幾號）" type="number" min="1" max="31" value={nS.day} onChange={e => setNS(p=>({...p,day:e.target.value}))} />
              </div>
            : <Inp label="扣款日（幾號）" type="number" min="1" max="31" value={nS.day} onChange={e => setNS(p => ({ ...p, day:e.target.value }))} />}

          {nS.freq === "year" && (
            <button onClick={() => setNS(p => ({ ...p, deferExpense:!p.deferExpense }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:nS.deferExpense ? `${C.teal}22` : C.card, color:nS.deferExpense ? C.teal : C.textSub, border:`1px solid ${nS.deferExpense ? C.teal : C.border}`, cursor:"pointer", marginBottom:12 }}>
              <span>{nS.deferExpense ? "✅" : "⬜"}</span>
              <span style={{ textAlign:"left" }}>年繳分攤認列（扣款當下不算整筆支出，改成 {nS.amt ? Math.round(+nS.amt/12) : "每月"} 分 12 個月慢慢認列）</span>
            </button>
          )}

          <CatPicker value={nS.cat} onChange={v => setNS(p => ({ ...p, cat:v }))} cats={cats.expense} ce={ceMap} onAddCat={(v,e) => { upd("cats", p => ({...p, expense:[...p.expense, v]})); addCustomCE(v,e); }} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addSub}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "editSub" && selSub && <Sheet title="編輯訂閱" onClose={close}>
          <Inp label="名稱" value={selSub.name} onChange={e => setSelSub(p => ({ ...p, name:e.target.value }))} />
          <CalcInp label="金額" value={String(selSub.amt)} onChange={v => setSelSub(p => ({ ...p, amt:+v }))} />
          <Sl label="扣款帳戶" value={selSub.acc} onChange={e => setSelSub(p => ({ ...p, acc:e.target.value }))}>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label="扣款頻率">
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"month",l:"每月"},{v:"week",l:"每週"},{v:"year",l:"每年"}].map(o => (
                <button key={o.v} onClick={() => setSelSub(p=>({...p,freq:o.v}))}
                  style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer",
                    background:selSub.freq===o.v?`${C.accent}28`:C.card, color:selSub.freq===o.v?C.accentL:C.muted,
                    border:`1px solid ${selSub.freq===o.v?C.accent:C.border}` }}>{o.l}</button>
              ))}
            </div>
          </Fld>
          {selSub.freq==="week"
            ? <Fld label="星期幾">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                  {["日","一","二","三","四","五","六"].map((d,i) => (
                    <button key={i} onClick={() => setSelSub(p=>({...p,weekday:String(i)}))}
                      style={{ padding:"8px 0", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer",
                        background:+selSub.weekday===i?`${C.accent}28`:C.card, color:+selSub.weekday===i?C.accentL:C.muted,
                        border:`1px solid ${+selSub.weekday===i?C.accent:C.border}` }}>{d}</button>
                  ))}
                </div>
              </Fld>
            : selSub.freq==="year"
            ? <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <Fld label="月份"><select value={selSub.yearMonth||"1"} onChange={e => setSelSub(p=>({...p,yearMonth:e.target.value}))} style={iSt}>
                  {["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"].map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
                </select></Fld>
                <Inp label="日期（幾號）" type="number" min="1" max="31" value={selSub.day} onChange={e => setSelSub(p=>({...p,day:+e.target.value}))} />
              </div>
            : <Inp label="扣款日（幾號）" type="number" min="1" max="31" value={selSub.day} onChange={e => setSelSub(p => ({ ...p, day:+e.target.value }))} />}

          {selSub.freq === "year" && (
            <button onClick={() => setSelSub(p => ({ ...p, deferExpense:!p.deferExpense }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:selSub.deferExpense ? `${C.teal}22` : C.card, color:selSub.deferExpense ? C.teal : C.textSub, border:`1px solid ${selSub.deferExpense ? C.teal : C.border}`, cursor:"pointer", marginBottom:12 }}>
              <span>{selSub.deferExpense ? "✅" : "⬜"}</span>
              <span style={{ textAlign:"left" }}>年繳分攤認列（下次扣款起分 12 個月慢慢認列）</span>
            </button>
          )}

          <CatPicker value={selSub.cat} onChange={v => setSelSub(p => ({ ...p, cat:v }))} cats={cats.expense} ce={ceMap} onAddCat={(v,e) => { upd("cats", p => ({...p, expense:[...p.expense, v]})); addCustomCE(v,e); }} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm("確定儲存這個訂閱的修改？", () => saveSub(selSub), "確認編輯")}>儲存</Btn>
            <Btn v="danger" style={{ flex:1 }} onClick={() => confirm(`確定刪除訂閱「${selSub.name}」？`, () => { upd("subs", p => p.filter(x => x.id !== selSub.id)); close(); })}>刪除</Btn>
          </div>
        </Sheet>}

        {modal === "addBill" && <Sheet title="新增基本開銷" onClose={close}>
          <div style={{ padding:"8px 12px", borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, fontSize:12, color:C.warn, marginBottom:12 }}>🏠 預設停用，需要時再點開啟</div>
          <Inp label="名稱" placeholder="電費、水費、房租…" value={nB.name} onChange={e => setNB(p => ({ ...p, name:e.target.value }))} />
          <CalcInp label="金額" value={nB.amt} onChange={v => setNB(p => ({ ...p, amt:v }))} />
          <Sl label="扣款帳戶" value={nB.acc} onChange={e => setNB(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label="扣款頻率">
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"month",l:"每月"},{v:"week",l:"每週"},{v:"year",l:"每年"}].map(o => (
                <button key={o.v} onClick={() => setNB(p=>({...p,freq:o.v}))}
                  style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer",
                    background:nB.freq===o.v?`${C.accent}28`:C.card, color:nB.freq===o.v?C.accentL:C.muted,
                    border:`1px solid ${nB.freq===o.v?C.accent:C.border}` }}>{o.l}</button>
              ))}
            </div>
          </Fld>
          {nB.freq==="week"
            ? <Fld label="星期幾">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                  {["日","一","二","三","四","五","六"].map((d,i) => (
                    <button key={i} onClick={() => setNB(p=>({...p,weekday:String(i)}))}
                      style={{ padding:"8px 0", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer",
                        background:+nB.weekday===i?`${C.accent}28`:C.card, color:+nB.weekday===i?C.accentL:C.muted,
                        border:`1px solid ${+nB.weekday===i?C.accent:C.border}` }}>{d}</button>
                  ))}
                </div>
              </Fld>
            : nB.freq==="year"
            ? <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <Fld label="月份"><select value={nB.yearMonth||"1"} onChange={e => setNB(p=>({...p,yearMonth:e.target.value}))} style={iSt}>
                  {["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"].map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
                </select></Fld>
                <Inp label="日期（幾號）" type="number" min="1" max="31" value={nB.day} onChange={e => setNB(p=>({...p,day:e.target.value}))} />
              </div>
            : <Inp label="扣款日（幾號）" type="number" min="1" max="31" value={nB.day} onChange={e => setNB(p => ({ ...p, day:e.target.value }))} />}
          <CatPicker value={nB.cat} onChange={v => setNB(p => ({ ...p, cat:v }))} cats={cats.expense} ce={ceMap} onAddCat={(v,e) => { upd("cats", p => ({...p, expense:[...p.expense, v]})); addCustomCE(v,e); }} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addBill}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "editBill" && selBill && <Sheet title="編輯基本開銷" onClose={close}>
          <Inp label="名稱" value={selBill.name} onChange={e => setSelBill(p => ({ ...p, name:e.target.value }))} />
          <CalcInp label="金額" value={String(selBill.amt)} onChange={v => setSelBill(p => ({ ...p, amt:+v }))} />
          <Sl label="扣款帳戶" value={selBill.acc} onChange={e => setSelBill(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label="扣款頻率">
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"month",l:"每月"},{v:"week",l:"每週"},{v:"year",l:"每年"}].map(o => (
                <button key={o.v} onClick={() => setSelBill(p=>({...p,freq:o.v}))}
                  style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer",
                    background:selBill.freq===o.v?`${C.accent}28`:C.card, color:selBill.freq===o.v?C.accentL:C.muted,
                    border:`1px solid ${selBill.freq===o.v?C.accent:C.border}` }}>{o.l}</button>
              ))}
            </div>
          </Fld>
          {selBill.freq==="week"
            ? <Fld label="星期幾">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                  {["日","一","二","三","四","五","六"].map((d,i) => (
                    <button key={i} onClick={() => setSelBill(p=>({...p,weekday:String(i)}))}
                      style={{ padding:"8px 0", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer",
                        background:+selBill.weekday===i?`${C.accent}28`:C.card, color:+selBill.weekday===i?C.accentL:C.muted,
                        border:`1px solid ${+selBill.weekday===i?C.accent:C.border}` }}>{d}</button>
                  ))}
                </div>
              </Fld>
            : selBill.freq==="year"
            ? <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <Fld label="月份"><select value={selBill.yearMonth||"1"} onChange={e => setSelBill(p=>({...p,yearMonth:e.target.value}))} style={iSt}>
                  {["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"].map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
                </select></Fld>
                <Inp label="日期（幾號）" type="number" min="1" max="31" value={selBill.day} onChange={e => setSelBill(p=>({...p,day:e.target.value}))} />
              </div>
            : <Inp label="扣款日（幾號）" type="number" min="1" max="31" value={selBill.day} onChange={e => setSelBill(p => ({ ...p, day:e.target.value }))} />}
          <CatPicker value={selBill.cat} onChange={v => setSelBill(p => ({ ...p, cat:v }))} cats={cats.expense} ce={ceMap} onAddCat={(v,e) => { upd("cats", p => ({...p, expense:[...p.expense, v]})); addCustomCE(v,e); }} />
          <div style={{ display:"flex", gap:8, marginTop:8, marginBottom:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm("確定儲存這筆開銷的修改？", saveBill, "確認編輯")}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selBill.name}」？`, () => { upd("bills", p => p.filter(x => x.id !== selBill.id)); close(); })}>🗑 刪除</Btn>
        </Sheet>}

        {modal === "bucketTransfer" && (() => {
          const options = [
            ...accs.filter(a => a.type !== "credit").map(a => ({ key:`acc:${a.id}`, label:`${a.icon||AT[a.type]||"💰"} ${a.name}`, amount:a.bal })),
            ...buckets.map(b => { const acc = accs.find(a=>a.id===b.accId); return { key:`bucket:${b.id}`, label:`${b.emoji} ${acc?.name||""}・${b.name}`, amount:b.allocated }; }),
          ];
          const from = options.find(o => o.key === bkFrom) || options[0];
          const to = options.find(o => o.key === bkTo);
          return <Sheet title="轉帳" onClose={close}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              帳戶跟子帳戶都可以直接互轉，不用分開操作。同一個帳戶底下的子帳戶互轉只是重新分類，不同帳戶之間才會真的搬動現金。
            </div>
            <Sl label="從" value={bkFrom || (options[0]?.key||"")} onChange={e => setBkFrom(e.target.value)}>
              {options.map(o => <option key={o.key} value={o.key}>{o.label}（{fmt(o.amount)}）</option>)}
            </Sl>
            <Sl label="到" value={bkTo || ""} onChange={e => setBkTo(e.target.value)}>
              <option value="">— 選擇 —</option>
              {options.filter(o => o.key !== (bkFrom||options[0]?.key)).map(o => <option key={o.key} value={o.key}>{o.label}（{fmt(o.amount)}）</option>)}
            </Sl>
            <CalcInp label="金額" value={bkAmt} onChange={setBkAmt} />
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn style={{ flex:1 }} onClick={() => {
                const f = options.find(o=>o.key===(bkFrom||options[0]?.key)), t = options.find(o=>o.key===bkTo);
                if (!f || !t || !bkAmt || +bkAmt<=0) return;
                confirm(`確定從「${f.label}」轉 ${fmt(+bkAmt)} 到「${t.label}」？`, () => {
                  doTransfer(f.key, t.key, bkAmt);
                  setBkFrom(null); setBkTo(null); setBkAmt(""); close();
                }, "確認轉帳");
              }}>確認</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}
        {modal === "bucketGrowth" && (() => {
          const b = buckets.find(x => x.id === growthBucket);
          if (!b) return null;
          const hist = [...(b.history||[])].sort((a,bb) => a.date.localeCompare(bb.date));
          const data = [];
          if (hist.length) {
            const start = new Date(hist[0].date), end = new Date(TODAY);
            let hi = 0, curVal = hist[0].allocated;
            for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate()+1)) {
              const dateStr = cur.toISOString().slice(0,10);
              while (hi < hist.length && hist[hi].date <= dateStr) { curVal = hist[hi].allocated; hi++; }
              data.push({ m: `${cur.getMonth()+1}/${cur.getDate()}`, v: curVal });
            }
          }
          const months = hist.map(h => h.date);
          const first = data[0]?.v || 0, last = data[data.length-1]?.v || 0;
          const chg = last - first;
          return <Sheet title={`${b.emoji} ${b.name} 成長趨勢`} onClose={close}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.textSub }}>目前金額</div>
              <div style={{ fontWeight:900, fontSize:24, color:C.accentL }}>{fmt(b.allocated)}</div>
              {data.length > 1 && <div style={{ fontSize:12, color:chg>=0?C.income:C.expense, marginTop:2 }}>{chg>=0?"+":""}{fmt(chg)}（從 {months[0]} 至今）</div>}
            </div>
            {data.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top:5, right:5, bottom:14, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.ceil(data.length / 6) - 1)} />
                  <YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/10000).toFixed(1)}萬`} />
                  <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v=>[fmt(v),"金額"]} />
                  <Line type="monotone" dataKey="v" stroke={C.accent} strokeWidth={2.5} dot={{ r:3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ padding:"30px 0", textAlign:"center", color:C.muted, fontSize:13 }}>還沒有足夠的歷史紀錄，之後每次改金額都會累積軌跡</div>}
          </Sheet>;
        })()}
    </>
  );
}

/* ── 子帳戶新增小表單 ── */
function BucketAdder({ accId, addBucket, C, iSt, EmojiPicker }) {
  const [name, setName] = useState("");
  const [amt, setAmt] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [showEP, setShowEP] = useState(false);
  const add = () => {
    if (!name.trim()) return;
    addBucket(accId, name.trim(), emoji, amt);
    setName(""); setAmt(""); setEmoji("🎯");
  };
  return (
    <div style={{ display:"flex", gap:6, marginTop:8 }}>
      <button onClick={() => setShowEP(true)} style={{ width:38, height:38, borderRadius:10, background:C.card, border:`1px solid ${C.border}`, fontSize:18, cursor:"pointer", flexShrink:0 }}>{emoji}</button>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="子帳戶名稱，如：旅費" style={{ ...iSt, flex:1 }} />
      <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="金額" style={{ ...iSt, width:80 }} />
      <button onClick={add} style={{ padding:"0 12px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:700, cursor:"pointer" }}>加入</button>
      {showEP && <EmojiPicker onSelect={e => { setEmoji(e); setShowEP(false); }} onClose={() => setShowEP(false)} />}
    </div>
  );
}
