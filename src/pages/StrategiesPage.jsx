/* ── 理財策略：獨立一頁，跟「更多」裡的外觀主題、使用手冊一樣點進來；從圖表頁 50/30/20 點進來的話，← 會回到圖表頁 ── */
export default function StrategiesPage({ tab, setTab, pageBack, goals, createEmergencyFund, confirm, C, tr }) {
  if (tab !== "strategies") return null;
  const hasEmergencyFund = (goals||[]).some(g => g.isEmergencyFund);
  const go = (t) => setTab(t);
  const link = (label, onClick) => <button onClick={onClick} style={{ background:"none", border:"none", padding:0, marginTop:8, color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer" }}>{label} ›</button>;
  const items = [
    { icon:"🚨", title:tr("緊急預備金"), body:tr("先存 3～6 個月的生活費當緩衝，跟旅費、3C 這種「想要」的目標分開。"), extra: hasEmergencyFund
      ? <div style={{ fontSize:11, color:C.teal, marginTop:8 }}>✓ {tr("已經建立了")}</div>
      : <div style={{ display:"flex", gap:8, marginTop:10 }}>
          {[3, 6].map(n => (
            <button key={n} onClick={() => confirm(tr(`用「生活費預算 × ${n}個月」建立一個優先級最高的緊急預備金目標？`), () => createEmergencyFund(n), tr("建立"))} style={{ flex:1, padding:9, borderRadius:10, background:`${C.accent}18`, border:"none", color:C.accentL, fontWeight:700, fontSize:12, cursor:"pointer" }}>{tr(`建立 ${n} 個月份`)}</button>
          ))}
        </div> },
    { icon:"📊", title:tr("50/30/20 法則"), body:tr("收入分成需要 50%、想要 30%、儲蓄 20%。"), extra: link(tr("看這個月的比例"), () => go("charts")) },
    { icon:"0️⃣", title:tr("零基預算"), body:tr("每一塊錢都要有去處，分到剩 0 為止。智慧分流就是照這個邏輯：收入先扣投資、生活費，剩下依序分給目標，分不完的才是剩餘。") },
    { icon:"🪣", title:tr("多桶理財法"), body:tr("依時間長短分桶：短期（1 年內）、中期（3～5 年）、長期（退休）。目標的「分類」填短期／中期／長期，同分類會自動合併顯示。"), extra: link(tr("去目標頁"), () => go("goals")) },
    { icon:"❄️", title:tr("債務雪球／雪崩法"), body:tr("還沒做。目前的往來帳記的是代墊和應收應付，不是貸款或分期，之後需要再加。") },
  ];
  return (
    <div>
      <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTab(pageBack || "settings")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:18, padding:0, marginRight:4 }}>←</button>
          <span style={{ fontSize:18 }}>📚</span>
          <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{tr("理財策略")}</span>
        </div>
      </div>
      <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>
        <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
          {items.map((it, i) => (
            <div key={it.title} style={{ display:"flex", gap:12, padding:"16px 14px", borderTop:i>0?`1px solid ${C.border}`:"none" }}>
              <div style={{ width:34, height:34, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{it.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{it.title}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:4, lineHeight:1.7 }}>{it.body}</div>
                {it.extra}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
