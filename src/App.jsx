import OverviewPage  from "./pages/Overview";
import WalletPage    from "./pages/Wallet";
import ChartsPage    from "./pages/Charts";
import NotesPage     from "./pages/Notes";
import InvestPage    from "./pages/Invest";
import SettingsPage  from "./pages/Settings";
import TxnModals     from "./modals/TxnModals";
import WalletModals  from "./modals/WalletModals";
import StockModals   from "./modals/StockModals";
import DebtModals    from "./modals/DebtModals";
import OtherModals   from "./modals/OtherModals";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

/* ── Tokens ── */
const THEMES = {
  dark: {
    bg:"#0d0f14", surface:"#14161e", card:"#1a1d28",
    border:"#252839", borderL:"#303550",
    income:"#f43f5e", expense:"#4ade80",
    accent:"#7c7cf8", accentL:"#a5b4fc", accentD:"#5b5bd6",
    warn:"#fb923c", teal:"#2dd4bf",
    text:"#eef0fa", textSub:"#7c80a0", muted:"#444660", danger:"#ef4444",
    name:"深色", icon:"🌙",
  },
  light: {
    bg:"#f4f6fc", surface:"#ffffff", card:"#ffffff",
    border:"#e2e8f0", borderL:"#cbd5e1",
    income:"#e11d48", expense:"#16a34a",
    accent:"#6366f1", accentL:"#4f46e5", accentD:"#4338ca",
    warn:"#d97706", teal:"#0d9488",
    text:"#1e293b", textSub:"#475569", muted:"#94a3b8", danger:"#dc2626",
    name:"淺色", icon:"☀️",
  },
  purple: {
    bg:"#0e0b1a", surface:"#16112b", card:"#1f1840",
    border:"#2e2550", borderL:"#3d3370",
    income:"#f43f5e", expense:"#34d399",
    accent:"#a855f7", accentL:"#c084fc", accentD:"#9333ea",
    warn:"#f59e0b", teal:"#06b6d4",
    text:"#f3e8ff", textSub:"#a78bfa", muted:"#6d5a9e", danger:"#ef4444",
    name:"紫色", icon:"💜",
  },
  ocean: {
    bg:"#020b18", surface:"#061825", card:"#0a2236",
    border:"#0f3450", borderL:"#1a4a6e",
    income:"#f43f5e", expense:"#4ade80",
    accent:"#0ea5e9", accentL:"#38bdf8", accentD:"#0284c7",
    warn:"#f59e0b", teal:"#14b8a6",
    text:"#e0f2fe", textSub:"#7dd3fc", muted:"#2d6a8a", danger:"#ef4444",
    name:"海洋", icon:"🌊",
  },
};
// C will be set dynamically from theme
let C = THEMES.dark;
function getC(theme) { return THEMES[theme] || THEMES.dark; }
const PIE = ["#f43f5e","#7c7cf8","#4ade80","#fb923c","#06b6d4","#ec4899","#a78bfa","#34d399"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// 台灣時間 UTC+8
const TODAY = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

/* ── Currency ── */
const DEF_RATES = { TWD:1,USD:32.5,EUR:35.2,JPY:0.22,GBP:41.0,HKD:4.17,SGD:24.1,CNY:4.48,KRW:0.024,AUD:21.0,CAD:23.8,CHF:36.5,MYR:7.3,THB:0.93,VND:0.0013 };
const CUR_SYM = { TWD:"NT$",USD:"$",EUR:"€",JPY:"¥",GBP:"£",HKD:"HK$",SGD:"S$",CNY:"¥",KRW:"₩",AUD:"A$",CAD:"C$",CHF:"CHF",MYR:"RM",THB:"฿",VND:"₫" };
const CUR_NAME = { TWD:"新台幣",USD:"美金",EUR:"歐元",JPY:"日圓",GBP:"英鎊",HKD:"港幣",SGD:"新加坡幣",CNY:"人民幣",KRW:"韓元",AUD:"澳幣",CAD:"加幣",CHF:"瑞士法郎",MYR:"馬幣",THB:"泰銖",VND:"越南盾" };
const ALL_CURS = Object.keys(DEF_RATES);
function toTWD(n, cur, rates) { return n * (rates[cur] || 1); }
function fmt(n, cur = "TWD") {
  const s = CUR_SYM[cur] || cur;
  if (cur === "TWD") return `NT$${Math.round(n).toLocaleString()}`;
  if (["JPY","KRW","VND"].includes(cur)) return `${s}${Math.round(n).toLocaleString()}`;
  return `${s}${Number(n).toLocaleString("en", { maximumFractionDigits: 2 })}`;
}

/* ── Constants ── */
const CE = { 食物:"🍔",交通:"🚌",家居:"🏠",娛樂:"🎬",訂閱:"📱",薪資:"💰",家教:"📖",零用錢:"🏮",利息:"🏦",股息:"📈",紅包:"🧧",投資收益:"📈",教育:"🎓",醫療:"💊",美容:"💄",帳戶調整:"✨",其他:"📦",其他收入:"💴",往來帳:"🤝" };
const AT = { cash:"💰",debit:"🏦",investment:"📊",credit:"💳" };
const PASSIVE = ["利息","股息","紅包","投資收益"];
const APP_VER = "2.2";
const DATA_KEY = "finzen_v3";
const VER_KEY = "finzen_ver";

/* ── Default State ── */
const DEF = {
  accs: [
    { id:"a1",name:"現金",   type:"cash",   cur:"TWD",bal:0,vis:true,order:0 },
    { id:"a2",name:"銀行帳戶",type:"debit",  cur:"TWD",bal:0,vis:true,order:1 },
    { id:"c1",name:"信用卡", type:"credit",  cur:"TWD",bal:0,payable:0,limit:100000,vis:true,order:2 },
  ],
  txns:[], debts:[], subs:[], bills:[], stocks:[], pools:[],
  customCE: {},
  goals: [],
  policies: [], // 儲蓄險/投資型保單
  cats: {
    expense: ["食物","交通","家居","娛樂","訂閱","教育","醫療","美容","保費","其他","往來帳"],
    income:  ["薪資","家教","零用錢","利息","股息","紅包","投資收益","其他收入","往來帳"],
  },
  rates: DEF_RATES,
};

/* ── Storage ── */
function loadData() {
  try {
    const s = localStorage.getItem(DATA_KEY);
    if (!s) return DEF;
    const saved = JSON.parse(s);
    const expCats = saved.cats?.expense || DEF.cats.expense;
    const incCats = saved.cats?.income  || DEF.cats.income;
    // Always ensure 往來帳 exists
    if (!expCats.includes("往來帳")) expCats.push("往來帳");
    if (!incCats.includes("往來帳"))  incCats.push("往來帳");
    return { ...DEF, ...saved, rates: { ...DEF_RATES, ...(saved.rates || {}) }, cats: { expense: expCats, income: incCats } };
  } catch { return DEF; }
}
function saveData(d) { try { localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch {} }
function checkVer() {
  const prev = localStorage.getItem(VER_KEY);
  if (prev !== APP_VER) { localStorage.setItem(VER_KEY, APP_VER); return prev ? "✨ 新功能：計算機 🧮、底部導航改中文、現有持股登錄功能！" : null; }
  return null;
}

/* ── UI Atoms ── */
const getISt = () => ({ background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:10, padding:"9px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" });
let iSt = getISt();
function Card({ children, style = {} }) { return <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,...style }}>{children}</div>; }
function SH({ title, right }) {
  return <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px",marginBottom:8 }}>
    <span style={{ fontSize:11,fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted }}>{title}</span>
    {right && <span style={{ fontSize:12,fontWeight:700,color:C.accentL }}>{right}</span>}
  </div>;
}
function Bdg({ children, color = C.accent }) { return <span style={{ fontSize:11,padding:"2px 7px",borderRadius:999,fontWeight:700,background:`${color}22`,color,border:`1px solid ${color}44` }}>{children}</span>; }
function Sheet({ title, onClose, children }) {
  return <div style={{ position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)" }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ width:"100%",maxWidth:420,background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",maxHeight:"92dvh",overflowY:"auto" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <h3 style={{ fontWeight:900,fontSize:16,color:C.text,margin:0 }}>{title}</h3>
        <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,background:C.card,border:"none",cursor:"pointer",color:C.textSub,fontSize:18 }}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}
function Fld({ label, children }) { return <div style={{ marginBottom:12 }}><label style={{ display:"block",fontSize:11,fontWeight:700,color:C.textSub,marginBottom:6 }}>{label}</label>{children}</div>; }
function Inp({ label, ...p }) { return <Fld label={label}><input {...p} style={iSt} /></Fld>; }
function Sl({ label, children, ...p }) { return <Fld label={label}><select {...p} style={iSt}>{children}</select></Fld>; }
function Btn({ children, onClick, v = "primary", sz = "md", style = {} }) {
  const bg = v === "primary" ? C.accent : v === "danger" ? "#ef444428" : v === "warn" ? `${C.warn}28` : v === "teal" ? `${C.teal}28` : C.card;
  const col = v === "primary" ? "#fff" : v === "danger" ? C.danger : v === "warn" ? C.warn : v === "teal" ? C.teal : C.text;
  const br = v === "primary" ? "transparent" : v === "danger" ? `${C.danger}66` : v === "warn" ? `${C.warn}66` : v === "teal" ? `${C.teal}66` : C.border;
  return <button onClick={onClick} style={{ padding:sz === "sm" ? "6px 14px" : "10px 16px",fontSize:sz === "sm" ? 12 : 14,background:bg,border:`1px solid ${br}`,color:col,borderRadius:12,fontWeight:700,cursor:"pointer",...style }}>{children}</button>;
}
function TP({ active, color, onClick, children }) {
  return <button onClick={onClick} style={{ flex:1,padding:"10px 4px",borderRadius:12,fontSize:14,fontWeight:700,background:active ? `${color}28` : C.card,color:active ? color : C.muted,border:`1px solid ${active ? color : C.border}`,cursor:"pointer" }}>{children}</button>;
}
function Spark({ data, color }) {
  const mn = Math.min(...data), mx = Math.max(...data), r = (mx - mn) || 1, w = 70, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / r) * (h - 4) + 2}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" /></svg>;
}

