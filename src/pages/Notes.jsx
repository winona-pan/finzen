import { useState } from "react";

export default function NotesPage({ 
  C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, confirm, TODAY,
  accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
  stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
  ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo,
  setSettleDebt, setEditDebt, setND, setSettleAcc, setSettleCustomAmt,
  // 接收全域 UI Atoms 元件
  Card, SH, Bdg, Btn
}) {

  // 表單預設值
  const D0 = { type:"receivable", person:"", amt:"", desc:"", date:TODAY, note:"", installTotal:0, installAmt:"", installPaid:0, installPaidAmt:0 };

  return (
    <>
      {tab === "notes" && (
        <div style={{ padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>👥</span><span style={{ fontWeight:900, fontSize:16, color:C.text }}>往來帳</span></div>
            <Btn onClick={() => { setND(D0); setModal("addDebt"); }} sz="sm">＋ 新增</Btn>
          </div>
          
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {[{ l:"別人欠我 💚", v:totRec, c:C.teal, t:"receivable" }, { l:"我欠別人 🟡", v:totPay, c:C.warn, t:"payable" }].map(k => (
              <Card key={k.t} style={{ padding:16, borderColor:`${k.c}55` }}>
                <div style={{ fontSize:11, fontWeight:900, color:k.c, marginBottom:4 }}>{k.l}</div>
                <div style={{ fontWeight:900, fontSize:20, color:k.c }}>{fmt(k.v)}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{debts.filter(d => d.type === k.t && !d.settled).length} 筆</div>
              </Card>
            ))}
          </div>
          
          {["receivable","payable"].map(dt => {
            const items = debts.filter(x => x.type === dt && !x.settled);
            if (!items.length) return null;
            return (
              <div key={dt} style={{ marginBottom:20 }}>
                <SH title={dt === "receivable" ? "應收款 💚" : "應付款 🟡"} right={`NT$${items.reduce((s, d) => s + d.amt, 0).toLocaleString()}`} />
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {items.map(d => (
                    <Card key={d.id} style={{ padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}><span style={{ fontWeight:900, fontSize:14, color:C.text }}>{d.person}</span><Bdg color={dt === "receivable" ? C.teal : C.warn}>{dt === "receivable" ? "欠我" : "我欠"}</Bdg>{d.srcTxnId && <Bdg color={C.accent}>自動</Bdg>}</div>
                          <div style={{ fontSize:12, color:C.textSub }}>{d.desc}</div>
                          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                            {d.date}
                            {d.date && (() => {
                              const daysLeft = Math.ceil((new Date(d.date) - new Date(TODAY)) / 86400000);
                              if (daysLeft < 0) return <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:6, background:`${C.danger}22`, color:C.danger, fontWeight:700, fontSize:11 }}>⚠️ 逾期 {Math.abs(daysLeft)} 天</span>;
                              if (daysLeft <= 3) return <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:6, background:`${C.warn}22`, color:C.warn, fontWeight:700, fontSize:11 }}>⏰ {daysLeft === 0 ? "今天到期！" : `${daysLeft} 天後到期`}</span>;
                              if (daysLeft <= 7) return <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:6, background:`${C.teal}15`, color:C.teal, fontSize:11 }}>{daysLeft} 天後</span>;
                              return null;
                            })()}
                          </div>
                        </div>
                        <div style={{ fontWeight:900, fontSize:15, color:dt === "receivable" ? C.teal : C.warn, marginLeft:12 }}>{fmt(d.amt)}</div>
                      </div>
                      {d.note && <div style={{ fontSize:12, padding:"8px 12px", borderRadius:8, background:`${C.border}88`, color:C.textSub, fontStyle:"italic", marginBottom:10 }}>"{d.note}"</div>}
                      
                      {/* Installment progress */}
                      {d.installTotal > 0 && (
                        <div style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                            <span style={{ color:C.textSub }}>分期進度</span>
                            <span style={{ color:C.warn }}>{d.installPaid||0}/{d.installTotal}期 · 剩 {fmt(d.amt - (d.installPaidAmt||0))}</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, background:C.warn, width:`${Math.min(100,((d.installPaid||0)/d.installTotal)*100)}%` }} /></div>
                        </div>
                      )}
                      
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn v="secondary" sz="sm" onClick={() => { setEditDebt({...d}); setModal("editDebt"); }}>✏️</Btn>
                        <Btn v="teal" style={{ flex:1 }} onClick={() => { setSettleDebt(d); setSettleAcc(""); setModal("settleDebt"); }}>✓ {d.installTotal > 0 ? (dt==="receivable"?"收一期":"付一期") : (dt==="receivable"?"確認收款":"結清")}</Btn>
                        <Btn v="danger" sz="sm" onClick={() => upd("debts", p => p.filter(x => x.id !== d.id))}>🗑</Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          
          {debts.filter(d => d.settled).length > 0 && (
            <div>
              <SH title="已結清 ✅" />
              {debts.filter(d => d.settled).map(d => (
                <Card key={d.id} style={{ padding:"12px 16px", marginBottom:6, opacity:.4 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div><span style={{ fontSize:14, fontWeight:700, color:C.text }}>{d.person}</span><span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{d.desc}</span></div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}><span style={{ fontWeight:900, fontSize:13, color:C.muted }}>{fmt(d.amt)}</span><button onClick={() => upd("debts", p => p.filter(x => x.id !== d.id))} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16 }}>✕</button></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
