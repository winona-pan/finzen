import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

/* ── 引入所有分拆出去的子頁面與彈窗 ── */
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
  nordic: {
    bg:"#e6ebf0", surface:"#f2f6f9", card:"#ffffff",
    border:"#c4d0da", borderL:"#a3b5c2",
    income:"#c85a4a", expense:"#6b9e64",
    accent:"#3d6e8f", accentL:"#2f5670", accentD:"#234253",
    warn:"#c9982f", teal:"#4f9088",
    text:"#26313a", textSub:"#5f7280", muted:"#9cb0bc", danger:"#c1442e",
    name:"北歐風", icon:"🌲",
  },
  mediterranean: {
    bg:"#fbe6bf", surface:"#fff3dc", card:"#fffaf0",
    border:"#eec988", borderL:"#dbab55",
    income:"#d8542f", expense:"#7a9a3e",
    accent:"#12707f", accentL:"#0d5865", accentD:"#08404b",
    warn:"#d67f12", teal:"#1f8f92",
    text:"#402c14", textSub:"#7a5a30", muted:"#c9a568", danger:"#c1442e",
    name:"地中海風", icon:"🌊",
  },
  korean: {
    bg:"#f6e2ee", surface:"#fcedf5", card:"#ffffff",
    border:"#eabdd8", borderL:"#dd97c0",
    income:"#d43a68", expense:"#4aa88c",
    accent:"#b8447e", accentL:"#9c3568", accentD:"#7d2952",
    warn:"#d99a3e", teal:"#4a9d92",
    text:"#38222e", textSub:"#7a5468", muted:"#cf9fba", danger:"#d1476a",
    name:"韓式", icon:"🌸",
  },
  japanese: {
    bg:"#e8dcbe", surface:"#f2e8cc", card:"#faf3e2",
    border:"#d0ba86", borderL:"#b89c60",
    income:"#a02e2e", expense:"#4a6e42",
    accent:"#22404f", accentL:"#182e3a", accentD:"#0f2028",
    warn:"#a87418", teal:"#356b60",
    text:"#241f14", textSub:"#5c4f34", muted:"#a68f60", danger:"#a3372f",
    name:"日式", icon:"🍃",
  },
  american: {
    bg:"#eef1f6", surface:"#f8fafc", card:"#ffffff",
    border:"#c6cfda", borderL:"#a3b1c2",
    income:"#c8202a", expense:"#1e7a44",
    accent:"#173864", accentL:"#0f2848", accentD:"#0a1c33",
    warn:"#c07716", teal:"#146860",
    text:"#182230", textSub:"#4c5a6c", muted:"#96a5b6", danger:"#c8202a",
    name:"美式", icon:"🦅",
  },
};
let C = THEMES.dark;
function getC(theme) { return THEMES[theme] || THEMES.dark; }
const PIE = ["#f43f5e","#7c7cf8","#4ade80","#fb923c","#06b6d4","#ec4899","#a78bfa","#34d399"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
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
const CE = { 食物:"🍔",交通:"🚌",家居:"🏠",娛樂:"🎬",訂閱:"📱",薪資:"💰",家教:"📖",零用錢:"🏮",利息:"🏦",股息:"📈",紅包:"🧧",投資收益:"📈",教育:"🎓",醫療:"💊",美容:"💄",帳戶調整:"✨",其他:"📦",其他收入:"💴",往來帳:"🤝",股票:"📈" };
const AT = { cash:"💰",debit:"🏦",investment:"📊",credit:"💳" };
const EMOTIONS = [
  { key:"plan", label:"計畫內", icon:"📋", color:"#4ade80" },
  { key:"fomo", label:"追高/貪婪", icon:"🔥", color:"#f43f5e" },
  { key:"panic", label:"恐慌/殺低", icon:"😰", color:"#f43f5e" },
  { key:"herd", label:"聽消息/從眾", icon:"👥", color:"#f59e0b" },
  { key:"bored", label:"手癢/衝動", icon:"🎲", color:"#f59e0b" },
];
const PASSIVE = ["利息","股息","紅包","投資收益"];
const APP_VER = "2.2";
const LEARN_DATA = [];
const MANUAL_DATA = [];
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
  customCE: {}, goals: [], policies: [],
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
let themeMode = "dark";
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
/* ── 資訊提示按鈕 ── */
function InfoBtn({ msg }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-block" }}>
      <button onClick={e => { e.stopPropagation(); setShow(p=>!p); }} style={{ width:18, height:18, borderRadius:"50%", background:`${C.accent}33`, border:`1px solid ${C.accent}66`, color:C.accentL, fontSize:11, fontWeight:900, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", lineHeight:1, marginLeft:4, flexShrink:0 }}>i</button>
      {show && <>
        <div style={{ position:"fixed", inset:0, zIndex:199 }} onClick={() => setShow(false)} />
        <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", top:"calc(100% + 6px)", zIndex:200, background:C.card, border:`1px solid ${C.borderL}`, borderRadius:12, padding:"12px 14px", fontSize:12, color:C.text, lineHeight:1.7, width:240, boxShadow:`0 8px 32px rgba(0,0,0,0.5)` }}>
          {msg}
          <div style={{ position:"absolute", top:-6, left:"50%", width:10, height:10, background:C.card, border:`1px solid ${C.borderL}`, borderBottom:"none", borderRight:"none", transform:"translateX(-50%) rotate(45deg)" }} />
        </div>
      </>}
    </span >
  );
}

function ConfirmDialog({ msg, onOk, onCancel, okLabel }) {
  const label = okLabel || "確認刪除";
  const isDanger = !okLabel || label.includes("刪除");
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)" }}>
      <div style={{ background:C.surface,border:`1px solid ${C.borderL}`,borderRadius:20,padding:"28px 24px",maxWidth:320,width:"90%",textAlign:"center" }}>
        <div style={{ fontSize:15,fontWeight:700,color:C.text,marginBottom:24,lineHeight:1.5 }}>{msg}</div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,padding:"11px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14,cursor:"pointer" }}>取消</button>
          <button onClick={onOk} style={{ flex:1,padding:"11px",borderRadius:12,background:isDanger?C.danger:C.accent,border:"none",color:"#fff",fontWeight:900,fontSize:14,cursor:"pointer" }}>{label}</button>
        </div>
      </div>
    </div>
  );
}

/* ── CalcInp：支援 + - * / 快速心算的金額輸入框 ── */
function CalcInp({ label, value, onChange }) {
  const [raw, setRaw] = useState(value || "");
  useEffect(() => { setRaw(value || ""); }, [value]);
  const evaluate = (expr) => {
    if (!/^[0-9+\-*/.\s]+$/.test(expr)) return null;
    try { const r = Function(`"use strict";return (${expr})`)(); return isFinite(r) ? r : null; } catch { return null; }
  };
  const commit = () => {
    const r = evaluate(raw);
    if (r != null) { setRaw(String(r)); onChange(String(r)); } else onChange(raw);
  };
  return <Fld label={label}>
    <input value={raw} inputMode="decimal" placeholder="0 或 100+50"
      onChange={e => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") { commit(); e.target.blur(); } }}
      style={iSt} />
  </Fld>;
}

/* ── AutoInput：帶歷史紀錄下拉建議的輸入框 ── */
function AutoInput({ label, value, onChange, placeholder, history = [] }) {
  const [focus, setFocus] = useState(false);
  const filtered = (history || []).filter(h => !value || h.toLowerCase().includes(String(value).toLowerCase())).slice(0, 6);
  return <Fld label={label}>
    <div style={{ position:"relative" }}>
      <input value={value || ""} placeholder={placeholder} style={iSt}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)} />
      {focus && filtered.length > 0 && <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:60, marginTop:4, background:C.card, border:`1px solid ${C.borderL}`, borderRadius:10, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
        {filtered.map((h,i) => <div key={i} onMouseDown={() => { onChange(h); setFocus(false); }} style={{ padding:"9px 12px", fontSize:13, color:C.text, cursor:"pointer", borderTop:i>0?`1px solid ${C.border}`:"none" }}>{h}</div>)}
      </div>}
    </div>
  </Fld>;
}

/* ── DatePicker：簡易日期區間選擇（月份快捷 + 自訂區間）── */
function DatePicker({ value, onChange, onClose }) {
  const [s, setS] = useState(value?.s || TODAY);
  const [e, setE] = useState(value?.e || TODAY);
  const quick = (months) => {
    const end = new Date(TODAY), start = new Date(end);
    start.setMonth(start.getMonth() - months + 1); start.setDate(1);
    const fmt2 = dt => dt.toISOString().slice(0,10);
    const ns = fmt2(start), ne = fmt2(end);
    setS(ns); setE(ne);
    onChange({ s:ns, e:ne });
    onClose();
  };
  return <div style={{ position:"fixed", inset:0, zIndex:120, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.75)" }} onClick={ev => { if (ev.target === ev.currentTarget) onClose(); }}>
    <div style={{ width:"100%", maxWidth:420, maxHeight:"85dvh", overflowY:"auto", background:C.surface, borderRadius:"20px 20px 0 0", padding:20, paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))" }}>
      <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:14 }}>選擇區間</div>
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[{l:"本月",m:1},{l:"近3月",m:3},{l:"近6月",m:6},{l:"近12月",m:12}].map(o => <button key={o.l} onClick={() => quick(o.m)} style={{ padding:"6px 12px", borderRadius:10, background:C.card, border:`1px solid ${C.border}`, color:C.textSub, fontSize:12, fontWeight:700, cursor:"pointer" }}>{o.l}</button>)}
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <div style={{ flex:1 }}><label style={{ fontSize:11, color:C.textSub, display:"block", marginBottom:4 }}>起</label><input type="date" value={s} onChange={ev => setS(ev.target.value)} style={{ ...iSt, colorScheme:themeMode==="dark"?"dark":"light" }} /></div>
        <div style={{ flex:1 }}><label style={{ fontSize:11, color:C.textSub, display:"block", marginBottom:4 }}>迄</label><input type="date" value={e} onChange={ev => setE(ev.target.value)} style={{ ...iSt, colorScheme:themeMode==="dark"?"dark":"light" }} /></div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => { onChange({ s, e }); onClose(); }} style={{ flex:1, padding:12, borderRadius:12, background:C.accent, color:"#fff", border:"none", fontWeight:900, cursor:"pointer" }}>確定</button>
        <button onClick={onClose} style={{ padding:"12px 20px", borderRadius:12, background:C.card, color:C.text, border:`1px solid ${C.border}`, fontWeight:700, cursor:"pointer" }}>取消</button>
      </div>
    </div>
  </div>;
}