/* ── SwipeRow ── */
function SwipeRow({ children, onDelete, onEdit, onClick }) {
  const [off, setOff] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const sx = useRef(null), sy = useRef(null), swiping = useRef(false);
  const reset = () => { setOff(0); setConfirm(false); };
  return <div style={{ position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",right:0,top:0,height:"100%",minWidth:80,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(239,68,68,0.15)" }}>
      {confirm ? <button onClick={() => { onDelete?.(); reset(); }} style={{ background:C.danger,color:"#fff",border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:900,cursor:"pointer" }}>確認</button> : <span style={{ fontSize:20,color:C.danger }}>🗑</span>}
    </div>
    <div style={{ position:"absolute",left:0,top:0,height:"100%",minWidth:80,display:"flex",alignItems:"center",justifyContent:"center",background:`rgba(251,146,60,0.12)` }}>
      <span style={{ fontSize:20,color:C.warn }}>✏️</span>
    </div>
    <div style={{ position:"relative",zIndex:1,background:C.card,transform:`translateX(${off}px)`,transition:Math.abs(off) === 80 || off === 0 ? "transform .18s" : "none" }}
      onTouchStart={e => { sx.current = e.touches[0].clientX; sy.current = e.touches[0].clientY; swiping.current = false; }}
      onTouchMove={e => {
        if (sx.current === null) return;
        const dx = e.touches[0].clientX - sx.current, dy = e.touches[0].clientY - sy.current;
        if (!swiping.current && Math.abs(dy) > Math.abs(dx)) { sx.current = null; return; }
        if (Math.abs(dx) > 6) { swiping.current = true; e.stopPropagation(); setOff(Math.max(-80, Math.min(80, dx))); }
      }}
      onTouchEnd={() => {
        if (off < -40) { setOff(-80); setConfirm(true); }
        else if (off > 40) { setOff(80); setTimeout(() => { onEdit?.(); reset(); }, 100); }
        else reset();
        sx.current = null;
      }}
      onClick={() => { if (off === 0 && onClick) onClick(); }}>
      {children}
    </div>
  </div>;
}

/* ── Calculator ── */
function Calculator({ onApply, onClose }) {
  const [expr, setExpr] = useState("0");
  const [hasResult, setHasResult] = useState(false);

  const press = (val) => {
    if (val === "C") { setExpr("0"); setHasResult(false); return; }
    if (val === "⌫") { setExpr(p => p.length > 1 ? p.slice(0,-1) : "0"); setHasResult(false); return; }
    if (val === "=") {
      try {
        // safe eval: only allow numbers and operators
        const safe = expr.replace(/[^0-9+\-*/().]/g, "");
        const result = Function('"use strict"; return (' + safe + ')')();
        setExpr(isNaN(result) ? "錯誤" : String(Math.round(result * 100) / 100));
        setHasResult(true);
      } catch { setExpr("錯誤"); }
      return;
    }
    if (hasResult) {
      // after result, if operator continue, if number start fresh
      if (["+","-","*","/"].includes(val)) { setExpr(p => p + val); setHasResult(false); }
      else { setExpr(val); setHasResult(false); }
      return;
    }
    setExpr(p => p === "0" && ![".","+","-","*","/"].includes(val) ? val : p + val);
  };

  const btns = [
    ["C","⌫","(",")"],
    ["7","8","9","/"],
    ["4","5","6","*"],
    ["1","2","3","-"],
    ["0",".","=","+"],
  ];

  const btnColor = (v) => {
    if (["C","⌫"].includes(v)) return { bg:`${C.danger}22`, col:C.danger };
    if (["="].includes(v)) return { bg:C.accent, col:"#fff" };
    if (["+","-","*","/","(",")"].includes(v)) return { bg:`${C.accent}22`, col:C.accentL };
    return { bg:C.card, col:C.text };
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:420,background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:"24px 24px 0 0",padding:"20px 16px 40px" }}>
        {/* Display */}
        <div style={{ background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,textAlign:"right" }}>
          <div style={{ fontSize:11,color:C.muted,marginBottom:4,minHeight:16 }}>{expr !== "0" && hasResult ? "結果" : ""}</div>
          <div style={{ fontSize:30,fontWeight:900,color:C.text,wordBreak:"break-all",lineHeight:1.2 }}>{expr}</div>
        </div>
        {/* Buttons */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12 }}>
          {btns.flat().map((v,i) => {
            const {bg,col} = btnColor(v);
            return <button key={i} onClick={() => press(v)}
              style={{ padding:"16px 0",borderRadius:14,background:bg,border:"none",color:col,fontSize:v==="="?18:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
              {v}
            </button>;
          })}
        </div>
        {/* Apply / Cancel */}
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={() => { onApply(expr==="錯誤"?"":expr); onClose(); }}
            style={{ flex:1,padding:"13px",borderRadius:12,background:C.accent,color:"#fff",border:"none",fontWeight:900,fontSize:15,cursor:"pointer" }}>
            帶入金額 {expr!=="0"&&expr!=="錯誤"?`(${expr})`:""}</button>
          <button onClick={onClose}
            style={{ padding:"13px 20px",borderRadius:12,background:C.card,color:C.text,border:`1px solid ${C.border}`,fontWeight:700,fontSize:14,cursor:"pointer" }}>
            取消</button>
        </div>
      </div>
    </div>
  );
}

/* ── CalcInp: 金額輸入框 + 計算機按鈕 ── */
function CalcInp({ label, value, onChange }) {
  const [showCalc, setShowCalc] = useState(false);
  return (
    <Fld label={label}>
      <div style={{ display:"flex",gap:6 }}>
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          style={{ ...iSt, flex:1 }} />
        <button onClick={() => setShowCalc(true)}
          style={{ padding:"9px 12px",borderRadius:10,background:`${C.accent}22`,color:C.accentL,border:`1px solid ${C.accent}44`,cursor:"pointer",fontSize:16,flexShrink:0 }}>
          🧮
        </button>
      </div>
      {showCalc && <Calculator onApply={v => onChange(v)} onClose={() => setShowCalc(false)} />}
    </Fld>
  );
}
/* ── 週期選擇器 ── */
function PeriodSel({ period, periodN, onChange }) {
  const opts = [{ v:"week",l:"每週" },{ v:"month",l:"每月" },{ v:"year",l:"每年" }];
  return (
    <Fld label="付款週期">
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        {opts.map(o => (
          <button key={o.v} onClick={() => onChange({ period:o.v, periodN:o.v==="year"?"1":periodN })}
            style={{ flex:1, padding:"8px 4px", borderRadius:10, fontWeight:700, fontSize:13,
              background:period===o.v?`${C.accent}30`:C.card, color:period===o.v?C.accentL:C.muted,
              border:`1px solid ${period===o.v?C.accent:C.border}`, cursor:"pointer" }}>{o.l}</button>
        ))}
      </div>
      {period !== "year" && (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13, color:C.textSub, whiteSpace:"nowrap" }}>每隔</span>
          <select value={periodN} onChange={e => onChange({ period, periodN:e.target.value })} style={{ ...iSt, flex:1 }}>
            {Array.from({ length:12 }, (_,i) => i+1).map(n => (
              <option key={n} value={n}>{n} {period==="week"?"週":"個月"}</option>
            ))}
          </select>
          <span style={{ fontSize:13, color:C.textSub, whiteSpace:"nowrap" }}>付一次</span>
        </div>
      )}
    </Fld>
  );
}
/* ── 猜測 Emoji ── */
const EMOJI_KEYWORDS = {
  "🍔":["食物","吃","餐","飯","麵","麥當勞","便當","外食","早餐","午餐","晚餐","宵夜","點心","飲料","咖啡","下午茶","燒烤","火鍋","壽司","pizza","漢堡"],
  "🚌":["交通","車","公車","捷運","計程車","uber","taxi","停車","油","高鐵","火車","機票","機場","通勤"],
  "🏠":["家居","房","租","水","電","瓦斯","網路","清潔","家具","修繕","管理","住","宿舍"],
  "🎬":["娛樂","電影","遊戲","ktv","旅遊","旅行","出遊","景點","門票","演唱會","展覽"],
  "📱":["訂閱","netflix","youtube","spotify","apple","google","軟體","app","會員","月費"],
  "💰":["薪資","薪水","工資","月薪","獎金","年薪","兼職"],
  "📖":["教育","學費","書","課程","補習","學習","培訓","證照"],
  "💊":["醫療","醫院","診所","藥","健康","保健","牙醫","健檢"],
  "💄":["美容","美髮","美甲","保養","化妝","髮廊","spa","美容院"],
  "👕":["衣","服","鞋","包包","配件","時尚","購物","服飾"],
  "🎓":["學費","大學","研究所","學校"],
  "🐾":["寵物","狗","貓","動物","飼料","獸醫"],
  "🏋️":["運動","健身","球","游泳","跑步","瑜珈","體育"],
  "✈️":["旅行","旅遊","出國","機票","飯店","住宿"],
  "🎁":["禮物","送禮","生日","紅包","祝賀","婚禮"],
  "💻":["電腦","3c","科技","手機","相機","耳機","設備"],
  "🏦":["利息","銀行","投資","理財","股息","股票","基金"],
  "🧴":["日用","生活用品","衛生","清潔用品"],
  "🍵":["飲料","咖啡","茶","手搖","飲品"],
  "🚗":["汽車","加油","保養","車險","停車費"],
  "📦":["其他","雜項","雜費","不確定"],
};
function guessEmoji(name) {
  const n = name.toLowerCase();
  for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
    if (keywords.some(k => n.includes(k))) return emoji;
  }
  return "📦";
}

