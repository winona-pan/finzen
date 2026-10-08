import { useState } from "react";

/* ── 使用手冊內容：依「每天會用 → 規劃 → 投資 → 分析 → 帳號與設定」分組；
   每個主題一張卡，收起來時只看到標題＋一行說明，點開才是重點條列。
   功能有改的話記得回來改這裡（以前另有一份 UserGuideModal 已經刪掉了，只剩這一份） ── */
const QUICK_START = [
  { icon:"📝", text:"總覽右下角 ✏️ 記第一筆帳，記得選帳戶，餘額才會跟著變" },
  { icon:"👛", text:"到錢包把銀行、證券、信用卡帳戶建起來" },
  { icon:"🧠", text:"在總覽按「智慧分流」，填這個月的收入，看錢該怎麼分" },
  { icon:"👤", text:"到「更多 → 帳戶」登入，手機和電腦就能同步" },
];

const GUIDE_GROUPS = [
  { title:"每天會用", sections:[
    { key:"overview", icon:"📊", title:"總覽・記帳", sub:"記帳、生活水位、連續達標", items:[
      "右下角 ✏️ 新增收入或支出；說明欄會記得同類別打過的字，方便快速帶入",
      "左滑一筆可以刪除、右滑可以編輯；刪錯了 6 秒內按畫面下方「↩️ 復原」",
      "生活水位：這個月生活費預算 vs 已經花了多少；預算是在智慧分流裡設定的",
      "連續達標：連續幾個月生活費沒超支；點 3／6／12／24 圓圈可以看和改每一關的獎勵",
      "待處理、目標進度：有需要處理的事項和釘選的目標，會並排顯示在上方",
      "代墊：記支出時打開「含代墊」，自動拆出自己那份，並在往來帳建立應收",
      "分月認列（大筆收入）、分期（大筆支出）：記帳時打開，之後每個月自動認列一部分",
      "標著 🎯 的是從存錢目標花出去的錢，不算進生活費和 50/30/20",
    ]},
    { key:"wallet", icon:"👛", title:"錢包・帳戶", sub:"帳戶、子帳戶、信用卡、訂閱、保單", items:[
      "右上角 ➕ 新增現金、金融卡、證券帳戶、信用卡、儲蓄保單",
      "點帳戶看它的所有交易，依月份分組；右滑帳戶可以編輯或刪除",
      "子帳戶：在銀行帳戶底下分出旅費、願望、存錢等，可以隱藏（不計入總資產）、排序、互轉",
      "子帳戶互轉：同一個銀行底下只是調整分類；跨銀行會真的搬錢並記一筆轉帳",
      "信用卡：記「應付金額」，按繳費選扣款帳戶，應付會自動扣掉",
      "訂閱／固定開銷：到期自動記帳；年繳的可以打開「年繳分攤」，每個月認列一份",
      "儲蓄保單：不計入總資產，只追蹤損益；繳保費、每年更新解約金、解約時自動結算",
    ]},
    { key:"notes", icon:"👥", title:"往來帳", sub:"別人欠我、我欠別人", items:[
      "💚 別人欠我（應收）、🟡 我欠別人（應付）",
      "可以設 2～48 期分期，每期金額可以手動調整",
      "收一期／付一期時選帳戶，餘額自動更新；用信用卡付會記到應付",
      "別人還錢不算收入（本來就是你的錢），付給別人才算支出",
      "7 天內到期會提醒，逾期顯示紅色 ⚠️",
    ]},
  ]},
  { title:"規劃", sections:[
    { key:"goals", icon:"🎯", title:"存錢目標", sub:"設定、定期定額、記錄花費", items:[
      "＋新增目標：金額、期限、要追蹤哪個帳戶或子帳戶；📍 可以釘選到總覽",
      "「分類」填一樣的名稱（例如短期／長期），同分類會合併成一個大框",
      "定期定額：固定金額，或「每月買幾股」自動用股價換算；還可以排「從某月起改成多少」",
      "💸 記錄花費：像一般記帳一樣填分類、說明、帳戶、日期，可以連續記好幾筆，下面會列出明細",
      "🎁 願望存滿後可以按「記錄購買」",
      "💰 這個月多存的錢：直接從某個帳戶轉進目標連結的帳戶",
    ]},
    { key:"alloc", icon:"🧠", title:"智慧分流", sub:"收入 → 投資、生活費、目標、剩餘", items:[
      "照三步走：① 填這個月的收入 ② 看錢怎麼分 ③ 選月份按「套用」",
      "最上面的色條一眼看出錢分去哪：投資、生活費、目標、剩餘",
      "生活費改了會存成那個月的預算，總覽的生活水位跟著變；按「恢復自動」回到平均值",
      "目標依優先級（P1 最先）分配，分不完的就是剩餘，可以指定存到哪個子帳戶",
      "套用只會設定存錢提醒，不會自動幫你轉帳",
      "最下面「⚙️ 預設值」：沒特別設定的月份會用的收入、生活費上限、投資額、從哪個月開始規劃",
    ]},
    { key:"forecast", icon:"📅", title:"年度預測", sub:"未來 12 個月的錢怎麼走", items:[
      "從智慧分流最下面「年度預測 →」進入",
      "每個月一列，色條是固定支出（橘）、存進目標（紫）、剩餘（綠）",
      "點一個月可以改那個月的收入來源和固定支出；手動改過的可以「恢復自動」",
      "下面是各目標每月存多少：🔁 定期定額（改了會從那個月起都改）、🧠 已套用（只改那個月）",
      "已經過去的月份用實際記帳的收入；之後的月份參考去年同月，沒有資料就用預設值",
    ]},
    { key:"strategy", icon:"📚", title:"理財策略", sub:"緊急預備金、50/30/20、零基預算", items:[
      "在「更多」頁，或圖表頁 50/30/20 卡片右上角",
      "緊急預備金可以一鍵用「生活費 × 3 或 6 個月」建立目標",
    ]},
  ]},
  { title:"投資", sections:[
    { key:"invest", icon:"📈", title:"投資追蹤", sub:"持股、報價、每日波動、自選股", items:[
      "第一次用：按右上角「📋 登錄現有持股」輸入目前的股票（代號不用加 .TW）",
      "之後買進、賣出都用投資頁最上面的「＋ 買入」「− 賣出」，賣出時可以選要賣哪一檔",
      "報價：台股（上市、上櫃、ETF）和美股全部自動抓得到，不用另外設定",
      "每個交易日下午 1:50 左右更新收盤價；按「🔄 更新報價」會即時查一次",
      "每日投資波動：每天投資組合賺賠多少的柱狀圖（含已實現損益，換算台幣），從開始使用那天起累積",
      "自選股分台股、美股兩區，點一支可以看走勢圖",
      "買賣時可以標記當下心態，「績效」分頁會統計不同心態的勝率",
      "追高、部位太重、達到停損時會跳提醒",
    ]},
  ]},
  { title:"分析", sections:[
    { key:"charts", icon:"📉", title:"圖表", sub:"50/30/20、支出分類、資產成長", items:[
      "這頁的月份切換跟總覽分開；也可以點 📅 選任意日期區間",
      "50/30/20：這個月需要／想要／儲蓄各佔多少，直線是建議比例",
      "圓餅圖：點一個分類，展開看這個分類的每一筆",
      "收支健康度：儲蓄率、支出佔比、訂閱月費",
      "資產成長：每天的資產水位，或每期變動",
    ]},
  ]},
  { title:"帳號與設定", sections:[
    { key:"account", icon:"👤", title:"登入與同步", sub:"多台裝置共用同一份資料", items:[
      "到「更多 → 帳戶」用 Google 或信箱＋密碼登入；手機、電腦用同一個帳號就會同步",
      "兩台都開著也沒關係：一台記的帳，另一台會即時出現，不會互相蓋掉",
      "沒網路時記的帳，連上網路後會自動合併上去",
      "匿名登入沒有帳號密碼，換裝置就找不回來，不建議",
      "隱藏金額：開了之後數字先模糊，點一下顯示 3 秒，適合在外面打開",
    ]},
    { key:"settings", icon:"☰", title:"更多・設定", sub:"主題、語言、類別、備份、AI 顧問", items:[
      "外觀主題、語言、類別管理（改名稱和 emoji、新增類別）",
      "📤 匯出備份存成檔案，📥 匯入可以還原；換手機前建議先匯出一份",
      "🗑 清空會連續確認三次；有登入的話雲端那份也會一起清掉",
      "🤖 AI 理財顧問會參考你的資料回答問題，不會改你的資料；免費額度一天約 20 次",
      "加到主畫面：Safari → 分享 → 加入主畫面，用起來就像 App",
    ]},
  ]},
];

