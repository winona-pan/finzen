import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ── Tokens ── */
const C = {
  bg:"#0d0f14", surface:"#14161e", card:"#1a1d28",
  border:"#252839", borderL:"#303550",
  income:"#f43f5e", expense:"#4ade80",
  accent:"#7c7cf8", accentL:"#a5b4fc", accentD:"#5b5bd6",
  warn:"#fb923c", teal:"#2dd4bf",
  text:"#eef0fa", textSub:"#7c80a0", muted:"#444660", danger:"#ef4444",
};
const PIE = ["#f43f5e","#7c7cf8","#4ade80","#fb923c","#06b6d4","#ec4899","#a78bfa","#34d399"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TODAY = new Date().toISOString().slice(0,10);

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
const CE = { 食物:"🍔",交通:"🚌",家居:"🏠",娛樂:"🎬",訂閱:"📱",薪資:"💰",家教:"📖",零用錢:"🏮",利息:"🏦",股息:"📈",紅包:"🧧",投資收益:"📈",教育:"🎓",醫療:"💊",美容:"💄",帳戶調整:"✨",其他:"📦",其他收入:"💴" };
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
  cats: {
    expense: ["食物","交通","家居","娛樂","訂閱","教育","醫療","美容","其他"],
    income:  ["薪資","家教","零用錢","利息","股息","紅包","投資收益","其他收入"],
  },
  rates: DEF_RATES,
};

