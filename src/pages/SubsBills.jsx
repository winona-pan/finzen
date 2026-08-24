export default function SubsBillsPage({
  C, tab, fmt, upd, setModal, confirm,
  subs, bills, subsMo, billsMo, monthlyEquiv,
  setSelSub, setSelBill, toggleSub, toggleBill,
  collapsed, toggleSection,
  Card, Btn, SwipeRow, InfoBtn
}) {
  return (
    <>
      {tab === "subsbills" && (
        <div style={{ padding:"12px 16px" }}>
          <div style={{ fontWeight:900, fontSize:18, color:C.text, marginBottom:16 }}>🔁 訂閱與基本開銷</div>

          {/* Subscriptions */}
          <button onClick={() => toggleSection("subs")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:collapsed["subs"]?4:8 }}>
            <span style={{ fontSize:13, fontWeight:900, color:C.textSub }}>訂閱管理</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:C.textSub }}>月費約 {fmt(subsMo)}</span>
              <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["subs"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
            </div>
          </button>
          {!collapsed["subs"] && <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
              {[...subs].sort((a,b) => (b.active?1:0)-(a.active?1:0)).map(s => (
                <div key={s.id} style={{ display:"flex", gap:8, alignItems:"stretch" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <SwipeRow onDelete={() => confirm(`確定刪除訂閱「${s.name}」？`, () => upd("subs", p => p.filter(x => x.id !== s.id)))} onEdit={() => { setSelSub({ ...s }); setModal("editSub"); }} onClick={() => { setSelSub({ ...s }); setModal("editSub"); }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.card, borderRadius:14, border:`1px solid ${C.border}`, opacity:s.active ? 1 : .5, cursor:"pointer" }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📱</div>
                        <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{s.name}</div><div style={{ fontSize:12, color:C.muted }}>
                          {s.freq==="week" ? `每週${"日一二三四五六"[(+s.weekday)||1]}` : s.freq==="year" ? `每年${s.yearMonth||1}月${s.day}日` : `每月${s.day}日`} · {s.acc}{s.active && <span style={{ color:C.teal }}> · 啟用</span>}
                        </div></div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontWeight:900, fontSize:14, color:C.expense }}>{fmt(s.amt)}{s.freq==="year"?"/年":s.freq==="week"?"/週":"/月"}</div>
                          {s.freq!=="month" && <div style={{ fontSize:10, color:C.muted }}>≈{fmt(Math.round(monthlyEquiv(s)))}/月</div>}
                        </div>
                      </div>
                    </SwipeRow>
                  </div>
                  <button onClick={() => confirm(s.active ? `確定停用「${s.name}」？` : `確定啟用「${s.name}」？會立刻記一筆本期扣款`, () => toggleSub(s), s.active ? "確認停用" : "確認啟用")} style={{ padding:"0 12px", borderRadius:14, fontSize:12, fontWeight:700, background:s.active ? `${C.teal}25` : `${C.muted}25`, color:s.active ? C.teal : C.muted, border:`1px solid ${s.active ? C.teal : C.muted}44`, cursor:"pointer", flexShrink:0 }}>{s.active ? "啟用" : "停用"}</button>
                </div>
              ))}
              {subs.length === 0 && <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"16px 0" }}>還沒有訂閱</div>}
            </div>
            <Btn onClick={() => setModal("addSub")} v="secondary" style={{ width:"100%" }}>＋ 新增訂閱</Btn>
            <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:6 }}>💡 到期日自動記帳，需重新開啟 App 才會觸發</div>
          </div>}

          {/* Bills */}
          <button onClick={() => toggleSection("bills")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"4px 0", marginBottom:collapsed["bills"]?4:8, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:13, fontWeight:900, color:C.textSub }}>基本開銷</span>
              <InfoBtn msg="適合水電費、房租等固定支出。停用狀態不計入月費，但保留記錄。到期日自動記帳需重新開啟 App 才會觸發。" />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {billsMo > 0 && <span style={{ fontSize:11, color:C.textSub }}>月費約 {fmt(billsMo)}</span>}
              <span style={{ fontSize:14, color:C.muted, display:"inline-block", transform:collapsed["bills"]?"rotate(-90deg)":"rotate(0deg)", transition:"transform .2s" }}>▾</span>
            </div>
          </button>
          {!collapsed["bills"] && <div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
              {[...(bills || [])].sort((a,b) => (b.active?1:0)-(a.active?1:0)).map(b => (
                <div key={b.id} style={{ display:"flex", gap:8, alignItems:"stretch" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <SwipeRow onDelete={() => confirm(`確定刪除「${b.name}」？`, () => upd("bills", p => p.filter(x => x.id !== b.id)))} onEdit={() => { setSelBill({ ...b }); setModal("editBill"); }} onClick={() => { setSelBill({ ...b }); setModal("editBill"); }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.card, borderRadius:14, border:`1px solid ${C.border}`, opacity:b.active ? 1 : .5, cursor:"pointer" }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏠</div>
                        <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{b.name}</div><div style={{ fontSize:12, color:C.muted }}>
                          {b.freq==="week" ? `每週${"日一二三四五六"[(+b.weekday)||1]}` : b.freq==="year" ? `每年${b.yearMonth||1}月${b.day}日` : `每月${b.day}日`}{b.active && <span style={{ color:C.warn }}> · 計算中</span>}
                        </div></div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontWeight:900, fontSize:14, color:b.active ? C.warn : C.muted }}>{fmt(b.amt)}{b.freq==="year"?"/年":b.freq==="week"?"/週":"/月"}</div>
                          {b.freq!=="month" && <div style={{ fontSize:10, color:C.muted }}>≈{fmt(Math.round(monthlyEquiv(b)))}/月</div>}
                        </div>
                      </div>
                    </SwipeRow>
                  </div>
                  <button onClick={() => confirm(b.active ? `確定停用「${b.name}」？` : `確定啟用「${b.name}」？會立刻記一筆本期扣款`, () => toggleBill(b), b.active ? "確認停用" : "確認啟用")} style={{ padding:"0 12px", borderRadius:14, fontSize:12, fontWeight:700, background:b.active ? `${C.warn}25` : `${C.muted}25`, color:b.active ? C.warn : C.muted, border:`1px solid ${b.active ? C.warn : C.muted}44`, cursor:"pointer", flexShrink:0 }}>{b.active ? "開啟" : "停用"}</button>
                </div>
              ))}
              {(bills||[]).length === 0 && <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"16px 0" }}>還沒有基本開銷</div>}
            </div>
            <Btn onClick={() => setModal("addBill")} v="secondary" style={{ width:"100%" }}>＋ 新增基本開銷</Btn>
            <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:6 }}>💡 到期日自動記帳，需重新開啟 App 才會觸發</div>
          </div>}
        </div>
      )}
    </>
  );
}
