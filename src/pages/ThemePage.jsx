/* ── 外觀主題：獨立一頁，跟目標、訂閱一樣是底部導覽切換的頁面，不是彈窗 ── */
export default function ThemePage({ tab, setTab, C, changeTheme, THEMES, theme }) {
  if (tab !== "theme") return null;

  return (
    <div>
      <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTab("settings")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:18, padding:0, marginRight:4 }}>←</button>
          <span style={{ fontSize:18 }}>🎨</span>
          <span style={{ fontWeight:900, fontSize:16, color:C.text }}>外觀主題</span>
        </div>
      </div>
      <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>
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
  );
}

