/* ══════════════════════════════════════════════════════
   畫面文字翻譯層
   ══════════════════════════════════════════════════════
   程式裡的中文很多是寫在資料陣列、說明文字、組字串裡，一個一個包 tr() 會漏很多。
   所以改成在「畫到畫面上」那一刻統一翻譯：vite.config.js 讓 src/ 底下的 JSX 都經過 i18nJsx*.js，
   這裡把元素的文字內容和 placeholder／title 等屬性丟進字典翻譯。
   - 只翻「整段完全對得上」的文字，或符合句型（例如「再 3 個月」）的文字；
     使用者自己輸入的內容（備註、帳戶名稱）字典裡不會有，會原樣顯示，不會被亂翻
   - 不會碰 value、key、程式裡拿來比對的字串，所以「帳戶調整」這類內部用的中文照常運作
   ══════════════════════════════════════════════════════ */
import { t } from "./i18n";

let currentLang = "zh";
export function setRuntimeLang(lang) { currentLang = lang || "zh"; }
export function getRuntimeLang() { return currentLang; }

const CJK = /[一-鿿]/;
const cache = new Map();

/* 一段文字翻成目前語言；查不到就原樣回傳 */
export function translateText(str) {
  if (currentLang === "zh" || typeof str !== "string" || !CJK.test(str)) return str;
  const k = currentLang + "\u0000" + str;
  if (cache.has(k)) return cache.get(k);
  // 前後空白保留，只翻中間
  const m = str.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const out = m[1] + t(m[2], currentLang) + m[3];
  if (cache.size > 5000) cache.clear();
  cache.set(k, out);
  return out;
}

/* 中文「3個月」數字跟單位黏在一起沒問題，英文要「3 months」：
   翻出來的英文前後如果緊貼著數字或英文字，補一個空格；前面是 1 就用單數 */
const SINGULAR = { months:"month", days:"day", entries:"entry", shares:"share", years:"year", times:"time", stocks:"stock", items:"item", weeks:"week" };
const endsWord = (x) => (typeof x === "number" && isFinite(x)) || (typeof x === "string" && /[0-9A-Za-z%)]$/.test(x));
const startsWord = (x) => (typeof x === "number" && isFinite(x)) || (typeof x === "string" && /^[0-9A-Za-z(]/.test(x));
function spaceAround(v, prev, nxt) {
  if (!v) return v;
  const one = prev === 1 || prev === "1" || (typeof prev === "string" && /(^|[^0-9.,])1\s*$/.test(prev));
  const w = v.match(/^(\s*)([A-Za-z]+)(.*)$/s);
  if (w && one && SINGULAR[w[2]]) v = w[1] + SINGULAR[w[2]] + w[3];
  if (/^[A-Za-z(]/.test(v) && endsWord(prev)) v = " " + v;
  if (/[A-Za-z)]$/.test(v) && startsWord(nxt)) v = v + " ";
  return v;
}

const ATTRS = ["placeholder", "title", "aria-label", "alt"];

function translateChildren(children) {
  if (typeof children === "string") return translateText(children);
  if (!Array.isArray(children)) return children;
  // 「再」{3}「個月」這種拆開的字串：先試著整句一起翻（英文語順不一樣），翻不了再一段一段翻
  if (children.length > 1 && children.every(c => typeof c === "string" || typeof c === "number") && children.some(c => typeof c === "string" && CJK.test(c))) {
    const joined = children.join("");
    const whole = translateText(joined);
    if (whole !== joined && !CJK.test(whole)) return whole;
  }
  let changed = false;
  const next = children.map((c, i) => {
    if (typeof c !== "string") return c;
    let v = translateText(c);
    if (v !== c && currentLang !== "zh") v = spaceAround(v, children[i - 1], children[i + 1]);
    if (v !== c) changed = true;
    return v;
  });
  return changed ? next : children;
}

export function translateProps(type, props) {
  if (currentLang === "zh" || !props) return props;
  let next = props;
  if (props.children !== undefined) {
    const ch = translateChildren(props.children);
    if (ch !== props.children) next = { ...next, children: ch };
  }
  if (typeof type === "string") {
    for (const a of ATTRS) {
      const v = props[a];
      if (typeof v === "string" && CJK.test(v)) {
        const tv = translateText(v);
        if (tv !== v) { if (next === props) next = { ...props }; next[a] = tv; }
      }
    }
  }
  return next;
}
