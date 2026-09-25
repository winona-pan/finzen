import { useState, useRef, useEffect } from "react";

/* ── 簡易 Markdown 渲染：AI 回覆常常會帶 **粗體**、#### 標題、* 項目符號、--- 分隔線這些格式，
   原本只是原封不動當純文字顯示，語法符號會直接顯示出來很醜。沒有另外裝 markdown 套件（避免多一個依賴），
   自己寫一個輕量版的，涵蓋常見的這幾種就好，不用做到完整規格 ── */
function parseInline(text, C) {
  // 處理單行內的 **粗體**，回傳一個 React 節點陣列
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color:C.text }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
function SimpleMarkdown({ text, C }) {
  const lines = text.split("\n");
  const blocks = [];
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) { blocks.push(<ul key={`ul${blocks.length}`} style={{ margin:"4px 0", paddingLeft:18 }}>{listBuf}</ul>); listBuf = []; }
  };
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === "") { flushList(); return; }
    if (/^---+$/.test(trimmed)) { flushList(); blocks.push(<hr key={i} style={{ border:"none", borderTop:`1px solid ${C.border}`, margin:"8px 0" }} />); return; }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const size = level <= 2 ? 15 : level === 3 ? 14 : 13;
      blocks.push(<div key={i} style={{ fontWeight:900, fontSize:size, color:C.text, marginTop:8, marginBottom:4 }}>{parseInline(heading[2], C)}</div>);
      return;
    }
    const bullet = trimmed.match(/^[*-]\s+(.*)$/);
    if (bullet) {
      listBuf.push(<li key={i} style={{ marginBottom:3 }}>{parseInline(bullet[1], C)}</li>);
      return;
    }
    flushList();
    blocks.push(<div key={i}>{parseInline(line, C)}</div>);
  });
  flushList();
  return <div>{blocks}</div>;
}

/* ── AI 理財顧問：獨立一頁，跟目標、訂閱一樣是底部導覽切換的頁面，不是彈窗；
   用 Firebase AI Logic（Gemini）回答問題，會自動帶入目前的財務快照當背景資料；
   「查新聞」開關打開時，會改用有連上 Google 搜尋的模型，適合問股價漲跌、財經新聞這種即時性問題 ── */
