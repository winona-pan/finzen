import { useState } from "react";

export default function DebtModals({ 
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
  nAcc, setNAcc, addAcc, payF, setPayF, doPayCred,
  showHDP, setShowHDP, doBuy, doSell, doInit,
  nD, setND, addDebt, editDebt, setEditDebt,
  settleDebt, setSettleDebt, settleAcc, setSettleAcc,
  settleCustomAmt, setSettleCustomAmt, selTxn, setSelTxn,
  saveTxn, delTxn, moExp, moInc, moTxns, addCustomCE,
  // 共用 UI atoms
  Sheet, Inp, Sl, Fld, CalcInp, Btn, TP
}) {

  // 表單預設值
  const D0 = { type:"receivable", person:"", amt:"", desc:"", date:TODAY, note:"", installTotal:0, installAmt:"", installPaid:0, installPaidAmt:0 };

  return (
    <>
        {modal === "addDebt" && <Sheet title="新增往來帳" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"receivable", l:"別人欠我 💚", c:C.teal }, { v:"payable", l:"我欠別人 🟡", c:C.warn }].map(o => <TP key={o.v} active={nD.type === o.v} color={o.c} onClick={() => setND(p => ({ ...p, type:o.v }))}>{o.l}</TP>)}
          </div>
          <Inp label="對象" placeholder="媽媽" value={nD.person} onChange={e => setND(p => ({ ...p, person:e.target.value }))} />
          <CalcInp label="總金額" value={nD.amt} onChange={v => setND(p => ({ ...p, amt:v }))} />
          <Inp label="說明" placeholder="植村秀" value={nD.desc} onChange={e => setND(p => ({ ...p, desc:e.target.value }))} />
          <Fld label="日期"><input type="date" value={nD.date} onChange={e => setND(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          
          {/* Installment option */}
          <button onClick={() => setND(p => ({ ...p, installTotal:p.installTotal>0?0:3, installAmt:p.amt?String(Math.round(+p.amt/3)):"" }))}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nD.installTotal>0?`${C.warn}22`:C.card, color:nD.installTotal>0?C.warn:C.textSub, border:`1px solid ${nD.installTotal>0?C.warn:C.border}`, cursor:"pointer", marginBottom:12 }}>
            <span>{nD.installTotal>0?"✅":"⬜"}</span> 分期付款
          </button>
          
          {nD.installTotal > 0 && <div style={{ padding:12, borderRadius:12, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, marginBottom:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Fld label="分幾期">
                <select value={String(nD.installTotal)} onChange={e => setND(p => ({ ...p, installTotal:+e.target.value, installAmt:p.amt?String(Math.round(+p.amt/+e.target.value)):"" }))} style={iSt}>
                  {Array.from({length:47},(_,i)=>i+2).map(n=><option key={n} value={n}>{n} 期</option>)}
                </select>
              </Fld>
              <CalcInp label={nD.type==="receivable"?"每期收款":"每期付款"} value={nD.installAmt||""} onChange={v => setND(p => ({ ...p, installAmt:v }))} />
            </div>
            <div style={{ fontSize:12, color:nD.type==="receivable"?C.teal:C.warn }}>💡 {nD.type==="receivable"?"每次對方還錢點「收一期」":"每次付款點「付一期」"}，自動更新帳戶餘額</div>
          </div>}
          
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => {
              if (!nD.person || !nD.amt) return;
              upd("debts", p => [...p, { ...nD, id:"d" + Date.now(), amt:+nD.amt, settled:false }]);
              setND(D0);
              close();
            }}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "editDebt" && editDebt && <Sheet title="編輯往來帳" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"receivable", l:"別人欠我 💚", c:C.teal }, { v:"payable", l:"我欠別人 🟡", c:C.warn }].map(o => <TP key={o.v} active={editDebt.type === o.v} color={o.c} onClick={() => setEditDebt(p => ({ ...p, type:o.v }))}>{o.l}</TP>)}
          </div>
          <Inp label="對象" value={editDebt.person||""} onChange={e => setEditDebt(p => ({ ...p, person:e.target.value }))} />
          <CalcInp label="總金額" value={String(editDebt.amt||"")} onChange={v => setEditDebt(p => ({ ...p, amt:+v }))} />
          <Inp label="說明" value={editDebt.desc||""} onChange={e => setEditDebt(p => ({ ...p, desc:e.target.value }))} />
          <Fld label="日期"><input type="date" value={editDebt.date||TODAY} onChange={e => setEditDebt(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>

          {/* 分期付款（事後也能編輯）*/}
          <button onClick={() => setEditDebt(p => ({ ...p, installTotal:p.installTotal>0?0:3, installAmt:p.installAmt||(p.amt?String(Math.round(+p.amt/3)):"") }))}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:editDebt.installTotal>0?`${C.warn}22`:C.card, color:editDebt.installTotal>0?C.warn:C.textSub, border:`1px solid ${editDebt.installTotal>0?C.warn:C.border}`, cursor:"pointer", marginBottom:12 }}>
            <span>{editDebt.installTotal>0?"✅":"⬜"}</span> 分期付款
          </button>

          {editDebt.installTotal > 0 && <div style={{ padding:12, borderRadius:12, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, marginBottom:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Fld label="分幾期">
                <select value={String(editDebt.installTotal)} onChange={e => setEditDebt(p => ({ ...p, installTotal:+e.target.value, installAmt:p.amt?String(Math.round(+p.amt/+e.target.value)):"" }))} style={iSt}>
                  {Array.from({length:47},(_,i)=>i+2).map(n=><option key={n} value={n}>{n} 期</option>)}
                </select>
              </Fld>
              <CalcInp label={editDebt.type==="receivable"?"每期收款":"每期付款"} value={editDebt.installAmt||""} onChange={v => setEditDebt(p => ({ ...p, installAmt:v }))} />
            </div>
            {(editDebt.installPaid||0) > 0 && <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>已經收/付了 {editDebt.installPaid} 期，共 {fmt(editDebt.installPaidAmt||0)}</div>}
            <div style={{ fontSize:12, color:editDebt.type==="receivable"?C.teal:C.warn, marginTop:6 }}>💡 調整期數不會影響已經收/付過的紀錄</div>
          </div>}

          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => { upd("debts", p => p.map(x => x.id===editDebt.id ? editDebt : x)); close(); }}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "settleDebt" && settleDebt && (() => {
          const d = settleDebt;
          const isInstall = d.installTotal > 0;
          const eachAmt = isInstall ? +(d.installAmt || Math.round(d.amt / d.installTotal)) : +d.amt;
          const paidSoFar = d.installPaidAmt || 0;
          const remaining = d.amt - paidSoFar;
          const defaultPay = isInstall ? Math.min(eachAmt, remaining) : remaining;
          const thisPay = settleCustomAmt ? +settleCustomAmt : defaultPay;
          const isReceivable = d.type === "receivable";
          const newPaidCount = (d.installPaid||0) + 1;
          const isLast = !isInstall || (paidSoFar + thisPay) >= d.amt;
          return <Sheet title={isInstall ? `${isReceivable?"收第":"付第"} ${newPaidCount}/${d.installTotal} 期` : (isReceivable?"收款結清":"付款結清")} onClose={close}>
            <div style={{ padding:12, borderRadius:12, background:C.card, marginBottom:12 }}>
              <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:4 }}>{d.person} · {d.desc}</div>
              <div style={{ fontSize:13, color:isReceivable?C.teal:C.warn }}>
                剩餘未付：{fmt(remaining)} {isInstall ? `（第 ${newPaidCount}/${d.installTotal} 期，預設每期 ${fmt(eachAmt)}）` : ""}
              </div>
            </div>
            <Fld label={`本次${isReceivable?"收款":"付款"}金額（可修改）`}>
              <input type="number" value={settleCustomAmt !== null ? settleCustomAmt : String(defaultPay)}
                onChange={e => setSettleCustomAmt(e.target.value)}
                placeholder={String(defaultPay)}
                style={{...iSt}} />
              {thisPay > 0 && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>付完後剩 {fmt(Math.max(0, remaining - thisPay))}</div>}
            </Fld>
            <Sl label={isReceivable ? "款項收入到哪個帳戶" : "從哪個帳戶付款"}
              value={settleAcc} onChange={e => setSettleAcc(e.target.value)}>
              <option value="">— 選擇帳戶（選填）—</option>
              {accs.filter(a => isReceivable ? (a.type!=="credit"&&a.type!=="investment") : a.type!=="investment")
                .map(a => <option key={a.id} value={a.name}>{a.icon||AT[a.type]||""} {a.name} ({fmt(a.bal, a.cur)})</option>)}
            </Sl>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn style={{ flex:1 }} onClick={() => {
                if (!thisPay || thisPay <= 0) return;
                if (isInstall) {
                  upd("debts", p => p.map(x => x.id===d.id ? {...x, installPaid:newPaidCount, installPaidAmt:paidSoFar+thisPay, settled:isLast} : x));
                } else {
                  upd("debts", p => p.map(x => x.id===d.id ? {...x, settled:true} : x));
                }
                if (settleAcc && thisPay) {
                  if (isReceivable) upd("accs", p => p.map(a => a.name===settleAcc ? {...a, bal:a.bal+thisPay} : a));
                  else upd("accs", p => p.map(a => a.name===settleAcc ? {...a, bal:a.bal-thisPay} : a));
                }
                const desc = `${isInstall?(isReceivable?`分期收款 ${newPaidCount}/${d.installTotal}`:`分期付款 ${newPaidCount}/${d.installTotal}`):(isReceivable?"應收款結清":"應付款結清")}：${d.person} ${d.desc||""}`;
                upd("txns", p => [...p, {
                  id:Date.now(),
                  type: isReceivable ? "transfer" : "expense",
                  cat: "往來帳",
                  amt: thisPay,
                  desc,
                  acc: settleAcc || "",
                  toAcc: isReceivable ? settleAcc : "",
                  date: TODAY,
                  tags: "#往來帳",
                }]);
                setSettleDebt(null); setSettleAcc(""); setSettleCustomAmt(null); close();
              }}>✓ {isInstall ? (isReceivable?`收第${newPaidCount}期`:`付第${newPaidCount}期`) : (isReceivable?"確認收款":"確認付款")}</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}
    </>
  );
}
