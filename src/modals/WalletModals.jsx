import { useState } from "react";

export default function WalletModals({ 
  C, modal, close, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec,
  cashBal, ceMap, CE, AT, PIE, ALL_CURS, theme,
  collapsed, toggleSection, nT, setNT, T0, descHistory, descHistoryByCat, tagsHistory,
  isSingleMo, chartRange, healthRange, setHealthRange, useMvForAssets, fetchAllPrices,
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
  saveTxn, delTxn, moExp, moInc, moTxns, addCustomCE,
  // 補上對應大腦缺漏的對講機通道
  CUR_NAME, Sheet, Inp, Sl, Fld, CalcInp, CatPicker, Btn, EmojiPicker, TP, DatePicker, ConfirmDialog
}) {

  /* ── 補上 Claude 拆分檔案時嚴重漏掉的局部狀態 (Local States) ── */
  const [curSearch, setCurSearch] = useState("");
  const [localRates, setLocalRates] = useState(() => ({ ...rates }));
  const [trFrom, setTrFrom] = useState("");
  const [trTo, setTrTo] = useState("");
  const [trAmt, setTrAmt] = useState("");
  const [showAccEP, setShowAccEP] = useState(false);
  const [showDP, setShowDP] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null);

  /* ── 補上內部的轉帳處理函數 (doTransfer) ── */
  const doTransfer = () => {
    const a = +trAmt; if (!a || !trFrom || !trTo || trFrom === trTo) return;
    upd("accs", p => p.map(ac => { 
      if (ac.id === trFrom) return { ...ac, bal: ac.bal - a }; 
      if (ac.id === trTo) return { ...ac, bal: ac.bal + a }; 
      return ac; 
    }));
    // 寫入轉帳交易明細
    upd("txns", p => [...p, {
      id: Date.now(), type: "transfer", cat: "帳戶調整", amt: a,
      desc: `轉帳：${accs.find(x=>x.id===trFrom)?.name} ➜ ${accs.find(x=>x.id===trTo)?.name}`,
      acc: accs.find(x=>x.id===trFrom)?.name || "", toAcc: accs.find(x=>x.id===trTo)?.name || "",
      date: TODAY, tags: "#轉帳"
    }]);
    setTrFrom(""); setTrTo(""); setTrAmt(""); close();
  };

  /* ── 補上內部的信用卡還款處理函數 (payCredit) ── */
  const payCredit = () => {
    const a = +payF.amt; if (!a || !payF.creditId || !payF.fromId) return;
    upd("accs", p => p.map(ac => { 
      if (ac.id === payF.creditId) return { ...ac, payable: Math.max(0, (ac.payable || 0) - a) }; 
      if (ac.id === payF.fromId) return { ...ac, bal: ac.bal - a }; 
      return ac; 
    }));
    upd("txns", p => [...p, { 
      id: Date.now(), type: "expense", cat: "帳戶調整", amt: a, 
      desc: payF.note || "信用卡繳費", 
      acc: accs.find(x => x.id === payF.fromId)?.name || "", date: payF.date, tags: "#繳費" 
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
            <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selAcc.name}」？`, () => { upd("accs", p => p.filter(a => a.id !== selAcc.id)); close(); })}>🗑 刪除此帳戶</Btn>
            {showAccEP && <EmojiPicker onSelect={e => { setSelAcc(p => ({ ...p, icon:e })); setShowAccEP(false); }} onClose={() => setShowAccEP(false)} />}
          </Sheet>;
        })()}

        {modal === "editCredit" && selAcc && <Sheet title={`編輯信用卡 — ${selAcc.name}`} onClose={close}>
          <Inp label="卡片名稱" value={selAcc.name} onChange={e => setSelAcc(p => ({ ...p, name:e.target.value }))} />
          <Inp label="信用額度" type="number" value={selAcc.limit || ""} onChange={e => setSelAcc(p => ({ ...p, limit:+e.target.value }))} />
          <Inp label="目前應付金額" type="number" value={selAcc.payable != null ? String(selAcc.payable) : "0"} onChange={e => setSelAcc(p => ({ ...p, payable:+e.target.value }))} />
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <Btn style={{ flex:1 }} onClick={() => { upd("accs", p => p.map(a => a.id === selAcc.id ? { ...a, name:selAcc.name, limit:selAcc.limit, payable:selAcc.payable } : a)); close(); }}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selAcc.name}」？`, () => { upd("accs", p => p.filter(a => a.id !== selAcc.id)); close(); })}>🗑 刪除此信用卡</Btn>
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
          const accTxns = txns
            .filter(t => t.acc === selAcc.name || t.toAcc === selAcc.name)
            .sort((a,b) => b.date.localeCompare(a.date))
            .slice(0, 50);
          const isCredit = selAcc.type === "credit";
          return <Sheet title={`${selAcc.icon||AT[selAcc.type]||""} ${selAcc.name}`} onClose={close}>
            <Card style={{ padding:16, marginBottom:16, background:`linear-gradient(135deg,${C.surface},${C.bg})` }}>
              <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>{isCredit ? "應付金額" : "目前餘額"}</div>
              <div style={{ fontWeight:900, fontSize:28, color:C.accentL }}>{isCredit ? fmt(selAcc.payable||0) : fmt(selAcc.bal, selAcc.cur)}</div>
              {selAcc.cur !== "TWD" && !isCredit && <div style={{ fontSize:13, color:C.muted }}>≈ {fmt(toTWD(selAcc.bal, selAcc.cur, rates))} TWD</div>}
              {isCredit && <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>信用額度 {fmt(selAcc.limit||0)} · 使用 {selAcc.limit>0?((selAcc.payable||0)/selAcc.limit*100).toFixed(0):0}%</div>}
            </Card>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <Btn style={{ flex:1 }} onClick={() => { close(); setTimeout(() => setModal("adjBal"), 50); }}>✏️ 編輯帳戶</Btn>
              {isCredit && <Btn v="teal" style={{ flex:1 }} onClick={() => { setPayF({ creditId:selAcc.id, fromId:"", amt:String(selAcc.payable||0), date:TODAY, note:"" }); close(); setTimeout(() => setModal("payCred"), 50); }}>💳 繳費</Btn>}
            </div>
            <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted, marginBottom:8 }}>交易紀錄</div>
            {accTxns.length === 0 && <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:13 }}>此帳戶尚無交易記錄</div>}
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

        {modal === "transfer" && <Sheet title="帳戶轉帳" onClose={close}>
          <Sl label="從 (From)" value={trFrom} onChange={e => setTrFrom(e.target.value)}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.id}>{a.name} ({fmt(a.bal, a.cur)})</option>)}</Sl>
          <Sl label="到 (To)" value={trTo} onChange={e => setTrTo(e.target.value)}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Sl>
          <Inp label="金額" type="number" value={trAmt} onChange={e => setTrAmt(e.target.value)} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={doTransfer}>確認轉帳</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

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
          <CatPicker value={selSub.cat} onChange={v => setSelSub(p => ({ ...p, cat:v }))} cats={cats.expense} ce={ceMap} onAddCat={(v,e) => { upd("cats", p => ({...p, expense:[...p.expense, v]})); addCustomCE(v,e); }} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => saveSub(selSub)}>儲存</Btn>
            <Btn v="danger" style={{ flex:1 }} onClick={() => { upd("subs", p => p.filter(x => x.id !== selSub.id)); close(); }}>刪除</Btn>
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
            <Btn style={{ flex:1 }} onClick={saveBill}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          <Btn v="danger" style={{ width:"100%" }} onClick={() => { upd("bills", p => p.filter(x => x.id !== selBill.id)); close(); }}>🗑 刪除</Btn>
        </Sheet>}
    </>
  );
}
