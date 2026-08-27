/* ── 外觀主題：獨立一頁，跟其他「更多」頁的卡片一樣 ── */
export default function ThemeModal({ modal, close, C, changeTheme, THEMES, theme }) {
  if (modal !== "theme") return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:220, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.75)" }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div style={{ width:"100%", maxWidth:480, maxHeight:"88dvh", background:C.surface, border:`1px solid ${C.borderL}`, borderRadius:"24px 24px 0 0", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 12px", borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ fontWeight:900, fontSize:16, color:C.text, margin:0 }}>🎨 外觀主題</h3>
          <button onClick={close} style={{ width:32, height:32, borderRadius:10, background:C.card, border:"none", cursor:"pointer", color:C.textSub, fontSize:18 }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {Object.entries(THEMES).map(([k, th]) => (
              <button key={k} onClick={() => changeTheme(k)}
                style={{ padding:"14px 12px", borderRadius:14, border:`2px solid ${theme===k ? th.accent : C.border}`,
                  background: theme===k ? `${th.accent}20` : C.card, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                <span style={{ fontSize:22 }}>{th.icon}</span>
                <div>
                  <div style={{ fontWeight:900, fontSize:14, color: theme===k ? th.accent : C.text }}>{th.name}</div>
                  <div style={{ display:"flex", gap:3, marginTop:4 }}>
                    {[th.bg, th.accent, th.income, th.expense].map((col,i) => (
                      <div key={i} style={{ width:11, height:11, borderRadius:3, background:col, border:"1px solid rgba(128,128,128,0.2)" }} />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
