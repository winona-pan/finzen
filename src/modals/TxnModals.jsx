import { useState } from "react";

export default function TxnModals({ 
  C, modal, close, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies, expensePools, buckets,
  savingsTargets, setSavingsTarget, removeSavingsTarget, savingsProgress, curYm, nextYm, curSavingsTarget, nextSavingsTarget,
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
      upd("pools", p => [...p, { id: "p" + id, desc: nT.desc || nT.cat, cat: nT.cat, totalAmt: +nT.amt, recognized: 0, date: nT.date, acc: nT.acc }]);
    }

    if (nT.installExp && +nT.installMonths > 1 && nT.type === "expense" && validProxies.length === 0) {
      const months = +nT.installMonths;
      const totalAmt = +nT.amt;
      upd("txns", p => p.map(x => x.id === id ? { ...x, type: "transfer", cat: "帳戶調整", desc: `分期付款：${nT.desc || nT.cat}（共 ${fmt(totalAmt)}，分 ${months} 期）`, tags: "#分攤認列" } : x));
      upd("expensePools", p => [...(p || []), { id: "ep" + id, desc: nT.desc || nT.cat, cat: nT.cat, totalAmt, monthlyAmt: Math.round(totalAmt / months), installments: months, recognized: 0, startDate: nT.date, acc: nT.acc || "" }]);
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
            <Btn v="danger" style={{ flex:1 }} onClick={() => confirm("確定刪除這筆交易？", () => delTxn(selTxn.id))}>🗑 刪除</Btn>
          </div>
        </Sheet>}

        {modal === "pools" && <Sheet title="認列收入池" onClose={close}>
          {pools.filter(p => p.totalAmt - p.recognized > 0).length === 0 && <div style={{ padding:"32px 0", textAlign:"center", color:C.muted }}>所有收入已完全認列</div>}
          {pools.filter(p => p.totalAmt - p.recognized > 0).map(p => <div key={p.id} style={{ borderRadius:14, padding:16, marginBottom:12, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.desc}</div><div style={{ fontSize:12, color:C.muted }}>{p.date}</div></div>
              {editPool?.id !== p.id && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>已認列/總額</div><div style={{ fontWeight:700, fontSize:13, color:C.teal }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>}
              <button onClick={() => setEditPool(editPool?.id===p.id ? null : { id:p.id, totalAmt:String(p.totalAmt), recognized:String(p.recognized) })} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, marginLeft:8 }}>✏️</button>
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
            <div style={{ height:6, borderRadius:3, background:C.border, marginBottom:12 }}><div style={{ height:"100%", borderRadius:3, width:`${(p.recognized / p.totalAmt * 100).toFixed(0)}%`, background:C.teal }} /></div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" placeholder={`最多 ${fmt(p.totalAmt - p.recognized)}`} value={selPool?.id === p.id ? recAmt : ""} onFocus={() => setSelPool(p)} onChange={e => setRecAmt(e.target.value)} style={{ ...iSt, flex:1 }} />
              <Btn v="teal" sz="sm" onClick={() => { setSelPool(p); setTimeout(doRecognize, 50); }}>認列</Btn>
            </div>
          </div>)}
        </Sheet>}

        {modal === "expensePools" && <Sheet title="年繳分攤進度" onClose={close}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            這些是開了「分攤認列」的訂閱或支出。扣款當下不會整筆算進支出，而是每個月自動認列一部分，直到全額認列完畢。
          </div>
          {expensePools.filter(p => p.totalAmt - p.recognized > 0).length === 0 && <div style={{ padding:"32px 0", textAlign:"center", color:C.muted }}>目前沒有進行中的分攤</div>}
          {expensePools.filter(p => p.totalAmt - p.recognized > 0).map(p => <div key={p.id} style={{ borderRadius:14, padding:16, marginBottom:12, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.desc}</div><div style={{ fontSize:12, color:C.muted }}>{p.startDate} 開始・每期 {fmt(p.monthlyAmt)}</div></div>
              {editPool?.id !== p.id && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>已認列/總額</div><div style={{ fontWeight:700, fontSize:13, color:C.warn }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>}
              <button onClick={() => setEditPool(editPool?.id===p.id ? null : { id:p.id, totalAmt:String(p.totalAmt), recognized:String(p.recognized) })} style={{ background:"none", border:"none", cursor:"pointer", color:C.accentL, fontSize:14, flexShrink:0, marginLeft:8 }}>✏️</button>
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
            <div style={{ height:6, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, width:`${(p.recognized / p.totalAmt * 100).toFixed(0)}%`, background:C.warn }} /></div>
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
    </>
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
