/* ── 語言：獨立一頁，跟目標、訂閱一樣是底部導覽切換的頁面，不是彈窗 ── */
export default function LanguagePage({ tab, setTab, C, lang, changeLang, LANGUAGES }) {
  if (tab !== "language") return null;

  return (
    <div>
      <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTab("settings")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:18, padding:0, marginRight:4 }}>←</button>
          <span style={{ fontSize:18 }}>🌐</span>
          <span style={{ fontWeight:900, fontSize:16, color:C.text }}>語言</span>
        </div>
      </div>
      <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>
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
  );
}