/* ── CatPicker：分類選擇（含新增分類）── */
function CatPicker({ value, onChange, cats, ce, onAddCat }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [showEP, setShowEP] = useState(false);
  return <Fld label="分類">
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
      {cats.map(cat => <button key={cat} type="button" onClick={() => onChange(cat)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:value===cat?`${C.accent}30`:C.card, border:`1px solid ${value===cat?C.accent:C.border}`, cursor:"pointer" }}>
        <span style={{ fontSize:20 }}>{ce[cat]||"📦"}</span>
        <span style={{ fontSize:11, color:value===cat?C.accentL:C.textSub }}>{cat.length>3?cat.slice(0,3)+"…":cat}</span>
      </button>)}
      <button type="button" onClick={() => setAdding(p=>!p)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:C.card, border:`1px dashed ${C.accent}`, cursor:"pointer" }}>
        <span style={{ fontSize:20 }}>➕</span><span style={{ fontSize:11, color:C.accentL }}>新增</span>
      </button>
    </div>
    {adding && <div style={{ marginTop:8, padding:10, borderRadius:10, background:`${C.accent}10`, border:`1px solid ${C.accent}33`, display:"flex", gap:8, alignItems:"center" }}>
      <button type="button" onClick={() => setShowEP(true)} style={{ width:36, height:36, borderRadius:10, background:C.card, border:`2px solid ${C.accent}`, fontSize:18, cursor:"pointer", flexShrink:0 }}>{newEmoji}</button>
      <input value={newName} onChange={ev => setNewName(ev.target.value)} placeholder="新分類名稱" style={{ ...iSt, flex:1 }} />
      <button type="button" onClick={() => { if (!newName.trim()) return; onAddCat(newName.trim(), newEmoji); onChange(newName.trim()); setNewName(""); setNewEmoji("📦"); setAdding(false); }} style={{ padding:"8px 12px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:700, cursor:"pointer", flexShrink:0 }}>加入</button>
      {showEP && <EmojiPicker onSelect={em => { setNewEmoji(em); setShowEP(false); }} onClose={() => setShowEP(false)} />}
    </div>}
  </Fld>;
}

/* ── EmojiPicker：簡易表情符號選擇面板 ── */
const EMOJI_SET = [
  "🍔","🍜","🍕","🍣","🍱","🍰","🍩","🍞","🥗","🍺","🍷","☕","🧋","🍳",
  "🚌","🚗","🚕","🚲","🛵","🚄","🚇","✈️","⛽","🅿️",
  "🏠","🏡","🛋️","🛏️","🚿","🔌","💡","🧹","🔧","🪑",
  "🎬","🎮","🎵","🎤","🎨","🎭","🎳","🎲","📺","🎸",
  "📱","💻","⌚","📷","🎧","🖨️","🔋","💾",
  "🎓","📖","✏️","📚","🧮","🖊️",
  "💊","🏥","🩺","💉","🦷","🧴",
  "💄","💅","💇","🧖","👗","🕶️",
  "🏦","💰","💳","📈","📉","🧧","💸","🪙",
  "🛡️","🎯","🧧","🏮","✨","📦","🎁",
  "🐶","🐱","🐾","🐟",
  "⚽","🏀","🎾","🏊","🚴","🏋️",
  "👕","👖","👟","🧥","👜","🧢",
  "✈️","🧳","🗺️","⛱️","🏕️","🚢",
  "👶","🧸","🍼","🎀",
  "🐾","🌱","🎄","🎉","💍","⚕️",
];
function EmojiPicker({ onSelect, onClose }) {
  return <div style={{ position:"fixed", inset:0, zIndex:210, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.7)" }} onClick={ev => { if (ev.target === ev.currentTarget) onClose(); }}>
    <div style={{ width:"100%", maxWidth:420, background:C.surface, borderRadius:"20px 20px 0 0", padding:20, maxHeight:"60dvh", overflowY:"auto" }}>
      <div style={{ fontWeight:900, fontSize:14, color:C.text, marginBottom:12 }}>選擇圖示</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:8 }}>
        {EMOJI_SET.map(em => <button key={em} onClick={() => onSelect(em)} style={{ fontSize:22, padding:8, borderRadius:10, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer" }}>{em}</button>)}
      </div>
    </div>
  </div>;
}
/* ── guessEmoji：依名稱關鍵字猜測合適的表情符號 ── */
function guessEmoji(name) {
  const s = (name || "").toLowerCase();
  const table = [
    [["food","餐","飯","食","吃"], "🍔"], [["coffee","咖啡"], "☕"], [["car","車","交通","捷運","公車"], "🚌"],
    [["house","房","租","水電"], "🏠"], [["movie","電影","娛樂","遊戲"], "🎬"], [["sub","訂閱"], "📱"],
    [["health","醫","藥"], "💊"], [["beauty","美","妝"], "💄"], [["edu","學","課"], "🎓"],
    [["salary","薪"], "💰"], [["gift","紅包","禮"], "🧧"], [["stock","股","投資"], "📈"],
  ];
  for (const [keys, emoji] of table) if (keys.some(k => s.includes(k))) return emoji;
  return "📦";
}

/* ── SwipeRow：左滑顯示編輯/刪除按鈕，點擊內容觸發 onClick ── */
function SwipeRow({ children, onDelete, onEdit, onClick }) {
  const [dx, setDx] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);
  const ACT_W = (onEdit ? 56 : 0) + (onDelete ? 56 : 0);
  const onStart = (clientX) => { startX.current = clientX; dragging.current = true; };
  const onMove = (clientX) => {
    if (!dragging.current) return;
    const diff = clientX - startX.current;
    setDx(Math.max(-ACT_W, Math.min(0, diff)));
  };
  const onEnd = () => {
    dragging.current = false;
    setDx(prev => (prev < -ACT_W / 2 ? -ACT_W : 0));
  };
  return (
    <div style={{ position:"relative", overflow:"hidden" }}>
      {ACT_W > 0 && <div style={{ position:"absolute", top:0, right:0, bottom:0, display:"flex" }}>
        {onEdit && <button onClick={() => { setDx(0); onEdit(); }} style={{ width:56, background:C.warn, border:"none", color:"#fff", fontSize:18, cursor:"pointer" }}>✏️</button>}
        {onDelete && <button onClick={() => { setDx(0); onDelete(); }} style={{ width:56, background:C.danger, border:"none", color:"#fff", fontSize:18, cursor:"pointer" }}>🗑</button>}
      </div>}
      <div
        onClick={() => { if (dx === 0 && onClick) onClick(); }}
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={e => onStart(e.clientX)}
        onMouseMove={e => { if (dragging.current) onMove(e.clientX); }}
        onMouseUp={onEnd}
        onMouseLeave={() => { if (dragging.current) onEnd(); }}
        style={{ position:"relative", background:C.bg, transform:`translateX(${dx}px)`, transition: dragging.current ? "none" : "transform .2s", cursor:onClick?"pointer":"default", touchAction: ACT_W > 0 ? "pan-y" : "auto" }}>
        {children}
      </div>
    </div>
  );
}

/* ── StockPriceChart：股價區間走勢圖，附 1日/5日/1月/3月/6月/1年 切換 ── */
function StockPriceChart({ ticker, market, fetchStockRange }) {
  const [range, setRange] = useState("1mo");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const reqId = useRef(0);
  const load = useCallback(async (r) => {
    const myId = ++reqId.current;
    setLoading(true); setFailed(false);
    const res = await fetchStockRange(ticker, market, r);
    if (myId !== reqId.current) return; // 舊請求，已經被更新的請求取代，忽略結果
    setData(res);
    setFailed(res.length <= 1);
    setLoading(false);
  }, [ticker, market, fetchStockRange]);
  useEffect(() => { load(range); }, [range, ticker]);
  const first = data[0]?.close, last = data[data.length - 1]?.close;
  const chgPct = (first && last) ? ((last - first) / first * 100) : null;
  const color = chgPct == null ? C.muted : chgPct >= 0 ? C.income : C.expense;
  return (
    <div>
      <div style={{ display:"flex", gap:4, marginBottom:10, overflowX:"auto" }}>
        {RANGE_OPTS_STATIC.map(o => <button key={o.key} onClick={() => setRange(o.key)} style={{ flex:"0 0 auto", padding:"5px 10px", borderRadius:8, fontSize:11, fontWeight:700, background:range===o.key?C.accent:C.card, color:range===o.key?"#fff":C.muted, border:"none", cursor:"pointer" }}>{o.label}</button>)}
      </div>
      {loading ? (
        <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:12 }}>讀取中…</div>
      ) : data.length > 1 ? (
        <div>
          <div style={{ fontWeight:900, fontSize:16, color, marginBottom:6 }}>{chgPct != null ? `${chgPct>=0?"+":""}${chgPct.toFixed(2)}%` : "—"}</div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={data} margin={{ top:5, right:5, bottom:0, left:0 }}>
              <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:8 }} axisLine={false} tickLine={false} interval={Math.ceil(data.length/5)} />
              <YAxis hide domain={["auto","auto"]} />
              <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, fontSize:11 }} formatter={v=>[v,"價格"]} />
              <Line type="linear" dataKey="close" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height:120, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, color:C.muted, fontSize:12 }}>
          <span>這個區間讀取失敗，可能是暫時連線問題</span>
          <button onClick={() => load(range)} style={{ padding:"4px 12px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, color:C.accentL, fontSize:12, cursor:"pointer" }}>🔄 重試</button>
        </div>
      )}
    </div>
  );
}
const RANGE_OPTS_STATIC = [
  { key:"1d", label:"1日" }, { key:"5d", label:"5日" }, { key:"1mo", label:"1月" },
  { key:"3mo", label:"3月" }, { key:"6mo", label:"6月" }, { key:"1y", label:"1年" },
];

