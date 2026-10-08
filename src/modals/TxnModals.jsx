import { useState, useRef } from "react";
import { translateText } from "../i18nRuntime";

export default function TxnModals({ 
  C, modal, close, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, expensePools, buckets,
  savingsTargets, setSavingsTarget, applyGoalAllocation, resolveGoalDestinations, getGoalSavingsTarget, removeSavingsTarget, savingsProgress, curYm, nextYm, curSavingsTarget, nextSavingsTarget, financialSuggestion,
  updateGoalRecurringSchedule, tr, accFieldLabel, updMulti, chargeFromAccField, CatPicker, livingBudgetFor, setLivingBudgetForMonth,
  goalCurrentAmount, isGoalArchived, allocSettings, setAllocSettings, computeAllocation, doAccountTransfer, doTransfer, offsetGoal, setOffsetGoal, depositGoal, setDepositGoal, guiltFreeGauge, updateBucket, passiveMo,
  getSweptAmount, addSweptAmount,
  incomeSchedule, setIncomeSchedule, setRigidOverride, startNextMonthPlan, yearlySchedule, yearlyGoalSchedule, yearlyForecastTable, getIncomeItems, setIncomeItems, setDefaultIncomeItems,
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
  Sheet, Inp, Sl, Fld, CalcInp, AutoInput, Btn, TP
}) {

  const [editPool, setEditPool] = useState(null);

  /* ── 新增交易（含代墊拆分、分月認列）── */
  /* acc 欄位可能是子帳戶（"bucket:<id>"）：真正要動餘額的是它所屬的母帳戶，子帳戶本身則調整 allocated */
  const resolveAccField = (field) => {
    if (field && field.startsWith("bucket:")) {
      const bucketId = field.slice(7);
      const bucket = buckets.find(b => b.id === bucketId);
      const parentAcc = bucket ? accs.find(a => a.id === bucket.accId) : null;
      return { bucketId, bucket, parentAcc };
    }
    return { bucketId:null, bucket:null, parentAcc: accs.find(a => a.name === field) };
  };

  const addTxn = () => {
    if (!nT.amt) return;
    const id = Date.now();
    const validProxies = nT.proxy ? nT.proxyList.filter(p => p.person && +p.amt > 0) : [];
    const totalProxyAmt = validProxies.reduce((s, p) => s + +p.amt, 0);
    const ownAmt = +nT.amt - totalProxyAmt;
    const { bucketId, parentAcc: acc } = resolveAccField(nT.acc);

    if (validProxies.length > 0) {
      // 拆成兩筆：自己支出 + 代墊往來
      const ownTxn = { ...nT, id, amt: ownAmt, proxyAmt: 0, proxyFor: "", proxyList: [], desc: nT.desc || nT.cat };
      const proxyTxn = {
        ...nT, id: id + 1, type: "transfer", cat: "往來帳",
        amt: totalProxyAmt, proxyAmt: totalProxyAmt,
        proxyFor: validProxies.map(p => p.person).join("、"),
        proxyList: validProxies,
        desc: `代墊：${nT.desc || nT.cat}（${validProxies.map(p => `${p.person} ${fmt(+p.amt)}`).join("、")}）`,
        tags: "#代墊",
      };
      upd("txns", p => [...p, ownTxn, proxyTxn]);

      // 扣全額
      if (acc) {
        if (acc.type === "credit") {
          upd("accs", p => p.map(a => a.id === acc.id ? { ...a, payable: (a.payable || 0) + (+nT.amt) } : a));
        } else {
          upd("accs", p => p.map(a => a.id === acc.id ? { ...a, bal: a.bal - (+nT.amt) } : a));
        }
      }
      if (bucketId) upd("buckets", p => (p||[]).map(b => b.id === bucketId ? { ...b, allocated: Math.max(0, b.allocated - (+nT.amt)) } : b));
      // 建立應收帳款
      validProxies.forEach(pr => {
        upd("debts", p => [...p, { id: "d" + Date.now() + Math.random(), type: "receivable", person: pr.person, amt: +pr.amt, desc: `代墊：${nT.desc || nT.cat}`, date: nT.date, settled: false, srcTxnId: id }]);
      });
    } else {
      // 無代墊普通記帳
      const t = { ...nT, id, amt: +nT.amt, proxyAmt: 0, proxyFor: "", proxyList: [] };
      upd("txns", p => [...p, t]);
      if (acc) {
        if (t.type === "income") {
          upd("accs", p => p.map(a => a.id === acc.id ? { ...a, bal: a.bal + t.amt } : a));
          if (bucketId) upd("buckets", p => (p||[]).map(b => b.id === bucketId ? { ...b, allocated: b.allocated + t.amt } : b));
        } else if (t.type === "expense") {
          if (acc.type === "credit") {
            upd("accs", p => p.map(a => a.id === acc.id ? { ...a, payable: (a.payable || 0) + t.amt } : a));
          } else {
            upd("accs", p => p.map(a => a.id === acc.id ? { ...a, bal: a.bal - t.amt } : a));
          }
          if (bucketId) upd("buckets", p => (p||[]).map(b => b.id === bucketId ? { ...b, allocated: Math.max(0, b.allocated - t.amt) } : b));
        }
      }
    }

    if (nT.deferred && nT.deferMoAmt && nT.type === "income") {
      upd("txns", p => p.map(x => x.id === id ? { ...x, type: "transfer", cat: "帳戶調整", desc: `待認列收入：${nT.desc || nT.cat}（共 ${fmt(+nT.amt)}）` } : x));
      upd("pools", p => [...p, { id: "p" + id, desc: nT.desc || nT.cat, cat: nT.cat, totalAmt: +nT.amt, recognized: 0, date: nT.date, acc: nT.acc, originTxnId: id }]);
    }

    if (nT.installExp && +nT.installMonths > 1 && nT.type === "expense" && validProxies.length === 0) {
      const months = +nT.installMonths;
      const totalAmt = +nT.amt;
      upd("txns", p => p.map(x => x.id === id ? { ...x, type: "transfer", cat: "帳戶調整", desc: `分期付款：${nT.desc || nT.cat}（共 ${fmt(totalAmt)}，分 ${months} 期）`, tags: "#分攤認列" } : x));
      upd("expensePools", p => [...(p || []), { id: "ep" + id, desc: nT.desc || nT.cat, cat: nT.cat, totalAmt, monthlyAmt: Math.round(totalAmt / months), installments: months, recognized: 0, startDate: nT.date, acc: nT.acc || "", originTxnId: id }]);
    }
    setNT(T0); close();
  };

  return (
    <>
        {modal === "addTxn" && <Sheet title={tr("新增 / 補記")} onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"expense", l:`${tr("支出")} 💸`, c:C.expense }, { v:"income", l:`${tr("收入")} 💰`, c:C.income }].map(o => <TP key={o.v} active={nT.type === o.v} color={o.c} onClick={() => setNT(p => ({ ...p, type:o.v, cat:o.v === "income" ? "薪資" : "食物" }))}>{o.l}</TP>)}
          </div>
          <Fld label={tr("分類")}><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {(nT.type === "income" ? cats.income : cats.expense).map(cat => <button key={cat} onClick={() => setNT(p => ({ ...p, cat }))} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:nT.cat === cat ? `${C.accent}30` : C.card, border:`1px solid ${nT.cat === cat ? C.accent : C.border}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>{ceMap[cat] || "📦"}</span><span style={{ fontSize:11, color:nT.cat === cat ? C.accentL : C.textSub }}>{cat.length > 3 ? cat.slice(0, 3) + "…" : cat}</span></button>)}
            <button onClick={() => setModal("catSet")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:C.card, border:`1px dashed ${C.accent}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>➕</span><span style={{ fontSize:11, color:C.accentL }}>{tr("新增")}</span></button>
          </div></Fld>
          <button onClick={() => setNT(p => ({ ...p, overseasFee:!p.overseasFee, overseasBase:p.amt||"", overseasFeePct:p.overseasFeePct||"1.5" }))} style={{ width:"100%", marginBottom:8, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:nT.overseasFee ? `${C.accent}22` : C.card, color:nT.overseasFee ? C.accentL : C.textSub, border:`1px solid ${nT.overseasFee ? C.accent : C.border}`, cursor:"pointer" }}>
            <span>{nT.overseasFee ? "✅" : "⬜"}</span> {tr("海外刷卡（幫我算手續費）")}
          </button>
          {nT.overseasFee ? (
            <div style={{ padding:12, borderRadius:10, background:`${C.accent}10`, border:`1px solid ${C.accent}33`, marginBottom:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8 }}>
                <Inp label={tr("商品金額（未含手續費）")} type="number" placeholder="1000" value={nT.overseasBase||""} onChange={e => {
                  const base = e.target.value; const pct = +(nT.overseasFeePct||0);
                  setNT(p => ({ ...p, overseasBase:base, amt: base ? String(Math.round(+base*(1+pct/100))) : "" }));
                }} />
                <Inp label={tr("手續費%")} type="number" placeholder="1.5" value={nT.overseasFeePct||""} onChange={e => {
                  const pct = e.target.value; const base = +(nT.overseasBase||0);
                  setNT(p => ({ ...p, overseasFeePct:pct, amt: base ? String(Math.round(base*(1+(+pct||0)/100))) : p.amt }));
                }} />
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{tr("台灣各銀行海外刷卡手續費大約落在 1%–1.5% 左右（不同銀行/卡片不同，請自行確認），在台灣刷國外網站（訂房網、海外購物網站等）通常也算海外消費")}</div>
              {nT.amt && <div style={{ marginTop:8, fontSize:13, fontWeight:900, color:C.accentL }}>{tr("含手續費總額")}：{fmt(+nT.amt)}</div>}
            </div>
          ) : null}
          <CalcInp label={tr("金額")} value={nT.amt} onChange={v => setNT(p => ({ ...p, amt:v, overseasFee:false }))} />
          <AutoInput label={tr("說明")} placeholder="蝦仁蛋炒飯" value={nT.desc} onChange={v => setNT(p => ({ ...p, desc:v }))} history={descHistoryByCat[nT.cat] || []} />
          <AutoInput label={tr("標籤（選填）")} placeholder="#標籤" value={nT.tags} onChange={v => setNT(p => ({ ...p, tags:v }))} history={tagsHistory} />
          {nT.type === "expense" && (
            <button onClick={() => setNT(p => ({ ...p, tags: p.tags === "#不列入生活費" ? "" : "#不列入生活費" }))} style={{ width:"100%", marginBottom:12, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:nT.tags === "#不列入生活費" ? `${C.warn}22` : C.card, color:nT.tags === "#不列入生活費" ? C.warn : C.textSub, border:`1px solid ${nT.tags === "#不列入生活費" ? C.warn : C.border}`, cursor:"pointer" }}>
              <span>{nT.tags === "#不列入生活費" ? "✅" : "⬜"}</span> {tr("不列入生活費（別人給的錢、非日常花費）")}
            </button>
          )}
          <Sl label={tr("帳戶")} value={nT.acc} onChange={e => setNT(p => ({ ...p, acc:e.target.value }))}><option value="">— {tr("選擇帳戶")} —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}{buckets.length>0 && <optgroup label={tr("子帳戶")}>{buckets.map(b => <option key={b.id} value={`bucket:${b.id}`}>{b.emoji} {accs.find(a=>a.id===b.accId)?.name}・{b.name}</option>)}</optgroup>}</Sl>
          <Fld label={`${tr("日期")}${nT.date !== TODAY ? " 📅 " + tr("補記") + " " + nT.date : ""}`}><input type="date" value={nT.date} onChange={e => setNT(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          
          {nT.type === "expense" && <div style={{ marginBottom:12 }}>
            <button onClick={() => setNT(p => ({ ...p, proxy:!p.proxy }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.proxy ? `${C.warn}22` : C.card, color:nT.proxy ? C.warn : C.textSub, border:`1px solid ${nT.proxy ? C.warn : C.border}`, cursor:"pointer" }}>
              <span>{nT.proxy ? "✅" : "⬜"}</span> {tr("含代墊款項（自動建立應收帳款）")}
            </button>
            {nT.proxy && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}44` }}>
              {nT.amt && nT.proxyList.length > 1 && <button onClick={() => { const each = Math.round(+nT.amt / nT.proxyList.length); setNT(p => ({ ...p, proxyList:p.proxyList.map(pl => ({ ...pl, amt:String(each) })) })); }} style={{ width:"100%", marginBottom:8, padding:"6px", borderRadius:8, background:`${C.warn}30`, color:C.warn, border:"none", fontSize:12, fontWeight:700, cursor:"pointer" }}>÷ {tr("平均分配")}（{tr("每人")} {fmt(Math.round(+nT.amt / nT.proxyList.length))}）</button>}
              {nT.proxyList.map((pl, i) => <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-end", marginBottom:8 }}>
                <div style={{ flex:1 }}><Inp label={`${tr("對象")} ${i + 1}`} placeholder="朋友A" value={pl.person} onChange={e => setNT(p => ({ ...p, proxyList:p.proxyList.map((x, j) => j === i ? { ...x, person:e.target.value } : x) }))} /></div>
                <div style={{ flex:1 }}><Inp label={tr("金額")} type="number" placeholder="350" value={pl.amt} onChange={e => setNT(p => ({ ...p, proxyList:p.proxyList.map((x, j) => j === i ? { ...x, amt:e.target.value } : x) }))} /></div>
                {nT.proxyList.length > 1 && <button onClick={() => setNT(p => ({ ...p, proxyList:p.proxyList.filter((_, j) => j !== i) }))} style={{ width:32, height:38, borderRadius:8, background:C.danger + "22", border:"none", color:C.danger, cursor:"pointer", fontSize:16, marginBottom:12 }}>✕</button>}
              </div>)}
              <button onClick={() => setNT(p => ({ ...p, proxyList:[...p.proxyList, { person:"", amt:"" }] }))} style={{ width:"100%", padding:"6px", borderRadius:8, background:"transparent", border:`1px dashed ${C.warn}`, color:C.warn, fontSize:12, fontWeight:700, cursor:"pointer" }}>＋ {tr("新增代墊對象")}</button>
              <div style={{ fontSize:12, color:C.warn, marginTop:6 }}>✨ {tr("自動在「往來帳」為每位對象建立應收記錄")}</div>
            </div>}

            <button onClick={() => setNT(p => ({ ...p, installExp:!p.installExp, installMonths:p.installMonths||"3" }))} style={{ width:"100%", marginTop:8, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.installExp ? `${C.teal}22` : C.card, color:nT.installExp ? C.teal : C.textSub, border:`1px solid ${nT.installExp ? C.teal : C.border}`, cursor:"pointer" }}>
              <span>{nT.installExp ? "✅" : "⬜"}</span> {tr("分期付款（例：分期買家電）")}
            </button>
            {nT.installExp && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}44` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <Inp label={tr("分幾期")} type="number" min="2" placeholder="3" value={nT.installMonths||"3"} onChange={e => setNT(p => ({ ...p, installMonths:e.target.value }))} />
                <div>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>{tr("每期約")}</div>
                  <div style={{ fontWeight:900, fontSize:15, color:C.teal, padding:"9px 0" }}>{nT.amt && nT.installMonths ? fmt(Math.round(+nT.amt / +nT.installMonths)) : "—"}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:C.teal, marginTop:4 }}>💡 {tr("帳戶當下不會整筆扣款，改成每月自動認列一部分支出")}</div>
            </div>}
          </div>}

          {nT.type === "income" && <div style={{ marginBottom:12 }}>
            <button onClick={() => setNT(p => ({ ...p, deferred:!p.deferred }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.deferred ? `${C.teal}22` : C.card, color:nT.deferred ? C.teal : C.textSub, border:`1px solid ${nT.deferred ? C.teal : C.border}`, cursor:"pointer" }}>
              <span>{nT.deferred ? "✅" : "⬜"}</span> {tr("開啟分月認列（收入分期計算）")}
            </button>
            {nT.deferred && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}44` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <Inp label={tr("分幾個月")} type="number" placeholder="4" value={nT.deferMonths} onChange={e => setNT(p => ({ ...p, deferMonths:e.target.value, deferMoAmt:p.amt ? String(Math.round(+p.amt / +(e.target.value || 1))) : "" }))} />
                <Inp label={tr("本月認列")} type="number" placeholder="5000" value={nT.deferMoAmt} onChange={e => setNT(p => ({ ...p, deferMoAmt:e.target.value }))} />
              </div>
              <div style={{ fontSize:12, color:C.teal }}>💡 {tr("Wallet 顯示全額，Overview 只計本月認列")}</div>
            </div>}
          </div>}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addTxn}>{tr("確認新增")}</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>{tr("取消")}</Btn>
          </div>
        </Sheet>}

        {modal === "editTxn" && selTxn && <Sheet title="編輯記錄" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"expense", l:"支出", c:C.expense }, { v:"income", l:"收入", c:C.income }].map(o => <TP key={o.v} active={selTxn.type === o.v} color={o.c} onClick={() => setSelTxn(p => ({ ...p, type:o.v }))}>{o.l}</TP>)}
          </div>
          <Fld label="分類"><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {(selTxn.type === "income" ? cats.income : cats.expense).map(cat => <button key={cat} onClick={() => setSelTxn(p => ({ ...p, cat }))} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:selTxn.cat === cat ? `${C.accent}30` : C.card, border:`1px solid ${selTxn.cat === cat ? C.accent : C.border}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>{ceMap[cat] || "📦"}</span><span style={{ fontSize:11, color:selTxn.cat === cat ? C.accentL : C.textSub }}>{cat.length > 3 ? cat.slice(0, 3) + "…" : cat}</span></button>)}
          </div></Fld>
          <CalcInp label="金額" value={String(selTxn.amt)} onChange={v => setSelTxn(p => ({ ...p, amt:+v }))} />
          <AutoInput label="說明" value={selTxn.desc || ""} onChange={v => setSelTxn(p => ({ ...p, desc:v }))} history={descHistory} />
          <AutoInput label="標籤" value={selTxn.tags || ""} placeholder="#標籤" onChange={v => setSelTxn(p => ({ ...p, tags:v }))} history={tagsHistory} />
          {selTxn.type === "expense" && (
            <button onClick={() => setSelTxn(p => ({ ...p, tags: p.tags === "#不列入生活費" ? "" : "#不列入生活費" }))} style={{ width:"100%", marginBottom:12, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:700, background:selTxn.tags === "#不列入生活費" ? `${C.warn}22` : C.card, color:selTxn.tags === "#不列入生活費" ? C.warn : C.textSub, border:`1px solid ${selTxn.tags === "#不列入生活費" ? C.warn : C.border}`, cursor:"pointer" }}>
              <span>{selTxn.tags === "#不列入生活費" ? "✅" : "⬜"}</span> {tr("不列入生活費（別人給的錢、非日常花費）")}
            </button>
          )}
          <Sl label="帳戶" value={selTxn.acc || ""} onChange={e => setSelTxn(p => ({ ...p, acc:e.target.value }))}>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}{buckets.length>0 && <optgroup label={tr("子帳戶")}>{buckets.map(b => <option key={b.id} value={`bucket:${b.id}`}>{b.emoji} {accs.find(a=>a.id===b.accId)?.name}・{b.name}</option>)}</optgroup>}</Sl>
          <Fld label="日期"><input type="date" value={selTxn.date} onChange={e => setSelTxn(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm(tr("確定儲存這筆修改？帳戶餘額會依新舊金額差異自動調整"), () => saveTxn(selTxn), tr("確認編輯"))}>{tr("儲存")}</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "txnDet" && selTxn && <Sheet title="交易明細" onClose={close}>
          <div style={{ borderRadius:14, padding:16, marginBottom:16, background:C.card }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:54, height:54, borderRadius:16, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{ceMap[selTxn.cat] || "📦"}</div>
              <div><div style={{ fontWeight:900, fontSize:15, color:C.text }}>{selTxn.cat}</div><div style={{ fontWeight:900, fontSize:22, color:selTxn.type === "income" ? C.income : C.expense }}>{selTxn.type === "income" ? "+" : "-"}{fmt(selTxn.amt)}</div></div>
            </div>
            {[{ l:"日期", v:selTxn.date }, { l:"說明", v:selTxn.desc || "—" }, { l:"帳戶", v:accFieldLabel(selTxn.acc) || "—" }, { l:"標籤", v:selTxn.tags || "—" }, ...(selTxn.proxyAmt > 0 ? [{ l:"代墊對象", v:selTxn.proxyFor }, { l:"代墊金額", v:fmt(selTxn.proxyAmt) }] : [])].map(r => (
              <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.textSub }}>{r.l}</span><span style={{ fontSize:13, fontWeight:700, color:C.text }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn v="warn" style={{ flex:1 }} onClick={() => setModal("editTxn")}>✏️ 編輯</Btn>
            <Btn v="danger" style={{ flex:1 }} onClick={() => confirm(debts.some(x=>x.srcTxnId===selTxn.id && !x.settled) ? "確定刪除這筆交易？連動的代墊應收款也會一併刪除" : "確定刪除這筆交易？", () => delTxn(selTxn.id))}>🗑 刪除</Btn>
          </div>
        </Sheet>}

        {modal === "pools" && <Sheet title="認列收入池" onClose={close}>
          {pools.filter(p => p.totalAmt - p.recognized > 0).length === 0 && <div style={{ padding:"32px 0", textAlign:"center", color:C.muted }}>所有收入已完全認列</div>}
          {pools.filter(p => p.totalAmt - p.recognized > 0).map(p => <div key={p.id} style={{ borderRadius:14, padding:16, marginBottom:12, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.desc}</div><div style={{ fontSize:12, color:C.muted }}>{p.date}</div></div>
              {editPool?.id !== p.id && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>{tr("已認列/總額")}</div><div style={{ fontWeight:700, fontSize:13, color:C.teal }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>}
              <button onClick={() => setEditPool(editPool?.id===p.id ? null : { id:p.id, totalAmt:String(p.totalAmt), recognized:String(p.recognized) })} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, marginLeft:8 }}>✏️</button>
              <button onClick={() => confirm(`${tr("確定刪除")}「${p.desc}」${tr("整筆分月認列？連同已認列的紀錄都會一起清除")}`, () => {
                if (p.originTxnId) { delTxn(p.originTxnId); }
                else { upd("pools", pr => pr.filter(x => x.id !== p.id)); upd("txns", pr => pr.filter(x => x.poolId !== p.id)); }
              }, tr("確認刪除"))} style={{ background:"none", border:"none", cursor:"pointer", color:C.expense, fontSize:14, flexShrink:0, marginLeft:6 }}>🗑</button>
            </div>
            {editPool?.id === p.id && (
              <div style={{ padding:10, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}33`, marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <Inp label={tr("總額")} type="number" value={editPool.totalAmt} onChange={e => setEditPool(ep => ({ ...ep, totalAmt:e.target.value }))} />
                  <Inp label={tr("已認列")} type="number" value={editPool.recognized} onChange={e => setEditPool(ep => ({ ...ep, recognized:e.target.value }))} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn sz="sm" v="teal" style={{ flex:1 }} onClick={() => {
                    const newTotal = +editPool.totalAmt, newRec = Math.min(+editPool.recognized, newTotal);
                    const diff = newRec - p.recognized;
                    confirm(`${tr("確定調整")}「${p.desc}」？${tr("已認列將從")} ${fmt(p.recognized)} ${tr("改為")} ${fmt(newRec)}（${diff>=0?"+":""}${fmt(diff)}），${tr("會自動記一筆調整交易")}`, () => {
                      upd("pools", pr => pr.map(x => x.id===p.id ? { ...x, totalAmt:newTotal, recognized:newRec } : x));
                      if (diff !== 0) upd("txns", pr => [...pr, { id:Date.now(), type: diff>0?"income":"expense", cat: p.cat||"其他收入", amt:Math.abs(diff), desc:`${tr("認列調整")}：${p.desc}`, acc:p.acc||"", date:TODAY, tags:"#認列調整", noBalanceEffect:true, poolId:p.id, poolType:"income", recognizedDiff:diff }]);
                      setEditPool(null);
                    }, tr("確認調整"));
                  }}>{tr("儲存")}</Btn>
                  <Btn sz="sm" v="secondary" style={{ flex:1 }} onClick={() => setEditPool(null)}>{tr("取消")}</Btn>
                </div>
              </div>
            )}
            <div style={{ height:6, borderRadius:3, background:C.border, marginBottom:12 }}><div style={{ height:"100%", borderRadius:3, width:`${Math.min(100,(p.recognized / p.totalAmt * 100)).toFixed(0)}%`, background:C.teal }} /></div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" placeholder={`${tr("最多")} ${fmt(p.totalAmt - p.recognized)}`} value={selPool?.id === p.id ? recAmt : ""} onFocus={() => setSelPool(p)} onChange={e => setRecAmt(e.target.value)} style={{ ...iSt, flex:1 }} />
              <Btn v="teal" sz="sm" onClick={() => { setSelPool(p); setTimeout(doRecognize, 50); }}>{tr("認列")}</Btn>
            </div>
          </div>)}
        </Sheet>}

        {modal === "expensePools" && <Sheet title={tr("年繳分攤進度")} onClose={close}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            {tr("這些是開了「分攤認列」的訂閱或支出。扣款/入帳當下就已經是那一筆錢的最終去向了（現金帳戶會扣款、信用卡會計入應付），這裡只是把同一筆錢拆開顯示在每個月的支出統計裡，不會再額外扣一次錢。")}
          </div>
          {expensePools.filter(p => p.totalAmt - p.recognized > 0).length === 0 && <div style={{ padding:"32px 0", textAlign:"center", color:C.muted }}>{tr("目前沒有進行中的分攤")}</div>}
          {expensePools.filter(p => p.totalAmt - p.recognized > 0).map(p => <div key={p.id} style={{ borderRadius:14, padding:16, marginBottom:12, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.desc}</div><div style={{ fontSize:12, color:C.muted }}>{p.startDate} {tr("開始・每期")} {fmt(p.monthlyAmt)}</div></div>
              {editPool?.id !== p.id && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>{tr("已認列/總額")}</div><div style={{ fontWeight:700, fontSize:13, color:C.warn }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>}
              <button onClick={() => setEditPool(editPool?.id===p.id ? null : { id:p.id, totalAmt:String(p.totalAmt), recognized:String(p.recognized) })} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, marginLeft:8 }}>✏️</button>
              <button onClick={() => confirm(`${tr("確定刪除")}「${p.desc}」${tr("整筆分攤？連同已扣款、已認列的紀錄都會一起清除")}`, () => {
                if (p.originTxnId) { delTxn(p.originTxnId); }
                else { upd("expensePools", pr => pr.filter(x => x.id !== p.id)); upd("txns", pr => pr.filter(x => x.poolId !== p.id)); }
              }, tr("確認刪除"))} style={{ background:"none", border:"none", cursor:"pointer", color:C.expense, fontSize:14, flexShrink:0, marginLeft:6 }}>🗑</button>
            </div>
            {editPool?.id === p.id && (
              <div style={{ padding:10, borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <Inp label={tr("總額")} type="number" value={editPool.totalAmt} onChange={e => setEditPool(ep => ({ ...ep, totalAmt:e.target.value }))} />
                  <Inp label={tr("已認列")} type="number" value={editPool.recognized} onChange={e => setEditPool(ep => ({ ...ep, recognized:e.target.value }))} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn sz="sm" v="warn" style={{ flex:1 }} onClick={() => {
                    const newTotal = +editPool.totalAmt, newRec = Math.min(+editPool.recognized, newTotal);
                    const diff = newRec - p.recognized;
                    const newMonthly = Math.round(newTotal / (p.installments || 12));
                    confirm(`${tr("確定調整")}「${p.desc}」？${tr("已認列將從")} ${fmt(p.recognized)} ${tr("改為")} ${fmt(newRec)}（${diff>=0?"+":""}${fmt(diff)}），${tr("會自動記一筆調整交易")}`, () => {
                      upd("expensePools", pr => pr.map(x => x.id===p.id ? { ...x, totalAmt:newTotal, recognized:newRec, monthlyAmt:newMonthly } : x));
                      if (diff !== 0) upd("txns", pr => [...pr, { id:Date.now(), type: diff>0?"expense":"income", cat: p.cat||"其他", amt:Math.abs(diff), desc:`${tr("分攤調整")}：${p.desc}`, acc:p.acc||"", date:TODAY, tags:"#認列調整", noBalanceEffect:true, poolId:p.id, poolType:"expense", recognizedDiff:diff }]);
                      setEditPool(null);
                    }, tr("確認調整"));
                  }}>{tr("儲存")}</Btn>
                  <Btn sz="sm" v="secondary" style={{ flex:1 }} onClick={() => setEditPool(null)}>{tr("取消")}</Btn>
                </div>
              </div>
            )}
            <div style={{ height:6, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, width:`${Math.min(100,(p.recognized / p.totalAmt * 100)).toFixed(0)}%`, background:C.warn }} /></div>
          </div>)}
        </Sheet>}
        {modal === "savingsTarget" && (() => {
          const target = curSavingsTarget;
          return <Sheet title={tr("設定這個月的存錢目標")} onClose={close}>
            <SavingsTargetForm
              ym={curYm} target={target} accs={accs} buckets={buckets}
              setSavingsTarget={setSavingsTarget} removeSavingsTarget={removeSavingsTarget}
              confirm={confirm} close={close} C={C} iSt={iSt} fmt={fmt}
              Fld={Fld} Sl={Sl} CalcInp={CalcInp} Inp={Inp} Btn={Btn} tr={tr}
            />
            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>{tr("下個月（")}{nextYm}{tr("）也可以先想好")}</div>
              <SavingsTargetForm
                ym={nextYm} target={nextSavingsTarget} accs={accs} buckets={buckets}
                setSavingsTarget={setSavingsTarget} removeSavingsTarget={removeSavingsTarget}
                confirm={confirm} close={close} C={C} iSt={iSt} fmt={fmt}
                Fld={Fld} Sl={Sl} CalcInp={CalcInp} Inp={Inp} Btn={Btn} tr={tr}
              />
            </div>
          </Sheet>;
        })()}

        {modal === "smartSuggest" && (() => {
          const fs = financialSuggestion;
          return <Sheet title="💡 幫我算這個月能存多少" onClose={close}>
            <div style={{ display:"flex", flexDirection:"column", gap:1, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 4px" }}>
                <span style={{ fontSize:13, color:C.textSub }}>這個月收入</span>
                <span style={{ fontSize:14, fontWeight:700, color:C.income }}>{fmt(fs.income)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 4px", borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.textSub }}>生活費預算（含訂閱／基本開銷{fs.historyMonths?`，近${fs.historyMonths}個月平均`:"，目前用設定頁的預設值"}）</span>
                <span style={{ fontSize:14, fontWeight:700, color:C.expense }}>− {fmt(fs.avgVariable)}</span>
              </div>
            </div>
            <div style={{ padding:16, borderRadius:14, background:`${C.teal}12`, border:`1px solid ${C.teal}44`, marginBottom:16 }}>
              <div style={{ fontSize:12, color:C.teal, marginBottom:4 }}>估計這個月可以存下</div>
              <div style={{ fontSize:26, fontWeight:900, color:C.teal }}>{fmt(fs.suggested)}</div>
              {fs.historyMonths === 0 && <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>還沒有足夠的歷史資料，用這個月目前的支出估算，之後累積更多資料會更準</div>}
            </div>
            {fs.suggested > 0 && buckets.length > 0 ? (
              <SmartSuggestApply amount={fs.suggested} buckets={buckets} accs={accs} setSavingsTarget={setSavingsTarget} ym={curYm} confirm={confirm} close={close} C={C} fmt={fmt} Btn={Btn} tr={tr} />
            ) : fs.suggested > 0 ? (
              <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>還沒有子帳戶，先到錢包建一個再回來套用建議吧</div>
            ) : (
              <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>這個月支出偏高，估算下來暫時沒有多餘的錢可以存</div>
            )}

            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <button onClick={() => setModal("allocEngine")} style={{ width:"100%", padding:12, borderRadius:12, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, color:C.accentL, fontWeight:900, fontSize:13, cursor:"pointer" }}>
                🧠 打開完整版分流引擎（投資＋多目標＋生活費一次分好）
              </button>
            </div>
          </Sheet>;
        })()}

        {modal === "allocEngine" && (
          <AllocEngineSheet
            allocSettings={allocSettings} setAllocSettings={setAllocSettings} startNextMonthPlan={startNextMonthPlan}
            livingBudgetFor={livingBudgetFor} setLivingBudgetForMonth={setLivingBudgetForMonth}
            computeAllocation={computeAllocation} financialSuggestion={financialSuggestion}
            getIncomeItems={getIncomeItems} setIncomeItems={setIncomeItems} setDefaultIncomeItems={setDefaultIncomeItems}
            accs={accs} buckets={buckets} setSavingsTarget={setSavingsTarget} applyGoalAllocation={applyGoalAllocation} resolveGoalDestinations={resolveGoalDestinations} getGoalSavingsTarget={getGoalSavingsTarget} doAccountTransfer={doAccountTransfer} curYm={curYm}
            confirm={confirm} close={close} setModal={setModal} C={C} iSt={iSt} fmt={fmt}
            Fld={Fld} Sl={Sl} CalcInp={CalcInp} Inp={Inp} Btn={Btn} Sheet={Sheet} tr={tr}
          />
        )}

        {modal === "yearlyForecast" && (
          <YearlyForecastSheet
            yearlySchedule={yearlySchedule} yearlyGoalSchedule={yearlyGoalSchedule} yearlyForecastTable={yearlyForecastTable}
            setIncomeSchedule={setIncomeSchedule} setRigidOverride={setRigidOverride} startNextMonthPlan={startNextMonthPlan} getIncomeItems={getIncomeItems} setIncomeItems={setIncomeItems} accs={accs} setSavingsTarget={setSavingsTarget} removeSavingsTarget={removeSavingsTarget} updateGoalRecurringSchedule={updateGoalRecurringSchedule}
            allocSettings={allocSettings} setAllocSettings={setAllocSettings} curYm={curYm} nextYm={nextYm}
            close={close} setModal={setModal} C={C} iSt={iSt} fmt={fmt} Btn={Btn} Sheet={Sheet} tr={tr}
          />
        )}

        {modal === "wishOffset" && offsetGoal && (
          <GoalSpendSheet g={offsetGoal} current={goalCurrentAmount(offsetGoal)} txns={txns} accs={accs} buckets={buckets} cats={cats} ceMap={ceMap} AT={AT}
            upd={upd} updMulti={updMulti} chargeFromAccField={chargeFromAccField} accFieldLabel={accFieldLabel} addCustomCE={addCustomCE}
            confirm={confirm} close={close} C={C} iSt={iSt} fmt={fmt} TODAY={TODAY} Sheet={Sheet} Sl={Sl} Fld={Fld} Inp={Inp} CalcInp={CalcInp} CatPicker={CatPicker} Btn={Btn} tr={tr} />
        )}

        {modal === "goalDeposit" && depositGoal && (() => {
          const g = depositGoal;
          const current = goalCurrentAmount(g);
          return <Sheet title={`💰 存入「${g.name}」`} onClose={close}>
            <div style={{ padding:14, borderRadius:12, background:`${C.accent}12`, border:`1px solid ${C.accent}44`, marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.accentL }}>目前已存</div>
              <div style={{ fontSize:22, fontWeight:900, color:C.accentL }}>{fmt(current)} / {fmt(g.target)}</div>
            </div>
            <GoalDepositForm g={g} accs={accs} buckets={buckets} doTransfer={doTransfer} confirm={confirm} close={close} C={C} iSt={iSt} fmt={fmt} Fld={Fld} Sl={Sl} CalcInp={CalcInp} Btn={Btn} tr={tr} />
          </Sheet>;
        })()}

        {modal === "sweepMoney" && (
          <SweepMoneySheet title={`🧹 ${tr("月底零錢一鍵掃入")}`} amount={guiltFreeGauge.remaining} amountLabel={tr("這個月生活區還剩下")} ym={curYm} kind="leftover" addSweptAmount={addSweptAmount} goals={goals} buckets={buckets} updateBucket={updateBucket} confirm={confirm} close={close} C={C} fmt={fmt} Btn={Btn} Sheet={Sheet} tr={tr} />
        )}

        {modal === "sweepPassive" && (
          <SweepMoneySheet title={`🏦 ${tr("被動收入分配")}`} amount={passiveMo} amountLabel={tr("這個月還沒分配的非勞務收入")} ym={curYm} kind="passive" addSweptAmount={addSweptAmount} goals={goals} buckets={buckets} updateBucket={updateBucket} confirm={confirm} close={close} C={C} fmt={fmt} Btn={Btn} Sheet={Sheet} tr={tr} />
        )}
    </>
  );
}

/* ── 智慧建議：選擇要把建議存款金額套用到哪個子帳戶 ── */
function SmartSuggestApply({ amount, buckets, accs, setSavingsTarget, ym, confirm, close, C, fmt, Btn, tr }) {
  const [bucketId, setBucketId] = useState(buckets[0]?.id || "");
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>{tr("要把這筆建議存款設成哪個子帳戶的目標？")}</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
        {buckets.map(b => (
          <button key={b.id} onClick={() => setBucketId(b.id)} style={{ padding:"6px 12px", borderRadius:10, fontSize:12, fontWeight:700, background:bucketId===b.id?`${C.teal}28`:C.card, color:bucketId===b.id?C.teal:C.muted, border:`1px solid ${bucketId===b.id?C.teal:C.border}`, cursor:"pointer" }}>{b.emoji} {b.name}</button>
        ))}
      </div>
      <Btn style={{ width:"100%" }} onClick={() => {
        const b = buckets.find(x => x.id === bucketId);
        confirm(`${tr("確定把這個月的存錢目標設成")}「${b?.name}」${tr("存")} ${fmt(amount)}？`, () => {
          setSavingsTarget(ym, null, bucketId, amount, "由智慧建議自動設定");
          close();
        }, tr("確認設定"));
      }}>{tr("套用這個建議")}</Btn>
    </div>
  );
}

/* ── 單一月份的存錢目標設定小表單 ── */
function SavingsTargetForm({ ym, target, accs, buckets, setSavingsTarget, removeSavingsTarget, confirm, close, C, iSt, fmt, Fld, Sl, CalcInp, Inp, Btn, tr }) {
  const [kind, setKind] = useState(target?.bucketId ? "bucket" : "acc");
  const [accId, setAccId] = useState(target?.accId || (accs[0]?.id || ""));
  const [bucketId, setBucketId] = useState(target?.bucketId || (buckets[0]?.id || ""));
  const [amount, setAmount] = useState(target ? String(target.amount) : "");
  const [note, setNote] = useState(target?.note || "");
  return (
    <div>
      {buckets.length > 0 && (
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          {[{v:"acc",l:"存到帳戶"},{v:"bucket",l:"存到子帳戶"}].map(o => (
            <button key={o.v} onClick={() => setKind(o.v)} style={{ flex:1, padding:"6px 4px", borderRadius:10, fontSize:12, fontWeight:700, background:kind===o.v?`${C.accent}28`:C.card, color:kind===o.v?C.accentL:C.muted, border:`1px solid ${kind===o.v?C.accent:C.border}`, cursor:"pointer" }}>{o.l}</button>
          ))}
        </div>
      )}
      {kind === "acc" ? (
        <Sl label="目標帳戶" value={accId} onChange={e => setAccId(e.target.value)}>
          {accs.filter(a=>a.type!=="credit").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Sl>
      ) : (
        <Sl label="目標子帳戶" value={bucketId} onChange={e => setBucketId(e.target.value)}>
          {buckets.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
        </Sl>
      )}
      <CalcInp label="目標金額" value={amount} onChange={setAmount} />
      <Inp label="備註（選填）" value={note} onChange={e => setNote(e.target.value)} placeholder="例如：這個月獎金多，多存一點" />
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <Btn style={{ flex:1 }} onClick={() => {
          if (!amount || +amount <= 0) return;
          confirm(`${tr("確定設定")} ${ym} ${tr("存錢目標")} ${fmt(+amount)}？`, () => {
            setSavingsTarget(ym, kind==="acc"?accId:null, kind==="bucket"?bucketId:null, amount, note);
          }, "確認設定");
        }}>{target?"更新目標":"設定目標"}</Btn>
        {target && <Btn v="danger" onClick={() => confirm(`${tr("確定移除")} ${ym} ${tr("的存錢目標？")}`, () => removeSavingsTarget(ym), tr("確認移除"))}>{tr("移除")}</Btn>}
      </div>
    </div>
  );
}

/* ── 智慧資金分流引擎：股票優先 → 各目標依優先級 → 生活費（自適應）→ 剩餘進預備金 ── */
function AllocEngineSheet({ allocSettings, setAllocSettings, startNextMonthPlan, livingBudgetFor, setLivingBudgetForMonth, computeAllocation, financialSuggestion, getIncomeItems, setIncomeItems, setDefaultIncomeItems, accs, buckets, setSavingsTarget, applyGoalAllocation, resolveGoalDestinations, getGoalSavingsTarget, doAccountTransfer, curYm, confirm, close, setModal, C, iSt, fmt, Fld, Sl, CalcInp, Inp, Btn, Sheet, tr }) {
  /* 這個分流引擎現在操作的「目標月份」：如果有設定計畫起始月份且晚於這個月（例如這個月還不想開始規劃），就用那個月，不然就是這個月 */
  const planStartYm = allocSettings.planStartYm && allocSettings.planStartYm > curYm ? allocSettings.planStartYm : curYm;
  /* 收入細項：每一筆有金額＋要進哪個帳戶，月月可以不同，改了就存到「目標月份」的排程 */
  const [incomeItems, setIncomeItemsLocal] = useState(() => getIncomeItems(planStartYm).map(it => ({ ...it, id: it.id || ("inc"+Math.random().toString(36).slice(2)) })));
  /* 投資分流：可以同時分好幾筆到不同證券戶，純粹是規劃／記錄用，不會自動幫你轉帳（因為實際買進是你自己分次操作的） */
  const [investAllocs, setInvestAllocsLocal] = useState(() => {
    if (allocSettings.investAllocs && allocSettings.investAllocs.length > 0) return allocSettings.investAllocs;
    if (allocSettings.investAccId || allocSettings.investAmt) return [{ id:"inv"+Date.now(), amt: allocSettings.investAmt || 0, toAccId: allocSettings.investAccId || "", fromAccId: "" }];
    if (allocSettings.defaultInvestAmt) return [{ id:"inv"+Date.now(), amt: allocSettings.defaultInvestAmt, toAccId: allocSettings.defaultInvestAccId || "", fromAccId: "" }];
    return [];
  });
  const [livingOverride, setLivingOverride] = useState(null);
  const [goalOverrides, setGoalOverrides] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [savedDefault, setSavedDefault] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // 分流引擎的說明文字太多太亂，全部收在底下要展開才看得到
  const [showDefaults, setShowDefaults] = useState(false); // 預設值（原本放在目標頁，搬到這裡統一）
  /* 要套用到哪些月份：預設從目標月份開始，也可以一次勾多個月一起設定存錢目標 */
  const monthOptions = Array.from({ length: 6 }, (_, i) => { const dt = new Date(planStartYm+"-01"); dt.setMonth(dt.getMonth()+i); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; });
  const [applyMonths, setApplyMonths] = useState([planStartYm]);

  const income = incomeItems.reduce((s, it) => s + (+it.amt || 0), 0);
  const investAmt = investAllocs.reduce((s, r) => s + (+r.amt || 0), 0);

  const updateIncomeItems = (next) => { setIncomeItemsLocal(next); setIncomeItems(planStartYm, next); };
  const addIncomeItem = () => updateIncomeItems([...incomeItems, { id:"inc"+Date.now(), label:"", amt:0, accId:"" }]);
  const removeIncomeItem = (id) => updateIncomeItems(incomeItems.filter(it => it.id !== id));
  const patchIncomeItem = (id, patch) => updateIncomeItems(incomeItems.map(it => it.id===id ? { ...it, ...patch } : it));

  /* 清空這裡目前顯示的所有數字（收入細項、投資分流、生活費／目標覆寫），讓你重新輸入，不會被之前留下的數字卡住 */
  const resetAll = () => {
    updateIncomeItems([{ id:"inc"+Date.now(), label:"", amt:0, accId:"" }]);
    setInvestAllocsLocal([]);
    setAllocSettings({ investAllocs:[], investAmt:0, investAccId:"" });
    setLivingOverride(null);
    setLivingBudgetForMonth(planStartYm, null);
    setGoalOverrides({});
  };

  const updateInvestAllocs = (next) => { setInvestAllocsLocal(next); setAllocSettings({ investAllocs: next, investAmt: next.reduce((s,r)=>s+(+r.amt||0),0), investAccId: next[0]?.toAccId || "" }); };
  const addInvestAlloc = () => updateInvestAllocs([...investAllocs, { id:"inv"+Date.now(), amt:0, toAccId:"", fromAccId:"" }]);
  const removeInvestAlloc = (id) => updateInvestAllocs(investAllocs.filter(r => r.id !== id));
  const patchInvestAlloc = (id, patch) => updateInvestAllocs(investAllocs.map(r => r.id===id ? { ...r, ...patch } : r));

  const alloc = computeAllocation(income, {
    investAmt,
    // 這個月另外設定過的生活費會存起來（總覽的生活水位、年度預測都用它），沒設定才用近幾個月平均／預設值
    livingAmt: livingOverride != null && livingOverride !== "" ? +livingOverride : livingBudgetFor(planStartYm),
    goalOverrides: Object.fromEntries(Object.entries(goalOverrides).map(([k,v]) => [k, v===""?null:+v])),
  });

  // ── 這個「規劃月份」是不是已經套用過了：直接讀存錢目標記錄，不是只看這次開啟後有沒有按過套用鍵，
  // 這樣重新打開分流引擎也看得到「已經套用過」，不會誤以為還沒算 ──
  const allocGoals = [...alloc.goalAllocs, ...alloc.wishlistAllocs];
  const appliedGoals = allocGoals.filter(g => getGoalSavingsTarget(planStartYm, g.id) != null);
  const appliedTotal = appliedGoals.reduce((s,g) => s + (getGoalSavingsTarget(planStartYm, g.id)||0), 0);

  /* ── 畫面：上面一張「收入 → 分去哪裡」的總覽條，下面三步：① 收入 ② 分配 ③ 套用。
     次要的設定（從下個月開始、清空、年度預測、說明）全部收到最底下一排小字連結 ── */
  const goalsTotal = allocGoals.reduce((s, g) => s + (+g.alloc || 0), 0);
  const allocatedTotal = alloc.investAmt + alloc.livingAmt + goalsTotal;
  const overBy = Math.max(0, allocatedTotal - income);
  const segments = [
    { key:"invest", label:tr("投資"), amt:alloc.investAmt, color:C.accent },
    { key:"living", label:tr("生活費"), amt:alloc.livingAmt, color:C.warn },
    { key:"goals", label:tr("目標"), amt:goalsTotal, color:"#a78bfa" },
    { key:"reserve", label:tr("剩餘"), amt:alloc.reserveAmt, color:C.teal },
  ];
  const barTotal = Math.max(income, allocatedTotal, 1);
  const isLaterStart = allocSettings.planStartYm && allocSettings.planStartYm > curYm;
  const reserveBucket = buckets.find(b => b.id === allocSettings.reserveBucketId);
  const ymLabel = (ym) => `${+ym.slice(5)}${tr("月")}`;

  const sectionTitle = (n, text, right) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", margin:"22px 2px 8px" }}>
      <span style={{ fontSize:12, fontWeight:800, color:C.textSub, letterSpacing:"0.02em" }}><span style={{ color:C.accentL, marginRight:6 }}>{n}</span>{text}</span>
      {right}
    </div>
  );
  // 用文字框＋數字鍵盤，不用 type="number"（那個會出現很醜的上下箭頭）；只留數字
  const amtInput = (value, onValue) => (
    <input type="text" inputMode="decimal" value={value} onChange={e => onValue(e.target.value.replace(/[^\d.]/g, ""))}
      style={{ ...iSt, width:92, textAlign:"right", padding:"7px 10px", fontSize:14, fontWeight:800, background:C.bg, border:`1px solid ${C.border}` }} />
  );
  const row = ({ key, icon, title, sub, right, onClick, last }) => (
    <div key={key} onClick={onClick} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderBottom:last?"none":`1px solid ${C.border}`, cursor:onClick?"pointer":"default" }}>
      <div style={{ width:32, height:32, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
        {sub && <div style={{ fontSize:10.5, color:C.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
  const linkBtn = { background:"none", border:"none", padding:"4px 2px", color:C.muted, fontSize:11, fontWeight:600, cursor:"pointer" };

  return <Sheet title={`🧠 ${tr("智慧分流")}`} onClose={close}>
    {/* ── 總覽：收入 → 分去哪裡 ── */}
    <div style={{ padding:"16px 16px 14px", borderRadius:20, background:C.card }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.muted }}>{planStartYm} {tr("收入")}</span>
        {appliedGoals.length > 0
          ? <span style={{ fontSize:10, fontWeight:700, color:C.teal, background:`${C.teal}18`, padding:"3px 8px", borderRadius:10 }}>✓ {tr("已套用")} {fmt(appliedTotal)}</span>
          : <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:C.bg, padding:"3px 8px", borderRadius:10 }}>{tr("尚未套用")}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:C.text, letterSpacing:"-0.02em", margin:"4px 0 12px" }}>{fmt(income)}</div>
      <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", background:C.border, gap:2 }}>
        {segments.filter(sg => sg.amt > 0).map(sg => <div key={sg.key} style={{ width:`${sg.amt / barTotal * 100}%`, background:sg.color, transition:"width .3s" }} />)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginTop:12 }}>
        {segments.map(sg => (
          <div key={sg.key} style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:sg.color, flexShrink:0 }} />
            <span style={{ fontSize:11, color:C.textSub }}>{sg.label}</span>
            <span style={{ fontSize:12, fontWeight:800, color:C.text, marginLeft:"auto" }}>{fmt(sg.amt)}</span>
          </div>
        ))}
      </div>
      {overBy > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.warn, marginTop:10 }}>⚠️ {tr("分配超過收入")} {fmt(overBy)}，{tr("調低生活費或目標金額")}</div>}
    </div>

    {/* ── ① 收入 ── */}
    {sectionTitle("①", tr("收入"), savedDefault
      ? <span style={{ fontSize:10, color:C.teal }}>✓ {tr("已設為每月預設")}</span>
      : <button onClick={() => { setDefaultIncomeItems(incomeItems); setSavedDefault(true); }} style={{ ...linkBtn, color:C.accentL }}>{tr("設為每月預設")}</button>)}
    <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
      {incomeItems.map(it => (
        <div key={it.id} style={{ display:"grid", gridTemplateColumns:"1fr 92px", gap:8, padding:"10px 12px", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
          <div style={{ minWidth:0 }}>
            <input value={it.label} onChange={e => patchIncomeItem(it.id, { label:e.target.value })} placeholder={tr("薪水、零用錢…")} style={{ width:"100%", background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontWeight:700, padding:0 }} />
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
              <select value={it.accId||""} onChange={e => patchIncomeItem(it.id, { accId:e.target.value })} style={{ background:"none", border:"none", outline:"none", color:C.muted, fontSize:10.5, padding:0, maxWidth:"100%" }}>
                <option value="">{tr("存入帳戶（選填）")}</option>
                {accs.filter(a=>a.type!=="credit").map(a => <option key={a.id} value={a.id}>→ {a.name}</option>)}
              </select>
              <button onClick={() => removeIncomeItem(it.id)} style={{ ...linkBtn, fontSize:10, padding:0, marginLeft:"auto" }}>{tr("刪除")}</button>
            </div>
          </div>
          {amtInput(it.amt || "", v => patchIncomeItem(it.id, { amt:+v||0 }))}
        </div>
      ))}
      <button onClick={addIncomeItem} style={{ width:"100%", padding:"11px 12px", background:"none", border:"none", color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer", textAlign:"left" }}>＋ {tr("新增收入")}</button>
    </div>

    {/* ── ② 分配 ── */}
    {sectionTitle("②", tr("分配"), <span style={{ fontSize:10, color:C.muted }}>{tr("數字可直接改")}</span>)}
    <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
      {row({ key:"invest", icon:"📊", title:tr("投資"),
        sub: investAllocs.length ? `${translateText(`${investAllocs.length} 筆`)}・${tr("只記錄，不自動轉帳")}` : tr("點這裡設定"),
        onClick: () => setShowSettings(p => !p),
        right: <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ fontSize:14, fontWeight:800, color:C.text }}>{fmt(alloc.investAmt)}</span><span style={{ fontSize:10, color:C.muted }}>{showSettings?"▲":"▼"}</span></span> })}
      {showSettings && (
        <div style={{ padding:"4px 14px 12px", background:C.bg, borderBottom:`1px solid ${C.border}` }}>
          {investAllocs.map(r => (
            <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 92px", gap:8, alignItems:"center", padding:"8px 0", borderBottom:`1px dashed ${C.border}` }}>
              <div style={{ minWidth:0, display:"flex", flexDirection:"column", gap:2 }}>
                <select value={r.toAccId||""} onChange={e => patchInvestAlloc(r.id, { toAccId:e.target.value })} style={{ alignSelf:"flex-start", maxWidth:"100%", background:"none", border:"none", outline:"none", color:C.text, fontSize:12, fontWeight:700, padding:0 }}>
                  <option value="">{tr("選證券戶")}</option>
                  {accs.filter(a=>a.type==="investment").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <select value={r.fromAccId||""} onChange={e => patchInvestAlloc(r.id, { fromAccId:e.target.value })} style={{ background:"none", border:"none", outline:"none", color:C.muted, fontSize:10.5, padding:0, maxWidth:"100%" }}>
                    <option value="">{tr("從哪轉出（選填）")}</option>
                    {accs.filter(a=>a.type!=="credit" && a.type!=="investment").map(a => <option key={a.id} value={a.id}>{a.name} →</option>)}
                  </select>
                  <button onClick={() => removeInvestAlloc(r.id)} style={{ ...linkBtn, fontSize:10, padding:0, marginLeft:"auto" }}>{tr("刪除")}</button>
                </div>
              </div>
              {amtInput(r.amt || "", v => patchInvestAlloc(r.id, { amt:+v||0 }))}
            </div>
          ))}
          <button onClick={addInvestAlloc} style={{ ...linkBtn, color:C.accentL, fontWeight:700, fontSize:12, marginTop:8 }}>＋ {tr("新增投資")}</button>
        </div>
      )}
      {row({ key:"living", icon:"🍜", title:tr("生活費"),
        sub: livingBudgetFor(planStartYm) != null
          ? <>{+planStartYm.slice(5)}{tr("月已自訂")}・<span onClick={e => { e.stopPropagation(); setLivingOverride(null); setLivingBudgetForMonth(planStartYm, null); }} style={{ color:C.accentL, cursor:"pointer" }}>{tr("恢復自動")}</span></>
          : alloc.historyMonths > 0 ? `${tr("近")}${alloc.historyMonths}${tr("個月平均")}` : tr("還沒有記帳紀錄，自己填"),
        right: amtInput(livingOverride ?? alloc.livingAmt, v => { setLivingOverride(v); setLivingBudgetForMonth(planStartYm, v === "" ? null : v); }) })}
      {allocGoals.map(g => {
        const isWish = alloc.wishlistAllocs.includes(g);
        const applied = getGoalSavingsTarget(planStartYm, g.id) != null;
        const meta = [
          `P${g.priority}`,
          isWish ? tr("願望") : g.isDone ? `🎉 ${tr("已達標")}` : g.monthsLeft ? `${tr("剩")} ${g.monthsLeft} ${tr("個月")}` : null,
          `${g.pct.toFixed(0)}%`,
          applied ? `✓ ${tr("已套用")}` : null,
        ].filter(Boolean).join("・");
        return row({ key:g.id, icon:g.emoji || "🎯", title:g.name, sub:meta,
          right: g.isDone && !isWish ? <span style={{ fontSize:13, color:C.muted }}>—</span> : amtInput(goalOverrides[g.id] ?? g.alloc, v => setGoalOverrides(p => ({ ...p, [g.id]:v }))) });
      })}
      {allocGoals.length === 0 && <div style={{ padding:"12px 14px", fontSize:11, color:C.muted, borderBottom:`1px solid ${C.border}` }}>{tr("還沒有存錢目標，可以到「目標」頁新增")}</div>}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", background:`${C.teal}12` }}>
        <div style={{ width:32, height:32, borderRadius:10, background:`${C.teal}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>💰</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.teal }}>{tr("剩餘")}</div>
          {buckets.length > 0 ? (
            <select value={allocSettings.reserveBucketId||""} onChange={e => setAllocSettings({ reserveBucketId:e.target.value })} style={{ background:"none", border:"none", outline:"none", color:C.muted, fontSize:10.5, padding:0, marginTop:2, maxWidth:"100%" }}>
              <option value="">{tr("存到子帳戶（選填）")}</option>
              {buckets.map(b => <option key={b.id} value={b.id}>→ {b.emoji} {b.name}</option>)}
            </select>
          ) : <div style={{ fontSize:10.5, color:C.muted, marginTop:2 }}>{tr("分完剩下的都存起來")}</div>}
        </div>
        <span style={{ fontSize:18, fontWeight:900, color:C.teal }}>{fmt(alloc.reserveAmt)}</span>
      </div>
    </div>

    {/* ── ③ 套用 ── */}
    {sectionTitle("③", tr("套用到"), <span style={{ fontSize:10, color:C.muted }}>{tr("可多選")}</span>)}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6, marginBottom:12 }}>
      {monthOptions.map(ym => {
        const on = applyMonths.includes(ym);
        return (
          <button key={ym} title={ym} onClick={() => setApplyMonths(p => on ? p.filter(x=>x!==ym) : [...p, ym])}
            style={{ padding:"9px 0", borderRadius:12, fontSize:12, fontWeight:800, background:on?C.accent:C.card, color:on?"#fff":C.muted, border:"none", cursor:"pointer", position:"relative" }}>
            {ymLabel(ym)}
            {ym === curYm && <span style={{ position:"absolute", top:3, right:5, width:5, height:5, borderRadius:"50%", background:on?"#fff":C.accentL }} />}
          </button>
        );
      })}
    </div>
    <Btn style={{ width:"100%" }} disabled={applyMonths.length===0} onClick={() => {
      confirm(`${tr("確定把這份分流建議套用到")} ${applyMonths.join("、")}？${tr("只會設定各目標的存錢目標提醒，不會自動轉帳；年度現金流預測會直接採用這裡套用的數字")}`, () => {
        const livingSet = livingBudgetFor(planStartYm);
        if (livingSet != null) applyMonths.forEach(ym => setLivingBudgetForMonth(ym, livingSet)); // 一起套用的月份，生活費也設成一樣
        applyMonths.forEach(ym => {
          [...alloc.goalAllocs, ...alloc.wishlistAllocs].forEach(g => {
            // 一個目標可能同時分給好幾個子帳戶（g.splits），resolveGoalDestinations 會依比例／固定金額拆好；
            // 沒設定過分流比例的目標維持原本行為（全部進 accIds[0]/bucketIds[0]）
            const destinations = resolveGoalDestinations(g, g.alloc);
            applyGoalAllocation(ym, g.id, `智慧分流：${g.name}`, destinations);
          });
          if (allocSettings.reserveBucketId && alloc.reserveAmt > 0) {
            setSavingsTarget(ym, null, allocSettings.reserveBucketId, alloc.reserveAmt, "智慧分流：剩餘資金", "reserve");
          }
        });
        setJustApplied(true);
      }, "確認套用");
    }}>{appliedGoals.length > 0 ? tr("重新套用") : tr("套用")}（{applyMonths.length} {tr("個月")}）</Btn>
    {justApplied && <div style={{ textAlign:"center", fontSize:11, color:C.teal, fontWeight:700, marginTop:8 }}>✓ {tr("已套用，改完再按一次就會更新")}</div>}

    {/* ── 次要設定：收成一排小字 ── */}
    <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"2px 14px", marginTop:18 }}>
      {isLaterStart
        ? <button onClick={() => setAllocSettings({ planStartYm:"" })} style={{ ...linkBtn, color:C.teal }}>📌 {tr("從")} {ymLabel(allocSettings.planStartYm)} {tr("開始")}・{tr("取消")}</button>
        : <button onClick={startNextMonthPlan} style={linkBtn}>{tr("下個月開始")}</button>}
      <button onClick={() => confirm(tr("確定清空這裡目前的收入細項、投資分流、生活費覆寫，重新輸入？"), resetAll, tr("確認清空"))} style={linkBtn}>{tr("清空")}</button>
      <button onClick={() => { close(); setTimeout(() => setModal("yearlyForecast"), 50); }} style={linkBtn}>{tr("年度預測")} →</button>
      <button onClick={() => setShowDefaults(p=>!p)} style={linkBtn}>⚙️ {tr("預設值")} {showDefaults?"▲":"▼"}</button>
      <button onClick={() => setShowHelp(p=>!p)} style={linkBtn}>{tr("說明")} {showHelp?"▲":"▼"}</button>
    </div>
    {showDefaults && (() => {
      // 沒有特別設定的月份（智慧分流沒填收入、年度預測未來月份）都會用這裡的數字
      const numField = (key) => (
        <input key={`${key}_${allocSettings[key]||0}`} type="text" inputMode="decimal" defaultValue={allocSettings[key] || ""} placeholder="0"
          onChange={e => { e.target.value = e.target.value.replace(/[^\d.]/g, ""); }}
          onBlur={e => setAllocSettings({ [key]: +e.target.value || 0 })}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
          style={{ ...iSt, width:92, textAlign:"right", padding:"7px 10px", fontSize:14, fontWeight:800, background:C.bg, border:`1px solid ${C.border}` }} />
      );
      const pickStyle = { ...iSt, width:124, padding:"7px 8px", fontSize:12, fontWeight:700, background:C.bg, border:`1px solid ${C.border}` };
      const rows = [
        { icon:"💵", title:tr("每月收入"), sub:tr("上面沒填收入時用這個"), right:numField("defaultIncome") },
        { icon:"🍜", title:tr("生活費上限"), sub:tr("年度預測的固定支出會用到"), right:numField("defaultLivingCap") },
        { icon:"📊", title:tr("每月投資"), sub:tr("只記錄，不自動轉帳"), right:numField("defaultInvestAmt") },
        { icon:"🏦", title:tr("證券帳戶"), sub:tr("選填"), right:(
          <select value={allocSettings.defaultInvestAccId||""} onChange={e => setAllocSettings({ defaultInvestAccId:e.target.value })} style={pickStyle}>
            <option value="">{tr("不指定")}</option>
            {accs.filter(a=>a.type==="investment").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>) },
        { icon:"📌", title:tr("從哪個月開始規劃"), sub:tr("留空＝從本月開始"), right:(
          <input type="month" value={allocSettings.planStartYm||""} onChange={e => setAllocSettings({ planStartYm:e.target.value })} style={pickStyle} />) },
      ];
      return (
        <div style={{ marginTop:8, borderRadius:16, background:C.card, overflow:"hidden" }}>
          <div style={{ padding:"10px 14px 4px", fontSize:10.5, color:C.muted }}>{tr("沒有特別設定的月份，智慧分流和年度預測都會用這些數字")}</div>
          {rows.map((r, i) => row({ key:r.title, icon:r.icon, title:r.title, sub:r.sub, right:r.right, last:i===rows.length-1 }))}
        </div>
      );
    })()}
    {showHelp && (
      <div style={{ fontSize:11, color:C.muted, lineHeight:1.7, marginTop:8, padding:"12px 14px", borderRadius:14, background:C.card }}>
        <div style={{ marginBottom:6 }}>{tr("收入會依序扣掉投資、生活費，剩下的依優先級（P1 最先）分給各目標，分不完的就是「剩餘」。")}</div>
        <div>{tr("套用只會設定各目標的存錢提醒，不會自動轉帳；收入和投資的設定會自動存檔。")}</div>
      </div>
    )}
  </Sheet>;
}

/* ── 願望對沖表單：記一筆消費，用願望池對沖，不干擾生活費常態分析 ── */
/* ── 花目標的錢：跟一般記帳一樣填分類、說明、帳戶、日期，可以連續記好幾筆（例如旅行的機票、住宿、餐費分開記）。
   每一筆都會帶 goalId 並標 #目標支出（願望池沿用 #願望兌現），在記帳清單會顯示目標標籤，
   也不會被算進生活費平均、安全水位、50/30/20 這些日常開銷統計 ── */
function GoalSpendSheet({ g, current, txns, accs, buckets, cats, ceMap, AT, upd, updMulti, chargeFromAccField, accFieldLabel, addCustomCE, confirm, close, C, iSt, fmt, TODAY, Sheet, Sl, Fld, Inp, CalcInp, CatPicker, Btn, tr }) {
  const isWishlist = g.goalType === "wishlist";
  const tag = isWishlist ? "#願望兌現" : "#目標支出";
  const linkedBucket = buckets.find(b => (g.bucketIds||[]).includes(b.id));
  const linkedAcc = accs.find(a => (g.accIds||[]).includes(a.id));
  const defaultAcc = linkedBucket ? `bucket:${linkedBucket.id}` : (linkedAcc ? linkedAcc.name : "");
  // 這個目標已經記過的花費：新資料看 goalId，舊資料（只有金額那版）看說明裡的目標名稱
  const spent = txns.filter(t => t.type === "expense" && (t.goalId === g.id || (!t.goalId && t.tags === "#願望兌現" && (t.desc||"").endsWith(`：${g.name}`))))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.id > a.id ? 1 : -1));
  const spentTotal = spent.reduce((s, t) => s + t.amt, 0);
  const lastCat = spent[0]?.cat;
  const blank = () => ({ amt:"", cat: lastCat && lastCat !== "其他" ? lastCat : (cats.expense[0] || "其他"), desc:"", acc:defaultAcc, date:TODAY });
  const [f, setF] = useState(blank);
  const [savedMsg, setSavedMsg] = useState("");

  const save = (markDone) => {
    const amt = +f.amt || 0;
    if (amt <= 0) return;
    const txn = { id:Date.now(), type:"expense", cat:f.cat || "其他", amt, desc:f.desc.trim() || g.name, acc:f.acc, date:f.date || TODAY, tags:tag, goalId:g.id, goalName:g.name };
    const doSave = () => {
      updMulti({ txns: p => [...p, txn], ...(f.acc ? chargeFromAccField(f.acc, amt) : {}) });
      if (isWishlist && markDone) upd("goals", p => p.map(x => x.id === g.id ? { ...x, wishPurchased:true } : x));
      setSavedMsg(`✓ ${tr("已記錄")} ${f.desc.trim() || f.cat} ${fmt(amt)}`);
      setF(p => ({ ...blank(), cat:p.cat, acc:p.acc, date:p.date })); // 連續記下一筆時保留分類、帳戶、日期
      if (markDone) close();
    };
    if (amt > current && current > 0) confirm(`${tr("這筆")} ${fmt(amt)} ${tr("超過目標目前存下的")} ${fmt(current)}，${tr("確定要記嗎？")}`, doSave, tr("確認記錄"), true);
    else doSave();
  };

  const accOptions = <>
    <option value="">{tr("不扣帳戶餘額")}</option>
    {accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}
    {buckets.length > 0 && <optgroup label={tr("子帳戶")}>{buckets.map(b => <option key={b.id} value={`bucket:${b.id}`}>{b.emoji} {accs.find(a=>a.id===b.accId)?.name}・{b.name}</option>)}</optgroup>}
  </>;

  return <Sheet title={`${g.emoji || "🎯"} ${g.name}・${tr("記錄花費")}`} onClose={close}>
    {/* 這個目標的錢：存下多少、已經花多少 */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", padding:"14px 6px", borderRadius:18, background:C.card, marginBottom:16 }}>
      {[[isWishlist ? tr("累積") : tr("還剩"), current, C.teal], [tr("已花"), spentTotal, C.text]].map(([l, v, c], i) => (
        <div key={l} style={{ textAlign:"center", borderLeft:i>0?`1px solid ${C.border}`:"none" }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.muted }}>{l}</div>
          <div style={{ fontSize:18, fontWeight:900, color:c, marginTop:2 }}>{fmt(v)}</div>
        </div>
      ))}
    </div>

    <CalcInp label={tr("金額")} value={f.amt} onChange={v => setF(p => ({ ...p, amt:v }))} />
    <CatPicker value={f.cat} onChange={v => setF(p => ({ ...p, cat:v }))} cats={cats.expense} ce={ceMap} onAddCat={(v,e) => { upd("cats", p => ({ ...p, expense:[...p.expense, v] })); addCustomCE(v, e); }} />
    <Inp label={tr("說明")} placeholder={isWishlist ? tr("例如：相機本體") : tr("例如：機票、住宿")} value={f.desc} onChange={e => setF(p => ({ ...p, desc:e.target.value }))} />
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      <Sl label={tr("從哪裡扣")} value={f.acc} onChange={e => setF(p => ({ ...p, acc:e.target.value }))}>{accOptions}</Sl>
      <Fld label={tr("日期")}><input type="date" value={f.date} onChange={e => setF(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
    </div>
    <div style={{ fontSize:10.5, color:C.muted, margin:"-4px 2px 12px", lineHeight:1.6 }}>
      🎯 {tr("會標成目標花費，記帳清單看得到，但不算進生活費和 50/30/20。")}{defaultAcc ? "" : ` ${tr("這個目標沒有連結帳戶，記得選從哪裡扣。")}`}
    </div>

    <div style={{ display:"flex", gap:8 }}>
      <Btn style={{ flex:1 }} onClick={() => save(false)}>＋ {tr("記一筆")}</Btn>
      {isWishlist && !g.wishPurchased && <Btn style={{ flex:1, background:C.teal }} onClick={() => save(true)}>🎁 {tr("記錄並完成願望")}</Btn>}
    </div>
    {savedMsg && <div style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.teal, marginTop:8 }}>{savedMsg}・{tr("可以繼續記下一筆")}</div>}

    {/* 已記錄的花費明細 */}
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", margin:"22px 2px 8px" }}>
      <span style={{ fontSize:12, fontWeight:800, color:C.textSub }}>{tr("花費明細")}</span>
      <span style={{ fontSize:10, color:C.muted }}>{translateText(`${spent.length} 筆`)}</span>
    </div>
    {spent.length === 0 ? (
      <div style={{ fontSize:11, color:C.muted, padding:"12px 14px", borderRadius:16, background:C.card }}>{tr("還沒有記錄")}</div>
    ) : (
      <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
        {spent.map((t, i) => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderTop:i>0?`1px solid ${C.border}`:"none" }}>
            <div style={{ width:30, height:30, borderRadius:9, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{ceMap[t.cat] || "📦"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.desc || t.cat}</div>
              <div style={{ fontSize:10, color:C.muted }}>{t.date?.slice(5).replace("-", "/")}・{t.cat}{t.acc ? `・${accFieldLabel(t.acc)}` : ""}</div>
            </div>
            <span style={{ fontSize:13, fontWeight:800, color:C.expense }}>-{fmt(t.amt)}</span>
          </div>
        ))}
      </div>
    )}
    <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:8 }}>{tr("要修改或刪除，到總覽的記帳清單點那一筆")}</div>
  </Sheet>;
}