export default function AdvisorPage({
  tab, setTab, C, iSt, Btn, tr,
  aiEnabled, aiGroundedEnabled, advisorHistory, advisorLoading, advisorError, sendAdvisorMessage, clearAdvisorHistory, advisorCooldownUntil,
}) {
  const [draft, setDraft] = useState("");
  const [grounded, setGrounded] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  /* 免費額度有「每分鐘限制」，緊接著上一句馬上問下一句容易撞到；這裡每秒更新一次倒數秒數，
     時間到之前把送出鎖住，畫面上直接顯示還要等幾秒，不用讓你自己猜 */
  useEffect(() => {
    const tick = () => setCooldownLeft(Math.max(0, Math.ceil((advisorCooldownUntil - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [advisorCooldownUntil]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ block:"end" });
  }, [advisorHistory, advisorLoading]);

  /* 輸入框跟著打字內容變高（最多到一個高度就自己捲動），不要一行長長的 */
  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };
  useEffect(() => { autoGrow(); }, [draft]);

  if (tab !== "advisor") return null;

  const suggestions = ["我這個月存得夠多嗎？", "生活費是不是快超支了？", "幫我看看我的目標排程合不合理", "我的投資部位風險會太集中嗎？", "我適合哪一種理財方法？", "我的資產配置有什麼可以改善的？"].map(tr);

  const submit = () => {
    const text = draft.trim();
    if (!text || advisorLoading || cooldownLeft > 0) return;
    setDraft("");
    sendAdvisorMessage(text, grounded);
  };

  return (
    <div>
      <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTab("settings")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:18, padding:0, marginRight:4 }}>←</button>
          <div>
            <div style={{ fontWeight:900, fontSize:16, color:C.text }}>🤖 {tr("AI 理財顧問")}</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{tr("會參考你完整的資產、收支、投資、目標資料回答；免費額度大約一天20次左右，用完要等隔天")}</div>
          </div>
        </div>
      </div>

      {!aiEnabled ? (
        <div style={{ padding:"40px 24px", textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🤖</div>
          <div style={{ fontSize:13, color:C.text, fontWeight:700, marginBottom:8 }}>{tr("AI 顧問還沒設定好")}</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>
            {tr("去 Firebase 主控台 → 左側「AI Logic」→「開始使用」，選「Gemini Developer API」（免費、不用連信用卡）跑完設定精靈，就能使用了。")}
          </div>
        </div>
      ) : (
        <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>
          {advisorHistory.length > 0 && (
            <div style={{ textAlign:"right", marginBottom:8 }}>
              <button onClick={clearAdvisorHistory} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>{tr("清空對話")}</button>
            </div>
          )}
          {/* Messages */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:12 }}>
            {advisorHistory.length === 0 && (
              <div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.6 }}>
                  {tr("你可以問我任何跟你目前財務狀況有關的問題，我會參考你的實際收支、目標數字回答。試試看：")}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => sendAdvisorMessage(s, grounded)} style={{ textAlign:"left", padding:"10px 12px", borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:12, fontWeight:700, cursor:"pointer" }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {advisorHistory.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"85%" }}>
                  <div style={{ padding:"10px 14px", borderRadius:14, fontSize:13, lineHeight:1.6, whiteSpace: m.role==="user" ? "pre-wrap" : "normal",
                    background:m.role==="user"?C.accent:C.card, color:m.role==="user"?"#fff":C.text,
                    border:m.role==="user"?"none":`1px solid ${C.border}` }}>
                    {m.role==="user" ? m.text : <SimpleMarkdown text={m.text} C={C} />}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
                      <div style={{ fontSize:10, color:C.muted }}>🔍 {tr("參考來源")}：</div>
                      {m.sources.map((s, si) => (
                        <a key={si} href={s.uri} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.accentL, textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🔗 {s.title || s.uri}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {advisorLoading && (
              <div style={{ display:"flex", justifyContent:"flex-start" }}>
                <div style={{ padding:"10px 14px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, color:C.muted, fontSize:13 }}>{grounded?tr("搜尋中…"):tr("思考中…")}</div>
              </div>
            )}
            {advisorError && (
              <div style={{ padding:"10px 14px", borderRadius:12, background:`${C.danger}18`, border:`1px solid ${C.danger}44`, color:C.danger, fontSize:12 }}>⚠️ {advisorError}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input：跟著打字內容長高的方形輸入框，不是一行長長的 */}
          {aiGroundedEnabled && (
            <button onClick={() => setGrounded(v=>!v)} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, padding:"5px 10px", borderRadius:20, background:grounded?`${C.teal}20`:C.card, border:`1px solid ${grounded?C.teal:C.border}`, color:grounded?C.teal:C.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>
              🔍 {tr("查新聞")}{grounded?`：${tr("開（問股價/新聞用這個）")}`:`：${tr("關")}`}
            </button>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={grounded ? tr("問股價、新聞相關的問題…") : tr("問點什麼…")} disabled={advisorLoading || cooldownLeft > 0} rows={1}
              style={{ ...iSt, flex:1, resize:"none", minHeight:40, maxHeight:120, overflowY:"auto", lineHeight:1.5, fontFamily:"inherit" }} />
            <Btn onClick={submit} disabled={advisorLoading || !draft.trim() || cooldownLeft > 0}>{cooldownLeft > 0 ? `${cooldownLeft}s` : tr("送出")}</Btn>
          </div>
          {cooldownLeft > 0 && <div style={{ fontSize:11, color:C.muted, marginTop:6, textAlign:"center" }}>⏳ {tr("免費額度每分鐘有限制，緊接著上一句馬上問容易失敗，還要等")} {cooldownLeft} {tr("秒才能再問")}</div>}
        </div>
      )}
    </div>
  );
}