/* ── 常用 Emoji 清單（供使用者選） ── */
const EMOJI_LIST = [
  // 食物飲料
  "🍔","🍟","🌭","🍕","🌮","🌯","🥗","🥙","🧆","🥚","🍳","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌽","🥕","🥦","🧄","🧅","🥔","🍠","🥐","🥖","🫓","🧀","🥗","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍞","🥨","🥯","🧁","🎂","🍰","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🫘","🍯",
  "☕","🧋","🍵","🫖","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧃","🥤","🧊","🫗","🍶","🍾",
  // 水果
  "🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍑","🍒","🍍","🥭","🍌","🍉","🍅","🫒","🥝","🍐","🥑",
  // 交通
  "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍","🛵","🚲","🛴","🛺","🚨","🚔","🚍","🚘","🚖","✈️","🚀","🛸","🚁","🛶","⛵","🚢","🛳","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🛞","⛽","🅿️","🛣","🛤",
  // 家居生活
  "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏗","🛖","🏘","🪵","🛋","🪑","🚿","🛁","🪠","🪤","🧹","🧺","🧻","🪣","🧴","🪥","🧷","🧹","🪜","🔑","🗝","🔐","🔒","🔓","💡","🔦","🕯",
  // 娛樂休閒
  "🎬","🎥","📷","📸","📹","🎮","🕹","🎲","♟","🎯","🎳","🎰","🎪","🎠","🎡","🎢","🎭","🎨","🖼","🎵","🎶","🎤","🎧","🎸","🎹","🥁","🎷","🎺","🎻","🪗","🎙","📻","📺","🎞","📽","🎟","🎫","🎈","🎉","🎊","🪅","🎁","🎀","🏷",
  // 運動健身
  "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪃","🏓","🏸","🥅","⛳","🏒","🎣","🤿","🏂","⛷","🛷","🛹","🛼","🤸","🏋","🚴","🧘","🤾","🧗","⛹","🤺","🥊","🥋","🏆","🥇","🥈","🥉","🏅","🎖",
  // 購物時尚
  "🛍","👗","👔","👕","👖","🧥","👙","👘","🩱","🩲","🩳","👚","👛","👜","👝","🎒","🧳","👒","🎩","🪖","⛑","👑","💎","💍","💄","👠","👡","👢","🥿","👟","🩴","🧦","🧤","🧣","👓","🕶","🥽","⌚",
  // 健康醫療
  "💊","💉","🩺","🩹","🩻","🩸","🧬","🦷","🦴","👁","👂","🫀","🫁","🧠","🏥","😷","🤒","🤕","🤧","🥵","🥶",
  // 美容保養
  "💅","💆","💇","🧖","🪞","✂","💈","🪒","🧴","🧼","🛁","🚿",
  // 教育學習
  "📖","📚","📝","✏","🖊","🖋","📓","📔","📒","📕","📗","📘","📙","📃","📄","📑","📊","📈","📉","🗒","🗓","🗃","🗂","📁","📂","🗄","🗑","📌","📍","📎","🖇","📏","📐","✂","🔬","🔭","🧪","🧫","🧲","💻","🖥","🖨","⌨","🖱","💾","💿","📀",
  // 動物寵物
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦀","🦞","🐡","🐟","🐠","🐬","🐳","🐋","🦈","🦭","🦦","🐊","🦛","🦏","🐘","🦒","🦓","🦌","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦃","🐓","🦚","🦜","🐇","🐿","🦔","🐾",
  // 金融投資
  "💰","💴","💵","💶","💷","💳","🏦","📈","📉","💹","🪙","💸","🤑","🏧","💱","💲",
  // 旅遊自然
  "🌍","🌎","🌏","🗺","🧭","🏔","⛰","🌋","🗻","🏕","🏖","🏜","🏝","🏞","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙","🌃","🌌","🌉","🌁","✈️","🚀","🧳","🎫","🗺","🌴","🌳","🌲","🌿","☘","🍀","🎋","🎍","🍃","🍂","🍁","🌾","🌺","🌻","🌹","🌷","🌸","💐","🌝","🌞","☀","🌤","⛅","🌦","🌧","⛈","🌩","🌨","❄","☃","⛄","🌬","💨","🌪","🌊","🌈","☂","⛱",
  // 感情社交
  "❤","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣","💕","💞","💓","💗","💖","💘","💝","💟","☮","✌","🤞","🤟","🤙","👍","👎","✊","👏","🙌","🤲","🙏","🤝","💪","🦾","🫂",
  // 星星符號
  "⭐","🌟","💫","✨","🌙","☀","🌈","🔥","💥","❄","🌊","🍀","🎯","🎪","🎭","🏆","🥇","🎁","🎊","🎉","🎈","💡","🔮","🧿","🪬","🧲","🔑","🗝","🪄","🧸","🪆","🎎","🎐","🎏","⛩","🗿","🗽","⛲","🌁","🎑","🗼",
];