/* ── 把這個月多存的錢，直接存入某個目標的連結帳戶／子帳戶 ── */
function GoalDepositForm({ g, accs, buckets, doTransfer, confirm, close, C, iSt, fmt, Fld, Sl, CalcInp, Btn, tr }) {
  const targetBucket = buckets.find(b => (g.bucketIds||[]).includes(b.id));
  const targetAcc = accs.find(a => (g.accIds||[]).includes(a.id));
  const targetKey = targetBucket ? `bucket:${targetBucket.id}` : targetAcc ? `acc:${targetAcc.id}` : null;
  const targetName = targetBucket?.name || targetAcc?.name || "";
  const sourceOptions = accs.filter(a => a.type !== "credit" && a.id !== targetAcc?.id);
  const [fromAccId, setFromAccId] = useState(sourceOptions[0]?.id || "");
  const [amount, setAmount] = useState("");

  if (!targetKey) return <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>這個目標沒有連結帳戶或子帳戶，沒辦法直接存入，先去編輯目標設定連結。</div>;

  return (
    <div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
        這個月如果多存了一筆錢（例如收入比較高、或別的月份省下來的），可以直接從某個帳戶轉一筆進「{targetName}」，馬上就會反映在這個目標的進度上。
      </div>
      <Sl label="從哪個帳戶轉出" value={fromAccId} onChange={e => setFromAccId(e.target.value)}>
        {sourceOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Sl>
      <CalcInp label="要存入多少" value={amount} onChange={setAmount} />
      <Btn style={{ width:"100%" }} onClick={() => {
        const amt = +amount || 0;
        if (amt <= 0 || !fromAccId) return;
        const fromAcc = accs.find(a => a.id === fromAccId);
        confirm(`${tr("確定從")}「${fromAcc?.name}」${tr("轉")} ${fmt(amt)} ${tr("存入")}「${targetName}」？`, () => {
          doTransfer(`acc:${fromAccId}`, targetKey, amt);
          close();
        }, "確認存入");
      }}>💰 存入</Btn>
    </div>
  );
}

/* ── 月底零錢一鍵掃入：生活區結餘掃進願望池或存錢區 ── */
function SweepMoneySheet({ title, amount, amountLabel, ym, kind, addSweptAmount, goals, buckets, updateBucket, confirm, close, C, fmt, Btn, Sheet, tr }) {
  const wishGoals = goals.filter(g => g.goalType === "wishlist" && (g.bucketIds||[]).length > 0);
  const [target, setTarget] = useState(null); // { bucketId, label }
  const options = [];
  wishGoals.forEach(g => { const b = buckets.find(bb => (g.bucketIds||[]).includes(bb.id)); if (b) options.push({ bucketId:b.id, label:`${g.emoji} ${g.name}` }); });
  buckets.forEach(b => { if (!options.some(o => o.bucketId === b.id)) options.push({ bucketId:b.id, label:`${b.emoji} ${b.name}` }); });

  return <Sheet title={title} onClose={close}>
    <div style={{ padding:14, borderRadius:12, background:`${C.teal}12`, border:`1px solid ${C.teal}44`, marginBottom:14 }}>
      <div style={{ fontSize:12, color:C.teal }}>{amountLabel}</div>
      <div style={{ fontSize:22, fontWeight:900, color:C.teal }}>{fmt(amount)}</div>
    </div>
    <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>要掃進哪裡？</div>
    {options.length === 0 ? (
      <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>還沒有子帳戶，先到錢包建一個吧</div>
    ) : (
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {options.map(o => (
          <button key={o.bucketId} onClick={() => setTarget(o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderRadius:12, background:target?.bucketId===o.bucketId?`${C.teal}20`:C.card, border:`1px solid ${target?.bucketId===o.bucketId?C.teal:C.border}`, cursor:"pointer" }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{o.label}</span>
            {target?.bucketId===o.bucketId && <span style={{ color:C.teal }}>✓</span>}
          </button>
        ))}
      </div>
    )}
    <Btn style={{ width:"100%" }} disabled={!target || amount <= 0} onClick={() => {
      if (!target || amount <= 0) return;
      confirm(`${tr("確定把")} ${fmt(amount)} ${tr("掃進")}「${target.label}」？`, () => {
        updateBucket(target.bucketId, { allocated: (buckets.find(b=>b.id===target.bucketId)?.allocated||0) + amount });
        if (ym && kind && addSweptAmount) addSweptAmount(ym, kind, amount);
        close();
      }, "確認掃入");
    }}>🧹 一鍵掃入</Btn>
    <div style={{ fontSize:10, color:C.muted, marginTop:8, lineHeight:1.6 }}>
      掃過的金額會記起來，這個月不會再重複被算進來。
    </div>
  </Sheet>;
}

/* ── 年度現金流預測與動態排程：12個月收入矩陣 + 各目標平滑分配排程表 ── */
function YearlyForecastSheet({ yearlySchedule, yearlyGoalSchedule, yearlyForecastTable, setIncomeSchedule, setRigidOverride, startNextMonthPlan, getIncomeItems, setIncomeItems, accs, setSavingsTarget, removeSavingsTarget, updateGoalRecurringSchedule, allocSettings, setAllocSettings, curYm, nextYm, close, setModal, C, iSt, fmt, Btn, Sheet, tr: trProp }) {
  const [expandedYm, setExpandedYm] = useState(null);
  const [draftItems, setDraftItems] = useState([]);
  const [editingChip, setEditingChip] = useState(null); // `${goalId}_${ym}`
  const [showHelp, setShowHelp] = useState(false);
  const matrixRef = useRef(null);
  const goalScheduleRef = useRef(null);

  const openMonth = (ym) => {
    if (expandedYm === ym) { setExpandedYm(null); return; }
    setExpandedYm(ym);
    setDraftItems(getIncomeItems(ym).map(it => ({ ...it, id: it.id || ("inc"+Math.random().toString(36).slice(2)) })));
  };
  const jumpToMonth = (ym) => { openMonth(ym); matrixRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }); };
  const jumpToGoalSchedule = () => { goalScheduleRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }); };
  const saveDraft = (ym, items) => { setIncomeItems(ym, items); };
  const patchDraft = (ym, id, patch) => { const next = draftItems.map(it => it.id===id ? { ...it, ...patch } : it); setDraftItems(next); saveDraft(ym, next); };
  const addDraft = (ym) => { const next = [...draftItems, { id:"inc"+Date.now(), label:"", amt:0, accId:"" }]; setDraftItems(next); saveDraft(ym, next); };
  const removeDraft = (ym, id) => { const next = draftItems.filter(it => it.id!==id); setDraftItems(next); saveDraft(ym, next); };

  /* ── 畫面：上面三格一年總計，中間一份 12 個月清單（每列附一條比例條：固定支出／存目標／剩餘），
     點一個月展開，在同一個地方改收入、固定支出；下面是各目標每月存多少。
     以前「收入矩陣」跟「現金流總覽表」是兩份一樣的 12 個月清單，現在合成一份 ── */
  const tr = trProp || (x => x);
  const scheduleByYm = Object.fromEntries(yearlySchedule.map(m => [m.ym, m]));
  const totals = yearlyForecastTable.reduce((t, r) => ({ income:t.income + r.income, sinking:t.sinking + r.sinkingAlloc, overflow:t.overflow + r.overflowAmt }), { income:0, sinking:0, overflow:0 });
  const isLaterStart = allocSettings.planStartYm && allocSettings.planStartYm > curYm;
  const colRigid = C.warn, colGoal = "#a78bfa", colLeft = C.teal;
  const linkBtn = { background:"none", border:"none", padding:"4px 2px", color:C.muted, fontSize:11, fontWeight:600, cursor:"pointer" };
  const sectionTitle = (text, right) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", margin:"22px 2px 8px" }}>
      <span style={{ fontSize:12, fontWeight:800, color:C.textSub }}>{text}</span>{right}
    </div>
  );
  const numInput = (props) => (
    <input type="text" inputMode="decimal" {...props}
      style={{ ...iSt, width:92, textAlign:"right", padding:"7px 10px", fontSize:14, fontWeight:800, background:C.bg, border:`1px solid ${C.border}`, ...(props.style||{}) }} />
  );
  const digits = (v) => v.replace(/[^\d.]/g, "");

  return <Sheet title={`📅 ${tr("年度預測")}`} onClose={close}>
    {/* ── 一年總計 ── */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", padding:"14px 6px", borderRadius:18, background:C.card }}>
      {[
        { label:tr("12 個月收入"), amt:totals.income, color:C.text },
        { label:tr("存進目標"), amt:totals.sinking, color:colGoal },
        { label:tr("剩餘"), amt:totals.overflow, color:colLeft },
      ].map((x, i) => (
        <div key={x.label} style={{ padding:"0 8px", minWidth:0, textAlign:"center", borderLeft:i>0?`1px solid ${C.border}`:"none" }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{x.label}</div>
          <div style={{ fontSize:13, fontWeight:900, color:x.color, marginTop:4, letterSpacing:"-0.02em", wordBreak:"break-all" }}>{fmt(x.amt)}</div>
        </div>
      ))}
    </div>

    {/* ── 12 個月 ── */}
    {sectionTitle(tr("每個月"), (
      <span style={{ display:"flex", gap:10, fontSize:10, color:C.muted }}>
        {[[colRigid, tr("固定支出")], [colGoal, tr("目標")], [colLeft, tr("剩餘")]].map(([c, l]) => (
          <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:7, height:7, borderRadius:"50%", background:c }} />{l}</span>
        ))}
      </span>
    ))}
    <div ref={matrixRef} style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
      {yearlyForecastTable.map((row, i) => {
        const m = scheduleByYm[row.ym] || {};
        const open = expandedYm === row.ym;
        const base = Math.max(row.income, row.rigid + row.sinkingAlloc, 1);
        const tag = m.actualIncome != null ? tr("實際") : m.isSeasonalEstimate ? tr("去年同月") : tr("預估");
        return (
          <div key={row.ym} style={{ borderTop:i>0?`1px solid ${C.border}`:"none", background:open?C.bg:"transparent" }}>
            <button onClick={() => openMonth(row.ym)} style={{ width:"100%", display:"grid", gridTemplateColumns:"64px 1fr auto", gap:12, alignItems:"center", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:13, fontWeight:row.isCurrent?900:700, color:row.isCurrent?C.accentL:C.text }}>{row.label.split("/")[1]}{tr("月")}<span style={{ display:"block", fontSize:9, fontWeight:600, color:C.muted }}>{row.label.split("/")[0]}{row.isCurrent?` · ${tr("本月")}`:""}</span></span>
              <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", background:C.border, gap:1 }}>
                {[[row.rigid, colRigid], [row.sinkingAlloc, colGoal], [row.overflowAmt, colLeft]].filter(([v]) => v > 0).map(([v, c], k) => <div key={k} style={{ width:`${v / base * 100}%`, background:c }} />)}
              </div>
              <span style={{ textAlign:"right" }}>
                <span style={{ display:"block", fontSize:13, fontWeight:800, color:C.text }}>{fmt(row.income)}</span>
                <span style={{ display:"block", fontSize:9, color:C.muted }}>{tag} {open?"▲":"▼"}</span>
              </span>
            </button>
            {open && (
              <div style={{ padding:"0 14px 14px" }}>
                {/* 收入來源 */}
                <div style={{ fontSize:10, fontWeight:700, color:C.muted, margin:"2px 0 6px" }}>{tr("收入來源")}{m.actualIncome != null ? `・${tr("已記帳")} ${fmt(m.actualIncome)}` : ""}</div>
                <div style={{ borderRadius:12, background:C.card, overflow:"hidden" }}>
                  {draftItems.map(it => (
                    <div key={it.id} style={{ display:"grid", gridTemplateColumns:"1fr 92px", gap:8, padding:"8px 10px", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
                      <div style={{ minWidth:0 }}>
                        <input value={it.label} onChange={e => patchDraft(row.ym, it.id, { label:e.target.value })} placeholder={tr("薪水、零用錢…")} style={{ width:"100%", background:"none", border:"none", outline:"none", color:C.text, fontSize:12, fontWeight:700, padding:0 }} />
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                          <select value={it.accId||""} onChange={e => patchDraft(row.ym, it.id, { accId:e.target.value })} style={{ background:"none", border:"none", outline:"none", color:C.muted, fontSize:10, padding:0, maxWidth:"100%" }}>
                            <option value="">{tr("存入帳戶（選填）")}</option>
                            {accs.filter(a=>a.type!=="credit").map(a => <option key={a.id} value={a.id}>→ {a.name}</option>)}
                          </select>
                          <button onClick={() => removeDraft(row.ym, it.id)} style={{ ...linkBtn, fontSize:10, padding:0, marginLeft:"auto" }}>{tr("刪除")}</button>
                        </div>
                      </div>
                      {numInput({ value:it.amt || "", onChange:e => patchDraft(row.ym, it.id, { amt:+digits(e.target.value)||0 }), style:{ fontSize:13, padding:"6px 8px" } })}
                    </div>
                  ))}
                  <button onClick={() => addDraft(row.ym)} style={{ width:"100%", padding:"9px 10px", background:"none", border:"none", color:C.accentL, fontWeight:700, fontSize:11, cursor:"pointer", textAlign:"left" }}>＋ {tr("新增收入")}</button>
                </div>

                {/* 這個月的錢怎麼分 */}
                <div style={{ marginTop:10, borderRadius:12, background:C.card, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:colRigid, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{tr("固定支出")}</div>
                      <div style={{ fontSize:10, color:C.muted }}>
                        {tr("投資＋生活費")}
                        {row.isRigidOverride && <>・{tr("已手動修改")} <button onClick={() => setRigidOverride(row.ym, null)} style={{ ...linkBtn, fontSize:10, padding:0, color:C.accentL }}>{tr("恢復自動")}</button></>}
                      </div>
                    </div>
                    {numInput({ key:`${row.ym}_${row.rigid}`, defaultValue:row.rigid, onChange:e => { e.target.value = digits(e.target.value); },
                      onBlur:e => { const v = e.target.value; if (v === "" ? row.isRigidOverride : +v !== row.rigid) setRigidOverride(row.ym, v === "" ? null : +v); },
                      onKeyDown:e => { if (e.key === "Enter") e.target.blur(); }, style:{ fontSize:13, padding:"6px 8px" } })}
                  </div>
                  <button onClick={jumpToGoalSchedule} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:"none", border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:colGoal, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{tr("存進目標")}</div>
                      <div style={{ fontSize:10, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {row.sinkingBreakdown?.length ? row.sinkingBreakdown.map(x => `${x.emoji||""}${x.name} ${fmt(x.alloc)}`).join("・") : tr("這個月沒有")}
                      </div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color:C.text }}>{fmt(row.sinkingAlloc)}</span>
                    <span style={{ fontSize:10, color:C.muted }}>↓</span>
                  </button>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px", background:`${colLeft}12` }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:colLeft, flexShrink:0 }} />
                    <div style={{ flex:1, fontSize:12, fontWeight:800, color:colLeft }}>{tr("剩餘")}</div>
                    <span style={{ fontSize:14, fontWeight:900, color:colLeft }}>{fmt(row.overflowAmt)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* ── 各目標每月存多少 ── */}
    <div ref={goalScheduleRef}>
      {sectionTitle(tr("各目標每月存多少"), <span style={{ fontSize:10, color:C.muted }}>{tr("點數字可改")}</span>)}
    </div>
    <div style={{ display:"flex", gap:12, fontSize:10, color:C.muted, margin:"-2px 2px 8px" }}>
      <span><span style={{ color:C.accentL, fontWeight:800 }}>🔁</span> {tr("定期定額，改了會從那個月起都改")}</span>
      <span><span style={{ color:C.teal, fontWeight:800 }}>🧠</span> {tr("已套用，只改那個月")}</span>
    </div>
    {yearlyGoalSchedule.length === 0 ? (
      <div style={{ fontSize:11, color:C.muted, padding:"12px 14px", borderRadius:16, background:C.card }}>{tr("還沒有「專案存錢池」類型的目標")}</div>
    ) : (
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {yearlyGoalSchedule.map(g => (
          <div key={g.id} style={{ padding:"12px 14px", borderRadius:16, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.emoji} {g.name}</span>
              <span style={{ fontSize:10, color:C.muted, flexShrink:0 }}>{tr("還差")} {fmt(g.totalNeeded)}・{tr("剩")} {g.monthsLeft} {tr("個月")}</span>
            </div>
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingTop:6, paddingBottom:2 }}>
              {g.perMonth.map(m => {
                const chipKey = `${g.id}_${m.ym}`;
                const isEditing = editingChip === chipKey;
                const tint = m.isApplied ? C.teal : m.isRecurring ? C.accentL : null;
                return (
                  <div key={m.ym} style={{ position:"relative", flex:"0 0 auto", minWidth:58, textAlign:"center", padding:"7px 4px", borderRadius:10, background:tint ? `${tint}18` : C.bg }}>
                    {m.isApplied && !isEditing && (
                      <button onClick={(e) => { e.stopPropagation(); removeSavingsTarget(m.ym, g.id); }} title={tr("移除套用")}
                        style={{ position:"absolute", top:-6, right:-4, width:16, height:16, borderRadius:"50%", background:C.surface || C.card, color:C.muted, border:`1px solid ${C.border}`, fontSize:9, lineHeight:"14px", padding:0, cursor:"pointer" }}>✕</button>
                    )}
                    <div onClick={() => !isEditing && setEditingChip(chipKey)} style={{ cursor:"pointer" }}>
                      <div style={{ fontSize:9, color:C.muted }}>{m.label.split("/")[1]}{tr("月")}{m.isApplied?" 🧠":m.isRecurring?" 🔁":""}</div>
                      {isEditing ? (
                        <input
                          autoFocus type="text" inputMode="decimal" defaultValue={m.alloc}
                          onChange={e => { e.target.value = digits(e.target.value); }}
                          onBlur={e => {
                            const val = +e.target.value || 0;
                            if (m.isRecurring && !m.isApplied && g.recurringMode !== "shares") {
                              // 這個月的數字是「定期定額」算出來的（不是股數模式，股數模式要換算股價比較複雜，改回目標設定頁排時間表比較準）：
                              // 直接改這裡等於改排程「從這個月起」的金額，跟目標編輯頁排的時間表是同一份資料
                              updateGoalRecurringSchedule(g.id, m.ym, val);
                            } else {
                              const accId = g.accIds?.[0] || null;
                              const bucketId = !accId ? (g.bucketIds?.[0] || null) : null;
                              setSavingsTarget(m.ym, accId, bucketId, val, `年度預測手動調整：${g.name}`, g.id);
                            }
                            setEditingChip(null);
                          }}
                          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                          style={{ ...iSt, width:50, padding:"2px 4px", fontSize:11, fontWeight:700, textAlign:"center" }}
                        />
                      ) : (
                        <div style={{ fontSize:12, fontWeight:800, color:tint || C.text, marginTop:2 }}>{fmt(m.alloc)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* ── 次要設定 ── */}
    <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"2px 14px", marginTop:18 }}>
      <button onClick={() => { close(); setTimeout(() => setModal("allocEngine"), 50); }} style={{ ...linkBtn, color:C.accentL }}>← {tr("回智慧分流")}</button>
      {isLaterStart
        ? <button onClick={() => setAllocSettings({ planStartYm:"" })} style={{ ...linkBtn, color:C.teal }}>📌 {tr("從")} {allocSettings.planStartYm} {tr("開始")}・{tr("取消")}</button>
        : <button onClick={startNextMonthPlan} style={linkBtn}>{tr("從下個月開始規劃")}</button>}
      <button onClick={() => setShowHelp(p => !p)} style={linkBtn}>{tr("說明")} {showHelp?"▲":"▼"}</button>
    </div>
    {showHelp && (
      <div style={{ fontSize:11, color:C.muted, lineHeight:1.7, marginTop:8, padding:"12px 14px", borderRadius:14, background:C.card }}>
        <div style={{ marginBottom:6 }}>{tr("已過去和本月用實際記帳的收入；之後的月份參考去年同月，沒有資料就用預設收入。點月份可以改那個月的收入來源。")}</div>
        <div style={{ marginBottom:6 }}>{tr("固定支出＝投資＋生活費，可以單月手動改，按「恢復自動」回到預設。")}</div>
        <div>{tr("每個月的收入扣掉固定支出後，依目標優先級分給各目標，剩下的就是剩餘。")}</div>
      </div>
    )}
  </Sheet>;
}
