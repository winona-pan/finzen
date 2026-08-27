/* ══════════════════════════════════════════════════════
   多語系系統
   ══════════════════════════════════════════════════════
   目前涵蓋：底部導覽、App 常用按鈕、設定頁主要區塊標題、更多頁導覽卡片。
   還沒涵蓋：各頁面內部的詳細文字（例如智慧分流引擎、年度預測的所有說明文字）——
   這個 app 的中文字非常多，一次全部翻完 7 種語言風險很高（容易翻錯或漏翻），
   所以先把「框架」跟「最常看到的地方」做好，之後可以逐步擴充每一頁的翻譯。
   沒被翻譯到的文字會自動顯示繁體中文（不會空白、不會壞掉）。
   ══════════════════════════════════════════════════════ */

export const LANGUAGES = {
  zh: { name: "繁體中文", flag: "🇹🇼" },
  en: { name: "English", flag: "🇺🇸" },
  ja: { name: "日本語", flag: "🇯🇵" },
  ko: { name: "한국어", flag: "🇰🇷" },
  fr: { name: "Français", flag: "🇫🇷" },
  es: { name: "Español", flag: "🇪🇸" },
  de: { name: "Deutsch", flag: "🇩🇪" },
};

const T = {
  // ── 底部導覽 ──
  nav_overview: { zh:"總覽", en:"Overview", ja:"概要", ko:"개요", fr:"Aperçu", es:"Resumen", de:"Übersicht" },
  nav_wallet:   { zh:"錢包", en:"Wallet", ja:"財布", ko:"지갑", fr:"Portefeuille", es:"Billetera", de:"Wallet" },
  nav_charts:   { zh:"圖表", en:"Charts", ja:"グラフ", ko:"차트", fr:"Graphiques", es:"Gráficos", de:"Diagramme" },
  nav_notes:    { zh:"往來帳", en:"IOUs", ja:"貸し借り", ko:"거래장부", fr:"Comptes", es:"Cuentas", de:"Konten" },
  nav_invest:   { zh:"投資", en:"Invest", ja:"投資", ko:"투자", fr:"Investir", es:"Invertir", de:"Investieren" },
  nav_more:     { zh:"更多", en:"More", ja:"その他", ko:"더보기", fr:"Plus", es:"Más", de:"Mehr" },
  nav_goals:    { zh:"目標", en:"Goals", ja:"目標", ko:"목표", fr:"Objectifs", es:"Metas", de:"Ziele" },
  nav_subs:     { zh:"訂閱", en:"Subscriptions", ja:"サブスク", ko:"구독", fr:"Abonnements", es:"Suscripciones", de:"Abos" },
  nav_settings: { zh:"設定", en:"Settings", ja:"設定", ko:"설정", fr:"Paramètres", es:"Ajustes", de:"Einstellungen" },

  // ── 常用動作 ──
  act_confirm: { zh:"確定", en:"Confirm", ja:"確定", ko:"확인", fr:"Confirmer", es:"Confirmar", de:"Bestätigen" },
  act_cancel:  { zh:"取消", en:"Cancel", ja:"キャンセル", ko:"취소", fr:"Annuler", es:"Cancelar", de:"Abbrechen" },
  act_save:    { zh:"儲存", en:"Save", ja:"保存", ko:"저장", fr:"Enregistrer", es:"Guardar", de:"Speichern" },
  act_add:     { zh:"新增", en:"Add", ja:"追加", ko:"추가", fr:"Ajouter", es:"Añadir", de:"Hinzufügen" },
  act_edit:    { zh:"編輯", en:"Edit", ja:"編集", ko:"편집", fr:"Modifier", es:"Editar", de:"Bearbeiten" },
  act_delete:  { zh:"刪除", en:"Delete", ja:"削除", ko:"삭제", fr:"Supprimer", es:"Eliminar", de:"Löschen" },
  act_close:   { zh:"關閉", en:"Close", ja:"閉じる", ko:"닫기", fr:"Fermer", es:"Cerrar", de:"Schließen" },

  // ── App 名稱 / 更多頁 ──
  app_name: { zh:"FinZen 財務管理", en:"FinZen Finance", ja:"FinZen 家計管理", ko:"FinZen 자산관리", fr:"FinZen Finances", es:"FinZen Finanzas", de:"FinZen Finanzen" },
  more_title: { zh:"更多", en:"More", ja:"その他", ko:"더보기", fr:"Plus", es:"Más", de:"Mehr" },
  more_goals_card: { zh:"存錢目標", en:"Savings Goals", ja:"貯金目標", ko:"저축 목표", fr:"Objectifs d'épargne", es:"Metas de ahorro", de:"Sparziele" },
  more_subs_card: { zh:"訂閱與帳單", en:"Subscriptions & Bills", ja:"サブスクと請求", ko:"구독 및 청구서", fr:"Abonnements et factures", es:"Suscripciones y facturas", de:"Abos & Rechnungen" },
  settings_theme: { zh:"外觀主題", en:"Theme", ja:"テーマ", ko:"테마", fr:"Thème", es:"Tema", de:"Design" },
  settings_account: { zh:"帳戶", en:"Account", ja:"アカウント", ko:"계정", fr:"Compte", es:"Cuenta", de:"Konto" },
  settings_language: { zh:"語言", en:"Language", ja:"言語", ko:"언어", fr:"Langue", es:"Idioma", de:"Sprache" },
  settings_about: { zh:"關於", en:"About", ja:"アプリについて", ko:"정보", fr:"À propos", es:"Acerca de", de:"Über" },
};

/* t(key, lang)：查不到翻譯就自動退回繁體中文，不會顯示 undefined 或壞掉 */
export function t(key, lang) {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] || entry.zh || key;
}

export function makeT(lang) {
  return (key) => t(key, lang);
}
