import { AppState } from '../types';
import { HTML_APP_STYLES } from './htmlGenerator/styles';
import { HTML_CHART_SCRIPTS } from './htmlGenerator/charts';
import { HTML_MODAL_AND_CORE_SCRIPTS } from './htmlGenerator/modals';

export function generateSingleFileHTML(currentState: AppState): string {
  const stateJson = JSON.stringify(currentState).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar" id="htmlRoot" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>D-Deli / بوتشرز — Food Cost & Inventory Control V3</title>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${HTML_APP_STYLES}
</style>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
</head>
<body>

<!-- Login Modal -->
<div id="login">
 <div class="login-box">
  <h2>🍽️ D-Deli / بوتشرز</h2>
  <div class="sub" id="loginSub">Food Cost • Inventory • Production • Audit</div>
  <div class="lang-selector">
    <button type="button" class="lang-btn active" onclick="switchLang('ar')">العربية 🇸🇦</button>
    <button type="button" class="lang-btn" onclick="switchLang('en')">English 🇬🇧</button>
    <button type="button" class="lang-btn" onclick="switchLang('fr')">Français 🇫🇷</button>
  </div>
  <input type="text" id="lu" placeholder="اسم المستخدم / Username" autocomplete="username">
  <input type="password" id="lp" placeholder="كلمة المرور / Password" autocomplete="current-password">
  <div class="login-err" id="lerr"></div>
  <button type="button" class="login-btn" id="loginBtn" onclick="doLogin()">تسجيل الدخول / Sign In</button>
  <div class="demo-users">
    <div class="title" id="demoTitle">حسابات تجريبية سريعة</div>
    <div class="demo-pills">
      <button type="button" class="demo-pill" onclick="quickFill('admin','123')">👑 Admin</button>
      <button type="button" class="demo-pill" onclick="quickFill('manager','1234')">💼 Manager</button>
      <button type="button" class="demo-pill" onclick="quickFill('kitchen','1234')">🍳 Kitchen</button>
      <button type="button" class="demo-pill" onclick="quickFill('purchasing','1234')">🛒 Purchasing</button>
      <button type="button" class="demo-pill" onclick="quickFill('viewer','1234')">👀 Viewer</button>
    </div>
  </div>
 </div>
</div>

<!-- Main App -->
<div id="appx" style="display:none">
<header>
 <h1><span>🍽️</span> <span id="hdrTitle">D-Deli / بوتشرز — Food Cost & Inventory Control V3</span></h1>
 <div class="header-actions">
  <div class="user-badge" id="activeUserBadge">👤 Admin</div>
  <div class="lang-selector" style="margin:0">
    <button type="button" class="lang-btn active" id="btnLangAr" onclick="switchLang('ar')">عربي</button>
    <button type="button" class="lang-btn" id="btnLangEn" onclick="switchLang('en')">EN</button>
    <button type="button" class="lang-btn" id="btnLangFr" onclick="switchLang('fr')">FR</button>
  </div>
  <button type="button" class="hbtn" id="btnThemeToggle" onclick="toggleTheme()" title="الوضع الليلي / Dark Mode">🌙 <span id="lblTheme">ليلي</span></button>
  <button type="button" class="hbtn purple" onclick="openPrintModal()" title="مركز الطباعة الحرارية و A4">🖨️ <span id="lblPrint">طباعة و POS</span></button>
  <button type="button" class="hbtn amber" onclick="openImportModal()" title="استيراد فواتير وجرد من Excel">📥 <span id="lblImpExcel">استيراد Excel</span></button>
  <button type="button" class="hbtn prim" onclick="exportMultiSheetXLSX()" title="تصدير شيت إكسيل شامل">📊 <span id="lblExpExcel">تصدير Excel</span></button>
  <button type="button" class="hbtn" style="background:#0284c7;border-color:#38bdf8" onclick="openSyncModal()" title="مزامنة سحابية">☁️ <span id="lblSync">مزامنة</span></button>
  <button class="hbtn grn" onclick="saveNow(true)">💾 <span id="lblSave">حفظ</span></button>
  <button class="hbtn" onclick="exportJSON()">⬇ <span id="lblExport">JSON</span></button>
  <button class="hbtn" onclick="document.getElementById('impf').click()">⬆ <span id="lblImport">استيراد</span></button>
  <input type="file" id="impf" accept=".json" style="display:none" onchange="importJSON(this)">
  <button class="hbtn red" onclick="logout()">🚪 <span id="lblLogout">خروج</span></button>
 </div>
</header>
<nav id="nav"></nav>
<main id="app"></main>
</div>

<div id="printArea"></div>
<div id="toast" class="toast"></div>

<script>
${HTML_CHART_SCRIPTS}
${HTML_MODAL_AND_CORE_SCRIPTS}

// Initial embedded state
let S = ${stateJson};
let currentLang = S.settings?.language || "ar";

const T_DICT = {
  ar: {
    app_title: "🍽️ D-Deli / بوتشرز — Food Cost & Inventory Control V3",
    login_btn: "تسجيل الدخول",
    save_btn: "حفظ",
    saved_msg: "✓ تم الحفظ بنجاح",
    tab_dash: "📊 لوحة التحكم",
    tab_sales: "🧾 المبيعات",
    tab_recipes: "📖 الوصفات و BOM",
    tab_ideal: "🧮 الاستهلاك النظري",
    tab_moves: "📦 الحركة اليومية",
    tab_ledger: "📒 سجل حركة المخزون",
    tab_summary: "⚖️ الملخص والفروقات",
    tab_par: "🛒 الحاجات وإعادة الطلب",
    tab_prep: "🏭 التصنيع والتحضير",
    tab_forecast: "🎯 تخطيط الطلبيات (MRP)",
    tab_menu_eng: "⭐ تحليل هندسة المنيو",
    tab_expenses: "💰 المصروفات والتقرير المالي",
    tab_users: "👥 المستخدمون والصلاحيات",
    tab_audit: "🕵️ سجل التدقيق",
    tab_help: "❓ دليل الاستخدام",
    kpi_sales: "إجمالي المبيعات",
    kpi_ideal: "التكلفة النظرية",
    kpi_foodcost: "Food Cost %",
    kpi_stock: "قيمة المخزون الختامي",
    kpi_waste: "تكلفة الهالك",
    kpi_var: "فرق التكلفة (Variance)",
    kpi_over: "أصناف Over Consumption",
    kpi_norecipe: "مبيعات بلا وصفة",
    kpi_expenses: "إجمالي المصروفات",
    kpi_food_expenses: "مشتريات خامات ومخزون",
    kpi_oper_expenses: "مصروفات عامة وتشغيل",
    cur_unit: "ج.م"
  },
  en: {
    app_title: "🍽️ D-Deli / Butchers — Food Cost & Inventory Control V3",
    login_btn: "Sign In",
    save_btn: "Save",
    saved_msg: "✓ Saved successfully",
    tab_dash: "📊 Dashboard",
    tab_sales: "🧾 Sales",
    tab_recipes: "📖 Recipes & BOM",
    tab_ideal: "🧮 Theoretical Usage",
    tab_moves: "📦 Daily Movements",
    tab_ledger: "📒 Inventory Ledger",
    tab_summary: "⚖️ Summary & Variance",
    tab_par: "🛒 Par & Reorder",
    tab_prep: "🏭 Production & Prep",
    tab_forecast: "🎯 MRP Forecast",
    tab_menu_eng: "⭐ Menu Engineering",
    tab_expenses: "💰 Expenses & Finance",
    tab_users: "👥 Users & Roles",
    tab_audit: "🕵️ Audit Trail",
    tab_help: "❓ User Manual",
    kpi_sales: "Total Sales",
    kpi_ideal: "Theoretical Cost",
    kpi_foodcost: "Food Cost %",
    kpi_stock: "Ending Stock Value",
    kpi_waste: "Waste Cost",
    kpi_var: "Cost Variance",
    kpi_over: "Over-Consumption Items",
    kpi_norecipe: "Sales Without Recipe",
    kpi_expenses: "Total Expenses",
    kpi_food_expenses: "Food & Stock Purchases",
    kpi_oper_expenses: "Operating & Overhead",
    cur_unit: "EGP"
  },
  fr: {
    app_title: "🍽️ D-Deli / Boucherie — Food Cost & Contrôle des Stocks",
    login_btn: "Se connecter",
    save_btn: "Enregistrer",
    saved_msg: "✓ Enregistré avec succès",
    tab_dash: "📊 Tableau de bord",
    tab_sales: "🧾 Ventes",
    tab_recipes: "📖 Fiches Recettes",
    tab_ideal: "🧮 Conso. Théorique",
    tab_moves: "📦 Mouvements journaliers",
    tab_ledger: "📒 Journal des Stocks",
    tab_summary: "⚖️ Récapitulatif & Écarts",
    tab_par: "🛒 Stock Par & Réassort",
    tab_prep: "🏭 Production & Préparation",
    tab_forecast: "🎯 Planification MRP",
    tab_menu_eng: "⭐ Menu Engineering",
    tab_expenses: "💰 Dépenses & Finances",
    tab_users: "👥 Utilisateurs & Rôles",
    tab_audit: "🕵️ Journal d'audit",
    tab_help: "❓ Guide d'utilisation",
    kpi_sales: "Ventes Totales",
    kpi_ideal: "Coût Théorique",
    kpi_foodcost: "Food Cost %",
    kpi_stock: "Valeur Stock Final",
    kpi_waste: "Coût des Pertes",
    kpi_var: "Écart de Coût",
    kpi_over: "Articles en Surconso.",
    kpi_norecipe: "Ventes sans recette",
    kpi_expenses: "Dépenses Totales",
    kpi_food_expenses: "Achats alimentaires",
    kpi_oper_expenses: "Charges d'exploitation",
    cur_unit: "EGP"
  }
};

const CATS = ["لحوم ومصنوعات","دواجن وأسماك","أجبان وألبان وبيض","خضروات وفواكه","خبوزات ونشويات","صوصات ومخللات","زيوت وبهارات وأساسيات","مخبوزات وحلويات جاهزة"];
const CATC = ["#fee2e2","#e0f2fe","#f3e8ff","#dcfce7","#ffedd5","#fef3c7","#fef9c3","#fce7f3"];
const TYPES = {recv:"استلام",tin:"تحويل داخل",tout:"تحويل خارج",waste:"هالك",production_in:"إنتاج",production_consume:"استهلاك تصنيع"};
const ROLE_PERMS = {
 admin:{view:true,write_sales:true,write_recipes:true,write_inventory:true,write_production:true,manage_users:true,view_audit:true,export:true},
 manager:{view:true,write_sales:true,write_recipes:true,write_inventory:true,write_production:true,manage_users:false,view_audit:true,export:true},
 kitchen:{view:true,write_sales:false,write_recipes:false,write_inventory:true,write_production:true,manage_users:false,view_audit:false,export:true},
 purchasing:{view:true,write_sales:false,write_recipes:false,write_inventory:true,write_production:false,manage_users:false,view_audit:false,export:true},
 viewer:{view:true,write_sales:false,write_recipes:false,write_inventory:false,write_production:false,manage_users:false,view_audit:false,export:true}
};

const uid = (p="ID") => p+"-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const nf = (n, d=2) => { const dd = Math.max(0, Math.min(20, Math.floor(num(d)))); return num(n).toLocaleString("en-US", { maximumFractionDigits: dd, minimumFractionDigits: 0 }); };
const money = (n, d=2) => { const dd = Math.max(0, Math.min(20, Math.floor(num(d)))); return num(n).toLocaleString("en-US", { maximumFractionDigits: dd, minimumFractionDigits: Math.min(dd, 2) }); };
const esc = s => String(s??"").replace(/[&<>\"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const dateDiff = (a,b) => Math.max(1, Math.floor((new Date(b+"T00:00:00") - new Date(a+"T00:00:00"))/86400000)+1);
const periodDays = () => dateDiff(S.dFrom, S.dTo);

function toast(m){
  const e = document.getElementById("toast");
  if(!e)return;
  e.textContent=m;
  e.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>e.classList.remove("show"),2000);
}

function t(key){ return (T_DICT[currentLang] && T_DICT[currentLang][key]) || T_DICT.ar[key] || key; }

function switchLang(l){
  currentLang = l;
  S.settings.language = l;
  const root = document.getElementById("htmlRoot");
  if(l === "ar"){
    root.setAttribute("dir", "rtl");
    root.setAttribute("lang", "ar");
  } else {
    root.setAttribute("dir", "ltr");
    root.setAttribute("lang", l);
  }
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.classList.remove("active");
    if(b.textContent.toLowerCase().includes(l) || b.id.toLowerCase().includes(l)) b.classList.add("active");
  });
  document.getElementById("hdrTitle").textContent = t("app_title");
  document.getElementById("loginBtn").textContent = t("login_btn");
  save();
  renderNav();
  renderTab();
}

let me = null;
function userCan(a){ return !!(me && ROLE_PERMS[me.role]?.[a]); }

function quickFill(u, p){
  document.getElementById("lu").value = u;
  document.getElementById("lp").value = p;
  doLogin();
}

function doLogin(){
  const u = document.getElementById("lu").value.trim(), p = document.getElementById("lp").value;
  const found = S.users.find(x => x.username === u && x.password === p && x.active);
  if(found){
    me = found;
    sessionStorage.setItem("ddeli_user", found.username);
    document.getElementById("login").style.display = "none";
    document.getElementById("appx").style.display = "";
    document.getElementById("activeUserBadge").textContent = "👤 " + found.name + " (" + found.role + ")";
    audit("login", "تسجيل دخول ناجح");
    renderNav();
    renderTab();
  } else {
    document.getElementById("lerr").textContent = "❌ بيانات الدخول غير صحيحة أو الحساب معطل";
  }
}

function logout(){
  if(confirm("تسجيل الخروج؟")){
    audit("logout", "تسجيل الخروج");
    sessionStorage.removeItem("ddeli_user");
    location.reload();
  }
}

function saveNow(show=false){ save(); if(show) toast(t("saved_msg")); }
function save(){ localStorage.setItem("ddeli_html_v3", JSON.stringify(S)); }
function audit(action, details){
  S.audit.unshift({ id: uid("AUD"), at: new Date().toISOString(), user: me?.username||"system", action, details });
  S.audit = S.audit.slice(0, 3000);
  save();
}

function ledgerInPeriod(){ return S.ledger.filter(x => x.date >= S.dFrom && x.date <= S.dTo); }
function ledgerTotals(){
  const im = new Map(S.ing.map((g,i)=>[g.id,i]));
  const out = { recv: Array(S.ing.length).fill(0), tin: Array(S.ing.length).fill(0), tout: Array(S.ing.length).fill(0), waste: Array(S.ing.length).fill(0), production_in: Array(S.ing.length).fill(0), production_consume: Array(S.ing.length).fill(0) };
  ledgerInPeriod().forEach(x => {
    const i = im.get(x.ingredientId);
    if(i != null && out[x.type]) out[x.type][i] += num(x.qty);
  });
  return out;
}

function compute(){
  const im = new Map(S.ing.map((g,i)=>[g.id,i])), rq = {};
  S.sales.forEach(s => { if(s.recipeId) rq[s.recipeId] = (rq[s.recipeId]||0) + num(s.qty); });
  const raw = Array(S.ing.length).fill(0);
  S.recipes.forEach(r => {
    // Exclude preparation sub-recipes from sales deduction
    const isPrepRecipe = r.code.startsWith('RCP-13') || 
                         r.code.startsWith('RCP-147') || 
                         r.code.startsWith('RCP-148') || 
                         r.code.startsWith('RCP-149') || 
                         r.code.startsWith('RCP-150') || 
                         r.code.startsWith('RCP-151') ||
                         r.name.includes('تصنيع') ||
                         r.name.includes('تجهيز') ||
                         r.name.includes('تتبيله صدور');
    if (isPrepRecipe) return;

    const q = rq[r.id]||0;
    if(!q) return;
    r.items.forEach(it => {
      const i = im.get(it.ingredientId);
      if(i != null) raw[i] += num(it.std)*q;
    });
  });
  const adj = raw.map((v,i) => v/(num(S.ing[i].yield)||1));
  const t = ledgerTotals();
  const actual = S.ing.map((_,i) => num(S.beg[i]) + t.recv[i] + t.tin[i] - t.tout[i] - t.waste[i] - num(S.end[i]));
  const vari = adj.map((v,i) => v - actual[i]);
  const cvar = vari.map((v,i) => v * num(S.ing[i].price));
  const salesTotal = S.sales.reduce((a,s) => a + num(s.qty)*num(s.price), 0);
  const idealCost = adj.reduce((a,v,i) => a + v*num(S.ing[i].price), 0);
  const wasteCost = t.waste.reduce((a,v,i) => a + v*num(S.ing[i].price), 0);
  return { rq, raw, adj, ...t, actual, vari, cvar, salesTotal, idealCost, varCost: cvar.reduce((a,b)=>a+b,0), wasteCost, negCount: vari.filter(v=>v<0).length, noRecipe: S.sales.filter(s=>num(s.qty)>0 && !s.recipeId).length, stockValue: S.end.reduce((a,v,i)=>a+num(v)*num(S.ing[i].price),0), days: periodDays() };
}

let Cc = compute();
let curTab = "dash";
const nav = document.getElementById("nav"), app = document.getElementById("app");

const TABS_DEF = [
  ["dash","tab_dash"],["sales","tab_sales"],["recipes","tab_recipes"],["ideal","tab_ideal"],["moves","tab_moves"],["ledger","tab_ledger"],["summary","tab_summary"],["par","tab_par"],["prep","tab_prep"],["forecast","tab_forecast"],["menu_eng","tab_menu_eng"],["expenses","tab_expenses"],["users","tab_users"],["audit","tab_audit"],["help","tab_help"]
];

function renderNav(){
  nav.innerHTML = "";
  TABS_DEF.forEach(([id, tKey]) => {
    if((id==="users" && !userCan("manage_users")) || (id==="audit" && !userCan("view_audit"))) return;
    const b = document.createElement("button");
    b.textContent = t(tKey);
    b.className = curTab === id ? "on" : "";
    b.onclick = () => { curTab = id; renderNav(); renderTab(); };
    nav.appendChild(b);
  });
}