/* ── Emoji 選擇器 ── */
function EmojiPicker({ onSelect, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:420,background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:"20px 20px 0 0",padding:"16px 16px 40px",maxHeight:"60dvh",display:"flex",flexDirection:"column" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexShrink:0 }}>
          <span style={{ fontWeight:700,fontSize:15,color:C.text }}>選擇圖示</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:6 }}>
            {EMOJI_LIST.map(e => (
              <button key={e} onClick={() => { onSelect(e); onClose(); }}
                style={{ fontSize:24,padding:"8px 0",borderRadius:10,background:C.card,border:`1px solid ${C.border}`,cursor:"pointer" }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function CatPicker({ value, onChange, cats, ce, onAddCat }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [showEP, setShowEP] = useState(false);
  const handleNameChange = (v) => { setNewName(v); setNewEmoji(guessEmoji(v)); };
  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddCat(newName.trim(), newEmoji);
    onChange(newName.trim());
    setNewName(""); setNewEmoji("📦"); setAdding(false);
  };
  return (
    <Fld label="分類">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
        {cats.map(cat => (
          <button key={cat} onClick={() => onChange(cat)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8,
              borderRadius:10, background:value===cat?`${C.accent}30`:C.card,
              border:`1px solid ${value===cat?C.accent:C.border}`, cursor:"pointer" }}>
            <span style={{ fontSize:20 }}>{ce[cat]||"📦"}</span>
            <span style={{ fontSize:11, color:value===cat?C.accentL:C.textSub }}>{cat.length>3?cat.slice(0,3)+"…":cat}</span>
          </button>
        ))}
        <button onClick={() => setAdding(true)}
          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8,
            borderRadius:10, background:C.card, border:`1px dashed ${C.accent}`, cursor:"pointer" }}>
          <span style={{ fontSize:20 }}>➕</span>
          <span style={{ fontSize:11, color:C.accentL }}>新增</span>
        </button>
      </div>
      {adding && (
        <div style={{ marginTop:8, padding:12, borderRadius:12, background:`${C.accent}10`, border:`1px solid ${C.accent}33` }}>
          <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
            <button onClick={() => setShowEP(true)}
              style={{ width:48, height:48, borderRadius:12, background:C.card, border:`2px solid ${C.accent}`, fontSize:24, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {newEmoji}
            </button>
            <div style={{ flex:1 }}>
              <input value={newName} onChange={e => handleNameChange(e.target.value)}
                placeholder="類別名稱（自動猜 emoji）" style={{ ...iSt, marginBottom:4 }}
                onKeyDown={e => e.key==="Enter" && handleAdd()} />
              <div style={{ fontSize:11, color:C.muted }}>點左側 emoji 可以換</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={handleAdd}
              style={{ flex:1, padding:"9px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:700, cursor:"pointer" }}>確認新增</button>
            <button onClick={() => { setAdding(false); setNewName(""); setNewEmoji("📦"); }}
              style={{ padding:"9px 14px", borderRadius:10, background:C.card, color:C.muted, border:`1px solid ${C.border}`, cursor:"pointer" }}>取消</button>
          </div>
        </div>
      )}
      {showEP && <EmojiPicker onSelect={e => { setNewEmoji(e); }} onClose={() => setShowEP(false)} />}
    </Fld>
  );
}
/* ── 台灣股市顏色：漲=紅 跌=綠 ── */
const pnlColor = (val, C) => val > 0 ? C.income : val < 0 ? C.expense : C.textSub;

/* ── InfoBtn: 點 i 顯示說明 ── */
function InfoBtn({ msg }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-block" }}>
      <button onClick={e => { e.stopPropagation(); setShow(p=>!p); }}
        style={{ width:18, height:18, borderRadius:"50%", background:`${C.accent}33`, border:`1px solid ${C.accent}66`, color:C.accentL, fontSize:11, fontWeight:900, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", lineHeight:1, marginLeft:4, flexShrink:0 }}>
        i
      </button>
      {show && <>
        <div style={{ position:"fixed", inset:0, zIndex:199 }} onClick={() => setShow(false)} />
        <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", top:"calc(100% + 6px)", zIndex:200, background:C.card, border:`1px solid ${C.borderL}`, borderRadius:12, padding:"12px 14px", fontSize:12, color:C.text, lineHeight:1.7, width:240, boxShadow:`0 8px 32px rgba(0,0,0,0.5)` }}>
          {msg}
          <div style={{ position:"absolute", top:-6, left:"50%", width:10, height:10, background:C.card, border:`1px solid ${C.borderL}`, borderBottom:"none", borderRight:"none", transform:"translateX(-50%) rotate(45deg)" }} />
        </div>
      </>}
    </span>
  );
}

function ConfirmDialog({ msg, onOk, onCancel }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)" }}>
      <div style={{ background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:20,padding:"28px 24px",maxWidth:320,width:"90%",textAlign:"center" }}>
        <div style={{ fontSize:15,fontWeight:700,color:C.text,marginBottom:24,lineHeight:1.5 }}>{msg}</div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,padding:"11px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14,cursor:"pointer" }}>取消</button>
          <button onClick={onOk} style={{ flex:1,padding:"11px",borderRadius:12,background:C.danger,border:"none",color:"#fff",fontWeight:900,fontSize:14,cursor:"pointer" }}>確認刪除</button>
        </div>
      </div>
    </div>
  );
}
function DragList({ items, onReorder, renderRow }) {
  const [drag, setDrag] = useState(null), [over, setOver] = useState(null);
  return <div>{items.map((it, i) => (
    <div key={it.id} draggable onDragStart={() => setDrag(i)} onDragEnter={() => setOver(i)}
      onDragEnd={() => { if (drag !== null && over !== null && drag !== over) { const a = [...items], [el] = a.splice(drag, 1); a.splice(over, 0, el); onReorder(a); } setDrag(null); setOver(null); }}
      onDragOver={e => e.preventDefault()}
      style={{ opacity:drag === i ? .4 : 1,background:over === i && drag !== i ? `${C.accent}18` : C.card,borderRadius:12,marginBottom:2 }}>
      {renderRow(it, i)}
    </div>
  ))}</div>;
}

/* ── AutoInput ── */
function AutoInput({ label, value, onChange, placeholder, history = [] }) {
  const [show, setShow] = useState(false);
  const suggestions = useMemo(() => {
    if (!history.length) return [];
    const q = value.trim().toLowerCase();
    const freq = {};
    history.forEach(h => { if (h) freq[h] = (freq[h] || 0) + 1; });
    return Object.entries(freq).filter(([h]) => h && h !== value && (!q || h.toLowerCase().includes(q))).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([h]) => h);
  }, [history, value]);
  return <Fld label={label}>
    <div style={{ position:"relative" }}>
      <input value={value} onChange={e => { onChange(e.target.value); setShow(true); }} onFocus={() => setShow(true)} onBlur={() => setTimeout(() => setShow(false), 150)} placeholder={placeholder} style={iSt} />
      {show && suggestions.length > 0 && <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:200,background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:12,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
        {suggestions.map((s, i) => <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => { onChange(s); setShow(false); }}
          style={{ display:"block",width:"100%",textAlign:"left",padding:"11px 14px",fontSize:14,color:C.text,background:"transparent",border:"none",borderTop:i > 0 ? `1px solid ${C.border}` : "none",cursor:"pointer" }}>
          <span style={{ color:C.muted,marginRight:8,fontSize:12 }}>🕐</span>{s}
        </button>)}
      </div>}
    </div>
  </Fld>;
}

/* ── Date Picker ── */
const QR = [
  { l:"Today", fn: () => ({ s:TODAY, e:TODAY }) },
  { l:"Yesterday", fn: () => { const d = new Date(); d.setDate(d.getDate() - 1); const s = d.toISOString().slice(0, 10); return { s, e:s }; } },
  { l:"This Month", fn: () => { const d = new Date(); return { s:`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, e:TODAY }; } },
  { l:"Last Month", fn: () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); const y = d.getFullYear(), m = d.getMonth(), L = new Date(y, m + 1, 0); return { s:`${y}-${String(m + 1).padStart(2, "0")}-01`, e:L.toISOString().slice(0, 10) }; } },
  { l:"This Year", fn: () => ({ s:`${new Date().getFullYear()}-01-01`, e:TODAY }) },
  { l:"Last 30 Days", fn: () => { const d = new Date(); d.setDate(d.getDate() - 29); return { s:d.toISOString().slice(0, 10), e:TODAY }; } },
  { l:"Last 90 Days", fn: () => { const d = new Date(); d.setDate(d.getDate() - 89); return { s:d.toISOString().slice(0, 10), e:TODAY }; } },
];
function DatePicker({ value, onChange, onClose }) {
  const [cs, setCs] = useState(value.s), [ce, setCe] = useState(value.e);
  return <Sheet title="Date Range" onClose={onClose}>
    <div style={{ marginBottom:16 }}>{QR.map(r => <button key={r.l} onClick={() => { onChange(r.fn()); onClose(); }} style={{ display:"block",width:"100%",textAlign:"left",padding:"14px 0",fontSize:14,fontWeight:700,color:C.text,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>{r.l}</button>)}</div>
    <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",color:C.muted,marginBottom:10 }}>Custom Date Range</div>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:14,fontWeight:700,color:C.text }}>Start</span>
      <input type="date" value={cs} onChange={e => setCs(e.target.value)} style={{ ...iSt,width:"auto",padding:"5px 8px",fontSize:13,border:"none",background:"transparent",color:C.textSub }} />
    </div>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:14,fontWeight:700,color:C.text }}>End</span>
      <input type="date" value={ce} onChange={e => setCe(e.target.value)} style={{ ...iSt,width:"auto",padding:"5px 8px",fontSize:13,border:"none",background:"transparent",color:C.textSub }} />
    </div>
    <button onClick={() => { onChange({ s:cs, e:ce }); onClose(); }} style={{ width:"100%",marginTop:16,padding:12,borderRadius:14,background:C.accent,color:"#fff",border:"none",fontWeight:700,fontSize:14,cursor:"pointer" }}>OK</button>
  </Sheet>;
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [d, setD] = useState(loadData);
  const [updateMsg, setUpdateMsg] = useState(() => checkVer());
  const upd = useCallback((key, fn) => {
    setD(prev => {
      const next = { ...prev, [key]: typeof fn === "function" ? fn(prev[key]) : fn };
      saveData(next);
      return next;
    });
  }, []);
  const { accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies } = d;

  /* ── tabs / modal ── */
  const [tab, setTab] = useState("overview");
  const [theme, setTheme] = useState(() => localStorage.getItem("finzen_theme") || "dark");
  // Update global C and iSt based on current theme - runs before every render
  C = getC(theme);
  iSt = getISt();
  const changeTheme = (t) => { localStorage.setItem("finzen_theme", t); setTheme(t); };
  const [modal, setModal] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const confirm = (msg, onOk) => setConfirmDlg({ msg, onOk });
  const closeConfirm = () => setConfirmDlg(null);
  const close = () => setModal(null);

  /* ── selected items ── */
  const [selTxn, setSelTxn] = useState(null);
  const [selAcc, setSelAcc] = useState(null);
  const [selStock, setSelStock] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [selBill, setSelBill] = useState(null);
  const [selPool, setSelPool] = useState(null);

  /* ── wallet mode ── */
  const [wMode, setWMode] = useState("normal");
  // 收合狀態
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = key => setCollapsed(p => ({ ...p, [key]: !p[key] }));
  const [useMvForAssets, setUseMvForAssets] = useState(() => localStorage.getItem("finzen_useMv") === "true");
  const toggleMv = () => { const v = !useMvForAssets; setUseMvForAssets(v); localStorage.setItem("finzen_useMv", String(v)); };
  const [tooltip, setTooltip] = useState(null); // {msg, x, y}

  /* ── month / date ── */
  const [month, setMonth] = useState(() => { const d = new Date(); return { y:d.getFullYear(), m:d.getMonth() + 1 }; });
  const [chartRange, setChartRange] = useState(() => { const now = TODAY.slice(0,7); return { s:`${now}-01`, e:TODAY }; });
  const [healthRange, setHealthRange] = useState(() => { const d = new Date(); return { s:`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, e:TODAY }; });
  const [showDP, setShowDP] = useState(false);
  const [showHDP, setShowHDP] = useState(false);

  /* ── invest state ── */
  const [invTab, setInvTab] = useState("holdings");
  const [invPie, setInvPie] = useState("alloc");
  const [mkt, setMkt] = useState("ALL");
  const [fetchingTicker, setFetchingTicker] = useState(false);
  const [tickerPreview, setTickerPreview] = useState(null);

  /* ── search ── */
  const [sq, setSq] = useState(""), [showSq, setShowSq] = useState(false);
  const [chartView, setChartView] = useState("expense");
  const [newBal, setNewBal] = useState("");
  const [adjDesc, setAdjDesc] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [showCatEP, setShowCatEP] = useState(false);
  const [editCat, setEditCat] = useState(null); // {type, oldName, name, emoji}
  const [showEditEP, setShowEditEP] = useState(false);
  const [showAccEP, setShowAccEP] = useState(false);
  const [showGoalEP, setShowGoalEP] = useState(false);
  // Custom emoji map stored in data
  const ceMap = useMemo(() => ({ ...CE, ...(d.customCE || {}) }), [d.customCE]);
  const addCustomCE = (name, emoji) => upd("customCE", p => ({ ...(p||{}), [name]:emoji }));
  const [curSearch, setCurSearch] = useState("");
  const [localRates, setLocalRates] = useState(() => ({ ...DEF_RATES }));
  const [trFrom, setTrFrom] = useState(""), [trTo, setTrTo] = useState(""), [trAmt, setTrAmt] = useState("");
  const [recAmt, setRecAmt] = useState("");
  const [settleDebt, setSettleDebt] = useState(null);
  const [editDebt, setEditDebt] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [settleAcc, setSettleAcc] = useState("");
  const [settleCustomAmt, setSettleCustomAmt] = useState(null);

  /* ── forms ── */
  const T0 = { type:"expense",cat:"食物",amt:"",desc:"",acc:"",date:TODAY,tags:"",proxy:false,proxyList:[{ person:"",amt:"" }],deferred:false,deferMonths:"4",deferMoAmt:"" };
  const [nT, setNT] = useState(T0);
  const D0 = { type:"receivable",person:"",amt:"",desc:"",date:TODAY,note:"",installTotal:0,installAmt:"",installPaid:0,installPaidAmt:0 };
  const [nD, setND] = useState(D0);
  const S0 = { name:"",amt:"",acc:"",day:"1",weekday:"1",freq:"month",cat:"訂閱",period:"month",periodN:"1" };
  const [nS, setNS] = useState(S0);
  const B0 = { name:"",amt:"",acc:"",day:"1",weekday:"1",freq:"month",cat:"家居",active:false,period:"month",periodN:"1" };
  const [nB, setNB] = useState(B0);
  const NA0 = { name:"",type:"debit",cur:"TWD",limit:"100000" };
  const [nAcc, setNAcc] = useState(NA0);
  const BF0 = { acc:"",ticker:"",name:"",market:"TW",shares:"",avgCost:"",totalCost:"",fee:"0",curPrice:"",fromAcc:"" };
  const [buyF, setBuyF] = useState(BF0);
  const [sellF, setSellF] = useState({ stockId:"",shares:"",totalProceeds:"",fee:"",pnl:"",pnlType:"income",returnAcc:"" });
  const [payF, setPayF] = useState({ creditId:"",fromId:"",amt:"",date:TODAY,note:"" });

  /* ── Effects ── */
  useEffect(() => { if (!updateMsg) return; }, [updateMsg]);
  useEffect(() => { const t = setInterval(() => { try { localStorage.setItem("finzen_backups", JSON.stringify([{ ts:Date.now(), data:d }])); } catch {} }, 5 * 60 * 1000); return () => clearInterval(t); }, [d]);

  /* ── 讀取 GitHub Actions 產生的股價 JSON ── */
  const fetchPrice = useCallback(async (ticker, market) => {
    // 台股：用 Yahoo Finance（0050.TW 格式），透過 CORS proxy
    // 美股：直接用 Yahoo Finance
    const sym = market === "TW" ? `${ticker}.TW` : ticker;
    
    // 方法1: Yahoo Finance v7 quote（最穩定）
    const yahooV7 = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${sym}&fields=regularMarketPrice,shortName,longName`;
    // 方法2: Yahoo Finance v8 chart
    const yahooV8 = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=2d`;
    // CORS proxies
    const proxies = [
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    ];

    // Try each proxy with Yahoo v7 first (faster), then v8
    for (const makeProxy of proxies) {
      for (const apiUrl of [yahooV7, yahooV8]) {
        try {
          const r = await fetch(makeProxy(apiUrl), { signal:AbortSignal.timeout(7000) });
          if (!r.ok) continue;
          const raw = await r.text();
          let d; 
          try { const j = JSON.parse(raw); d = j.contents ? JSON.parse(j.contents) : j; } 
          catch { continue; }
          
          // v7 format
          const v7result = d?.quoteResponse?.result?.[0];
          if (v7result?.regularMarketPrice) {
            return { price: v7result.regularMarketPrice, name: v7result.shortName || v7result.longName || ticker, sym };
          }
          // v8 format
          const meta = d?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            return { price: meta.regularMarketPrice, name: meta.shortName || meta.longName || ticker, sym };
          }
        } catch { continue; }
      }
    }
    return null;
  }, []);

  const fetchAllPrices = useCallback(async (stockList) => {
    const list = stockList || stocks;
    if (!list || list.length === 0) return;

    // 方法1: 嘗試 stock_prices.json（GitHub Actions 產生，最快）
    try {
      const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
      const res = await fetch(`${base}stock_prices.json?t=${Date.now()}`, { signal:AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        let found = 0;
        upd("stocks", p => p.map(s => {
          const keys = [`${s.ticker}.TW`, s.ticker, s.ticker.toUpperCase(), `${s.ticker}.US`];
          const item = keys.map(k => data[k]).find(v => v?.price);
          if (item) { found++; return { ...s, curPrice:item.price, name:item.name||s.name, lastUpdated:item.updated||"",
            _extra: { high:item.high, low:item.low, vol:item.vol, chgPct:item.chgPct, institutional:item.institutional, institutional_date:item.institutional_date }
          }; }
          return s;
        }));
        if (found > 0) { console.log(`✅ 股價從 stock_prices.json 載入 ${found} 檔`); return; }
      }
    } catch {}

    // 方法2: 批量抓 Yahoo Finance（用 v7 一次查多支）
    const twTickers = list.filter(s => s.market === "TW").map(s => `${s.ticker}.TW`);
    const usTickers = list.filter(s => s.market === "US").map(s => s.ticker);
    const allSyms = [...twTickers, ...usTickers].join(",");
    
    if (allSyms) {
      const batchUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${allSyms}&fields=regularMarketPrice,shortName`;
      for (const makeProxy of [
        (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      ]) {
        try {
          const r = await fetch(makeProxy(batchUrl), { signal:AbortSignal.timeout(10000) });
          if (!r.ok) continue;
          const raw = await r.text();
          let d; try { const j = JSON.parse(raw); d = j.contents ? JSON.parse(j.contents) : j; } catch { continue; }
          const results = d?.quoteResponse?.result || [];
          if (results.length > 0) {
            const priceMap = {};
            results.forEach(q => { if (q.regularMarketPrice) priceMap[q.symbol] = { price:q.regularMarketPrice, name:q.shortName||q.symbol }; });
            upd("stocks", p => p.map(s => {
              const sym = s.market === "TW" ? `${s.ticker}.TW` : s.ticker;
              const item = priceMap[sym] || priceMap[s.ticker];
              if (item) return { ...s, curPrice:item.price, name:item.name||s.name, lastUpdated:new Date().toLocaleTimeString("zh-TW") };
              return s;
            }));
            console.log(`✅ 批量載入 ${results.length} 支股票市價`);
            return;
          }
        } catch { continue; }
      }
    }

    // 方法3: 逐一抓（最慢但最保底）
    for (const st of list) {
      const res = await fetchPrice(st.ticker, st.market);
      if (res?.price) upd("stocks", p => p.map(s => s.id===st.id ? {...s, curPrice:res.price, name:res.name||s.name, lastUpdated:new Date().toLocaleTimeString("zh-TW")} : s));
      await new Promise(r => setTimeout(r, 200));
    }
  }, [stocks, fetchPrice, upd]);

  /* ── 自動記帳：訂閱 & 基本開銷 ── */
  useEffect(() => {
    if (!d || !d.subs) return;

    // 計算某個項目從上次記帳到今天，應該有哪幾天/日期要記
    const getDueDates = (item, lastDate) => {
      const dates = [];
      const today = new Date(TODAY);
      const start = lastDate ? new Date(lastDate) : new Date(item.date || TODAY);

      if (item.freq === "week") {
        // 每週幾：從 start 後第一個那個星期X 開始，每7天
        const wd = +(item.weekday || 1); // 0=日...6=六
        let cur = new Date(start);
        cur.setDate(cur.getDate() + 1); // 從次日開始
        // 找到下一個那個星期X
        while (cur.getDay() !== wd) cur.setDate(cur.getDate() + 1);
        while (cur <= today) {
          dates.push(cur.toISOString().slice(0, 10));
          cur = new Date(cur);
          cur.setDate(cur.getDate() + 7);
        }
      } else if (item.freq === "year") {
        // 每年幾月幾號
        const mo = +(item.yearMonth || 1) - 1;
        const dy = +(item.day || 1);
        let cur = new Date(start);
        cur.setDate(cur.getDate() + 1);
        // 找下一個到期年份
        let yr = cur.getFullYear();
        let candidate = new Date(yr, mo, dy);
        if (candidate <= cur) candidate = new Date(yr + 1, mo, dy);
        while (candidate <= today) {
          dates.push(candidate.toISOString().slice(0, 10));
          candidate = new Date(candidate.getFullYear() + 1, mo, dy);
        }
      } else {
        // 每月幾號
        const dy = +(item.day || 1);
        let cur = new Date(start);
        cur.setDate(cur.getDate() + 1);
        let yr = cur.getFullYear(), mo = cur.getMonth();
        let candidate = new Date(yr, mo, dy);
        if (candidate <= cur) { mo++; if (mo > 11) { mo = 0; yr++; } candidate = new Date(yr, mo, dy); }
        while (candidate <= today) {
          dates.push(candidate.toISOString().slice(0, 10));
          mo++; if (mo > 11) { mo = 0; yr++; }
          candidate = new Date(yr, mo, dy);
        }
      }
      return dates;
    };

    let newTxns = [];

    // 訂閱
    (d.subs || []).filter(s => s.active).forEach(s => {
      const lastDate = s.lastBilled || null;
      const dues = getDueDates(s, lastDate);
      dues.forEach(date => {
        newTxns.push({
          id: Date.now() + Math.random(),
          type: "expense", cat: s.cat || "訂閱",
          amt: s.amt, desc: s.name,
          acc: s.acc || "", date, tags: "#自動記帳",
          autoSrc: s.id,
        });
      });
      if (dues.length > 0) {
        upd("subs", p => p.map(x => x.id === s.id ? { ...x, lastBilled: dues[dues.length - 1] } : x));
      }
    });

    // 基本開銷
    (d.bills || []).filter(b => b.active).forEach(b => {
      const lastDate = b.lastBilled || null;
      const dues = getDueDates(b, lastDate);
      dues.forEach(date => {
        newTxns.push({
          id: Date.now() + Math.random(),
          type: "expense", cat: b.cat || "家居",
          amt: b.amt, desc: b.name,
          acc: b.acc || "", date, tags: "#自動記帳",
          autoSrc: b.id,
        });
      });
      if (dues.length > 0) {
        upd("bills", p => p.map(x => x.id === b.id ? { ...x, lastBilled: dues[dues.length - 1] } : x));
      }
    });

    if (newTxns.length > 0) {
      // 帳戶餘額也要扣
      newTxns.forEach(t => {
        if (t.acc) {
          const acc = (d.accs || []).find(a => a.name === t.acc);
          if (acc) {
            if (acc.type === "credit") upd("accs", p => p.map(a => a.name===t.acc ? {...a, payable:(a.payable||0)+t.amt} : a));
            else upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal-t.amt} : a));
          }
        }
      });
      upd("txns", p => [...p, ...newTxns]);
      console.log(`✅ 自動記帳 ${newTxns.length} 筆`);
    }
  // eslint-disable-next-line
  }, []); // 只在 App 開啟時執行一次

  /* ── 資料載入後立刻抓股價（只抓一次，不自動輪詢）── */
  useEffect(() => {
    if (stocks.length > 0) fetchAllPrices(stocks);
  }, [stocks.length]);

  /* ── 匯率：優先讀 rates.json（GitHub Actions 每日更新），備用 API ── */
  useEffect(() => {
    const fetchRates = async () => {
      // 方法1：讀 GitHub Pages 上的 rates.json（不受 rate limit 影響）
      try {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
        const res = await fetch(`${base}rates.json?t=${Date.now()}`, { signal:AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          if (data.USD && data.USD > 1) {
            // rates.json 已有資料（格式：1外幣=N TWD）
            upd("rates", () => ({ ...DEF_RATES, ...data }));
            console.log(`✅ 匯率從 rates.json 載入（更新時間：${data._updated||"未知"}）`);
            return;
          }
        }
      } catch {}
      // 方法2：直接打 API（備用）
      const CURRENCY_MAP = { USD:"USD",EUR:"EUR",JPY:"JPY",GBP:"GBP",HKD:"HKD",SGD:"SGD",CNY:"CNY",KRW:"KRW",AUD:"AUD",CAD:"CAD",CHF:"CHF",MYR:"MYR",THB:"THB" };
      const toCurs = Object.keys(CURRENCY_MAP).join(",");
      const apis = [
        async () => {
          const r = await fetch(`https://api.frankfurter.app/latest?from=TWD&to=${toCurs}`, { signal:AbortSignal.timeout(6000) });
          const j = await r.json();
          if (!j.rates) throw new Error();
          const nr = { TWD:1 };
          Object.entries(j.rates).forEach(([cur,rate]) => { nr[cur] = +(1/rate).toFixed(6); });
          return nr;
        },
      ];
      for (const api of apis) {
        try { const nr = await api(); upd("rates", () => ({ ...DEF_RATES, ...nr })); return; } catch {}
      }
    };
    fetchRates();
    // 每天重新讀一次（GitHub Actions 每天更新 rates.json）
    const t = setInterval(fetchRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const visA = useMemo(() => accs.filter(a => a.type !== "credit" && a.vis), [accs]);
  const totDebt = useMemo(() => accs.filter(a => a.type === "credit" && a.vis).reduce((s, c) => s + (c.payable || 0), 0), [accs]);
  const totRec = useMemo(() => debts.filter(x => x.type === "receivable" && !x.settled).reduce((s, x) => s + (x.amt - (x.installPaidAmt||0)), 0), [debts]);
  const totPay = useMemo(() => debts.filter(x => x.type === "payable" && !x.settled).reduce((s, x) => s + (x.amt - (x.installPaidAmt||0)), 0), [debts]);
  const subsMo = useMemo(() => subs.filter(s => s.active).reduce((s, x) => s + x.amt, 0), [subs]);
  const billsMo = useMemo(() => (bills || []).filter(b => b.active).reduce((s, x) => s + x.amt, 0), [bills]);
  const totPools = useMemo(() => pools.reduce((s, p) => s + (p.totalAmt - p.recognized), 0), [pools]);
  const cashBal = useMemo(() => accs.filter(a => a.type !== "credit" && a.type !== "investment" && a.vis).reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0), [accs, rates]);

  const stSum = useMemo(() => stocks.map(st => {
    const buys  = st.trades.filter(t => t.type==="buy");
    const sells = st.trades.filter(t => t.type==="sell");
    const bSh   = buys.reduce((s,t)=>s+t.shares,0);
    const sSh   = sells.reduce((s,t)=>s+t.shares,0);
    // 股數計算：初始持股(manualShares) + 後續買入 - 後續賣出
    // manualShares = 登錄現有持股時輸入的，是「起始基數」
    // 有 trades 代表之後有買賣，要疊加
    const initSh = st.manualShares != null ? st.manualShares : 0;
    const totalSh = st.manualShares != null
      ? Math.max(0, initSh + bSh - sSh)   // 初始持股 + 買入 - 賣出
      : Math.max(0, bSh - sSh);            // 純 trades 計算
    // 成本計算：初始成本 + 後續買入成本
    const initCost = st.manualTotalCost != null ? st.manualTotalCost : 0;
    const tradesCost = buys.reduce((s,t)=>s+t.shares*t.price+(t.fee||0), 0);
    const totalCost = st.manualTotalCost != null
      ? initCost + tradesCost
      : tradesCost;
    // 均成本
    const avgCost = totalSh > 0 ? totalCost / totalSh : (st.manualAvgCost || 0);
    const mv   = totalSh * (st.curPrice||0);
    const upnl = mv - totalCost;
    return {...st, totalSh, totalCost, avgCost, mv, upnl};
  }), [stocks]);
  const stTotMv = useMemo(() => stSum.reduce((s, x) => s + x.mv, 0), [stSum]);
  const stTotCost = useMemo(() => stSum.reduce((s, x) => s + x.totalCost, 0), [stSum]);
  const totAssets = useMemo(() => {
    const accBal = visA.reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0);
    // 保單不計入總資產（純追蹤損益用）
    if (useMvForAssets && stTotMv > 0) {
      const invAccBal = visA.filter(a => a.type==="investment").reduce((s,a) => s+toTWD(a.bal,a.cur,rates), 0);
      return accBal - invAccBal + stTotMv;
    }
    return accBal;
  // eslint-disable-next-line
  }, [visA, rates, useMvForAssets, stTotMv, accs]);
  const netWorth = totAssets - totDebt - totPay + totRec;
  const allocPie = useMemo(() => {
    const liquid    = visA.filter(a=>a.type!=="investment").reduce((s,a)=>s+toTWD(a.bal,a.cur,rates),0);
    const nonLiquid = useMvForAssets && stTotMv > 0 ? stTotMv : visA.filter(a=>a.type==="investment").reduce((s,a)=>s+toTWD(a.bal,a.cur,rates),0);
    return [{ name:"流動資產", value:liquid }, { name:"非流動資產", value:nonLiquid }].filter(x=>x.value>0);
  }, [visA, rates, useMvForAssets, stTotMv]);
  const holdPie   = useMemo(()=>stSum.filter(x=>x.totalSh>0).map(x=>({name:x.ticker, value:x.totalCost})),[stSum]);
  // 投資成長：按月累計投入成本 vs 現在市值（用目前市值比例推算歷史市值）
  const invGrowth = useMemo(() => {
    // 收集所有買入交易，按月累計成本
    const moMap = {};
    stocks.forEach(st => {
      if (st.manualShares && st.manualTotalCost) {
        // 初始持股登錄視為第一筆
        const ym = (st.trades?.[0]?.date || TODAY).slice(0,7);
        moMap[ym] = (moMap[ym]||0) + st.manualTotalCost;
      }
      (st.trades||[]).filter(t=>t.type==="buy").forEach(t => {
        const ym = t.date.slice(0,7);
        const cost = t.totalCost || (t.shares*(t.price||0)) + (t.fee||0);
        moMap[ym] = (moMap[ym]||0) + cost;
      });
    });
    if (!Object.keys(moMap).length) return [];
    const months = Object.keys(moMap).sort();
    let cumCost = 0;
    const mvRatio = stTotCost > 0 ? stTotMv / stTotCost : 1;
    return months.map(ym => {
      cumCost += moMap[ym];
      const [y,m] = ym.split("-");
      // 歷史市值：用當前損益比例線性估算（簡化）
      const estMv = stTotMv > 0 ? cumCost * mvRatio : 0;
      return { m:`${+y}/${+m}`, cost:Math.round(cumCost), mv:Math.round(estMv) };
    });
  }, [stocks, stTotMv, stTotCost]);
  const stByAcc = useMemo(() => { const g = {}; stSum.forEach(x => { (g[x.acc] || (g[x.acc] = [])).push(x); }); return g; }, [stSum]);

  const moTxns = useMemo(() => txns.filter(t => { const [y, m] = t.date.split("-").map(Number); return y === month.y && m === month.m; }), [txns, month]);
  const poolThisMo = useMemo(() => pools.filter(p => { const [py, pm] = p.date.split("-").map(Number); return py === month.y && pm === month.m; }).reduce((s, p) => s + (p.recognized || 0), 0), [pools, month]);
  const moInc = useMemo(() => moTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").reduce((s, t) => s + t.amt, 0), [moTxns]);
  const moExp = useMemo(() => moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => {
    // 代墊的話只算自己那份（總金額 - 代墊部分）
    const ownAmt = t.proxyAmt ? t.amt - t.proxyAmt : t.amt;
    return s + ownAmt;
  }, 0), [moTxns]);
  const expCat = useMemo(() => { const m = {}; moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").forEach(t => { const own = t.proxyAmt ? t.amt - t.proxyAmt : t.amt; m[t.cat] = (m[t.cat] || 0) + own; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [moTxns]);
  const incCat = useMemo(() => { const m = {}; moTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amt; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [moTxns]);
  const alertAmt = useMemo(() => moTxns.filter(t => t.type === "expense" && ["食物","交通","家居"].includes(t.cat)).reduce((s, t) => s + t.amt, 0), [moTxns]);
  const alertR = moInc > 0 ? alertAmt / moInc : 0;
  const passiveMo = useMemo(() => moTxns.filter(t => t.type === "income" && PASSIVE.includes(t.cat)).reduce((s, t) => s + t.amt, 0), [moTxns]);
  const descHistory = useMemo(() => txns.map(t => t.desc).filter(Boolean), [txns]);
  const descHistoryByCat = useMemo(() => {
    const m = {};
    txns.forEach(t => { if (t.cat && t.desc) { m[t.cat] = m[t.cat] || []; if (!m[t.cat].includes(t.desc)) m[t.cat].push(t.desc); } });
    return m;
  }, [txns]);
  const tagsHistory = useMemo(() => txns.map(t => t.tags).filter(Boolean), [txns]);

  const grpTxns = useMemo(() => {
    const g = {};
    let f = [...moTxns].sort((a, b) => b.date.localeCompare(a.date));
    if (sq) f = f.filter(t => (t.desc || "").toLowerCase().includes(sq.toLowerCase()) || t.cat.includes(sq) || (t.acc || "").includes(sq));
    f.forEach(t => { (g[t.date] || (g[t.date] = [])).push(t); });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [moTxns, sq]);

  const hTxns = useMemo(() => txns.filter(t => t.date >= healthRange.s && t.date <= healthRange.e), [txns, healthRange]);
  const hInc = useMemo(() => hTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").reduce((s, t) => s + t.amt, 0), [hTxns]);
  const hExp = useMemo(() => hTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => {
    const ownAmt = t.proxyAmt ? t.amt - t.proxyAmt : t.amt;
    return s + ownAmt;
  }, 0), [hTxns]);

  const isSingleMo = useMemo(() => { const s = new Date(chartRange.s), e = new Date(chartRange.e); return s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth(); }, [chartRange]);
  const chartData = useMemo(() => {
    if (!txns.length) return [];
    const s = new Date(chartRange.s);
    const e = new Date(chartRange.e);

    if (isSingleMo) {
      // 單月：每天的資產 = 今天總資產，往回推每一天的交易
      const year = s.getFullYear(), month = s.getMonth();
      const dim = new Date(year, month + 1, 0).getDate();
      const ym = `${year}-${String(month + 1).padStart(2, "0")}`;

      // 算出這個月之後（不含本月）的所有淨流入
      const afterMo = txns.filter(t => t.date > `${ym}-31`);
      const afterNet = afterMo.reduce((s, t) => {
        if (t.type === "income") return s + t.amt;
        if (t.type === "expense" && t.cat !== "帳戶調整") return s - t.amt;
        return s;
      }, 0);
      // 月底資產 = 現在總資產 - 本月之後的淨流入
      const endOfMonthAssets = totAssets - afterNet;

      // 本月每天的交易，從月底往前推
      const dayTxns = {};
      txns.filter(t => t.date.startsWith(ym)).forEach(t => {
        const day = parseInt(t.date.slice(8));
        dayTxns[day] = dayTxns[day] || 0;
        if (t.type === "income" && t.cat !== "帳戶調整") dayTxns[day] += t.amt;
        if (t.type === "expense" && t.cat !== "帳戶調整") dayTxns[day] -= t.amt;
      });

      // 從月底往回算每天資產
      const result = [];
      let running = endOfMonthAssets;
      for (let d = dim; d >= 1; d--) {
        result.unshift({ d:`${d}日`, assets:Math.max(0, running) });
        running -= (dayTxns[d] || 0); // 往前一天，扣掉當天的淨流入
      }
      return result;
    }

    // 多月：每月的資產
    // 先收集每個月的淨流入
    const moNet = {};
    txns.forEach(t => {
      const ym = t.date.slice(0, 7);
      moNet[ym] = moNet[ym] || 0;
      if (t.type === "income" && t.cat !== "帳戶調整") moNet[ym] += t.amt;
      if (t.type === "expense" && t.cat !== "帳戶調整") moNet[ym] -= t.amt;
      // 轉帳和帳戶調整不計入（不影響總資產）
    });

    // 找出所有月份（在範圍內）
    const allMonths = [];
    const cur = new Date(s.getFullYear(), s.getMonth(), 1);
    const end = new Date(e.getFullYear(), e.getMonth(), 1);
    while (cur <= end) {
      allMonths.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
      cur.setMonth(cur.getMonth() + 1);
    }
    if (allMonths.length === 0) return [];

    // 從現在往回推：計算每個月底的資產
    // 今天之後的淨流入先扣掉
    const lastMonth = allMonths[allMonths.length - 1];
    const afterNet = Object.entries(moNet)
      .filter(([ym]) => ym > lastMonth)
      .reduce((s, [, v]) => s + v, 0);

    let running = totAssets - afterNet;
    const result = [];

    // 從最後一個月往前推
    for (let i = allMonths.length - 1; i >= 0; i--) {
      const ym = allMonths[i];
      const [y, m] = ym.split("-");
      result.unshift({ m:`${+y}/${+m}月`, assets:Math.max(0, running) });
      running -= (moNet[ym] || 0); // 往前一個月，扣掉當月淨流入
    }
    return result;
  }, [txns, chartRange, isSingleMo, totAssets]);

  const rl = r => { if (!r.s || !r.e) return "—"; if (r.s === r.e) return r.s; const s = new Date(r.s), e = new Date(r.e); if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) return `${s.getFullYear()}/${s.getMonth() + 1}月`; return `${r.s.slice(5)}~${r.e.slice(5)}`; };
  const prevMo = () => setMonth(({ y, m }) => m === 1 ? { y:y - 1, m:12 } : { y, m:m - 1 });
  const nextMo = () => setMonth(({ y, m }) => m === 12 ? { y:y + 1, m:1 } : { y, m:m + 1 });
  const filtWL = useMemo(() => mkt === "ALL" ? [] : [], [mkt]);

  /* ── Actions ── */
  const addTxn = () => {
    if (!nT.amt) return;
    const id = Date.now();
    const validProxies = nT.proxy ? nT.proxyList.filter(p => p.person && +p.amt > 0) : [];
    const totalProxyAmt = validProxies.reduce((s, p) => s + +p.amt, 0);
    const ownAmt = +nT.amt - totalProxyAmt; // 自己那份

    if (validProxies.length > 0) {
      // ── 有代墊：拆成兩筆 ──
      // 筆1：自己的支出（只算自己那份）
      const ownTxn = { ...nT, id, amt:ownAmt, proxyAmt:0, proxyFor:"", proxyList:[], desc:nT.desc || nT.cat };
      // 筆2：代墊轉帳記錄（不算支出，只是說明錢出去了在等人還）
      const proxyTxn = {
        ...nT, id:id+1, type:"transfer", cat:"往來帳",
        amt:totalProxyAmt, proxyAmt:totalProxyAmt,
        proxyFor:validProxies.map(p => p.person).join("、"),
        proxyList:validProxies,
        desc:`代墊：${nT.desc || nT.cat}（${validProxies.map(p => `${p.person} ${fmt(+p.amt)}`).join("、")}）`,
        tags:"#代墊",
      };
      upd("txns", p => [...p, ownTxn, proxyTxn]);

      // 帳戶餘額：扣全額（自己 + 代墊都是真實付出去）
      const acc = accs.find(a => a.name === nT.acc);
      if (acc) {
        if (acc.type === "credit") {
          upd("accs", p => p.map(a => a.id===acc.id ? {...a, payable:(a.payable||0)+(+nT.amt)} : a));
        } else {
          upd("accs", p => p.map(a => a.name===nT.acc ? {...a, bal:a.bal-(+nT.amt)} : a));
        }
      }
      // 往來帳建立應收（每個代墊對象）
      validProxies.forEach(pr => {
        upd("debts", p => [...p, { id:"d"+Date.now()+Math.random(), type:"receivable", person:pr.person, amt:+pr.amt, desc:`代墊：${nT.desc||nT.cat}`, date:nT.date, settled:false, srcTxnId:id }]);
      });
    } else {
      // ── 無代墊：原本邏輯 ──
      const t = { ...nT, id, amt:+nT.amt, proxyAmt:0, proxyFor:"", proxyList:[] };
      upd("txns", p => [...p, t]);
      const acc = accs.find(a => a.name === t.acc);
      if (acc) {
        if (t.type === "income") {
          upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal+t.amt} : a));
        } else if (t.type === "expense") {
          if (acc.type === "credit") {
            upd("accs", p => p.map(a => a.id===acc.id ? {...a, payable:(a.payable||0)+t.amt} : a));
          } else {
            upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal-t.amt} : a));
          }
        }
      }
    }

    if (nT.deferred && nT.deferMoAmt && nT.type === "income") {
      upd("txns", p => p.map(x => x.id === id ? { ...x, type:"transfer", cat:"帳戶調整", desc:`待認列收入：${nT.desc || nT.cat}（共 ${fmt(+nT.amt)}）` } : x));
      upd("pools", p => [...p, { id:"p"+id, desc:nT.desc||nT.cat, cat:nT.cat, totalAmt:+nT.amt, recognized:0, date:nT.date, acc:nT.acc }]);
    }
    setNT(T0); close();
  };
  const delTxn = id => {
    const t = txns.find(x => x.id === id);
    if (t) {
      const acc = accs.find(a => a.name === t.acc);
      if (t.type === "transfer" && t.tags === "#代墊") {
        // 代墊轉帳筆：還原帳戶（加回代墊金額）
        if (acc?.type === "credit") upd("accs", p => p.map(a => a.name===t.acc ? {...a, payable:Math.max(0,(a.payable||0)-t.amt)} : a));
        else if (t.acc) upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal+t.amt} : a));
      } else if (t.type === "transfer") {
        if (t.acc) upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal+t.amt} : a));
        if (t.toAcc) upd("accs", p => p.map(a => a.name===t.toAcc ? {...a, bal:Math.max(0,a.bal-t.amt)} : a));
      } else if (t.type === "expense" && t.cat !== "帳戶調整") {
        if (acc?.type === "credit") upd("accs", p => p.map(a => a.name===t.acc ? {...a, payable:Math.max(0,(a.payable||0)-t.amt)} : a));
        else if (t.acc) upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal+t.amt} : a));
      } else if (t.type === "income" && t.acc) {
        upd("accs", p => p.map(a => a.name===t.acc ? {...a, bal:a.bal-t.amt} : a));
      }
    }
    upd("txns", p => p.filter(x => x.id !== id)); close();
  };
  const saveTxn = t => { upd("txns", p => p.map(x => x.id === t.id ? t : x)); close(); };

  const adjBal = (acc, newBalStr, isFirst, adjDesc="") => {
    if (!acc || newBalStr === "") return;
    if (acc.type === "credit") {
      const nv = Math.abs(parseFloat(newBalStr));
      upd("accs", p => p.map(a => a.id === acc.id ? { ...a, payable:nv } : a));
      return;
    }
    const nv = parseFloat(newBalStr), df = nv - acc.bal;
    if (df === 0) return;
    upd("accs", p => p.map(a => a.id === acc.id ? { ...a, bal:nv } : a));
    if (!isFirst) upd("txns", p => [...p, { id:Date.now(), type:"adjust", cat:"帳戶調整", amt:Math.abs(df), adjDiff:df, desc:adjDesc || (df > 0 ? "餘額增加" : "餘額減少"), acc:acc.name, date:TODAY, tags:"" }]);
  };

  const payCredit = () => {
    const a = +payF.amt; if (!a || !payF.creditId || !payF.fromId) return;
    upd("accs", p => p.map(ac => { if (ac.id === payF.creditId) return { ...ac, payable:Math.max(0, (ac.payable || 0) - a) }; if (ac.id === payF.fromId) return { ...ac, bal:ac.bal - a }; return ac; }));
    upd("txns", p => [...p, { id:Date.now(), type:"expense", cat:"帳戶調整", amt:a, desc:payF.note || "信用卡繳費", acc:accs.find(x => x.id === payF.fromId)?.name || "", date:payF.date, tags:"#繳費" }]);
    setPayF({ creditId:"", fromId:"", amt:"", date:TODAY, note:"" }); close();
  };

  const doTransfer = () => {
    const a = +trAmt; if (!a || !trFrom || !trTo || trFrom === trTo) return;
    upd("accs", p => p.map(ac => { if (ac.id === trFrom) return { ...ac, bal:ac.bal - a }; if (ac.id === trTo) return { ...ac, bal:ac.bal + a }; return ac; }));
    setTrFrom(""); setTrTo(""); setTrAmt(""); close();
  };

  const addDebt = () => { if (!nD.person || !nD.amt) return; upd("debts", p => [...p, { ...nD, id:"d" + Date.now(), amt:+nD.amt, settled:false }]); setND(D0); close(); };
  const addSub = () => { if (!nS.name || !nS.amt) return; upd("subs", p => [...p, { ...nS, id:"sub"+Date.now(), amt:+nS.amt, day:+nS.day, active:true, date:TODAY, lastBilled:null }]); setNS(S0); close(); };
  const saveSub = s => { upd("subs", p => p.map(x => x.id === s.id ? s : x)); close(); };
  const addBill = () => { if (!nB.name || !nB.amt) return; upd("bills", p => [...(p||[]), { ...nB, id:"bill"+Date.now(), amt:+nB.amt, day:+nB.day, active:false, date:TODAY, lastBilled:null }]); setNB(B0); close(); };
  const saveBill = b => { upd("bills", p => p.map(x => x.id === b.id ? b : x)); close(); };
  const G0 = { name:"", target:"", deadline:"", emoji:"🎯", accIds:[] };
  const [nG, setNG] = useState(G0);
  const addGoal = () => { if (!nG.name || !nG.target) return; upd("goals", p => [...(p||[]), { ...nG, id:"g"+Date.now(), target:+nG.target }]); setNG(G0); close(); };
  const PL0 = { name:"", insurer:"", premium:"", premiumFreq:"year", startDate:TODAY, maturityDate:"", surrenderVal:"", totalPaid:"", cur:"TWD", emoji:"🛡️" };
  const [nPL, setNPL] = useState(PL0);
  const [selPolicy, setSelPolicy] = useState(null);
  const [premAmt, setPremAmt] = useState("");
  const [premAcc, setPremAcc] = useState("");
  const [surrenderAmt, setSurrenderAmt] = useState("");
  const [surrenderAcc, setSurrenderAcc] = useState("");
  const addPolicy = () => { if (!nPL.name) return; upd("policies", p => [...(p||[]), { ...nPL, id:"pl"+Date.now(), premium:+nPL.premium, surrenderVal:+nPL.surrenderVal||0 }]); setNPL(PL0); close(); };

  const addAccFn = () => {
    if (!nAcc.name) return;
    const id = "a" + Date.now();
    const base = { id, name:nAcc.name, type:nAcc.type, cur:nAcc.cur, bal:0, vis:true, order:accs.length };
    const extra = nAcc.type === "credit" ? { payable:0, limit:+nAcc.limit || 100000 } : {};
    upd("accs", p => [...p, { ...base, ...extra }]); setNAcc(NA0); close();
  };

  const doBuy = () => {
    if (!buyF.ticker || !buyF.shares) return;
    const trade = { id:"t"+Date.now(), type:"buy", date:TODAY, shares:+buyF.shares, price:buyF.avgCost?+buyF.avgCost:0, fee:+buyF.fee||0, totalCost:buyF.totalCost?+buyF.totalCost:0 };
    const ex = stocks.find(s => s.ticker===buyF.ticker && s.acc===buyF.acc);
    if (ex) {
      // 同代號同帳戶 → 加入 trades，保留 manualShares（stSum 會疊加）
      upd("stocks", p => p.map(s => s.id===ex.id ? {
        ...s,
        name: buyF.name || s.name,
        // 不清除 manualShares！stSum 會自動 initSh + bSh - sSh
        trades: [...s.trades, trade],
      } : s));
    } else {
      upd("stocks", p => [...p, {
        id:"s"+Date.now(), acc:buyF.acc,
        ticker:buyF.ticker, name:buyF.name||buyF.ticker, market:buyF.market,
        curPrice: 0,
        manualShares: null,
        manualAvgCost: null,
        manualTotalCost: null,
        trades:[trade],
      }]);
    }
    if (buyF.fromAcc && buyF.totalCost) {
      const cost = +buyF.totalCost;
      // 扣款帳戶餘額減少
      upd("accs", p => p.map(a => a.name===buyF.fromAcc ? {...a, bal:a.bal-cost} : a));
      // 同步更新對應的證券帳戶餘額增加
      if (buyF.acc) upd("accs", p => p.map(a => a.name===buyF.acc ? {...a, bal:a.bal+cost} : a));
      // 總覽記錄：帳戶轉帳（type=transfer，不計入收支統計）
      upd("txns", p => [...p, {
        id:Date.now(), type:"transfer",
        cat:"帳戶調整",
        amt:cost,
        desc:`買入 ${buyF.ticker} ${buyF.shares}股（均${buyF.avgCost||0}元）`,
        acc:buyF.fromAcc,
        toAcc:buyF.acc||"",
        date:TODAY, tags:"#投資",
      }]);
    }
    setBuyF(BF0); close();
  };

  // sellF: stockId, shares, totalProceeds, fee, pnl, pnlType, returnAcc
  const doSell = () => {
    const st = stSum.find(s => s.id === sellF.stockId);
    if (!st || !sellF.shares) return;
    const proceeds = sellF.totalProceeds ? +sellF.totalProceeds : 0;
    const pnlAmt   = sellF.pnl ? Math.abs(+sellF.pnl) : 0;
    const isProfit = sellF.pnlType === "income";
    const sellPrice = +sellF.shares > 0 && proceeds > 0 ? proceeds / +sellF.shares : 0;
    const sellFee = sellF.fee ? +sellF.fee : 0;
    // 加賣出紀錄（不清除 manualShares，讓 stSum 用 initSh+bSh-sSh 計算）
    upd("stocks", p => p.map(s => s.id===st.id ? {
      ...s,
      trades:[...s.trades, { id:"t"+Date.now(), type:"sell", date:TODAY, shares:+sellF.shares, price:sellPrice, fee:sellFee, totalProceeds:proceeds }],
    } : s));
    if (sellF.returnAcc && proceeds) {
      // 款項回流帳戶
      upd("accs", p => p.map(a => a.name===sellF.returnAcc ? {...a, bal:a.bal+proceeds-sellFee} : a));
      // 證券帳戶餘額減少
      upd("accs", p => p.map(a => a.name===st.acc ? {...a, bal:Math.max(0, a.bal-proceeds)} : a));
      // 總覽：帳戶轉帳（不計入收支）
      upd("txns", p => [...p, {
        id:Date.now(), type:"transfer", cat:"帳戶調整",
        amt:proceeds,
        desc:`賣出 ${st.ticker} ${sellF.shares}股`,
        acc:st.acc, toAcc:sellF.returnAcc,
        date:TODAY, tags:"#投資",
      }]);
    }
    // 損益：才算真正的收入/支出
    if (pnlAmt > 0) upd("txns", p => [...p, {
      id:Date.now()+1, type:isProfit?"income":"expense",
      cat:"投資收益", amt:pnlAmt,
      desc:`${isProfit?"投資獲利":"投資虧損"}：${st.ticker} ${sellF.shares}股`,
      acc:sellF.returnAcc||"", date:TODAY, tags:"#投資",
    }]);
    setSellF({ stockId:"", shares:"", totalProceeds:"", fee:"", pnl:"", pnlType:"income", returnAcc:"" }); close();
  };

  const doRecognize = () => {
    if (!selPool || !recAmt) return;
    const a = +recAmt, rem = selPool.totalAmt - selPool.recognized;
    if (a > rem || a <= 0) return;
    upd("pools", p => p.map(x => x.id === selPool.id ? { ...x, recognized:x.recognized + a } : x));
    upd("txns", p => [...p, { id:Date.now(), type:"income", cat:selPool.cat || "其他收入", amt:a, desc:`認列：${selPool.desc}`, acc:"", date:TODAY, tags:"#認列" }]);
    setRecAmt(""); close();
  };

  const reorderGrp = (type, r) => upd("accs", p => [...p.filter(a => a.type !== type), ...r.map((a, i) => ({ ...a, order:i }))]);
  const addCat = () => { if (!newCatName.trim()) return; upd("cats", p => ({ ...p, [newCatType]:[...p[newCatType], newCatName.trim()] })); addCustomCE(newCatName.trim(), newCatEmoji); setNewCatName(""); setNewCatEmoji("📦"); };
  const exportData = () => { const b = new Blob([JSON.stringify(d, null, 2)], { type:"application/json" }); const u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = `finzen_${TODAY}.json`; a.click(); URL.revokeObjectURL(u); };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  const rowSt = (i, border = true) => ({ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderTop:border && i > 0 ? `1px solid ${C.border}` : undefined });

  // All state bundled for child components
  const p = {
    C, tab, iSt, fmt, toTWD, pnlColor, upd, setModal, modal, close, confirm, TODAY,
    accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
    stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
    ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo,
    chartData, chartRange, setChartRange, isSingleMo, allocPie, holdPie, invGrowth,
    incCat, expCat, chartView, setChartView, healthRange, setHealthRange,
    useMvForAssets, setUseMvForAssets, poolThisMo, fetchAllPrices, ALL_CURS, theme,
    collapsed, toggleSection, setNT, nT, T0, descHistoryByCat, descHistory, tagsHistory,
    invTab, setInvTab, invPie, setInvPie, LEARN_DATA, MANUAL_DATA,
    selStock, setSelStock, sellF, setSellF, buyF, setBuyF, initF, setInitF,
    selAcc, setSelAcc, setSelPool, setSettleDebt, setEditDebt, recAmt, setRecAmt, doRecognize,
    payF, setPayF, setSelSub, setSelBill, setSelPolicy, setSelTxn, selTxn,
    nG, setNG, addGoal, editGoal, setEditGoal, nPL, setNPL, addPolicy, selPolicy,
    premAmt, setPremAmt, premAcc, setPremAcc, surrenderAmt, setSurrenderAmt, surrenderAcc, setSurrenderAcc,
    moDate, setMoDate, searchQ, setSearchQ, APP_VER, changeTheme, THEMES,
    showHDP, setShowHDP, nS, setNS, S0, nB, setNB, B0, sortMode, setSortMode, visMode, setVisMode, nD, setND,
    selSub, setSelSub, saveSub, addSub, selBill, setSelBill, saveBill, addBill,
    nAcc, setNAcc, addAcc, doPayCred, doBuy, doSell, doInit, addDebt, editDebt, setEditDebt,
    settleDebt, setSettleDebt, settleAcc, setSettleAcc, settleCustomAmt, setSettleCustomAmt,
    saveTxn, delTxn, adjBal, adjDesc, setAdjDesc, newBal, setNewBal,
    selPool, setSelPool, showGoalEP, setShowGoalEP, addCustomCE,
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        body { background:${C.bg}; }
        ::-webkit-scrollbar { display:none; }
        input, select, textarea, button { font-family:'Noto Sans TC',system-ui,sans-serif; }
        select option { background:${C.card}; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(${theme==="light"?"0":"0.7"}); }
      `}</style>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'Noto Sans TC',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>

        {/* Scroll area */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom:140, WebkitOverflowScrolling:"touch", paddingTop:"env(safe-area-inset-top, 44px)" }}>

          {/* ══ OVERVIEW ══ */}
          
          {tab === "overview" && <OverviewPage {...p} />}
          {tab === "wallet"   && <WalletPage {...p} />}
          {tab === "charts"   && <ChartsPage {...p} />}
          {tab === "notes"    && <NotesPage {...p} />}
          {tab === "invest"   && <InvestPage {...p} />}
          {tab === "settings" && <SettingsPage {...p} />}
        </div>


        {tab === "overview" && <button onClick={() => { setNT({ ...T0, acc:accs.filter(a => a.type !== "credit")[0]?.name || "" }); setModal("addTxn"); }} style={{ position:"fixed", bottom:"calc(76px + env(safe-area-inset-bottom,0px))", right:18, width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentD})`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 24px ${C.accent}55`, zIndex:25, fontSize:22 }}>✏️</button>}

        {/* Update banner */}
        {updateMsg && <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 16px", height:"100%", pointerEvents:"none" }}>
          <div style={{ pointerEvents:"auto", background:`rgba(${theme==="light"?"240,242,248":"13,15,20"},0.95)`, backdropFilter:"blur(18px)", border:`1px solid ${C.accent}66`, borderRadius:20, padding:"24px 24px 20px", maxWidth:340, width:"100%", textAlign:"center", boxShadow:`0 0 60px ${C.accent}44`, animation:"fadeSlideIn .4s ease", position:"relative" }}>
            <button onClick={() => setUpdateMsg(null)} style={{ position:"absolute", top:12, right:12, width:28, height:28, borderRadius:8, background:`${C.muted}33`, border:"none", color:C.text, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            <div style={{ fontSize:32, marginBottom:10 }}>✨</div>
            <div style={{ fontWeight:900, fontSize:16, color:C.text, marginBottom:8 }}>有新增功能！</div>
            <div style={{ fontSize:13, color:C.accentL, lineHeight:1.6 }}>{updateMsg}</div>
            <button onClick={() => setUpdateMsg(null)} style={{ marginTop:16, padding:"8px 24px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>知道了</button>
          </div>
        </div>}

        {/* Bottom Nav */}
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.surface, borderTop:`1px solid ${C.border}`, paddingBottom:"env(safe-area-inset-bottom,0px)", zIndex:30 }}>
          <div style={{ display:"flex" }}>
            {[{ k:"overview", i:"📊", l:"總覽" }, { k:"wallet", i:"👛", l:"錢包" }, { k:"charts", i:"📉", l:"圖表" }, { k:"notes", i:"👥", l:"往來帳" }, { k:"invest", i:"📈", l:"投資" }, { k:"settings", i:"⚙️", l:"設定" }].map(t => {
              const active = tab === t.k;
              return <button key={t.k} onClick={() => setTab(t.k)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"10px 0", background:"none", border:"none", cursor:"pointer", color:active ? C.accent : C.muted }}>
                <span style={{ fontSize:active ? 21 : 18 }}>{t.i}</span>
                <span style={{ fontSize:11, fontWeight:700 }}>{t.l}</span>
                {active && <div style={{ width:4, height:4, borderRadius:"50%", background:C.accent }} />}
              </button>;
            })}
          </div>
        </div>

        {/* ═══════════ MODALS ═══════════ */}

        
        <TxnModals {...p} />
        <WalletModals {...p} />
        <StockModals {...p} />
        <DebtModals {...p} />
        <OtherModals {...p} />
      </div>
    </>
  );
}
