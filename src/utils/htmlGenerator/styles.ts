export const HTML_APP_STYLES = `
:root{
  --navy:#1e293b;
  --navy2:#334155;
  --prim:#2563eb;
  --prim-hover:#1d4ed8;
  --bg:#f8fafc;
  --card:#ffffff;
  --line:#e2e8f0;
  --txt:#0f172a;
  --mut:#64748b;
  --inp:#fffbeb;
  --red:#dc2626;
  --redbg:#fee2e2;
  --grn:#16a34a;
  --grnbg:#dcfce7;
  --ylw:#fef3c7;
  --catbg:#f1f5f9;
}

[data-theme="dark"] {
  --navy:#f8fafc;
  --navy2:#94a3b8;
  --prim:#3b82f6;
  --prim-hover:#2563eb;
  --bg:#090d16;
  --card:#0f172a;
  --line:#1e293b;
  --txt:#f1f5f9;
  --mut:#94a3b8;
  --inp:#1e293b;
  --red:#f87171;
  --redbg:rgba(239,68,68,0.18);
  --grn:#4ade80;
  --grnbg:rgba(34,197,94,0.18);
  --ylw:rgba(245,158,11,0.18);
  --catbg:#1e293b;
}

*{box-sizing:border-box;font-family:'Alexandria',sans-serif!important}
body{font-family:'Alexandria',sans-serif!important;margin:0;background:var(--bg);color:var(--txt);font-size:13px;transition:background .2s, color .2s}
[dir="ltr"] body{font-family:'Alexandria',sans-serif!important}
input,select,button,textarea,table,th,td,div,span,h1,h2,h3,h4,p,label{font-family:'Alexandria',sans-serif!important}

/* ===== Login Screen ===== */
#login{position:fixed;inset:0;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#1e3a8a 100%);display:flex;align-items:center;justify-content:center;z-index:999;padding:16px}
.login-box{background:#fff;border-radius:16px;padding:36px;width:100%;max-width:390px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);text-align:center}
[data-theme="dark"] .login-box{background:#0f172a;border:1px solid #334155;color:#f8fafc}
.login-box h2{margin:0 0 6px;color:var(--navy);font-size:20px;font-weight:700}
.login-box .sub{font-size:11px;color:var(--mut);margin-bottom:20px}
.lang-selector{display:flex;gap:6px;justify-content:center;margin-bottom:16px}
.lang-btn{background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;font-weight:600}
[data-theme="dark"] .lang-btn{background:#1e293b;color:#cbd5e1;border-color:#334155}
.lang-btn.active{background:var(--prim);color:#fff;border-color:var(--prim)}
.login-box input{width:100%;margin-bottom:12px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;font-family:inherit;font-size:13px;text-align:center;background:#f8fafc}
[data-theme="dark"] .login-box input{background:#1e293b;color:#fff;border-color:#334155}
.login-box input:focus{outline:2px solid var(--prim);background:#fff}
[data-theme="dark"] .login-box input:focus{background:#0f172a}
.login-err{color:var(--red);font-size:11px;min-height:18px;margin-bottom:8px;font-weight:500}
.login-btn{width:100%;background:var(--prim);color:#fff;border:0;border-radius:10px;padding:11px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:.15s}
.login-btn:hover{background:var(--prim-hover)}
.demo-users{margin-top:20px;border-top:1px dashed var(--line);padding-top:14px;text-align:right}
[dir="ltr"] .demo-users{text-align:left}
.demo-users .title{font-size:10px;color:var(--mut);font-weight:700;margin-bottom:8px;text-transform:uppercase}
.demo-pills{display:flex;flex-wrap:wrap;gap:5px}
.demo-pill{background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px;font-size:10px;cursor:pointer}
[data-theme="dark"] .demo-pill{background:#1e293b;color:#cbd5e1;border-color:#334155}
.demo-pill:hover{background:#e2e8f0}

/* ===== Main Header & App ===== */
header{background:#0f172a;color:#fff;padding:12px 18px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;border-bottom:1px solid #334155}
header h1{font-size:16px;margin:0;flex:1;font-weight:700;display:flex;align-items:center;gap:8px}
.header-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.hbtn{background:#334155;color:#fff;border:1px solid #475569;border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;display:inline-flex;align-items:center;gap:4px;transition:.15s}
.hbtn:hover{background:#475569}
.hbtn.grn{background:#15803d;border-color:#16a34a}.hbtn.grn:hover{background:#166534}
.hbtn.red{background:#b91c1c;border-color:#dc2626}.hbtn.red:hover{background:#991b1b}
.hbtn.prim{background:#2563eb;border-color:#3b82f6}.hbtn.prim:hover{background:#1d4ed8}
.hbtn.purple{background:#7c3aed;border-color:#8b5cf6}.hbtn.purple:hover{background:#6d28d9}
.hbtn.amber{background:#d97706;border-color:#f59e0b}.hbtn.amber:hover{background:#b45309}
.user-badge{background:#1e293b;border:1px solid #475569;border-radius:8px;padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:6px}

nav{display:flex;flex-wrap:wrap;gap:4px;background:#fff;border-bottom:1px solid var(--line);padding:8px 14px;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,0.03)}
[data-theme="dark"] nav{background:#0f172a;border-color:#1e293b}
nav button{border:0;background:transparent;padding:8px 14px;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;color:#475569;font-weight:500;transition:.15s}
[data-theme="dark"] nav button{color:#94a3b8}
nav button:hover{background:#f1f5f9;color:#0f172a}
[data-theme="dark"] nav button:hover{background:#1e293b;color:#f8fafc}
nav button.on{background:#0f172a;color:#fff;font-weight:600}
[data-theme="dark"] nav button.on{background:#2563eb;color:#fff}

main{padding:16px;max-width:100%}
.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin-bottom:16px;box-shadow:0 1px 2px rgba(0,0,0,0.02)}
[data-theme="dark"] .toolbar{background:#0f172a;border-color:#1e293b}
.toolbar .label{font-size:12px;color:var(--mut);font-weight:600}
.toolbar input,.toolbar select{font-family:inherit;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:6px 10px;background:#f8fafc;color:var(--txt)}
[data-theme="dark"] .toolbar input,[data-theme="dark"] .toolbar select{background:#1e293b;border-color:#334155}

.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.03);overflow:visible}
.card h3{margin:0 0 12px;font-size:14px;color:var(--navy);font-weight:700}
.tblwrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px}

.subtabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.subtab-btn{padding:7px 14px;border-radius:8px;border:1px solid var(--line);background:#f8fafc;color:#334155;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:.15s;display:inline-flex;align-items:center;gap:6px}
[data-theme="dark"] .subtab-btn{background:#1e293b;color:#cbd5e1;border-color:#334155}
.subtab-btn:hover{background:#e2e8f0;color:#0f172a}
[data-theme="dark"] .subtab-btn:hover{background:#334155;color:#fff}
.subtab-btn.active{background:#0f172a;color:#fff;border-color:#0f172a}
[data-theme="dark"] .subtab-btn.active{background:#2563eb;color:#fff;border-color:#2563eb}
.subtab-btn.grn.active{background:#15803d;border-color:#15803d;color:#fff}
.subtab-btn.red.active{background:#b91c1c;border-color:#b91c1c;color:#fff}
.subtab-btn.blue.active{background:#2563eb;border-color:#2563eb;color:#fff}

.batch-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#0f172a;color:#fff;padding:10px 16px;border-radius:10px;margin-bottom:12px;font-size:12px}
.batch-stats{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.batch-stat{display:flex;align-items:baseline;gap:6px}
.batch-stat .val{font-size:15px;font-weight:700;color:#38bdf8}
.batch-stat .val.grn{color:#4ade80}
.batch-stat .val.red{color:#f87171}

table{border-collapse:collapse;width:100%;font-size:12px;background:var(--card)}
th{background:#0f172a;color:#fff;padding:8px 10px;position:sticky;top:0;font-weight:600;white-space:nowrap;z-index:10;text-align:center}
td{border:1px solid var(--line);padding:5px 8px;text-align:center;white-space:nowrap}
[dir="rtl"] th.name,[dir="rtl"] td.name{text-align:right}
[dir="ltr"] th.name,[dir="ltr"] td.name{text-align:left}
tbody tr:nth-child(even) td{background:#f8fafc}
[data-theme="dark"] tbody tr:nth-child(even) td{background:#111c30}
tbody tr:hover td{background:#f1f5f9}
[data-theme="dark"] tbody tr:hover td{background:#1e293b}

/* Collapsible Category Header */
tr.cat-hdr-row{background:var(--catbg);cursor:pointer;user-select:none;font-weight:700}
tr.cat-hdr-row:hover{background:#e2e8f0}
[data-theme="dark"] tr.cat-hdr-row:hover{background:#334155}
tr.cat-hdr-row td{padding:8px 12px;text-align:inherit;border-top:2px solid var(--line);border-bottom:2px solid var(--line)}
.cat-toggle-icon{display:inline-block;margin-inline-end:8px;transition:transform .15s}

input[type=number],input[type=text],input[type=date],select{font-family:inherit;font-size:12px;border:1px solid #cbd5e1;border-radius:6px;padding:4px 6px;background:#fff;color:var(--txt)}
[data-theme="dark"] input[type=number],[data-theme="dark"] input[type=text],[data-theme="dark"] input[type=date],[data-theme="dark"] select{background:#0b1120;border-color:#334155;color:#f8fafc}
td input{width:75px;text-align:center}
td input.ed,.ed{background:var(--inp);border-color:#f59e0b}
td input.wide{width:180px;text-align:inherit}
.tot td{background:#0f172a!important;color:#fff;font-weight:700;position:sticky;bottom:0}

.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.02)}
.kpi .lbl{font-size:11px;color:var(--mut);min-height:28px;font-weight:500}
.kpi .val{font-size:20px;font-weight:700;color:var(--navy);margin-top:4px}
.kpi .val.bad{color:var(--red);background:var(--redbg);border-radius:8px;display:inline-block;padding:2px 10px}
.kpi .val.ok{color:var(--grn);background:var(--grnbg);border-radius:8px;display:inline-block;padding:2px 10px}
.kpi .val.warn{color:#b45309;background:var(--ylw);border-radius:8px;display:inline-block;padding:2px 10px}
.badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.b-red{background:var(--redbg);color:var(--red)}.b-yel{background:var(--ylw);color:#b45309}.b-grn{background:var(--grnbg);color:var(--grn)}
.pill{display:inline-block;border-radius:20px;padding:3px 9px;background:#e2e8f0;color:var(--navy);font-size:10px;font-weight:600}
[data-theme="dark"] .pill{background:#1e293b;color:#cbd5e1}
.pos{color:var(--grn);font-weight:600}.neg{color:var(--red);font-weight:600}
.idcell{font-family:monospace;font-size:10px;color:var(--mut);direction:ltr}

.toast{position:fixed;left:20px;bottom:20px;background:#0f172a;color:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:9999;font-size:13px;opacity:0;transform:translateY(10px);transition:.2s}
.toast.show{opacity:1;transform:none}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px}
.rcp{border:1px solid var(--line);border-radius:10px;margin-bottom:12px;overflow:hidden}
.rcp .hd{background:#f1f5f9;padding:8px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px}
[data-theme="dark"] .rcp .hd{background:#1e293b}
.rcp .hd input.nm{flex:1;min-width:200px}
.mini{font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--txt);cursor:pointer;font-family:inherit}
.mini.red{color:var(--red);border-color:#fca5a5}.mini.prn{color:#7c3aed;border-color:#c4b5fd}.mini.exl{color:#16a34a;border-color:#86efac}

/* Modal Styling */
.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.7);display:flex;align-items:center;justify-content:center;z-index:9990;padding:16px;backdrop-filter:blur(2px)}
.modal-box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)}
.modal-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.modal-hdr h3{margin:0;font-size:16px;color:var(--navy);font-weight:700}
.modal-close{background:transparent;border:0;font-size:18px;cursor:pointer;color:var(--mut);padding:4px 8px;border-radius:6px}
.modal-close:hover{background:var(--redbg);color:var(--red)}

/* Print styling */
@media print{
  body{background:#fff!important;color:#000!important}
  #login,header,nav,.card,.kpis,.toolbar,.toast,.modal-backdrop,#appx{display:none!important}
  #printArea{display:block!important;padding:0!important;margin:0!important}
}
#printArea{display:none}

/* Thermal POS 80mm Receipt Style */
.thermal-receipt{
  width:72mm;
  max-width:72mm;
  margin:0 auto;
  padding:4mm;
  background:#fff;
  color:#000;
  font-family:'Alexandria',monospace;
  font-size:11px;
  line-height:1.35;
}
.thermal-receipt .th-hdr{text-align:center;border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:6px}
.thermal-receipt .th-hdr h2{font-size:14px;margin:0 0 4px 0;font-weight:800}
.thermal-receipt table{width:100%;border-collapse:collapse;font-size:10px}
.thermal-receipt th{background:#000;color:#fff;padding:3px 2px;font-size:9px}
.thermal-receipt td{border-bottom:1px solid #ddd;padding:3px 2px}
.thermal-receipt .th-tot{border-top:1px dashed #000;border-bottom:1px dashed #000;padding:6px 0;margin:6px 0;font-weight:bold}
.thermal-receipt .th-sig{margin-top:12px;text-align:center;border-top:1px dashed #666;padding-top:4px;font-size:9px}

/* Standard A4 Print Sheet */
.pcard{width:190mm;margin:0 auto;padding:8mm;border:2px solid #0f172a;border-radius:8px;font-size:12px;page-break-after:always;background:#fff;color:#000}
.pcard .ph{background:#0f172a;color:#fff;border-radius:6px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.pcard .ph .t{font-size:16px;font-weight:700}
.pcard .ph .c{background:#fff;color:#0f172a;border-radius:6px;padding:2px 10px;font-weight:700}
.pcard table{width:100%;border-collapse:collapse;font-size:11px}
.pcard th{background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;padding:6px;position:static}
.pcard td{border:1px solid #e2e8f0;padding:5px 8px;text-align:center}
[dir="rtl"] .pcard td.n{text-align:right}
[dir="ltr"] .pcard td.n{text-align:left}
.pcard .sum{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
.pcard .sum div{border:1px solid var(--line);border-radius:6px;padding:6px;text-align:center}
.pcard .sum .l{font-size:9px;color:var(--mut)}
.pcard .sum .v{font-size:14px;font-weight:700;color:#0f172a}
.pcard .sig{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px;text-align:center;font-size:11px}
.pcard .sig div{border-top:1px solid #94a3b8;padding-top:6px}
.pcard .pf{margin-top:12px;display:flex;justify-content:space-between;font-size:10px;color:var(--mut);border-top:1px dashed #cbd5e1;padding-top:6px}

/* SVG Charts Layout */
.chart-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
.chart-container{width:100%;display:flex;justify-content:center;align-items:center;min-height:220px}
.svg-bar{transition:fill .2s}
.svg-bar:hover{opacity:.85}
.chart-legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px;font-size:11px}
.legend-item{display:flex;align-items:center;gap:5px}
.legend-color{width:10px;height:10px;border-radius:3px;display:inline-block}

/* Menu Engineering Matrix & Quadrants */
.matrix-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:16px}
.me-quadrant{border-radius:14px;padding:14px;border:2px solid var(--line);display:flex;flex-direction:column;justify-content:space-between;transition:transform .15s,box-shadow .15s}
.me-quadrant:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,0.06)}
.me-star{background:rgba(245,158,11,0.08);border-color:#f59e0b}
.me-horse{background:rgba(37,99,235,0.08);border-color:#3b82f6}
.me-puzzle{background:rgba(147,51,234,0.08);border-color:#a855f7}
.me-dog{background:rgba(239,68,68,0.08);border-color:#ef4444}
.me-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.me-title{font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px}
.badge-star{background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:4px}
.badge-horse{background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:4px}
.badge-puzzle{background:#f3e8ff;color:#6b21a8;border:1px solid #d8b4fe;padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:4px}
.badge-dog{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:4px}
[data-theme="dark"] .badge-star{background:rgba(245,158,11,0.25);color:#fde68a;border-color:#d97706}
[data-theme="dark"] .badge-horse{background:rgba(37,99,235,0.25);color:#bfdbfe;border-color:#2563eb}
[data-theme="dark"] .badge-puzzle{background:rgba(147,51,234,0.25);color:#e9d5ff;border-color:#7c3aed}
[data-theme="dark"] .badge-dog{background:rgba(239,68,68,0.25);color:#fecaca;border-color:#dc2626}
.me-chips{display:flex;flex-wrap:wrap;gap:6px;max-height:140px;overflow-y:auto;padding:4px 0}
.me-chip{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:3px 8px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;cursor:pointer}
.me-chip:hover{border-color:var(--prim)}
.strategy-box{background:var(--card);border-radius:8px;padding:8px 10px;font-size:11px;margin-top:10px;border:1px dashed var(--line);color:var(--txt)}
`;