const pnlColor = (val, C) => val > 0 ? C.income : val < 0 ? C.expense : C.textSub;

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
  /* ── 帳戶餘額 + 交易紀錄 同時寫入的原子化工具（避免 React 非同步 state 批次問題）── */
  const updMulti = useCallback((patch) => {
    setD(prev => {
      const next = { ...prev };
      Object.keys(patch).forEach(key => {
        next[key] = typeof patch[key] === "function" ? patch[key](prev[key]) : patch[key];
      });
      saveData(next);
      return next;
    });
  }, []);
  const { accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies } = d;
  const expensePools = d.expensePools || [];
  const buckets = d.buckets || [];
  const addBucket = useCallback((accId, name, emoji, allocated) => {
    upd("buckets", p => {
      const siblings = (p||[]).filter(b => b.accId === accId);
      const amt = +allocated||0;
      return [...(p||[]), { id:"bk"+Date.now(), accId, name, emoji:emoji||"🎯", allocated:amt, vis:true, order:siblings.length, history:[{ date:TODAY, allocated:amt }] }];
    });
  }, [upd]);
  const updateBucket = useCallback((id, patch) => {
    upd("buckets", p => (p||[]).map(b => {
      if (b.id !== id) return b;
      const next = { ...b, ...patch };
      if (patch.allocated !== undefined && patch.allocated !== b.allocated) {
        const hist = (b.history || []).filter(h => h.date !== TODAY);
        next.history = [...hist, { date: TODAY, allocated: patch.allocated }];
      }
      return next;
    }));
  }, [upd]);
  const deleteBucket = useCallback((id) => {
    upd("buckets", p => (p||[]).filter(b => b.id!==id));
  }, [upd]);
  const moveBucket = useCallback((accId, id, dir) => {
    upd("buckets", p => {
      const sibs = (p||[]).filter(b => b.accId === accId).sort((a,b) => (a.order||0)-(b.order||0));
      const idx = sibs.findIndex(b => b.id === id), swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sibs.length) return p;
      const o1 = sibs[idx].order||0, o2 = sibs[swapIdx].order||0;
      return (p||[]).map(b => b.id===sibs[idx].id ? { ...b, order:o2 } : b.id===sibs[swapIdx].id ? { ...b, order:o1 } : b);
    });
  }, [upd]);
  const transferBucket = useCallback((fromId, toId, amount) => {
    const amt = +amount || 0;
    if (amt <= 0 || fromId === toId) return;
    const from = buckets.find(b => b.id === fromId), to = buckets.find(b => b.id === toId);
    if (!from || !to) return;
    upd("buckets", p => (p||[]).map(b => {
      if (b.id === fromId) {
        const newAmt = b.allocated-amt;
        const hist = (b.history||[]).filter(h=>h.date!==TODAY);
        return { ...b, allocated:newAmt, history:[...hist, { date:TODAY, allocated:newAmt }] };
      }
      if (b.id === toId) {
        const newAmt = b.allocated+amt;
        const hist = (b.history||[]).filter(h=>h.date!==TODAY);
        return { ...b, allocated:newAmt, history:[...hist, { date:TODAY, allocated:newAmt }] };
      }
      return b;
    }));
    if (from.accId !== to.accId) {
      const fromAcc = accs.find(a => a.id === from.accId), toAcc = accs.find(a => a.id === to.accId);
      if (fromAcc && toAcc) {
        updMulti({
          accs: p => p.map(a => a.id===fromAcc.id ? { ...a, bal:a.bal-amt } : a.id===toAcc.id ? { ...a, bal:a.bal+amt } : a),
          txns: p => [...p, { id:Date.now(), type:"transfer", cat:"帳戶調整", amt, desc:`子帳戶轉帳：${from.name} → ${to.name}`, acc:fromAcc.name, toAcc:toAcc.name, date:TODAY, tags:"#子帳戶轉帳" }],
        });
      }
    }
  }, [buckets, accs, upd, updMulti]);
  const watchlist = d.watchlist || [];
  const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 冷靜清單：4 小時緩衝期
  const addToWatchlist = useCallback((item) => {
    upd("watchlist", p => [...(p || []), { id:"w" + Date.now(), ...item, addedAt: Date.now() }]);
  }, [upd]);
  const removeFromWatchlist = useCallback((id) => {
    upd("watchlist", p => (p || []).filter(x => x.id !== id));
  }, [upd]);

  /* ── 交易頻率追蹤：近 7 天買賣次數，過於頻繁時提醒 ── */
  const recentTradeCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let count = 0;
    stocks.forEach(s => (s.trades || []).forEach(t => { if (new Date(t.date).getTime() >= cutoff) count++; }));
    return count;
  }, [stocks]);
  const TRADE_FREQ_WARN = 5;


  /* ── tabs / modal ── */
  const [tab, setTab] = useState("overview");
  const [theme, setTheme] = useState(() => localStorage.getItem("finzen_theme") || "dark");
  C = getC(theme);
  themeMode = theme;
  iSt = getISt();
  const changeTheme = (t) => { localStorage.setItem("finzen_theme", t); setTheme(t); };
  const [modal, setModal] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const confirm = (msg, onOk, okLabel, skipUndo) => setConfirmDlg({ msg, onOk, okLabel, skipUndo });
  const closeConfirm = () => setConfirmDlg(null);
  const close = () => setModal(null);

  /* ── 全域復原機制：任何經過 confirm() 確認的動作，執行前先存一份完整快照 ── */
  const [undoInfo, setUndoInfo] = useState(null);
  const undoTimerRef = useRef(null);
  const undoDelete = useCallback(() => {
    if (!undoInfo) return;
    setD(undoInfo.snapshot);
    saveData(undoInfo.snapshot);
    setUndoInfo(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoInfo]);

  /* ── selected items ── */
  const [selTxn, setSelTxn] = useState(null);
  const [selAcc, setSelAcc] = useState(null);
  const [selStock, setSelStock] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [selBill, setSelBill] = useState(null);
  const [selPool, setSelPool] = useState(null);

  /* ── wallet mode ── */
  const [wMode, setWMode] = useState("normal");
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = key => setCollapsed(p => ({ ...p, [key]: !p[key] }));
  const [useMvForAssets, setUseMvForAssets] = useState(() => localStorage.getItem("finzen_useMv") === "true");
  const toggleMv = () => { const v = !useMvForAssets; setUseMvForAssets(v); localStorage.setItem("finzen_useMv", String(v)); };

  /* ── month / date ── */
  const [month, setMonth] = useState(() => { const d = new Date(); return { y:d.getFullYear(), m:d.getMonth() + 1 }; });
  const [chartRange, setChartRange] = useState(() => { const now = TODAY.slice(0,7); return { s:`${now}-01`, e:TODAY }; });
  const [healthRange, setHealthRange] = useState(() => { const d = new Date(); return { s:`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, e:TODAY }; });
  const [showDP, setShowDP] = useState(false);
  const [showHDP, setShowHDP] = useState(false);

  /* ── invest state ── */
  const [invTab, setInvTab] = useState("holdings");
  useEffect(() => { if (tab !== "invest") setInvTab("holdings"); }, [tab]);
  const [invPie, setInvPie] = useState("alloc");
  const [mkt, setMkt] = useState("ALL");

  /* ── search ── */
  const [sq, setSq] = useState(""), [showSq, setShowSq] = useState(false);
  const [chartView, setChartView] = useState("expense");
  const [newBal, setNewBal] = useState("");
  const [adjDesc, setAdjDesc] = useState("");
  const [showGoalEP, setShowGoalEP] = useState(false);
  const [recAmt, setRecAmt] = useState("");
  const [settleDebt, setSettleDebt] = useState(null);
  const [editDebt, setEditDebt] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [settleAcc, setSettleAcc] = useState("");
  const [settleCustomAmt, setSettleCustomAmt] = useState(null);

  /* ── forms ── */
  const T0 = { type:"expense",cat:"食物",amt:"",desc:"",acc:"",date:TODAY,tags:"",proxy:false,proxyList:[{ person:"",amt:"" }],deferred:false,deferMonths:"4",deferMoAmt:"",installExp:false,installMonths:"3" };
  const [nT, setNT] = useState(T0);
  const D0 = { type:"receivable",person:"",amt:"",desc:"",date:TODAY,note:"",installTotal:0,installAmt:"",installPaid:0,installPaidAmt:0 };
  const [nD, setND] = useState(D0);
  const S0 = { name:"",amt:"",acc:"",day:"1",weekday:"1",freq:"month",cat:"訂閱",period:"month",periodN:"1",deferExpense:false };
  const [nS, setNS] = useState(S0);
  const B0 = { name:"",amt:"",acc:"",day:"1",weekday:"1",freq:"month",cat:"家居",active:false,period:"month",periodN:"1" };
  const [nB, setNB] = useState(B0);
  const NA0 = { name:"",type:"debit",cur:"TWD",limit:"100000" };
  const [nAcc, setNAcc] = useState(NA0);
  const BF0 = { acc:"",ticker:"",name:"",market:"TW",shares:"",avgCost:"",totalCost:"",fee:"0",curPrice:"",fromAcc:"",emotion:"",buyReason:"" };
  const [buyF, setBuyF] = useState(BF0);
  const [sellF, setSellF] = useState({ stockId:"",shares:"",totalProceeds:"",fee:"",pnl:"",pnlType:"income",returnAcc:"",emotion:"" });
  const [payF, setPayF] = useState({ creditId:"",fromId:"",amt:"",date:TODAY,note:"" });
  const [initF, setInitF] = useState({});
  const G0 = { name:"", target:"", deadline:"", emoji:"🎯", accIds:[], bucketIds:[], useMv:null };
  const [nG, setNG] = useState(G0);
  const PL0 = { name:"", insurer:"", premium:"", premiumFreq:"year", startDate:TODAY, maturityDate:"", surrenderVal:"", totalPaid:"", cur:"TWD", emoji:"🛡️" };
  const [nPL, setNPL] = useState(PL0);
  const [selPolicy, setSelPolicy] = useState(null);
  const [premAmt, setPremAmt] = useState("");
  const [premAcc, setPremAcc] = useState("");
  const [surrenderAmt, setSurrenderAmt] = useState("");
  const [surrenderAcc, setSurrenderAcc] = useState("");
  const [moDate, setMoDate] = useState(TODAY);
  const [searchQ, setSearchQ] = useState("");

  /* ══════════════════════════════════════════════════════
     核心商業邏輯與資料處理函式
  ══════════════════════════════════════════════════════ */

  /* ── 類別自訂表情符號（讀取 + 寫入）── */
  const ceMap = useMemo(() => ({ ...CE, ...(d.customCE || {}) }), [d.customCE]);
  const addCustomCE = useCallback((name, emoji) => {
    upd("customCE", prev => ({ ...(prev || {}), [name]: emoji }));
  }, [upd]);

  /* ── 說明 / 標籤 自動完成歷史（依類別分組，最新在前，去重）── */
  const descHistory = useMemo(() => {
    const seen = new Set(); const out = [];
    for (let i = txns.length - 1; i >= 0; i--) {
      const v = (txns[i].desc || "").trim();
      if (v && !seen.has(v)) { seen.add(v); out.push(v); }
      if (out.length >= 20) break;
    }
    return out;
  }, [txns]);
  const descHistoryByCat = useMemo(() => {
    const map = {};
    for (let i = txns.length - 1; i >= 0; i--) {
      const t = txns[i]; const v = (t.desc || "").trim();
      if (!v) continue;
      if (!map[t.cat]) map[t.cat] = [];
      if (map[t.cat].length < 8 && !map[t.cat].includes(v)) map[t.cat].push(v);
    }
    return map;
  }, [txns]);
  const tagsHistory = useMemo(() => {
    const seen = new Set(); const out = [];
    for (let i = txns.length - 1; i >= 0; i--) {
      const v = (txns[i].tags || "").trim();
      if (v && !seen.has(v)) { seen.add(v); out.push(v); }
      if (out.length >= 15) break;
    }
    return out;
  }, [txns]);

  /* ── 編輯既有交易：先還原舊帳戶餘額影響，再套用新的（單次 updMulti 原子完成）── */
  const saveTxn = useCallback((edited) => {
    if (!edited) return;
    const old = txns.find(t => t.id === edited.id);
    if (old?.poolId && +edited.amt !== old.amt) {
      const diff = +edited.amt - old.amt;
      const poolKey = old.poolType === "income" ? "pools" : "expensePools";
      upd(poolKey, p => (p||[]).map(x => x.id === old.poolId ? { ...x, recognized: Math.max(0, x.recognized + diff) } : x));
    }
    updMulti({
      txns: prevTxns => prevTxns.map(t => t.id === edited.id ? { ...edited, amt:+edited.amt, poolId:old?.poolId, poolType:old?.poolType, noBalanceEffect:old?.noBalanceEffect } : t),
      accs: prevAccs => prevAccs.map(a => {
        let bal = a.bal, payable = a.payable;
        if (old && !old.noBalanceEffect) {
          if (old.acc === a.name) {
            if (old.type === "income") bal -= old.amt;
            else if (old.type === "expense") { if (a.type === "credit") payable = (payable||0) - old.amt; else bal += old.amt; }
            else if (old.type === "adjust") bal -= (old.adjDiff || 0);
            else if (old.type === "transfer") { if (a.type === "credit") payable = Math.max(0,(payable||0)-old.amt); else bal += old.amt; }
          }
          if (old.type === "transfer" && old.toAcc === a.name) { if (a.type === "credit") payable = Math.max(0,(payable||0)+old.amt); else bal -= old.amt; }
        }
        if (edited.acc === a.name && !edited.noBalanceEffect) {
          const amt = +edited.amt;
          if (edited.type === "income") bal += amt;
          else if (edited.type === "expense") { if (a.type === "credit") payable = (payable||0) + amt; else bal -= amt; }
          else if (edited.type === "adjust") bal += (edited.adjDiff || 0);
          else if (edited.type === "transfer") { if (a.type === "credit") payable = (payable||0) + amt; else bal -= amt; }
        }
        if (edited.type === "transfer" && edited.toAcc === a.name && !edited.noBalanceEffect) { if (a.type === "credit") payable = Math.max(0,(payable||0)-(+edited.amt)); else bal += +edited.amt; }
        return (bal !== a.bal || payable !== a.payable) ? { ...a, bal, payable } : a;
      })
    });
    close();
  }, [txns, updMulti, upd]);

  /* ── 刪除交易：還原對帳戶的影響 ── */
  const delTxn = useCallback((id) => {
    const t = txns.find(x => x.id === id);
    if (t?.poolId) {
      const poolKey = t.poolType === "income" ? "pools" : "expensePools";
      const revertBy = t.recognizedDiff != null ? t.recognizedDiff : t.amt;
      upd(poolKey, p => (p||[]).map(x => x.id === t.poolId ? { ...x, recognized: Math.max(0, x.recognized - revertBy) } : x));
    }
    updMulti({
      txns: prevTxns => prevTxns.filter(x => x.id !== id),
      accs: prevAccs => {
        if (!t || t.noBalanceEffect) return prevAccs;
        return prevAccs.map(a => {
          let next = a;
          if (t.acc === a.name) {
            if (t.type === "income") next = { ...next, bal: next.bal - t.amt };
            else if (t.type === "expense") next = a.type === "credit" ? { ...next, payable:(next.payable||0)-t.amt } : { ...next, bal:next.bal+t.amt };
            else if (t.type === "adjust") next = { ...next, bal: next.bal - (t.adjDiff || 0) };
            else if (t.type === "transfer") next = a.type === "credit" ? { ...next, payable:Math.max(0,(next.payable||0)-t.amt) } : { ...next, bal:next.bal + t.amt };
          }
          if (t.type === "transfer" && t.toAcc === a.name) {
            next = a.type === "credit" ? { ...next, payable:Math.max(0,(next.payable||0)+t.amt) } : { ...next, bal: next.bal - t.amt };
          }
          return next;
        });
      }
    });
    close();
  }, [txns, updMulti, upd]);

  /* ── 帳戶餘額調整（初次設定 / 對帳差異，皆不計入收支）── */
  const adjBal = useCallback((acc, newBalStr, isFirst, desc) => {
    const newB = +newBalStr, diff = newB - acc.bal;
    updMulti({
      accs: prevAccs => prevAccs.map(a => a.id === acc.id ? { ...a, bal:newB } : a),
      txns: prevTxns => isFirst ? prevTxns : [...prevTxns, {
        id: Date.now(), type:"adjust", cat:"帳戶調整", amt:Math.abs(diff), adjDiff:diff,
        desc: desc || (diff > 0 ? "餘額調增" : "餘額調減"), acc:acc.name, date:TODAY, tags:"#調整",
      }]
    });
  }, [updMulti]);

  /* ── 待認列收入池：認列本次金額 ── */
  const doRecognize = useCallback(() => {
    if (!selPool || !recAmt) return;
    const amt = Math.min(+recAmt, selPool.totalAmt - selPool.recognized);
    if (amt <= 0) return;
    upd("pools", p => p.map(x => x.id === selPool.id ? { ...x, recognized: x.recognized + amt } : x));
    upd("txns", p => [...p, { id:Date.now(), type:"income", cat:selPool.cat||"其他收入", amt, desc:`認列：${selPool.desc}`, acc:selPool.acc||"", date:TODAY, tags:"#認列", noBalanceEffect:true, poolId:selPool.id, poolType:"income" }]);
    setRecAmt(""); setSelPool(null);
  }, [selPool, recAmt, upd]);

  /* ── 訂閱：編輯 / 新增 ── */
  const saveSub = useCallback((sub) => { upd("subs", p => p.map(x => x.id === sub.id ? sub : x)); close(); }, [upd]);
  const addSub = useCallback(() => {
    if (!nS.name || !nS.amt) return;
    const amt = +nS.amt;
    const newSub = { ...nS, id:"sub"+Date.now(), amt, active:true, lastBilled:TODAY };
    upd("subs", p => [...p, newSub]);
    if (nS.deferExpense && nS.freq === "year") {
      const poolId = "ep" + Date.now();
      const monthlyAmt = Math.round(amt / 12);
      updMulti({
        txns: p => [...p,
          { id:Date.now(), type:"transfer", cat:"帳戶調整", amt, desc:`年繳分攤：${nS.name}（共 ${amt}）`, acc:nS.acc||"", date:TODAY, tags:"#分攤認列", autoSrc:newSub.id },
          { id:Date.now()+1, type:"expense", cat:nS.cat||"訂閱", amt:monthlyAmt, desc:`分攤：${nS.name}`, acc:nS.acc||"", date:TODAY, tags:"#分攤認列", autoSrc:newSub.id, noBalanceEffect:true, poolId, poolType:"expense" },
        ],
        accs: p => nS.acc ? p.map(a => a.name===nS.acc ? (a.type==="credit" ? {...a, payable:(a.payable||0)+amt} : {...a, bal:a.bal-amt}) : a) : p,
      });
      upd("expensePools", p => [...(p||[]), { id:poolId, desc:nS.name, cat:nS.cat||"訂閱", totalAmt:amt, monthlyAmt, recognized:monthlyAmt, startDate:TODAY, acc:nS.acc||"", subId:newSub.id }]);
    } else {
      updMulti({
        txns: p => [...p, { id:Date.now(), type:"expense", cat:nS.cat||"訂閱", amt, desc:nS.name, acc:nS.acc||"", date:TODAY, tags:"#自動記帳", autoSrc:newSub.id }],
        accs: p => nS.acc ? p.map(a => a.name===nS.acc ? (a.type==="credit" ? {...a, payable:(a.payable||0)+amt} : {...a, bal:a.bal-amt}) : a) : p,
      });
    }
    setNS(S0); close();
  }, [nS, upd, updMulti]);

  /* ── 基本開銷：編輯 / 新增 ── */
  const saveBill = useCallback(() => { if (!selBill) return; upd("bills", p => p.map(x => x.id === selBill.id ? selBill : x)); close(); }, [selBill, upd]);
  const addBill = useCallback(() => {
    if (!nB.name || !nB.amt) return;
    const amt = +nB.amt;
    const newBill = { ...nB, id:"bill"+Date.now(), amt, active:true, lastBilled:TODAY };
    upd("bills", p => [...(p||[]), newBill]);
    updMulti({
      txns: p => [...p, { id:Date.now(), type:"expense", cat:nB.cat||"家居", amt, desc:nB.name, acc:nB.acc||"", date:TODAY, tags:"#自動記帳", autoSrc:newBill.id }],
      accs: p => nB.acc ? p.map(a => a.name===nB.acc ? (a.type==="credit" ? {...a, payable:(a.payable||0)+amt} : {...a, bal:a.bal-amt}) : a) : p,
    });
    setNB(B0); close();
  }, [nB, upd, updMulti]);

  /* ── 新增帳戶 ── */
  const addAcc = useCallback(() => {
    if (!nAcc.name) return;
    upd("accs", p => [...p, { id:"a"+Date.now(), name:nAcc.name, type:nAcc.type, cur:nAcc.cur||"TWD", bal:0, vis:true, order:p.length, ...(nAcc.type==="credit"?{ payable:0, limit:+nAcc.limit||0 }:{}) }]);
    setNAcc(NA0); close();
  }, [nAcc, upd]);

  /* ── 信用卡繳費（供其餘檔案共用，Wallet 內建同名邏輯優先）── */
  const doPayCred = useCallback(() => {
    const a = +payF.amt; if (!a || !payF.creditId || !payF.fromId) return;
    const creditAcc = accs.find(x=>x.id===payF.creditId), fromAcc = accs.find(x=>x.id===payF.fromId);
    updMulti({
      accs: p => p.map(ac => ac.id === payF.creditId ? { ...ac, payable:Math.max(0,(ac.payable||0)-a) } : ac.id === payF.fromId ? { ...ac, bal:ac.bal-a } : ac),
      txns: p => [...p, { id:Date.now(), type:"transfer", cat:"帳戶調整", amt:a, desc:payF.note||"信用卡繳費", acc:fromAcc?.name||"", toAcc:creditAcc?.name||"", date:payF.date, tags:"#繳費" }]
    });
    setPayF({ creditId:"", fromId:"", amt:"", date:TODAY, note:"" }); close();
  }, [payF, accs, updMulti]);

  /* ── 股票買入 ── */
  const doBuy = useCallback(() => {
    if (!buyF.ticker || !buyF.shares || !buyF.acc) return;
    const shares = +buyF.shares, totalCost = +buyF.totalCost || (shares * (+buyF.avgCost||0)) + (+buyF.fee||0);
    const trade = { id:"t"+Date.now(), type:"buy", shares, price:+buyF.avgCost||0, fee:+buyF.fee||0, totalCost, date:TODAY, emotion:buyF.emotion||"" };
    upd("stocks", p => {
      const ex = p.find(s => s.ticker === buyF.ticker && s.acc === buyF.acc);
      if (ex) return p.map(s => s.id === ex.id ? { ...s, name:buyF.name||s.name, trades:[...(s.trades||[]), trade] } : s);
      return [...p, { id:"s"+Date.now(), acc:buyF.acc, ticker:buyF.ticker, name:buyF.name||buyF.ticker, market:buyF.market, curPrice:0, trades:[trade] }];
    });
    if (buyF.fromAcc) {
      updMulti({
        accs: p => p.map(a => a.name === buyF.fromAcc ? { ...a, bal:a.bal - totalCost } : a),
        txns: p => [...p, { id:Date.now(), type:"transfer", cat:"股票", amt:totalCost, desc:`買進 ${buyF.name||buyF.ticker}`, acc:buyF.fromAcc, date:TODAY, tags:"#股票" }],
      });
    }
    setBuyF(BF0); close();
  }, [buyF, upd, updMulti]);

  /* ── 股票賣出 ── */
  const doSell = useCallback(() => {
    if (!sellF.stockId || !sellF.shares) return;
    const shares = +sellF.shares, proceeds = +sellF.totalProceeds || 0, fee = +sellF.fee || 0;
    const st = stocks.find(s => s.id === sellF.stockId);
    const sellPrice = shares > 0 ? proceeds / shares : 0;
    const stSumEntry = st ? { avgCost: (() => {
      const buys = (st.trades||[]).filter(t=>t.type==="buy");
      const bSh = buys.reduce((s,t)=>s+t.shares,0);
      const cost = buys.reduce((s,t)=>s+t.shares*t.price+(t.fee||0),0);
      return bSh > 0 ? cost / bSh : 0;
    })() } : null;
    const entryPrice = stSumEntry?.avgCost || 0;
    const stopLoss = (st?.stopLossPct && entryPrice > 0) ? entryPrice * (1 - st.stopLossPct / 100) : null;
    const rValue = (stopLoss != null && entryPrice > 0 && entryPrice !== stopLoss) ? (sellPrice - entryPrice) / Math.abs(entryPrice - stopLoss) : null;
    const brokeDiscipline = stopLoss != null ? (entryPrice > stopLoss ? sellPrice < stopLoss : sellPrice > stopLoss) : false;
    upd("stocks", p => p.map(s => s.id === sellF.stockId ? { ...s, trades:[...(s.trades||[]), { id:"t"+Date.now(), type:"sell", shares, price: sellPrice, fee, date:TODAY, emotion:sellF.emotion||"", pnl:+sellF.pnl||0, entryPrice, stopLoss, rValue, brokeDiscipline }] } : s));
    if (sellF.returnAcc && proceeds) {
      updMulti({
        accs: p => p.map(a => a.name === sellF.returnAcc ? { ...a, bal:a.bal + proceeds - fee } : a),
        txns: p => [...p, { id:Date.now(), type:"transfer", cat:"股票", amt:proceeds - fee, desc:`賣出 ${st?.ticker||""}`, acc:sellF.returnAcc, date:TODAY, tags:"#股票" }],
      });
    }
    if (sellF.pnl && +sellF.pnl !== 0) {
      upd("txns", p => [...p, { id:Date.now()+1, type:sellF.pnlType, cat:sellF.pnlType==="income"?"投資收益":"其他", amt:+sellF.pnl, desc:`${st?.ticker||""} 賣出損益`, acc:sellF.returnAcc||"", date:TODAY, tags:"#股票" }]);
    }
    setSellF({ stockId:"",shares:"",totalProceeds:"",fee:"",pnl:"",pnlType:"income",returnAcc:"",emotion:"" }); close();
  }, [sellF, stocks, upd, updMulti]);

  /* ── 更新個股的停損價 / 產業別標記 ── */
  const updateStockMeta = useCallback((stockId, patch) => {
    upd("stocks", p => p.map(s => s.id === stockId ? { ...s, ...patch } : s));
  }, [upd]);

  /* ── 以下為介面完整性保留的安全空實作（各檔案內已用 upd() 就地處理，不會被實際呼叫）── */
  const doInit = useCallback(() => {}, []);
  const addDebt = useCallback(() => {}, []);

  /* ── 讀取股價 ── */
  const fetchPrice = useCallback(async (ticker, market) => {
    const sym = market === "TW" ? `${ticker}.TW` : ticker;
    const yahooV7 = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${sym}&fields=regularMarketPrice,shortName,longName`;
    const yahooV8 = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=2d`;
    const proxies = [
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    ];
    for (const makeProxy of proxies) {
      for (const apiUrl of [yahooV7, yahooV8]) {
        try {
          const r = await fetch(makeProxy(apiUrl), { signal:AbortSignal.timeout(7000) });
          if (!r.ok) continue;
          const raw = await r.text();
          let d; try { const j = JSON.parse(raw); d = j.contents ? JSON.parse(j.contents) : j; } catch { continue; }
          const v7result = d?.quoteResponse?.result?.[0];
          if (v7result?.regularMarketPrice) return { price: v7result.regularMarketPrice, name: v7result.shortName || v7result.longName || ticker, sym };
          const meta = d?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) return { price: meta.regularMarketPrice, name: meta.shortName || meta.longName || ticker, sym };
        } catch { continue; }
      }
    }
    return null;
  }, []);

  const fetchAllPrices = useCallback(async (stockList) => {
    const list = stockList || stocks;
    if (!list || list.length === 0) return;
    try {
      const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
      const res = await fetch(`${base}stock_prices.json?t=${Date.now()}`, { signal:AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        upd("stocks", p => p.map(s => {
          const keys = [`${s.ticker}.TW`, s.ticker, s.ticker.toUpperCase(), `${s.ticker}.US`];
          const item = keys.map(k => data[k]).find(v => v?.price);
          if (item) return { ...s, curPrice:item.price, name:item.name||s.name, lastUpdated:item.updated||"", _extra: { high:item.high, low:item.low, vol:item.vol, chgPct:item.chgPct, institutional:item.institutional, institutional_date:item.institutional_date } };
          return s;
        }));
        return;
      }
    } catch {}
    for (const st of list) {
      const res = await fetchPrice(st.ticker, st.market);
      if (res?.price) upd("stocks", p => p.map(s => s.id===st.id ? {...s, curPrice:res.price, name:res.name||s.name, lastUpdated:new Date().toLocaleTimeString("zh-TW")} : s));
      await new Promise(r => setTimeout(r, 200));
    }
  }, [stocks, fetchPrice, upd]);

  /* ── 自動記帳 ── */
  useEffect(() => {
    if (!d || !d.subs) return;
    const getDueDates = (item, lastDate) => {
      const dates = [];
      const today = new Date(TODAY);
      const start = lastDate ? new Date(lastDate) : new Date(item.date || TODAY);
      if (item.freq === "week") {
        const wd = +(item.weekday || 1);
        let cur = new Date(start); cur.setDate(cur.getDate() + 1);
        while (cur.getDay() !== wd) cur.setDate(cur.getDate() + 1);
        while (cur <= today) { dates.push(cur.toISOString().slice(0, 10)); cur = new Date(cur); cur.setDate(cur.getDate() + 7); }
      } else if (item.freq === "year") {
        const mo = +(item.yearMonth || 1) - 1; const dy = +(item.day || 1);
        let cur = new Date(start); cur.setDate(cur.getDate() + 1);
        let yr = cur.getFullYear(); let candidate = new Date(yr, mo, dy);
        if (candidate <= cur) candidate = new Date(yr + 1, mo, dy);
        while (candidate <= today) { dates.push(candidate.toISOString().slice(0, 10)); candidate = new Date(candidate.getFullYear() + 1, mo, dy); }
      } else {
        const dy = +(item.day || 1);
        let cur = new Date(start); cur.setDate(cur.getDate() + 1);
        let yr = cur.getFullYear(), mo = cur.getMonth(); let candidate = new Date(yr, mo, dy);
        if (candidate <= cur) { mo++; if (mo > 11) { mo = 0; yr++; } candidate = new Date(yr, mo, dy); }
        while (candidate <= today) { dates.push(candidate.toISOString().slice(0, 10)); mo++; if (mo > 11) { mo = 0; yr++; } candidate = new Date(yr, mo, dy); }
      }
      return dates;
    };
    let newTxns = [];
    let newPools = [];
    (d.subs || []).filter(s => s.active).forEach(s => {
      const lastDate = s.lastBilled || null; const dues = getDueDates(s, lastDate);
      dues.forEach(date => {
        if (s.deferExpense && s.freq === "year") {
          const poolId = "ep" + Date.now() + Math.random();
          newTxns.push({ id: Date.now() + Math.random(), type: "transfer", cat: "帳戶調整", amt: s.amt, desc: `年繳分攤：${s.name}（共 ${s.amt}）`, acc: s.acc || "", date, tags: "#分攤認列", autoSrc: s.id });
          newPools.push({ id: poolId, desc: s.name, cat: s.cat || "訂閱", totalAmt: s.amt, monthlyAmt: Math.round(s.amt / 12), recognized: 0, startDate: date, acc: s.acc || "", subId: s.id });
        } else {
          newTxns.push({ id: Date.now() + Math.random(), type: "expense", cat: s.cat || "訂閱", amt: s.amt, desc: s.name, acc: s.acc || "", date, tags: "#自動記帳", autoSrc: s.id });
        }
      });
      if (dues.length > 0) upd("subs", p => p.map(x => x.id === s.id ? { ...x, lastBilled: dues[dues.length - 1] } : x));
    });
    (d.bills || []).filter(b => b.active).forEach(b => {
      const lastDate = b.lastBilled || null; const dues = getDueDates(b, lastDate);
      dues.forEach(date => { newTxns.push({ id: Date.now() + Math.random(), type: "expense", cat: b.cat || "家居", amt: b.amt, desc: b.name, acc: b.acc || "", date, tags: "#自動記帳", autoSrc: b.id }); });
      if (dues.length > 0) upd("bills", p => p.map(x => x.id === b.id ? { ...x, lastBilled: dues[dues.length - 1] } : x));
    });
    if (newTxns.length > 0) {
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
    }
    if (newPools.length > 0) {
      upd("expensePools", p => [...(p || []), ...newPools]);
    }

    /* ── 每月自動認列費用分攤池（年繳訂閱分12個月認列）── */
    const allPools = [...(d.expensePools || []), ...newPools];
    const today = new Date(TODAY);
    const recogTxns = [];
    const poolUpdates = [];
    allPools.forEach(pool => {
      if (pool.recognized >= pool.totalAmt) return;
      const start = new Date(pool.startDate);
      let recCount = Math.round(pool.recognized / pool.monthlyAmt);
      let recognized = pool.recognized;
      let cur = new Date(start.getFullYear(), start.getMonth() + recCount, start.getDate());
      while (cur <= today && recCount < (pool.installments || 12)) {
        const amt = Math.min(pool.monthlyAmt, pool.totalAmt - recognized);
        recogTxns.push({ id: Date.now() + Math.random(), type: "expense", cat: pool.cat, amt, desc: `分攤：${pool.desc}`, acc: pool.acc || "", date: cur.toISOString().slice(0, 10), tags: "#分攤認列", autoSrc: pool.subId, noBalanceEffect:true, poolId: pool.id, poolType:"expense" });
        recognized += amt; recCount++;
        cur = new Date(start.getFullYear(), start.getMonth() + recCount, start.getDate());
      }
      if (recognized !== pool.recognized) poolUpdates.push({ id: pool.id, recognized });
    });
    if (recogTxns.length > 0) upd("txns", p => [...p, ...recogTxns]);
    if (poolUpdates.length > 0) upd("expensePools", p => (p || []).map(x => { const u = poolUpdates.find(y => y.id === x.id); return u ? { ...x, recognized:u.recognized } : x; }));
  }, []);

  useEffect(() => { if (stocks.length > 0) fetchAllPrices(stocks); }, [stocks.length]);

  /* ── 一次性遷移：把舊的認列/分攤紀錄回溯補上 poolId 等欄位，讓刪除時能正確退回分攤池 ── */
  useEffect(() => {
    const needsMigration = txns.some(t => (t.tags === "#認列" || t.tags === "#分攤認列" || t.tags === "#認列調整") && t.poolId == null);
    if (!needsMigration) return;
    const patched = txns.map(t => {
      if (t.poolId != null) return t;
      if (t.tags === "#分攤認列" && t.autoSrc) {
        const pool = expensePools.find(p => p.subId === t.autoSrc);
        if (pool) return { ...t, poolId: pool.id, poolType:"expense", noBalanceEffect:true };
      }
      if (t.tags === "#認列" && t.desc?.startsWith("認列：")) {
        const label = t.desc.slice(3);
        const pool = pools.find(p => p.desc === label);
        if (pool) return { ...t, poolId: pool.id, poolType:"income", noBalanceEffect:true };
      }
      if (t.tags === "#認列調整") {
        if (t.desc?.startsWith("認列調整：")) {
          const pool = pools.find(p => p.desc === t.desc.slice(5));
          if (pool) return { ...t, poolId: pool.id, poolType:"income", noBalanceEffect:true, recognizedDiff: t.type === "income" ? t.amt : -t.amt };
        }
        if (t.desc?.startsWith("分攤調整：")) {
          const pool = expensePools.find(p => p.desc === t.desc.slice(5));
          if (pool) return { ...t, poolId: pool.id, poolType:"expense", noBalanceEffect:true, recognizedDiff: t.type === "expense" ? t.amt : -t.amt };
        }
      }
      return t;
    });
    if (patched.some((t, i) => t !== txns[i])) upd("txns", () => patched);
  }, [txns, pools, expensePools, upd]);

  /* ── 財務核心計算邏輯 ── */
  const visA = useMemo(() => accs.filter(a => a.type !== "credit" && a.vis), [accs]);
  const totDebt = useMemo(() => accs.filter(a => a.type === "credit" && a.vis).reduce((s, c) => s + (c.payable || 0), 0), [accs]);
  const totRec = useMemo(() => debts.filter(x => x.type === "receivable" && !x.settled).reduce((s, x) => s + (x.amt - (x.installPaidAmt||0)), 0), [debts]);
  const totPay = useMemo(() => debts.filter(x => x.type === "payable" && !x.settled).reduce((s, x) => s + (x.amt - (x.installPaidAmt||0)), 0), [debts]);
  const subsMo = useMemo(() => subs.filter(s => s.active).reduce((s, x) => s + x.amt, 0), [subs]);
  const billsMo = useMemo(() => (bills || []).filter(b => b.active).reduce((s, x) => s + x.amt, 0), [bills]);
  const totPools = useMemo(() => pools.reduce((s, p) => s + (p.totalAmt - p.recognized), 0), [pools]);
  const totExpensePools = useMemo(() => expensePools.reduce((s, p) => s + (p.totalAmt - p.recognized), 0), [expensePools]);

  /* ── 每月存錢目標（提醒自己這個月/下個月要存多少錢到哪個帳戶）── */
  const savingsTargets = d.savingsTargets || [];
  const setSavingsTarget = useCallback((ym, accId, bucketId, amount, note) => {
    upd("savingsTargets", p => {
      const rest = (p||[]).filter(x => x.ym !== ym);
      if (!amount || +amount <= 0) return rest;
      return [...rest, { id:"sv"+ym, ym, accId:accId||null, bucketId:bucketId||null, amount:+amount, note:note||"" }];
    });
  }, [upd]);
  const removeSavingsTarget = useCallback((ym) => upd("savingsTargets", p => (p||[]).filter(x=>x.ym!==ym)), [upd]);

  const curYm = TODAY.slice(0,7);
  const nextYm = (() => { const d2 = new Date(TODAY); d2.setMonth(d2.getMonth()+1); return d2.toISOString().slice(0,7); })();
  const savingsProgress = useCallback((target) => {
    if (!target) return 0;
    const accName = target.accId ? accs.find(a=>a.id===target.accId)?.name : null;
    const bucket = target.bucketId ? buckets.find(b=>b.id===target.bucketId) : null;
    if (bucket) {
      const hist = (bucket.history||[]).filter(h => h.date.slice(0,7) <= target.ym).sort((a,b)=>a.date.localeCompare(b.date));
      const startHist = (bucket.history||[]).filter(h => h.date.slice(0,7) < target.ym).sort((a,b)=>b.date.localeCompare(a.date))[0];
      const endVal = hist[hist.length-1]?.allocated ?? bucket.allocated;
      const startVal = startHist?.allocated ?? 0;
      return Math.max(0, endVal - startVal);
    }
    if (!accName) return 0;
    return txns.filter(t => t.date.slice(0,7) === target.ym).reduce((s,t) => {
      if (t.type === "transfer" && t.toAcc === accName) return s + t.amt;
      if (t.type === "income" && t.acc === accName) return s + t.amt;
      return s;
    }, 0);
  }, [accs, buckets, txns]);
  const curSavingsTarget = savingsTargets.find(x => x.ym === curYm);
  const nextSavingsTarget = savingsTargets.find(x => x.ym === nextYm);
  const showNextMonthReminder = new Date(TODAY).getDate() >= 24 && !nextSavingsTarget;
  const cashBal = useMemo(() => accs.filter(a => a.type !== "credit" && a.type !== "investment" && a.vis).reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0), [accs, rates]);

  const stSum = useMemo(() => stocks.map(st => {
    const buys  = st.trades.filter(t => t.type==="buy");
    const sells = st.trades.filter(t => t.type==="sell");
    const bSh   = buys.reduce((s,t)=>s+t.shares,0);
    const sSh   = sells.reduce((s,t)=>s+t.shares,0);
    const initSh = st.manualShares != null ? st.manualShares : 0;
    const totalSh = st.manualShares != null ? Math.max(0, initSh + bSh - sSh) : Math.max(0, bSh - sSh);
    const initCost = st.manualTotalCost != null ? st.manualTotalCost : 0;
    const tradesCost = buys.reduce((s,t)=>s+t.shares*t.price+(t.fee||0), 0);
    const totalCost = st.manualTotalCost != null ? initCost + tradesCost : tradesCost;
    const avgCost = totalSh > 0 ? totalCost / totalSh : (st.manualAvgCost || 0);
    const mv  = totalSh * (st.curPrice||0);
    const upnl = mv - totalCost;
    return {...st, totalSh, totalCost, avgCost, mv, upnl};
  }), [stocks]);

  const stTotMv = useMemo(() => stSum.reduce((s, x) => s + x.mv, 0), [stSum]);
  const stTotCost = useMemo(() => stSum.reduce((s, x) => s + x.totalCost, 0), [stSum]);
  
  const totAssets = useMemo(() => {
    const excludedBucketTotal = buckets.filter(b => b.vis === false).reduce((s, b) => {
      const acc = accs.find(a => a.id === b.accId);
      return s + toTWD(b.allocated, acc?.cur || "TWD", rates);
    }, 0);
    const accBal = visA.reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0) - excludedBucketTotal;
    if (useMvForAssets && stTotMv > 0) {
      const invAccBal = visA.filter(a => a.type==="investment").reduce((s,a) => s+toTWD(a.bal,a.cur,rates), 0);
      return accBal - invAccBal + stTotMv;
    }
    return accBal;
  }, [visA, rates, useMvForAssets, stTotMv, buckets, accs]);

  const netWorth = totAssets - totDebt - totPay + totRec;
  const allocPie = useMemo(() => {
    const typeLabel = { cash:"現金", debit:"金融卡", investment:"證券帳戶", credit:"信用卡" };
    const byType = {};
    visA.forEach(a => { byType[a.type] = (byType[a.type] || 0) + toTWD(a.bal, a.cur, rates); });
    return Object.entries(byType).map(([type, value]) => ({ name: typeLabel[type] || type, value })).filter(x => x.value > 0);
  }, [visA, rates]);
  const holdPie = useMemo(() => {
    const map = {};
    stSum.filter(x=>x.totalSh>0).forEach(x => {
      const key = `${x.ticker}_${x.market}`;
      if (!map[key]) map[key] = { name:x.ticker, value:0 };
      map[key].value += x.totalCost;
    });
    return Object.values(map);
  }, [stSum]);

  const invGrowth = useMemo(() => {
    const dayMap = {};
    stocks.forEach(st => {
      if (st.manualShares && st.manualTotalCost) {
        const dt = (st.trades?.[0]?.date || TODAY);
        dayMap[dt] = (dayMap[dt]||0) + st.manualTotalCost;
      }
      (st.trades||[]).filter(t=>t.type==="buy").forEach(t => {
        const cost = t.totalCost || (t.shares*(t.price||0)) + (t.fee||0);
        dayMap[t.date] = (dayMap[t.date]||0) + cost;
      });
    });
    const days = Object.keys(dayMap).sort();
    if (!days.length) return [];
    const start = new Date(days[0]), end = new Date(TODAY);
    let cumCost = 0; const mvRatio = stTotCost > 0 ? stTotMv / stTotCost : 1;
    const result = [];
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate()+1)) {
      const dateStr = cur.toISOString().slice(0,10);
      cumCost += (dayMap[dateStr] || 0);
      result.push({ m:`${cur.getMonth()+1}/${cur.getDate()}`, cost:Math.round(cumCost), mv:Math.round(stTotMv > 0 ? cumCost * mvRatio : 0) });
    }
    return result;
  }, [stocks, stTotMv, stTotCost]);

  const [dailyGrowth, setDailyGrowth] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);

  /* ── 抓取單一標的每日收盤價（近一年，日線）── */
  const fetchDailyHistory = useCallback(async (ticker, market) => {
    const sym = market === "TW" ? `${ticker}.TW` : ticker;
    const apiUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1y`;
    const proxies = [
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    ];
    for (const makeProxy of proxies) {
      try {
        const r = await fetch(makeProxy(apiUrl), { signal:AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const raw = await r.text();
        let d; try { const j = JSON.parse(raw); d = j.contents ? JSON.parse(j.contents) : j; } catch { continue; }
        const result = d?.chart?.result?.[0];
        const ts = result?.timestamp, closes = result?.indicators?.quote?.[0]?.close;
        if (!ts || !closes) continue;
        return ts.map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] })).filter(x => x.close != null);
      } catch { continue; }
    }
    return [];
  }, []);

  /* ── 通用股價區間查詢：1日/5日/1月/3月/6月/1年 ── */
  const RANGE_OPTS = [
    { key:"1d", label:"1日", range:"1d", interval:"5m" },
    { key:"5d", label:"5日", range:"5d", interval:"15m" },
    { key:"1mo", label:"1月", range:"1mo", interval:"1d" },
    { key:"3mo", label:"3月", range:"3mo", interval:"1d" },
    { key:"6mo", label:"6月", range:"6mo", interval:"1d" },
    { key:"1y", label:"1年", range:"1y", interval:"1d" },
  ];
  const fetchStockRange = useCallback(async (ticker, market, rangeKey) => {
    const opt = RANGE_OPTS.find(o => o.key === rangeKey) || RANGE_OPTS[2];
    const sym = market === "TW" ? `${ticker}.TW` : ticker;
    const apiUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=${opt.interval}&range=${opt.range}`;
    const proxies = [
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];
    for (const makeProxy of proxies) {
      try {
        const r = await fetch(makeProxy(apiUrl), { signal:AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const raw = await r.text();
        let d; try { const j = JSON.parse(raw); d = j.contents ? JSON.parse(j.contents) : j; } catch { continue; }
        const result = d?.chart?.result?.[0];
        const ts = result?.timestamp, closes = result?.indicators?.quote?.[0]?.close;
        if (!ts || !closes) continue;
        const isIntraday = opt.interval.endsWith("m");
        return ts.map((t, i) => ({
          t,
          label: isIntraday ? new Date(t * 1000).toLocaleTimeString("zh-TW", { hour:"2-digit", minute:"2-digit" }) : new Date(t * 1000).toISOString().slice(5, 10),
          close: closes[i],
        })).filter(x => x.close != null);
      } catch { continue; }
    }
    return [];
  }, []);
  const fetchDailyGrowth = useCallback(async () => {
    const held = stocks.filter(s => (s.trades?.some(t => t.type === "buy")) || s.manualShares);
    if (!held.length) { setDailyGrowth([]); return []; }
    setLoadingDaily(true);
    try {
      const histories = await Promise.all(held.map(s => fetchDailyHistory(s.ticker, s.market)));
      const allDates = new Set();
      histories.forEach(h => h.forEach(x => allDates.add(x.date)));
      const dateList = [...allDates].sort();
      if (!dateList.length) { setDailyGrowth([]); return []; }
      const result = dateList.map(date => {
        let mv = 0;
        held.forEach((s, i) => {
          let shares = s.manualShares || 0;
          (s.trades || []).forEach(t => {
            if (t.date > date) return;
            if (t.type === "buy") shares += t.shares;
            else if (t.type === "sell") shares -= t.shares;
          });
          if (shares <= 0) return;
          const hist = histories[i];
          let price = null;
          for (let j = hist.length - 1; j >= 0; j--) { if (hist[j].date <= date) { price = hist[j].close; break; } }
          if (price != null) mv += shares * price;
        });
        return { date: date.slice(5), mv: Math.round(mv) };
      }).filter(x => x.mv > 0);
      setDailyGrowth(result);
      return result;
    } catch {
      setDailyGrowth([]);
      return [];
    } finally {
      setLoadingDaily(false);
    }
  }, [stocks, fetchDailyHistory]);

  /* ══════════════════════════════════════════════════════
     績效分析 / 風控 / 觀察清單 / 視覺化
  ══════════════════════════════════════════════════════ */

  /* ── 勝率、賺賠比、平均R值 ── */
  const tradeStats = useMemo(() => {
    const sells = [];
    stocks.forEach(s => (s.trades || []).forEach(t => { if (t.type === "sell") sells.push({ ...t, ticker:s.ticker, name:s.name }); }));
    const wins = sells.filter(t => (t.pnl || 0) > 0);
    const losses = sells.filter(t => (t.pnl || 0) < 0);
    const winRate = sells.length ? (wins.length / sells.length * 100) : null;
    const avgWin = wins.length ? wins.reduce((s,t)=>s+t.pnl,0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s,t)=>s+t.pnl,0) / losses.length : 0;
    const winLossRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null;
    const rTrades = sells.filter(t => t.rValue != null);
    const avgR = rTrades.length ? rTrades.reduce((s,t)=>s+t.rValue,0) / rTrades.length : null;
    const disciplined = sells.filter(t => t.stopLoss != null);
    const brokeStop = disciplined.filter(t => t.brokeDiscipline);
    return { totalSells:sells.length, wins:wins.length, losses:losses.length, winRate, avgWin, avgLoss, winLossRatio, avgR, rCount:rTrades.length, disciplinedCount:disciplined.length, brokeStopCount:brokeStop.length, sells };
  }, [stocks]);

  /* ── 與大盤（0050）績效比較 ── */
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const fetchBenchmarkCompare = useCallback(async () => {
    let growth = dailyGrowth;
    if (!growth.length) { growth = await fetchDailyGrowth(); }
    setLoadingBenchmark(true);
    try {
      const hist = await fetchDailyHistory("0050", "TW");
      if (!hist.length || !growth.length) { setBenchmarkData([]); return; }
      const startDate = growth[0]?.date;
      const base = growth[0]?.mv || 1;
      const benchBase = hist.find(h => h.date.slice(5) >= startDate)?.close || hist[0].close;
      const merged = growth.map(d => {
        let benchPrice = null;
        for (let j = hist.length - 1; j >= 0; j--) { if (hist[j].date.slice(5) <= d.date) { benchPrice = hist[j].close; break; } }
        return { date:d.date, portfolio: Math.round((d.mv / base - 1) * 1000) / 10, benchmark: benchPrice ? Math.round((benchPrice / benchBase - 1) * 1000) / 10 : null };
      });
      setBenchmarkData(merged);
    } catch { setBenchmarkData([]); }
    finally { setLoadingBenchmark(false); }
  }, [dailyGrowth, fetchDailyHistory, fetchDailyGrowth]);

  /* ── 自選股（尚未持有，追蹤價格用）── */
  const watchStocks = d.watchStocks || [];
  const addWatchStock = useCallback((item) => upd("watchStocks", p => [...(p||[]), { id:"ws"+Date.now(), ...item }]), [upd]);
  const removeWatchStock = useCallback((id) => upd("watchStocks", p => (p||[]).filter(x=>x.id!==id)), [upd]);
  const [loadingWatch, setLoadingWatch] = useState(false);
  const [growthBucket, setGrowthBucket] = useState(null);
  const refreshWatchStocks = useCallback(async () => {
    if (!watchStocks.length) return;
    setLoadingWatch(true);
    try {
      const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
      let data = null;
      try {
        const res = await fetch(`${base}stock_prices.json?t=${Date.now()}`, { signal:AbortSignal.timeout(4000) });
        if (res.ok) data = await res.json();
      } catch {}
      const needsLiveLookup = [];
      if (data) {
        upd("watchStocks", p => (p||[]).map(w => {
          const keys = [`${w.ticker}.TW`, w.ticker, w.ticker.toUpperCase(), `${w.ticker}.US`];
          const item = keys.map(k => data[k]).find(v => v?.price);
          if (item) return { ...w, curPrice:item.price, name:item.name||w.name, _extra:{ chgPct:item.chgPct } };
          needsLiveLookup.push(w);
          return w;
        }));
      } else {
        needsLiveLookup.push(...watchStocks);
      }
      // 靜態清單裡沒有的（自選股通常不在你原本的持股清單內），改用即時查詢逐一補上
      for (const w of needsLiveLookup) {
        const res = await fetchPrice(w.ticker, w.market);
        if (res?.price) upd("watchStocks", p => (p||[]).map(x => x.id===w.id ? { ...x, curPrice:res.price, name:res.name||x.name } : x));
        await new Promise(r => setTimeout(r, 200));
      }
    } finally { setLoadingWatch(false); }
  }, [watchStocks, fetchPrice, upd]);

  /* ── 每日損益熱力圖（近 90 天，依交易記帳的淨收支）── */
  const dailyPnlHeatmap = useMemo(() => {
    const map = {};
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    txns.forEach(t => {
      if (new Date(t.date).getTime() < cutoff) return;
      if (t.type !== "income" && t.type !== "expense") return;
      if (t.cat === "帳戶調整") return;
      map[t.date] = (map[t.date] || 0) + (t.type === "income" ? t.amt : -t.amt);
    });
    return map;
  }, [txns]);

  /* ── 產業/類股分佈（依手動標記的 sector）── */
  const sectorPie = useMemo(() => {
    const map = {};
    stSum.forEach(s => { if (s.totalSh > 0) { const key = s.sector || "未分類"; map[key] = (map[key] || 0) + (s.mv > 0 ? s.mv : s.totalCost); } });
    return Object.entries(map).map(([name, value]) => ({ name, value })).filter(x => x.value > 0);
  }, [stSum]);

  /* ── 股息估算（用最近一次實際配息 × 持股數，非未來預測日期）── */
  const [dividendEst, setDividendEst] = useState([]);
  const [loadingDiv, setLoadingDiv] = useState(false);
  const fetchDividendEstimate = useCallback(async () => {
    const held = stSum.filter(s => s.totalSh > 0);
    if (!held.length) { setDividendEst([]); return; }
    setLoadingDiv(true);
    try {
      const results = await Promise.all(held.map(async s => {
        const sym = s.market === "TW" ? `${s.ticker}.TW` : s.ticker;
        const apiUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1y&events=div`;
        const proxies = [
          (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
          (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        ];
        for (const makeProxy of proxies) {
          try {
            const r = await fetch(makeProxy(apiUrl), { signal:AbortSignal.timeout(8000) });
            if (!r.ok) continue;
            const raw = await r.text();
            let d2; try { const j = JSON.parse(raw); d2 = j.contents ? JSON.parse(j.contents) : j; } catch { continue; }
            const divs = d2?.chart?.result?.[0]?.events?.dividends;
            if (!divs) return { ...s, lastDiv:0, annualDiv:0 };
            const vals = Object.values(divs).map(x => x.amount).filter(Boolean);
            if (!vals.length) return { ...s, lastDiv:0, annualDiv:0 };
            const lastDiv = vals[vals.length - 1];
            const annualDiv = vals.reduce((sum, v) => sum + v, 0);
            return { ...s, lastDiv, annualDiv: annualDiv * s.totalSh };
          } catch { continue; }
        }
        return { ...s, lastDiv:0, annualDiv:0 };
      }));
      setDividendEst(results.filter(x => x.annualDiv > 0));
    } catch { setDividendEst([]); }
    finally { setLoadingDiv(false); }
  }, [stSum]);

  /* ── 股利公告（TWSE OpenAPI 官方資料，非估算）── */
  const [dividendAnnounce, setDividendAnnounce] = useState([]);
  const [loadingDivAnn, setLoadingDivAnn] = useState(false);
  const [divAnnFetched, setDivAnnFetched] = useState(false);
  const fetchDividendAnnounce = useCallback(async () => {
    const held = stSum.filter(s => s.totalSh > 0 && s.market === "TW");
    if (!held.length) { setDividendAnnounce([]); setDivAnnFetched(true); return; }
    setLoadingDivAnn(true);
    const apiUrl = "https://openapi.twse.com.tw/v1/opendata/t187ap45_L";
    const attempts = [
      () => apiUrl,
      () => `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`,
      () => `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
    ];
    try {
      let list = null;
      for (const makeUrl of attempts) {
        try {
          const r = await fetch(makeUrl(), { signal:AbortSignal.timeout(10000) });
          if (!r.ok) continue;
          const raw = await r.text();
          try {
            const j = JSON.parse(raw);
            list = Array.isArray(j) ? j : (j.contents ? JSON.parse(j.contents) : null);
          } catch { continue; }
          if (Array.isArray(list)) break;
        } catch { continue; }
      }
      if (!list) { setDividendAnnounce([]); setDivAnnFetched(true); return; }
      const tickers = new Set(held.map(s => s.ticker));
      const matched = list.filter(row => tickers.has(row["公司代號"]));
      const results = held.map(s => {
        const row = matched.find(r => r["公司代號"] === s.ticker);
        if (!row) return { ticker:s.ticker, name:s.name, announced:false };
        const cashDiv = +row["盈餘分配之現金股利(元/股)"] || +row["現金股利(元/股)"] || 0;
        return {
          ticker:s.ticker, name:s.name, announced:true,
          year: row["股利所屬年度"] || "",
          distDate: row["董事會（擬議）股利分派日"] || row["股東會日期"] || "",
          cashDivPerShare: cashDiv,
          estIncome: cashDiv * s.totalSh,
        };
      });
      setDividendAnnounce(results);
      setDivAnnFetched(true);
    } catch { setDividendAnnounce([]); setDivAnnFetched(true); }
    finally { setLoadingDivAnn(false); }
  }, [stSum]);
  const emotionReview = useMemo(() => {
    const map = {};
    EMOTIONS.forEach(e => { map[e.key] = { ...e, buyCount:0, buyTotal:0, sellCount:0, sellPnl:0, sellWin:0 }; });
    stocks.forEach(s => (s.trades || []).forEach(t => {
      if (!t.emotion || !map[t.emotion]) return;
      if (t.type === "buy") { map[t.emotion].buyCount++; map[t.emotion].buyTotal += (t.totalCost || 0); }
      else if (t.type === "sell") { map[t.emotion].sellCount++; map[t.emotion].sellPnl += (t.pnl || 0); if ((t.pnl || 0) > 0) map[t.emotion].sellWin++; }
    }));
    return Object.values(map).filter(x => x.buyCount > 0 || x.sellCount > 0);
  }, [stocks]);

  const stByAcc = useMemo(() => { const g = {}; stSum.forEach(x => { (g[x.acc] || (g[x.acc] = [])).push(x); }); return g; }, [stSum]);
  const moTxns = useMemo(() => txns.filter(t => { const [y, m] = t.date.split("-").map(Number); return y === month.y && m === month.m; }), [txns, month]);
  const poolThisMo = useMemo(() => pools.filter(p => { const [py, pm] = p.date.split("-").map(Number); return py === month.y && pm === month.m; }).reduce((s, p) => s + (p.recognized || 0), 0), [pools, month]);
  const moInc = useMemo(() => moTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").reduce((s, t) => s + t.amt, 0), [moTxns]);
  const moExp = useMemo(() => moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + (t.proxyAmt ? t.amt - t.proxyAmt : t.amt), 0), [moTxns]);
  const expCat = useMemo(() => { const m = {}; moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").forEach(t => { const own = t.proxyAmt ? t.amt - t.proxyAmt : t.amt; m[t.cat] = (m[t.cat] || 0) + own; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [moTxns]);
  const incCat = useMemo(() => { const m = {}; moTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amt; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [moTxns]);
  const alertAmt = useMemo(() => moTxns.filter(t => t.type === "expense" && ["食物","交通","家居"].includes(t.cat)).reduce((s, t) => s + t.amt, 0), [moTxns]);
  const alertR = moInc > 0 ? alertAmt / moInc : 0;
  const passiveMo = useMemo(() => moTxns.filter(t => t.type === "income" && PASSIVE.includes(t.cat)).reduce((s, t) => s + t.amt, 0), [moTxns]);
  const grpTxns = useMemo(() => {
    const g = {}; let f = [...moTxns].sort((a, b) => b.date.localeCompare(a.date));
    if (sq) f = f.filter(t => (t.desc || "").toLowerCase().includes(sq.toLowerCase()) || t.cat.includes(sq) || (t.acc || "").includes(sq));
    f.forEach(t => { (g[t.date] || (g[t.date] = [])).push(t); }); return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [moTxns, sq]);

  const hTxns = useMemo(() => txns.filter(t => t.date >= healthRange.s && t.date <= healthRange.e), [txns, healthRange]);
  const hInc = useMemo(() => hTxns.filter(t => t.type === "income" && t.tags !== "#往來帳").reduce((s, t) => s + t.amt, 0), [hTxns]);
  const hExp = useMemo(() => hTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + (t.proxyAmt ? t.amt - t.proxyAmt : t.amt), 0), [hTxns]);
  const isSingleMo = useMemo(() => { const s = new Date(chartRange.s), e = new Date(chartRange.e); return s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth(); }, [chartRange]);
  
  const chartData = useMemo(() => {
    if (!txns.length || !chartRange.s || !chartRange.e) return [];
    const s = new Date(chartRange.s), e = new Date(chartRange.e);
    if (e < s) return [];
    const afterNet = txns.filter(t => t.date > chartRange.e).reduce((acc, t) => t.type === "income" && t.cat !== "帳戶調整" ? acc + t.amt : t.type === "expense" && t.cat !== "帳戶調整" ? acc - t.amt : acc, 0);
    const endAssets = totAssets - afterNet;
    const dayNet = {};
    txns.forEach(t => {
      if (t.date < chartRange.s || t.date > chartRange.e) return;
      if (t.type === "income" && t.cat !== "帳戶調整") dayNet[t.date] = (dayNet[t.date] || 0) + t.amt;
      if (t.type === "expense" && t.cat !== "帳戶調整") dayNet[t.date] = (dayNet[t.date] || 0) - t.amt;
    });
    const result = [];
    let running = endAssets;
    let cur = new Date(e);
    while (cur >= s) {
      const dateStr = cur.toISOString().slice(0, 10);
      result.unshift({
        d: isSingleMo ? `${cur.getDate()}日` : `${cur.getMonth() + 1}/${cur.getDate()}`,
        m: `${cur.getFullYear()}/${cur.getMonth() + 1}月`,
        assets: Math.max(0, running),
      });
      running -= (dayNet[dateStr] || 0);
      cur.setDate(cur.getDate() - 1);
    }
    return result;
  }, [txns, chartRange, isSingleMo, totAssets]);

  const [assetView, setAssetView] = useState("level");
  const changeData = useMemo(() => chartData.map((d, i) => ({ ...d, change: i === 0 ? 0 : Math.round(d.assets - chartData[i - 1].assets) })), [chartData]);

  /* ── 最大回撤（優先用每日市值序列，沒有的話退回月度資產序列）── */
  const maxDrawdown = useMemo(() => {
    const series = dailyGrowth.length > 3 ? dailyGrowth.map(d => d.mv) : chartData.map(d => d.assets);
    if (series.length < 2) return null;
    let peak = series[0], maxDD = 0;
    series.forEach(v => { if (v > peak) peak = v; const dd = peak > 0 ? (peak - v) / peak * 100 : 0; if (dd > maxDD) maxDD = dd; });
    return { pct:maxDD, source: dailyGrowth.length > 3 ? "daily" : "monthly" };
  }, [dailyGrowth, chartData]);

  const rl = r => { if (!r.s || !r.e) return "—"; if (r.s === r.e) return r.s; const s = new Date(r.s), e = new Date(r.e); if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) return `${s.getFullYear()}/${s.getMonth() + 1}月`; return `${r.s.slice(5)}~${r.e.slice(5)}`; };
  const prevMo = () => setMonth(({ y, m }) => m === 1 ? { y:y - 1, m:12 } : { y, m:m - 1 });
  const nextMo = () => setMonth(({ y, m }) => m === 12 ? { y:y + 1, m:1 } : { y, m:m + 1 });

  /* ── 統一組裝共用 props，傳給所有頁面與彈窗元件 ── */
  const p = {
    C, tab, setTab, iSt, fmt, toTWD, pnlColor, upd, setModal, modal, close, confirm, TODAY,
    accs, txns, debts, subs, bills, stocks, pools, cats, rates, goals, policies,
    stSum, stByAcc, stTotMv, stTotCost, visA, totAssets, netWorth, totDebt, totPay, totRec, cashBal,
    ceMap, CE, AT, PIE, moTxns, moInc, moExp, hTxns, hInc, hExp, subsMo, billsMo, DAYS,
    chartData, chartRange, setChartRange, isSingleMo, allocPie, holdPie, invGrowth, assetView, setAssetView, changeData,
    dailyGrowth, loadingDaily, fetchDailyGrowth, EMOTIONS, emotionReview,
    watchlist, addToWatchlist, removeFromWatchlist, COOLDOWN_MS, recentTradeCount, TRADE_FREQ_WARN,
    tradeStats, maxDrawdown, benchmarkData, loadingBenchmark, fetchBenchmarkCompare,
    watchStocks, addWatchStock, removeWatchStock, refreshWatchStocks, loadingWatch,
    dailyPnlHeatmap, sectorPie, updateStockMeta,
    dividendEst, loadingDiv, fetchDividendEstimate,
    dividendAnnounce, loadingDivAnn, divAnnFetched, fetchDividendAnnounce,
    incCat, expCat, chartView, setChartView, healthRange, setHealthRange,
    useMvForAssets, setUseMvForAssets, toggleMv, poolThisMo, fetchAllPrices, ALL_CURS, theme,
    collapsed, toggleSection, setNT, nT, T0, descHistoryByCat, descHistory, tagsHistory,
    invTab, setInvTab, invPie, setInvPie, selStock, setSelStock, sellF, setSellF, buyF, setBuyF,
    initF, setInitF, selPool, setSelPool, recAmt, setRecAmt, doRecognize, adjBal,
    selAcc, setSelAcc, newBal, setNewBal, adjDesc, setAdjDesc,
    nG, setNG, G0, editGoal, setEditGoal, nPL, setNPL, PL0, selPolicy, setSelPolicy,
    premAmt, setPremAmt, premAcc, setPremAcc, surrenderAmt, setSurrenderAmt, surrenderAcc, setSurrenderAcc,
    showGoalEP, setShowGoalEP, LEARN_DATA, MANUAL_DATA,
    APP_VER, changeTheme, THEMES, showHDP, setShowHDP,
    nS, setNS, S0, saveSub, addSub, nB, setNB, B0, saveBill, addBill,
    nAcc, setNAcc, addAcc, payF, setPayF, doPayCred, doBuy, doSell, doInit,
    nD, setND, D0, addDebt, settleDebt, setSettleDebt, editDebt, setEditDebt, settleAcc, setSettleAcc, settleCustomAmt, setSettleCustomAmt,
    selTxn, setSelTxn, selSub, setSelSub, selBill, setSelBill, saveTxn, delTxn, addCustomCE, CUR_NAME,
    sq, setSq, showSq, setShowSq, alertR, alertAmt, passiveMo, grpTxns, rl, prevMo, nextMo, totPools, month,
    expensePools, totExpensePools, customCE: d.customCE,
    savingsTargets, setSavingsTarget, removeSavingsTarget, savingsProgress, curYm, nextYm, curSavingsTarget, nextSavingsTarget, showNextMonthReminder,
    buckets, addBucket, updateBucket, deleteBucket, moveBucket, transferBucket, growthBucket, setGrowthBucket,
    moDate, setMoDate, searchQ, setSearchQ,
    // 共用 UI atoms 元件
    Sheet, Inp, Sl, Fld, CalcInp, AutoInput, DatePicker, CatPicker, EmojiPicker, guessEmoji, StockPriceChart, fetchStockRange,
    InfoBtn, ConfirmDialog, Card, SH, Bdg, Btn, TP, SwipeRow
  };

  return (
    <>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'Noto Sans TC',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>
        
        {/* 頁面切換控制 */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom:140, WebkitOverflowScrolling:"touch", paddingTop:"env(safe-area-inset-top, 44px)" }}>
          {tab === "overview" && <OverviewPage {...p} />}
          {tab === "wallet"   && <WalletPage {...p} />}
          {tab === "charts"   && <ChartsPage {...p} />}
          {tab === "notes"    && <NotesPage {...p} />}
          {tab === "invest"   && <InvestPage {...p} />}
          {tab === "settings" && <SettingsPage {...p} />}
        </div>

        {/* 記帳快速懸浮鈕 */}
        {tab === "overview" && (
          <button onClick={() => { setNT({ ...T0, acc:accs.filter(a => a.type !== "credit")[0]?.name || "" }); setModal("addTxn"); }} style={{ position:"fixed", bottom:"calc(76px + env(safe-area-inset-bottom,0px))", right:18, width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentD})`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 24px ${C.accent}55`, zIndex:25, fontSize:22 }}>✏️</button>
        )}

        {/* 底部導覽列 */}
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.surface, borderTop:`1px solid ${C.border}`, paddingBottom:"env(safe-area-inset-bottom,0px)", zIndex:30 }}>
          <div style={{ display:"flex" }}>
            {[{ k:"overview", i:"📊", l:"總覽" }, { k:"wallet", i:"👛", l:"錢包" }, { k:"charts", i:"📉", l:"圖表" }, { k:"notes", i:"👥", l:"往來帳" }, { k:"invest", i:"📈", l:"投資" }, { k:"settings", i:"⚙️", l:"設定" }].map(t => {
              const active = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"10px 0", background:"none", border:"none", cursor:"pointer", color:active ? C.accent : C.muted }}>
                  <span style={{ fontSize:active ? 21 : 18 }}>{t.i}</span>
                  <span style={{ fontSize:11, fontWeight:700 }}>{t.l}</span>
                  {active && <div style={{ width:4, height:4, borderRadius:"50%", background:C.accent }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 彈窗渲染區 */}
        <TxnModals {...p} />
        <WalletModals {...p} />
        <StockModals {...p} />
        <DebtModals {...p} />
        <OtherModals {...p} />

        {/* 確認刪除彈窗 */}
        {confirmDlg && <ConfirmDialog msg={confirmDlg.msg} okLabel={confirmDlg.okLabel} onOk={() => {
          if (confirmDlg.skipUndo) {
            confirmDlg.onOk();
            closeConfirm();
            return;
          }
          const snapshot = d;
          confirmDlg.onOk();
          closeConfirm();
          setUndoInfo({ snapshot, label: confirmDlg.msg, okLabel: confirmDlg.okLabel });
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
          undoTimerRef.current = setTimeout(() => setUndoInfo(null), 6000);
        }} onCancel={closeConfirm} />}
        {undoInfo && (
          <div style={{ position:"fixed", bottom:"calc(70px + env(safe-area-inset-bottom,0px))", left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:440, zIndex:250, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 16px", borderRadius:14, background:C.surface, border:`1px solid ${C.borderL}`, boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
            <span style={{ fontSize:13, color:C.text, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{(undoInfo.okLabel || "確認刪除").replace("確認", "已")}</span>
            <button onClick={undoDelete} style={{ flexShrink:0, padding:"7px 16px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:900, fontSize:13, cursor:"pointer" }}>↩️ 復原</button>
          </div>
        )}
      </div>
    </>
  );
}
