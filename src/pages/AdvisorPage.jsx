import { useState, useRef, useEffect } from "react";

/* ── 簡易 Markdown 渲染：AI 回覆常常會帶 **粗體**、#### 標題、* 項目符號、--- 分隔線這些格式，
   原本只是原封不動當純文字顯示，語法符號會直接顯示出來很醜。沒有另外裝 markdown 套件（避免多一個依賴），
   自己寫一個輕量版的，涵蓋常見的這幾種就好，不用做到完整規格 ── */
// AI 回覆有時會夾雜簡單的 LaTeX 數學式（例如 $54,067 \div 5,000 \approx 11$），
// 沒裝 KaTeX 這種完整渲染套件，就把常見符號換成看得懂的 Unicode 符號、把 $ 跟反斜線去掉，
// 至少不要讓使用者看到一堆 \div \approx 這種原始語法
function stripLatex(text) {
  const convert = (expr) => expr
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1/$2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\div/g, "÷").replace(/\\times/g, "×").replace(/\\approx/g, "≈")
    .replace(/\\cdot/g, "·").replace(/\\pm/g, "±").replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥").replace(/\\neq/g, "≠").replace(/\\%/g, "%")
    .replace(/\\,|\\;|\\ /g, " ")
    .replace(/[{}]/g, "")
    .replace(/\\/g, "")
    .trim();
  return text
    .replace(/\$\$([^$]+)\$\$/g, (m, expr) => convert(expr))
    .replace(/\$([^$]+)\$/g, (m, expr) => convert(expr));
}
function parseInline(text, C) {
  // 處理單行內的 **粗體**，回傳一個 React 節點陣列
  const parts = stripLatex(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color:C.text }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
// 判斷一行是不是「表格分隔列」，例如 |:---|:---:|---|
const isTableSepRow = (line) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim());
// 把 | a | b | c | 這種一行拆成 ["a","b","c"]（去掉頭尾多餘的 |）
const splitTableRow = (line) => {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map(s => s.trim());
};
function SimpleMarkdown({ text, C }) {
  const lines = text.split("\n");
  const blocks = [];
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) { blocks.push(<ul key={`ul${blocks.length}`} style={{ margin:"4px 0", paddingLeft:18 }}>{listBuf}</ul>); listBuf = []; }
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") { flushList(); i++; continue; }
    if (/^---+$/.test(trimmed)) { flushList(); blocks.push(<hr key={i} style={{ border:"none", borderTop:`1px solid ${C.border}`, margin:"8px 0" }} />); i++; continue; }
    // GFM 表格：一行含 | 的表頭，緊接著下一行是 |---|---| 這種分隔列
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSepRow(lines[i + 1])) {
      flushList();
      const header = splitTableRow(trimmed);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim() !== "" && lines[j].trim().includes("|")) {
        rows.push(splitTableRow(lines[j]));
        j++;
      }
      blocks.push(
        <div key={`tbl${i}`} style={{ overflowX:"auto", margin:"8px 0", WebkitOverflowScrolling:"touch" }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
            <thead>
              <tr>{header.map((h, hi) => <th key={hi} style={{ textAlign:"left", padding:"6px 8px", borderBottom:`2px solid ${C.border}`, color:C.text, fontWeight:900, whiteSpace:"nowrap" }}>{parseInline(h, C)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((cell, ci) => <td key={ci} style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}`, color:C.textSub, verticalAlign:"top" }}>{parseInline(cell, C)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const size = level <= 2 ? 15 : level === 3 ? 14 : 13;
      blocks.push(<div key={i} style={{ fontWeight:900, fontSize:size, color:C.text, marginTop:8, marginBottom:4 }}>{parseInline(heading[2], C)}</div>);
      i++;
      continue;
    }
    const bullet = trimmed.match(/^[*-]\s+(.*)$/);
    if (bullet) {
      listBuf.push(<li key={i} style={{ marginBottom:3 }}>{parseInline(bullet[1], C)}</li>);
      i++;
      continue;
    }
    flushList();
    blocks.push(<div key={i}>{parseInline(line, C)}</div>);
    i++;
  }
  flushList();
  return <div>{blocks}</div>;
}

/* ── 複製用：把 AI 回答的 Markdown 轉成「有格式的 HTML」跟「乾淨的純文字」兩份。
   貼到備忘錄、Notion、Email 這類支援格式的地方會吃 HTML（保留粗體、標題、清單、表格），
   不支援格式的地方（LINE 之類）會拿純文字，不會出現 ** #### 這些符號。
   不帶顏色等樣式，貼到淺色背景的地方才不會變成看不到的白字 ── */
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineHtml = (s) => escHtml(stripLatex(s)).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
const inlinePlain = (s) => stripLatex(s).replace(/\*\*([^*]+)\*\*/g, "$1");
function markdownToRich(text) {
  const lines = text.split("\n");
  const html = [], plain = [];
  let list = [];
  const flushList = () => { if (list.length) { html.push(`<ul>${list.join("")}</ul>`); list = []; } };
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "") { flushList(); plain.push(""); i++; continue; }
    if (/^---+$/.test(trimmed)) { flushList(); html.push("<hr>"); plain.push("────────"); i++; continue; }
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSepRow(lines[i + 1])) {
      flushList();
      const header = splitTableRow(trimmed);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim() !== "" && lines[j].trim().includes("|")) { rows.push(splitTableRow(lines[j])); j++; }
      html.push(`<table border="1" cellpadding="4" style="border-collapse:collapse"><tr>${header.map(h => `<th>${inlineHtml(h)}</th>`).join("")}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${inlineHtml(c)}</td>`).join("")}</tr>`).join("")}</table>`);
      plain.push(header.map(inlinePlain).join("｜"), ...rows.map(r => r.map(inlinePlain).join("｜")));
      i = j;
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      const tag = heading[1].length <= 2 ? "h2" : "h3";
      html.push(`<${tag}>${inlineHtml(heading[2])}</${tag}>`);
      plain.push(inlinePlain(heading[2]));
      i++;
      continue;
    }
    const bullet = trimmed.match(/^[*-]\s+(.*)$/);
    if (bullet) {
      list.push(`<li>${inlineHtml(bullet[1])}</li>`);
      plain.push(`• ${inlinePlain(bullet[1])}`);
      i++;
      continue;
    }
    flushList();
    html.push(`<p>${inlineHtml(trimmed)}</p>`);
    plain.push(inlinePlain(trimmed));
    i++;
  }
  flushList();
  return { html: html.join(""), plain: plain.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}

/* ── 收藏的回答：最新存的排最上面；平常只露出前 3 行，點一下展開完整回答。存的是原文，不能編輯，只能複製或刪除 ── */
function SavedAnswers({ C, tr, advisorSaved, removeAdvisorSaved, confirm }) {
  const [openId, setOpenId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const list = [...advisorSaved].reverse();

  const copy = async (s) => {
    const body = markdownToRich(s.text);
    const srcs = s.sources || [];
    const html = `<h2>${escHtml(s.q)}</h2>${body.html}`
      + (srcs.length ? `<p><b>${escHtml(tr("參考來源"))}：</b></p><ul>${srcs.map(x => `<li><a href="${escHtml(x.uri)}">${escHtml(x.title || x.uri)}</a></li>`).join("")}</ul>` : "");
    const plain = `${s.q}\n\n${body.plain}`
      + (srcs.length ? `\n\n${tr("參考來源")}：\n${srcs.map(x => `• ${x.title || x.uri}：${x.uri}`).join("\n")}` : "");
    const done = () => { setCopiedId(s.id); setTimeout(() => setCopiedId(c => c === s.id ? null : c), 1500); };
    try {
      // 同時放 HTML 跟純文字，貼到哪裡由那個 App 自己挑能用的格式；舊瀏覽器沒有 ClipboardItem 就只放純文字
      if (window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type:"text/html" }),
          "text/plain": new Blob([plain], { type:"text/plain" }),
        })]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      done();
    } catch { alert(plain); }
  };

  if (!list.length) {
    return (
      <div style={{ padding:"40px 24px", textAlign:"center", fontSize:12, color:C.muted, lineHeight:1.8 }}>
        {tr("還沒有收藏的回答。在對話裡按回答下面的「☆ 加入收藏」，就會存到這裡，清空對話也不會消失。")}
      </div>
    );
  }

  return (
    <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))", display:"flex", flexDirection:"column", gap:10 }}>
      {list.map(s => {
        // 短回答本來就不到 3 行，不用顯示「展開」也不用截
        const long = s.text.split("\n").filter(l => l.trim()).length > 3 || s.text.length > 120;
        const open = !long || openId === s.id;
        return (
          <div key={s.id} style={{ padding:"12px 14px", borderRadius:14, background:C.card, border:`1px solid ${C.border}` }}>
            <div onClick={() => long && setOpenId(open ? null : s.id)} style={{ cursor:long?"pointer":"default" }}>
              <div style={{ fontWeight:900, fontSize:13, color:C.text, lineHeight:1.5 }}>{s.q || tr("（沒有問題）")}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2, marginBottom:6 }}>{s.savedAt}</div>
              {/* 收合時用高度截掉，大約露出 3 行（13px × 行高 1.6）；底部漸層蓋掉被切一半的那行 */}
              <div style={{ position:"relative", fontSize:13, lineHeight:1.6, color:C.text, ...(open ? {} : { maxHeight:"4.8em", overflow:"hidden" }) }}>
                <SimpleMarkdown text={s.text} C={C} />
                {!open && <div style={{ position:"absolute", left:0, right:0, bottom:0, height:"1.6em", background:`linear-gradient(transparent, ${C.card})` }} />}
              </div>
              {!open && <div style={{ fontSize:11, color:C.accentL, marginTop:4 }}>{tr("展開")} ▾</div>}
            </div>
            {open && s.sources && s.sources.length > 0 && (
              <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
                <div style={{ fontSize:10, color:C.muted }}>🔍 {tr("參考來源")}：</div>
                {s.sources.map((x, xi) => (
                  <a key={xi} href={x.uri} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.accentL, textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🔗 {x.title || x.uri}</a>
                ))}
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:14, marginTop:8 }}>
              {long && open && <button onClick={() => setOpenId(null)} style={{ marginRight:"auto", fontSize:11, color:C.accentL, background:"none", border:"none", cursor:"pointer", padding:0 }}>{tr("收合")} ▴</button>}
              <button onClick={() => copy(s)} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:0 }}>{copiedId === s.id ? `✅ ${tr("已複製")}` : `📋 ${tr("複製")}`}</button>
              <button onClick={() => confirm(tr("確定刪除這則收藏？"), () => removeAdvisorSaved(s.id))} style={{ fontSize:11, color:C.danger, background:"none", border:"none", cursor:"pointer", padding:0 }}>🗑 {tr("刪除")}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── AI 理財顧問：獨立一頁，跟目標、訂閱一樣是底部導覽切換的頁面，不是彈窗；
   用 Firebase AI Logic（Gemini）回答問題，會自動帶入目前的財務快照當背景資料；
   「查新聞」開關打開時，會改用有連上 Google 搜尋的模型，適合問股價漲跌、財經新聞這種即時性問題 ── */
export default function AdvisorPage({
  tab, setTab, C, iSt, Btn, tr,
  aiEnabled, aiGroundedEnabled, advisorHistory, advisorLoading, advisorError, sendAdvisorMessage, clearAdvisorHistory, advisorCooldownUntil,
  advisorSaved, toggleAdvisorSaved, removeAdvisorSaved, confirm,
}) {
  const [view, setView] = useState("chat"); // "chat" 對話 / "saved" 收藏
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
  }, [advisorHistory, advisorLoading, view]);

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
        {/* 對話／收藏切換：收藏的回答放同一頁，不另開頁面 */}
        <div style={{ display:"flex", gap:4, marginTop:10, padding:3, borderRadius:12, background:C.card, border:`1px solid ${C.border}` }}>
          {[{ k:"chat", l:`💬 ${tr("對話")}` }, { k:"saved", l:`⭐ ${tr("收藏")}${advisorSaved.length ? ` (${advisorSaved.length})` : ""}` }].map(o => (
            <button key={o.k} onClick={() => setView(o.k)} style={{ flex:1, padding:"6px 0", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              background:view===o.k?C.accent:"transparent", color:view===o.k?"#fff":C.muted }}>{o.l}</button>
          ))}
        </div>
      </div>

      {view === "saved" ? (
        <SavedAnswers C={C} tr={tr} advisorSaved={advisorSaved} removeAdvisorSaved={removeAdvisorSaved} confirm={confirm} />
      ) : !aiEnabled ? (
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
                  {m.role === "model" && (() => {
                    // 這則回答對應的問題：就是它前一則使用者訊息
                    const q = advisorHistory[i - 1]?.role === "user" ? advisorHistory[i - 1].text : "";
                    const saved = advisorSaved.some(s => s.q === q && s.text === m.text);
                    return (
                      <button onClick={() => toggleAdvisorSaved(q, m)} style={{ marginTop:4, padding:"2px 0", background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, color:saved?C.accentL:C.muted }}>
                        {saved ? `⭐ ${tr("已收藏")}` : `☆ ${tr("加入收藏")}`}
                      </button>
                    );
                  })()}
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