function periodBar(){
  return \`<div class="toolbar"><span class="label">\${currentLang==='ar'?'الفترة:':'Period:'}</span><input id="fromDate" type="date" value="\${S.dFrom}"><span>→</span><input id="toDate" type="date" value="\${S.dTo}"><button class="hbtn grn" onclick="setPeriod()">\${currentLang==='ar'?'تطبيق الفترة':'Apply'}</button><span class="pill">\${periodDays()} \${currentLang==='ar'?'يوم':'Days'}</span></div>\`;
}

function setPeriod(){
  const f = document.getElementById("fromDate").value, tVal = document.getElementById("toDate").value;
  if(!f || !tVal || f > tVal){ toast("⚠️ اختر فترة صحيحة"); return; }
  S.dFrom = f; S.dTo = tVal;
  save();
  renderTab();
}

function kpi(l, v, cls="", sub=""){
  return \`<div class="kpi"><div class="lbl">\${l}</div><div class="val \${cls}">\${v}</div>\${sub?\`<div style="font-size:10px;color:var(--mut);margin-top:4px">\${sub}</div>\`:""}</div>\`;
}

function renderTab(){
  Cc = compute();
  if(curTab==="dash") renderDash();
  else if(curTab==="sales") renderSales();
  else if(curTab==="recipes") renderRecipes();
  else if(curTab==="ideal") renderIdeal();
  else if(curTab==="moves") renderMoves();
  else if(curTab==="ledger") renderLedger();
  else if(curTab==="summary") renderSummary();
  else if(curTab==="par") renderPar();
  else if(curTab==="prep") renderPrep();
  else if(curTab==="forecast") renderForecast();
  else if(curTab==="menu_eng") renderMenuEng();
  else if(curTab==="expenses") renderExpenses();
  else if(curTab==="users") renderUsers();
  else if(curTab==="audit") renderAudit();
  else renderHelp();
}

function renderDash(){
  const fc = Cc.salesTotal ? (100 * Cc.idealCost / Cc.salesTotal) : 0;
  let h = periodBar() + \`<div class="kpis">
    \${kpi(t("kpi_sales"), money(Cc.salesTotal) + " " + t("cur_unit"))}
    \${kpi(t("kpi_ideal"), money(Cc.idealCost) + " " + t("cur_unit"))}
    \${kpi(t("kpi_foodcost"), fc ? nf(fc,1)+"%" : "—", fc>35?"warn":"ok")}
    \${kpi(t("kpi_stock"), money(Cc.stockValue) + " " + t("cur_unit"))}
    \${kpi(t("kpi_waste"), money(Cc.wasteCost) + " " + t("cur_unit"), Cc.wasteCost?"bad":"ok")}
    \${kpi(t("kpi_var"), money(Cc.varCost) + " " + t("cur_unit"), Cc.varCost<0?"bad":"ok")}
    \${kpi(t("kpi_over"), Cc.negCount, Cc.negCount?"bad":"ok")}
    \${kpi(t("kpi_norecipe"), Cc.noRecipe, Cc.noRecipe?"warn":"ok")}
  </div>\`;

  // Quick Action Bar
  h += \`<div class="toolbar" style="justify-content:space-between;background:var(--card);padding:12px;margin-bottom:16px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span class="label">⚡ \${currentLang==='ar'?'إجراءات سريعة:':'Quick Tools:'}</span>
      <button class="mini prn" onclick="openPrintModal('summary')">🖨️ \${currentLang==='ar'?'طباعة الملخص والجرد':'Print Summary & Count'}</button>
      <button class="mini exl" onclick="openImportModal('purchases')">📥 \${currentLang==='ar'?'استيراد فواتير مشتريات':'Import Purchases Excel'}</button>
      <button class="mini" style="color:#0284c7;border-color:#7dd3fc" onclick="openImportModal('inventory')">📥 \${currentLang==='ar'?'استيراد شيت جرد':'Import Inventory Sheet'}</button>
      <button class="mini" style="background:#0f172a;color:#fff;border-color:#0f172a" onclick="exportMultiSheetXLSX()">📊 \${currentLang==='ar'?'تصدير إكسيل متكامل':'Export Multi-Sheet Excel'}</button>
    </div>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="mini" onclick="openSyncModal()">☁️ \${currentLang==='ar'?'مزامنة الفروع':'Cloud Sync'}</button>
    </div>
  </div>\`;

  // Charts Section
  const donutSvg = generateDonutChartSVG();
  const barSvg = generateBarChartSVG();

  h += \`<div class="grid2" style="margin-bottom:16px">
    <div class="card" style="display:flex;flex-direction:column;align-items:center">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="margin:0">📊 \${currentLang==='ar'?'توزيع التكلفة حسب الأقسام':'Cost by Category'}</h3>
        <span class="pill" style="background:var(--bg)">Donut Chart</span>
      </div>
      \${donutSvg}
    </div>
    <div class="card" style="display:flex;flex-direction:column;align-items:center">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="margin:0">📈 \${currentLang==='ar'?'أعلى 7 خامات استهلاكاً بالقيمة':'Top 7 Cost Drivers'}</h3>
        <span class="pill" style="background:var(--bg)">Bar Chart</span>
      </div>
      \${barSvg}
    </div>
  </div>\`;

  const ranked = [...S.ing.keys()].sort((a,b) => Cc.cvar[a] - Cc.cvar[b]);
  h += \`<div class="grid2">
    <div class="card">
      <h3>🚨 Top 10 Over-Consumption</h3>
      <div class="tblwrap">
        <table>
          <thead><tr><th>#</th><th class="name">\${currentLang==='ar'?'المكون':'Ingredient'}</th><th>ID</th><th>\${currentLang==='ar'?'الفرق':'Variance'}</th><th>\${currentLang==='ar'?'التكلفة':'Cost'}</th></tr></thead>
          <tbody>\`;
  ranked.filter(i => Cc.vari[i] < 0).slice(0, 10).forEach((i, k) => {
    h += \`<tr><td>\${k+1}</td><td class="name">\${esc(S.ing[i].name)}</td><td class="idcell">\${S.ing[i].id}</td><td class="neg">\${nf(Cc.vari[i])}</td><td class="neg">\${money(Cc.cvar[i])}</td></tr>\`;
  });
  h += \`</tbody></table></div></div>
    <div class="card">
      <h3>📌 \${currentLang==='ar'?'مؤشرات تشغيلية':'Operational Metrics'}</h3>
      <table>
        <tbody>
          <tr><td>\${currentLang==='ar'?'عدد المكونات':'Total Ingredients'}</td><td><b>\${S.ing.length}</b></td></tr>
          <tr><td>\${currentLang==='ar'?'عدد الوصفات':'Total Recipes'}</td><td><b>\${S.recipes.length}</b></td></tr>
          <tr><td>\${currentLang==='ar'?'حركات الفترة':'Period Movements'}</td><td><b>\${ledgerInPeriod().length}</b></td></tr>
          <tr><td>\${currentLang==='ar'?'إجمالي الإنتاج الداخلي':'Total Prod In'}</td><td><b>\${nf(Cc.production_in.reduce((a,b)=>a+b,0))}</b></td></tr>
          <tr><td>\${currentLang==='ar'?'استهلاك التصنيع':'Total Prod Consume'}</td><td><b>\${nf(Cc.production_consume.reduce((a,b)=>a+b,0))}</b></td></tr>
          <tr><td>\${currentLang==='ar'?'عدد أيام الفترة':'Period Days'}</td><td><b>\${Cc.days}</b></td></tr>
        </tbody>
      </table>
    </div>
  </div>\`;
  app.innerHTML = h;
}

function filterSalesRows(query){
  const q = (query||"").toLowerCase().trim();
  const rows = document.querySelectorAll("#salesTable tbody tr");
  rows.forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = (!q || text.includes(q)) ? "" : "none";
  });
}

function renderSales(){
  let h = periodBar() + \`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <h3 style="margin:0">🧾 \${currentLang==='ar'?'المبيعات وقائمة الأصناف':'Sales & Menu Items'}</h3>
      <div style="display:flex;gap:6px">
        <button class="mini exl" onclick="exportXLSX()">📊 Excel</button>
      </div>
    </div>

    <!-- Instant Search Toolbar -->
    <div class="toolbar" style="margin-bottom:12px;background:#f8fafc;padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="label">🔍 \${currentLang==='ar'?'بحث فوري في المبيعات:':'Instant Sales Filter:'}</span>
      <input type="text" id="salesSearchInput" placeholder="\${currentLang==='ar'?'ابحث بالاسم، الكود SKU، المجموعة، أو الوصفة...':'Filter sales items...'}" oninput="filterSalesRows(this.value)" style="flex:1;min-width:200px">
      <button class="mini" onclick="document.getElementById('salesSearchInput').value='';filterSalesRows('')">\${currentLang==='ar'?'مسح':'Clear'}</button>
    </div>

    <div class="tblwrap"><table id="salesTable"><thead><tr><th>#</th><th>SKU</th><th class="name">\${currentLang==='ar'?'الصنف':'Item'}</th><th>\${currentLang==='ar'?'المجموعة':'Group'}</th><th>\${currentLang==='ar'?'الكمية':'Qty'}</th><th>\${currentLang==='ar'?'السعر':'Price'}</th><th>\${currentLang==='ar'?'الإجمالي':'Total'}</th><th>\${currentLang==='ar'?'الوصفة المرتبطة':'Recipe Link'}</th></tr></thead><tbody>\`;
  let tq=0, tt=0;
  S.sales.forEach((x, i) => {
    const t = num(x.qty)*num(x.price);
    tq += num(x.qty); tt += t;
    const dis = userCan("write_sales") ? "" : "disabled";
    h += \`<tr><td>\${i+1}</td><td><input \${dis} data-k="sCode" data-i="\${i}" value="\${esc(x.code)}"></td><td class="name"><input \${dis} data-k="sName" data-i="\${i}" class="wide" value="\${esc(x.name)}"></td><td><input \${dis} data-k="sGrp" data-i="\${i}" value="\${esc(x.group)}"></td><td><input \${dis} type="number" class="ed" data-k="sQty" data-i="\${i}" value="\${x.qty}"></td><td><input \${dis} type="number" step="0.01" class="ed" data-k="sPrice" data-i="\${i}" value="\${x.price}"></td><td>\${money(t)}</td><td><select \${dis} data-k="sRec" data-i="\${i}"><option value="">—</option>\${S.recipes.map(r=>\`<option value="\${r.id}" \${r.id===x.recipeId?"selected":""}>\${esc(r.code)} - \${esc(r.name)}</option>\`).join("")}</select></td></tr>\`;
  });
  h += \`</tbody><tfoot><tr class="tot"><td colspan="4">\${currentLang==='ar'?'الإجمالي':'Total'}</td><td>\${nf(tq,0)}</td><td></td><td>\${money(tt)}</td><td></td></tr></tfoot></table></div></div>\`;
  app.innerHTML = h;
}

function recipeOne(r){
  const im = new Map(S.ing.map((g,i)=>[g.id,i]));
  return r.items.reduce((a, it) => {
    const i = im.get(it.ingredientId);
    return a + (i!=null ? num(it.std)*num(S.ing[i].price) : 0);
  }, 0);
}

function recipeSell(r){
  let p=0, q=0;
  S.sales.forEach(s => { if(s.recipeId===r.id){ p += num(s.price)*num(s.qty); q += num(s.qty); } });
  return q ? p/q : 0;
}

function renderRecipes(){
  let h = \`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>📖 \${currentLang==='ar'?'الوصفات و BOM':'Recipes & BOM'}</h3><div><button class="hbtn grn" \${userCan("write_recipes")?"":"disabled"} onclick="addRecipe()">＋ \${currentLang==='ar'?'وصفة جديدة':'New Recipe'}</button> <button class="hbtn" onclick="printAllRecipes()">🖨️ PDF</button></div></div><div class="tblwrap"><table><thead><tr><th>#</th><th>ID</th><th>Code</th><th class="name">\${currentLang==='ar'?'الوصفة':'Recipe'}</th><th>\${currentLang==='ar'?'المكونات':'Ingredients'}</th><th>\${currentLang==='ar'?'مباع':'Sold'}</th><th>\${currentLang==='ar'?'تكلفة الوحدة':'Unit Cost'}</th><th>Food Cost %</th><th>\${currentLang==='ar'?'إجراء':'Action'}</th></tr></thead><tbody>\`;
  S.recipes.forEach((r, i) => {
    const one = recipeOne(r), sell = recipeSell(r), q = Cc.rq[r.id]||0;
    h += \`<tr><td>\${i+1}</td><td class="idcell">\${r.id}</td><td>\${esc(r.code)}</td><td class="name"><input \${userCan("write_recipes")?"":"disabled"} data-k="rName" data-ri="\${i}" class="wide" value="\${esc(r.name)}"></td><td>\${r.items.length}</td><td>\${nf(q,0)}</td><td><b>\${money(one)}</b></td><td>\${sell?nf(one/sell*100,1)+"%":"—"}</td><td><button class="mini prn" onclick="printRecipe(\${i})">🖨️</button> <button class="mini red" \${userCan("write_recipes")?"":"disabled"} onclick="delRecipe(\${i})">🗑</button></td></tr>\`;
  });
  h += \`</tbody></table></div></div><div class="card"><h3>🔍 \${currentLang==='ar'?'تفاصيل ومكونات الوصفات':'Recipe Details'}</h3>\`;
  S.recipes.forEach((r, ri) => {
    const one = recipeOne(r);
    h += \`<div class="rcp"><div class="hd"><b>\${esc(r.code)}</b> <span class="idcell">\${r.id}</span> <input \${userCan("write_recipes")?"":"disabled"} class="nm" data-k="rName" data-ri="\${ri}" value="\${esc(r.name)}"> <span>\${currentLang==='ar'?'تكلفة الوحدة:':'Unit Cost:'} <b>\${money(one)}</b></span> <button class="mini prn" onclick="printRecipe(\${ri})">🖨️</button></div><table><thead><tr><th>#</th><th class="name">\${currentLang==='ar'?'المكون':'Ingredient'}</th><th>ID</th><th>\${currentLang==='ar'?'الوحدة':'Unit'}</th><th>\${currentLang==='ar'?'المعيار':'Std'}</th><th>\${currentLang==='ar'?'سعر الوحدة':'Unit Price'}</th><th>\${currentLang==='ar'?'التكلفة':'Cost'}</th><th></th></tr></thead><tbody>\`;
    r.items.forEach((it, ii) => {
      const g = S.ing.find(x => x.id === it.ingredientId);
      h += \`<tr><td>\${ii+1}</td><td class="name"><select \${userCan("write_recipes")?"":"disabled"} data-k="rIng" data-ri="\${ri}" data-ii="\${ii}">\${S.ing.map(g2=>\`<option value="\${g2.id}" \${g2.id===it.ingredientId?"selected":""}>\${esc(g2.name)}</option>\`).join("")}</select></td><td class="idcell">\${esc(it.ingredientId)}</td><td>\${g?esc(g.unit):""}</td><td><input \${userCan("write_recipes")?"":"disabled"} type="number" step="0.01" class="ed" data-k="rStd" data-ri="\${ri}" data-ii="\${ii}" value="\${it.std}"></td><td>\${g?money(g.price):"0.00"}</td><td><b>\${g?money(num(it.std)*num(g.price)):"0.00"}</b></td><td><button class="mini red" \${userCan("write_recipes")?"":"disabled"} onclick="delRItem(\${ri},\${ii})">✕</button></td></tr>\`;
    });
    h += \`</tbody><tfoot><tr class="tot"><td colspan="6">\${currentLang==='ar'?'إجمالي التكلفة':'Total Cost'}</td><td>\${money(one)}</td><td><button class="mini" \${userCan("write_recipes")?"":"disabled"} onclick="addRItem(\${ri})">＋</button></td></tr></tfoot></table></div>\`;
  });
  h += \`</div>\`;
  app.innerHTML = h;
}

function renderIdeal(){
  let h = periodBar() + \`<div class="card"><h3>🧮 \${currentLang==='ar'?'الاستهلاك النظري والمعدل':'Theoretical Usage & Yield'}</h3><div class="tblwrap"><table><thead><tr><th>#</th><th>ID</th><th class="name">\${currentLang==='ar'?'المكون':'Ingredient'}</th><th>\${currentLang==='ar'?'الوحدة':'Unit'}</th><th>\${currentLang==='ar'?'السعر':'Price'}</th><th>Yield %</th><th>\${currentLang==='ar'?'خام نظري':'Raw Theo'}</th><th>\${currentLang==='ar'?'معدل نظري':'Adj Theo'}</th><th>\${currentLang==='ar'?'التكلفة':'Cost'}</th></tr></thead><tbody>\`;
  S.ing.forEach((g, i) => {
    h += \`<tr><td>\${i+1}</td><td class="idcell">\${g.id}</td><td class="name">\${esc(g.name)}</td><td>\${g.unit}</td><td><input type="number" step="0.0001" class="ed" data-k="iPrice" data-i="\${i}" value="\${g.price}"></td><td><input type="number" min="0.01" max="1" step="0.01" class="ed" data-k="iYield" data-i="\${i}" value="\${g.yield}"></td><td>\${nf(Cc.raw[i])}</td><td>\${nf(Cc.adj[i])}</td><td>\${money(Cc.adj[i]*num(g.price))}</td></tr>\`;
  });
  h += \`</tbody><tfoot><tr class="tot"><td colspan="8">\${currentLang==='ar'?'الإجمالي':'Total'}</td><td>\${money(Cc.idealCost)}</td></tr></tfoot></table></div></div>\`;
  app.innerHTML = h;
}

let movesSubTab = "overview";
let movesSearch = "";
let movesCat = "ALL";

function setMovesSubTab(st){
  movesSubTab = st;
  renderMoves();
}

function renderMovesTableBody(){
  const tbody = document.getElementById("movesTbody");
  if(!tbody) return;
  const isAr = currentLang === 'ar';
  const canWrite = userCan("write_inventory");
  const q = (movesSearch||"").toLowerCase().trim();
  
  let html = "";
  S.ing.forEach((g, i) => {
    if(movesCat !== "ALL" && (g.category||"") !== movesCat) return;
    if(q && !g.name.toLowerCase().includes(q) && !g.id.toLowerCase().includes(q)) return;
    
    const totalIn = Cc.recv[i] + Cc.tin[i] + Cc.production_in[i];
    const totalOut = Cc.tout[i] + Cc.waste[i] + Cc.production_consume[i];
    const endStock = num(S.end[i] !== undefined && S.end[i] !== '' ? S.end[i] : (num(S.beg[i]) + totalIn - totalOut));
    const totalVal = endStock * num(g.price);
    
    html += \`<tr>
      <td>\${i+1}</td>
      <td class="idcell">\${g.id}</td>
      <td class="name"><b>\${esc(g.name)}</b></td>
      <td><span class="pill">\${esc(g.category||'—')}</span></td>
      <td>\${esc(g.unit)}</td>
      <td>\${money(g.price)}</td>
      <td>\${nf(S.beg[i])}</td>
      <td class="pos"><b>+\${nf(totalIn)}</b></td>
      <td class="neg"><b>-\${nf(totalOut)}</b></td>
      <td><b>\${nf(endStock)}</b></td>
      <td><b>\${money(totalVal)}</b></td>
      \${canWrite?\`<td><button class="mini" onclick="quickOpenSingle('\${g.id}')">＋</button></td>\`:''}
    </tr>\`;
  });
  
  tbody.innerHTML = html || \`<tr><td colspan="12" style="padding:20px;color:var(--mut)">\${isAr?'لا توجد أصناف مطابقة للبحث':'No matching items'}</td></tr>\`;
}

function quickOpenSingle(ingId){
  movesSubTab = 'single';
  renderMoves();
  setTimeout(() => {
    const sel = document.getElementById("txIng");
    if(sel) {
      sel.value = ingId;
      syncTxAutocompleteFromSelect(ingId);
    }
  }, 50);
}

function syncTxIngFromAutocomplete(val){
  const clean = (val||"").trim();
  if(!clean) return;
  let found = S.ing.find(g => clean.indexOf('[' + g.id + ']') !== -1 || g.id.toLowerCase() === clean.toLowerCase() || g.name.toLowerCase() === clean.toLowerCase());
  if(!found) {
    found = S.ing.find(g => g.name.toLowerCase().indexOf(clean.toLowerCase()) !== -1 || g.id.toLowerCase().indexOf(clean.toLowerCase()) !== -1);
  }
  if(found){
    const sel = document.getElementById("txIng");
    if(sel) sel.value = found.id;
  }
}

function syncTxAutocompleteFromSelect(id){
  const g = S.ing.find(x => x.id === id);
  const inp = document.getElementById("txIngAutocomplete");
  if(inp && g) inp.value = g.name + ' [' + g.id + ']';
}

function filterBatchRows(tableId, query){
  const q = (query||"").toLowerCase().trim();
  const rows = document.querySelectorAll(\`#\${tableId} tbody tr\`);
  rows.forEach(tr => {
    const txt = tr.textContent.toLowerCase();
    tr.style.display = (!q || txt.includes(q)) ? "" : "none";
  });
}

function filterBatchCategory(tableId, cat){
  const rows = document.querySelectorAll(\`#\${tableId} tbody tr\`);
  rows.forEach(tr => {
    const rcat = tr.getAttribute("data-cat") || "";
    tr.style.display = (cat === "ALL" || rcat === cat) ? "" : "none";
  });
}

function calcBatchTotals(type){
  const tableId = type === 'recv' ? 'batchRecvTable' : 'batchWasteTable';
  const rows = document.querySelectorAll(\`#\${tableId} tbody tr\`);
  let count = 0, totalQty = 0, totalVal = 0;
  
  rows.forEach(tr => {
    const qtyInp = tr.querySelector(".batch-qty-inp");
    const valCell = tr.querySelector(".batch-row-val");
    const priceCell = tr.querySelector("[data-price]");
    const price = num(priceCell?.getAttribute("data-price") || 0);
    const qty = num(qtyInp?.value);
    
    if(qty > 0){
      count++;
      totalQty += qty;
      const rowVal = qty * price;
      totalVal += rowVal;
      if(valCell) valCell.textContent = money(rowVal);
    } else {
      if(valCell) valCell.textContent = "—";
    }
  });
  
  const cntEl = document.getElementById(type === 'recv' ? 'batchRecvCount' : 'batchWasteCount');
  const qtyEl = document.getElementById(type === 'recv' ? 'batchRecvTotalQty' : 'batchWasteTotalQty');
  const valEl = document.getElementById(type === 'recv' ? 'batchRecvTotalVal' : 'batchWasteTotalVal');
  
  if(cntEl) cntEl.textContent = count;
  if(qtyEl) qtyEl.textContent = nf(totalQty);
  if(valEl) valEl.textContent = money(totalVal) + " " + t("cur_unit");
}

function saveBatchMovements(type){
  const isAr = currentLang === 'ar';
  const tableId = type === 'recv' ? 'batchRecvTable' : 'batchWasteTable';
  const dateEl = document.getElementById(type === 'recv' ? 'batchRecvDate' : 'batchWasteDate');
  const refEl = document.getElementById(type === 'recv' ? 'batchRecvRef' : 'batchWasteRef');
  const noteEl = document.getElementById(type === 'recv' ? 'batchRecvNote' : 'batchWasteNote');
  
  const date = dateEl?.value || S.dFrom;
  const ref = refEl?.value?.trim() || "";
  const generalNote = noteEl?.value?.trim() || "";
  
  if(!date || date < S.dFrom || date > S.dTo){
    toast("⚠️ " + (isAr ? "يرجى تحديد تاريخ ضمن الفترة الحالية" : "Select date within current period"));
    return;
  }
  
  const rows = document.querySelectorAll(\`#\${tableId} tbody tr\`);
  const newEntries = [];
  
  rows.forEach(tr => {
    const qtyInp = tr.querySelector(".batch-qty-inp");
    const lineNoteInp = tr.querySelector(".batch-note-inp");
    const idx = parseInt(qtyInp?.getAttribute("data-idx") || "-1");
    const qty = num(qtyInp?.value);
    
    if(idx >= 0 && idx < S.ing.length && qty > 0){
      const g = S.ing[idx];
      const lineNote = lineNoteInp?.value?.trim() || "";
      const fullNote = [generalNote, lineNote].filter(Boolean).join(" | ");
      newEntries.push({
        id: uid("TXN"),
        date,
        type: type,
        ingredientId: g.id,
        qty,
        unit: g.unit || "",
        reference: ref,
        note: fullNote,
        user: me.username,
        createdAt: new Date().toISOString()
      });
    }
  });
  
  if(newEntries.length === 0){
    toast("⚠️ " + (isAr ? "لم تقم بإدخال أي كميات للحفظ" : "No quantities entered to save"));
    return;
  }
  
  S.ledger.push(...newEntries);
  audit(type === 'recv' ? "batch_receiving" : "batch_waste", \`Saved \${newEntries.length} items on \${date} (Ref: \${ref})\`);
  Cc = compute();
  save();
  toast(\`✓ \${isAr ? 'تم بنجاح تسجيل ' + newEntries.length + ' حركة' : 'Successfully saved ' + newEntries.length + ' entries'}\`);
  movesSubTab = 'overview';
  renderMoves();
}

function calcCountRowVal(idx){
  const inp = document.querySelector(\`.batch-count-inp[data-idx="\${idx}"]\`);
  const cell = document.getElementById(\`countVal_\${idx}\`);
  const g = S.ing[idx];
  if(inp && cell && g){
    const v = num(inp.value);
    cell.textContent = money(v * num(g.price));
  }
  
  let totalVal = 0, count = 0;
  document.querySelectorAll(".batch-count-inp").forEach(el => {
    const i = parseInt(el.getAttribute("data-idx")||"-1");
    if(i >= 0 && el.value !== ""){
      count++;
      totalVal += num(el.value) * num(S.ing[i].price);
    }
  });
  const cntEl = document.getElementById("batchCountNum");
  const valEl = document.getElementById("batchCountTotalVal");
  if(cntEl) cntEl.textContent = \`\${count} / \${S.ing.length}\`;
  if(valEl) valEl.textContent = money(totalVal) + " " + t("cur_unit");
}

function copyTheoToCount(){
  const isAr = currentLang === 'ar';
  if(!confirm(isAr ? 'هل تريد ملء الجرد الفعلي بالرصيد الدفتري الحالي لجميع الأصناف؟' : 'Fill physical count with book balance for all items?')) return;
  
  S.ing.forEach((g, i) => {
    const netMove = Cc.recv[i] + Cc.tin[i] + Cc.production_in[i] - Cc.tout[i] - Cc.waste[i] - Cc.production_consume[i];
    const bookStock = num(S.beg[i]) + netMove;
    const inp = document.querySelector(\`.batch-count-inp[data-idx="\${i}"]\`);
    if(inp){
      inp.value = bookStock;
      calcCountRowVal(i);
    }
  });
}

function saveBatchPhysicalCount(){
  const isAr = currentLang === 'ar';
  const inputs = document.querySelectorAll(".batch-count-inp");
  let savedCount = 0;
  
  inputs.forEach(inp => {
    const idx = parseInt(inp.getAttribute("data-idx") || "-1");
    if(idx >= 0 && idx < S.ing.length && inp.value !== ""){
      S.end[idx] = num(inp.value);
      savedCount++;
    }
  });
  
  audit("physical_inventory_batch", \`Updated ending counts for \${savedCount} ingredients\`);
  Cc = compute();
  save();
  toast(\`✓ \${isAr ? 'تم تحديث أرصدة الجرد الختامي بنجاح' : 'Physical count saved successfully'}\`);
  movesSubTab = 'overview';
  renderMoves();
}

function filterLedgerTable(query){
  const q = (query||"").toLowerCase().trim();
  const rows = document.querySelectorAll("#ledgerTable tbody tr");
  rows.forEach(tr => {
    tr.style.display = (!q || tr.textContent.toLowerCase().includes(q)) ? "" : "none";
  });
}

function renderMoves(){
  if(!userCan("write_inventory") && !userCan("view")){
    app.innerHTML = periodBar() + \`<div class="card"><p>⛔ ليس لديك صلاحية لعرض حركات المخزون.</p></div>\`;
    return;
  }
  
  const canWrite = userCan("write_inventory");
  const isAr = currentLang === 'ar';
  
  // Calculate Movement KPIs
  const im = new Map(S.ing.map((g,i)=>[g.id,i]));
  const periodLedger = ledgerInPeriod();
  let totalRecvQty = 0, totalRecvVal = 0;
  let totalWasteQty = 0, totalWasteVal = 0;
  const activeIngIds = new Set();
  
  periodLedger.forEach(x => {
    activeIngIds.add(x.ingredientId);
    const i = im.get(x.ingredientId);
    const price = i != null ? num(S.ing[i].price) : 0;
    if(x.type === 'recv') {
      totalRecvQty += num(x.qty);
      totalRecvVal += num(x.qty) * price;
    } else if(x.type === 'waste') {
      totalWasteQty += num(x.qty);
      totalWasteVal += num(x.qty) * price;
    }
  });

  let h = periodBar();
  
  // Sub-Navigation Tabs
  h += \`<div class="subtabs">
    <button type="button" class="subtab-btn \${movesSubTab==='overview'?'active':''}" onclick="setMovesSubTab('overview')">📊 \${isAr?'كشف الحركات الشامل':'Movements Overview'}</button>
    \${canWrite?\`<button type="button" class="subtab-btn grn \${movesSubTab==='recv'?'active':''}" onclick="setMovesSubTab('recv')">📥 + \${isAr?'تسجيل توريدات ومشتريات':'Batch Receiving'}</button>\`:''}
    \${canWrite?\`<button type="button" class="subtab-btn red \${movesSubTab==='waste'?'active':''}" onclick="setMovesSubTab('waste')">🗑️ - \${isAr?'تسجيل هدر وتوالف':'Batch Waste'}</button>\`:''}
    \${canWrite?\`<button type="button" class="subtab-btn blue \${movesSubTab==='count'?'active':''}" onclick="setMovesSubTab('count')">📋 \${isAr?'جرد آخر المدة':'Physical Count'}</button>\`:''}
    \${canWrite?\`<button type="button" class="subtab-btn \${movesSubTab==='single'?'active':''}" onclick="setMovesSubTab('single')">➕ \${isAr?'حركة مفردة':'Single Entry'}</button>\`:''}
    <button type="button" class="subtab-btn \${movesSubTab==='ledger'?'active':''}" onclick="setMovesSubTab('ledger')">📜 \${isAr?'سجل القيود':'Ledger Log'} (\${periodLedger.length})</button>
  </div>\`;

  // SubTab: Overview
  if(movesSubTab === 'overview'){
    h += \`<div class="kpis">
      \${kpi(isAr?'إجمالي التوريدات والمشتريات':'Total Purchases', money(totalRecvVal) + ' ' + t('cur_unit') + ' <span style="font-size:11px;color:var(--mut)">(' + nf(totalRecvQty) + ')</span>', 'ok')}
      \${kpi(isAr?'إجمالي الهدر والتوالف':'Total Waste', money(totalWasteVal) + ' ' + t('cur_unit') + ' <span style="font-size:11px;color:var(--mut)">(' + nf(totalWasteQty) + ')</span>', totalWasteVal>0?'bad':'ok')}
      \${kpi(isAr?'الأصناف المتحركة':'Active Items', activeIngIds.size + ' / ' + S.ing.length, 'ok')}
      \${kpi(isAr?'إجمالي القيود المسجلة':'Total Ledger Entries', periodLedger.length, 'ok')}
    </div>\`;

    h += \`<div class="toolbar">
      <span class="label">🔍 \${isAr?'بحث':'Search'}:</span>
      <input type="text" placeholder="\${isAr?'ابحث بالاسم أو الكود...':'Search name or code...'}" value="\${esc(movesSearch)}" oninput="movesSearch=this.value;renderMovesTableBody()">
      <span class="label" style="margin-right:10px">🏷️ \${isAr?'القسم':'Category'}:</span>
      <select onchange="movesCat=this.value;renderMovesTableBody()">
        <option value="ALL">\${isAr?'كل الأقسام':'All Categories'}</option>
        \${CATS.map(c=>\`<option value="\${esc(c)}" \${movesCat===c?'selected':''}>\${esc(c)}</option>\`).join('')}
      </select>
      <div style="margin-right:auto;display:flex;gap:6px">
        <button class="mini exl" onclick="exportXLSX()">📊 Excel</button>
      </div>
    </div>\`;

    h += \`<div class="card" style="padding:0">
      <div class="tblwrap">
        <table id="movesMasterTable">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th style="width:70px">\${isAr?'كود الصنف':'Code'}</th>
              <th class="name" style="min-width:180px">\${isAr?'اسم المكون / الخامة':'Ingredient'}</th>
              <th style="width:110px">\${isAr?'القسم':'Category'}</th>
              <th style="width:50px">\${isAr?'الوحدة':'Unit'}</th>
              <th style="width:70px">\${isAr?'سعر الوحدة':'Unit Price'}</th>
              <th style="width:80px">\${isAr?'أول المدة':'Beg Stock'}</th>
              <th style="width:90px;color:#4ade80">\${isAr?'إجمالي الوارد (+)':'Total In (+)'}</th>
              <th style="width:90px;color:#f87171">\${isAr?'المنصرف والهدر (-)':'Total Out (-)'}</th>
              <th style="width:80px">\${isAr?'آخر المدة':'End Stock'}</th>
              <th style="width:90px">\${isAr?'القيمة':'Total Value'}</th>
              \${canWrite?\`<th style="width:60px">\${isAr?'إجراء':'Action'}</th>\`:''}
            </tr>
          </thead>
          <tbody id="movesTbody">
          </tbody>
        </table>
      </div>
    </div>\`;
    
    app.innerHTML = h;
    renderMovesTableBody();
    return;
  }
  
  // SubTab: Batch Receiving
  if(movesSubTab === 'recv'){
    h += \`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <h3 style="margin:0;color:#15803d">📥 \${isAr?'تسجيل توريدات ومشتريات مجمعة':'Batch Receiving Sheet'}</h3>
        <span class="pill" style="background:#dcfce7;color:#166534">⚡ \${isAr?'إدخال فواتير الموردين والشراء السريع':'Fast Vendor Invoice Entry'}</span>
      </div>
      <div class="toolbar" style="margin-bottom:12px">
        <span class="label">📅 \${isAr?'تاريخ التوريد':'Date'}:</span>
        <input type="date" id="batchRecvDate" value="\${S.dFrom}" min="\${S.dFrom}" max="\${S.dTo}">
        <button class="mini" onclick="document.getElementById('batchRecvDate').value=new Date().toISOString().split('T')[0]">\${isAr?'اليوم':'Today'}</button>
        <span class="label" style="margin-right:8px">📄 \${isAr?'رقم الفاتورة / المرجع':'Invoice / Ref'}:</span>
        <input type="text" id="batchRecvRef" placeholder="INV-2026-..." style="width:140px">
        <span class="label" style="margin-right:8px">📝 \${isAr?'المورد / ملاحظات':'Vendor / Note'}:</span>
        <input type="text" id="batchRecvNote" placeholder="\${isAr?'اسم المورد أو بيان الشحنة...':'Supplier info...'}" style="flex:1;min-width:160px">
      </div>
      <div class="toolbar" style="margin-bottom:12px;background:#f8fafc">
        <span class="label">🔍 \${isAr?'تصفية':'Filter'}:</span>
        <input type="text" placeholder="\${isAr?'بحث سريع باسم الصنف...':'Filter items...'}" id="batchRecvSearch" oninput="filterBatchRows('batchRecvTable', this.value)">
        <select onchange="filterBatchCategory('batchRecvTable', this.value)">
          <option value="ALL">\${isAr?'كل الأقسام':'All Categories'}</option>
          \${CATS.map(c=>\`<option value="\${esc(c)}">\${esc(c)}</option>\`).join('')}
        </select>
      </div>
      
      <div class="batch-bar">
        <div class="batch-stats">
          <div class="batch-stat"><span>\${isAr?'الأصناف المدخلة:':'Items Entered:'}</span><span class="val grn" id="batchRecvCount">0</span></div>
          <div class="batch-stat"><span>\${isAr?'إجمالي الكميات:':'Total Qty:'}</span><span class="val" id="batchRecvTotalQty">0.00</span></div>
          <div class="batch-stat"><span>\${isAr?'إجمالي القيمة:':'Total Value:'}</span><span class="val grn" id="batchRecvTotalVal">0.00 \${t('cur_unit')}</span></div>
        </div>
        <button class="hbtn grn" style="padding:8px 16px;font-size:13px" onclick="saveBatchMovements('recv')">💾 \${isAr?'حفظ وتسجيل التوريدات':'Save & Post Invoices'}</button>
      </div>

      <div class="tblwrap">
        <table id="batchRecvTable">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th style="width:70px">\${isAr?'الكود':'Code'}</th>
              <th class="name" style="min-width:180px">\${isAr?'اسم المكون / الخامة':'Ingredient'}</th>
              <th style="width:110px">\${isAr?'القسم':'Category'}</th>
              <th style="width:50px">\${isAr?'الوحدة':'Unit'}</th>
              <th style="width:70px">\${isAr?'سعر الوحدة':'Unit Price'}</th>
              <th style="width:75px">\${isAr?'الرصيد الحالي':'Current'}</th>
              <th style="width:110px;background:#15803d;color:#fff">✍️ \${isAr?'الكمية المستلمة':'Received Qty'}</th>
              <th style="width:90px">\${isAr?'القيمة':'Value'}</th>
              <th style="min-width:130px">\${isAr?'ملاحظة سطر (اختياري)':'Line Note'}</th>
            </tr>
          </thead>
          <tbody>
            \${S.ing.map((g,i)=>{
              const curStock = num(S.beg[i]) + Cc.recv[i] + Cc.tin[i] + Cc.production_in[i] - Cc.tout[i] - Cc.waste[i] - Cc.production_consume[i];
              return \`<tr data-cat="\${esc(g.category||'')}">
                <td>\${i+1}</td>
                <td class="idcell">\${g.id}</td>
                <td class="name"><b>\${esc(g.name)}</b></td>
                <td><span class="pill">\${esc(g.category||'—')}</span></td>
                <td>\${esc(g.unit)}</td>
                <td data-price="\${num(g.price)}">\${money(g.price)}</td>
                <td>\${nf(curStock)}</td>
                <td><input type="number" min="0" step="0.01" class="batch-qty-inp ed" style="width:95px;font-weight:700" data-idx="\${i}" placeholder="0.00" oninput="calcBatchTotals('recv')"></td>
                <td class="batch-row-val" id="recvVal_\${i}">—</td>
                <td><input type="text" class="batch-note-inp" style="width:100%" placeholder="\${isAr?'ملاحظة...':'note...'}"></td>
              </tr>\`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>\`;
    app.innerHTML = h;
    return;
  }

  // SubTab: Batch Waste
  if(movesSubTab === 'waste'){
    h += \`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:gap;gap:10px;margin-bottom:12px">
        <h3 style="margin:0;color:#b91c1c">🗑️ \${isAr?'تسجيل هدر وتوالف مجمعة':'Batch Waste & Loss Sheet'}</h3>
        <span class="pill" style="background:#fee2e2;color:#991b1b">⚠️ \${isAr?'إثبات توالف المطبخ والتخزين':'Record Kitchen Spoilage & Loss'}</span>
      </div>
      <div class="toolbar" style="margin-bottom:12px">
        <span class="label">📅 \${isAr?'تاريخ الهدر':'Date'}:</span>
        <input type="date" id="batchWasteDate" value="\${S.dFrom}" min="\${S.dFrom}" max="\${S.dTo}">
        <button class="mini" onclick="document.getElementById('batchWasteDate').value=new Date().toISOString().split('T')[0]">\${isAr?'اليوم':'Today'}</button>
        <span class="label" style="margin-right:8px">📋 \${isAr?'سبب الهدر / المرجع':'Reason / Ref'}:</span>
        <input type="text" id="batchWasteRef" placeholder="\${isAr?'تلف تشغيل / انتهاء صلاحية...':'Prep waste, expired...'}" style="width:180px">
        <span class="label" style="margin-right:8px">📝 \${isAr?'المسؤول / ملاحظات':'Responsible / Note'}:</span>
        <input type="text" id="batchWasteNote" placeholder="\${isAr?'شيف الوردية / ملاحظات إضافية...':'Notes...'}" style="flex:1;min-width:160px">
      </div>
      <div class="toolbar" style="margin-bottom:12px;background:#f8fafc">
        <span class="label">🔍 \${isAr?'تصفية':'Filter'}:</span>
        <input type="text" placeholder="\${isAr?'بحث سريع باسم الصنف...':'Filter items...'}" id="batchWasteSearch" oninput="filterBatchRows('batchWasteTable', this.value)">
        <select onchange="filterBatchCategory('batchWasteTable', this.value)">
          <option value="ALL">\${isAr?'كل الأقسام':'All Categories'}</option>
          \${CATS.map(c=>\`<option value="\${esc(c)}">\${esc(c)}</option>\`).join('')}
        </select>
      </div>

      <div class="batch-bar" style="background:#1e1b4b">
        <div class="batch-stats">
          <div class="batch-stat"><span>\${isAr?'أصناف الهدر:':'Waste Items:'}</span><span class="val red" id="batchWasteCount">0</span></div>
          <div class="batch-stat"><span>\${isAr?'إجمالي كميات الهدر:':'Total Waste Qty:'}</span><span class="val" id="batchWasteTotalQty">0.00</span></div>
          <div class="batch-stat"><span>\${isAr?'تكلفة الهدر:':'Waste Cost:'}</span><span class="val red" id="batchWasteTotalVal">0.00 \${t('cur_unit')}</span></div>
        </div>
        <button class="hbtn red" style="padding:8px 16px;font-size:13px" onclick="saveBatchMovements('waste')">🗑️ \${isAr?'حفظ وتسجيل الهدر والتوالف':'Save & Post Waste'}</button>
      </div>

      <div class="tblwrap">
        <table id="batchWasteTable">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th style="width:70px">\${isAr?'الكود':'Code'}</th>
              <th class="name" style="min-width:180px">\${isAr?'اسم المكون / الخامة':'Ingredient'}</th>
              <th style="width:110px">\${isAr?'القسم':'Category'}</th>
              <th style="width:50px">\${isAr?'الوحدة':'Unit'}</th>
              <th style="width:70px">\${isAr?'سعر الوحدة':'Unit Price'}</th>
              <th style="width:75px">\${isAr?'الرصيد الحالي':'Current'}</th>
              <th style="width:110px;background:#b91c1c;color:#fff">✍️ \${isAr?'كمية الهدر':'Waste Qty'}</th>
              <th style="width:90px">\${isAr?'تكلفة الهدر':'Waste Cost'}</th>
              <th style="min-width:130px">\${isAr?'سبب التلف بالسطر':'Line Reason'}</th>
            </tr>
          </thead>
          <tbody>
            \${S.ing.map((g,i)=>{
              const curStock = num(S.beg[i]) + Cc.recv[i] + Cc.tin[i] + Cc.production_in[i] - Cc.tout[i] - Cc.waste[i] - Cc.production_consume[i];
              return \`<tr data-cat="\${esc(g.category||'')}">
                <td>\${i+1}</td>
                <td class="idcell">\${g.id}</td>
                <td class="name"><b>\${esc(g.name)}</b></td>
                <td><span class="pill">\${esc(g.category||'—')}</span></td>
                <td>\${esc(g.unit)}</td>
                <td data-price="\${num(g.price)}">\${money(g.price)}</td>
                <td>\${nf(curStock)}</td>
                <td><input type="number" min="0" step="0.01" class="batch-qty-inp ed" style="width:95px;font-weight:700" data-idx="\${i}" placeholder="0.00" oninput="calcBatchTotals('waste')"></td>
                <td class="batch-row-val neg" id="wasteVal_\${i}">—</td>
                <td><input type="text" class="batch-note-inp" style="width:100%" placeholder="\${isAr?'تلف تشغيل...':'reason...'}"></td>
              </tr>\`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>\`;
    app.innerHTML = h;
    return;
  }

  // SubTab: Physical Count
  if(movesSubTab === 'count'){
    h += \`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <h3 style="margin:0;color:#2563eb">📋 \${isAr?'جرد آخر المدة الفعلي':'Physical Ending Inventory Count'}</h3>
        <span class="pill" style="background:#e0f2fe;color:#0369a1">📊 \${isAr?'تحديث أرصدة الجرد الختامي ومطابقة المخزن':'Update Ending Inventory Balances'}</span>
      </div>
      <div class="toolbar" style="margin-bottom:12px;background:#f8fafc">
        <span class="label">🔍 \${isAr?'تصفية':'Filter'}:</span>
        <input type="text" placeholder="\${isAr?'بحث سريع باسم الصنف...':'Filter items...'}" id="batchCountSearch" oninput="filterBatchRows('batchCountTable', this.value)">
        <select onchange="filterBatchCategory('batchCountTable', this.value)">
          <option value="ALL">\${isAr?'كل الأقسام':'All Categories'}</option>
          \${CATS.map(c=>\`<option value="\${esc(c)}">\${esc(c)}</option>\`).join('')}
        </select>
        <button class="mini" onclick="copyTheoToCount()">\${isAr?'نسخ الرصيد الدفتري للجرد':'Fill with Book Stock'}</button>
      </div>

      <div class="batch-bar" style="background:#0f172a">
        <div class="batch-stats">
          <div class="batch-stat"><span>\${isAr?'الأصناف المجردة:':'Counted Items:'}</span><span class="val" id="batchCountNum">\${S.end.filter(x=>x!==undefined&&x!=='').length} / \${S.ing.length}</span></div>
          <div class="batch-stat"><span>\${isAr?'قيمة المخزون الختامي:':'Ending Stock Value:'}</span><span class="val grn" id="batchCountTotalVal">\${money(Cc.stockValue)} \${t('cur_unit')}</span></div>
        </div>
        <button class="hbtn prim" style="padding:8px 16px;font-size:13px" onclick="saveBatchPhysicalCount()">💾 \${isAr?'حفظ وتحديث أرصدة الجرد الختامي':'Save Ending Inventory'}</button>
      </div>

      <div class="tblwrap">
        <table id="batchCountTable">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th style="width:70px">\${isAr?'الكود':'Code'}</th>
              <th class="name" style="min-width:180px">\${isAr?'اسم المكون / الخامة':'Ingredient'}</th>
              <th style="width:110px">\${isAr?'القسم':'Category'}</th>
              <th style="width:50px">\${isAr?'الوحدة':'Unit'}</th>
              <th style="width:70px">\${isAr?'سعر الوحدة':'Unit Price'}</th>
              <th style="width:80px">\${isAr?'أول المدة':'Beg'}</th>
              <th style="width:85px">\${isAr?'صافي الحركة':'Net Move'}</th>
              <th style="width:85px">\${isAr?'الرصيد الدفتري':'Book Stock'}</th>
              <th style="width:110px;background:#2563eb;color:#fff">✍️ \${isAr?'الجرد الفعلي (End)':'Actual Count'}</th>
              <th style="width:90px">\${isAr?'قيمة الجرد':'Ending Value'}</th>
            </tr>
          </thead>
          <tbody>
            \${S.ing.map((g,i)=>{
              const netMove = Cc.recv[i] + Cc.tin[i] + Cc.production_in[i] - Cc.tout[i] - Cc.waste[i] - Cc.production_consume[i];
              const bookStock = num(S.beg[i]) + netMove;
              return \`<tr data-cat="\${esc(g.category||'')}">
                <td>\${i+1}</td>
                <td class="idcell">\${g.id}</td>
                <td class="name"><b>\${esc(g.name)}</b></td>
                <td><span class="pill">\${esc(g.category||'—')}</span></td>
                <td>\${esc(g.unit)}</td>
                <td data-price="\${num(g.price)}">\${money(g.price)}</td>
                <td>\${nf(S.beg[i])}</td>
                <td class="\${netMove>=0?'pos':'neg'}">\${netMove>=0?'+':''}\${nf(netMove)}</td>
                <td><b>\${nf(bookStock)}</b></td>
                <td><input type="number" min="0" step="0.01" class="batch-count-inp ed" style="width:95px;font-weight:700" data-idx="\${i}" value="\${S.end[i]!==undefined?S.end[i]:''}" placeholder="0.00" oninput="calcCountRowVal(\${i})"></td>
                <td class="batch-count-val" id="countVal_\${i}">\${money(num(S.end[i]||0)*num(g.price))}</td>
              </tr>\`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>\`;
    app.innerHTML = h;
    return;
  }

  // SubTab: Single Movement Entry
  if(movesSubTab === 'single'){
    const types = ["recv","tin","tout","waste","production_in","production_consume"];
    h += \`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <h3 style="margin:0">➕ \${isAr?'تسجيل حركة مخزون مفردة':'Record Single Stock Movement'}</h3>
        <span class="pill" style="background:#eff6ff;color:#1d4ed8">⚡ \${isAr?'مدعوم بالبحث الفوري السريع للأصناف':'Instant Autocomplete Enabled'}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;align-items:end;margin-bottom:12px">
        <div><label style="font-size:11px;color:var(--mut);display:block;margin-bottom:4px">📅 \${isAr?'التاريخ':'Date'}</label><input id="txDate" type="date" value="\${S.dFrom}" min="\${S.dFrom}" max="\${S.dTo}"></div>
        <div><label style="font-size:11px;color:var(--mut);display:block;margin-bottom:4px">🏷️ \${isAr?'نوع الحركة':'Movement Type'}</label><select id="txType">\${types.map(t=>\`<option value="\${t}">\${TYPES[t]||t}</option>\`).join("")}</select></div>
        <div style="min-width:220px">
          <label style="font-size:11px;color:var(--mut);display:flex;justify-content:space-between;margin-bottom:4px">
            <span>🥘 \${isAr?'المكون / الخامة (بحث فوري)':'Ingredient (Autocomplete)'}</span>
            <span style="color:#2563eb;font-weight:bold;font-size:10px">🔍 \${isAr?'اكتب للبحث':'Type to filter'}</span>
          </label>
          <input type="text" list="txIngDatalist" id="txIngAutocomplete" placeholder="\${isAr?'ابحث باسم المكون أو الكود (مثال: جبنة، ING-002)...':'Search ingredient name or code...'}" style="width:100%;font-weight:bold;margin-bottom:4px;border:1px solid #3b82f6;padding:5px 8px;border-radius:6px" oninput="syncTxIngFromAutocomplete(this.value)">
          <datalist id="txIngDatalist">
            \${S.ing.map(g=>\`<option value="\${esc(g.name)} [\${g.id}]" data-id="\${g.id}">\${esc(g.category||'')} - \${g.unit}</option>\`).join("")}
          </datalist>
          <select id="txIng" onchange="syncTxAutocompleteFromSelect(this.value)" style="width:100%;font-size:11px">
            \${S.ing.map(g=>\`<option value="\${g.id}">\${esc(g.name)} (\${g.unit}) [\${g.id}]</option>\`).join("")}
          </select>
        </div>
        <div><label style="font-size:11px;color:var(--mut);display:block;margin-bottom:4px">🔢 \${isAr?'الكمية':'Quantity'}</label><input id="txQty" type="number" min="0" step="0.01" placeholder="0.00"></div>
        <div><label style="font-size:11px;color:var(--mut);display:block;margin-bottom:4px">📄 \${isAr?'المرجع (فاتورة/إذن)':'Reference'}</label><input id="txRef" placeholder="INV / PO / Kitchen"></div>
        <div><label style="font-size:11px;color:var(--mut);display:block;margin-bottom:4px">📝 \${isAr?'ملاحظات':'Notes'}</label><input id="txNote" placeholder="..."></div>
        <div><button class="hbtn grn" style="width:100%;padding:9px" onclick="addTransaction()">＋ \${isAr?'تسجيل الحركة':'Record Move'}</button></div>
      </div>
    </div>\`;
    app.innerHTML = h;
    return;
  }

  // SubTab: Ledger Log
  if(movesSubTab === 'ledger'){
    h += \`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <h3 style="margin:0">📜 \${isAr?'سجل قيود وحركات الفترة':'Period Ledger Log'}</h3>
        <div style="display:flex;gap:6px">
          <button class="mini exl" onclick="exportXLSX()">📊 Excel</button>
        </div>
      </div>
      <div class="toolbar" style="margin-bottom:12px">
        <span class="label">🔍 \${isAr?'بحث':'Search'}:</span>
        <input type="text" id="ledgerSearch" placeholder="\${isAr?'بحث بالاسم، الكود، المرجع أو المستخدم...':'Search ledger...'}" oninput="filterLedgerTable(this.value)">
      </div>
      <div class="tblwrap">
        <table id="ledgerTable">
          <thead>
            <tr>
              <th style="width:85px">\${isAr?'التاريخ':'Date'}</th>
              <th style="width:90px">ID</th>
              <th style="width:90px">\${isAr?'النوع':'Type'}</th>
              <th class="name" style="min-width:180px">\${isAr?'المكون':'Ingredient'}</th>
              <th style="width:75px">\${isAr?'الكمية':'Qty'}</th>
              <th style="width:50px">\${isAr?'الوحدة':'Unit'}</th>
              <th style="width:90px">\${isAr?'المرجع':'Reference'}</th>
              <th style="width:80px">\${isAr?'المستخدم':'User'}</th>
              <th class="name" style="min-width:120px">\${isAr?'ملاحظات':'Notes'}</th>
              \${canWrite?\`<th style="width:40px"></th>\`:''}
            </tr>
          </thead>
          <tbody>
            \${periodLedger.sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)).map(x=>{
              const i = im.get(x.ingredientId), g = i != null ? S.ing[i] : null;
              const typeColor = x.type==='recv'?'b-grn':x.type==='waste'?'b-red':'';
              return \`<tr>
                <td>\${x.date}</td>
                <td class="idcell">\${x.id}</td>
                <td><span class="badge \${typeColor}">\${TYPES[x.type]||x.type}</span></td>
                <td class="name"><b>\${esc(g?.name||'—')}</b></td>
                <td><b>\${nf(x.qty)}</b></td>
                <td>\${esc(x.unit)}</td>
                <td>\${esc(x.reference||'—')}</td>
                <td><span class="pill">\${esc(x.user)}</span></td>
                <td class="name" style="color:var(--mut)">\${esc(x.note||'—')}</td>
                \${canWrite?\`<td><button class="mini red" title="\${isAr?'حذف القيد':'Delete'}" onclick="delTx('\${x.id}')">✕</button></td>\`:''}
              </tr>\`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>\`;
    app.innerHTML = h;
    return;
  }
}

function addTransaction(){
  const date = document.getElementById("txDate").value, type = document.getElementById("txType").value, ingredientId = document.getElementById("txIng").value, qty = num(document.getElementById("txQty").value);
  if(!date || date < S.dFrom || date > S.dTo || qty <= 0){ toast("⚠️ تحقق من التاريخ والكمية"); return; }
  const g = S.ing.find(x => x.id === ingredientId);
  S.ledger.push({ id: uid("TXN"), date, type, ingredientId, qty, unit: g?.unit||"", reference: document.getElementById("txRef").value.trim(), note: document.getElementById("txNote").value.trim(), user: me.username, createdAt: new Date().toISOString() });
  audit("inventory_add", \`\${TYPES[type]} | \${g?.name} | \${qty} \${g?.unit}\`);
  toast("✓ تم تسجيل الحركة");
  Cc = compute();
  save();
  renderMoves();
}

function renderLedger(){
  movesSubTab = 'ledger';
  renderMoves();
}

function delTx(id){
  if(!userCan("write_inventory") || !confirm("حذف الحركة؟")) return;
  S.ledger = S.ledger.filter(x => x.id !== id);
  audit("tx_delete", id);
  Cc = compute();
  save();
  renderTab();
}

function renderSummary(){
  const isAr = currentLang === 'ar';
  let h = periodBar();

  // Action Bar for Summary
  h += \`<div class="toolbar" style="justify-content:space-between;background:var(--card);padding:10px 14px;margin-bottom:12px">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span class="label">📂 \${isAr?'تحكم الأقسام:':'Categories:'}</span>
      <button class="mini" onclick="expandAllCategories()">➕ \${isAr?'توسيع الكل':'Expand All'}</button>
      <button class="mini" onclick="collapseAllCategories()">➖ \${isAr?'طي الكل':'Collapse All'}</button>
      <input type="text" id="summarySearchInp" placeholder="\${isAr?'بحث في الأصناف...':'Filter items...'}" oninput="filterSummaryRows(this.value)" style="width:160px">
    </div>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="mini prn" onclick="openPrintModal('summary')">🖨️ \${isAr?'طباعة شيت الملخص':'Print Summary'}</button>
      <button class="mini exl" onclick="exportMultiSheetXLSX()">📊 \${isAr?'تصدير Excel':'Export Excel'}</button>
    </div>
  </div>\`;

  h += \`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <h3 style="margin:0">⚖️ \${isAr?'الملخص والفروقات مجمعة حسب الأقسام (Variance by Category)':'Summary & Variance by Category'}</h3>
      <span class="pill" style="background:#e0f2fe;color:#0369a1">\${S.ing.length} \${isAr?'صنف':'Items'}</span>
    </div>
    <div class="tblwrap">
      <table id="summaryMainTable">
        <thead>
          <tr>
            <th>#</th>
            <th class="name">\${isAr?'المكون':'Ingredient'}</th>
            <th>\${isAr?'الوحدة':'Unit'}</th>
            <th>\${isAr?'نظري':'Theo'}</th>
            <th>\${isAr?'أول المدة':'Beg'}</th>
            <th>\${isAr?'استلام':'Recv'}</th>
            <th>\${isAr?'داخل':'In'}</th>
            <th>\${isAr?'إنتاج':'Prod In'}</th>
            <th>\${isAr?'خارج':'Out'}</th>
            <th>\${isAr?'هالك':'Waste'}</th>
            <th>\${isAr?'استهلاك تصنيع':'Prod Use'}</th>
            <th>\${isAr?'آخر المدة':'End'}</th>
            <th>\${isAr?'فعلي':'Actual'}</th>
            <th>\${isAr?'فرق':'Variance'}</th>
            <th>\${isAr?'تكلفة الفرق':'Var Cost'}</th>
          </tr>
        </thead>
        <tbody>\`;

  // Group ingredients by category
  const grouped = {};
  CATS.forEach(c => { grouped[c] = []; });
  const otherCat = isAr ? 'أخرى' : 'Other';
  grouped[otherCat] = [];

  S.ing.forEach((g, i) => {
    let cat = "";
    if (typeof g.cat === "number" && CATS[g.cat]) cat = CATS[g.cat];
    else if (typeof g.cat === "string" && grouped[g.cat]) cat = g.cat;
    else if (typeof g.category === "string" && grouped[g.category]) cat = g.category;
    else cat = otherCat;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ g, i });
  });

  let rowCounter = 1;
  Object.keys(grouped).forEach((catName, catIdx) => {
    const items = grouped[catName];
    if(items.length === 0) return;

    const catTheoCost = items.reduce((sum, item) => sum + num(Cc.adj[item.i])*num(item.g.price), 0);
    const catVarCost = items.reduce((sum, item) => sum + num(Cc.cvar[item.i]), 0);
    const catEndVal = items.reduce((sum, item) => sum + num(S.end[item.i]||0)*num(item.g.price), 0);

    const groupKey = 'summary_cat_' + catIdx;
    const isCollapsed = !!collapsedCategories[groupKey];

    h += \`<tr class="cat-hdr-row" onclick="toggleCatGroup('\${groupKey}')">
      <td colspan="3" style="text-align:\${isAr?'right':'left'};font-weight:700">
        <span class="cat-toggle-icon" id="icon_\${groupKey}">\${isCollapsed ? '▶' : '▼'}</span>
        📁 \${esc(catName)} (\${items.length})
      </td>
      <td colspan="8" style="text-align:center;font-size:11px;font-weight:500;opacity:0.9">
        \${isAr?'قيمة المخزون الختامي:':'Ending Stock:'} <b>\${money(catEndVal)} \${t('cur_unit')}</b> | \${isAr?'التكلفة النظرية:':'Theo Cost:'} <b>\${money(catTheoCost)} \${t('cur_unit')}</b>
      </td>
      <td colspan="3" style="text-align:\${isAr?'left':'right'};font-weight:700">
        \${isAr?'فرق التكلفة:':'Var Cost:'} <span style="color:\${catVarCost<0?'#f87171':'#4ade80'}">\${money(catVarCost)} \${t('cur_unit')}</span>
      </td>
    </tr>\`;

    items.forEach(({ g, i }) => {
      h += \`<tr class="cat-child-row \${groupKey}" style="\${isCollapsed ? 'display:none' : ''}">
        <td>\${rowCounter++}</td>
        <td class="name">\${esc(g.name)}</td>
        <td>\${esc(g.unit)}</td>
        <td>\${nf(Cc.adj[i])}</td>
        <td><input \${userCan("write_inventory")?"":"disabled"} type="number" class="ed" data-k="beg" data-i="\${i}" value="\${S.beg[i]||""}"></td>
        <td>\${nf(Cc.recv[i])}</td>
        <td>\${nf(Cc.tin[i])}</td>
        <td>\${nf(Cc.production_in[i])}</td>
        <td>\${nf(Cc.tout[i])}</td>
        <td>\${nf(Cc.waste[i])}</td>
        <td>\${nf(Cc.production_consume[i])}</td>
        <td><input \${userCan("write_inventory")?"":"disabled"} type="number" class="ed" data-k="end" data-i="\${i}" value="\${S.end[i]||""}"></td>
        <td>\${nf(Cc.actual[i])}</td>
        <td class="\${Cc.vari[i]<0?'neg':'pos'}">\${nf(Cc.vari[i])}</td>
        <td class="\${Cc.cvar[i]<0?'neg':'pos'}">\${money(Cc.cvar[i])}</td>
      </tr>\`;
    });
  });

  h += \`</tbody>
      <tfoot>
        <tr class="tot">
          <td colspan="13">\${isAr?'الإجمالي الكلي':'Total'}</td>
          <td>\${nf(Cc.vari.reduce((a,b)=>a+b,0))}</td>
          <td>\${money(Cc.varCost)}</td>
        </tr>
      </tfoot>
    </table>
    </div>
  </div>\`;
  app.innerHTML = h;
}

function renderPar(){
  let h = periodBar() + \`<div class="card"><h3>🛒 \${currentLang==='ar'?'حد الأمان وإعادة الطلب (Par)':'Par & Reorder'}</h3><div class="tblwrap"><table><thead><tr><th>#</th><th class="name">\${currentLang==='ar'?'المكون':'Ingredient'}</th><th>\${currentLang==='ar'?'متوسط يومي':'Daily Avg'}</th><th>\${currentLang==='ar'?'الرصيد':'Stock'}</th><th>\${currentLang==='ar'?'تغطية':'Days'}</th><th>Par</th><th>\${currentLang==='ar'?'شراء مقترح':'Order Qty'}</th><th>\${currentLang==='ar'?'التكلفة':'Cost'}</th><th>\${currentLang==='ar'?'الحالة':'Status'}</th></tr></thead><tbody>\`;
  S.ing.forEach((g, i) => {
    const avg = Cc.adj[i]/Cc.days, cur = num(S.end[i]), days = avg ? cur/avg : Infinity, par = avg * S.parDays, buy = Math.max(0, par - cur), c = buy * num(g.price);
    let st = avg && days < S.parDays ? '<span class="badge b-red">🔴 شراء</span>' : avg && days < 1.5*S.parDays ? '<span class="badge b-yel">🟡 قريب</span>' : '<span class="badge b-grn">🟢 سليم</span>';
    h += \`<tr><td>\${i+1}</td><td class="name">\${esc(g.name)}</td><td>\${nf(avg)}</td><td>\${nf(cur)}</td><td>\${isFinite(days)?nf(days,1):"—"}</td><td>\${nf(par)}</td><td class="\${buy>0?'neg':''}">\${nf(buy)}</td><td>\${money(c)}</td><td>\${st}</td></tr>\`;
  });
  h += \`</tbody></table></div></div>\`;
  app.innerHTML = h;
}

const PREP_RAW_MASTER = [
  ["عجين بيتزا مخمر جاهز", "RCP-136", 1570],
  ["صلصه طماطم بيتزا", "RCP-137", 5881],
  ["صوص طحينه", "RCP-135", 1245],
  ["تونه مكس", "RCP-130", 3305],
  ["صوص ليمون جريك سالاد", "RCP-138", 1310],
  ["صوص ليمون لسلطة التونة", "RCP-139", 1310],
  ["صوص ليمون الكينوا سالاد", "RCP-147", 86.5],
  ["صدور دجاج سيزار سالاد", "RCP-148", 6610],
  ["تتبيله بعد التسوية دجاج كاساديا", "RCP-149", 1310],
  ["بورشن دجاج كاساديا", "RCP-150", 7784],
  ["بورشن خضار كاساديا", "RCP-151", 8560],
  ["بورشن دجاج شاورما", "RCP-133", 10928],
  ["توميه شاورما", "RCP-134", 968],
  ["توابل الكبده", "RCP-132", 147]
];

function getPrepTheoDemand(prepName, isForecast, forecastIngDemand){
  let totalDemand = 0;
  S.ing.forEach((g, idx) => {
    let matches = g.name === prepName;
    if (!matches) {
      if (prepName.includes('عجين بيتزا') && (g.name.includes('عجين بيتزا') || g.name === 'بورشن عجين بيتزا')) matches = true;
      else if (prepName.includes('صلصه طماطم') && (g.name.includes('صلصه طماطم') || g.name === 'صلصه طماطم بيتزا')) matches = true;
      else if (prepName.includes('كينوا') && g.name.includes('كينوا')) matches = true;
      else if (prepName.includes('كاساديا') && prepName.includes('تتبيل') && g.name.includes('كاساديا') && g.name.includes('تتبيل')) matches = true;
    }
    if (matches) {
      const val = isForecast && forecastIngDemand ? (forecastIngDemand[idx] || 0) : (Cc.raw[idx] || 0);
      totalDemand += val;
    }
  });
  return totalDemand;
}

let expandedPrepIdx = null;

function getPrepItemDetails(p, batches){
  const r = S.recipes.find(rc => rc.code === p[1] || rc.id === p[1]);
  const subIngs = r ? r.items.map(it => {
    let ing = S.ing.find(ig => ig.id === it.ingredientId);
    if (!ing && it.ing) ing = S.ing.find(ig => ig.name === it.ing);
    const qtyPerBatch = num(it.std);
    const totalQtyNeeded = qtyPerBatch * (batches > 0 ? batches : 1);
    const unitPrice = ing ? num(ing.price) : 0;
    const totalCost = totalQtyNeeded * unitPrice;
    return {
      name: ing ? ing.name : (it.ing || 'خامة'),
      unit: ing ? ing.unit : 'جم',
      qtyPerBatch,
      totalQtyNeeded,
      unitPrice,
      totalCost
    };
  }) : [];

  const batchCost = subIngs.reduce((sum, si) => sum + si.totalCost, 0);

  const linkedDishes = [];
  S.sales.forEach(s => {
    const q = num(s.qty);
    if (q <= 0) return;
    const dishRecipe = S.recipes.find(rc => rc.id === s.recipeId || rc.code === s.code);
    if (!dishRecipe) return;
    dishRecipe.items.forEach(it => {
      let isMatch = false;
      const itIngName = it.ing || '';
      if (itIngName === p[0]) isMatch = true;
      else if (p[0].includes('عجين بيتزا') && (itIngName.includes('عجين بيتزا') || itIngName.includes('بورشن عجين بيتزا'))) isMatch = true;
      else if (p[0].includes('صلصه طماطم') && (itIngName.includes('صلصه طماطم') || itIngName.includes('صلصه طماطم بيتزا'))) isMatch = true;
      else if (p[0].includes('كاساديا') && p[0].includes('تتبيل') && itIngName.includes('كاساديا') && itIngName.includes('تتبيل')) isMatch = true;
      else if (p[0].includes('كينوا') && itIngName.includes('كينوا') && itIngName.includes('صوص')) isMatch = true;
      else if (p[0].includes('تونه مكس') && itIngName.includes('تونه مكس')) isMatch = true;
      else if (p[0].includes('خضار كاساديا') && itIngName.includes('خضار كاساديا')) isMatch = true;
      else if (p[0].includes('دجاج كاساديا') && itIngName.includes('دجاج كاساديا')) isMatch = true;
      else if (p[0].includes('دجاج شاورما') && itIngName.includes('دجاج شاورما')) isMatch = true;
      else if (p[0].includes('تومية شاورما') && itIngName.includes('توميه')) isMatch = true;
      else if (p[0].includes('سيزار') && itIngName.includes('سيزار سلاد')) isMatch = true;
      else if (p[0].includes('توابل الكبده') && itIngName.includes('توابل الكبده')) isMatch = true;
      else if (p[0].includes('طحينه') && itIngName.includes('طحينه')) isMatch = true;

      if (isMatch) {
        linkedDishes.push({
          code: s.code,
          name: s.name,
          group: s.group || 'عام',
          qty: q,
          portionStd: num(it.std),
          totalDemand: q * num(it.std)
        });
      }
    });
  });

  return { r, subIngs, batchCost, linkedDishes };
}

function togglePrepAccordion(k){
  expandedPrepIdx = expandedPrepIdx === k ? null : k;
  renderPrep();
}

function renderPrep(){
  const PREP_RAW = PREP_RAW_MASTER;
  let h = periodBar() + \`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <h3 style="margin:0">🏭 \${currentLang==='ar'?'التصنيع والتحضير الداخلي بالمطبخ':'Internal Kitchen Prep & Production'}</h3>
      <span class="pill" style="background:#eff6ff;color:#2563eb;font-weight:600">💡 \${currentLang==='ar'?'اضغط على أي صف لعرض مقادير الوصفة والأصناف المباعة المرتبطة':'Click any row to reveal recipe ingredients and linked sales'}</span>
    </div>
    <div class="tblwrap"><table><thead><tr>
      <th>#</th>
      <th class="name">\${currentLang==='ar'?'المنتج المحضر':'Prep Item'}</th>
      <th>\${currentLang==='ar'?'كود الوصفة':'Recipe'}</th>
      <th>\${currentLang==='ar'?'إنتاج الباتش':'Batch Size'}</th>
      <th>\${currentLang==='ar'?'الطلب النظري':'Theo Demand'}</th>
      <th>\${currentLang==='ar'?'باتشات':'Batches'}</th>
      <th>\${currentLang==='ar'?'إنتاج فعلي':'Output'}</th>
      <th>\${currentLang==='ar'?'الإجراء':'Action'}</th>
      <th style="width:40px"></th>
    </tr></thead><tbody>\`;

  PREP_RAW.forEach((p, k) => {
    const raw = getPrepTheoDemand(p[0], false, null);
    const b = raw > 0 ? (S.roundUp ? Math.ceil(raw/p[2]-1e-9) : raw/p[2]) : 0;
    const isExpanded = expandedPrepIdx === k;
    const isQuinoa = p[0].includes('كينوا');
    const isQuesadillaSeasoning = p[0].includes('كاساديا') && p[0].includes('تتبيل');
    const quinoaBadge = isQuinoa ? '<span style="background:#dcfce7;color:#166534;font-size:10px;padding:2px 6px;border-radius:4px;margin-right:4px;font-weight:bold">60 جم/سلطة</span>' : '';
    const seasoningBadge = isQuesadillaSeasoning ? '<span style="background:#fef3c7;color:#92400e;font-size:10px;padding:2px 6px;border-radius:4px;margin-right:4px;font-weight:bold">15 جم كاساديا + شاورما</span>' : '';

    h += \`<tr onclick="togglePrepAccordion(\${k})" style="cursor:pointer;background:\${isExpanded?'rgba(37,99,235,0.06)':''}">
      <td>\${k+1}</td>
      <td class="name">
        <b>\${esc(p[0])}</b>
        \${quinoaBadge}
        \${seasoningBadge}
      </td>
      <td><span style="font-family:monospace;font-weight:bold;color:#2563eb">\${esc(p[1])}</span></td>
      <td>\${nf(p[2],1)} g</td>
      <td><b>\${nf(raw)} g</b></td>
      <td style="color:#7c3aed;font-weight:bold">\${nf(b,2)}</td>
      <td style="color:#059669;font-weight:bold">\${nf(b*p[2])} g</td>
      <td onclick="event.stopPropagation()">
        <button class="mini" \${userCan("write_production")?"":"disabled"} onclick="recordProduction(\${k},\${b})">＋ \${currentLang==='ar'?'تسجيل الإنتاج':'Post Prod'}</button>
      </td>
      <td style="text-align:center;color:#2563eb;font-weight:bold">\${isExpanded ? '▲' : '▼'}</td>
    </tr>\`;

    if (isExpanded) {
      const details = getPrepItemDetails(p, b > 0 ? b : 1);
      const subIngRows = details.subIngs.map(si => 
        '<tr style="border-bottom:1px solid #f8fafc">' +
          '<td style="text-align:right"><b>' + esc(si.name) + '</b></td>' +
          '<td style="text-align:center">' + nf(si.qtyPerBatch, 1) + ' ' + esc(si.unit) + '</td>' +
          '<td style="text-align:center;color:#2563eb;font-weight:bold;background:#eff6ff">' + nf(si.totalQtyNeeded, 1) + ' ' + esc(si.unit) + '</td>' +
          '<td style="text-align:center">' + money(si.unitPrice) + '</td>' +
          '<td style="text-align:left;font-weight:bold">' + money(si.totalCost) + '</td>' +
        '</tr>'
      ).join('');

      const linkedDishRows = details.linkedDishes.map(ld => {
        const portionStr = ld.portionStd >= 1 ? nf(ld.portionStd, 0) + ' جم' : (ld.portionStd * 1000).toFixed(0) + ' جم';
        const totalDemStr = ld.totalDemand >= 1000 ? (ld.totalDemand / 1000).toFixed(2) + ' كجم' : nf(ld.totalDemand, 0) + ' جم';
        return '<tr style="border-bottom:1px solid #f8fafc">' +
          '<td style="text-align:right"><b>' + esc(ld.name) + '</b> <span style="font-size:10px;color:#94a3b8">(' + esc(ld.code) + ')</span></td>' +
          '<td style="text-align:center;font-weight:bold">' + nf(ld.qty, 0) + ' وجبة</td>' +
          '<td style="text-align:center">' + portionStr + '</td>' +
          '<td style="text-align:left;color:#059669;font-weight:bold">' + totalDemStr + '</td>' +
        '</tr>';
      }).join('');

      h += \`<tr><td colspan="9" style="padding:14px;background:#f8fafc;border-bottom:2px solid #cbd5e1">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
          <!-- 1. Recipe Ingredients Table -->
          <div style="background:#fff;padding:12px;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">
              <h4 style="margin:0;font-size:12px;color:#1e293b;font-weight:bold">🍳 مقادير وخامات الوصفة للتحضير (\${esc(p[1])})</h4>
              <span style="font-size:11px;color:#2563eb;font-weight:bold">\${nf(b>0?b:1,1)} باتش</span>
            </div>
            \${details.subIngs.length === 0 ? '<p style="font-size:11px;color:#94a3b8;margin:8px 0">لا توجد خامات مسجلة</p>' : \`
            <table style="width:100%;font-size:11px;border-collapse:collapse">
              <thead><tr style="color:#64748b;border-bottom:1px solid #e2e8f0"><th style="text-align:right">الخامة</th><th>معيار الباتش</th><th style="color:#2563eb">المطلوب للتحضير</th><th>السعر</th><th>التكلفة</th></tr></thead>
              <tbody>
                \${subIngRows}
                <tr style="font-weight:bold;background:#f1f5f9"><td colspan="4" style="text-align:right">إجمالي تكلفة الخامات</td><td style="text-align:left;color:#2563eb">\${money(details.batchCost)}</td></tr>
              </tbody>
            </table>\`}
          </div>

          <!-- 2. Linked Sold Dishes Table -->
          <div style="background:#fff;padding:12px;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">
              <h4 style="margin:0;font-size:12px;color:#1e293b;font-weight:bold">🛒 الأصناف المباعة المرتبطة بالطلب</h4>
              <span style="font-size:11px;color:#059669;font-weight:bold">\${details.linkedDishes.length} صنف</span>
            </div>
            \${details.linkedDishes.length === 0 ? '<p style="font-size:11px;color:#94a3b8;margin:8px 0">لا توجد مبيعات مسجلة مرتبطة مباشرة</p>' : \`
            <table style="width:100%;font-size:11px;border-collapse:collapse">
              <thead><tr style="color:#64748b;border-bottom:1px solid #e2e8f0"><th style="text-align:right">الوجبة المباعة</th><th>مبيعات أغسطس</th><th>المعيار</th><th>الاستهلاك</th></tr></thead>
              <tbody>
                \${linkedDishRows}
              </tbody>
            </table>\`}
          </div>
        </div>
      </td></tr>\`;
    }
  });

  h += \`</tbody></table></div></div>\`;
  app.innerHTML = h;
}

function recordProduction(k, batches){
  if(!userCan("write_production") || batches <= 0) return;
  const PREP_RAW = PREP_RAW_MASTER;
  const p = PREP_RAW[k];
  if(!p) return;
  let g = S.ing.find(x => x.name === p[0]);
  if(!g){
    if(p[0].includes('عجين بيتزا')) g = S.ing.find(x => x.name.includes('عجين بيتزا') || x.name === 'بورشن عجين بيتزا');
    else if(p[0].includes('صلصه طماطم')) g = S.ing.find(x => x.name.includes('صلصه طماطم') || x.name === 'صلصه طماطم بيتزا');
    else if(p[0].includes('كينوا')) g = S.ing.find(x => x.name.includes('كينوا'));
    else if(p[0].includes('كاساديا') && p[0].includes('تتبيل')) g = S.ing.find(x => x.name.includes('كاساديا') && x.name.includes('تتبيل'));
  }
  const r = S.recipes.find(x => x.code === p[1] || x.id === p[1]);
  if(!r){ alert("لم يتم العثور على وصفة التشغيل: " + p[1]); return; }
  const gId = g ? g.id : (S.ing[0] ? S.ing[0].id : 'ING-001');
  const gUnit = g ? g.unit : 'جرام';
  const gPrice = g ? (g.price || 0) : 0;
  const output = batches * p[2];
  const date = prompt("تأكيد تاريخ الإنتاج (YYYY-MM-DD):", S.dTo) || S.dTo;
  S.ledger.push({ id: uid("TXN"), date, type: "production_in", ingredientId: gId, qty: output, unit: gUnit, price: gPrice, totalCost: gPrice * output, reference: \`PROD-\${r.code}\`, note: \`إنتاج داخلي: \${batches} باتش من (\${p[0]})\`, user: me.username, createdAt: new Date().toISOString() });
  r.items.forEach(it => {
    let ing = S.ing.find(x => x.id === it.ingredientId);
    if(!ing && it.ing) ing = S.ing.find(x => x.name === it.ing);
    const ingId = ing ? ing.id : it.ingredientId;
    const ingUnit = ing ? ing.unit : 'جرام';
    const ingPrice = ing ? (ing.price || 0) : 0;
    const consumed = num(it.std) * batches;
    S.ledger.push({ id: uid("TXN"), date, type: "production_consume", ingredientId: ingId, qty: consumed, unit: ingUnit, price: ingPrice, totalCost: ingPrice * consumed, reference: \`PROD-\${r.code}\`, note: \`استهلاك مكونات لتصنيع (\${p[0]})\`, user: me.username, createdAt: new Date().toISOString() });
  });
  audit("prod_post", \`\${p[0]} | \${batches} batches | \${output} \${gUnit}\`);
  toast("✓ تم ترحيل إنتاج " + batches + " باتش بنجاح وخصم المكونات من المخزن");
  renderTab();
}

let forecastRev = 200000;
let forecastSafetyPct = 5;
let forecastDeductStock = true;
let forecastMethod = 'wma';
let forecastGrowthAdjustment = 3;
let isForecastCalcOpen = true;

function calcHistoricalMonthlyForecast(){
  const liveSales = (Cc && Cc.salesTotal > 0) ? Cc.salesTotal : 569730;
  const s0 = liveSales;
  const s1 = 541000;
  const s2 = 525000;
  const s3 = 498000;

  const growthMultiplier = 1 + (forecastGrowthAdjustment / 100);
  let raw = 0;
  let name = '';
  let eq = '';
  let step = '';
  let desc = '';

  if (forecastMethod === 'sma') {
    raw = ((s0 + s1 + s2) / 3) * growthMultiplier;
    name = currentLang==='ar' ? 'المتوسط المتحرك البسيط (SMA - 3M)' : 'Simple Moving Average (SMA - 3M)';
    eq = 'Forecast = ((Sales_M0 + Sales_M1 + Sales_M2) ÷ 3) × (1 + Growth%)';
    step = \`((\${money(s0,0)} + \${money(s1,0)} + \${money(s2,0)}) ÷ 3) × \${growthMultiplier.toFixed(3)}\`;
    desc = currentLang==='ar' ? 'يحسب متوسط آخر 3 أشهر لتحييد التذبذبات الموسمية المفاجئة.' : 'Averages last 3 months to normalize fluctuations.';
  } else if (forecastMethod === 'trend') {
    const g1 = (s0 - s1) / s1;
    const g2 = (s1 - s2) / s2;
    const g3 = (s2 - s3) / s3;
    const avgGrowth = (g1 + g2 + g3) / 3;
    raw = s0 * (1 + avgGrowth + (forecastGrowthAdjustment / 100));
    name = currentLang==='ar' ? 'نموذج اتجاه النمو الخطي (Linear Trend)' : 'Linear Trend Growth Model';
    eq = 'Forecast = Sales_Current × (1 + Avg_MoM_Growth + Growth%)';
    step = \`\${money(s0,0)} × (1 + \${(avgGrowth*100).toFixed(1)}% + \${forecastGrowthAdjustment}%)\`;
    desc = currentLang==='ar' ? 'يعتمد على متوسط معدل النمو الشهري الممتد من المبيعات السابقة.' : 'Extrapolates average MoM growth.';
  } else if (forecastMethod === 'runrate') {
    const days = 31;
    const daily = s0 / days;
    raw = (daily * 30) * growthMultiplier;
    name = currentLang==='ar' ? 'معدل البيع اليومي الموسّع (Daily Run-Rate)' : 'Daily Run-Rate Projection';
    eq = 'Forecast = (Period_Sales ÷ Period_Days) × 30 × (1 + Growth%)';
    step = \`(\${money(s0,0)} ÷ \${days}) × 30 × \${growthMultiplier.toFixed(3)}\`;
    desc = currentLang==='ar' ? \`يحسب متوسط البيع اليومي الفعلي (\${money(daily,0)} ج.م/يوم) ويوسعه على 30 يوماً.\` : 'Projects daily run-rate over 30 days.';
  } else {
    // WMA (default)
    raw = ((s0 * 0.50) + (s1 * 0.30) + (s2 * 0.20)) * growthMultiplier;
    name = currentLang==='ar' ? 'المتوسط المرجح بالأوزان الحديثة (WMA - 3M)' : 'Weighted Moving Average (WMA - 3M)';
    eq = 'Forecast = ((Sales_M0 × 50%) + (Sales_M1 × 30%) + (Sales_M2 × 20%)) × (1 + Growth%)';
    step = \`((\${money(s0,0)} × 0.5) + (\${money(s1,0)} × 0.3) + (\${money(s2,0)} × 0.2)) × \${growthMultiplier.toFixed(3)}\`;
    desc = currentLang==='ar' ? 'يعطي وزناً أكبر للشهر الأحدث (50%) ثم السابق (30%) والأسبق (20%) ليعكس دقة الزخم الشرائي الأخير.' : 'Weights recent months 50%, 30%, 20% for momentum.';
  }

  const finalVal = Math.round(raw / 500) * 500;
  return { finalVal, name, eq, step, desc };
}

function applyHistoricalForecastToPlan(){
  const res = calcHistoricalMonthlyForecast();
  forecastRev = res.finalVal;
  const inp = document.getElementById("fcRevInput");
  if(inp) inp.value = forecastRev;
  toast(currentLang==='ar' ? '✓ تم اعتماد التوقع واحتساب خطة المشتريات والإنتاج' : 'Forecast applied to plan');
  renderForecast();
}

function updateForecastParams(){
  forecastRev = num(document.getElementById("fcRevInput")?.value || 200000);
  forecastSafetyPct = num(document.getElementById("fcSafetyInput")?.value || 0);
  forecastDeductStock = document.getElementById("fcDeductCheck")?.checked ?? true;
  renderForecast();
}

function renderForecast(){
  const baseSales = Cc.salesTotal || 1;
  const ratio = forecastRev / baseSales;
  const fcRes = calcHistoricalMonthlyForecast();

  // 1. Forecast items
  let totalForecastCost = 0;
  const forecastSalesList = S.sales.map(s => {
    const projectedQty = Math.round(num(s.qty) * ratio);
    const projectedRev = projectedQty * num(s.price);
    const r = s.recipeId ? S.recipes.find(rc => rc.id === s.recipeId) : null;
    const unitCost = r ? r.items.reduce((sum, it) => {
      const g = S.ing.find(ig => ig.id === it.ingredientId);
      const rawYield = num(g?.yield);
      const y = rawYield > 1 ? rawYield / 100 : (rawYield > 0 ? rawYield : 1);
      return sum + ((num(it.std) * (num(g?.price)||0)) / y);
    }, 0) : 0;
    const projectedCost = projectedQty * unitCost;
    totalForecastCost += projectedCost;
    return { ...s, projectedQty, projectedRev, unitCost, projectedCost };
  }).filter(s => s.projectedQty > 0);

  // 2. Explode raw ingredients
  const ingDemand = Array(S.ing.length).fill(0);
  forecastSalesList.forEach(s => {
    if(!s.recipeId) return;
    const r = S.recipes.find(rc => rc.id === s.recipeId);
    if(!r) return;
    r.items.forEach(it => {
      const idx = S.ing.findIndex(g => g.id === it.ingredientId);
      if(idx !== -1) ingDemand[idx] += num(it.std) * s.projectedQty;
    });
  });

  const PREP_RAW = PREP_RAW_MASTER;

  // 3. Kitchen prep batches
  const prepBatches = PREP_RAW.map(p => {
    const d = getPrepTheoDemand(p[0], true, ingDemand);
    const b = d > 0 ? (S.roundUp ? Math.ceil(d / p[2] - 1e-9) : d / p[2]) : 0;
    return { name: p[0], code: p[1], batchSize: p[2], demand: d, batches: b, output: b * p[2] };
  });

  // 4. Procurement Requisition
  let totalOrderCost = 0;
  const poList = S.ing.map((g, i) => {
    const rawReq = ingDemand[i];
    const adjReq = rawReq / (num(g.yield)||1);
    const grossReq = adjReq * (1 + forecastSafetyPct / 100);
    const stock = num(S.end[i]);
    const netOrder = forecastDeductStock ? Math.max(0, grossReq - stock) : grossReq;
    const cost = netOrder * num(g.price);
    totalOrderCost += cost;
    return { id: g.id, name: g.name, unit: g.unit, price: num(g.price), grossReq, stock, netOrder, cost };
  }).filter(item => item.netOrder > 0.001);

  const fcPct = forecastRev > 0 ? (totalForecastCost / forecastRev) * 100 : 0;

  let h = \`<div class="card" style="background:#0f172a;color:#f8fafc;border:1px solid #1e293b;margin-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="color:#38bdf8;margin:0 0 4px 0">🎯 \${currentLang==='ar'?'تخطيط الطلبيات والإنتاج حسب المبيعات المتوقعة (MRP)':'Sales-Driven MRP & Procurement Planning'}</h3>
        <p style="font-size:12px;color:#94a3b8;margin:0">\${currentLang==='ar'?'حساب التوقعات الشهرية للمبيعات بناءً على البيانات التاريخية وتفجير الاحتياجات وباتشات التحضير':'Calculate monthly sales forecast from historical data & explode ingredients and prep batches'}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="hbtn grn" onclick="printMrpPlan()">🖨️ \${currentLang==='ar'?'طباعة خطة التوريد':'Print Plan'}</button>
      </div>
    </div>

    <!-- Historical Forecast Calculator Card -->
    <div style="background:linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);border:1px solid #3730a3;border-radius:12px;padding:16px;margin-top:16px;box-shadow:0 4px 20px rgba(0,0,0,0.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">📈</span>
          <div>
            <h4 style="margin:0;font-size:14px;color:#a5b4fc;font-weight:bold">\${currentLang==='ar'?'حاسبة التوقعات الشهرية الذكية (Historical Sales Forecast)':'Smart Historical Sales Forecast Calculator'}</h4>
            <span style="font-size:11px;color:#94a3b8">\${currentLang==='ar'?'معادلات رياضية قياسية مبنية على تاريخ المبيعات الفعلية':'Standard predictive algorithms based on past performance'}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="mini" style="background:#4338ca;color:#fff;border:none;padding:4px 10px;border-radius:6px;font-weight:bold" onclick="applyHistoricalForecastToPlan()">⚡ \${currentLang==='ar'?'اعتماد التوقع في خطة التوريد':'Apply Forecast to Plan'}</button>
        </div>
      </div>

      <!-- Methods Selector -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin-bottom:12px">
        <button type="button" onclick="forecastMethod='wma';renderForecast()" style="padding:8px;border-radius:8px;border:1px solid \${forecastMethod==='wma'?'#6366f1':'#334155'};background:\${forecastMethod==='wma'?'#312e81':'#1e293b'};color:#fff;cursor:pointer;text-align:right">
          <div style="font-weight:bold;font-size:12px">⚖️ \${currentLang==='ar'?'المتوسط المرجح':'Weighted (WMA)'}</div>
          <div style="font-size:10px;color:#94a3b8">\${currentLang==='ar'?'أوزان (50-30-20%)':'50-30-20% weights'}</div>
        </button>
        <button type="button" onclick="forecastMethod='sma';renderForecast()" style="padding:8px;border-radius:8px;border:1px solid \${forecastMethod==='sma'?'#6366f1':'#334155'};background:\${forecastMethod==='sma'?'#312e81':'#1e293b'};color:#fff;cursor:pointer;text-align:right">
          <div style="font-weight:bold;font-size:12px">📊 \${currentLang==='ar'?'المتوسط البسيط':'Simple (SMA)'}</div>
          <div style="font-size:10px;color:#94a3b8">\${currentLang==='ar'?'متوسط آخر 3 أشهر':'3-Month Average'}</div>
        </button>
        <button type="button" onclick="forecastMethod='trend';renderForecast()" style="padding:8px;border-radius:8px;border:1px solid \${forecastMethod==='trend'?'#6366f1':'#334155'};background:\${forecastMethod==='trend'?'#312e81':'#1e293b'};color:#fff;cursor:pointer;text-align:right">
          <div style="font-weight:bold;font-size:12px">🚀 \${currentLang==='ar'?'اتجاه النمو الخطي':'Linear Trend'}</div>
          <div style="font-size:10px;color:#94a3b8">\${currentLang==='ar'?'معدل التغير الشهري':'MoM Momentum'}</div>
        </button>
        <button type="button" onclick="forecastMethod='runrate';renderForecast()" style="padding:8px;border-radius:8px;border:1px solid \${forecastMethod==='runrate'?'#6366f1':'#334155'};background:\${forecastMethod==='runrate'?'#312e81':'#1e293b'};color:#fff;cursor:pointer;text-align:right">
          <div style="font-weight:bold;font-size:12px">⚡ \${currentLang==='ar'?'معدل البيع اليومي':'Daily Run-Rate'}</div>
          <div style="font-size:10px;color:#94a3b8">\${currentLang==='ar'?'توسيع المتوسط لـ 30 يوم':'Extrapolate 30d'}</div>
        </button>
      </div>

      <!-- Growth Slider & Result -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:12px;margin-bottom:12px">
        <div>
          <label style="font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;margin-bottom:4px">
            <span>\${currentLang==='ar'?'معامل النمو / الحملات التسويقية:':'Growth / Campaign Buffer:'}</span>
            <span style="color:#38bdf8;font-weight:bold">\${forecastGrowthAdjustment > 0 ? '+' : ''}\${forecastGrowthAdjustment}%</span>
          </label>
          <input type="range" min="-15" max="30" step="1" value="\${forecastGrowthAdjustment}" oninput="forecastGrowthAdjustment=Number(this.value);renderForecast()" style="width:100%">
          <div style="display:flex;justify-content:space-between;font-size:9px;color:#64748b;margin-top:2px">
            <span>-15% (موسم هادئ)</span>
            <span>0% (بدون تغيير)</span>
            <span>+30% (موسم أعياد)</span>
          </div>
        </div>
        <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;color:#c7d2fe">\${currentLang==='ar'?'القيمة المقترحة المحسوبة:':'Calculated Forecast:'}</div>
            <div style="font-size:20px;font-weight:900;color:#38bdf8">\${money(fcRes.finalVal)} \${t("cur_unit")}</div>
          </div>
          <button type="button" class="hbtn grn" style="font-weight:bold;padding:6px 12px;font-size:12px" onclick="forecastRev=\${fcRes.finalVal};renderForecast()">
            📥 \${currentLang==='ar'?'تطبيق':'Apply'}
          </button>
        </div>
      </div>

      <!-- Formula Details -->
      <div style="background:rgba(0,0,0,0.25);border-radius:6px;padding:8px 12px;font-size:11px">
        <div style="color:#a5b4fc;font-weight:bold;margin-bottom:2px">\${fcRes.name}</div>
        <div style="color:#94a3b8;margin-bottom:4px">\${fcRes.desc}</div>
        <div style="font-family:monospace;color:#38bdf8;direction:ltr;text-align:left;background:#020617;padding:4px 8px;border-radius:4px">\${fcRes.eq}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-top:16px;background:#1e293b;padding:12px;border-radius:8px">
      <div>
        <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px">\${currentLang==='ar'?'المبيعات المستهدفة:':'Target Revenue:'}</label>
        <div style="display:flex;gap:4px;align-items:center">
          <input type="number" id="fcRevInput" value="\${forecastRev}" onchange="updateForecastParams()" style="width:100%;background:#0f172a;color:#38bdf8;font-weight:bold;border:1px solid #334155;padding:6px 10px;border-radius:6px">
          <span style="font-size:11px;color:#94a3b8">\${t("cur_unit")}</span>
        </div>
      </div>
      <div>
        <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px">\${currentLang==='ar'?'نسبة أمان إضافية (Buffer):':'Safety Buffer %:'}</label>
        <input type="number" id="fcSafetyInput" value="\${forecastSafetyPct}" onchange="updateForecastParams()" style="width:100%;background:#0f172a;color:#fff;border:1px solid #334155;padding:6px 10px;border-radius:6px">
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding-top:16px">
        <input type="checkbox" id="fcDeductCheck" \${forecastDeductStock?"checked":""} onchange="updateForecastParams()">
        <label for="fcDeductCheck" style="font-size:12px;color:#f1f5f9;cursor:pointer">\${currentLang==='ar'?'خصم المخزون الختامي الحالي':'Deduct Current Stock'}</label>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px;margin-top:16px">
      <div style="background:#1e293b;padding:10px;border-radius:8px"><div style="font-size:11px;color:#94a3b8">\${currentLang==='ar'?'المبيعات المتوقعة':'Forecast Sales'}</div><div style="font-size:18px;font-weight:bold;color:#38bdf8">\${money(forecastRev)} \${t("cur_unit")}</div></div>
      <div style="background:#1e293b;padding:10px;border-radius:8px"><div style="font-size:11px;color:#94a3b8">\${currentLang==='ar'?'تكلفة الخامات المتوقعة':'Forecast Raw Cost'}</div><div style="font-size:18px;font-weight:bold;color:#f59e0b">\${money(totalForecastCost)} \${t("cur_unit")}</div></div>
      <div style="background:#1e293b;padding:10px;border-radius:8px"><div style="font-size:11px;color:#94a3b8">Food Cost %</div><div style="font-size:18px;font-weight:bold;color:#10b981">\${nf(fcPct,1)}%</div></div>
      <div style="background:#1e293b;padding:10px;border-radius:8px"><div style="font-size:11px;color:#94a3b8">\${currentLang==='ar'?'قيمة أمر الشراء المقترح':'Procurement Value'}</div><div style="font-size:18px;font-weight:bold;color:#60a5fa">\${money(totalOrderCost)} \${t("cur_unit")}</div></div>
    </div>
  </div>\`;

  // Kitchen prep table
  h += \`<div class="card" style="margin-bottom:16px">
    <h3>🍳 \${currentLang==='ar'?'1. خطة التصنيع والتحضير بالمطبخ لتغطية المبيعات':'1. Kitchen Prep Batches for Target Revenue'}</h3>
    <div class="tblwrap"><table><thead><tr><th>#</th><th class="name">\${currentLang==='ar'?'الصنف المحضر':'Prep Item'}</th><th>\${currentLang==='ar'?'كود الوصفة':'Recipe Code'}</th><th>\${currentLang==='ar'?'حجم الباتش':'Batch Size'}</th><th>\${currentLang==='ar'?'الاحتياج النظري':'Theoretical Demand'}</th><th>\${currentLang==='ar'?'عدد الباتشات المطلوب':'Required Batches'}</th><th>\${currentLang==='ar'?'الكمية الناتجة':'Total Output'}</th></tr></thead><tbody>\`;
  
  prepBatches.forEach((pb, idx) => {
    const isQuinoa = pb.name.includes('كينوا');
    const isQuesadillaSeasoning = pb.name.includes('كاساديا') && pb.name.includes('تتبيل');
    h += \`<tr>
      <td>\${idx+1}</td>
      <td class="name">
        <strong>\${esc(pb.name)}</strong>
        \${isQuinoa ? \`<span style="background:#dcfce7;color:#166534;font-size:10px;padding:2px 6px;border-radius:4px;margin-right:4px;font-weight:bold">60 جم/سلطة</span>\` : ''}
        \${isQuesadillaSeasoning ? \`<span style="background:#fef3c7;color:#92400e;font-size:10px;padding:2px 6px;border-radius:4px;margin-right:4px;font-weight:bold">15 جم كاساديا + شاورما</span>\` : ''}
      </td>
      <td><span style="font-family:monospace;font-weight:bold;color:#2563eb">\${esc(pb.code)}</span></td>
      <td>\${nf(pb.batchSize,0)} g</td>
      <td>\${nf(pb.demand,1)}</td>
      <td style="color:#d97706;font-weight:bold">\${nf(pb.batches,2)}</td>
      <td>\${nf(pb.output,1)}</td>
    </tr>\`;
  });
  h += \`</tbody></table></div></div>\`;

  // Procurement table
  h += \`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3>🛒 \${currentLang==='ar'?'2. أمر الشراء والتوريد المقترح (Requisition / PO)':'2. Procurement & Purchase Order'}</h3>
      <span class="pill">\${poList.length} \${currentLang==='ar'?'صنف مطلوب':'items to buy'}</span>
    </div>
    <div class="tblwrap"><table><thead><tr><th>#</th><th class="name">\${currentLang==='ar'?'المكون الخام':'Raw Ingredient'}</th><th>\${currentLang==='ar'?'الوحدة':'Unit'}</th><th>\${currentLang==='ar'?'سعر الوحدة':'Unit Price'}</th><th>\${currentLang==='ar'?'إجمالي الاحتياج':'Gross Need'}</th><th>\${currentLang==='ar'?'الرصيد الحالي':'Current Stock'}</th><th>\${currentLang==='ar'?'صافي الشراء':'Net Buy Qty'}</th><th>\${currentLang==='ar'?'التكلفة':'Cost'}</th></tr></thead><tbody>\`;

  poList.forEach((it, idx) => {
    h += \`<tr><td>\${idx+1}</td><td class="name"><strong>\${esc(it.name)}</strong></td><td>\${esc(it.unit)}</td><td>\${money(it.price)}</td><td>\${nf(it.grossReq,2)}</td><td>\${nf(it.stock,2)}</td><td class="neg" style="font-weight:bold">\${nf(it.netOrder,2)}</td><td>\${money(it.cost)}</td></tr>\`;
  });
  h += \`</tbody><tfoot><tr class="tot"><td colspan="7">\${currentLang==='ar'?'إجمالي أمر التوريد والشراء':'Total Purchase Order Cost'}</td><td>\${money(totalOrderCost)} \${t("cur_unit")}</td></tr></tfoot></table></div></div>\`;

  app.innerHTML = h;
}

let menuEngGroupFilter = "ALL";
let menuEngQuadFilter = "ALL";
let menuEngSearch = "";

function calcMenuEngData(group = "ALL"){
  let items = [];
  let totalQty = 0;
  let totalRev = 0;
  let totalCost = 0;
  let totalMargin = 0;

  S.sales.forEach((s, idx) => {
    if(group !== "ALL" && (s.group||"") !== group) return;
    const qty = num(s.qty);
    const price = num(s.price);
    
    // Find recipe cost
    let unitCost = 0;
    let hasRecipe = false;
    if(s.recipeId){
      const r = S.recipes.find(x => x.id === s.recipeId || x.code === s.recipeCode);
      if(r){
        unitCost = recipeOne(r);
        hasRecipe = true;
      }
    }

    const margin = price - unitCost;
    const itemRev = price * qty;
    const itemCost = unitCost * qty;
    const itemMargin = margin * qty;
    const marginPct = price > 0 ? (margin / price) * 100 : 0;
    const foodCostPct = price > 0 ? (unitCost / price) * 100 : 0;

    totalQty += qty;
    totalRev += itemRev;
    totalCost += itemCost;
    totalMargin += itemMargin;

    items.push({
      idx,
      code: s.code,
      name: s.name,
      group: s.group || "عام",
      recipeId: s.recipeId,
      recipeCode: s.recipeCode,
      hasRecipe,
      qty,
      price,
      unitCost,
      margin,
      marginPct,
      foodCostPct,
      revenue: itemRev,
      totalCost: itemCost,
      totalMargin: itemMargin,
      popularityShare: 0,
      quadrant: "dog",
      isHighPopularity: false,
      isHighMargin: false
    });
  });

  const itemCount = items.length;
  const avgMargin = totalQty > 0 ? (totalMargin / totalQty) : (itemCount > 0 ? totalMargin / itemCount : 0);
  const avgQty = itemCount > 0 ? (totalQty / itemCount) : 0;
  const hurdleQty = avgQty * 0.7;

  let stars = [], horses = [], puzzles = [], dogs = [];

  items.forEach(it => {
    it.popularityShare = totalQty > 0 ? (it.qty / totalQty) * 100 : 0;
    it.isHighPopularity = it.qty >= hurdleQty;
    it.isHighMargin = it.margin >= avgMargin;

    if(it.isHighPopularity && it.isHighMargin){
      it.quadrant = "star";
      stars.push(it);
    } else if(it.isHighPopularity && !it.isHighMargin){
      it.quadrant = "horse";
      horses.push(it);
    } else if(!it.isHighPopularity && it.isHighMargin){
      it.quadrant = "puzzle";
      puzzles.push(it);
    } else {
      it.quadrant = "dog";
      dogs.push(it);
    }
  });

  return {
    items,
    totalQty,
    totalRev,
    totalCost,
    totalMargin,
    avgMargin,
    avgQty,
    hurdleQty,
    stars,
    horses,
    puzzles,
    dogs,
    overallFoodCostPct: totalRev > 0 ? (totalCost / totalRev) * 100 : 0
  };
}

function renderMenuEng(){
  const isAr = currentLang === 'ar';
  const data = calcMenuEngData(menuEngGroupFilter);
  
  // Extract unique groups
  const groups = Array.from(new Set(S.sales.map(s => s.group || "عام").filter(Boolean)));

  // Filter items for table
  const q = (menuEngSearch || "").toLowerCase().trim();
  const displayItems = data.items.filter(it => {
    if(menuEngQuadFilter !== "ALL" && it.quadrant !== menuEngQuadFilter) return false;
    if(q && !it.name.toLowerCase().includes(q) && !it.code.toLowerCase().includes(q) && !it.group.toLowerCase().includes(q)) return false;
    return true;
  });

  let h = periodBar();

  // Header and filters
  h += \`<div class="card" style="margin-bottom:16px;background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:#f8fafc;border:1px solid #334155">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="color:#fbbf24;margin:0 0 4px 0;font-size:18px">⭐ \${isAr?'تحليل ومصفوفة هندسة المنيو (Menu Engineering Matrix)':'Menu Engineering Matrix & Profitability Analysis'}</h3>
        <p style="font-size:12px;color:#94a3b8;margin:0">\${isAr?'تصنيف الأصناف المباعة إلى (نجم ⭐، حصان عمل 🐎، لغز 🧩، كلب 🐕) لتعظيم الربحية وتوجيه قرارات التسعير':'Categorizing menu items into (Stars, Plowhorses, Puzzles, Dogs) to maximize profitability and pricing strategy'}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="hbtn grn" onclick="printMenuEngineeringReport()">🖨️ \${isAr?'طباعة تقرير هندسة المنيو':'Print Matrix Report'}</button>
      </div>
    </div>

    <!-- Benchmarks Bar -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:10px;margin-top:16px">
      <div style="background:#1e293b;padding:10px 12px;border-radius:8px;border:1px solid #334155">
        <div style="font-size:11px;color:#94a3b8">\${isAr?'إجمالي المبيعات':'Total Sales'}</div>
        <div style="font-size:16px;font-weight:bold;color:#38bdf8">\${money(data.totalRev)} \${t("cur_unit")}</div>
      </div>
      <div style="background:#1e293b;padding:10px 12px;border-radius:8px;border:1px solid #334155">
        <div style="font-size:11px;color:#94a3b8">\${isAr?'إجمالي هامش الربح':'Total Profit Margin'}</div>
        <div style="font-size:16px;font-weight:bold;color:#10b981">\${money(data.totalMargin)} \${t("cur_unit")}</div>
      </div>
      <div style="background:#1e293b;padding:10px 12px;border-radius:8px;border:1px solid #334155">
        <div style="font-size:11px;color:#94a3b8">\${isAr?'متوسط هامش الصنف':'Avg Margin / Unit'}</div>
        <div style="font-size:16px;font-weight:bold;color:#fbbf24">\${money(data.avgMargin)} \${t("cur_unit")}</div>
      </div>
      <div style="background:#1e293b;padding:10px 12px;border-radius:8px;border:1px solid #334155">
        <div style="font-size:11px;color:#94a3b8">\${isAr?'حد الشعبية الأدنى (Hurdle)':'Popularity Hurdle (70%)'}</div>
        <div style="font-size:16px;font-weight:bold;color:#c084fc">\${nf(data.hurdleQty, 1)} \${isAr?'طبق/وحدة':'Units'}</div>
      </div>
    </div>
  </div>\`;

  // 2x2 Matrix Cards
  h += \`<div class="matrix-grid">
    <!-- 1. STARS -->
    <div class="me-quadrant me-star">
      <div>
        <div class="me-header">
          <div class="me-title" style="color:#d97706">⭐ \${isAr?'النجوم (Stars)':'Stars'}</div>
          <span class="badge-star">\${data.stars.length} \${isAr?'أصناف':'items'}</span>
        </div>
        <div style="font-size:11px;color:var(--mut);margin-bottom:8px">\${isAr?'شعبية عالية 🟢 + هامش ربح عالي 🟢':'High Popularity 🟢 + High Margin 🟢'}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:8px">
          <span>\${isAr?'المبيعات:':'Sales:'} \${money(data.stars.reduce((a,b)=>a+b.revenue,0))} \${t("cur_unit")}</span>
          <span style="color:#10b981">\${isAr?'الربح:':'Profit:'} \${money(data.stars.reduce((a,b)=>a+b.totalMargin,0))}</span>
        </div>
        <div class="me-chips">
          \${data.stars.length > 0 ? data.stars.map(s=>\`<span class="me-chip" onclick="filterByItem('\${s.code}')">⭐ \${esc(s.name)} (\${s.qty})</span>\`).join("") : \`<span style="font-size:11px;color:var(--mut)">\${isAr?'لا توجد أصناف حالياً':'No items'}</span>\`}
        </div>
      </div>
      <div class="strategy-box" style="border-color:#fcd34d">
        <strong>💡 \${isAr?'الاستراتيجية المقترحة:':'Strategy:'}</strong> \${isAr?'الحفاظ على أعلى درجات الجودة، وضعها في أفضل أماكن المنيو، عدم تغيير الوصفة، واختبار زيادات طفيفة في السعر.':'Maintain strict quality, place in prime menu spots, never cut portions, test modest price increases.'}
      </div>
    </div>

    <!-- 2. HORSES (Plowhorses) -->
    <div class="me-quadrant me-horse">
      <div>
        <div class="me-header">
          <div class="me-title" style="color:#2563eb">🐎 \${isAr?'أحصنة العمل (Plowhorses)':'Plowhorses'}</div>
          <span class="badge-horse">\${data.horses.length} \${isAr?'أصناف':'items'}</span>
        </div>
        <div style="font-size:11px;color:var(--mut);margin-bottom:8px">\${isAr?'شعبية عالية 🟢 + هامش ربح منخفض 🔴':'High Popularity 🟢 + Low Margin 🔴'}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:8px">
          <span>\${isAr?'المبيعات:':'Sales:'} \${money(data.horses.reduce((a,b)=>a+b.revenue,0))} \${t("cur_unit")}</span>
          <span style="color:#2563eb">\${isAr?'الربح:':'Profit:'} \${money(data.horses.reduce((a,b)=>a+b.totalMargin,0))}</span>
        </div>
        <div class="me-chips">
          \${data.horses.length > 0 ? data.horses.map(s=>\`<span class="me-chip" onclick="filterByItem('\${s.code}')">🐎 \${esc(s.name)} (\${s.qty})</span>\`).join("") : \`<span style="font-size:11px;color:var(--mut)">\${isAr?'لا توجد أصناف حالياً':'No items'}</span>\`}
        </div>
      </div>
      <div class="strategy-box" style="border-color:#93c5fd">
        <strong>💡 \${isAr?'الاستراتيجية المقترحة:':'Strategy:'}</strong> \${isAr?'إعادة هندسة تكلفة الوصفة (BOM) لتقليل تكلفة الخامات، تعديل حجم الحصة قليلاً، أو رفع السعر تدريجياً لزيادة الربح.':'Re-engineer BOM to lower ingredient cost, adjust portion size, or gradually raise price to boost margin.'}
      </div>
    </div>

    <!-- 3. PUZZLES -->
    <div class="me-quadrant me-puzzle">
      <div>
        <div class="me-header">
          <div class="me-title" style="color:#7c3aed">🧩 \${isAr?'الألغاز (Puzzles)':'Puzzles'}</div>
          <span class="badge-puzzle">\${data.puzzles.length} \${isAr?'أصناف':'items'}</span>
        </div>
        <div style="font-size:11px;color:var(--mut);margin-bottom:8px">\${isAr?'شعبية منخفضة 🔴 + هامش ربح عالي 🟢':'Low Popularity 🔴 + High Margin 🟢'}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:8px">
          <span>\${isAr?'المبيعات:':'Sales:'} \${money(data.puzzles.reduce((a,b)=>a+b.revenue,0))} \${t("cur_unit")}</span>
          <span style="color:#7c3aed">\${isAr?'الربح:':'Profit:'} \${money(data.puzzles.reduce((a,b)=>a+b.totalMargin,0))}</span>
        </div>
        <div class="me-chips">
          \${data.puzzles.length > 0 ? data.puzzles.map(s=>\`<span class="me-chip" onclick="filterByItem('\${s.code}')">🧩 \${esc(s.name)} (\${s.qty})</span>\`).join("") : \`<span style="font-size:11px;color:var(--mut)">\${isAr?'لا توجد أصناف حالياً':'No items'}</span>\`}
        </div>
      </div>
      <div class="strategy-box" style="border-color:#d8b4fe">
        <strong>💡 \${isAr?'الاستراتيجية المقترحة:':'Strategy:'}</strong> \${isAr?'تحسين موقعها في قائمة الطعام، تدريب طاقم الخدمة على ترشيحها للزبائن (Upselling)، إعادة تسميتها أو إدراجها في عروض.':'Improve menu visibility, train service staff to recommend/upsell, rename dish, or bundle in combo deals.'}
      </div>
    </div>

    <!-- 4. DOGS -->
    <div class="me-quadrant me-dog">
      <div>
        <div class="me-header">
          <div class="me-title" style="color:#dc2626">🐕 \${isAr?'الكلاب (Dogs)':'Dogs'}</div>
          <span class="badge-dog">\${data.dogs.length} \${isAr?'أصناف':'items'}</span>
        </div>
        <div style="font-size:11px;color:var(--mut);margin-bottom:8px">\${isAr?'شعبية منخفضة 🔴 + هامش ربح منخفض 🔴':'Low Popularity 🔴 + Low Margin 🔴'}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:8px">
          <span>\${isAr?'المبيعات:':'Sales:'} \${money(data.dogs.reduce((a,b)=>a+b.revenue,0))} \${t("cur_unit")}</span>
          <span style="color:#dc2626">\${isAr?'الربح:':'Profit:'} \${money(data.dogs.reduce((a,b)=>a+b.totalMargin,0))}</span>
        </div>
        <div class="me-chips">
          \${data.dogs.length > 0 ? data.dogs.map(s=>\`<span class="me-chip" onclick="filterByItem('\${s.code}')">🐕 \${esc(s.name)} (\${s.qty})</span>\`).join("") : \`<span style="font-size:11px;color:var(--mut)">\${isAr?'لا توجد أصناف حالياً':'No items'}</span>\`}
        </div>
      </div>
      <div class="strategy-box" style="border-color:#fca5a5">
        <strong>💡 \${isAr?'الاستراتيجية المقترحة:':'Strategy:'}</strong> \${isAr?'دراسة حذف الصنف واستبداله بطبق جديد، أو رفع سعره بشكل ملحوظ إذا كان مطلوباً لفئة محددة دون تخزين كميات كبيرة.':'Consider eliminating from menu, replacing with a fresh creation, or raising price if retained for niche guests.'}
      </div>
    </div>
  </div>\`;

  // Controls Toolbar for Details Table
  h += \`<div class="card" style="margin-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <h3 style="margin:0">📋 \${isAr?'تفاصيل تحليل مصفوفة الأصناف':'Detailed Items Performance Matrix'}</h3>
        <span class="pill">\${displayItems.length} \${isAr?'صنف معروض':'items shown'}</span>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <!-- Category / Group Filter -->
        <select id="meGroupSelect" onchange="setMenuEngGroup(this.value)" style="font-size:12px;padding:5px 8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--txt)">
          <option value="ALL" \${menuEngGroupFilter==="ALL"?"selected":""}>\${isAr?'جميع المجموعات (All Groups)':'All Groups'}</option>
          \${groups.map(g=>\`<option value="\${esc(g)}" \${menuEngGroupFilter===g?"selected":""}>\${esc(g)}</option>\`).join("")}
        </select>

        <!-- Quadrant Filter -->
        <select id="meQuadSelect" onchange="setMenuEngQuad(this.value)" style="font-size:12px;padding:5px 8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--txt)">
          <option value="ALL" \${menuEngQuadFilter==="ALL"?"selected":""}>\${isAr?'جميع التصنيفات (All Quadrants)':'All Quadrants'}</option>
          <option value="star" \${menuEngQuadFilter==="star"?"selected":""}>⭐ \${isAr?'النجوم (Stars)':'Stars'}</option>
          <option value="horse" \${menuEngQuadFilter==="horse"?"selected":""}>🐎 \${isAr?'أحصنة العمل (Plowhorses)':'Plowhorses'}</option>
          <option value="puzzle" \${menuEngQuadFilter==="puzzle"?"selected":""}>🧩 \${isAr?'الألغاز (Puzzles)':'Puzzles'}</option>
          <option value="dog" \${menuEngQuadFilter==="dog"?"selected":""}>🐕 \${isAr?'الكلاب (Dogs)':'Dogs'}</option>
        </select>

        <!-- Search Input -->
        <input type="text" id="meSearchInput" placeholder="\${isAr?'بحث عن صنف...':'Search item...'}" value="\${esc(menuEngSearch)}" oninput="setMenuEngSearch(this.value)" style="font-size:12px;padding:5px 8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--txt);width:160px">
      </div>
    </div>

    <div class="tblwrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>SKU</th>
            <th class="name">\${isAr?'الصنف المباع':'Menu Item'}</th>
            <th>\${isAr?'المجموعة':'Group'}</th>
            <th>\${isAr?'الكمية المباعة':'Qty Sold'}</th>
            <th>\${isAr?'نسبة المبيعات':'Mix %'}</th>
            <th>\${isAr?'سعر البيع':'Price'}</th>
            <th>\${isAr?'تكلفة الوحدة':'Unit Cost'}</th>
            <th>\${isAr?'هامش الوحدة':'Margin'}</th>
            <th>\${isAr?'نسبة الهامش':'Margin %'}</th>
            <th>\${isAr?'إجمالي الإيراد':'Total Rev'}</th>
            <th>\${isAr?'إجمالي الربح':'Total Profit'}</th>
            <th>\${isAr?'تصنيف المصفوفة':'Quadrant'}</th>
          </tr>
        </thead>
        <tbody>\`;

  displayItems.forEach((it, i) => {
    let badge = "";
    if(it.quadrant === "star") badge = \`<span class="badge-star">⭐ \${isAr?'نجم':'Star'}</span>\`;
    else if(it.quadrant === "horse") badge = \`<span class="badge-horse">🐎 \${isAr?'حصان عمل':'Plowhorse'}</span>\`;
    else if(it.quadrant === "puzzle") badge = \`<span class="badge-puzzle">🧩 \${isAr?'لغز':'Puzzle'}</span>\`;
    else badge = \`<span class="badge-dog">🐕 \${isAr?'كلب':'Dog'}</span>\`;

    h += \`<tr>
      <td>\${i+1}</td>
      <td class="idcell">\${esc(it.code)}</td>
      <td class="name">
        <b>\${esc(it.name)}</b>
        \${!it.hasRecipe ? \`<span style="color:#ef4444;font-size:10px;display:block">⚠️ \${isAr?'بلا وصفة':'No recipe'}</span>\` : ''}
      </td>
      <td><span class="pill">\${esc(it.group)}</span></td>
      <td><b>\${nf(it.qty)}</b></td>
      <td>\${nf(it.popularityShare, 1)}%</td>
      <td>\${money(it.price)}</td>
      <td>\${money(it.unitCost)}</td>
      <td style="color:#10b981;font-weight:bold">\${money(it.margin)}</td>
      <td>\${nf(it.marginPct, 1)}%</td>
      <td>\${money(it.revenue)}</td>
      <td><b>\${money(it.totalMargin)}</b></td>
      <td>\${badge}</td>
    </tr>\`;
  });

  if(displayItems.length === 0){
    h += \`<tr><td colspan="13" style="padding:20px;text-align:center;color:var(--mut)">\${isAr?'لا توجد أصناف مطابقة للتصفية الحالية':'No matching items found'}</td></tr>\`;
  }

  h += \`</tbody>
      <tfoot>
        <tr class="tot">
          <td colspan="4">\${isAr?'الإجمالي':'Total'}</td>
          <td>\${nf(data.totalQty)}</td>
          <td>100%</td>
          <td colspan="4"></td>
          <td>\${money(data.totalRev)} \${t("cur_unit")}</td>
          <td>\${money(data.totalMargin)} \${t("cur_unit")}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>\`;

  app.innerHTML = h;
}

function setMenuEngGroup(g){
  menuEngGroupFilter = g;
  renderMenuEng();
}

function setMenuEngQuad(q){
  menuEngQuadFilter = q;
  renderMenuEng();
}

function setMenuEngSearch(s){
  menuEngSearch = s;
  renderMenuEng();
}

function filterByItem(code){
  menuEngSearch = code;
  renderMenuEng();
}

// ==================== Expenses & Financial Report (P&L) ====================
let expSubTab = "list"; // 'list' | 'financial' | 'categories'
let expSearchTerm = "";
let expCatFilter = "all";
let expTypeFilter = "all";
let expShowAddForm = false;
let expShowAddCatModal = false;

const DEFAULT_EXPENSE_CATS_FALLBACK = [
  { id: "CAT-EXP-01", name: "مواد غذائية ومخزنية", nameEn: "Food & Ingredients", type: "food", color: "#10b981", active: true, order: 1 },
  { id: "CAT-EXP-02", name: "مواد تعبئة وتغليف", nameEn: "Packaging & Disposables", type: "non_food", color: "#f59e0b", active: true, order: 2 },
  { id: "CAT-EXP-03", name: "منظفات ومستلزمات نظافة", nameEn: "Cleaning Supplies", type: "non_food", color: "#06b6d4", active: true, order: 3 },
  { id: "CAT-EXP-04", name: "صيانة وقطع غيار", nameEn: "Maintenance & Repairs", type: "non_food", color: "#6366f1", active: true, order: 4 },
  { id: "CAT-EXP-05", name: "مرافق (كهرباء / مياه / غاز)", nameEn: "Utilities (Power/Water/Gas)", type: "non_food", color: "#3b82f6", active: true, order: 5 },
  { id: "CAT-EXP-06", name: "نقل وشحن ولوجستيات", nameEn: "Transportation & Delivery", type: "non_food", color: "#8b5cf6", active: true, order: 6 },
  { id: "CAT-EXP-07", name: "تسويق ودعاية وإعلان", nameEn: "Marketing & Advertising", type: "non_food", color: "#ec4899", active: true, order: 7 },
  { id: "CAT-EXP-08", name: "أدوات ومعدات تشغيل", nameEn: "Operating Tools & Smallwares", type: "non_food", color: "#14b8a6", active: true, order: 8 },
  { id: "CAT-EXP-09", name: "مصروفات إدارية وقرطاسية", nameEn: "Administrative & Office", type: "non_food", color: "#64748b", active: true, order: 9 },
  { id: "CAT-EXP-10", name: "مصروفات أخرى متنوعة", nameEn: "Other Miscellaneous", type: "non_food", color: "#94a3b8", active: true, order: 10 }
];

function getActiveExpenseCategories(){
  if(!S.expenseCategories || S.expenseCategories.length === 0){
    S.expenseCategories = JSON.parse(JSON.stringify(DEFAULT_EXPENSE_CATS_FALLBACK));
  }
  return S.expenseCategories;
}

function getActivePaymentMethods(){
  if(!S.paymentMethods || S.paymentMethods.length === 0){
    S.paymentMethods = ["نقدي", "تحويل بنكي", "بطاقة دفع", "آجل", "أخرى"];
  }
  return S.paymentMethods;
}

function setExpSubTab(sub){
  expSubTab = sub;
  renderExpenses();
}

function setExpSearch(val){
  expSearchTerm = val;
  renderExpenses();
}

function setExpCatFilter(val){
  expCatFilter = val;
  renderExpenses();
}

function setExpTypeFilter(val){
  expTypeFilter = val;
  renderExpenses();
}

function toggleAddExpenseForm(){
  expShowAddForm = !expShowAddForm;
  renderExpenses();
}

function toggleAddCategoryModal(){
  expShowAddCatModal = !expShowAddCatModal;
  renderExpenses();
}

function onExpCatChangeInForm(catId){
  const cats = getActiveExpenseCategories();
  const c = cats.find(x => x.id === catId);
  const typeSelect = document.getElementById("expFormType");
  if(typeSelect && c){
    typeSelect.value = c.type;
  }
}

function saveExpenseAction(){
  const date = document.getElementById("expFormDate")?.value || new Date().toISOString().slice(0, 10);
  const ref = document.getElementById("expFormRef")?.value.trim() || ("EXP-" + Date.now().toString().slice(-4));
  const categoryId = document.getElementById("expFormCategory")?.value || "CAT-EXP-02";
  const type = document.getElementById("expFormType")?.value || "non_food";
  const supplier = document.getElementById("expFormSupplier")?.value.trim() || "";
  const paymentMethod = document.getElementById("expFormPayMethod")?.value || "نقدي";
  const total = num(document.getElementById("expFormAmount")?.value);
  const notes = document.getElementById("expFormNotes")?.value.trim() || "";

  if(total <= 0){
    toast(currentLang === 'ar' ? "⚠️ برجاء إدخال مبلغ صحيح أكبر من الصفر" : "⚠️ Please enter a valid positive amount");
    return;
  }

  if(!S.expenses) S.expenses = [];
  const rec = {
    id: uid("EXP"),
    date,
    ref,
    categoryId,
    type,
    supplier,
    paymentMethod,
    total,
    notes,
    createdAt: new Date().toISOString()
  };

  S.expenses.unshift(rec);
  const cats = getActiveExpenseCategories();
  const catObj = cats.find(c => c.id === categoryId);
  audit("expense_add", "إضافة سند مصروف بمبلغ " + money(total) + " ج.م - " + (catObj?.name || categoryId));
  save();
  toast(currentLang === 'ar' ? "✓ تم حفظ سند المصروف بنجاح" : "✓ Expense saved successfully");
  expShowAddForm = false;
  renderExpenses();
}

function delExpense(id){
  if(!confirm(currentLang === 'ar' ? "هل أنت متأكد من حذف هذا السند؟" : "Delete this expense record?")) return;
  if(!S.expenses) S.expenses = [];
  const idx = S.expenses.findIndex(e => e.id === id);
  if(idx >= 0){
    const item = S.expenses[idx];
    S.expenses.splice(idx, 1);
    audit("expense_del", "حذف سند مصروف: " + (item.ref || id) + " بقيمة " + money(item.total));
    save();
    toast(currentLang === 'ar' ? "✓ تم حذف السند" : "✓ Expense deleted");
    renderExpenses();
  }
}

function saveCategoryAction(){
  const name = document.getElementById("newCatName")?.value.trim();
  const nameEn = document.getElementById("newCatNameEn")?.value.trim() || name;
  const type = document.getElementById("newCatType")?.value || "non_food";
  const color = document.getElementById("newCatColor")?.value || "#6366f1";

  if(!name){
    toast(currentLang === 'ar' ? "⚠️ برجاء إدخال اسم التصنيف" : "⚠️ Category name is required");
    return;
  }

  const cats = getActiveExpenseCategories();
  const newCat = {
    id: "CAT-EXP-" + String(cats.length + 1).padStart(2, '0'),
    name,
    nameEn,
    type,
    color,
    active: true,
    order: cats.length + 1
  };
  cats.push(newCat);
  S.expenseCategories = cats;
  audit("cat_add", "إضافة تصنيف مصروفات: " + name);
  save();
  toast(currentLang === 'ar' ? "✓ تم إضافة التصنيف بنجاح" : "✓ Category added");
  expShowAddCatModal = false;
  renderExpenses();
}

function delCategory(id){
  const cats = getActiveExpenseCategories();
  if(cats.length <= 1){
    toast(currentLang === 'ar' ? "⚠️ لا يمكن حذف كافة التصنيفات" : "⚠️ Cannot delete all categories");
    return;
  }
  if(!confirm(currentLang === 'ar' ? "حذف هذا التصنيف؟" : "Delete this category?")) return;
  const idx = cats.findIndex(c => c.id === id);
  if(idx >= 0){
    const rem = cats.splice(idx, 1)[0];
    S.expenseCategories = cats;
    audit("cat_del", "حذف تصنيف مصروفات: " + rem.name);
    save();
    toast(currentLang === 'ar' ? "✓ تم حذف التصنيف" : "✓ Category deleted");
    renderExpenses();
  }
}

function renderExpenses(){
  const isAr = currentLang === 'ar';
  let h = periodBar();

  if(!S.expenses) S.expenses = [];
  const cats = getActiveExpenseCategories();
  const catMap = new Map(cats.map(c => [c.id, c]));

  // Period filtering
  const from = S.dFrom || "";
  const to = S.dTo || "";
  const periodExpenses = S.expenses.filter(e => {
    if(!e.date) return true;
    if(from && e.date < from) return false;
    if(to && e.date > to) return false;
    return true;
  });

  // KPI Calculations
  const salesTotal = Cc.salesTotal || 0;
  const foodCostActual = (Cc.adj && Cc.adj.reduce((sum, v, i) => sum + v * num(S.ing[i]?.price), 0)) || Cc.idealCost || 0;
  const wasteCost = Cc.wasteCost || 0;
  const totalCogs = foodCostActual + wasteCost;
  const grossProfit = salesTotal - totalCogs;
  const grossMarginPct = salesTotal > 0 ? (grossProfit / salesTotal) * 100 : 0;

  const totalExpenses = periodExpenses.reduce((sum, e) => sum + num(e.total), 0);
  const foodExpenses = periodExpenses.filter(e => e.type === 'food').reduce((sum, e) => sum + num(e.total), 0);
  const operExpenses = periodExpenses.filter(e => e.type !== 'food').reduce((sum, e) => sum + num(e.total), 0);

  const netOperatingProfit = grossProfit - operExpenses;
  const netMarginPct = salesTotal > 0 ? (netOperatingProfit / salesTotal) * 100 : 0;

  // Header & Executive KPI Cards
  h += \`<div class="card" style="margin-bottom:12px;padding:14px 18px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
      <div>
        <h3 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px">
          💰 \${isAr ? 'المصروفات والتقرير المالي وقائمة الدخل (P&L Statement)' : 'Expenses & Financial Report (P&L)'}
        </h3>
        <p style="margin:4px 0 0;font-size:12px;color:var(--mut)">
          \${isAr ? 'إدارة فواتير ومصروفات التشغيل، وحساب مجمل وصافي الأرباح وهوامش الربحية التشغيلية للفترة' : 'Operating expense tracking, gross margin, EBITDA, and financial performance'}
        </p>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="hbtn \${expSubTab==='list'?'prim':'card'}" onclick="setExpSubTab('list')">📋 \${isAr?'سجل المصروفات':'Expenses Ledger'}</button>
        <button class="hbtn \${expSubTab==='financial'?'prim':'card'}" onclick="setExpSubTab('financial')">📊 \${isAr?'قائمة الدخل والتقرير المالي':'Financial P&L'}</button>
        <button class="hbtn \${expSubTab==='categories'?'prim':'card'}" onclick="setExpSubTab('categories')">📂 \${isAr?'بنود وتصنيفات المصروفات':'Categories'}</button>
      </div>
    </div>

    <!-- Financial KPI Summary Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:10px">
      <div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--mut);font-weight:600">💵 \${isAr?'إجمالي المبيعات':'Gross Sales'}</div>
        <div style="font-size:17px;font-weight:700;color:#2563eb;margin-top:4px">\${money(salesTotal)} <span style="font-size:11px">\${t('cur_unit')}</span></div>
        <div style="font-size:10px;color:var(--mut);margin-top:2px">\${periodDays()} \${isAr?'يوم':'Days'}</div>
      </div>

      <div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--mut);font-weight:600">🥘 \${isAr?'تكلفة الطعام والهالك':'Total Food & Waste'}</div>
        <div style="font-size:17px;font-weight:700;color:#ea580c;margin-top:4px">\${money(totalCogs)} <span style="font-size:11px">\${t('cur_unit')}</span></div>
        <div style="font-size:10px;color:var(--mut);margin-top:2px">\${salesTotal>0?nf((totalCogs/salesTotal)*100,1)+'%':'—'} \${isAr?'من المبيعات':'of sales'}</div>
      </div>

      <div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--mut);font-weight:600">📦 \${isAr?'مجمل الربح التشغيلي':'Gross Profit'}</div>
        <div style="font-size:17px;font-weight:700;color:\${grossProfit>=0?'#16a34a':'#dc2626'};margin-top:4px">\${money(grossProfit)} <span style="font-size:11px">\${t('cur_unit')}</span></div>
        <div style="font-size:10px;color:\${grossMarginPct>=50?'#16a34a':'#f59e0b'};margin-top:2px">\${nf(grossMarginPct,1)}% \${isAr?'هامش مجمل الربح':'Gross Margin'}</div>
      </div>

      <div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--mut);font-weight:600">🏢 \${isAr?'المصروفات التشغيلية':'Operating Overhead'}</div>
        <div style="font-size:17px;font-weight:700;color:#7c3aed;margin-top:4px">\${money(operExpenses)} <span style="font-size:11px">\${t('cur_unit')}</span></div>
        <div style="font-size:10px;color:var(--mut);margin-top:2px">\${salesTotal>0?nf((operExpenses/salesTotal)*100,1)+'%':'—'} \${isAr?'من المبيعات':'of sales'}</div>
      </div>

      <div style="background:var(--bg);border:1px solid \${netOperatingProfit>=0?'#bbf7d0':'#fecaca'};border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:var(--mut);font-weight:600">💎 \${isAr?'صافي الربح التشغيلي':'Net Operating Profit'}</div>
        <div style="font-size:18px;font-weight:800;color:\${netOperatingProfit>=0?'#15803d':'#b91c1c'};margin-top:4px">\${money(netOperatingProfit)} <span style="font-size:11px">\${t('cur_unit')}</span></div>
        <div style="font-size:10px;font-weight:700;color:\${netMarginPct>=15?'#15803d':netMarginPct>0?'#b45309':'#b91c1c'};margin-top:2px">\${nf(netMarginPct,1)}% \${isAr?'هامش الصافي':'Net Margin'}</div>
      </div>
    </div>
  </div>\`;

  // SUBTAB 1: EXPENSES LIST
  if(expSubTab === 'list'){
    // Filter expenses
    const filtered = periodExpenses.filter(e => {
      if(expCatFilter !== 'all' && e.categoryId !== expCatFilter) return false;
      if(expTypeFilter !== 'all' && e.type !== expTypeFilter) return false;
      if(expSearchTerm){
        const q = expSearchTerm.toLowerCase();
        const sup = (e.supplier || '').toLowerCase();
        const ref = (e.ref || '').toLowerCase();
        const nts = (e.notes || '').toLowerCase();
        const catName = (catMap.get(e.categoryId)?.name || '').toLowerCase();
        if(!sup.includes(q) && !ref.includes(q) && !nts.includes(q) && !catName.includes(q)) return false;
      }
      return true;
    });

    const filteredTotal = filtered.reduce((s, e) => s + num(e.total), 0);

    // List Toolbar
    h += \`<div class="toolbar" style="justify-content:space-between;background:var(--card);padding:10px 14px;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="hbtn grn" onclick="toggleAddExpenseForm()">＋ \${isAr?'إضافة سند صرف جديد':'Add Expense'}</button>
        <input type="text" placeholder="\${isAr?'🔍 بحث في السندات أو المورد...':'Filter expenses...'}" value="\${esc(expSearchTerm)}" oninput="setExpSearch(this.value)" style="width:170px">
        <select onchange="setExpCatFilter(this.value)" style="padding:6px 10px;border-radius:6px;border:1px solid var(--line);background:var(--bg)">
          <option value="all">\${isAr?'📁 كافة التصنيفات':'All Categories'}</option>
          \${cats.map(c => \`<option value="\${c.id}" \${expCatFilter===c.id?'selected':''}>\${esc(c.name)}</option>\`).join('')}
        </select>
        <select onchange="setExpTypeFilter(this.value)" style="padding:6px 10px;border-radius:6px;border:1px solid var(--line);background:var(--bg)">
          <option value="all" \${expTypeFilter==='all'?'selected':''}>\${isAr?'🏷️ كل الأنواع':'All Types'}</option>
          <option value="food" \${expTypeFilter==='food'?'selected':''}>🥘 \${isAr?'مشتريات خامات طعام':'Food & Stock'}</option>
          <option value="non_food" \${expTypeFilter==='non_food'?'selected':''}>🏢 \${isAr?'مصروفات تشغيلية وعامة':'Operating & General'}</option>
        </select>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="pill" style="background:#e0e7ff;color:#3730a3">\${filtered.length} \${isAr?'سند':'Records'}</span>
        <button class="mini prn" onclick="window.print()">🖨️ \${isAr?'طباعة':'Print'}</button>
      </div>
    </div>\`;

    // Add Expense Form
    if(expShowAddForm){
      const payMethods = getActivePaymentMethods();
      h += \`<div class="card" style="margin-bottom:14px;border:2px solid #3b82f6;background:var(--card);padding:14px 18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h4 style="margin:0;color:#2563eb;font-size:15px">📝 \${isAr?'تسجيل سند صرف / فاتورة جديدة':'New Expense Entry'}</h4>
          <button class="modal-close" onclick="toggleAddExpenseForm()">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:12px">
          <div>
            <label class="label">\${isAr?'التاريخ:':'Date:'}</label>
            <input type="date" id="expFormDate" value="\${new Date().toISOString().slice(0, 10)}" style="width:100%">
          </div>
          <div>
            <label class="label">\${isAr?'رقم السند / الفاتورة:':'Ref / Invoice #:'}</label>
            <input type="text" id="expFormRef" placeholder="EXP-\${Date.now().toString().slice(-4)}" style="width:100%">
          </div>
          <div>
            <label class="label">\${isAr?'بند التصنيف:':'Category:'}</label>
            <select id="expFormCategory" onchange="onExpCatChangeInForm(this.value)" style="width:100%;padding:7px;border-radius:6px;border:1px solid var(--line);background:var(--bg)">
              \${cats.map(c => \`<option value="\${c.id}">\${esc(c.name)} (\${c.type==='food'? (isAr?'خامات':'Food'):(isAr?'تشغيل':'Oper')})</option>\`).join('')}
            </select>
          </div>
          <div>
            <label class="label">\${isAr?'طبيعة المصروف:':'Type:'}</label>
            <select id="expFormType" style="width:100%;padding:7px;border-radius:6px;border:1px solid var(--line);background:var(--bg)">
              <option value="non_food">🏢 \${isAr?'مصروف تشغيلي وعام':'Operating Overhead'}</option>
              <option value="food">🥘 \${isAr?'خامات ومشتريات طعام ومخزون':'Food & Stock Purchase'}</option>
            </select>
          </div>
          <div>
            <label class="label">\${isAr?'المورد / الجهة:':'Supplier / Entity:'}</label>
            <input type="text" id="expFormSupplier" placeholder="\${isAr?'اسم المورد أو الشركة':'Supplier name'}" style="width:100%">
          </div>
          <div>
            <label class="label">\${isAr?'طريقة الدفع:':'Payment Method:'}</label>
            <select id="expFormPayMethod" style="width:100%;padding:7px;border-radius:6px;border:1px solid var(--line);background:var(--bg)">
              \${payMethods.map(p => \`<option value="\${p}">\${p}</option>\`).join('')}
            </select>
          </div>
          <div>
            <label class="label">\${isAr?'المبلغ (ج.م):':'Amount (' + t('cur_unit') + '):'}</label>
            <input type="number" id="expFormAmount" step="0.01" min="0" placeholder="0.00" style="width:100%;font-weight:700;color:#2563eb">
          </div>
          <div style="grid-column:1/-1">
            <label class="label">\${isAr?'البيان / ملاحظات الفاتورة:':'Notes & Description:'}</label>
            <input type="text" id="expFormNotes" placeholder="\${isAr?'تفاصيل السند أو بنود المشتريات...':'Voucher notes...'}" style="width:100%">
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="hbtn" onclick="toggleAddExpenseForm()">\${isAr?'إلغاء':'Cancel'}</button>
          <button class="hbtn grn" onclick="saveExpenseAction()">💾 \${isAr?'حفظ السند واعتماده':'Save Expense'}</button>
        </div>
      </div>\`;
    }

    // Expenses Table
    h += \`<div class="card">
      <div class="tblwrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>\${isAr?'التاريخ':'Date'}</th>
              <th>\${isAr?'رقم السند':'Ref #'}</th>
              <th>\${isAr?'التصنيف':'Category'}</th>
              <th>\${isAr?'النوع':'Type'}</th>
              <th>\${isAr?'المورد / الجهة':'Supplier'}</th>
              <th>\${isAr?'طريقة السداد':'Payment'}</th>
              <th>\${isAr?'المبلغ':'Amount'}</th>
              <th class="name">\${isAr?'البيان / الملاحظات':'Notes'}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>\`;

    if(filtered.length === 0){
      h += \`<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--mut)">\${isAr?'لا توجد سندات مصروفات مسجلة في هذه الفترة أو تطابق البحث':'No expenses recorded in this period'}</td></tr>\`;
    } else {
      filtered.forEach((e, idx) => {
        const cat = catMap.get(e.categoryId);
        const catName = cat ? cat.name : (e.categoryId || '—');
        const catColor = cat ? cat.color : '#94a3b8';
        const isFood = e.type === 'food';

        h += \`<tr>
          <td>\${idx + 1}</td>
          <td><b>\${esc(e.date || '—')}</b></td>
          <td><span style="font-family:monospace;font-weight:700">\${esc(e.ref || '—')}</span></td>
          <td>
            <span class="pill" style="background:\${catColor}20;color:\${catColor};border:1px solid \${catColor}40">
              📁 \${esc(catName)}
            </span>
          </td>
          <td>
            <span class="badge \${isFood?'b-yel':'b-blu'}">
              \${isFood ? (isAr?'🥘 خامات ومخزون':'Food'):(isAr?'🏢 تشغيلي':'Operating')}
            </span>
          </td>
          <td>\${esc(e.supplier || '—')}</td>
          <td><span class="pill" style="background:var(--bg);border:1px solid var(--line)">\${esc(e.paymentMethod || 'نقدي')}</span></td>
          <td style="font-weight:700;color:#2563eb">\${money(e.total)} \${t('cur_unit')}</td>
          <td class="name">\${esc(e.notes || '—')}</td>
          <td style="text-align:center">
            <button class="mini red" onclick="delExpense('\${e.id}')" title="\${isAr?'حذف السند':'Delete'}">🗑</button>
          </td>
        </tr>\`;
      });
    }

    h += \`</tbody>
          <tfoot>
            <tr class="tot">
              <td colspan="7">\${isAr?'إجمالي السندات المعروضة':'Total Filtered Expenses'}</td>
              <td style="font-weight:800;color:#2563eb">\${money(filteredTotal)} \${t('cur_unit')}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>\`;
  }

  // SUBTAB 2: FINANCIAL P&L STATEMENT
  else if(expSubTab === 'financial'){
    // Breakdown of operating expenses by category
    const catExpenseSums = {};
    cats.forEach(c => { catExpenseSums[c.id] = 0; });
    periodExpenses.forEach(e => {
      if(e.type !== 'food'){
        catExpenseSums[e.categoryId] = (catExpenseSums[e.categoryId] || 0) + num(e.total);
      }
    });

    h += \`<div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:gap:8px">
        <h4 style="margin:0;font-size:16px;color:#1e3a8a">📊 \${isAr?'قائمة الدخل والأرباح والخسائر التشغيلية (Operating Income Statement - P&L)':'Operating P&L Statement'}</h4>
        <div style="display:flex;gap:6px">
          <button class="mini prn" onclick="window.print()">🖨️ \${isAr?'طباعة التقرير المالي':'Print Financial Report'}</button>
        </div>
      </div>

      <div class="tblwrap">
        <table style="border-collapse:separate;border-spacing:0">
          <thead>
            <tr>
              <th style="text-align:\${isAr?'right':'left'}">\${isAr?'البند المالي / المحاسبي':'Line Item / Financial Element'}</th>
              <th>\${isAr?'النوع / التصنيف':'Classification'}</th>
              <th style="text-align:center">\${isAr?'القيمة (ج.م)':'Amount (' + t('cur_unit') + ')'}</th>
              <th style="text-align:center">\${isAr?'النسبة من المبيعات %':'% of Gross Sales'}</th>
              <th class="name">\${isAr?'المؤشر المعياري والملاحظات':'Benchmark & Status'}</th>
            </tr>
          </thead>
          <tbody>
            <!-- REVENUE -->
            <tr style="background:#eff6ff;font-weight:700">
              <td style="font-size:14px">1. 💵 \${isAr?'إيرادات المبيعات التشغيلية (Gross Sales Revenue)':'Gross Sales Revenue'}</td>
              <td><span class="badge b-blu">\${isAr?'إيراد رئيسي':'Revenue'}</span></td>
              <td style="text-align:center;font-size:15px;color:#1d4ed8">\${money(salesTotal)} \${t('cur_unit')}</td>
              <td style="text-align:center;font-weight:700">100.0%</td>
              <td class="name">\${isAr?'أساس حساب نسب التكاليف وهوامش الأرباح':'Base metric for margin calculation'}</td>
            </tr>

            <!-- DIRECT COSTS (COGS) -->
            <tr>
              <td style="padding-right:24px;font-weight:600">🥘 \${isAr?'تكلفة استهلاك الخامات (Food Cost Theoretical / Direct)':'Food Consumption Cost'}</td>
              <td><span class="badge b-yel">\${isAr?'تكلفة مباشرة':'Direct Cost'}</span></td>
              <td style="text-align:center;color:#ea580c;font-weight:600">\${money(foodCostActual)} \${t('cur_unit')}</td>
              <td style="text-align:center">\${salesTotal>0?nf((foodCostActual/salesTotal)*100,1)+'%':'0.0%'}</td>
              <td class="name">\${(foodCostActual/salesTotal)<=0.35?'<span class="badge b-grn">🟢 ممتاز (ضمن النطاق 28-35%)</span>':'<span class="badge b-red">🔴 مرتفع نسبياً (>35%)</span>'}</td>
            </tr>
            <tr>
              <td style="padding-right:24px;font-weight:600">🗑️ \${isAr?'تكلفة الهالك والتوالف المسجلة (Kitchen Waste Cost)':'Kitchen Waste Cost'}</td>
              <td><span class="badge b-red">\${isAr?'هدر مباشر':'Direct Loss'}</span></td>
              <td style="text-align:center;color:#dc2626;font-weight:600">\${money(wasteCost)} \${t('cur_unit')}</td>
              <td style="text-align:center">\${salesTotal>0?nf((wasteCost/salesTotal)*100,2)+'%':'0.0%'}</td>
              <td class="name">\${(wasteCost/salesTotal)<=0.02?'<span class="badge b-grn">🟢 طبيعي (أقل من 2%)</span>':'<span class="badge b-yel">🟡 يتطلب متابعة دقيقة</span>'}</td>
            </tr>
            <tr style="background:#fff7ed;font-weight:700">
              <td style="font-size:13px">2. 📦 \${isAr?'إجمالي تكلفة البضاعة المباعة (Total COGS)':'Total Cost of Goods Sold'}</td>
              <td><span class="badge b-yel">\${isAr?'إجمالي التكلفة المباشرة':'Total COGS'}</span></td>
              <td style="text-align:center;color:#c2410c;font-size:14px">\${money(totalCogs)} \${t('cur_unit')}</td>
              <td style="text-align:center;color:#c2410c">\${salesTotal>0?nf((totalCogs/salesTotal)*100,1)+'%':'0.0%'}</td>
              <td class="name">\${isAr?'تكلفة الطعام مضافاً إليها هالك التشغيل':'Food cost plus kitchen shrinkage'}</td>
            </tr>

            <!-- GROSS PROFIT -->
            <tr style="background:#f0fdf4;border-top:2px solid #86efac;font-weight:800">
              <td style="font-size:14px;color:#15803d">3. 📈 \${isAr?'مجمل الربح التشغيلي (Gross Operating Profit)':'Gross Operating Profit'}</td>
              <td><span class="badge b-grn">\${isAr?'مجمل الربح':'Gross Margin'}</span></td>
              <td style="text-align:center;font-size:16px;color:#15803d">\${money(grossProfit)} \${t('cur_unit')}</td>
              <td style="text-align:center;font-size:15px;color:#15803d">\${nf(grossMarginPct,1)}%</td>
              <td class="name">\${grossMarginPct>=65?'<span class="badge b-grn">🟢 أداء ممتاز (≥65%)</span>':'<span class="badge b-yel">🟡 هامش متوسط</span>'}</td>
            </tr>

            <!-- OPERATING EXPENSES -->
            <tr style="background:#f8fafc;font-weight:700">
              <td colspan="5" style="color:#475569;font-size:13px;padding:8px 12px">🏢 4. \${isAr?'المصروفات التشغيلية والعمومية (Operating Overhead Breakdown):':'Operating Overhead Breakdown:'}</td>
            </tr>\`;

    cats.filter(c => c.type !== 'food').forEach(c => {
      const amt = catExpenseSums[c.id] || 0;
      const pct = salesTotal > 0 ? (amt / salesTotal) * 100 : 0;
      h += \`<tr>
        <td style="padding-right:28px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:\${c.color};margin-left:6px"></span>
          \${esc(c.name)}
        </td>
        <td><span class="pill" style="background:\${c.color}15;color:\${c.color};font-size:10px">\${esc(c.nameEn || 'Operating')}</span></td>
        <td style="text-align:center;font-weight:600">\${money(amt)} \${t('cur_unit')}</td>
        <td style="text-align:center">\${nf(pct,1)}%</td>
        <td class="name" style="color:var(--mut);font-size:11px">\${isAr?'مصروفات تشغيلية':'Overhead cost'}</td>
      </tr>\`;
    });

    h += \`<tr style="background:#f5f3ff;font-weight:700">
              <td style="font-size:13px">5. 🏢 \${isAr?'إجمالي المصروفات التشغيلية والعمومية (Total Overhead)':'Total Operating Expenses'}</td>
              <td><span class="badge b-blu">\${isAr?'مصروفات تشغيل':'Overhead'}</span></td>
              <td style="text-align:center;color:#6d28d9;font-size:14px">\${money(operExpenses)} \${t('cur_unit')}</td>
              <td style="text-align:center;color:#6d28d9">\${salesTotal>0?nf((operExpenses/salesTotal)*100,1)+'%':'0.0%'}</td>
              <td class="name">\${isAr?'مجموع كافة بنود التشغيل والإدارة غير الغذائية':'All non-food operational overhead'}</td>
            </tr>

            <!-- NET OPERATING PROFIT -->
            <tr style="background:\${netOperatingProfit>=0?'#ecfdf5':'#fef2f2'};border-top:2px solid \${netOperatingProfit>=0?'#10b981':'#ef4444'};border-bottom:2px solid \${netOperatingProfit>=0?'#10b981':'#ef4444'};font-weight:800">
              <td style="font-size:15px;color:\${netOperatingProfit>=0?'#047857':'#b91c1c'}">6. 💎 \${isAr?'صافي الربح التشغيلي للفترة (Net Operating Profit / EBITDA)':'Net Operating Profit (EBITDA)'}</td>
              <td><span class="badge \${netOperatingProfit>=0?'b-grn':'b-red'}">\${isAr?'صافي الربح':'Net Profit'}</span></td>
              <td style="text-align:center;font-size:17px;color:\${netOperatingProfit>=0?'#047857':'#b91c1c'}">\${money(netOperatingProfit)} \${t('cur_unit')}</td>
              <td style="text-align:center;font-size:16px;color:\${netOperatingProfit>=0?'#047857':'#b91c1c'}">\${nf(netMarginPct,1)}%</td>
              <td class="name">\${netMarginPct>=15?'<span class="badge b-grn">🟢 هامش ربح استثماري ممتاز</span>':netMarginPct>0?'<span class="badge b-yel">🟡 ربح إيجابي (قابل للتحسين)</span>':'<span class="badge b-red">🔴 خسارة تشغيلية للفترة</span>'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>\`;
  }

  // SUBTAB 3: EXPENSE CATEGORIES
  else if(expSubTab === 'categories'){
    h += \`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="margin:0;font-size:15px">📂 \${isAr?'دليل بنود وتصنيفات ومراكز تكلفة المصروفات':'Expense Categories & Cost Centers'}</h4>
        <button class="hbtn grn" onclick="toggleAddCategoryModal()">＋ \${isAr?'إضافة تصنيف جديد':'New Category'}</button>
      </div>

      <!-- Add Category Form Modal -->
      \${expShowAddCatModal ? \`
        <div style="border:1px solid #10b981;background:var(--bg);border-radius:10px;padding:12px;margin-bottom:14px">
          <h5 style="margin:0 0 10px;color:#059669">✨ \${isAr?'إضافة بند تصنيف جديد':'Add Category'}</h5>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:10px">
            <div>
              <label class="label">\${isAr?'اسم التصنيف (عربي):':'Category Name (Ar):'}</label>
              <input type="text" id="newCatName" placeholder="\${isAr?'مثال: صيانة تكييفات':'e.g. AC Maintenance'}" style="width:100%">
            </div>
            <div>
              <label class="label">\${isAr?'الاسم بالإنجليزية (اختياري):':'Name (En):'}</label>
              <input type="text" id="newCatNameEn" placeholder="Maintenance" style="width:100%">
            </div>
            <div>
              <label class="label">\${isAr?'طبيعة البند:':'Category Type:'}</label>
              <select id="newCatType" style="width:100%;padding:7px;border-radius:6px;border:1px solid var(--line);background:var(--card)">
                <option value="non_food">🏢 \${isAr?'مصروف تشغيلي وعام':'Operating Overhead'}</option>
                <option value="food">🥘 \${isAr?'مشتريات خامات طعام':'Food & Ingredients'}</option>
              </select>
            </div>
            <div>
              <label class="label">\${isAr?'لون التمييز:':'Color:'}</label>
              <input type="color" id="newCatColor" value="#3b82f6" style="width:100%;height:38px;padding:2px">
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:6px">
            <button class="hbtn" onclick="toggleAddCategoryModal()">\${isAr?'إلغاء':'Cancel'}</button>
            <button class="hbtn grn" onclick="saveCategoryAction()">💾 \${isAr?'حفظ التصنيف':'Save'}</button>
          </div>
        </div>
      \` : ''}

      <div class="tblwrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>\${isAr?'كود التصنيف':'Code'}</th>
              <th class="name">\${isAr?'اسم التصنيف':'Category Name'}</th>
              <th>\${isAr?'الاسم بالإنجليزية':'English Name'}</th>
              <th>\${isAr?'النوع':'Type'}</th>
              <th>\${isAr?'إجمالي المصروف للفترة':'Period Spend'}</th>
              <th>\${isAr?'عدد السندات':'Transactions'}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>\`;

    cats.forEach((c, idx) => {
      const catSpend = periodExpenses.filter(e => e.categoryId === c.id).reduce((s, e) => s + num(e.total), 0);
      const catCount = periodExpenses.filter(e => e.categoryId === c.id).length;
      h += \`<tr>
        <td>\${idx + 1}</td>
        <td><code>\${esc(c.id)}</code></td>
        <td class="name">
          <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:\${c.color};margin-left:6px;vertical-align:middle"></span>
          <b>\${esc(c.name)}</b>
        </td>
        <td>\${esc(c.nameEn || '—')}</td>
        <td><span class="badge \${c.type==='food'?'b-yel':'b-blu'}">\${c.type==='food'?(isAr?'خامات طعام':'Food'):(isAr?'تشغيلي وعام':'Overhead')}</span></td>
        <td style="font-weight:700;color:#2563eb">\${money(catSpend)} \${t('cur_unit')}</td>
        <td><span class="pill">\${catCount}</span></td>
        <td style="text-align:center">
          <button class="mini red" onclick="delCategory('\${c.id}')" title="\${isAr?'حذف التصنيف':'Delete'}">🗑</button>
        </td>
      </tr>\`;
    });

    h += \`</tbody>
        </table>
      </div>
    </div>\`;
  }

  app.innerHTML = h;
}

function renderUsers(){
  let h = \`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>👥 \${currentLang==='ar'?'المستخدمون والصلاحيات':'Users & Permissions'}</h3><button class="hbtn grn" onclick="addUser()">＋ \${currentLang==='ar'?'مستخدم جديد':'Add User'}</button></div><div class="tblwrap"><table><thead><tr><th>\${currentLang==='ar'?'الاسم':'Name'}</th><th>Username</th><th>Password</th><th>\${currentLang==='ar'?'الدور':'Role'}</th><th>\${currentLang==='ar'?'فعال':'Active'}</th><th></th></tr></thead><tbody>\`;
  S.users.forEach((u, i) => {
    h += \`<tr><td><input data-k="uName" data-i="\${i}" value="\${esc(u.name)}"></td><td><input data-k="uUser" data-i="\${i}" value="\${esc(u.username)}"></td><td><input data-k="uPass" data-i="\${i}" value="\${esc(u.password)}"></td><td><select data-k="uRole" data-i="\${i}">\${Object.keys(ROLE_PERMS).map(r=>\`<option value="\${r}" \${r===u.role?"selected":""}>\${r}</option>\`).join("")}</select></td><td><input type="checkbox" data-k="uActive" data-i="\${i}" \${u.active?"checked":""}></td><td><button class="mini red" onclick="delUser(\${i})">🗑</button></td></tr>\`;
  });
  h += \`</tbody></table></div></div>\`;
  app.innerHTML = h;
}

function addUser(){
  S.users.push({ id: uid("USR"), username: "user" + (S.users.length+1), password: "123", name: "مستخدم جديد", role: "viewer", active: true });
  audit("user_add", "إضافة مستخدم");
  renderTab();
}

function delUser(i){
  if(S.users[i].username === "admin"){ toast("لا يمكن حذف admin"); return; }
  if(confirm("حذف المستخدم؟")){ S.users.splice(i,1); audit("user_del", "حذف مستخدم"); renderTab(); }
}

function renderAudit(){
  let h = \`<div class="card"><h3>🕵️ \${currentLang==='ar'?'سجل التدقيق والرقابة':'Audit Trail'}</h3><div class="tblwrap"><table><thead><tr><th>\${currentLang==='ar'?'الوقت':'Timestamp'}</th><th>\${currentLang==='ar'?'المستخدم':'User'}</th><th>\${currentLang==='ar'?'العملية':'Action'}</th><th class="name">\${currentLang==='ar'?'التفاصيل':'Details'}</th></tr></thead><tbody>\`;
  S.audit.slice(0, 500).forEach(a => {
    h += \`<tr><td>\${new Date(a.at).toLocaleString()}</td><td>\${esc(a.user)}</td><td>\${esc(a.action)}</td><td class="name">\${esc(a.details)}</td></tr>\`;
  });
  h += \`</tbody></table></div></div>\`;
  app.innerHTML = h;
}

function renderHelp(){
  app.innerHTML = \`<div class="card"><h3>❓ \${t("tab_help")}</h3><p><b>Food Cost & Inventory Management:</b> All calculations, Yield adjustments, Multi-Language, and user authentication are built directly into this standalone HTML application.</p></div>\`;
}

let rcpPrintSettings = {
  mode: 'cost',
  pageBreak: true,
  signatures: true,
  codes: true
};

function openRecipePrintModal(recipeIndex){
  const isAr = currentLang === 'ar';
  const targetCount = recipeIndex === 'all' ? S.recipes.length : 1;
  const existing = document.getElementById("recipePrintModal");
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = "recipePrintModal";
  modal.className = "modal-backdrop";
  modal.innerHTML = \`<div class="modal-box" style="max-width:540px">
    <div class="modal-hdr">
      <h3>🖨️ \${isAr ? 'إعدادات طباعة بطاقات الوصفات القياسية' : 'Recipe Print Settings'}</h3>
      <button class="modal-close" onclick="closeModal('recipePrintModal')">✕</button>
    </div>
    <div style="margin-bottom:12px;font-size:12px;color:var(--mut)">
      \${isAr ? \`سيتم تحضير وطباعة \${targetCount} وصفة بخط Alexandria القياسي وفق الإعدادات التالية:\` : \`Configuring print layout for \${targetCount} recipe(s): Alexandria font applied.\`}
    </div>
    
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px">
      <div>
        <label style="font-weight:bold;font-size:12px;display:block;margin-bottom:6px">\${isAr ? 'نمط التقرير:' : 'Report Mode:'}</label>
        <div style="display:flex;gap:6px">
          <button type="button" id="rpmBtnCost" class="hbtn \${rcpPrintSettings.mode==='cost'?'prim':''}" style="flex:1" onclick="rcpPrintSettings.mode='cost';document.getElementById('rpmBtnCost').className='hbtn prim';document.getElementById('rpmBtnKit').className='hbtn';">💰 \${isAr ? 'بطاقة تكلفة وأسعار ومؤشرات' : 'Cost & Margins'}</button>
          <button type="button" id="rpmBtnKit" class="hbtn \${rcpPrintSettings.mode==='kitchen'?'prim':''}" style="flex:1" onclick="rcpPrintSettings.mode='kitchen';document.getElementById('rpmBtnKit').className='hbtn prim';document.getElementById('rpmBtnCost').className='hbtn';">👨‍🍳 \${isAr ? 'أمر تشغيل مطبخ (بدون أسعار)' : 'Kitchen Prep Sheet'}</button>
        </div>
      </div>

      <div style="background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;user-select:none">
          <input type="checkbox" id="rpmChkPageBreak" \${rcpPrintSettings.pageBreak?'checked':''} onchange="rcpPrintSettings.pageBreak=this.checked">
          <span>\${isAr ? 'صفحة مستقلة لكل وصفة (A4 Page Break)' : '1 Recipe Per Page (A4 Break)'}</span>
        </label>

        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;user-select:none">
          <input type="checkbox" id="rpmChkSig" \${rcpPrintSettings.signatures?'checked':''} onchange="rcpPrintSettings.signatures=this.checked">
          <span>\${isAr ? 'إظهار خانة التوقيعات والاعتماد (الشيف / التكاليف)' : 'Include Signatures Block'}</span>
        </label>

        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;user-select:none">
          <input type="checkbox" id="rpmChkCode" \${rcpPrintSettings.codes?'checked':''} onchange="rcpPrintSettings.codes=this.checked">
          <span>\${isAr ? 'إظهار كود الصنف (Ingredient ID)' : 'Show Ingredient ID Codes'}</span>
        </label>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">
      <button class="hbtn" onclick="closeModal('recipePrintModal')">\${isAr ? 'إلغاء' : 'Cancel'}</button>
      <button class="hbtn" onclick="executeRecipePrint('\${recipeIndex}', true)">📑 \${isAr ? 'فتح في نافذة مستقلة' : 'Open in New Tab'}</button>
      <button class="hbtn grn" style="font-weight:bold" onclick="executeRecipePrint('\${recipeIndex}', false)">🖨️ \${isAr ? 'طباعة فورية (Print / PDF)' : 'Print / PDF'}</button>
    </div>
  </div>\`;
  document.body.appendChild(modal);
}

function executeRecipePrint(recipeIndex, inNewTab = false){
  closeModal('recipePrintModal');
  const isAr = currentLang === 'ar';
  const targetRecipes = recipeIndex === 'all' ? S.recipes : [S.recipes[Number(recipeIndex)]];

  const isCost = rcpPrintSettings.mode === 'cost';
  const showCode = rcpPrintSettings.codes;
  const isPageBreak = rcpPrintSettings.pageBreak;
  const showSig = rcpPrintSettings.signatures;

  const contentHtml = targetRecipes.map(r => {
    const one = recipeOne(r);
    const sell = recipeSell(r);
    const fc = sell ? (one / sell) * 100 : 0;
    const margin = sell > 0 ? ((sell - one) / sell) * 100 : 0;

    return \`<div class="pcard" style="font-family:'Alexandria',sans-serif!important;\${isPageBreak?'page-break-after:always;':''}margin-bottom:20px">
      <div class="ph" style="background:#0f172a;color:#fff;border-radius:6px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div>
          <span style="background:#fff;color:#0f172a;font-weight:800;padding:2px 8px;border-radius:4px;font-size:11px;margin-left:6px">\${esc(r.code)}</span>
          <span class="t" style="font-size:16px;font-weight:700">🍲 \${esc(r.name)}</span>
        </div>
        <span style="font-size:11px;color:#cbd5e1">ID: \${esc(r.id)}</span>
      </div>

      \${isCost ? \`
        <div class="sum" style="display:flex;gap:10px;background:#f8fafc;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px;justify-content:space-between">
          <div><div class="l" style="font-size:10px;color:#64748b">تكلفة الوحدة:</div><div class="v" style="font-size:14px;font-weight:800;color:#1e3a8a">\${money(one)}</div></div>
          <div><div class="l" style="font-size:10px;color:#64748b">سعر البيع:</div><div class="v" style="font-weight:700">\${sell?money(sell):"—"}</div></div>
          <div><div class="l" style="font-size:10px;color:#64748b">Food Cost:</div><div class="v" style="font-weight:700;color:\${fc>35?'#b45309':'#047857'}">\${sell?nf(fc,1)+"%":"—"}</div></div>
          <div><div class="l" style="font-size:10px;color:#64748b">Margin:</div><div class="v" style="font-weight:700;color:#1e3a8a">\${sell?nf(margin,1)+"%":"—"}</div></div>
        </div>
      \` : \`
        <div style="background:#f1f5f9;padding:6px 12px;border-radius:6px;margin-bottom:10px;font-weight:bold;color:#334155;font-size:11px">
          👨‍🍳 أمر تشغيل وتجهيز مطبخ — معايير الإنتاج القياسية
        </div>
      \`}

      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px">
        <thead>
          <tr style="background:#0f172a;color:#fff">
            <th style="padding:6px;width:30px;text-align:center">#</th>
            <th style="padding:6px;text-align:right">المكون / الخامة</th>
            \${showCode ? '<th style="padding:6px;text-align:center;width:60px">الكود</th>' : ''}
            <th style="padding:6px;text-align:center;width:75px">الكمية</th>
            <th style="padding:6px;text-align:center;width:55px">الوحدة</th>
            \${isCost ? \`
              <th style="padding:6px;text-align:center;width:75px">سعر الوحدة</th>
              <th style="padding:6px;text-align:center;width:75px">التكلفة</th>
            \` : \`
              <th style="padding:6px;text-align:center;width:120px">ملاحظات الاستلام</th>
            \`}
          </tr>
        </thead>
        <tbody>
          \${r.items.map((it,j)=>{
            const g = S.ing.find(x=>x.id===it.ingredientId);
            const p = g?.price || 0;
            const c = num(it.std) * p;
            return \`<tr style="border-bottom:1px solid #e2e8f0;background:\${j%2===0?'#fff':'#f8fafc'}">
              <td style="padding:5px;text-align:center;color:#64748b">\${j+1}</td>
              <td style="padding:5px;font-weight:bold">\${esc(g?.name||it.ing)}</td>
              \${showCode ? \`<td style="padding:5px;text-align:center;color:#64748b">\${esc(it.ingredientId)}</td>\` : ''}
              <td style="padding:5px;text-align:center;font-weight:bold">\${nf(it.std)}</td>
              <td style="padding:5px;text-align:center">\${esc(g?.unit||"")}</td>
              \${isCost ? \`
                <td style="padding:5px;text-align:center">\${money(p)}</td>
                <td style="padding:5px;text-align:center;font-weight:bold">\${money(c)}</td>
              \` : \`
                <td style="padding:5px;text-align:center;color:#cbd5e1">___________</td>
              \`}
            </tr>\`;
          }).join("")}
        </tbody>
        <tfoot>
          <tr style="background:#e2e8f0;font-weight:bold">
            <td colspan="\${showCode ? 5 : 4}" style="padding:6px;text-align:left">\${isCost ? 'إجمالي تكلفة المكونات:' : 'إجمالي عدد المكونات:'}</td>
            <td colspan="\${isCost ? 2 : 1}" style="padding:6px;text-align:center;font-size:12px;color:#1e3a8a">
              \${isCost ? money(one) : \`\${r.items.length} أصناف\`}
            </td>
          </tr>
        </tfoot>
      </table>

      \${showSig ? \`
        <div class="sig" style="display:flex;justify-content:space-between;border-top:1px dashed #94a3b8;padding-top:6px;margin-top:6px;font-size:10px;color:#64748b">
          <div>الشيف التنفيذي: ________________</div>
          <div>مراقبة الجودة والتكاليف: ________________</div>
          <div>مدير التشغيل: ________________</div>
        </div>
      \` : ''}
      <div class="pf" style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:4px">
        <span>D-Deli / بوتشرز — Kitchen Standards</span>
        <span>\${new Date().toLocaleDateString()}</span>
      </div>
    </div>\`;
  }).join("");

  if (inNewTab) {
    const fullHtml = \`<!DOCTYPE html>
<html dir="\${currentLang==='ar'?'rtl':'ltr'}" lang="\${currentLang}">
<head>
  <meta charset="utf-8">
  <title>\${isAr ? 'طباعة الوصفات القياسية' : 'Recipe Standards Print'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Alexandria', sans-serif; background: #fff; color: #0f172a; margin: 20px; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    .toolbar { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 10px 16px; border-radius: 8px; margin-bottom: 20px; }
    button { font-family: 'Alexandria', sans-serif; cursor: pointer; padding: 8px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <span><b>\${targetRecipes.length}</b> \${isAr?'وصفات جاهزة للطباعة':'recipes ready to print'}</span>
    <button onclick="window.print()">🖨️ \${isAr?'طباعة فورية':'Print Now'}</button>
  </div>
  \${contentHtml}
</body>
</html>\`;
    const b = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const u = URL.createObjectURL(b);
    const win = window.open(u, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = u;
      a.target = '_blank';
      a.click();
    }
    return;
  }

  // Direct print via hidden iframe (reliable in all browsers)
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(\`<!DOCTYPE html><html dir="\${currentLang==='ar'?'rtl':'ltr'}" lang="\${currentLang}"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>body{font-family:'Alexandria',sans-serif;margin:10mm;color:#0f172a;}@page{size:A4 portrait;margin:10mm;}</style></head><body>\${contentHtml}</body></html>\`);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch(e) {
          fallbackWindowPrint(contentHtml);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 4000);
        }
      }, 300);
      return;
    }
  } catch(err) {
    console.warn('Iframe print failed, falling back:', err);
  }

  fallbackWindowPrint(contentHtml);
}

function fallbackWindowPrint(html){
  const pa = document.getElementById("printArea");
  if(!pa) return;
  pa.innerHTML = html;
  pa.style.display = "block";
  window.print();
  setTimeout(() => {
    pa.style.display = "none";
    pa.innerHTML = "";
  }, 4000);
}

function printRecipe(i){
  openRecipePrintModal(i);
}

function printAllRecipes(){
  openRecipePrintModal('all');
}

function exportJSON(){
  const b = new Blob([JSON.stringify(S,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = "D-Deli_V3_Backup.json";
  a.click();
  audit("json_export", "تصدير نسخة احتياطية");
}

function importJSON(inp){
  const f = inp.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      S = JSON.parse(r.result);
      save();
      toast("✓ تم الاستيراد بنجاح");
      renderNav();
      renderTab();
    } catch(e) { toast("❌ ملف غير صالح"); }
  };
  r.readAsText(f);
  inp.value = "";
}

function exportXLSX(){
  exportMultiSheetXLSX();
}

function addRecipe(){
  const code = "RCP-" + (100 + S.recipes.length + 1);
  S.recipes.push({ id: uid("RCP"), code, name: "وصفة جديدة", items: [{ ingredientId: S.ing[0].id, ing: S.ing[0].name, std: 1 }] });
  renderTab();
}
function delRecipe(i){ S.recipes.splice(i,1); renderTab(); }
function addRItem(i){ S.recipes[i].items.push({ ingredientId: S.ing[0].id, ing: S.ing[0].name, std: 1 }); renderTab(); }
function delRItem(i,j){ S.recipes[i].items.splice(j,1); renderTab(); }

app.addEventListener("input", e => {
  const d = e.target.dataset;
  if(!d.k) return;
  const i = +d.i;
  if(d.k==="sQty") S.sales[i].qty = e.target.value;
  else if(d.k==="sPrice") S.sales[i].price = e.target.value;
  else if(d.k==="sCode") S.sales[i].code = e.target.value;
  else if(d.k==="sName") S.sales[i].name = e.target.value;
  else if(d.k==="sGrp") S.sales[i].group = e.target.value;
  else if(d.k==="rName") S.recipes[+d.ri].name = e.target.value;
  else if(d.k==="rStd") S.recipes[+d.ri].items[+d.ii].std = e.target.value;
  else if(d.k==="iPrice") S.ing[i].price = e.target.value;
  else if(d.k==="iYield") S.ing[i].yield = Math.min(1, Math.max(0.01, num(e.target.value)));
  else if(d.k==="beg") S.beg[i] = e.target.value;
  else if(d.k==="end") S.end[i] = e.target.value;
  else if(d.k==="uName") S.users[i].name = e.target.value;
  else if(d.k==="uUser") S.users[i].username = e.target.value;
  else if(d.k==="uPass") S.users[i].password = e.target.value;
  else if(d.k==="uRole") S.users[i].role = e.target.value;
  save();
});

app.addEventListener("change", e => {
  const d = e.target.dataset;
  if(!d.k) return;
  if(d.k==="sRec"){ S.sales[+d.i].recipeId = e.target.value; renderTab(); }
  else if(d.k==="rIng"){
    const g = S.ing.find(x => x.id === e.target.value);
    S.recipes[+d.ri].items[+d.ii].ingredientId = e.target.value;
    S.recipes[+d.ri].items[+d.ii].ing = g?.name||"";
    renderTab();
  }
  else if(d.k==="uActive"){ S.users[+d.i].active = e.target.checked; save(); }
});

initTheme();

const savedU = sessionStorage.getItem("ddeli_user");
if(savedU){
  me = S.users.find(x => x.username === savedU && x.active);
  if(me){
    document.getElementById("login").style.display = "none";
    document.getElementById("appx").style.display = "";
    document.getElementById("activeUserBadge").textContent = "👤 " + me.name + " (" + me.role + ")";
    renderNav();
    renderTab();
  }
}
</script>
</body>
</html>`;
}
