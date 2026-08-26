import { useState, useEffect } from "react";

export default function StockModals({ 
  C, modal, close, iSt, fmt, fmtPrice, toTWD, pnlColor, upd, setModal, confirm, TODAY,
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
  showHDP, setShowHDP, doBuy, doSell, doInit, deleteTrade,
  nD, setND, addDebt, editDebt, setEditDebt,
  settleDebt, setSettleDebt, settleAcc, setSettleAcc,
  settleCustomAmt, setSettleCustomAmt, selTxn, setSelTxn,
  saveTxn, delTxn, moExp, moInc, moTxns, addCustomCE, ceMap: _ce, EMOTIONS, emotionReview, updateStockMeta, StockPriceChart, fetchStockRange,
  watchlist, addToWatchlist, removeFromWatchlist, COOLDOWN_MS,
  // 接收全域共用 UI Atoms 元件
  Sheet, Inp, Sl, Fld, CalcInp, Btn, Card, Bdg, SwipeRow
}) {

  // 表單重置預設值
  const BF0 = { acc:"", ticker:"", name:"", market:"TW", shares:"", avgCost:"", totalCost:"", fee:"0", curPrice:"", fromAcc:"" };

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [tradeDraft, setTradeDraft] = useState({ shares:"", price:"" });
  const [tradeMonth, setTradeMonth] = useState(null);
  useEffect(() => { setTradeMonth(null); }, [selStock?.id]);

  /* ── 追高偵測：今日漲幅過大，或買進價明顯高於現有均成本 ── */
  const existingBuyStock = stocks.find(s => s.ticker === buyF.ticker && s.acc === buyF.acc);
  const existingBuySum = existingBuyStock ? stSum.find(s => s.id === existingBuyStock.id) : null;
  const buyChgPct = existingBuyStock?._extra?.chgPct;
  const priceEntered = +buyF.avgCost || 0;
  const isChasingHigh = (buyChgPct !== undefined && buyChgPct > 3) || (existingBuySum?.avgCost > 0 && priceEntered > existingBuySum.avgCost * 1.08);

  /* ── 部位大小風控：這筆買進佔總資產的比重 ── */
  const buyTotalCost = +buyF.totalCost || ((+buyF.shares||0) * (+buyF.avgCost||0)) + (+buyF.fee||0);
  const posPct = totAssets > 0 ? (buyTotalCost / totAssets * 100) : 0;
  const isOverConcentrated = posPct > 20;

  const handleConfirmBuy = () => {
    if (isChasingHigh && !(buyF.buyReason || "").trim()) { setAttemptedSubmit(true); return; }
    setAttemptedSubmit(false);
    doBuy();
  };
  const handleCooldown = () => {
    if (!buyF.ticker) return;
    addToWatchlist({ ticker:buyF.ticker, name:buyF.name, market:buyF.market, acc:buyF.acc, note:buyF.buyReason || "" });
    setBuyF(BF0); setAttemptedSubmit(false); close();
  };

  return (
    <>
        {modal === "buyStock" && <Sheet title="記錄買入" onClose={close}>
          <Sl label="證券帳戶" value={buyF.acc} onChange={e => setBuyF(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.filter(a => a.type === "investment").map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</Sl>
          
          {/* 記憶上次買入 */}
          {stocks.length > 0 && <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>📌 重複買入（點選帶入）</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {[...new Map(stocks.map(s=>[s.ticker,s])).values()].map(s => (
                <button key={s.ticker} onClick={() => setBuyF(p => ({ ...p, ticker:s.ticker, name:s.name, market:s.market, acc:p.acc||s.acc }))}
                  style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:buyF.ticker===s.ticker?`${C.accent}30`:C.card, color:buyF.ticker===s.ticker?C.accentL:C.textSub, border:`1px solid ${buyF.ticker===s.ticker?C.accent:C.border}`, cursor:"pointer" }}>
                  {s.ticker}
                </button>
              ))}
            </div>
          </div>}
          
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div>
              <Inp label="股票代號" placeholder="0050 / AAPL" value={buyF.ticker} onChange={e => setBuyF(p => ({ ...p, ticker:e.target.value.toUpperCase().replace(/\.TW$|\.US$/i,"") }))} />
              {buyF.ticker.includes(".") && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>⚠️ 不需要加 .TW 或 .US</div>}
            </div>
            <Inp label="股票名稱" placeholder="元大台灣50" value={buyF.name} onChange={e => setBuyF(p => ({ ...p, name:e.target.value }))} />
          </div>
          <Sl label="市場" value={buyF.market} onChange={e => setBuyF(p => ({ ...p, market:e.target.value }))}><option value="TW">台股 TW</option><option value="US">美股 US</option></Sl>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="股數" type="number" placeholder="1000" value={buyF.shares} onChange={e => setBuyF(p => ({ ...p, shares:e.target.value, totalCost:p.avgCost?String(Math.round(+e.target.value*+p.avgCost+(+p.fee||0))):p.totalCost }))} />
            <Inp label="均成本（每股）" type="number" placeholder="63" value={buyF.avgCost} onChange={e => setBuyF(p => ({ ...p, avgCost:e.target.value, totalCost:p.shares?String(Math.round(+p.shares*+e.target.value+(+p.fee||0))):p.totalCost }))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <CalcInp label="投資總成本（自動算好，一樣可以改）" value={buyF.totalCost} onChange={v => setBuyF(p => ({ ...p, totalCost:v, avgCost:p.shares&&+p.shares>0?String(((+v-(+p.fee||0))/+p.shares).toFixed(2)):p.avgCost }))} />
            <Inp label="手續費" type="number" placeholder="0" value={buyF.fee} onChange={e => setBuyF(p => ({ ...p, fee:e.target.value, totalCost:(p.shares&&p.avgCost)?String(Math.round(+p.shares*+p.avgCost+(+e.target.value||0))):p.totalCost }))} />
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:-4, marginBottom:8 }}>投資總成本會自動幫你算（股數×均成本＋手續費），你也可以直接改這個數字，均成本會反推更新。</div>
          <Sl label="從哪個帳戶扣款（選填）" value={buyF.fromAcc} onChange={e => setBuyF(p => ({ ...p, fromAcc:e.target.value }))}><option value="">— 不扣款 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name} ({fmt(a.bal, a.cur)})</option>)}</Sl>
          <Fld label="這筆是什麼心態下買的？（選填，事後回顧用）">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {EMOTIONS.map(em => <button key={em.key} onClick={() => setBuyF(p => ({ ...p, emotion:p.emotion===em.key?"":em.key }))} style={{ padding:"6px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:buyF.emotion===em.key?`${em.color}28`:C.card, color:buyF.emotion===em.key?em.color:C.muted, border:`1px solid ${buyF.emotion===em.key?em.color:C.border}`, cursor:"pointer" }}>{em.icon} {em.label}</button>)}
            </div>
          </Fld>

          {isOverConcentrated && <div style={{ padding:12, borderRadius:12, marginBottom:4, background:`${C.warn}15`, border:`1px solid ${C.warn}55` }}>
            <div style={{ fontSize:12, fontWeight:900, color:C.warn }}>⚠️ 這筆會佔總資產約 {posPct.toFixed(1)}%，部位偏重，注意分散風險</div>
          </div>}

          {isChasingHigh && <div style={{ padding:12, borderRadius:12, marginBottom:4, background:`${C.warn}15`, border:`1px solid ${C.warn}55` }}>
            <div style={{ fontSize:13, fontWeight:900, color:C.warn, marginBottom:6 }}>🔥 追高警示</div>
            <div style={{ fontSize:12, color:C.textSub, marginBottom:8, lineHeight:1.5 }}>
              {buyChgPct !== undefined && buyChgPct > 3 ? `今天已經上漲 ${buyChgPct.toFixed(1)}%，` : ""}
              {existingBuySum?.avgCost > 0 && priceEntered > existingBuySum.avgCost * 1.08 ? `目前買價比你的均成本（${fmt(Math.round(existingBuySum.avgCost))}）高出不少，` : ""}
              先寫下這筆為什麼還要買，冷靜想清楚再送出。
            </div>
            <textarea value={buyF.buyReason || ""} onChange={e => setBuyF(p => ({ ...p, buyReason:e.target.value }))} placeholder="例如：基本面轉強、長線布局、非短期追價…" rows={2} style={{ ...iSt, resize:"none", fontFamily:"inherit" }} />
            {attemptedSubmit && !(buyF.buyReason || "").trim() && <div style={{ fontSize:11, color:C.expense, marginTop:6, fontWeight:700 }}>請先寫下理由才能送出</div>}
          </div>}

          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={handleConfirmBuy}>確認買入</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          {buyF.ticker && <button onClick={handleCooldown} style={{ width:"100%", marginTop:8, padding:10, borderRadius:12, background:"transparent", border:`1px dashed ${C.border}`, color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            🧊 先別急，加入冷靜清單（{COOLDOWN_MS/3600000} 小時後再決定）
          </button>}
        </Sheet>}

        {modal === "sellStock" && (() => {
          const st = stSum.find(s => s.id === sellF.stockId);
          if (!st) return null;
          return <Sheet title="賣出股票" onClose={close}>
            <Fld label="選擇持股">
              <select value={sellF.stockId} onChange={e => {
                const s = stSum.find(x => x.id === e.target.value);
                if (s) setSellF(p => ({ ...p, stockId:s.id, shares:String(s.totalSh), totalProceeds:s.curPrice>0?String(Math.round(s.curPrice*s.totalSh)):"", pnl:s.curPrice>0?String(Math.round(Math.abs(s.upnl))):"", pnlType:s.upnl>=0?"income":"expense" }));
              }} style={iSt}>
                {stSum.filter(s => s.totalSh > 0).map(s => (
                  <option key={s.id} value={s.id}>{s.ticker} {s.name} · {s.totalSh}股 · {s.acc}</option>
                ))}
              </select>
            </Fld>
            <div style={{ padding:10, borderRadius:10, marginBottom:8, background:C.card, fontSize:12 }}>
              <div style={{ fontWeight:900, fontSize:13, color:C.text, marginBottom:2 }}>{st.ticker} {st.name}</div>
              <div style={{ color:C.textSub }}>持股 <strong style={{ color:C.accentL }}>{st.totalSh}股</strong> · 均成本 {fmtPrice(st.avgCost||0)}{st.curPrice>0?` · 現價 ${fmtPrice(st.curPrice)}`:""}</div>
            </div>
            <Inp label="賣出股數" type="number" placeholder={String(st.totalSh)} value={sellF.shares} onChange={e => setSellF(p => ({ ...p, shares:e.target.value }))} />
            <CalcInp label="賣出總金額" value={sellF.totalProceeds} onChange={v => setSellF(p => ({ ...p, totalProceeds:v }))} />
            <Inp label="手續費（選填）" type="number" placeholder="0" value={sellF.fee||""} onChange={e => setSellF(p => ({ ...p, fee:e.target.value }))} />
            {sellF.shares && <div style={{ marginBottom:12, padding:10, borderRadius:10, background:`${C.accent}10`, fontSize:12, color:C.textSub }}>
              賣出後剩餘：<strong style={{ color:C.accentL }}>{Math.max(0, st.totalSh - +sellF.shares)}股</strong>
            </div>}
            <Fld label="損益記錄（手動）">
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <button onClick={() => setSellF(p => ({ ...p, pnlType:"income" }))} style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, background:sellF.pnlType==="income"?`${C.income}28`:C.card, color:sellF.pnlType==="income"?C.income:C.muted, border:`1px solid ${sellF.pnlType==="income"?C.income:C.border}`, cursor:"pointer" }}>📈 獲利</button>
                <button onClick={() => setSellF(p => ({ ...p, pnlType:"expense" }))} style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, background:sellF.pnlType==="expense"?`${C.expense}28`:C.card, color:sellF.pnlType==="expense"?C.expense:C.muted, border:`1px solid ${sellF.pnlType==="expense"?C.expense:C.border}`, cursor:"pointer" }}>📉 虧損</button>
              </div>
              <CalcInp label="損益金額" value={sellF.pnl} onChange={v => setSellF(p => ({ ...p, pnl:v }))} />
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>填入後會自動在總覽產生收支記錄</div>
            </Fld>
            <Sl label="款項回流帳戶" value={sellF.returnAcc} onChange={e => setSellF(p => ({ ...p, returnAcc:e.target.value }))}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
            <Fld label="這筆是什麼心態下賣的？（選填，事後回顧用）">
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {EMOTIONS.map(em => <button key={em.key} onClick={() => setSellF(p => ({ ...p, emotion:p.emotion===em.key?"":em.key }))} style={{ padding:"6px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:sellF.emotion===em.key?`${em.color}28`:C.card, color:sellF.emotion===em.key?em.color:C.muted, border:`1px solid ${sellF.emotion===em.key?em.color:C.border}`, cursor:"pointer" }}>{em.icon} {em.label}</button>)}
              </div>
            </Fld>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn style={{ flex:1 }} onClick={doSell}>確認賣出</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}

        {modal === "initStock" && <Sheet title="📋 登錄現有持股" onClose={close}>
          <div style={{ padding:"10px 14px", borderRadius:12, background:`${C.teal}15`, border:`1px solid ${C.teal}44`, fontSize:12, color:C.teal, marginBottom:16 }}>
            💡 用於登錄你<strong>已經持有</strong>的股票，不會產生買入記錄，也不會扣款。<br/>之後的買賣再用「＋買入」和「賣出」記錄。
          </div>
          <Sl label="證券帳戶" value={buyF.acc} onChange={e => setBuyF(p => ({ ...p, acc:e.target.value }))}>
            <option value="">— 選擇 —</option>
            {accs.filter(a => a.type === "investment").map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </Sl>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="股票代號" placeholder="0050 / AAPL" value={buyF.ticker} onChange={e => setBuyF(p => ({ ...p, ticker:e.target.value.toUpperCase() }))} />
            <Inp label="股票名稱" placeholder="元大台灣50" value={buyF.name} onChange={e => setBuyF(p => ({ ...p, name:e.target.value }))} />
          </div>
          <Sl label="市場" value={buyF.market} onChange={e => setBuyF(p => ({ ...p, market:e.target.value }))}>
            <option value="TW">台股 TW</option>
            <option value="US">美股 US</option>
          </Sl>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="目前持股數" type="number" placeholder="1000" value={buyF.shares} onChange={e => setBuyF(p => ({ ...p, shares:e.target.value }))} />
            <Inp label="平均成本（每股）" type="number" placeholder="63" value={buyF.avgCost} onChange={e => setBuyF(p => ({ ...p, avgCost:e.target.value }))} />
          </div>
          <CalcInp label="投資總成本（選填）" value={buyF.totalCost} onChange={v => setBuyF(p => ({ ...p, totalCost:v }))} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => {
              if (!buyF.ticker || !buyF.shares) return;
              upd("stocks", p => {
                const ex = p.find(s => s.ticker === buyF.ticker && s.acc === buyF.acc);
                if (ex) {
                  return p.map(s => s.id === ex.id ? {
                    ...s,
                    name: buyF.name || s.name,
                    manualShares: +buyF.shares,
                    manualAvgCost: buyF.avgCost ? +buyF.avgCost : s.manualAvgCost,
                    manualTotalCost: buyF.totalCost ? +buyF.totalCost : s.manualTotalCost,
                  } : s);
                }
                return [...p, {
                  id: "s"+Date.now(), acc:buyF.acc,
                  ticker:buyF.ticker, name:buyF.name||buyF.ticker,
                  market:buyF.market, curPrice:0,
                  manualShares: +buyF.shares,
                  manualAvgCost: buyF.avgCost ? +buyF.avgCost : null,
                  manualTotalCost: buyF.totalCost ? +buyF.totalCost : null,
                  trades: [],
                }];
              });
              if (buyF.acc && buyF.totalCost) {
                upd("accs", p => p.map(a => a.name === buyF.acc ? { ...a, bal: a.bal + +buyF.totalCost } : a));
              }
              setBuyF(BF0); close();
            }}>登錄持股</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "stockDetail" && selStock && (() => {
          const st = stSum.find(s => s.id === selStock.id) || selStock;
          const hasPrice = st.curPrice > 0;
          const pnl = hasPrice ? st.upnl : 0;
          const pnlPct = st.totalCost > 0 && hasPrice ? (pnl / st.totalCost * 100) : 0;
          const extra = st._extra || {};
          const inst = extra.institutional || {};
          const hasInst = inst.foreign !== undefined || inst.trust !== undefined;
          return <Sheet title={`${st.ticker} ${st.name}`} onClose={close}>
            <Card style={{ padding:16, marginBottom:12, background:`linear-gradient(135deg,${C.surface},${C.bg})` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:hasPrice?10:0 }}>
                <div><div style={{ fontSize:10, color:C.textSub, marginBottom:3 }}>市值</div>
                  <div style={{ fontWeight:900, fontSize:15, color:C.accentL }}>{hasPrice ? fmt(st.mv) : <span style={{ color:C.muted, fontSize:12 }}>載入中…</span>}</div></div>
                <div><div style={{ fontSize:10, color:C.textSub, marginBottom:3 }}>投入成本</div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{fmt(st.totalCost)}</div></div>
                <div><div style={{ fontSize:10, color:C.textSub, marginBottom:3 }}>持股</div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{st.totalSh} 股</div></div>
              </div>
              {hasPrice && <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>現價</div>
                  <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{fmtPrice(st.curPrice)}/股</div>
                  <div style={{ fontSize:10, color:C.muted }}>均 {fmt(Math.round(st.avgCost||0))}/股</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>未實現損益</div>
                  <div style={{ fontWeight:900, fontSize:16, color:pnlColor(pnl, C) }}>{pnl >= 0 ? "▲ +" : "▼ "}{fmt(Math.abs(pnl))}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:pnlColor(pnl, C) }}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</div>
                </div>
              </div>}
              {st.lastUpdated && <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>更新：{st.lastUpdated}</div>}
              <a href={`https://news.google.com/search?q=${encodeURIComponent(st.ticker + " " + (st.name||""))}`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:8, padding:"6px 10px", borderRadius:8, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, color:C.accentL, fontWeight:700, fontSize:11, textDecoration:"none" }}>📰 查這支股票的新聞 →</a>
            </Card>

            {hasPrice && (extra.high || extra.low || extra.vol) && <Card style={{ padding:14, marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:900, color:C.muted, marginBottom:8, letterSpacing:"0.08em" }}>今日行情</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[{l:"最高", v:extra.high, c:C.income}, {l:"最低", v:extra.low, c:C.expense},
                  {l:"成交量", v:extra.vol ? (extra.vol>1000?`${(extra.vol/1000).toFixed(0)}K`:extra.vol) : null, c:C.text},
                  {l:"漲跌幅", v:extra.chgPct!==undefined?`${extra.chgPct>=0?"+":""}${extra.chgPct}%`:null, c:pnlColor(extra.chgPct||0,C)}
                ].map(({l,v,c}) => v ? <div key={l}><div style={{ fontSize:10, color:C.textSub }}>{l}</div><div style={{ fontWeight:700, fontSize:13, color:c }}>{typeof v==="number"?fmt(v):v}</div></div> : null)}
              </div>
            </Card>}

            <Card style={{ padding:14, marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:900, color:C.muted, marginBottom:8, letterSpacing:"0.08em" }}>股價走勢</div>
              <StockPriceChart ticker={st.ticker} market={st.market} fetchStockRange={fetchStockRange} />
            </Card>

            <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.08em", color:C.muted, marginBottom:8 }}>持股資料</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Inp label="股數（自動）" type="number" value={String(st.totalSh)}
                onChange={e => upd("stocks", p => p.map(s => s.id===st.id ? {...s, manualShares:+e.target.value} : s))} style={{...iSt, color:C.accentL}} />
              <Inp label="均成本（自動）" type="number"
                value={String(st.totalSh>0&&st.totalCost>0?(st.totalCost/st.totalSh).toFixed(2):(st.manualAvgCost||0))}
                onChange={e => { const avg=+e.target.value; upd("stocks",p=>p.map(s=>s.id===st.id?{...s,manualAvgCost:avg,manualTotalCost:s.totalSh>0?Math.round(avg*s.totalSh):s.manualTotalCost}:s)); }} />
            </div>
            <Inp label="投資總成本（自動）" type="number" value={String(Math.round(st.totalCost||0))}
              onChange={e => { const cost=+e.target.value; upd("stocks",p=>p.map(s=>s.id===st.id?{...s,manualTotalCost:cost,manualAvgCost:s.totalSh>0?+(cost/s.totalSh).toFixed(2):s.manualAvgCost}:s)); }} />

            <div style={{ padding:12, borderRadius:12, background:`${C.danger}10`, border:`1px solid ${C.danger}33`, margin:"10px 0" }}>
              <div style={{ fontSize:11, fontWeight:900, color:C.danger, marginBottom:8 }}>🔴 停損提醒</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:C.textSub, flexShrink:0 }}>虧損超過</span>
                <input type="number" min="1" max="100" placeholder="15"
                  value={st.stopLossPct || ""}
                  onChange={e => upd("stocks", p => p.map(s => s.id===st.id ? {...s, stopLossPct:+e.target.value||null} : s))}
                  style={{...iSt, width:70, flex:"none"}} />
                <span style={{ fontSize:13, color:C.textSub, flexShrink:0 }}>% 時顯示警示</span>
                {st.stopLossPct && <button onClick={() => upd("stocks", p => p.map(s => s.id===st.id ? {...s, stopLossPct:null} : s))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:12 }}>✕</button>}
              </div>
              {st.stopLossPct && <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>
                停損線：均成本 {fmtPrice(st.avgCost||0)} × (1−{st.stopLossPct}%) ≈ {fmtPrice((st.avgCost||0)*(1-st.stopLossPct/100))} /股
                {hasPrice && pnlPct <= -Math.abs(st.stopLossPct) && <span style={{ color:C.danger, fontWeight:900 }}> ⚠️ 已達停損！</span>}
              </div>}
            </div>

            <Fld label="產業別（選填，用於資產配置圖）">
              <input value={st.sector || ""} onChange={e => updateStockMeta(st.id, { sector:e.target.value })} placeholder="例如：半導體、金融、ETF…" style={iSt} />
            </Fld>

            {totAssets > 0 && (() => {
              const posPct = ((hasPrice ? st.mv : st.totalCost) / totAssets * 100);
              return (
                <div style={{ padding:10, borderRadius:10, background:posPct > 20 ? `${C.warn}15` : `${C.card}`, border:`1px solid ${posPct > 20 ? C.warn+"55" : C.border}`, marginBottom:4 }}>
                  <div style={{ fontSize:11, color:C.textSub }}>這檔佔總資產比重</div>
                  <div style={{ fontSize:14, fontWeight:900, color:posPct > 20 ? C.warn : C.text }}>{posPct.toFixed(1)}%{posPct > 20 ? "　⚠️ 部位偏重，注意集中風險" : ""}</div>
                </div>
              );
            })()}
            
            {(st.trades||[]).length > 0 && (() => {
              const sortedTrades = [...st.trades].sort((a,b) => b.date.localeCompare(a.date));
              const tMonths = [...new Set(sortedTrades.map(t => t.date.slice(0,7)))].sort().reverse();
              const curYm = tradeMonth || tMonths[0];
              const monthTrades = sortedTrades.filter(t => t.date.slice(0,7) === curYm);
              const curIdx = tMonths.indexOf(curYm);
              return <div style={{ margin:"14px 0" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.08em", color:C.muted }}>交易紀錄（共 {st.trades.length} 筆）</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <button onClick={() => setTradeMonth(tMonths[curIdx+1])} disabled={curIdx>=tMonths.length-1} style={{ background:"none", border:"none", cursor:curIdx>=tMonths.length-1?"default":"pointer", color:C.textSub, fontSize:16, opacity:curIdx>=tMonths.length-1?0.3:1 }}>‹</button>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text, minWidth:50, textAlign:"center" }}>{curYm.slice(0,4)}/{curYm.slice(5,7)}</span>
                    <button onClick={() => setTradeMonth(tMonths[curIdx-1])} disabled={curIdx<=0} style={{ background:"none", border:"none", cursor:curIdx<=0?"default":"pointer", color:C.textSub, fontSize:16, opacity:curIdx<=0?0.3:1 }}>›</button>
                  </div>
                </div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:8 }}>點一筆可以編輯股數/單價；編輯或刪除都不會自動調整帳戶餘額，需要的話請自行到錢包調整</div>
                <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                  {monthTrades.map((t, i) => (
                  <div key={t.id||i}>
                  {editingTrade === t.id ? (
                    <div style={{ padding:"10px 4px", borderTop:i>0?`1px solid ${C.border}`:undefined, background:`${C.accent}08` }}>
                      <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>股數</div>
                          <input type="number" value={tradeDraft.shares} onChange={e => setTradeDraft(d => ({ ...d, shares:e.target.value }))} style={{ ...iSt, padding:"6px 8px" }} />
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:C.textSub, marginBottom:2 }}>單價</div>
                          <input type="number" value={tradeDraft.price} onChange={e => setTradeDraft(d => ({ ...d, price:e.target.value }))} style={{ ...iSt, padding:"6px 8px" }} />
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => {
                          const newShares = +tradeDraft.shares||0, newPrice = +tradeDraft.price||0;
                          if (newShares === t.shares && newPrice === t.price) { setEditingTrade(null); return; }
                          confirm(`確定修改這筆${t.type==="buy"?"買進":"賣出"}紀錄？會影響這檔股票的總股數/成本/總資產顯示`, () => {
                            upd("stocks", p => p.map(s => s.id===st.id ? { ...s, trades:s.trades.map(x => x.id===t.id ? { ...x, shares:newShares, price:newPrice, totalCost: x.type==="buy" ? newPrice*newShares+(x.fee||0) : x.totalCost } : x) } : s));
                            setEditingTrade(null);
                          }, "確認編輯");
                        }} style={{ flex:1, padding:8, borderRadius:8, background:C.accent, color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>完成</button>
                        <button onClick={() => setEditingTrade(null)} style={{ padding:"8px 16px", borderRadius:8, background:C.card, color:C.text, border:`1px solid ${C.border}`, fontWeight:700, fontSize:12, cursor:"pointer" }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <SwipeRow onDelete={() => confirm(t.linkedTxnId ? `刪除這筆${t.type==="buy"?"買進":"賣出"}紀錄？帳戶餘額會一併退回` : `刪除這筆${t.type==="buy"?"買進":"賣出"}紀錄？（這筆是舊資料，沒有連動帳戶，不會自動退回帳戶餘額）`, () => deleteTrade(st.id, t.id))} onClick={() => { setEditingTrade(t.id); setTradeDraft({ shares:String(t.shares), price:String(t.price) }); }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 4px", borderTop:i>0?`1px solid ${C.border}`:undefined }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:t.type==="buy"?`${C.income}15`:`${C.expense}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:t.type==="buy"?C.income:C.expense, flexShrink:0 }}>{t.type==="buy"?"買":"賣"}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:C.text, fontWeight:700 }}>{t.shares} 股 ＠ {fmtPrice(t.price)}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{t.date}{t.emotion ? `・${EMOTIONS.find(e=>e.key===t.emotion)?.icon||""}${EMOTIONS.find(e=>e.key===t.emotion)?.label||""}` : ""}</div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontWeight:900, fontSize:13, color:C.text }}>{fmt(Math.round(t.type==="buy" ? (t.totalCost||(t.shares*t.price+(t.fee||0))) : (t.shares*t.price-(t.fee||0))))}</div>
                          {t.type==="sell" && t.pnl != null && <div style={{ fontSize:11, color:pnlColor(t.pnl,C) }}>{t.pnl>=0?"+":""}{fmt(Math.round(t.pnl))}</div>}
                        </div>
                        <span style={{ color:C.muted, fontSize:12 }}>✏️</span>
                      </div>
                    </SwipeRow>
                  )}
                  </div>
                ))}
                </div>
              </div>;
            })()}

            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <Btn v="warn" style={{ flex:1 }} onClick={() => {
                const proceeds=hasPrice?String(Math.round(st.curPrice*st.totalSh)):"";
                const autoPnl=hasPrice?String(Math.round(Math.abs(pnl))):"";
                setSellF({stockId:st.id,shares:String(st.totalSh),totalProceeds:proceeds,fee:"",pnl:autoPnl,pnlType:pnl>=0?"income":"expense",returnAcc:""});
                setModal("sellStock");
              }}>賣出 {st.ticker}</Btn>
            </div>
            <Btn v="danger" style={{ width:"100%", marginTop:8 }} onClick={() => confirm(`確定刪除 ${st.ticker}？（不會自動退回帳戶餘額，需要的話請自行到錢包調整）`,()=>{upd("stocks",p=>p.filter(s=>s.id!==st.id));close();})}>🗑 刪除此持股</Btn>
          </Sheet>;
        })()}
    </>
  );
}
