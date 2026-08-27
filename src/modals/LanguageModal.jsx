/* ── 語言：獨立一頁，跟其他「更多」頁的卡片一樣 ── */
export default function LanguageModal({ modal, close, C, lang, changeLang, LANGUAGES }) {
  if (modal !== "language") return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:220, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.75)" }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div style={{ width:"100%", maxWidth:480, maxHeight:"88dvh", background:C.surface, border:`1px solid ${C.borderL}`, borderRadius:"24px 24px 0 0", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 12px", borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ fontWeight:900, fontSize:16, color:C.text, margin:0 }}>🌐 語言</h3>
          <button onClick={close} style={{ width:32, height:32, borderRadius:10, background:C.card, border:"none", cursor:"pointer", color:C.textSub, fontSize:18 }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))" }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:16, lineHeight:1.6 }}>
            目前涵蓋底部導覽、常用按鈕、設定頁主要標題；其他頁面的詳細文字還在陸續翻譯中，沒翻到的地方會顯示繁體中文。
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {Object.entries(LANGUAGES).map(([k, l]) => (
              <button key={k} onClick={() => changeLang(k)}
                style={{ padding:"14px 12px", borderRadius:14, border:`2px solid ${lang===k ? C.accent : C.border}`,
                  background: lang===k ? `${C.accent}20` : C.card, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                <span style={{ fontSize:22 }}>{l.flag}</span>
                <span style={{ fontWeight:700, fontSize:14, color: lang===k ? C.accentL : C.text }}>{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