/* ── Storage ── */
function loadData() {
  try {
    const s = localStorage.getItem(DATA_KEY);
    if (!s) return DEF;
    const saved = JSON.parse(s);
    return { ...DEF, ...saved, rates: { ...DEF_RATES, ...(saved.rates || {}) }, cats: { expense: saved.cats?.expense || DEF.cats.expense, income: saved.cats?.income || DEF.cats.income } };
  } catch { return DEF; }
}
function saveData(d) { try { localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch {} }
function checkVer() {
  const prev = localStorage.getItem(VER_KEY);
  if (prev !== APP_VER) { localStorage.setItem(VER_KEY, APP_VER); return prev ? "✨ 新功能：計算機 🧮、底部導航改中文、現有持股登錄功能！" : null; }
  return null;
}

/* ── UI Atoms ── */
const iSt = { background:"#1a1d28",border:"1px solid #252839",color:"#eef0fa",borderRadius:10,padding:"9px 12px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box" };
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
  const { accs, txns, debts, subs, bills, stocks, pools, cats, rates } = d;

  /* ── tabs / modal ── */
  const [tab, setTab] = useState("overview");
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

  /* ── month / date ── */
  const [month, setMonth] = useState(() => { const d = new Date(); return { y:d.getFullYear(), m:d.getMonth() + 1 }; });
  const [chartRange, setChartRange] = useState(() => ({ s:`${new Date().getFullYear()}-01-01`, e:TODAY }));
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
  const [newCatType, setNewCatType] = useState("expense");
  const [newCatName, setNewCatName] = useState("");
  const [curSearch, setCurSearch] = useState("");
  const [localRates, setLocalRates] = useState(() => ({ ...DEF_RATES }));
  const [trFrom, setTrFrom] = useState(""), [trTo, setTrTo] = useState(""), [trAmt, setTrAmt] = useState("");
  const [recAmt, setRecAmt] = useState("");

  /* ── forms ── */
  const T0 = { type:"expense",cat:"食物",amt:"",desc:"",acc:"",date:TODAY,tags:"",proxy:false,proxyList:[{ person:"",amt:"" }],deferred:false,deferMonths:"4",deferMoAmt:"" };
  const [nT, setNT] = useState(T0);
  const D0 = { type:"receivable",person:"",amt:"",desc:"",date:TODAY,note:"" };
  const [nD, setND] = useState(D0);
  const S0 = { name:"",amt:"",acc:"",day:"1",cat:"訂閱" };
  const [nS, setNS] = useState(S0);
  const B0 = { name:"",amt:"",acc:"",day:"1",cat:"家居",active:false };
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

  /* ── Yahoo Finance price fetch ── */
  const fetchPrice = useCallback(async (ticker, market) => {
    const sym = market === "TW" && !ticker.includes(".") ? `${ticker}.TW` : ticker;
    // Try multiple proxies in order
    const proxies = [
      `https://corsproxy.io/?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`)}`,
    ];
    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy, { signal:AbortSignal.timeout(8000) });
        const raw = await res.text();
        // allorigins wraps in {contents:...}, others return directly
        let data;
        try { const json = JSON.parse(raw); data = json.contents ? JSON.parse(json.contents) : json; }
        catch { continue; }
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        const name  = data?.chart?.result?.[0]?.meta?.longName
                   || data?.chart?.result?.[0]?.meta?.shortName
                   || sym;
        if (price) return { price, name, sym };
      } catch { continue; }
    }
    return null;
  }, []);

  const fetchAllPrices = useCallback(async () => {
    for (const st of stocks) {
      const res = await fetchPrice(st.ticker, st.market);
      if (res?.price) {
        upd("stocks", p => p.map(s => s.id === st.id ? { ...s, curPrice:res.price, name:res.name || s.name, lastUpdated:new Date().toLocaleTimeString("zh-TW") } : s));
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }, [stocks, fetchPrice, upd]);

  /* ── Auto price update at 13:30 TWN ── */
  useEffect(() => {
    const check = () => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone:"Asia/Taipei" }));
      if (now.getHours() === 13 && now.getMinutes() === 30) fetchAllPrices();
    };
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [fetchAllPrices]);

  /* ── Auto exchange rate fetch every minute ── */
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Use exchangerate-api free tier (no key needed for basic pairs)
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/TWD", { signal:AbortSignal.timeout(5000) });
        const json = await res.json();
        if (json.rates) {
          // Convert: api gives TWD→other, we need other→TWD (invert)
          const newRates = { TWD:1 };
          ALL_CURS.forEach(cur => { if (cur !== "TWD" && json.rates[cur]) newRates[cur] = 1 / json.rates[cur]; });
          upd("rates", () => ({ ...DEF_RATES, ...newRates }));
        }
      } catch {} // Silently fail, keep existing rates
    };
    fetchRates(); // Fetch immediately on load
    const t = setInterval(fetchRates, 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const visA = useMemo(() => accs.filter(a => a.type !== "credit" && a.vis), [accs]);
  const totAssets = useMemo(() => visA.reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0), [accs, rates]);
  const totDebt = useMemo(() => accs.filter(a => a.type === "credit" && a.vis).reduce((s, c) => s + (c.payable || 0), 0), [accs]);
  const totRec = useMemo(() => debts.filter(x => x.type === "receivable" && !x.settled).reduce((s, x) => s + x.amt, 0), [debts]);
  const totPay = useMemo(() => debts.filter(x => x.type === "payable" && !x.settled).reduce((s, x) => s + x.amt, 0), [debts]);
  const netWorth = totAssets - totDebt - totPay + totRec;
  const subsMo = useMemo(() => subs.filter(s => s.active).reduce((s, x) => s + x.amt, 0), [subs]);
  const billsMo = useMemo(() => (bills || []).filter(b => b.active).reduce((s, x) => s + x.amt, 0), [bills]);
  const totPools = useMemo(() => pools.reduce((s, p) => s + (p.totalAmt - p.recognized), 0), [pools]);
  const cashBal = useMemo(() => accs.filter(a => a.type !== "credit" && a.type !== "investment" && a.vis).reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0), [accs, rates]);

  const stSum = useMemo(() => stocks.map(st => {
    const buys  = st.trades.filter(t => t.type==="buy");
    const sells = st.trades.filter(t => t.type==="sell");
    const bSh   = buys.reduce((s,t)=>s+t.shares,0);
    const sSh   = sells.reduce((s,t)=>s+t.shares,0);
    // 無交易紀錄但有 manualShares（初始持股）→ 直接用 manualShares
    const totalSh = st.manualShares != null && st.trades.length === 0
      ? st.manualShares
      : (st.manualShares != null && buys.length === 0 ? st.manualShares : Math.max(0, bSh - sSh));
    const calcCost  = buys.reduce((s,t)=>s+t.shares*t.price+(t.fee||0), 0);
    const totalCost = st.manualTotalCost != null
      ? st.manualTotalCost
      : (buys.length===1 ? calcCost : calcCost);
    const calcAvg = buys.length > 0 ? calcCost / bSh : 0;
    const avgCost = st.manualAvgCost != null ? st.manualAvgCost : calcAvg;
    const mv   = totalSh * (st.curPrice||0);
    const upnl = mv - totalCost;
    return {...st, totalSh, totalCost, avgCost, mv, upnl};
  }), [stocks]);
  const stTotMv = useMemo(() => stSum.reduce((s, x) => s + x.mv, 0), [stSum]);
  const stTotCost = useMemo(() => stSum.reduce((s, x) => s + x.totalCost, 0), [stSum]);
  const allocPie  = useMemo(()=>[{ name:"現金+銀行", value:cashBal }, { name:"股票投資", value:stTotCost }],[cashBal,stTotCost]);
  const holdPie   = useMemo(()=>stSum.filter(x=>x.totalSh>0).map(x=>({name:x.ticker, value:x.totalCost})),[stSum]);
  const stByAcc = useMemo(() => { const g = {}; stSum.forEach(x => { (g[x.acc] || (g[x.acc] = [])).push(x); }); return g; }, [stSum]);

  const moTxns = useMemo(() => txns.filter(t => { const [y, m] = t.date.split("-").map(Number); return y === month.y && m === month.m; }), [txns, month]);
  const poolThisMo = useMemo(() => pools.filter(p => { const [py, pm] = p.date.split("-").map(Number); return py === month.y && pm === month.m; }).reduce((s, p) => s + (p.recognized || 0), 0), [pools, month]);
  const moInc = useMemo(() => moTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amt, 0) + poolThisMo, [moTxns, poolThisMo]);
  const moExp = useMemo(() => moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + t.amt, 0), [moTxns]);
  const expCat = useMemo(() => { const m = {}; moTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amt; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [moTxns]);
  const incCat = useMemo(() => { const m = {}; moTxns.filter(t => t.type === "income").forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amt; }); return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [moTxns]);
  const alertAmt = useMemo(() => moTxns.filter(t => t.type === "expense" && ["食物","交通","家居"].includes(t.cat)).reduce((s, t) => s + t.amt, 0), [moTxns]);
  const alertR = moInc > 0 ? alertAmt / moInc : 0;
  const passiveMo = useMemo(() => moTxns.filter(t => t.type === "income" && PASSIVE.includes(t.cat)).reduce((s, t) => s + t.amt, 0), [moTxns]);
  const descHistory = useMemo(() => txns.map(t => t.desc).filter(Boolean), [txns]);
  const tagsHistory = useMemo(() => txns.map(t => t.tags).filter(Boolean), [txns]);

  const grpTxns = useMemo(() => {
    const g = {};
    let f = [...moTxns].sort((a, b) => b.date.localeCompare(a.date));
    if (sq) f = f.filter(t => (t.desc || "").toLowerCase().includes(sq.toLowerCase()) || t.cat.includes(sq) || (t.acc || "").includes(sq));
    f.forEach(t => { (g[t.date] || (g[t.date] = [])).push(t); });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [moTxns, sq]);

  const hTxns = useMemo(() => txns.filter(t => t.date >= healthRange.s && t.date <= healthRange.e), [txns, healthRange]);
  const hInc = useMemo(() => hTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amt, 0), [hTxns]);
  const hExp = useMemo(() => hTxns.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + t.amt, 0), [hTxns]);

  const isSingleMo = useMemo(() => { const s = new Date(chartRange.s), e = new Date(chartRange.e); return s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth(); }, [chartRange]);
  const chartData = useMemo(() => {
    if (!txns.length) return [];
    const s = new Date(chartRange.s);
    if (isSingleMo) { const dim = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate(); return Array.from({ length:dim }, (_, i) => ({ d:`${i + 1}日`, assets:totAssets + Math.round(Math.sin(i * 0.5) * 5000) })); }
    const mo = {};
    txns.forEach(t => { const [y, m] = t.date.split("-"); const k = `${y}-${m}`; mo[k] = mo[k] || { i:0, e:0 }; if (t.type === "income") mo[k].i += t.amt; if (t.type === "expense" && t.cat !== "帳戶調整") mo[k].e += t.amt; });
    return Object.entries(mo).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ m:`${+k.split("-")[1]}月`, assets:Math.max(0, totAssets + (v.i - v.e) * 0.05) }));
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
    const t = { ...nT, id, amt:+nT.amt, proxyAmt:validProxies.reduce((s, p) => s + +p.amt, 0), proxyFor:validProxies.map(p => p.person).join("、"), proxyList:validProxies };
    upd("txns", p => [...p, t]);
    if (t.type === "expense") { const ca = accs.find(a => a.name === t.acc && a.type === "credit"); if (ca) upd("accs", p => p.map(a => a.id === ca.id ? { ...a, payable:(a.payable || 0) + t.amt } : a)); }
    validProxies.forEach(pr => { upd("debts", p => [...p, { id:"d" + Date.now() + Math.random(), type:"receivable", person:pr.person, amt:+pr.amt, desc:`代墊：${nT.desc || nT.cat}`, date:nT.date, settled:false, note:"自動產生", srcTxnId:id }]); });
    if (nT.deferred && nT.deferMoAmt && t.type === "income") upd("pools", p => [...p, { id:"p" + id, desc:nT.desc || nT.cat, totalAmt:t.amt, recognized:+nT.deferMoAmt, date:nT.date, acc:nT.acc }]);
    setNT(T0); close();
  };
  const delTxn = id => { upd("txns", p => p.filter(t => t.id !== id)); close(); };
  const saveTxn = t => { upd("txns", p => p.map(x => x.id === t.id ? t : x)); close(); };

  const adjBal = (acc, newBalStr, isFirst) => {
    if (!acc || newBalStr === "") return;
    const nv = parseFloat(newBalStr), df = nv - acc.bal;
    if (df === 0) return;
    upd("accs", p => p.map(a => a.id === acc.id ? { ...a, bal:nv } : a));
    if (!isFirst) upd("txns", p => [...p, { id:Date.now(), type:"adjust", cat:"帳戶調整", amt:Math.abs(df), adjDiff:df, desc:`餘額調整`, acc:acc.name, date:TODAY, tags:"" }]);
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
  const addSub = () => { if (!nS.name || !nS.amt) return; upd("subs", p => [...p, { ...nS, id:"sub" + Date.now(), amt:+nS.amt, day:+nS.day, active:true }]); setNS(S0); close(); };
  const saveSub = s => { upd("subs", p => p.map(x => x.id === s.id ? s : x)); close(); };
  const addBill = () => { if (!nB.name || !nB.amt) return; upd("bills", p => [...(p || []), { ...nB, id:"bill" + Date.now(), amt:+nB.amt, day:+nB.day, active:false }]); setNB(B0); close(); };
  const saveBill = b => { upd("bills", p => p.map(x => x.id === b.id ? b : x)); close(); };

  const addAccFn = () => {
    if (!nAcc.name) return;
    const id = "a" + Date.now();
    const base = { id, name:nAcc.name, type:nAcc.type, cur:nAcc.cur, bal:0, vis:true, order:accs.length };
    const extra = nAcc.type === "credit" ? { payable:0, limit:+nAcc.limit || 100000 } : {};
    upd("accs", p => [...p, { ...base, ...extra }]); setNAcc(NA0); close();
  };

  const doBuy = () => {
    if (!buyF.ticker || !buyF.shares) return;
    const trade = { id:"t"+Date.now(), type:"buy", date:TODAY, shares:+buyF.shares, price:buyF.avgCost?+buyF.avgCost:0, fee:+buyF.fee||0 };
    const ex = stocks.find(s => s.ticker===buyF.ticker && s.acc===buyF.acc);
    if (ex) {
      // 同代號同帳戶 → 直接加進 trades，股數由 stSum 從 trades 計算（買入加、賣出減）
      // 只更新名稱，不覆蓋 manualShares（讓 trades 累積計算）
      upd("stocks", p => p.map(s => s.id===ex.id ? {
        ...s,
        name: buyF.name || s.name,
        manualShares: null,    // 清除手動覆蓋，改由 trades 自動計算
        manualAvgCost: null,   // 同上
        manualTotalCost: null, // 同上
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
    if (buyF.fromAcc && buyF.totalCost) upd("accs", p => p.map(a => a.name===buyF.fromAcc ? {...a, bal:a.bal-+buyF.totalCost} : a));
    setBuyF(BF0); close();
  };

  // sellF: stockId, shares, totalProceeds, pnl, pnlType, returnAcc
  const doSell = () => {
    const st = stSum.find(s => s.id === sellF.stockId);
    if (!st || !sellF.shares) return;
    const proceeds = sellF.totalProceeds ? +sellF.totalProceeds : 0;
    const pnlAmt   = sellF.pnl ? Math.abs(+sellF.pnl) : 0;
    const isProfit = sellF.pnlType === "income";
    const sellPrice = +sellF.shares > 0 && proceeds > 0 ? proceeds / +sellF.shares : 0;
    const sellFee = sellF.fee ? +sellF.fee : 0;
    // 加賣出紀錄 → stSum 從 trades 自動算出剩餘股數
    upd("stocks", p => p.map(s => s.id===st.id ? {
      ...s,
      manualShares: null,
      trades:[...s.trades, { id:"t"+Date.now(), type:"sell", date:TODAY, shares:+sellF.shares, price:sellPrice, fee:sellFee, totalProceeds:proceeds }],
    } : s));
    if (sellF.returnAcc && proceeds) upd("accs", p => p.map(a => a.name===sellF.returnAcc ? {...a, bal:a.bal+proceeds-sellFee} : a));
    if (pnlAmt > 0) upd("txns", p => [...p, { id:Date.now(), type:isProfit?"income":"expense", cat:"投資收益", amt:pnlAmt, desc:`${isProfit?"賣出獲利":"賣出虧損"}：${st.ticker}`, acc:sellF.returnAcc||"", date:TODAY, tags:"#投資" }]);
    setSellF({ stockId:"", shares:"", totalProceeds:"", fee:"", pnl:"", pnlType:"income", returnAcc:"" }); close();
  };

  const doRecognize = () => {
    if (!selPool || !recAmt) return;
    const a = +recAmt, rem = selPool.totalAmt - selPool.recognized;
    if (a > rem) return;
    upd("pools", p => p.map(x => x.id === selPool.id ? { ...x, recognized:x.recognized + a } : x));
    upd("txns", p => [...p, { id:Date.now(), type:"income", cat:"家教", amt:a, desc:`認列：${selPool.desc}`, acc:selPool.acc || "", date:TODAY, tags:"" }]);
    setRecAmt(""); close();
  };

  const reorderGrp = (type, r) => upd("accs", p => [...p.filter(a => a.type !== type), ...r.map((a, i) => ({ ...a, order:i }))]);
  const addCat = () => { if (!newCatName.trim()) return; upd("cats", p => ({ ...p, [newCatType]:[...p[newCatType], newCatName.trim()] })); setNewCatName(""); };
  const exportData = () => { const b = new Blob([JSON.stringify(d, null, 2)], { type:"application/json" }); const u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = `finzen_${TODAY}.json`; a.click(); URL.revokeObjectURL(u); };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  const rowSt = (i, border = true) => ({ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderTop:border && i > 0 ? `1px solid ${C.border}` : undefined });

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        body { background:#0d0f14; }
        ::-webkit-scrollbar { display:none; }
        input, select, textarea, button { font-family:'Noto Sans TC',system-ui,sans-serif; }
        select option { background:#1a1d28; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
      `}</style>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'Noto Sans TC',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>

        {/* Scroll area */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom:140, WebkitOverflowScrolling:"touch", paddingTop:"env(safe-area-inset-top, 44px)" }}>

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div>
              <div style={{ position:"sticky", top:0, zIndex:20, background:`${C.bg}f2`, backdropFilter:"blur(16px)", padding:"12px 16px 8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>‹</button>
                    <span style={{ fontWeight:900, fontSize:20, color:C.text }}>{month.m}月 {month.y}</span>
                    <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>›</button>
                  </div>
                  <button onClick={() => setShowSq(p => !p)} style={{ width:36, height:36, borderRadius:10, background:showSq ? `${C.accent}30` : C.card, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSub, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>🔍</button>
                </div>
                {showSq && <input value={sq} onChange={e => setSq(e.target.value)} placeholder="搜尋…" style={{ ...iSt, marginBottom:8 }} />}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:4 }}>
                  {[{ l:"收入", v:moInc, c:C.income }, { l:"支出", v:moExp, c:C.expense }, { l:"結餘", v:moInc - moExp, c:moInc >= moExp ? C.income : C.expense }].map(k => (
                    <div key={k.l} style={{ padding:"10px 12px", borderRadius:14, background:C.surface }}>
                      <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{k.l}</div>
                      <div style={{ fontWeight:900, fontSize:13, color:k.c }}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>
                {totPools > 0 && <div onClick={() => setModal("pools")} style={{ display:"flex", justifyContent:"space-between", padding:"7px 12px", borderRadius:10, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, cursor:"pointer", marginTop:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>📅 待認列收入池：{fmt(totPools)}</span>
                  <span style={{ fontSize:12, color:C.teal }}>認列 →</span>
                </div>}
                {passiveMo > 0 && <div style={{ padding:"7px 12px", borderRadius:10, background:`${C.accentL}12`, border:`1px solid ${C.accentL}33`, marginTop:4 }}>
                  <span style={{ fontSize:12, color:C.accentL }}>🏦 非勞務收入 {fmt(passiveMo)}（建議存起來）</span>
                </div>}
              </div>
              {alertR > 0.4 && <div style={{ margin:"0 16px 10px", display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:14, background:`${C.warn}18`, border:`1px solid ${C.warn}44`, fontSize:12, fontWeight:700, color:C.warn }}>⚠️ 生活支出 {(alertR * 100).toFixed(0)}% 超過收入 40%！</div>}
              <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:12 }}>
                {grpTxns.length === 0 && <div style={{ padding:"60px 0", textAlign:"center", color:C.muted }}><div style={{ fontSize:44, marginBottom:10 }}>📭</div><div>本月尚無記錄，點右下角 ✏️ 開始記帳</div></div>}
                {grpTxns.map(([date, dayT]) => {
                  const dv = new Date(date + "T00:00:00");
                  const dE = dayT.filter(t => t.type === "expense" && t.cat !== "帳戶調整").reduce((s, t) => s + t.amt, 0);
                  const dI = dayT.filter(t => t.type === "income").reduce((s, t) => s + t.amt, 0);
                  return <div key={date}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"0 4px", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontWeight:900, fontSize:22, color:C.text }}>{dv.getDate()}</span>
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:C.card, color:C.textSub }}>{DAYS[dv.getDay()]}</span>
                      </div>
                      <div style={{ display:"flex", gap:10, fontSize:12 }}>
                        {dI > 0 && <span style={{ color:C.income }}>+{fmt(dI)}</span>}
                        {dE > 0 && <span style={{ color:C.expense }}>-{fmt(dE)}</span>}
                      </div>
                    </div>
                    <Card style={{ overflow:"hidden" }}>
                      {dayT.map((t, i) => (
                        <SwipeRow key={t.id} onDelete={() => delTxn(t.id)} onEdit={() => { setSelTxn({ ...t }); setModal("editTxn"); }} onClick={() => { setSelTxn({ ...t }); setModal("txnDet"); }}>
                          <div style={rowSt(i, true)}>
                            <div style={{ width:44, height:44, borderRadius:14, background:"#252839", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{CE[t.cat] || "📦"}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                                <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{t.cat}</span>
                                {t.proxyAmt > 0 && <Bdg color={C.warn}>含代墊</Bdg>}
                                {PASSIVE.includes(t.cat) && <span style={{ fontSize:13 }}>🏦</span>}
                                {t.type === "adjust" && <Bdg color={C.muted}>調整</Bdg>}
                              </div>
                              <div style={{ fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {t.desc}{t.acc && <span style={{ color:C.muted }}> · {t.acc}</span>}{t.tags && <span style={{ color:C.accentL }}> {t.tags}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <div style={{ fontWeight:900, fontSize:14, color:t.type === "income" ? C.income : t.type === "adjust" ? C.textSub : C.expense }}>
                                {t.type === "income" ? "+" : t.type === "adjust" ? (t.adjDiff > 0 ? "+" : "") : "-"}{fmt(t.amt)}
                              </div>
                              {t.proxyAmt > 0 && <div style={{ fontSize:11, color:C.warn }}>代墊 {fmt(t.proxyAmt)}</div>}
                            </div>
                          </div>
                        </SwipeRow>
                      ))}
                    </Card>
                  </div>;
                })}
              </div>
            </div>
          )}

          {/* ══ WALLET ══ */}
          {tab === "wallet" && (
            <div>
              {wMode === "sort" && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:`${C.accent}22`, borderBottom:`1px solid ${C.accent}55` }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.accentL }}>⠿ 拖曳調整順序</span>
                <button onClick={() => setWMode("normal")} style={{ padding:"6px 16px", borderRadius:10, background:C.accent, color:"#fff", border:"none", fontWeight:900, fontSize:14, cursor:"pointer" }}>✓ 完成</button>
              </div>}
              <div style={{ position:"relative", padding:"20px 20px 28px", background:"linear-gradient(150deg,#1a1d2e 0%,#0d0f14 100%)" }}>
                <div style={{ position:"absolute", right:-30, top:-30, width:200, height:200, borderRadius:"50%", background:C.accent, filter:"blur(60px)", opacity:.07, pointerEvents:"none" }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, position:"relative", zIndex:2 }}>
                  <span style={{ fontWeight:900, fontSize:24, color:C.text }}>Wallet</span>
                  <div style={{ display:"flex", gap:6 }}>
                    {[{ icon:"👁", mode:"vis" }, { icon:"⠿", mode:"sort" }, { icon:"➕", cb:() => setModal("addAcc") }].map((b, i) => (
                      <button key={i} onClick={b.cb || (() => setWMode(p => p === b.mode ? "normal" : b.mode))}
                        style={{ width:36, height:36, borderRadius:10, background:b.mode && wMode === b.mode ? `${C.accent}40` : "rgba(255,255,255,0.08)", border:`1px solid ${b.mode && wMode === b.mode ? C.accent : "rgba(255,255,255,0.15)"}`, cursor:"pointer", color:b.mode && wMode === b.mode ? C.accent : "#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {b.icon}
                      </button>
                    ))}
                  </div>
                </div>
                {wMode === "vis" && <div style={{ borderRadius:14, padding:12, marginBottom:16, background:C.card, border:`1px solid ${C.borderL}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textSub, marginBottom:8 }}>點擊切換顯示</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{accs.map(a => <button key={a.id} onClick={() => upd("accs", p => p.map(x => x.id === a.id ? { ...x, vis:!x.vis } : x))} style={{ fontSize:12, padding:"4px 10px", borderRadius:10, fontWeight:700, background:a.vis ? `${C.accent}28` : C.surface, color:a.vis ? C.accentL : C.muted, border:`1px solid ${a.vis ? C.accent : C.border}`, cursor:"pointer" }}>{AT[a.type] || ""} {a.name}</button>)}</div>
                </div>}
                <div style={{ fontSize:12, fontWeight:700, color:C.textSub, marginBottom:3 }}>Net Worth</div>
                <div style={{ fontWeight:900, fontSize:34, color:C.text, letterSpacing:"-1.5px", marginBottom:18 }}>{fmt(netWorth)}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, textAlign:"center" }}>
                  {[{ l:"資產", v:totAssets, c:C.income }, { l:"負債", v:totDebt, c:C.expense }, { l:"應收", v:totRec, c:C.teal }, { l:"應付", v:totPay, c:C.warn }].map(k => (
                    <div key={k.l}><div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{k.l}</div><div style={{ fontWeight:900, fontSize:13, color:k.c }}>{fmt(k.v)}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:16 }}>
                {/* Quick actions */}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setTrFrom(""); setTrTo(""); setTrAmt(""); setModal("transfer"); }} style={{ flex:1, padding:10, borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontWeight:700, fontSize:13, cursor:"pointer" }}>↔️ 帳戶轉帳</button>
                  <button onClick={() => { const c = accs.find(a => a.type === "credit" && (a.payable || 0) > 0) || accs.find(a => a.type === "credit"); if (c) setPayF({ creditId:c.id, fromId:"", amt:String(c.payable || 0), date:TODAY, note:"" }); setModal("payCred"); }} style={{ flex:1, padding:10, borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.teal, fontWeight:700, fontSize:13, cursor:"pointer" }}>💳 信用卡繳費</button>
                </div>

                {/* Account groups */}
                {[{ label:"CASH", type:"cash" }, { label:"DEBIT CARD", type:"debit" }, { label:"INVESTMENT", type:"investment" }].map(grp => {
                  const items = accs.filter(a => a.type === grp.type && a.vis).sort((a, b) => a.order - b.order);
                  const all = accs.filter(a => a.type === grp.type).sort((a, b) => a.order - b.order);
                  const total = items.reduce((s, a) => s + toTWD(a.bal, a.cur, rates), 0);
                  if (!all.length) return null;
                  const moveAcc = (id, dir) => {
                    const sorted = [...all], idx = sorted.findIndex(a => a.id === id), swapIdx = idx + dir;
                    if (swapIdx < 0 || swapIdx >= sorted.length) return;
                    const o1 = sorted[idx].order, o2 = sorted[swapIdx].order;
                    upd("accs", p => p.map(a => { if (a.id === sorted[idx].id) return { ...a, order:o2 }; if (a.id === sorted[swapIdx].id) return { ...a, order:o1 }; return a; }));
                  };
                  return <div key={grp.type}>
                    <SH title={grp.label} right={fmt(total)} />
                    <Card style={{ overflow:"hidden" }}>
                      {all.map((a, i) => (
                        <SwipeRow key={a.id} onDelete={() => { confirm(`確定刪除「${a.name}」？`, () => upd("accs", p => p.filter(x => x.id !== a.id))); }} onEdit={() => { setSelAcc({ ...a }); setNewBal(String(a.bal)); setModal("adjBal"); }} onClick={() => { setSelAcc({ ...a }); setNewBal(String(a.bal)); setModal("adjBal"); }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined }}>
                            {wMode === "sort" && <div style={{ display:"flex", flexDirection:"column", gap:2, marginRight:2 }}>
                              <button onClick={e => { e.stopPropagation(); moveAcc(a.id, -1); }} disabled={i === 0} style={{ width:24, height:22, borderRadius:6, background:i === 0 ? C.muted + "22" : C.accent + "33", border:"none", cursor:i === 0 ? "default" : "pointer", color:i === 0 ? C.muted : C.accentL, fontSize:13 }}>▲</button>
                              <button onClick={e => { e.stopPropagation(); moveAcc(a.id, 1); }} disabled={i === all.length - 1} style={{ width:24, height:22, borderRadius:6, background:i === all.length - 1 ? C.muted + "22" : C.accent + "33", border:"none", cursor:i === all.length - 1 ? "default" : "pointer", color:i === all.length - 1 ? C.muted : C.accentL, fontSize:13 }}>▼</button>
                            </div>}
                            <div style={{ width:44, height:44, borderRadius:14, background:"#252839", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{AT[a.type] || "💳"}</div>
                            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{a.name}</div><div style={{ fontSize:12, color:C.muted }}>{a.cur}</div></div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{fmt(a.bal, a.cur)}</div>
                              {a.cur !== "TWD" && <div style={{ fontSize:11, color:C.muted }}>≈{fmt(toTWD(a.bal, a.cur, rates))}</div>}
                            </div>
                            <span style={{ color:C.muted, fontSize:13, marginLeft:4 }}>✏️</span>
                          </div>
                        </SwipeRow>
                      ))}
                    </Card>
                  </div>;
                })}

                {/* Credit cards */}
                {accs.filter(a => a.type === "credit").length > 0 && <div>
                  <SH title="CREDIT CARD" right={fmt(totDebt)} />
                  <Card style={{ overflow:"hidden" }}>
                    {accs.filter(a => a.type === "credit").sort((a, b) => a.order - b.order).map((c, i) => {
                      const pct = c.limit > 0 ? Math.round(c.payable / c.limit * 100) : 0;
                      const col = pct > 70 ? C.warn : pct > 40 ? C.income : C.textSub;
                      return <SwipeRow key={c.id} onDelete={() => confirm(`確定刪除「${c.name}」？`, () => upd("accs", p => p.filter(a => a.id !== c.id)))} onEdit={() => { setSelAcc({ ...c }); setNewBal(String(c.payable || 0)); setModal("editCredit"); }}>
                        <div style={{ padding:"14px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:"#252839", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>💳</div>
                            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.name}</div><div style={{ fontSize:12, color:C.muted }}>應付 <span style={{ color:col }}>{fmt(c.payable)}</span> / {fmt(c.limit)}</div></div>
                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                              <Bdg color={col}>{pct}%</Bdg>
                              <button onClick={() => { setPayF({ creditId:c.id, fromId:"", amt:String(c.payable || 0), date:TODAY, note:"" }); setModal("payCred"); }} style={{ padding:"4px 10px", borderRadius:8, background:`${C.teal}22`, color:C.teal, border:`1px solid ${C.teal}44`, fontSize:12, fontWeight:700, cursor:"pointer" }}>Pay</button>
                            </div>
                          </div>
                          <div style={{ height:6, borderRadius:3, background:C.border }}><div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:col }} /></div>
                        </div>
                      </SwipeRow>;
                    })}
                  </Card>
                </div>}

                {/* Subscriptions */}
                <div>
                  <SH title="訂閱管理" right={`月費 ${fmt(subsMo)}`} />
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
                    {subs.map(s => <SwipeRow key={s.id} onDelete={() => upd("subs", p => p.filter(x => x.id !== s.id))} onEdit={() => { setSelSub({ ...s }); setModal("editSub"); }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.card, borderRadius:14, border:`1px solid ${C.border}`, opacity:s.active ? 1 : .5, cursor:"pointer" }} onClick={() => { setSelSub({ ...s }); setModal("editSub"); }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:"#252839", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📱</div>
                        <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{s.name}</div><div style={{ fontSize:12, color:C.muted }}>每月{s.day}日 · {s.acc}{s.active && <span style={{ color:C.teal }}> · 啟用</span>}</div></div>
                        <span style={{ fontWeight:900, fontSize:14, color:C.expense, marginRight:8 }}>{fmt(s.amt)}</span>
                        <button onClick={e => { e.stopPropagation(); upd("subs", p => p.map(x => x.id === s.id ? { ...x, active:!x.active } : x)); }} style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:s.active ? `${C.teal}25` : `${C.muted}25`, color:s.active ? C.teal : C.muted, border:`1px solid ${s.active ? C.teal : C.muted}44`, cursor:"pointer", flexShrink:0 }}>{s.active ? "啟用" : "停用"}</button>
                      </div>
                    </SwipeRow>)}
                  </div>
                  <Btn onClick={() => setModal("addSub")} v="secondary" style={{ width:"100%" }}>＋ 新增訂閱</Btn>
                </div>

                {/* Bills */}
                <div>
                  <SH title="基本開銷（水電/房租）" right={billsMo > 0 ? `月費 ${fmt(billsMo)}` : undefined} />
                  <div style={{ marginBottom:8, padding:"10px 14px", borderRadius:12, background:`${C.accent}12`, border:`1px solid ${C.accent}33`, fontSize:12, color:C.accentL }}>
                    💡 適合水電費、房租等固定支出。停用狀態不計入月費。
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
                    {(bills || []).map(b => <SwipeRow key={b.id} onDelete={() => upd("bills", p => p.filter(x => x.id !== b.id))} onEdit={() => { setSelBill({ ...b }); setModal("editBill"); }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.card, borderRadius:14, border:`1px solid ${C.border}`, opacity:b.active ? 1 : .5, cursor:"pointer" }} onClick={() => { setSelBill({ ...b }); setModal("editBill"); }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:"#252839", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏠</div>
                        <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{b.name}</div><div style={{ fontSize:12, color:C.muted }}>每月{b.day}日{b.active && <span style={{ color:C.warn }}> · 計算中</span>}</div></div>
                        <span style={{ fontWeight:900, fontSize:14, color:b.active ? C.warn : C.muted, marginRight:8 }}>{fmt(b.amt)}</span>
                        <button onClick={e => { e.stopPropagation(); upd("bills", p => p.map(x => x.id === b.id ? { ...x, active:!x.active } : x)); }} style={{ padding:"4px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:b.active ? `${C.warn}25` : `${C.muted}25`, color:b.active ? C.warn : C.muted, border:`1px solid ${b.active ? C.warn : C.muted}44`, cursor:"pointer", flexShrink:0 }}>{b.active ? "開啟" : "停用"}</button>
                      </div>
                    </SwipeRow>)}
                  </div>
                  <Btn onClick={() => setModal("addBill")} v="secondary" style={{ width:"100%" }}>＋ 新增基本開銷</Btn>
                </div>

                {/* Data management */}
                <div>
                  <SH title="資料管理" />
                  <Card style={{ padding:16 }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                      <Btn onClick={exportData} v="secondary" sz="sm">📤 匯出備份</Btn>
                      <label style={{ padding:"6px 14px", borderRadius:12, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                        📥 匯入備份<input type="file" accept=".json" onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { const nd = JSON.parse(ev.target.result); setD({ ...DEF, ...nd }); saveData({ ...DEF, ...nd }); alert("✅ 匯入成功！"); } catch { alert("❌ 格式錯誤"); } }; r.readAsText(f); }} style={{ display:"none" }} />
                      </label>
                      <Btn onClick={() => { setLocalRates({ ...rates }); setModal("rateSettings"); }} v="secondary" sz="sm">💱 匯率設定</Btn>
                      <Btn onClick={() => confirm("確定清空所有資料？這無法復原！", () => { setD(DEF); saveData(DEF); })} v="danger" sz="sm">🗑 清空</Btn>
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>資料存在本機瀏覽器，建議定期匯出備份。</div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ══ CHARTS ══ */}
          {tab === "charts" && (
            <div style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <button onClick={prevMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>‹</button>
                  <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{month.m}/{month.y}</span>
                  <button onClick={nextMo} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:22 }}>›</button>
                </div>
                <button onClick={() => setModal("catSet")} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:10, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSub, fontSize:12, fontWeight:700 }}>⚙️ 類別</button>
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                {[{ v:"expense", l:"🛒 支出", c:C.expense }, { v:"income", l:"💰 收入", c:C.income }].map(o => <TP key={o.v} active={chartView === o.v} color={o.c} onClick={() => setChartView(o.v)}>{o.l}</TP>)}
              </div>
              {(() => {
                const data = chartView === "expense" ? expCat : incCat;
                const total = data.reduce((s, x) => s + x.value, 0);
                if (!data.length) return <Card style={{ padding:"50px 16px", textAlign:"center", marginBottom:16 }}><div style={{ color:C.muted }}>本月無{chartView === "expense" ? "支出" : "收入"}記錄</div></Card>;
                return <Card style={{ padding:20, marginBottom:16 }}>
                  <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} innerRadius={42}>{data.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={(v, n) => [fmt(v), n]} /></PieChart></ResponsiveContainer>
                  <div style={{ textAlign:"center", marginTop:-8, marginBottom:14 }}><div style={{ fontSize:11, color:C.textSub }}>Total</div><div style={{ fontWeight:900, fontSize:22, color:C.text }}>{fmt(total)}</div></div>
                  {data.map((dv, i) => <div key={dv.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`${PIE[i % PIE.length]}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{CE[dv.name] || "📦"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span style={{ color:C.text }}>{dv.name}</span><span style={{ fontWeight:900, color:PIE[i % PIE.length] }}>{fmt(dv.value)}</span></div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}><div style={{ flex:1, height:4, borderRadius:2, background:C.border }}><div style={{ height:"100%", borderRadius:2, width:`${(dv.value / total * 100).toFixed(0)}%`, background:PIE[i % PIE.length] }} /></div><span style={{ fontSize:11, color:C.muted, width:28, textAlign:"right" }}>{(dv.value / total * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>)}
                </Card>;
              })()}
              <Card style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div><div style={{ fontSize:11, color:C.textSub }}>資產成長</div><div style={{ fontWeight:900, fontSize:18, color:C.accentL }}>{fmt(totAssets)}</div></div>
                  <button onClick={() => setShowDP(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:10, background:`${C.accent}22`, color:C.accentL, border:`1px solid ${C.accent}44`, cursor:"pointer", fontSize:12, fontWeight:700 }}>📅 {rl(chartRange)} ▾</button>
                </div>
                {chartData.length > 1
                  ? <ResponsiveContainer width="100%" height={150}><AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={.35} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey={isSingleMo ? "d" : "m"} tick={{ fill:C.muted, fontSize:isSingleMo ? 8 : 10 }} axisLine={false} tickLine={false} interval={isSingleMo ? 4 : 0} /><YAxis tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 10000).toFixed(0)}萬`} /><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10 }} formatter={v => [fmt(v), "資產"]} /><Area type="monotone" dataKey="assets" stroke={C.accent} strokeWidth={2.5} fill="url(#ag)" /></AreaChart></ResponsiveContainer>
                  : <div style={{ height:150, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:13 }}>記錄更多交易後顯示成長曲線</div>}
              </Card>
              <Card style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <span style={{ fontWeight:900, fontSize:14, color:C.text }}>收支健康度</span>
                  <button onClick={() => setShowHDP(true)} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:10, background:`${C.warn}22`, color:C.warn, border:`1px solid ${C.warn}44`, cursor:"pointer", fontSize:11, fontWeight:700 }}>📅 {rl(healthRange)} ▾</button>
                </div>
                {[{ l:"區間收入", v:fmt(hInc), c:C.income }, { l:"區間支出", v:fmt(hExp), c:C.expense }, { l:"區間結餘", v:fmt(hInc - hExp), c:hInc >= hExp ? C.income : C.expense }, { l:"儲蓄率", v:hInc > 0 ? `${(((hInc - hExp) / hInc) * 100).toFixed(1)}%` : "—", c:C.accentL }, { l:"支出佔收入", v:hInc > 0 ? `${(hExp / hInc * 100).toFixed(1)}%` : "—", c:hExp / hInc > 0.4 ? C.warn : C.expense }, { l:"訂閱月費", v:fmt(subsMo), c:C.textSub }].map(r => (
                  <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:13, color:C.textSub }}>{r.l}</span>
                    <span style={{ fontWeight:900, fontSize:13, color:r.c }}>{r.v}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ══ NOTES ══ */}
          {tab === "notes" && (
            <div style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>👥</span><span style={{ fontWeight:900, fontSize:16, color:C.text }}>往來帳</span></div>
                <Btn onClick={() => { setND(D0); setModal("addDebt"); }} sz="sm">＋ 新增</Btn>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {[{ l:"別人欠我 💚", v:totRec, c:C.teal, t:"receivable" }, { l:"我欠別人 🟡", v:totPay, c:C.warn, t:"payable" }].map(k => (
                  <Card key={k.t} style={{ padding:16, borderColor:`${k.c}55` }}>
                    <div style={{ fontSize:11, fontWeight:900, color:k.c, marginBottom:4 }}>{k.l}</div>
                    <div style={{ fontWeight:900, fontSize:20, color:k.c }}>{fmt(k.v)}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{debts.filter(d => d.type === k.t && !d.settled).length} 筆</div>
                  </Card>
                ))}
              </div>
              {["receivable","payable"].map(dt => {
                const items = debts.filter(x => x.type === dt && !x.settled);
                if (!items.length) return null;
                return <div key={dt} style={{ marginBottom:20 }}>
                  <SH title={dt === "receivable" ? "應收款 💚" : "應付款 🟡"} right={`NT$${items.reduce((s, d) => s + d.amt, 0).toLocaleString()}`} />
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {items.map(d => <Card key={d.id} style={{ padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}><span style={{ fontWeight:900, fontSize:14, color:C.text }}>{d.person}</span><Bdg color={dt === "receivable" ? C.teal : C.warn}>{dt === "receivable" ? "欠我" : "我欠"}</Bdg>{d.srcTxnId && <Bdg color={C.accent}>自動</Bdg>}</div>
                          <div style={{ fontSize:12, color:C.textSub }}>{d.desc}</div>
                          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{d.date}</div>
                        </div>
                        <div style={{ fontWeight:900, fontSize:15, color:dt === "receivable" ? C.teal : C.warn, marginLeft:12 }}>{fmt(d.amt)}</div>
                      </div>
                      {d.note && <div style={{ fontSize:12, padding:"8px 12px", borderRadius:8, background:`${C.border}88`, color:C.textSub, fontStyle:"italic", marginBottom:10 }}>"{d.note}"</div>}
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn v="teal" style={{ flex:1 }} onClick={() => upd("debts", p => p.map(x => x.id === d.id ? { ...x, settled:true } : x))}>✓ 結清</Btn>
                        <Btn v="danger" sz="sm" onClick={() => upd("debts", p => p.filter(x => x.id !== d.id))}>🗑</Btn>
                      </div>
                    </Card>)}
                  </div>
                </div>;
              })}
              {debts.filter(d => d.settled).length > 0 && <div>
                <SH title="已結清 ✅" />
                {debts.filter(d => d.settled).map(d => <Card key={d.id} style={{ padding:"12px 16px", marginBottom:6, opacity:.4 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div><span style={{ fontSize:14, fontWeight:700, color:C.text }}>{d.person}</span><span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{d.desc}</span></div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}><span style={{ fontWeight:900, fontSize:13, color:C.muted }}>{fmt(d.amt)}</span><button onClick={() => upd("debts", p => p.filter(x => x.id !== d.id))} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16 }}>✕</button></div>
                  </div>
                </Card>)}
              </div>}
            </div>
          )}

          {/* ══ INVEST ══ */}
          {tab === "invest" && (
            <div style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:18 }}>📈</span><span style={{ fontWeight:900, fontSize:16, color:C.text }}>投資追蹤</span></div>
              <div style={{ display:"flex", gap:6 }}>
                <Btn sz="sm" v="secondary" onClick={() => setModal("initStock")}>📋 現有持股</Btn>
                <Btn sz="sm" onClick={() => setModal("buyStock")}>＋ 買入</Btn>
              </div>
              </div>
              <div style={{ display:"flex", gap:4, padding:4, borderRadius:14, background:C.surface, marginBottom:20 }}>
                {[{ v:"holdings", l:"持股" }, { v:"news", l:"新聞" }].map(t => <button key={t.v} onClick={() => setInvTab(t.v)} style={{ flex:1, padding:"8px 4px", borderRadius:10, fontSize:12, fontWeight:900, background:invTab === t.v ? C.accent : "transparent", color:invTab === t.v ? "#fff" : C.muted, border:"none", cursor:"pointer" }}>{t.l}</button>)}
              </div>
              {invTab === "holdings" && <div>
                <Card style={{ padding:20, marginBottom:16, background:"linear-gradient(135deg,#1a1d2e,#12141c)" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div><div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>總投資成本</div><div style={{ fontWeight:900, fontSize:20, color:C.accentL }}>{fmt(stTotCost)}</div></div>
                    <div><div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>持股標的數</div><div style={{ fontWeight:900, fontSize:20, color:C.text }}>{stSum.filter(s=>s.totalSh>0).length} 檔</div></div>
                  </div>
                </Card>
                <Card style={{ padding:20, marginBottom:16 }}>
                  <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                    {[{ v:"alloc", l:"資產配置" }, { v:"hold", l:"持股比例" }].map(o => <button key={o.v} onClick={() => setInvPie(o.v)} style={{ flex:1, padding:"6px", borderRadius:10, fontSize:12, fontWeight:700, background:invPie === o.v ? `${C.accent}30` : C.card, color:invPie === o.v ? C.accentL : C.muted, border:`1px solid ${invPie === o.v ? C.accent : C.border}`, cursor:"pointer" }}>{o.l}</button>)}
                  </div>
                  <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={invPie === "alloc" ? allocPie : holdPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={30}>{(invPie === "alloc" ? allocPie : holdPie).map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} formatter={(v, n) => [fmt(v), n]} /></PieChart></ResponsiveContainer>
                  {/* Legend */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:10, justifyContent:"center" }}>
                    {(invPie === "alloc" ? allocPie : holdPie).map((item, i) => {
                      const total = (invPie === "alloc" ? allocPie : holdPie).reduce((s,x)=>s+x.value,0);
                      const pct = total > 0 ? (item.value/total*100).toFixed(1) : "0";
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:10, height:10, borderRadius:3, background:PIE[i%PIE.length], flexShrink:0 }}/>
                          <span style={{ fontSize:12, color:C.text, fontWeight:700 }}>{item.name}</span>
                          <span style={{ fontSize:11, color:C.muted }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                {Object.entries(stByAcc).map(([accN, stks]) => <div key={accN} style={{ marginBottom:16 }}>
                  <SH title={accN} right={fmt(stks.reduce((s, x) => s + x.mv, 0))} />
                  <Card style={{ overflow:"hidden" }}>
                    {stks.map((st, i) => <SwipeRow key={st.id} onDelete={() => confirm(`確定刪除 ${st.ticker}？`, () => upd("stocks", p => p.filter(s => s.id !== st.id)))} onEdit={() => { setSelStock(st); setModal("stockDetail"); }} onClick={() => { setSelStock(st); setModal("stockDetail"); }}>
                      <div style={{ padding:"12px 16px", borderTop:i > 0 ? `1px solid ${C.border}` : undefined }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ fontWeight:900, fontSize:14, color:C.text }}>{st.ticker}</span><span style={{ fontSize:12, color:C.textSub }}>{st.name}</span><Bdg color={st.market === "US" ? C.accent : C.teal}>{st.market}</Bdg></div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{fmt(st.totalCost)}</div>
                            <div style={{ fontSize:12, color:C.textSub }}>{st.totalSh}股</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted }}>
                          <span><strong style={{ color:C.text }}>{st.totalSh}股</strong> · 均 {fmt(Math.round(st.avgCost || 0))}</span>
                          <span style={{ color:C.textSub }}>{st.totalCost>0?`成本 ${fmt(st.totalCost)}`:""}</span>
                        </div>
                      </div>
                    </SwipeRow>)}
                  </Card>
                </div>)}
                {stSum.length === 0 && <div style={{ padding:"40px 0", textAlign:"center", color:C.muted }}><div style={{ fontSize:38, marginBottom:8 }}>📊</div>尚無持股，點右上角「＋買入」</div>}
              </div>}
              {invTab === "news" && <div>
                <div style={{ fontSize:12, color:C.teal, marginBottom:12 }}>📰 點擊新聞標題開啟原始頁面</div>
                {[{ ticker:"TW大盤", title:"加權指數 — 查看台股最新走勢", url:"https://tw.stock.yahoo.com/tw-market/" }, { ticker:"S&P500", title:"S&P 500 — 美股市場最新動態", url:"https://finance.yahoo.com/quote/%5EGSPC/" }, { ticker:"財經", title:"Yahoo Finance 財經頭條新聞", url:"https://finance.yahoo.com/news/" }].map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ display:"block", textDecoration:"none", marginBottom:8 }}>
                    <Card style={{ padding:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:`${C.accent}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📰</div>
                        <div style={{ flex:1 }}><div style={{ marginBottom:4 }}><Bdg color={C.accentL}>{n.ticker}</Bdg></div><div style={{ fontSize:14, fontWeight:700, color:C.text, lineHeight:1.4 }}>{n.title}</div></div>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>}
            </div>
          )}
        </div>

        {/* FAB */}
        {tab === "overview" && <button onClick={() => { setNT({ ...T0, acc:accs.filter(a => a.type !== "credit")[0]?.name || "" }); setModal("addTxn"); }} style={{ position:"fixed", bottom:"calc(76px + env(safe-area-inset-bottom,0px))", right:18, width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentD})`, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 24px ${C.accent}55`, zIndex:25, fontSize:22 }}>✏️</button>}

        {/* Update banner */}
        {updateMsg && <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 16px", height:"100%", pointerEvents:"none" }}>
          <div style={{ pointerEvents:"auto", background:"rgba(13,15,20,0.92)", backdropFilter:"blur(18px)", border:`1px solid ${C.accent}66`, borderRadius:20, padding:"24px 24px 20px", maxWidth:340, width:"100%", textAlign:"center", boxShadow:`0 0 60px ${C.accent}44`, animation:"fadeSlideIn .4s ease", position:"relative" }}>
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
            {[{ k:"overview", i:"📊", l:"總覽" }, { k:"wallet", i:"👛", l:"錢包" }, { k:"charts", i:"📉", l:"圖表" }, { k:"notes", i:"👥", l:"往來帳" }, { k:"invest", i:"📈", l:"投資" }].map(t => {
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

        {modal === "txnDet" && selTxn && <Sheet title="交易明細" onClose={close}>
          <div style={{ borderRadius:14, padding:16, marginBottom:16, background:C.card }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:54, height:54, borderRadius:16, background:"#252839", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{CE[selTxn.cat] || "📦"}</div>
              <div><div style={{ fontWeight:900, fontSize:15, color:C.text }}>{selTxn.cat}</div><div style={{ fontWeight:900, fontSize:22, color:selTxn.type === "income" ? C.income : C.expense }}>{selTxn.type === "income" ? "+" : "-"}{fmt(selTxn.amt)}</div></div>
            </div>
            {[{ l:"日期", v:selTxn.date }, { l:"說明", v:selTxn.desc || "—" }, { l:"帳戶", v:selTxn.acc || "—" }, { l:"標籤", v:selTxn.tags || "—" }, ...(selTxn.proxyAmt > 0 ? [{ l:"代墊對象", v:selTxn.proxyFor }, { l:"代墊金額", v:fmt(selTxn.proxyAmt) }] : [])].map(r => (
              <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.textSub }}>{r.l}</span><span style={{ fontSize:13, fontWeight:700, color:C.text }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn v="warn" style={{ flex:1 }} onClick={() => setModal("editTxn")}>✏️ 編輯</Btn>
            <Btn v="danger" style={{ flex:1 }} onClick={() => delTxn(selTxn.id)}>🗑 刪除</Btn>
          </div>
        </Sheet>}

        {modal === "editTxn" && selTxn && <Sheet title="編輯記錄" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"expense", l:"支出", c:C.expense }, { v:"income", l:"收入", c:C.income }].map(o => <TP key={o.v} active={selTxn.type === o.v} color={o.c} onClick={() => setSelTxn(p => ({ ...p, type:o.v }))}>{o.l}</TP>)}
          </div>
          <Fld label="分類"><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {(selTxn.type === "income" ? cats.income : cats.expense).map(cat => <button key={cat} onClick={() => setSelTxn(p => ({ ...p, cat }))} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:selTxn.cat === cat ? `${C.accent}30` : C.card, border:`1px solid ${selTxn.cat === cat ? C.accent : C.border}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>{CE[cat] || "📦"}</span><span style={{ fontSize:11, color:selTxn.cat === cat ? C.accentL : C.textSub }}>{cat.length > 3 ? cat.slice(0, 3) + "…" : cat}</span></button>)}
          </div></Fld>
          <CalcInp label="金額" value={String(selTxn.amt)} onChange={v => setSelTxn(p => ({ ...p, amt:+v }))} />
          <AutoInput label="說明" value={selTxn.desc || ""} onChange={v => setSelTxn(p => ({ ...p, desc:v }))} history={descHistory} />
          <AutoInput label="標籤" value={selTxn.tags || ""} placeholder="#標籤" onChange={v => setSelTxn(p => ({ ...p, tags:v }))} history={tagsHistory} />
          <Sl label="帳戶" value={selTxn.acc || ""} onChange={e => setSelTxn(p => ({ ...p, acc:e.target.value }))}>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label="日期"><input type="date" value={selTxn.date} onChange={e => setSelTxn(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => saveTxn(selTxn)}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "addTxn" && <Sheet title="新增 / 補記" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"expense", l:"支出 💸", c:C.expense }, { v:"income", l:"收入 💰", c:C.income }].map(o => <TP key={o.v} active={nT.type === o.v} color={o.c} onClick={() => setNT(p => ({ ...p, type:o.v, cat:o.v === "income" ? "薪資" : "食物" }))}>{o.l}</TP>)}
          </div>
          <Fld label="分類"><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {(nT.type === "income" ? cats.income : cats.expense).map(cat => <button key={cat} onClick={() => setNT(p => ({ ...p, cat }))} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:nT.cat === cat ? `${C.accent}30` : C.card, border:`1px solid ${nT.cat === cat ? C.accent : C.border}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>{CE[cat] || "📦"}</span><span style={{ fontSize:11, color:nT.cat === cat ? C.accentL : C.textSub }}>{cat.length > 3 ? cat.slice(0, 3) + "…" : cat}</span></button>)}
            <button onClick={() => setModal("catSet")} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8, borderRadius:10, background:C.card, border:`1px dashed ${C.accent}`, cursor:"pointer" }}><span style={{ fontSize:20 }}>➕</span><span style={{ fontSize:11, color:C.accentL }}>新增</span></button>
          </div></Fld>
          <CalcInp label="金額" value={nT.amt} onChange={v => setNT(p => ({ ...p, amt:v }))} />
          <AutoInput label="說明" placeholder="蝦仁蛋炒飯" value={nT.desc} onChange={v => setNT(p => ({ ...p, desc:v }))} history={descHistory} />
          <AutoInput label="標籤（選填）" placeholder="#標籤" value={nT.tags} onChange={v => setNT(p => ({ ...p, tags:v }))} history={tagsHistory} />
          <Sl label="帳戶" value={nT.acc} onChange={e => setNT(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇帳戶 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Fld label={`日期${nT.date !== TODAY ? " 📅 補記 " + nT.date : ""}`}><input type="date" value={nT.date} onChange={e => setNT(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          {nT.type === "expense" && <div style={{ marginBottom:12 }}>
            <button onClick={() => setNT(p => ({ ...p, proxy:!p.proxy }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.proxy ? `${C.warn}22` : C.card, color:nT.proxy ? C.warn : C.textSub, border:`1px solid ${nT.proxy ? C.warn : C.border}`, cursor:"pointer" }}>
              <span>{nT.proxy ? "✅" : "⬜"}</span> 含代墊款項（自動建立應收帳款）
            </button>
            {nT.proxy && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}44` }}>
              {nT.amt && nT.proxyList.length > 1 && <button onClick={() => { const each = Math.round(+nT.amt / nT.proxyList.length); setNT(p => ({ ...p, proxyList:p.proxyList.map(pl => ({ ...pl, amt:String(each) })) })); }} style={{ width:"100%", marginBottom:8, padding:"6px", borderRadius:8, background:`${C.warn}30`, color:C.warn, border:"none", fontSize:12, fontWeight:700, cursor:"pointer" }}>÷ 平均分配（每人 {fmt(Math.round(+nT.amt / nT.proxyList.length))}）</button>}
              {nT.proxyList.map((pl, i) => <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-end", marginBottom:8 }}>
                <div style={{ flex:1 }}><Inp label={`對象 ${i + 1}`} placeholder="朋友A" value={pl.person} onChange={e => setNT(p => ({ ...p, proxyList:p.proxyList.map((x, j) => j === i ? { ...x, person:e.target.value } : x) }))} /></div>
                <div style={{ flex:1 }}><Inp label="金額" type="number" placeholder="350" value={pl.amt} onChange={e => setNT(p => ({ ...p, proxyList:p.proxyList.map((x, j) => j === i ? { ...x, amt:e.target.value } : x) }))} /></div>
                {nT.proxyList.length > 1 && <button onClick={() => setNT(p => ({ ...p, proxyList:p.proxyList.filter((_, j) => j !== i) }))} style={{ width:32, height:38, borderRadius:8, background:C.danger + "22", border:"none", color:C.danger, cursor:"pointer", fontSize:16, marginBottom:12 }}>✕</button>}
              </div>)}
              <button onClick={() => setNT(p => ({ ...p, proxyList:[...p.proxyList, { person:"", amt:"" }] }))} style={{ width:"100%", padding:"6px", borderRadius:8, background:"transparent", border:`1px dashed ${C.warn}`, color:C.warn, fontSize:12, fontWeight:700, cursor:"pointer" }}>＋ 新增代墊對象</button>
              <div style={{ fontSize:12, color:C.warn, marginTop:6 }}>✨ 自動在「往來帳」為每位對象建立應收記錄</div>
            </div>}
          </div>}
          {nT.type === "income" && <div style={{ marginBottom:12 }}>
            <button onClick={() => setNT(p => ({ ...p, deferred:!p.deferred }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, fontSize:14, fontWeight:700, background:nT.deferred ? `${C.teal}22` : C.card, color:nT.deferred ? C.teal : C.textSub, border:`1px solid ${nT.deferred ? C.teal : C.border}`, cursor:"pointer" }}>
              <span>{nT.deferred ? "✅" : "⬜"}</span> 開啟分月認列（家教薪資）
            </button>
            {nT.deferred && <div style={{ marginTop:8, padding:12, borderRadius:10, background:`${C.teal}12`, border:`1px solid ${C.teal}44` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <Inp label="分幾個月" type="number" placeholder="4" value={nT.deferMonths} onChange={e => setNT(p => ({ ...p, deferMonths:e.target.value, deferMoAmt:p.amt ? String(Math.round(+p.amt / +(e.target.value || 1))) : "" }))} />
                <Inp label="本月認列" type="number" placeholder="5000" value={nT.deferMoAmt} onChange={e => setNT(p => ({ ...p, deferMoAmt:e.target.value }))} />
              </div>
              <div style={{ fontSize:12, color:C.teal }}>💡 Wallet 顯示全額，Overview 只計本月認列</div>
            </div>}
          </div>}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addTxn}>確認新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "pools" && <Sheet title="認列收入池" onClose={close}>
          {pools.filter(p => p.totalAmt - p.recognized > 0).length === 0 && <div style={{ padding:"32px 0", textAlign:"center", color:C.muted }}>所有收入已完全認列</div>}
          {pools.filter(p => p.totalAmt - p.recognized > 0).map(p => <div key={p.id} style={{ borderRadius:14, padding:16, marginBottom:12, background:C.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.desc}</div><div style={{ fontSize:12, color:C.muted }}>{p.date}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub }}>已認列/總額</div><div style={{ fontWeight:700, fontSize:13, color:C.teal }}>{fmt(p.recognized)}/{fmt(p.totalAmt)}</div></div>
            </div>
            <div style={{ height:6, borderRadius:3, background:C.border, marginBottom:12 }}><div style={{ height:"100%", borderRadius:3, width:`${(p.recognized / p.totalAmt * 100).toFixed(0)}%`, background:C.teal }} /></div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" placeholder={`最多 ${fmt(p.totalAmt - p.recognized)}`} value={selPool?.id === p.id ? recAmt : ""} onFocus={() => setSelPool(p)} onChange={e => setRecAmt(e.target.value)} style={{ ...iSt, flex:1 }} />
              <Btn v="teal" sz="sm" onClick={() => { setSelPool(p); setTimeout(doRecognize, 50); }}>認列</Btn>
            </div>
          </div>)}
        </Sheet>}

        {modal === "adjBal" && selAcc && (() => {
          const isFirst = selAcc.bal === 0 && !txns.some(t => t.acc === selAcc.name);
          const moAdj = moTxns.filter(t => t.cat === "帳戶調整" && t.acc === selAcc.name);
          const moAdjTotal = moAdj.reduce((s, t) => s + (t.adjDiff || 0), 0);
          return <Sheet title={`編輯帳戶 — ${selAcc.name}`} onClose={close}>
            <Inp label="帳戶名稱" value={selAcc.name} onChange={e => setSelAcc(p => ({ ...p, name:e.target.value }))} />
            <Fld label="帳戶類型"><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[{ v:"cash", l:"💰 現金" }, { v:"debit", l:"🏦 銀行" }, { v:"investment", l:"📊 證券" }, { v:"credit", l:"💳 信用卡" }].map(o => <button key={o.v} onClick={() => setSelAcc(p => ({ ...p, type:o.v }))} style={{ flex:1, padding:"7px 4px", borderRadius:10, fontSize:11, fontWeight:700, background:selAcc.type === o.v ? `${C.accent}30` : C.card, color:selAcc.type === o.v ? C.accentL : C.muted, border:`1px solid ${selAcc.type === o.v ? C.accent : C.border}`, cursor:"pointer", minWidth:60 }}>{o.l}</button>)}
            </div></Fld>
            <div style={{ borderRadius:14, padding:16, marginBottom:12, background:C.surface }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>目前餘額</div><div style={{ fontWeight:900, fontSize:24, color:C.accentL }}>{fmt(selAcc.bal, selAcc.cur)}</div></div>
                {moAdjTotal !== 0 && <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>本月已調整</div><div style={{ fontWeight:700, fontSize:15, color:moAdjTotal > 0 ? C.income : C.expense }}>{moAdjTotal > 0 ? "+" : ""}{fmt(moAdjTotal, selAcc.cur)}</div></div>}
              </div>
            </div>
            <Inp label="輸入新餘額" type="number" value={newBal} onChange={e => setNewBal(e.target.value)} placeholder={String(selAcc.bal)} />
            {newBal && +newBal !== selAcc.bal && <div style={{ marginBottom:12, padding:12, borderRadius:10, fontSize:14, fontWeight:700, background:C.card, border:`1px solid ${C.borderL}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ color:C.textSub }}>調整金額</span><span style={{ color:+newBal > selAcc.bal ? C.income : C.expense, fontWeight:900 }}>{+newBal > selAcc.bal ? "+" : ""}{fmt(+newBal - selAcc.bal, selAcc.cur)}</span></div>
              <div style={{ fontSize:12, color:isFirst ? C.teal : C.muted }}>{isFirst ? "✅ 初次設定，不計入收支" : "📝 調整記錄只用於對帳，不計入收支"}</div>
            </div>}
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <Btn style={{ flex:1 }} onClick={() => {
                upd("accs", p => p.map(a => a.id === selAcc.id ? { ...a, name:selAcc.name, type:selAcc.type } : a));
                if (newBal && +newBal !== selAcc.bal) adjBal(selAcc, newBal, isFirst);
                setNewBal(""); close();
              }}>{isFirst && newBal && +newBal !== selAcc.bal ? "設為初始金額" : "儲存"}</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
            <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selAcc.name}」？`, () => { upd("accs", p => p.filter(a => a.id !== selAcc.id)); close(); })}>🗑 刪除此帳戶</Btn>
          </Sheet>;
        })()}

        {modal === "editCredit" && selAcc && <Sheet title={`編輯信用卡 — ${selAcc.name}`} onClose={close}>
          <Inp label="卡片名稱" value={selAcc.name} onChange={e => setSelAcc(p => ({ ...p, name:e.target.value }))} />
          <Inp label="信用額度" type="number" value={selAcc.limit || ""} onChange={e => setSelAcc(p => ({ ...p, limit:+e.target.value }))} />
          <Inp label="目前應付金額" type="number" value={selAcc.payable != null ? String(selAcc.payable) : "0"} onChange={e => setSelAcc(p => ({ ...p, payable:+e.target.value }))} />
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <Btn style={{ flex:1 }} onClick={() => { upd("accs", p => p.map(a => a.id === selAcc.id ? { ...a, name:selAcc.name, limit:selAcc.limit, payable:selAcc.payable } : a)); close(); }}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          <Btn v="danger" style={{ width:"100%" }} onClick={() => confirm(`確定刪除「${selAcc.name}」？`, () => { upd("accs", p => p.filter(a => a.id !== selAcc.id)); close(); })}>🗑 刪除此信用卡</Btn>
        </Sheet>}

        {modal === "payCred" && <Sheet title="信用卡繳費 / Pay" onClose={close}>
          <Fld label="Date（日期）"><input type="date" value={payF.date} onChange={e => setPayF(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          <Sl label="信用卡 (To)" value={payF.creditId} onChange={e => { const c = accs.find(a => a.id === e.target.value); setPayF(p => ({ ...p, creditId:e.target.value, amt:String(c?.payable || 0) })); }}><option value="">— 選擇 —</option>{accs.filter(a => a.type === "credit").map(c => <option key={c.id} value={c.id}>{c.name}（應付 {fmt(c.payable)}）</option>)}</Sl>
          <Sl label="From（扣款帳戶）" value={payF.fromId} onChange={e => setPayF(p => ({ ...p, fromId:e.target.value }))}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.id}>{AT[a.type] || ""} {a.name} ({fmt(a.bal, a.cur)})</option>)}</Sl>
          <CalcInp label="Amount（金額）" value={payF.amt} onChange={v => setPayF(p => ({ ...p, amt:v }))} />
          <Inp label="Note（備註）" placeholder="4月卡費" value={payF.note} onChange={e => setPayF(p => ({ ...p, note:e.target.value }))} />
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button onClick={payCredit} style={{ flex:1, padding:13, borderRadius:12, background:"#fff", color:"#000", border:"none", fontWeight:900, fontSize:15, cursor:"pointer" }}>Save</button>
            <button onClick={close} style={{ padding:"13px 20px", borderRadius:12, background:C.card, color:C.text, border:`1px solid ${C.border}`, fontWeight:700, fontSize:14, cursor:"pointer" }}>取消</button>
          </div>
        </Sheet>}

        {modal === "transfer" && <Sheet title="帳戶轉帳" onClose={close}>
          <Sl label="從 (From)" value={trFrom} onChange={e => setTrFrom(e.target.value)}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.id}>{a.name} ({fmt(a.bal, a.cur)})</option>)}</Sl>
          <Sl label="到 (To)" value={trTo} onChange={e => setTrTo(e.target.value)}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Sl>
          <Inp label="金額" type="number" value={trAmt} onChange={e => setTrAmt(e.target.value)} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={doTransfer}>確認轉帳</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "addDebt" && <Sheet title="新增往來帳" onClose={close}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{ v:"receivable", l:"別人欠我 💚", c:C.teal }, { v:"payable", l:"我欠別人 🟡", c:C.warn }].map(o => <TP key={o.v} active={nD.type === o.v} color={o.c} onClick={() => setND(p => ({ ...p, type:o.v }))}>{o.l}</TP>)}
          </div>
          <Inp label="對象" placeholder="媽媽" value={nD.person} onChange={e => setND(p => ({ ...p, person:e.target.value }))} />
          <Inp label="金額" type="number" value={nD.amt} onChange={e => setND(p => ({ ...p, amt:e.target.value }))} />
          <Inp label="說明" placeholder="生活費" value={nD.desc} onChange={e => setND(p => ({ ...p, desc:e.target.value }))} />
          <Fld label="日記備註"><textarea value={nD.note} onChange={e => setND(p => ({ ...p, note:e.target.value }))} placeholder="今天發生了什麼…" style={{ ...iSt, height:70, resize:"none" }} /></Fld>
          <Fld label="日期"><input type="date" value={nD.date} onChange={e => setND(p => ({ ...p, date:e.target.value }))} style={iSt} /></Fld>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addDebt}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "addSub" && <Sheet title="新增訂閱" onClose={close}>
          <Inp label="名稱" placeholder="Netflix" value={nS.name} onChange={e => setNS(p => ({ ...p, name:e.target.value }))} />
          <Inp label="每月金額" type="number" value={nS.amt} onChange={e => setNS(p => ({ ...p, amt:e.target.value }))} />
          <Sl label="扣款帳戶" value={nS.acc} onChange={e => setNS(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Inp label="每月扣款日" type="number" min="1" max="31" value={nS.day} onChange={e => setNS(p => ({ ...p, day:e.target.value }))} />
          <Sl label="分類" value={nS.cat} onChange={e => setNS(p => ({ ...p, cat:e.target.value }))}>{cats.expense.map(k => <option key={k} value={k}>{CE[k] || "📦"} {k}</option>)}</Sl>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addSub}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "editSub" && selSub && <Sheet title="編輯訂閱" onClose={close}>
          <Inp label="名稱" value={selSub.name} onChange={e => setSelSub(p => ({ ...p, name:e.target.value }))} />
          <Inp label="每月金額" type="number" value={selSub.amt} onChange={e => setSelSub(p => ({ ...p, amt:+e.target.value }))} />
          <Sl label="扣款帳戶" value={selSub.acc} onChange={e => setSelSub(p => ({ ...p, acc:e.target.value }))}>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Inp label="每月扣款日" type="number" min="1" max="31" value={selSub.day} onChange={e => setSelSub(p => ({ ...p, day:+e.target.value }))} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => saveSub(selSub)}>儲存</Btn>
            <Btn v="danger" style={{ flex:1 }} onClick={() => { upd("subs", p => p.filter(x => x.id !== selSub.id)); close(); }}>刪除</Btn>
          </div>
        </Sheet>}

        {modal === "addBill" && <Sheet title="新增基本開銷" onClose={close}>
          <div style={{ padding:"8px 12px", borderRadius:10, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, fontSize:12, color:C.warn, marginBottom:12 }}>🏠 預設停用，需要時再點開啟</div>
          <Inp label="名稱" placeholder="電費、水費、房租…" value={nB.name} onChange={e => setNB(p => ({ ...p, name:e.target.value }))} />
          <Inp label="每月金額" type="number" value={nB.amt} onChange={e => setNB(p => ({ ...p, amt:e.target.value }))} />
          <Sl label="扣款帳戶" value={nB.acc} onChange={e => setNB(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Inp label="每月扣款日" type="number" min="1" max="31" value={nB.day} onChange={e => setNB(p => ({ ...p, day:e.target.value }))} />
          <Sl label="分類" value={nB.cat} onChange={e => setNB(p => ({ ...p, cat:e.target.value }))}>{cats.expense.map(k => <option key={k} value={k}>{CE[k] || "📦"} {k}</option>)}</Sl>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addBill}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "editBill" && selBill && <Sheet title="編輯基本開銷" onClose={close}>
          <Inp label="名稱" value={selBill.name} onChange={e => setSelBill(p => ({ ...p, name:e.target.value }))} />
          <Inp label="每月金額" type="number" value={selBill.amt} onChange={e => setSelBill(p => ({ ...p, amt:+e.target.value }))} />
          <Sl label="扣款帳戶" value={selBill.acc} onChange={e => setSelBill(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
          <Inp label="每月扣款日" type="number" min="1" max="31" value={selBill.day} onChange={e => setSelBill(p => ({ ...p, day:+e.target.value }))} />
          <Sl label="分類" value={selBill.cat} onChange={e => setSelBill(p => ({ ...p, cat:e.target.value }))}>{cats.expense.map(k => <option key={k} value={k}>{CE[k] || "📦"} {k}</option>)}</Sl>
          <div style={{ display:"flex", gap:8, marginTop:8, marginBottom:8 }}>
            <Btn style={{ flex:1 }} onClick={() => saveBill(selBill)}>儲存</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
          <Btn v="danger" style={{ width:"100%" }} onClick={() => { upd("bills", p => p.filter(x => x.id !== selBill.id)); close(); }}>🗑 刪除</Btn>
        </Sheet>}

        {modal === "addAcc" && <Sheet title="新增帳戶" onClose={close}>
          <Inp label="帳戶名稱" placeholder="玉山銀行" value={nAcc.name} onChange={e => setNAcc(p => ({ ...p, name:e.target.value }))} />
          <Sl label="帳戶類型" value={nAcc.type} onChange={e => setNAcc(p => ({ ...p, type:e.target.value }))}>
            <option value="cash">💰 現金</option>
            <option value="debit">🏦 銀行帳戶</option>
            <option value="investment">📊 證券帳戶</option>
            <option value="credit">💳 信用卡</option>
          </Sl>
          <Fld label="幣別">
            <input placeholder="搜尋幣別（如 USD、EUR、日圓）" value={curSearch} onChange={e => setCurSearch(e.target.value)} style={{ ...iSt, marginBottom:6 }} />
            <select value={nAcc.cur} onChange={e => setNAcc(p => ({ ...p, cur:e.target.value }))} style={iSt}>
              {ALL_CURS.filter(c => !curSearch || c.toLowerCase().includes(curSearch.toLowerCase()) || (CUR_NAME[c] || "").includes(curSearch)).map(c => <option key={c} value={c}>{c} {CUR_NAME[c] || ""} (1{c}≈{toTWD(1, c, rates) >= 1 ? toTWD(1, c, rates).toFixed(2) : toTWD(1, c, rates).toFixed(4)} TWD)</option>)}
            </select>
          </Fld>
          {nAcc.type === "credit" && <Inp label="信用額度" type="number" value={nAcc.limit} onChange={e => setNAcc(p => ({ ...p, limit:e.target.value }))} />}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={addAccFn}>新增</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "initStock" && <Sheet title="📋 登錄現有持股" onClose={close}>
          <div style={{ padding:"10px 14px", borderRadius:12, background:`${C.teal}15`, border:`1px solid ${C.teal}44`, fontSize:12, color:C.teal, marginBottom:16 }}>
            💡 用於登錄你<strong>已經持有</strong>的股票，不會產生買入記錄，也不會扣款。<br/>之後的買賣再用「＋買入」和「賣出」記錄。
          </div>
          <Sl label="證券帳戶" value={buyF.acc} onChange={e => setBuyF(p => ({ ...p, acc:e.target.value }))}>
            <option value="">— 選擇 —</option>
            {accs.filter(a => a.type === "investment").map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </Sl>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="股票代號" placeholder="0050 / AAPL" value={buyF.ticker} onChange={e => setBuyF(p => ({ ...p, ticker:e.target.value.toUpperCase() }))} />
            <Inp label="股票名稱" placeholder="元大台灣50" value={buyF.name} onChange={e => setBuyF(p => ({ ...p, name:e.target.value }))} />
          </div>
          <Sl label="市場" value={buyF.market} onChange={e => setBuyF(p => ({ ...p, market:e.target.value }))}>
            <option value="TW">台股 TW</option>
            <option value="US">美股 US</option>
          </Sl>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="目前持股數" type="number" placeholder="1000" value={buyF.shares} onChange={e => setBuyF(p => ({ ...p, shares:e.target.value }))} />
            <Inp label="平均成本（每股）" type="number" placeholder="63" value={buyF.avgCost} onChange={e => setBuyF(p => ({ ...p, avgCost:e.target.value }))} />
          </div>
          <CalcInp label="投資總成本（選填）" value={buyF.totalCost} onChange={v => setBuyF(p => ({ ...p, totalCost:v }))} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={() => {
              if (!buyF.ticker || !buyF.shares) return;
              // 直接建立持股，不產生任何 trade 記錄，純粹記錄現況
              upd("stocks", p => {
                const ex = p.find(s => s.ticker === buyF.ticker && s.acc === buyF.acc);
                if (ex) {
                  return p.map(s => s.id === ex.id ? {
                    ...s,
                    name: buyF.name || s.name,
                    manualShares: +buyF.shares,
                    manualAvgCost: buyF.avgCost ? +buyF.avgCost : s.manualAvgCost,
                    manualTotalCost: buyF.totalCost ? +buyF.totalCost : s.manualTotalCost,
                  } : s);
                }
                return [...p, {
                  id: "s"+Date.now(), acc:buyF.acc,
                  ticker:buyF.ticker, name:buyF.name||buyF.ticker,
                  market:buyF.market, curPrice:0,
                  manualShares: +buyF.shares,
                  manualAvgCost: buyF.avgCost ? +buyF.avgCost : null,
                  manualTotalCost: buyF.totalCost ? +buyF.totalCost : null,
                  trades: [], // 無交易紀錄
                }];
              });
              setBuyF(BF0); close();
            }}>登錄持股</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "buyStock" && <Sheet title="記錄買入" onClose={close}>
          <Sl label="證券帳戶" value={buyF.acc} onChange={e => setBuyF(p => ({ ...p, acc:e.target.value }))}><option value="">— 選擇 —</option>{accs.filter(a => a.type === "investment").map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</Sl>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="股票代號" placeholder="0050 / AAPL" value={buyF.ticker} onChange={e => setBuyF(p => ({ ...p, ticker:e.target.value.toUpperCase() }))} />
            <Inp label="股票名稱" placeholder="元大台灣50" value={buyF.name} onChange={e => setBuyF(p => ({ ...p, name:e.target.value }))} />
          </div>
          <Sl label="市場" value={buyF.market} onChange={e => setBuyF(p => ({ ...p, market:e.target.value }))}><option value="TW">台股 TW</option><option value="US">美股 US</option></Sl>
          <div style={{ padding:"8px 12px", borderRadius:10, background:`${C.accent}12`, border:`1px solid ${C.accent}33`, fontSize:12, color:C.accentL, marginBottom:10 }}>📝 以下欄位全部手動輸入，系統不自動聯動計算</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Inp label="股數" type="number" placeholder="1000" value={buyF.shares} onChange={e => setBuyF(p => ({ ...p, shares:e.target.value }))} />
            <Inp label="平均成本（每股）" type="number" placeholder="63" value={buyF.avgCost} onChange={e => setBuyF(p => ({ ...p, avgCost:e.target.value }))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <CalcInp label="投資總成本" value={buyF.totalCost} onChange={v => setBuyF(p => ({ ...p, totalCost:v }))} />
            <Inp label="手續費" type="number" placeholder="0" value={buyF.fee} onChange={e => setBuyF(p => ({ ...p, fee:e.target.value }))} />
          </div>
          <Sl label="從哪個帳戶扣款（選填）" value={buyF.fromAcc} onChange={e => setBuyF(p => ({ ...p, fromAcc:e.target.value }))}><option value="">— 不扣款 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name} ({fmt(a.bal, a.cur)})</option>)}</Sl>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn style={{ flex:1 }} onClick={doBuy}>確認買入</Btn>
            <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
          </div>
        </Sheet>}

        {modal === "stockDetail" && selStock && (() => {
          const st = stSum.find(s => s.id === selStock.id) || selStock;
          return <Sheet title={`${st.ticker} ${st.name}`} onClose={close}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Inp label="股數（自動計算）" type="number" value={String(st.totalSh)}
                onChange={e => upd("stocks", p => p.map(s => s.id===st.id ? {...s, manualShares:+e.target.value} : s))}
                style={{...iSt, color:C.accentL}} />
              <Inp label="平均成本（每股）" type="number"
                value={st.manualAvgCost!=null ? String(st.manualAvgCost) : String(st.avgCost ? st.avgCost.toFixed(2) : 0)}
                onChange={e => upd("stocks", p => p.map(s => s.id===st.id ? {...s, manualAvgCost:+e.target.value} : s))} />
            </div>
            <Inp label="投資總成本" type="number"
              value={st.manualTotalCost!=null ? String(st.manualTotalCost) : String(Math.round(st.totalCost||0))}
              onChange={e => upd("stocks", p => p.map(s => s.id===st.id ? {...s, manualTotalCost:+e.target.value} : s))} />
            <div style={{ fontSize:11, color:C.teal, marginBottom:12, padding:"8px 12px", borderRadius:8, background:`${C.teal}12` }}>
              💡 股數 = 買入總數 − 賣出總數，會自動從交易紀錄計算。手動修改後會覆蓋自動計算。
            </div>
            <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.08em", color:C.muted, marginBottom:8 }}>交易紀錄</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
              {(st.trades||[]).map(tr => <div key={tr.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, fontSize:12, background:tr.type==="buy"?`${C.expense}12`:`${C.income}12` }}>
                <span style={{ color:C.textSub }}>{tr.date} {tr.type==="buy"?"買入":"賣出"} {tr.shares}股</span>
                <span style={{ fontWeight:700, color:tr.type==="buy"?C.expense:C.income }}>{tr.price?`NT$${Math.round(tr.price)}/股`:tr.totalProceeds?`總計 ${fmt(tr.totalProceeds)}`:""}</span>
              </div>)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn v="warn" style={{ flex:1 }} onClick={() => { setSellF({ stockId:st.id, shares:String(st.totalSh), totalProceeds:"", pnl:"", pnlType:"income", returnAcc:"" }); setModal("sellStock"); }}>賣出 {st.ticker}</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={() => window.open(`https://finance.yahoo.com/quote/${st.market==="TW"?st.ticker+".TW":st.ticker}`, "_blank")}>Yahoo ↗</Btn>
            </div>
            <Btn v="danger" style={{ width:"100%", marginTop:8 }} onClick={() => confirm(`確定刪除 ${st.ticker}？`, () => { upd("stocks", p => p.filter(s => s.id!==st.id)); close(); })}>🗑 刪除此持股</Btn>
          </Sheet>;
        })()}

        {modal === "sellStock" && (() => {
          const st = stSum.find(s => s.id === sellF.stockId);
          if (!st) return null;
          return <Sheet title="賣出股票" onClose={close}>
            <div style={{ padding:12, borderRadius:10, marginBottom:12, background:C.card }}>
              <div style={{ fontWeight:900, fontSize:14, color:C.text }}>{st.ticker} {st.name}</div>
              <div style={{ fontSize:12, color:C.textSub }}>目前持股 <strong style={{ color:C.accentL }}>{st.totalSh}股</strong> · 均成本 {fmt(Math.round(st.avgCost || 0))}</div>
            </div>
            <Inp label="賣出股數" type="number" placeholder={String(st.totalSh)} value={sellF.shares} onChange={e => setSellF(p => ({ ...p, shares:e.target.value }))} />
            <CalcInp label="賣出總金額" value={sellF.totalProceeds} onChange={v => setSellF(p => ({ ...p, totalProceeds:v }))} />
            <Inp label="手續費（選填）" type="number" placeholder="0" value={sellF.fee||""} onChange={e => setSellF(p => ({ ...p, fee:e.target.value }))} />
            {sellF.shares && <div style={{ marginBottom:12, padding:10, borderRadius:10, background:`${C.accent}10`, fontSize:12, color:C.textSub }}>
              賣出後剩餘：<strong style={{ color:C.accentL }}>{Math.max(0, st.totalSh - +sellF.shares)}股</strong>
            </div>}
            <Fld label="損益記錄（手動）">
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <button onClick={() => setSellF(p => ({ ...p, pnlType:"income" }))} style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, background:sellF.pnlType==="income"?`${C.income}28`:C.card, color:sellF.pnlType==="income"?C.income:C.muted, border:`1px solid ${sellF.pnlType==="income"?C.income:C.border}`, cursor:"pointer" }}>📈 獲利</button>
                <button onClick={() => setSellF(p => ({ ...p, pnlType:"expense" }))} style={{ flex:1, padding:"8px", borderRadius:10, fontWeight:700, fontSize:13, background:sellF.pnlType==="expense"?`${C.expense}28`:C.card, color:sellF.pnlType==="expense"?C.expense:C.muted, border:`1px solid ${sellF.pnlType==="expense"?C.expense:C.border}`, cursor:"pointer" }}>📉 虧損</button>
              </div>
              <CalcInp label="損益金額" value={sellF.pnl} onChange={v => setSellF(p => ({ ...p, pnl:v }))} />
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>填入後會自動在總覽產生收支記錄</div>
            </Fld>
            <Sl label="款項回流帳戶" value={sellF.returnAcc} onChange={e => setSellF(p => ({ ...p, returnAcc:e.target.value }))}><option value="">— 選擇 —</option>{accs.filter(a => a.type !== "credit").map(a => <option key={a.id} value={a.name}>{AT[a.type] || ""} {a.name}</option>)}</Sl>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn style={{ flex:1 }} onClick={doSell}>確認賣出</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}

        {modal === "catSet" && <Sheet title="類別管理" onClose={close}>
          {["expense","income"].map(type => <div key={type} style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10, color:type === "expense" ? C.expense : C.income }}>{type === "expense" ? "💸 支出類別" : "💰 收入類別"}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
              {cats[type].map(cat => <div key={cat} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:10, fontSize:13, fontWeight:700, background:`${C.accent}18`, border:`1px solid ${C.border}` }}>
                <span>{CE[cat] || "📦"} {cat}</span>
                <button onClick={() => upd("cats", p => ({ ...p, [type]:p[type].filter(c => c !== cat) }))} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, fontSize:14, lineHeight:1, marginLeft:2 }}>✕</button>
              </div>)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={newCatType === type ? newCatName : ""} onChange={e => { setNewCatType(type); setNewCatName(e.target.value); }} placeholder={`新增${type === "expense" ? "支出" : "收入"}類別…`} style={{ ...iSt, flex:1 }} onKeyDown={e => { if (e.key === "Enter") { setNewCatType(type); addCat(); } }} />
              <Btn sz="sm" onClick={() => { setNewCatType(type); addCat(); }}>＋</Btn>
            </div>
          </div>)}
          <Btn v="secondary" style={{ width:"100%", marginTop:8 }} onClick={close}>關閉</Btn>
        </Sheet>}

        {modal === "rateSettings" && (() => {
          const usedCurs = [...new Set(accs.map(a => a.cur).filter(c => c !== "TWD"))];
          return <Sheet title="💱 匯率設定（對 TWD）" onClose={close}>
            <div style={{ fontSize:12, color:C.textSub, marginBottom:12 }}>調整後點儲存，所有外幣換算立即更新。</div>
            {usedCurs.length === 0 && <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>目前沒有外幣帳戶</div>}
            {ALL_CURS.filter(c => c !== "TWD" && usedCurs.includes(c)).map(c => <div key={c} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:48, fontWeight:700, fontSize:14, color:C.text }}>{c}</div>
              <div style={{ fontSize:12, color:C.textSub, flex:1 }}>{CUR_NAME[c] || ""}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12, color:C.muted }}>1{c}=</span>
                <input type="number" value={localRates[c] || ""} onChange={e => setLocalRates(p => ({ ...p, [c]:+e.target.value }))} style={{ ...iSt, width:90, padding:"6px 10px", fontSize:13 }} />
                <span style={{ fontSize:12, color:C.muted }}>TWD</span>
              </div>
            </div>)}
            <div style={{ marginTop:12, display:"flex", gap:8 }}>
              <Btn style={{ flex:1 }} onClick={() => { upd("rates", () => localRates); close(); }}>儲存匯率</Btn>
              <Btn v="secondary" style={{ flex:1 }} onClick={close}>取消</Btn>
            </div>
          </Sheet>;
        })()}

        {showDP && <DatePicker value={chartRange} onChange={setChartRange} onClose={() => setShowDP(false)} />}
        {showHDP && <DatePicker value={healthRange} onChange={setHealthRange} onClose={() => setShowHDP(false)} />}

        {/* ConfirmDialog - replaces window.confirm */}
        {confirmDlg && <ConfirmDialog msg={confirmDlg.msg} onOk={() => { confirmDlg.onOk(); closeConfirm(); }} onCancel={closeConfirm} />}

      </div>
    </>
  );
}