const FAQ = [
  { q:"帳戶餘額沒有變？", a:"記帳時要選帳戶，餘額才會跟著改。" },
  { q:"股價沒出現或不是最新的？", a:"報價每個交易日下午更新一次；要看當下價格，到投資頁按「🔄 更新報價」。" },
  { q:"總覽的生活費預算從哪來？", a:"智慧分流裡這個月設定的生活費；沒設定就用近幾個月平均或預設值。" },
  { q:"別人還錢為什麼不算收入？", a:"那本來就是你的錢，只是拿回來。" },
  { q:"代墊後支出變少了？", a:"幫別人付的那份是借出去的錢，不是你的支出，只算你自己那份。" },
  { q:"刪錯東西怎麼辦？", a:"刪除或修改後 6 秒內，畫面下方有「↩️ 復原」。" },
  { q:"為什麼支出是綠色、收入是紅色？", a:"照台灣股市「漲紅跌綠」的習慣。" },
];

/* ── 使用手冊：獨立一頁，跟外觀主題、理財策略一樣從「更多」點進來 ── */
export default function UserGuidePage({ tab, setTab, C, tr }) {
  const [open, setOpen] = useState({});
  const [q, setQ] = useState("");
  if (tab !== "userGuide") return null;

  const query = q.trim().toLowerCase();
  const match = (t) => !query || tr(t).toLowerCase().includes(query);
  const groups = GUIDE_GROUPS.map(g => ({ ...g, sections: g.sections.map(sec => {
    const hitTitle = match(sec.title) || match(sec.sub);
    const items = query && !hitTitle ? sec.items.filter(match) : sec.items;
    return { ...sec, items, show: !query || hitTitle || items.length > 0 };
  }).filter(sec => sec.show) })).filter(g => g.sections.length > 0);
  const faq = FAQ.filter(f => match(f.q) || match(f.a));
  const nothing = query && groups.length === 0 && faq.length === 0;

  const groupTitle = (text) => <div style={{ fontSize:12, fontWeight:800, color:C.textSub, margin:"22px 2px 8px" }}>{text}</div>;

  return (
    <div>
      <div style={{ background:C.bg, padding:"12px 16px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTab("settings")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:18, padding:0, marginRight:4 }}>←</button>
          <span style={{ fontSize:18 }}>📖</span>
          <span style={{ fontWeight:900, fontSize:16, color:C.text }}>{tr("使用手冊")}</span>
        </div>
      </div>
      <div style={{ padding:"12px 16px", paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))" }}>
        {/* 搜尋：打關鍵字只顯示有提到的條目 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:14, background:C.card }}>
          <span style={{ fontSize:14, opacity:0.7 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr("搜尋，例如：代墊、子帳戶、報價")}
            style={{ flex:1, minWidth:0, background:"none", border:"none", outline:"none", color:C.text, fontSize:13 }} />
          {q && <button onClick={() => setQ("")} style={{ background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer", padding:0 }}>✕</button>}
        </div>

        {!query && <>
          {groupTitle(tr("快速上手"))}
          <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
            {QUICK_START.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderTop:i>0?`1px solid ${C.border}`:"none" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:`${C.accent}22`, color:C.accentL, fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i + 1}</div>
                <span style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{s.icon} {tr(s.text)}</span>
              </div>
            ))}
          </div>
        </>}

        {groups.map(g => (
          <div key={g.title}>
            {groupTitle(tr(g.title))}
            <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
              {g.sections.map((sec, i) => {
                const isOpen = !!query || !!open[sec.key];
                return (
                  <div key={sec.key} style={{ borderTop:i>0?`1px solid ${C.border}`:"none" }}>
                    <button onClick={() => setOpen(p => ({ ...p, [sec.key]: !p[sec.key] }))} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:32, height:32, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{sec.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{tr(sec.title)}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tr(sec.sub)}</div>
                      </div>
                      <span style={{ fontSize:12, color:C.muted, flexShrink:0, display:"inline-block", transform:isOpen?"rotate(90deg)":"none", transition:"transform .2s" }}>›</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding:"0 14px 14px 58px" }}>
                        {sec.items.map((it, k) => (
                          <div key={k} style={{ display:"flex", gap:8, padding:"4px 0" }}>
                            <span style={{ width:4, height:4, borderRadius:"50%", background:C.accentL, flexShrink:0, marginTop:8 }} />
                            <span style={{ fontSize:12.5, color:C.textSub, lineHeight:1.65 }}>{tr(it)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {faq.length > 0 && <>
          {groupTitle(tr("常見問題"))}
          <div style={{ borderRadius:16, background:C.card, overflow:"hidden" }}>
            {faq.map((f, i) => (
              <div key={f.q} style={{ padding:"12px 14px", borderTop:i>0?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{tr(f.q)}</div>
                <div style={{ fontSize:12.5, color:C.textSub, marginTop:3, lineHeight:1.6 }}>{tr(f.a)}</div>
              </div>
            ))}
          </div>
        </>}

        {nothing && <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>{tr("找不到相關說明")}</div>}
      </div>
    </div>
  );
}
