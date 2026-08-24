import { useState, useRef } from "react";

export default function TxnModals({ 
  C, modal, close, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, expensePools, buckets,
  savingsTargets, setSavingsTarget, removeSavingsTarget, savingsProgress, curYm, nextYm, curSavingsTarget, nextSavingsTarget, financialSuggestion,
  goalCurrentAmount, isGoalArchived, allocSettings, setAllocSettings, computeAllocation, doAccountTransfer, offsetGoal, setOffsetGoal, guiltFreeGauge, updateBucket, passiveMo,
  getSweptAmount, addSweptAmount,
  incomeSchedule, setIncomeSchedule, yearlySchedule, yearlyGoalSchedule, yearlyForecastTable, getIncomeItems, setIncomeItems, setDefaultIncomeItems,
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
  const addTxn = () => {
    if (!nT.amt) return;
    const id = Date.now();
    const validProxies = nT.proxy ? nT.proxyList.filter(p => p.person && +p.amt > 0) : [];
    const totalProxyAmt = validProxies.reduce((s, p) => s + +p.amt, 0);
    const ownAmt = +nT.amt - totalProxyAmt;

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
      const acc = accs.find(a => a.name === nT.acc);
      if (acc) {
        if (acc.type === "credit") {
          upd("accs", p => p.map(a => a.id === acc.id ? { ...a, payable: (a.payable || 0) + (+nT.amt) } : a));
        } else {
          upd("accs", p => p.map(a => a.name === nT.acc ? { ...a, bal: a.bal - (+nT.amt) } : a));
        }
      }
      // 建立應收帳款
      validProxies.forEach(pr => {
        upd("debts", p => [...p, { id: "d" + Date.now() + Math.random(), type: "receivable", person: pr.person, amt: +pr.amt, desc: `代墊：${nT.desc || nT.cat}`, date: nT.date, settled: false, srcTxnId: id }]);
      });
    } else {
      // 無代墊普通記帳
      const t = { ...nT, id, amt: +nT.amt, proxyAmt: 0, proxyFor: "", proxyList: [] };
      upd("txns", p => [...p, t]);
      const acc = accs.find(a => a.name === t.acc);
      if (acc) {
        if (t.type === "income") {
          upd("accs", p => p.map(a => a.name === t.acc ? { ...a, bal: a.bal + t.amt } : a));
        } else if (t.type === "expense") {
          if (acc.type === "credit") {
            upd("accs", p => p.map(a => a.id === acc.id ? { ...a, payable: (a.payable || 0) + t.amt } : a));
          } else {
            upd("accs", p => p.map(a => a.name === t.acc ? { ...a, bal: a.bal - t.amt } : a));
          }
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
        {modal === "addTxn" && <Sheet title="新增 / 補記" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"expense", l:"支出 💸", c:C.expense }, { v:"income", l:"收入 💰", c:C.income }].map(o => <TP key={o.v} active={nT.type === o.v} color={o.c} onClick={() => setNT(p => ({ ...p, type:o.v, cat:o.v === "income" ? "薪資" : "食物" }))}>{o.l}</TP>)}
          </div>
          <Fld label="分類"><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {(nT.type === "income" ? cats.income : cats.expense).map(cat => <button key={cat} onClick={() => setNT(p => ({ ...p, cat }))} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:nT.cat === cat ? `${C.accent}30` : C.card, border:`1px solid ${nT.cat === cat ? C.accent : C.border}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>{ceMap[cat] || "📦"}</span><span style={{ fontSize:11, color:nT.cat === cat ? C.accentL : C.textSub }}>{cat.length > 3 ? cat.slice(0, 3) + "…" : cat}</span></button>)}
            <button onClick={() => setModal("catSet")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:C.card, border:`1px dashed ${C.accent}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>➕</span><span style={{ fontSize:11, color:C.accentL }}>新增</span></button>
          </div></Fld>
          <CalcInp label="金額" value={nT.amt} onChange={v => setNT(p => ({ ...p, amt:v }))} />
          <AutoInput label="說明" placeholder="蝦仁蛋炒飯" value={nT.desc} onChange={v => setNT(p => ({ ...p, desc:v }))} history={descHistoryByCat[nT.cat] || []} />
          <AutoInput label="標籤（選填）" placeholder="#標籤" value={nT.tags} onChange={v => setNT(p => ({ ...p, tags:v }))} history={tagsHistory} />
          <Sl label="帳戶" value={nT.acc} onChange={e => setNT(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇帳戶 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label={`日期${nT.date !== TODAY ? " 📅 補記 " + nT.date : ""}`}><input type="date" value={nT.date} onChange={e => setNT(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          
          {nT.type === "expense" && <div style={{ marginBottom:12 }}>
            <button onClick={() => setNT(p => ({ ...p, proxy:!p.proxy }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.proxy ? `${C.warn}22` : C.card, color:nT.proxy ? C.warn : C.textSub, border:`1px solid ${nT.proxy ? C.warn : C.border}`, cursor:"pointer" }}>
              <span>{nT.proxy ? "✅" : "⬜"}</span> 含代墊款項（自動建立應收帳款）
            </button>
            {nT.proxy && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}44` }}>
              {nT.amt && nT.proxyList.length > 1 && <button onClick={() => { const each = Math.round(+nT.amt / nT.proxyList.length); setNT(p => ({ ...p, proxyList:p.proxyList.map(pl => ({ ...pl, amt:String(each) })) })); }} style={{ width:"100%", marginBottom:8, padding:"6px", borderRadius:8, background:`${C.warn}30`, color:C.warn, border:"none", fontSize:12, fontWeight:700, cursor:"pointer" }}>÷ 平均分配（每人 {fmt(Math.round(+nT.amt / nT.proxyList.length))}）</button>}
              {nT.proxyList.map((pl, i) => <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-end", marginBottom:8 }}>
                <div style={{ flex:1 }}><Inp label={`對象 ${i + 1}`} placeholder="朋友A" value={pl.person} onChange={e => setNT(p => ({ ...p, proxyList:p.proxyList.map((x, j) => j === i ? { ...x, person:e.target.value } : x) }))} /></div>
                <div style={{ flex:1 }}><Inp label="金額" type="number" placeholder="350" value={pl.amt} onChange={e => setNT(p => ({ ...p, proxyList:p.proxyList.map((x, j) => j === i ? { ...x, amt:e.target.value } : x) }))} /></div>
                {nT.proxyList.length > 1 && <button onClick={() => setNT(p => ({ ...p, proxyList:p.proxyList.filter((_, j) => j !== i) }))} style={{ width:32, height:38, borderRadius:8, background:C.danger + "22", border:"none", color:C.danger, cursor:"pointer", fontSize:16, marginBottom:12 }}>✕</button>}
              </div>)}
              <button onClick={() => setNT(p => ({ ...p, proxyList:[...p.proxyList, { person:"", amt:"" }] }))} style={{ width:"100%", padding:"6px", borderRadius:8, background:"transparent", border:`1px dashed ${C.warn}`, color:C.warn, fontSize:12, fontWeight:700, cursor:"pointer" }}>＋ 新增代墊對象</button>
              <div style={{ fontSize:12, color:C.warn, marginTop:6 }}>✨ 自動在「往來帳」為每位對象建立應收記錄</div>
            </div>}

            <button onClick={() => setNT(p => ({ ...p, installExp:!p.installExp, installMonths:p.installMonths||"3" }))} style={{ width:"100%", marginTop:8, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.installExp ? `${C.teal}22` : C.card, color:nT.installExp ? C.teal : C.textSub, border:`1px solid ${nT.installExp ? C.teal : C.border}`, cursor:"pointer" }}>
              <span>{nT.installExp ? "✅" : "⬜"}</span> 分期付款（例：分期買家電）
            </button>
            {nT.installExp && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}44` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <Inp label="分幾期" type="number" min="2" placeholder="3" value={nT.installMonths||"3"} onChange={e => setNT(p => ({ ...p, installMonths:e.target.value }))} />
                <div>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>每期約</div>
                  <div style={{ fontWeight:900, fontSize:15, color:C.teal, padding:"9px 0" }}>{nT.amt && nT.installMonths ? fmt(Math.round(+nT.amt / +nT.installMonths)) : "—"}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:C.teal, marginTop:4 }}>💡 帳戶當下不會整筆扣款，改成每月自動認列一部分支出</div>
            </div>}
          </div>}

          {nT.type === "income" && <div style={{ marginBottom:12 }}>
            <button onClick={() => setNT(p => ({ ...p, deferred:!p.deferred }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.deferred ? `${C.teal}22` : C.card, color:nT.deferred ? C.teal : C.textSub, border:`1px solid ${nT.deferred ? C.teal : C.border}`, cursor:"pointer" }}>
              <span>{nT.deferred ? "✅" : "⬜"}</span> 開啟分月認列（收入分期計算）
            </button>
            {nT.deferred && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}44` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <Inp label="分幾個月" type="number" placeholder="4" value={nT.deferMonths} onChange={e => setNT(p => ({ ...p, deferMonths:e.target.value, deferMoAmt:p.amt ? String(Math.round(+p.amt / +(e.target.value || 1))) : "" }))} />
                <Inp label="本月認列" type="number" placeholder="5000" value={nT.deferMoAmt} onChange={e => setNT(p => ({ ...p, deferMoAmt:e.target.value }))} />
              </div>
              <div style={{ fontSize:12, color:C.teal }}>💡 Wallet 顯示全額，Overview 只計本月認列</div>
            </div>}
          </div>}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addTxn}>確認新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
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
          <Sl label="帳戶" value={selTxn.acc || ""} onChange={e => setSelTxn(p => ({ ...p, acc:e.target.value }))}>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label="日期"><input type="date" value={selTxn.date} onChange={e => setSelTxn(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => confirm("確定儲存這筆修改？帳戶餘額會依新舊金額差異自動調整", () => saveTxn(selTxn), "確認編輯")}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "txnDet" && selTxn && <Sheet title="交易明細" onClose={close}>
          <div style={{ borderRadius:14, padding:16, marginBottom:16, background:C.card }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:54, height:54, borderRadius:16, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{ceMap[selTxn.cat] || "📦"}</div>
              <div><div style={{ fontWeight:900, fontSize:15, color:C.text }}>{selTxn.cat}</div><div style={{ fontWeight:900, fontSize:22, color:selTxn.type === "income" ? C.income : C.expense }}>{selTxn.type === "income" ? "+" : "-"}{fmt(selTxn.amt)}</div></div>
            </div>
            {[{ l:"日期", v:selTxn.date }, { l:"說明", v:selTxn.desc || "—" }, { l:"帳戶", v:selTxn.acc || "—" }, { l:"標籤", v:selTxn.tags || "—" }, ...(selTxn.proxyAmt > 0 ? [{ l:"代墊對象", v:selTxn.proxyFor }, { l:"代墊金額", v:fmt(selTxn.proxyAmt) }] : [])].map(r => (
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
              {editPool?.id !== p.id && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>已認列/總額</div><div style={{ fontWeight:700, fontSize:13, color:C.teal }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>}
              <button onClick={() => setEditPool(editPool?.id===p.id ? null : { id:p.id, totalAmt:String(p.totalAmt), recognized:String(p.recognized) })} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, marginLeft:8 }}>✏️</button>
              <button onClick={() => confirm(`確定刪除「${p.desc}」整筆分月認列？連同已認列的紀錄都會一起清除`, () => {
                if (p.originTxnId) { delTxn(p.originTxnId); }
                else { upd("pools", pr => pr.filter(x => x.id !== p.id)); upd("txns", pr => pr.filter(x => x.poolId !== p.id)); }
              }, "確認刪除")} style={{ background:"none", border:"none", cursor:"pointer", color:C.expense, fontSize:14, flexShrink:0, marginLeft:6 }}>🗑</button>
            </div>
            {editPool?.id === p.id && (
              <div style={{ padding:10, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}33`, marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <Inp label="總額" type="number" value={editPool.totalAmt} onChange={e => setEditPool(ep => ({ ...ep, totalAmt:e.target.value }))} />
                  <Inp label="已認列" type="number" value={editPool.recognized} onChange={e => setEditPool(ep => ({ ...ep, recognized:e.target.value }))} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn sz="sm" v="teal" style={{ flex:1 }} onClick={() => {
                    const newTotal = +editPool.totalAmt, newRec = Math.min(+editPool.recognized, newTotal);
                    const diff = newRec - p.recognized;
                    confirm(`確定調整「${p.desc}」？已認列將從 ${fmt(p.recognized)} 改為 ${fmt(newRec)}（${diff>=0?"+":""}${fmt(diff)}），會自動記一筆調整交易`, () => {
                      upd("pools", pr => pr.map(x => x.id===p.id ? { ...x, totalAmt:newTotal, recognized:newRec } : x));
                      if (diff !== 0) upd("txns", pr => [...pr, { id:Date.now(), type: diff>0?"income":"expense", cat: p.cat||"其他收入", amt:Math.abs(diff), desc:`認列調整：${p.desc}`, acc:p.acc||"", date:TODAY, tags:"#認列調整", noBalanceEffect:true, poolId:p.id, poolType:"income", recognizedDiff:diff }]);
                      setEditPool(null);
                    }, "確認調整");
                  }}>儲存</Btn>
                  <Btn sz="sm" v="secondary" style={{ flex:1 }} onClick={() => setEditPool(null)}>取消</Btn>
                </div>
              </div>
            )}
            <div style={{ height:6, borderRadius:3, background:C.border, marginBottom:12 }}><div style={{ height:"100%", borderRadius:3, width:`${Math.min(100,(p.recognized / p.totalAmt * 100)).toFixed(0)}%`, background:C.teal }} /></div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" placeholder={`最多 ${fmt(p.totalAmt - p.recognized)}`} value={selPool?.id === p.id ? recAmt : ""} onFocus={() => setSelPool(p)} onChange={e => setRecAmt(e.target.value)} style={{ ...iSt, flex:1 }} />
              <Btn v="teal" sz="sm" onClick={() => { setSelPool(p); setTimeout(doRecognize, 50); }}>認列</Btn>
            </div>
          </div>)}
        </Sheet>}

        {modal === "expensePools" && <Sheet title="年繳分攤進度" onClose={close}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            這些是開了「分攤認列」的訂閱或支出。扣款/入帳當下就已經是那一筆錢的最終去向了（現金帳戶會扣款、信用卡會計入應付），這裡只是把同一筆錢拆開顯示在每個月的支出統計裡，不會再額外扣一次錢。
          </div>
          {expensePools.filter(p => p.totalAmt - p.recognized > 0).length === 0 && <div style={{ padding:"32px 0", textAlign:"center", color:C.muted }}>目前沒有進行中的分攤</div>}
          {expensePools.filter(p => p.totalAmt - p.recognized > 0).map(p => <div key={p.id} style={{ borderRadius:14, padding:16, marginBottom:12, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.desc}</div><div style={{ fontSize:12, color:C.muted }}>{p.startDate} 開始・每期 {fmt(p.monthlyAmt)}</div></div>
              {editPool?.id !== p.id && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>已認列/總額</div><div style={{ fontWeight:700, fontSize:13, color:C.warn }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>}
              <button onClick={() => setEditPool(editPool?.id===p.id ? null : { id:p.id, totalAmt:String(p.totalAmt), recognized:String(p.recognized) })} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, marginLeft:8 }}>✏️</button>
              <button onClick={() => confirm(`確定刪除「${p.desc}」整筆分攤？連同已扣款、已認列的紀錄都會一起清除`, () => {
                if (p.originTxnId) { delTxn(p.originTxnId); }
                else { upd("expensePools", pr => pr.filter(x => x.id !== p.id)); upd("txns", pr => pr.filter(x => x.poolId !== p.id)); }
              }, "確認刪除")} style={{ background:"none", border:"none", cursor:"pointer", color:C.expense, fontSize:14, flexShrink:0, marginLeft:6 }}>🗑</button>
            </div>
            {editPool?.id === p.id && (
              <div style={{ padding:10, borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <Inp label="總額" type="number" value={editPool.totalAmt} onChange={e => setEditPool(ep => ({ ...ep, totalAmt:e.target.value }))} />
                  <Inp label="已認列" type="number" value={editPool.recognized} onChange={e => setEditPool(ep => ({ ...ep, recognized:e.target.value }))} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn sz="sm" v="warn" style={{ flex:1 }} onClick={() => {
                    const newTotal = +editPool.totalAmt, newRec = Math.min(+editPool.recognized, newTotal);
                    const diff = newRec - p.recognized;
                    const newMonthly = Math.round(newTotal / (p.installments || 12));
                    confirm(`確定調整「${p.desc}」？已認列將從 ${fmt(p.recognized)} 改為 ${fmt(newRec)}（${diff>=0?"+":""}${fmt(diff)}），會自動記一筆調整交易`, () => {
                      upd("expensePools", pr => pr.map(x => x.id===p.id ? { ...x, totalAmt:newTotal, recognized:newRec, monthlyAmt:newMonthly } : x));
                      if (diff !== 0) upd("txns", pr => [...pr, { id:Date.now(), type: diff>0?"expense":"income", cat: p.cat||"其他", amt:Math.abs(diff), desc:`分攤調整：${p.desc}`, acc:p.acc||"", date:TODAY, tags:"#認列調整", noBalanceEffect:true, poolId:p.id, poolType:"expense", recognizedDiff:diff }]);
                      setEditPool(null);
                    }, "確認調整");
                  }}>儲存</Btn>
                  <Btn sz="sm" v="secondary" style={{ flex:1 }} onClick={() => setEditPool(null)}>取消</Btn>
                </div>
              </div>
            )}
            <div style={{ height:6, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, width:`${Math.min(100,(p.recognized / p.totalAmt * 100)).toFixed(0)}%`, background:C.warn }} /></div>
          </div>)}
        </Sheet>}
        {modal === "savingsTarget" && (() => {
          const target = curSavingsTarget;
          return <Sheet title="設定這個月的存錢目標" onClose={close}>
            <SavingsTargetForm
              ym={curYm} target={target} accs={accs} buckets={buckets}
              setSavingsTarget={setSavingsTarget} removeSavingsTarget={removeSavingsTarget}
              confirm={confirm} close={close} C={C} iSt={iSt} fmt={fmt}
              Fld={Fld} Sl={Sl} CalcInp={CalcInp} Inp={Inp} Btn={Btn}
            />
            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>下個月（{nextYm}）也可以先想好</div>
              <SavingsTargetForm
                ym={nextYm} target={nextSavingsTarget} accs={accs} buckets={buckets}
                setSavingsTarget={setSavingsTarget} removeSavingsTarget={removeSavingsTarget}
                confirm={confirm} close={close} C={C} iSt={iSt} fmt={fmt}
                Fld={Fld} Sl={Sl} CalcInp={CalcInp} Inp={Inp} Btn={Btn}
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
              <SmartSuggestApply amount={fs.suggested} buckets={buckets} accs={accs} setSavingsTarget={setSavingsTarget} ym={curYm} confirm={confirm} close={close} C={C} fmt={fmt} Btn={Btn} />
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
            allocSettings={allocSettings} setAllocSettings={setAllocSettings}
            computeAllocation={computeAllocation} financialSuggestion={financialSuggestion}
            getIncomeItems={getIncomeItems} setIncomeItems={setIncomeItems} setDefaultIncomeItems={setDefaultIncomeItems}
            accs={accs} buckets={buckets} setSavingsTarget={setSavingsTarget} doAccountTransfer={doAccountTransfer} curYm={curYm}
            confirm={confirm} close={close} setModal={setModal} C={C} iSt={iSt} fmt={fmt}
            Fld={Fld} Sl={Sl} CalcInp={CalcInp} Inp={Inp} Btn={Btn} Sheet={Sheet}
          />
        )}

        {modal === "yearlyForecast" && (
          <YearlyForecastSheet
            yearlySchedule={yearlySchedule} yearlyGoalSchedule={yearlyGoalSchedule} yearlyForecastTable={yearlyForecastTable}
            setIncomeSchedule={setIncomeSchedule} getIncomeItems={getIncomeItems} setIncomeItems={setIncomeItems} accs={accs} setSavingsTarget={setSavingsTarget}
            close={close} setModal={setModal} C={C} iSt={iSt} fmt={fmt} Btn={Btn} Sheet={Sheet}
          />
        )}

        {modal === "wishOffset" && offsetGoal && (() => {
          const g = offsetGoal;
          const current = goalCurrentAmount(g);
          return <Sheet title={`🎁 ${g.name} 已實現願望`} onClose={close}>
            <div style={{ padding:14, borderRadius:12, background:`${C.teal}12`, border:`1px solid ${C.teal}44`, marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.teal }}>願望池累積金額</div>
              <div style={{ fontSize:22, fontWeight:900, color:C.teal }}>{fmt(current)}</div>
            </div>
            <WishOffsetForm g={g} current={current} accs={accs} buckets={buckets} confirm={confirm} close={close} upd={upd} C={C} iSt={iSt} fmt={fmt} TODAY={TODAY} Fld={Fld} Sl={Sl} CalcInp={CalcInp} Btn={Btn} />
          </Sheet>;
        })()}

        {modal === "sweepMoney" && (
          <SweepMoneySheet title="🧹 月底零錢一鍵掃入" amount={guiltFreeGauge.remaining} amountLabel="這個月生活區還剩下" ym={curYm} kind="leftover" addSweptAmount={addSweptAmount} goals={goals} buckets={buckets} updateBucket={updateBucket} confirm={confirm} close={close} C={C} fmt={fmt} Btn={Btn} Sheet={Sheet} />
        )}

        {modal === "sweepPassive" && (
          <SweepMoneySheet title="🏦 被動收入分配" amount={passiveMo} amountLabel="這個月還沒分配的非勞務收入" ym={curYm} kind="passive" addSweptAmount={addSweptAmount} goals={goals} buckets={buckets} updateBucket={updateBucket} confirm={confirm} close={close} C={C} fmt={fmt} Btn={Btn} Sheet={Sheet} />
        )}
    </>
  );
}

/* ── 智慧建議：選擇要把建議存款金額套用到哪個子帳戶 ── */
function SmartSuggestApply({ amount, buckets, accs, setSavingsTarget, ym, confirm, close, C, fmt, Btn }) {
  const [bucketId, setBucketId] = useState(buckets[0]?.id || "");
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>要把這筆建議存款設成哪個子帳戶的目標？</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
        {buckets.map(b => (
          <button key={b.id} onClick={() => setBucketId(b.id)} style={{ padding:"6px 12px", borderRadius:10, fontSize:12, fontWeight:700, background:bucketId===b.id?`${C.teal}28`:C.card, color:bucketId===b.id?C.teal:C.muted, border:`1px solid ${bucketId===b.id?C.teal:C.border}`, cursor:"pointer" }}>{b.emoji} {b.name}</button>
        ))}
      </div>
      <Btn style={{ width:"100%" }} onClick={() => {
        const b = buckets.find(x => x.id === bucketId);
        confirm(`確定把這個月的存錢目標設成「${b?.name}」存 ${fmt(amount)}？`, () => {
          setSavingsTarget(ym, null, bucketId, amount, "由智慧建議自動設定");
          close();
        }, "確認設定");
      }}>套用這個建議</Btn>
    </div>
  );
}

/* ── 單一月份的存錢目標設定小表單 ── */
function SavingsTargetForm({ ym, target, accs, buckets, setSavingsTarget, removeSavingsTarget, confirm, close, C, iSt, fmt, Fld, Sl, CalcInp, Inp, Btn }) {
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
          confirm(`確定設定 ${ym} 存錢目標 ${fmt(+amount)}？`, () => {
            setSavingsTarget(ym, kind==="acc"?accId:null, kind==="bucket"?bucketId:null, amount, note);
          }, "確認設定");
        }}>{target?"更新目標":"設定目標"}</Btn>
        {target && <Btn v="danger" onClick={() => confirm(`確定移除 ${ym} 的存錢目標？`, () => removeSavingsTarget(ym), "確認移除")}>移除</Btn>}
      </div>
    </div>
  );
}

/* ── 智慧資金分流引擎：股票優先 → 各目標依優先級 → 生活費（自適應）→ 剩餘進預備金 ── */
function AllocEngineSheet({ allocSettings, setAllocSettings, computeAllocation, financialSuggestion, getIncomeItems, setIncomeItems, setDefaultIncomeItems, accs, buckets, setSavingsTarget, doAccountTransfer, curYm, confirm, close, setModal, C, iSt, fmt, Fld, Sl, CalcInp, Inp, Btn, Sheet }) {
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
  const [showSettings, setShowSettings] = useState(true);
  const [savedDefault, setSavedDefault] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  /* 要套用到哪些月份：預設從目標月份開始，也可以一次勾多個月一起設定存錢目標 */
  const monthOptions = Array.from({ length: 6 }, (_, i) => { const dt = new Date(planStartYm+"-01"); dt.setMonth(dt.getMonth()+i); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; });
  const [applyMonths, setApplyMonths] = useState([planStartYm]);

  const income = incomeItems.reduce((s, it) => s + (+it.amt || 0), 0);
  const investAmt = investAllocs.reduce((s, r) => s + (+r.amt || 0), 0);

  const updateIncomeItems = (next) => { setIncomeItemsLocal(next); setIncomeItems(planStartYm, next); };
  const addIncomeItem = () => updateIncomeItems([...incomeItems, { id:"inc"+Date.now(), label:"", amt:0, accId:"" }]);
  const removeIncomeItem = (id) => updateIncomeItems(incomeItems.filter(it => it.id !== id));
  const patchIncomeItem = (id, patch) => updateIncomeItems(incomeItems.map(it => it.id===id ? { ...it, ...patch } : it));

  const updateInvestAllocs = (next) => { setInvestAllocsLocal(next); setAllocSettings({ investAllocs: next, investAmt: next.reduce((s,r)=>s+(+r.amt||0),0), investAccId: next[0]?.toAccId || "" }); };
  const addInvestAlloc = () => updateInvestAllocs([...investAllocs, { id:"inv"+Date.now(), amt:0, toAccId:"", fromAccId:"" }]);
  const removeInvestAlloc = (id) => updateInvestAllocs(investAllocs.filter(r => r.id !== id));
  const patchInvestAlloc = (id, patch) => updateInvestAllocs(investAllocs.map(r => r.id===id ? { ...r, ...patch } : r));

  const alloc = computeAllocation(income, {
    investAmt,
    livingAmt: livingOverride != null ? +livingOverride : null,
    goalOverrides: Object.fromEntries(Object.entries(goalOverrides).map(([k,v]) => [k, v===""?null:+v])),
  });

  return <Sheet title="🧠 智慧資金分流引擎" onClose={close}>
    <div style={{ fontSize:11, color:C.muted, lineHeight:1.6, marginBottom:14, padding:"10px 12px", borderRadius:10, background:C.card, border:`1px solid ${C.border}` }}>
      這筆錢會依序被分配：① 下面填每一筆收入的來源與金額 → ② 依序扣掉投資、生活費 → ③ 剩下的錢依優先級分給各個目標 → ④ 分不完的全部變成「剩餘資金」。<strong style={{ color:C.text }}>收入填得越高，最後能分配的錢自然越多。</strong>投資分流只是幫你記錄規劃，不會自動幫你轉帳；下面「套用」只會設定各目標的本月存錢提醒。
    </div>

    <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span>💵 這個月的收入來源</span>
      <span style={{ color:C.income, fontWeight:900 }}>合計 {fmt(income)}</span>
    </div>
    <div style={{ borderRadius:10, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:8 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 1fr 24px", gap:4, padding:"6px 8px", background:C.card, fontSize:10, fontWeight:700, color:C.muted }}>
        <span>來源</span><span>金額</span><span>存入帳戶</span><span></span>
      </div>
      {incomeItems.map(it => (
        <div key={it.id} style={{ display:"grid", gridTemplateColumns:"1fr 90px 1fr 24px", gap:4, padding:"6px 8px", borderTop:`1px solid ${C.border}`, alignItems:"center" }}>
          <input value={it.label} onChange={e => patchIncomeItem(it.id, { label:e.target.value })} placeholder="零用錢/薪水…" style={{ ...iSt, padding:"6px 8px", fontSize:12 }} />
          <input type="number" value={it.amt} onChange={e => patchIncomeItem(it.id, { amt:+e.target.value||0 })} placeholder="金額" style={{ ...iSt, padding:"6px 8px", fontSize:12, fontWeight:700 }} />
          <select value={it.accId||""} onChange={e => patchIncomeItem(it.id, { accId:e.target.value })} style={{ ...iSt, padding:"6px 4px", fontSize:11 }}>
            <option value="">— 選填 —</option>
            {accs.filter(a=>a.type!=="credit").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={() => removeIncomeItem(it.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
      ))}
    </div>
    <button onClick={addIncomeItem} style={{ width:"100%", padding:8, borderRadius:10, background:"none", border:`1px dashed ${C.border}`, color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer", marginBottom:6 }}>＋ 新增一筆收入</button>
    {!savedDefault ? (
      <button onClick={() => { setDefaultIncomeItems(incomeItems); setSavedDefault(true); }} style={{ width:"100%", padding:6, background:"none", border:"none", color:C.muted, fontSize:11, cursor:"pointer", marginBottom:8 }}>把這份收入細項設成以後每個月的預設值</button>
    ) : (
      <div style={{ textAlign:"center", fontSize:11, color:C.teal, marginBottom:8 }}>✅ 已設成以後每月的預設收入</div>
    )}

    <button onClick={() => setShowSettings(p=>!p)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 4px", background:"none", border:"none", cursor:"pointer", marginBottom:showSettings?8:14, marginTop:10 }}>
      <span style={{ fontSize:12, fontWeight:700, color:C.muted }}>📊 投資分流規劃（可以分好幾筆到不同帳戶，只記錄不自動轉帳）</span>
      <span style={{ fontSize:12, color:C.muted }}>{showSettings?"▲":"▼"}</span>
    </button>
    {showSettings && (
      <div style={{ padding:12, borderRadius:10, background:C.card, border:`1px solid ${C.border}`, marginBottom:14 }}>
        {investAllocs.map(r => (
          <div key={r.id} style={{ padding:10, borderRadius:10, background:C.bg, border:`1px solid ${C.border}`, marginBottom:8 }}>
            <div style={{ display:"flex", gap:6, marginBottom:6 }}>
              <input type="number" value={r.amt} onChange={e => patchInvestAlloc(r.id, { amt:+e.target.value||0 })} placeholder="金額" style={{ ...iSt, width:100, padding:"6px 8px", fontSize:13, fontWeight:700 }} />
              <button onClick={() => removeInvestAlloc(r.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 4px", marginLeft:"auto" }}>✕</button>
            </div>
            <select value={r.toAccId||""} onChange={e => patchInvestAlloc(r.id, { toAccId:e.target.value })} style={{ ...iSt, width:"100%", padding:"6px 8px", fontSize:12, marginBottom:6 }}>
              <option value="">— 投資目標帳戶（證券戶）—</option>
              {accs.filter(a=>a.type==="investment").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {r.toAccId && (
              <select value={r.fromAccId||""} onChange={e => patchInvestAlloc(r.id, { fromAccId:e.target.value })} style={{ ...iSt, width:"100%", padding:"6px 8px", fontSize:12 }}>
                <option value="">— 從哪個帳戶轉出（純備註，不會自動轉帳）—</option>
                {accs.filter(a=>a.type!=="credit" && a.type!=="investment").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>
        ))}
        <button onClick={addInvestAlloc} style={{ width:"100%", padding:8, borderRadius:10, background:"none", border:`1px dashed ${C.border}`, color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer" }}>＋ 新增一筆投資分流</button>
        <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>這裡的設定會自動存起來，不用另外按套用；實際買進請你自己去操作證券戶。</div>
        {buckets.length > 0 && (
          <div style={{ marginTop:10 }}>
            <Sl label="剩餘資金要設定到哪個子帳戶" value={allocSettings.reserveBucketId||""} onChange={e => setAllocSettings({ reserveBucketId:e.target.value })}>
              <option value="">— 不自動設定 —</option>
              {buckets.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
            </Sl>
          </div>
        )}
      </div>
    )}

    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:12, background:`${C.accent}12`, border:`1px solid ${C.accent}33` }}>
        <div><div style={{ fontSize:12, fontWeight:700, color:C.text }}>📊 股票投資（規劃）</div><div style={{ fontSize:10, color:C.muted }}>依上面投資分流規劃加總，僅供參考</div></div>
        <div style={{ fontWeight:900, fontSize:15, color:C.accentL }}>{fmt(alloc.investAmt)}</div>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
        <div><div style={{ fontSize:12, fontWeight:700, color:C.text }}>🍜 生活費預算</div><div style={{ fontSize:10, color:C.muted }}>自動抓近{alloc.historyMonths}個月平均，可調整</div></div>
        <input type="number" value={livingOverride ?? alloc.livingAmt} onChange={e => setLivingOverride(e.target.value)} style={{ ...iSt, width:90, textAlign:"right", padding:"6px 8px", fontWeight:700 }} />
      </div>

      {alloc.goalAllocs.length > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginTop:4 }}>專案存錢池（依優先級，收入越多分越多）</div>}
      {alloc.goalAllocs.map(g => (
        <div key={g.id} style={{ padding:"12px 14px", borderRadius:12, background:g.isDone?`${C.teal}12`:C.card, border:`1px solid ${g.isDone?C.teal+"44":C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{g.emoji} {g.name} <span style={{ fontSize:10, color:C.muted }}>P{g.priority}</span></div>
              <div style={{ fontSize:10, color:C.muted }}>{g.isDone ? "🎉 已達標" : `剩 ${g.monthsLeft} 個月・進度 ${g.pct.toFixed(0)}%`}</div>
            </div>
            {g.isDone ? (
              <span style={{ fontSize:13, fontWeight:900, color:C.teal }}>—</span>
            ) : (
              <input type="number" value={goalOverrides[g.id] ?? g.alloc} onChange={e => setGoalOverrides(p => ({ ...p, [g.id]:e.target.value }))} style={{ ...iSt, width:90, textAlign:"right", padding:"6px 8px", fontWeight:700 }} />
            )}
          </div>
          <div style={{ height:5, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, width:`${g.pct}%`, background:g.isDone?C.teal:C.accent }} /></div>
        </div>
      ))}
      {alloc.goalAllocs.length === 0 && <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>還沒有設定「專案存錢池」類型的目標</div>}

      {alloc.wishlistAllocs.length > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginTop:4 }}>自由願望池（用剩餘溢流資金填滿）</div>}
      {alloc.wishlistAllocs.map(g => (
        <div key={g.id} style={{ padding:"12px 14px", borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{g.emoji} {g.name} <span style={{ fontSize:10, color:C.muted }}>P{g.priority}</span></div>
              <div style={{ fontSize:10, color:C.muted }}>進度 {g.pct.toFixed(0)}%</div>
            </div>
            <input type="number" value={goalOverrides[g.id] ?? g.alloc} onChange={e => setGoalOverrides(p => ({ ...p, [g.id]:e.target.value }))} style={{ ...iSt, width:90, textAlign:"right", padding:"6px 8px", fontWeight:700 }} />
          </div>
          <div style={{ height:5, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, width:`${g.pct}%`, background:C.accent }} /></div>
        </div>
      ))}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px", borderRadius:12, background:`${C.teal}15`, border:`1px solid ${C.teal}44` }}>
        <div><div style={{ fontSize:13, fontWeight:900, color:C.teal }}>💰 剩餘資金</div><div style={{ fontSize:10, color:C.muted }}>分配完剩下的都存起來</div></div>
        <div style={{ fontWeight:900, fontSize:18, color:C.teal }}>{fmt(alloc.reserveAmt)}</div>
      </div>
    </div>

    <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:6 }}>要套用到哪些月份的存錢目標？</div>
    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
      {monthOptions.map(ym => (
        <button key={ym} onClick={() => setApplyMonths(p => p.includes(ym) ? p.filter(x=>x!==ym) : [...p, ym])}
          style={{ padding:"6px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:applyMonths.includes(ym)?`${C.accent}28`:C.card, color:applyMonths.includes(ym)?C.accentL:C.muted, border:`1px solid ${applyMonths.includes(ym)?C.accent:C.border}`, cursor:"pointer" }}>
          {ym}{ym===planStartYm?"（規劃起點）":ym===curYm?"（本月）":""}
        </button>
      ))}
    </div>

    <Btn style={{ width:"100%" }} disabled={applyMonths.length===0} onClick={() => {
      confirm(`確定把這份分流建議套用到 ${applyMonths.join("、")}？只會設定各目標的存錢目標提醒，不會自動轉帳；年度現金流預測會直接採用這裡套用的數字`, () => {
        applyMonths.forEach(ym => {
          [...alloc.goalAllocs, ...alloc.wishlistAllocs].forEach(g => {
            if (g.alloc <= 0) return;
            const accId = g.accIds?.[0] || null;
            const bucketId = !accId ? (g.bucketIds?.[0] || null) : null;
            setSavingsTarget(ym, accId, bucketId, g.alloc, `智慧分流：${g.name}`, g.id);
          });
          if (allocSettings.reserveBucketId && alloc.reserveAmt > 0) {
            setSavingsTarget(ym, null, allocSettings.reserveBucketId, alloc.reserveAmt, "智慧分流：剩餘資金", "reserve");
          }
        });
        setJustApplied(true);
      }, "確認套用");
    }}>✅ 套用到存錢目標（{applyMonths.length} 個月份）</Btn>
    {justApplied && <div style={{ textAlign:"center", fontSize:12, color:C.teal, fontWeight:700, marginTop:8 }}>✅ 已套用，你可以繼續調整，改完再按一次套用就好</div>}
    <div style={{ fontSize:10, color:C.muted, marginTop:8, lineHeight:1.6 }}>
      套用後：各目標與剩餘資金會設定成對應月份的「存錢目標」提醒，實際存錢／投資動作還是要你自己去操作。上面的收入細項跟投資分流規劃已經即時自動存檔，不用另外按套用。
    </div>
    <button onClick={() => { close(); setTimeout(() => setModal("yearlyForecast"), 50); }} style={{ width:"100%", marginTop:12, padding:10, borderRadius:12, background:"none", border:`1px dashed ${C.border}`, color:C.muted, fontWeight:700, fontSize:12, cursor:"pointer" }}>
      📅 切換到年度現金流預測排程 →
    </button>
    <button onClick={close} style={{ width:"100%", marginTop:8, padding:10, borderRadius:12, background:"none", border:"none", color:C.muted, fontWeight:700, fontSize:12, cursor:"pointer" }}>
      關閉
    </button>
  </Sheet>;
}

/* ── 願望對沖表單：記一筆消費，用願望池對沖，不干擾生活費常態分析 ── */
function WishOffsetForm({ g, current, accs, buckets, confirm, close, upd, C, iSt, fmt, TODAY, Fld, Sl, CalcInp, Btn }) {
  const [price, setPrice] = useState(String(Math.round(current)));
  const linkedBucket = buckets.find(b => (g.bucketIds||[]).includes(b.id));
  const linkedAcc = accs.find(a => (g.accIds||[]).includes(a.id));
  return (
    <div>
      <CalcInp label="實際購買金額" value={price} onChange={setPrice} />
      <div style={{ fontSize:11, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
        會記一筆支出（標記為願望兌現，不會拉高你的「生活費自適應學習」平均值），{linkedBucket ? `並從子帳戶「${linkedBucket.name}」扣除對應金額` : linkedAcc ? "" : "帳戶餘額不會自動變動，因為這個目標沒有連結特定帳戶／子帳戶"}。
      </div>
      <Btn style={{ width:"100%" }} onClick={() => {
        const amt = +price || 0;
        if (amt <= 0) return;
        confirm(`確定記錄「${g.name}」已實現，花費 ${fmt(amt)}？`, () => {
          upd("txns", p => [...p, { id:Date.now(), type:"expense", cat:"其他", amt, desc:`🎁 願望兌現：${g.name}`, acc:linkedAcc?.name||linkedBucket?.name&&accs.find(a=>a.id===linkedBucket.accId)?.name||"", date:TODAY, tags:"#願望兌現" }]);
          if (linkedBucket) upd("buckets", p => (p||[]).map(b => b.id===linkedBucket.id ? { ...b, allocated:Math.max(0, b.allocated-amt) } : b));
          upd("goals", p => p.map(x => x.id===g.id ? { ...x, wishPurchased:true } : x));
          close();
        }, "確認記錄");
      }}>🎁 記錄已實現</Btn>
    </div>
  );
}

/* ── 月底零錢一鍵掃入：生活區結餘掃進願望池或存錢區 ── */
function SweepMoneySheet({ title, amount, amountLabel, ym, kind, addSweptAmount, goals, buckets, updateBucket, confirm, close, C, fmt, Btn, Sheet }) {
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
      confirm(`確定把 ${fmt(amount)} 掃進「${target.label}」？`, () => {
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
function YearlyForecastSheet({ yearlySchedule, yearlyGoalSchedule, yearlyForecastTable, setIncomeSchedule, getIncomeItems, setIncomeItems, accs, setSavingsTarget, close, setModal, C, iSt, fmt, Btn, Sheet }) {
  const [expandedYm, setExpandedYm] = useState(null);
  const [draftItems, setDraftItems] = useState([]);
  const [editingChip, setEditingChip] = useState(null); // `${goalId}_${ym}`
  const matrixRef = useRef(null);

  const openMonth = (ym) => {
    if (expandedYm === ym) { setExpandedYm(null); return; }
    setExpandedYm(ym);
    setDraftItems(getIncomeItems(ym).map(it => ({ ...it, id: it.id || ("inc"+Math.random().toString(36).slice(2)) })));
  };
  const jumpToMonth = (ym) => { openMonth(ym); matrixRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }); };
  const saveDraft = (ym, items) => { setIncomeItems(ym, items); };
  const patchDraft = (ym, id, patch) => { const next = draftItems.map(it => it.id===id ? { ...it, ...patch } : it); setDraftItems(next); saveDraft(ym, next); };
  const addDraft = (ym) => { const next = [...draftItems, { id:"inc"+Date.now(), label:"", amt:0, accId:"" }]; setDraftItems(next); saveDraft(ym, next); };
  const removeDraft = (ym, id) => { const next = draftItems.filter(it => it.id!==id); setDraftItems(next); saveDraft(ym, next); };

  return <Sheet title="📅 年度現金流預測排程" onClose={close}>
    <div style={{ fontSize:11, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
      已經過去或本月會自動帶入實際收入；還沒到的月份預設參考「去年同月」的實際收入（沒有歷史資料才用固定預設值），點一個月份可以展開填各項收入來源，下面的目標排程會自動用「收入高的月多存、低的月少存」重新平滑分配。
    </div>

    <div ref={matrixRef} style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>12 個月收入矩陣（點月份展開填收入來源）</div>
    <div style={{ display:"flex", flexDirection:"column", gap:1, marginBottom:20, maxHeight:320, overflowY:"auto" }}>
      {yearlySchedule.map((m, i) => (
        <div key={m.ym} style={{ background: m.isCurrent ? `${C.accent}12` : "transparent", borderTop:i>0?`1px solid ${C.border}`:undefined, borderRadius:m.isCurrent?8:0 }}>
          <button onClick={() => openMonth(m.ym)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"none", border:"none", cursor:"pointer" }}>
            <span style={{ fontSize:12, color:C.text, fontWeight:m.isCurrent?900:400 }}>{m.label}{m.isCurrent?" (本月)":""}</span>
            {m.actualIncome != null ? (
              <span style={{ fontSize:13, fontWeight:700, color:C.income }}>{fmt(m.actualIncome)}<span style={{ fontSize:10, color:C.muted, fontWeight:400 }}> 實際</span></span>
            ) : (
              <span style={{ fontSize:13, fontWeight:700, color:C.accentL }}>{fmt(m.projected)} <span style={{ fontSize:10, color:C.muted, fontWeight:400 }}>{m.isSeasonalEstimate?"去年同月 ✏️":"預估 ✏️"}</span></span>
            )}
          </button>
          {expandedYm === m.ym && (
            <div style={{ padding:"0 10px 10px" }}>
              <div style={{ borderRadius:10, border:`1px solid ${C.border}`, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr 20px", gap:4, padding:"5px 6px", background:C.card, fontSize:10, fontWeight:700, color:C.muted }}>
                  <span>來源</span><span>金額</span><span>帳戶</span><span></span>
                </div>
                {draftItems.map(it => (
                  <div key={it.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr 20px", gap:4, padding:"5px 6px", borderTop:`1px solid ${C.border}`, alignItems:"center" }}>
                    <input value={it.label} onChange={e => patchDraft(m.ym, it.id, { label:e.target.value })} placeholder="零用錢/薪水…" style={{ ...iSt, padding:"4px 6px", fontSize:11 }} />
                    <input type="number" value={it.amt} onChange={e => patchDraft(m.ym, it.id, { amt:+e.target.value||0 })} style={{ ...iSt, padding:"4px 6px", fontSize:11, fontWeight:700 }} />
                    <select value={it.accId||""} onChange={e => patchDraft(m.ym, it.id, { accId:e.target.value })} style={{ ...iSt, padding:"4px 2px", fontSize:10 }}>
                      <option value="">—</option>
                      {accs.filter(a=>a.type!=="credit").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button onClick={() => removeDraft(m.ym, it.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:12 }}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={() => addDraft(m.ym)} style={{ width:"100%", marginTop:6, padding:6, borderRadius:8, background:"none", border:`1px dashed ${C.border}`, color:C.accentL, fontWeight:700, fontSize:11, cursor:"pointer" }}>＋ 新增收入來源</button>
            </div>
          )}
        </div>
      ))}
    </div>

    <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>12 個月現金流總覽（① 總流入 ② 剛性扣除 ③ 專案存錢 ④ 溢流／剩餘資金）</div>
    <div style={{ overflowX:"auto", marginBottom:20 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
        <thead>
          <tr style={{ background:C.card }}>
            {["月份","①流入","②剛性扣除","③專案存錢","④剩餘資金"].map(h => (
              <th key={h} style={{ padding:"6px 8px", textAlign:"right", fontWeight:700, color:C.muted, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yearlyForecastTable.map(row => (
            <tr key={row.ym} style={{ background: row.isCurrent ? `${C.accent}12` : "transparent", borderTop:`1px solid ${C.border}` }}>
              <td onClick={() => jumpToMonth(row.ym)} style={{ padding:"6px 8px", fontWeight:row.isCurrent?900:400, color:C.text, whiteSpace:"nowrap", cursor:"pointer", textDecoration:"underline", textDecorationStyle:"dotted", textDecorationColor:C.muted }}>{row.label}</td>
              <td onClick={() => jumpToMonth(row.ym)} style={{ padding:"6px 8px", textAlign:"right", color:C.income, cursor:"pointer" }}>{fmt(row.income)} ✏️</td>
              <td style={{ padding:"6px 8px", textAlign:"right", color:C.expense }}>−{fmt(row.rigid)}</td>
              <td style={{ padding:"6px 8px", textAlign:"right", color:C.accentL }}>{fmt(row.sinkingAlloc)}</td>
              <td style={{ padding:"6px 8px", textAlign:"right", color:C.teal }}>{fmt(row.overflowAmt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{ fontSize:10, color:C.muted, marginBottom:8 }}>👆 點「月份」或「①流入」可以跳回上面收入矩陣直接編輯那個月；②③④是系統算出來的，目前不能直接點著改，要改就去調整生活費／投資預設值，或各專案目標的優先級與金額。</div>
    <div style={{ fontSize:10, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
      ②剛性扣除＝固定投資＋生活費（生活費已經包含訂閱與基本開銷在內，不會另外重複扣，都可以在設定頁調整預設值）；③是所有專案存錢池共用同一份月剩餘資金，依優先級分配，細分請看下方各專案排程；④把「自由願望池」跟「剩餘資金」合併呈現。
    </div>

    <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:2 }}>各專案存錢池的排程（🧠＝分流引擎已套用的實際數字，其餘是系統估算，點格子可以直接改）</div>
    {yearlyGoalSchedule.length === 0 ? (
      <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>還沒有「專案存錢池」類型的目標</div>
    ) : yearlyGoalSchedule.map(g => (
      <div key={g.id} style={{ padding:14, borderRadius:12, background:C.card, border:`1px solid ${C.border}`, marginTop:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{g.emoji} {g.name}</span>
          <span style={{ fontSize:11, color:C.muted }}>還差 {fmt(g.totalNeeded)}・剩 {g.monthsLeft} 個月</span>
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
          {g.perMonth.map(m => {
            const chipKey = `${g.id}_${m.ym}`;
            const isEditing = editingChip === chipKey;
            return (
              <div key={m.ym} onClick={() => !isEditing && setEditingChip(chipKey)} style={{ flex:"0 0 auto", minWidth:56, textAlign:"center", padding:"6px 4px", borderRadius:8, background:m.isApplied?`${C.teal}18`:C.bg, border:m.isApplied?`1px solid ${C.teal}44`:"1px solid transparent", cursor:"pointer" }}>
                <div style={{ fontSize:9, color:C.muted }}>{m.label}{m.isApplied?" 🧠":""}</div>
                {isEditing ? (
                  <input
                    autoFocus type="number" defaultValue={m.alloc}
                    onBlur={e => {
                      const val = +e.target.value || 0;
                      const accId = g.accIds?.[0] || null;
                      const bucketId = !accId ? (g.bucketIds?.[0] || null) : null;
                      setSavingsTarget(m.ym, accId, bucketId, val, `年度預測手動調整：${g.name}`, g.id);
                      setEditingChip(null);
                    }}
                    onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                    style={{ ...iSt, width:48, padding:"2px 4px", fontSize:11, fontWeight:700, textAlign:"center" }}
                  />
                ) : (
                  <div style={{ fontSize:11, fontWeight:700, color:m.isApplied?C.teal:C.accentL }}>{fmt(m.alloc)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ))}

    <button onClick={() => { close(); setTimeout(() => setModal("allocEngine"), 50); }} style={{ width:"100%", marginTop:8, padding:12, borderRadius:12, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, color:C.accentL, fontWeight:900, fontSize:13, cursor:"pointer" }}>
      ← 切換回當月執行模式
    </button>
  </Sheet>;
}
