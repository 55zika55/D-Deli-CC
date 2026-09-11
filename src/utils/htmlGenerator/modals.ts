export const HTML_MODAL_AND_CORE_SCRIPTS = `
// ==================== Theme & Dark Mode ====================
function initTheme(){
  const saved = localStorage.getItem("ddeli_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeButton(saved);
}

function toggleTheme(){
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("ddeli_theme", next);
  updateThemeButton(next);
  toast(next === "dark" ? (currentLang==='ar'?'🌙 تم تفعيل الوضع الليلي':'🌙 Dark mode enabled') : (currentLang==='ar'?'☀️ تم تفعيل الوضع النهاري':'☀️ Light mode enabled'));
}

function updateThemeButton(theme){
  const btn = document.getElementById("btnThemeToggle");
  if(btn){
    btn.innerHTML = theme === "dark" ? "☀️ <span id='lblTheme'>" + (currentLang==='ar'?'نهاري':'Light') + "</span>" : "🌙 <span id='lblTheme'>" + (currentLang==='ar'?'ليلي':'Dark') + "</span>";
  }
}

// ==================== Collapsible Categories ====================
let collapsedCategories = {};

function toggleCatGroup(tableIdOrKey, catName){
  if(catName === undefined){
    const groupKey = tableIdOrKey;
    collapsedCategories[groupKey] = !collapsedCategories[groupKey];
    const isHidden = !!collapsedCategories[groupKey];
    const rows = document.querySelectorAll('.' + groupKey);
    rows.forEach(r => { r.style.display = isHidden ? 'none' : ''; });
    const icon = document.getElementById('icon_' + groupKey);
    if(icon) icon.textContent = isHidden ? '▶' : '▼';
    return;
  }
  const tableId = tableIdOrKey;
  collapsedCategories[catName] = !collapsedCategories[catName];
  const isHidden = !!collapsedCategories[catName];
  const rows = document.querySelectorAll('#' + tableId + ' tbody tr[data-cat="' + catName + '"]');
  rows.forEach(r => {
    r.style.display = isHidden ? 'none' : '';
  });
  const icon = document.getElementById(tableId + '_icon_' + encodeURIComponent(catName));
  if(icon){
    icon.textContent = isHidden ? '▶' : '▼';
  }
}

function collapseAllCategories(tableId){
  if(!tableId){
    document.querySelectorAll('.cat-child-row').forEach(r => { r.style.display = 'none'; });
    document.querySelectorAll('.cat-hdr-row').forEach(hdr => {
      const icon = hdr.querySelector('.cat-toggle-icon');
      if(icon && icon.id){
        const groupKey = icon.id.replace('icon_', '');
        collapsedCategories[groupKey] = true;
        icon.textContent = '▶';
      }
    });
    return;
  }
  const rows = document.querySelectorAll('#' + tableId + ' tbody tr[data-cat]');
  rows.forEach(r => {
    const c = r.getAttribute('data-cat');
    if(c){
      collapsedCategories[c] = true;
      r.style.display = 'none';
    }
  });
  document.querySelectorAll('#' + tableId + ' .cat-toggle-icon').forEach(ic => ic.textContent = '▶');
}

function expandAllCategories(tableId){
  if(!tableId){
    document.querySelectorAll('.cat-child-row').forEach(r => { r.style.display = ''; });
    document.querySelectorAll('.cat-hdr-row').forEach(hdr => {
      const icon = hdr.querySelector('.cat-toggle-icon');
      if(icon && icon.id){
        const groupKey = icon.id.replace('icon_', '');
        collapsedCategories[groupKey] = false;
        icon.textContent = '▼';
      }
    });
    return;
  }
  const rows = document.querySelectorAll('#' + tableId + ' tbody tr[data-cat]');
  rows.forEach(r => {
    const c = r.getAttribute('data-cat');
    if(c){
      collapsedCategories[c] = false;
      r.style.display = '';
    }
  });
  document.querySelectorAll('#' + tableId + ' .cat-toggle-icon').forEach(ic => ic.textContent = '▼');
}

function filterSummaryRows(keyword){
  const q = (keyword || '').trim().toLowerCase();
  const rows = document.querySelectorAll('.cat-child-row');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    if(!q || text.includes(q)){
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

// ==================== POS Receipt & A4 Print Engine ====================
function openPrintModal(){
  const isAr = currentLang === 'ar';
  const modal = document.createElement('div');
  modal.id = "printHubModal";
  modal.className = "modal-backdrop";
  modal.innerHTML = \`<div class="modal-box">
    <div class="modal-hdr">
      <h3>🖨️ \${isAr ? 'مركز الطباعة (طابعات الإيصالات الحرارية POS وورق A4)' : 'Print Hub (POS Thermal & A4 Formats)'}</h3>
      <button class="modal-close" onclick="closeModal('printHubModal')">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:16px">
      <div style="border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--card)">
        <h4 style="margin:0 0 6px;color:#2563eb">🧾 \${isAr?'إيصال تحضيرات المطبخ (80mm)':'Kitchen Prep Ticket (80mm)'}</h4>
        <p style="font-size:11px;color:var(--mut);margin:0 0 10px">\${isAr?'طباعة كارت إرشاد التشغيل وباتشات التحضير لطابعة البون بالمطبخ':'Thermal print for kitchen prep batches and production demands'}</p>
        <button class="hbtn prim" style="width:100%" onclick="closeModal('printHubModal');printThermalPrep()">🖨️ \${isAr?'طباعة بون التحضير':'Print Thermal Prep Ticket'}</button>
      </div>
      <div style="border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--card)">
        <h4 style="margin:0 0 6px;color:#16a34a">📋 \${isAr?'شيت الجرد الميداني (80mm أو A4)':'Physical Count Audit Sheet'}</h4>
        <p style="font-size:11px;color:var(--mut);margin:0 0 10px">\${isAr?'نموذج جاهز لجرد المخزن مع خانات التدوين والتوقيعات':'Print checklist with blank count boxes for inventory auditors'}</p>
        <div style="display:flex;gap:6px">
          <button class="hbtn grn" style="flex:1" onclick="closeModal('printHubModal');printThermalCount()">🧾 \${isAr?'بون 80mm':'80mm POS'}</button>
          <button class="hbtn" style="flex:1" onclick="closeModal('printHubModal');printA4CountSheet()">📄 \${isAr?'شيت A4':'A4 Sheet'}</button>
        </div>
      </div>
      <div style="border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--card)">
        <h4 style="margin:0 0 6px;color:#dc2626">🗑️ \${isAr?'إيصال الهالك وتوالف اليوم (80mm)':'Daily Waste & Spoilage Ticket'}</h4>
        <p style="font-size:11px;color:var(--mut);margin:0 0 10px">\${isAr?'توثيق الهدر مع التكلفة وتوقيع الشيف ومسؤول الجودة':'Thermal receipt for recorded waste & shrinkage'}</p>
        <button class="hbtn red" style="width:100%" onclick="closeModal('printHubModal');printThermalWaste()">🖨️ \${isAr?'طباعة بون الهالك':'Print Thermal Waste'}</button>
      </div>
      <div style="border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--card)">
        <h4 style="margin:0 0 6px;color:#7c3aed">📖 \${isAr?'كتيب الوصفات ومعايير الـ BOM':'Standard Recipes Manual (A4)'}</h4>
        <p style="font-size:11px;color:var(--mut);margin:0 0 10px">\${isAr?'طباعة جميع بطاقات الوصفات القياسية ككتيب A4':'Print standard operational recipes book in A4 format'}</p>
        <button class="hbtn purple" style="width:100%" onclick="closeModal('printHubModal');printAllRecipes()">🖨️ \${isAr?'طباعة كتيب الوصفات':'Print Recipes Book'}</button>
      </div>
      <div style="border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--card)">
        <h4 style="margin:0 0 6px;color:#d97706">⭐ \${isAr?'تقرير مصفوفة هندسة المنيو (A4)':'Menu Engineering Matrix Report (A4)'}</h4>
        <p style="font-size:11px;color:var(--mut);margin:0 0 10px">\${isAr?'طباعة تقرير شامل لتصنيف الأصناف وهوامش الربح والأداء':'Print comprehensive 4-quadrant menu profitability audit report'}</p>
        <button class="hbtn" style="width:100%;background:#f59e0b;color:#000;font-weight:700" onclick="closeModal('printHubModal');printMenuEngineeringReport()">🖨️ \${isAr?'طباعة تقرير هندسة المنيو':'Print Menu Eng Matrix'}</button>
      </div>
    </div>
  </div>\`;
  document.body.appendChild(modal);
}

function printMenuEngineeringReport(){
  const isAr = currentLang === 'ar';
  const data = typeof calcMenuEngData === 'function' ? calcMenuEngData("ALL") : null;
  if(!data || !data.items || data.items.length === 0) {
    toast(isAr ? '⚠️ لا توجد مبيعات مسجلة لحساب هندسة المنيو' : 'No sales data to generate report');
    return;
  }

  const pa = document.getElementById("printArea");
  if(!pa) return;

  const starsRev = data.stars.reduce((a,b)=>a+b.revenue,0);
  const starsProf = data.stars.reduce((a,b)=>a+b.totalMargin,0);
  const horsesRev = data.horses.reduce((a,b)=>a+b.revenue,0);
  const horsesProf = data.horses.reduce((a,b)=>a+b.totalMargin,0);
  const puzzlesRev = data.puzzles.reduce((a,b)=>a+b.revenue,0);
  const puzzlesProf = data.puzzles.reduce((a,b)=>a+b.totalMargin,0);
  const dogsRev = data.dogs.reduce((a,b)=>a+b.revenue,0);
  const dogsProf = data.dogs.reduce((a,b)=>a+b.totalMargin,0);

  pa.innerHTML = \`<div class="pcard" style="width:100%;max-width:210mm;border:none;padding:8px;margin:0 auto">
    <!-- Header -->
    <div style="background:#0f172a;color:#fff;border-radius:8px;padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h2 style="margin:0 0 4px 0;font-size:17px;color:#fbbf24">🍽️ D-Deli / بوتشرز — \${isAr ? 'تقرير مصفوفة وتحليل هندسة المنيو' : 'Menu Engineering Matrix Report'}</h2>
        <div style="font-size:11px;color:#cbd5e1">\${isAr ? 'تقييم شعبية وربحية الأصناف (Stars, Plowhorses, Puzzles, Dogs) وتوجيه استراتيجيات التسعير' : 'Profitability, Popularity & Contribution Margin Analysis'}</div>
      </div>
      <div style="text-align:inherit;font-size:10px;color:#94a3b8">
        <div><b>\${isAr ? 'الفترة:' : 'Period:'}</b> \${S.dFrom} ~ \${S.dTo}</div>
        <div><b>\${isAr ? 'التاريخ:' : 'Date:'}</b> \${new Date().toLocaleDateString()}</div>
        <div><b>\${isAr ? 'المستخدم:' : 'User:'}</b> \${esc(me?.name || 'Admin')}</div>
      </div>
    </div>

    <!-- Benchmarks & Totals Grid -->
    <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:6px;margin-bottom:12px">
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</div>
        <div style="font-size:13px;font-weight:bold;color:#0284c7">\${money(data.totalRev)} \${t("cur_unit")}</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'إجمالي الأرباح' : 'Total Gross Profit'}</div>
        <div style="font-size:13px;font-weight:bold;color:#16a34a">\${money(data.totalMargin)} \${t("cur_unit")}</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'متوسط هامش الصنف' : 'Avg CM / Unit'}</div>
        <div style="font-size:13px;font-weight:bold;color:#d97706">\${money(data.avgMargin)} \${t("cur_unit")}</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'حد الشعبية (70%)' : 'Popularity Hurdle'}</div>
        <div style="font-size:13px;font-weight:bold;color:#9333ea">\${nf(data.hurdleQty, 1)} \${isAr ? 'وحدة' : 'Units'}</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'Food Cost % العام' : 'Overall Food Cost %'}</div>
        <div style="font-size:13px;font-weight:bold;color:#0f172a">\${nf(data.overallFoodCostPct, 1)}%</div>
      </div>
    </div>

    <!-- 4 Quadrants Matrix Cards -->
    <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;margin-bottom:12px">
      <!-- 1. STARS -->
      <div style="border:1.5px solid #f59e0b;border-radius:6px;padding:8px;background:#fffbeb">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <b style="color:#b45309;font-size:12px">⭐ \${isAr ? 'النجوم (Stars)' : 'Stars'} (\${data.stars.length})</b>
          <span style="font-size:9px;background:#fde68a;color:#78350f;padding:1px 5px;border-radius:10px;font-weight:bold">\${isAr ? 'شعبية ↑ • ربح ↑' : 'High Pop • High CM'}</span>
        </div>
        <div style="font-size:10px;margin-bottom:3px;display:flex;justify-content:space-between">
          <span>\${isAr ? 'المبيعات:' : 'Sales:'} <b>\${money(starsRev)}</b></span>
          <span style="color:#16a34a">\${isAr ? 'الأرباح:' : 'Profit:'} <b>\${money(starsProf)}</b></span>
        </div>
        <div style="font-size:9.5px;color:#475569;margin-bottom:3px">
          \${data.stars.length > 0 ? data.stars.map(s => \`• <b>\${esc(s.name)}</b> (\${s.qty})\`).join('  ') : (isAr ? 'لا توجد أصناف' : 'No items')}
        </div>
        <div style="font-size:8.5px;color:#92400e;background:#fef3c7;padding:3px 5px;border-radius:4px">
          <b>💡 \${isAr ? 'الاستراتيجية:' : 'Strategy:'}</b> \${isAr ? 'الحفاظ على الجودة وثبات الوصفة، موضع بارز بالمنيو، اختبار رفع طفيف للسعر.' : 'Maintain quality, prime menu spot, test modest price increase.'}
        </div>
      </div>

      <!-- 2. HORSES -->
      <div style="border:1.5px solid #3b82f6;border-radius:6px;padding:8px;background:#eff6ff">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <b style="color:#1d4ed8;font-size:12px">🐎 \${isAr ? 'أحصنة العمل (Plowhorses)' : 'Plowhorses'} (\${data.horses.length})</b>
          <span style="font-size:9px;background:#bfdbfe;color:#1e3a8a;padding:1px 5px;border-radius:10px;font-weight:bold">\${isAr ? 'شعبية ↑ • ربح ↓' : 'High Pop • Low CM'}</span>
        </div>
        <div style="font-size:10px;margin-bottom:3px;display:flex;justify-content:space-between">
          <span>\${isAr ? 'المبيعات:' : 'Sales:'} <b>\${money(horsesRev)}</b></span>
          <span style="color:#1d4ed8">\${isAr ? 'الأرباح:' : 'Profit:'} <b>\${money(horsesProf)}</b></span>
        </div>
        <div style="font-size:9.5px;color:#475569;margin-bottom:3px">
          \${data.horses.length > 0 ? data.horses.map(s => \`• <b>\${esc(s.name)}</b> (\${s.qty})\`).join('  ') : (isAr ? 'لا توجد أصناف' : 'No items')}
        </div>
        <div style="font-size:8.5px;color:#1e40af;background:#dbeafe;padding:3px 5px;border-radius:4px">
          <b>💡 \${isAr ? 'الاستراتيجية:' : 'Strategy:'}</b> \${isAr ? 'إعادة هندسة التكلفة (BOM) لتقليل تكلفة الخامات، تعديل حجم الحصة، أو رفع السعر.' : 'Re-engineer BOM to reduce costs, adjust portions, or raise price.'}
        </div>
      </div>

      <!-- 3. PUZZLES -->
      <div style="border:1.5px solid #a855f7;border-radius:6px;padding:8px;background:#faf5ff">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <b style="color:#7e22ce;font-size:12px">🧩 \${isAr ? 'الألغاز (Puzzles)' : 'Puzzles'} (\${data.puzzles.length})</b>
          <span style="font-size:9px;background:#e9d5ff;color:#581c87;padding:1px 5px;border-radius:10px;font-weight:bold">\${isAr ? 'شعبية ↓ • ربح ↑' : 'Low Pop • High CM'}</span>
        </div>
        <div style="font-size:10px;margin-bottom:3px;display:flex;justify-content:space-between">
          <span>\${isAr ? 'المبيعات:' : 'Sales:'} <b>\${money(puzzlesRev)}</b></span>
          <span style="color:#7e22ce">\${isAr ? 'الأرباح:' : 'Profit:'} <b>\${money(puzzlesProf)}</b></span>
        </div>
        <div style="font-size:9.5px;color:#475569;margin-bottom:3px">
          \${data.puzzles.length > 0 ? data.puzzles.map(s => \`• <b>\${esc(s.name)}</b> (\${s.qty})\`).join('  ') : (isAr ? 'لا توجد أصناف' : 'No items')}
        </div>
        <div style="font-size:8.5px;color:#6b21a8;background:#f3e8ff;padding:3px 5px;border-radius:4px">
          <b>💡 \${isAr ? 'الاستراتيجية:' : 'Strategy:'}</b> \${isAr ? 'تحسين الترويج والـ Upselling، تغيير موضع الصنف بالمنيو، إدراجه في عروض مجمعة.' : 'Reposition on menu, train staff for upselling, or create combo bundles.'}
        </div>
      </div>

      <!-- 4. DOGS -->
      <div style="border:1.5px solid #ef4444;border-radius:6px;padding:8px;background:#fef2f2">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <b style="color:#b91c1c;font-size:12px">🐕 \${isAr ? 'الكلاب / المتعثرة (Dogs)' : 'Dogs'} (\${data.dogs.length})</b>
          <span style="font-size:9px;background:#fecaca;color:#7f1d1d;padding:1px 5px;border-radius:10px;font-weight:bold">\${isAr ? 'شعبية ↓ • ربح ↓' : 'Low Pop • Low CM'}</span>
        </div>
        <div style="font-size:10px;margin-bottom:3px;display:flex;justify-content:space-between">
          <span>\${isAr ? 'المبيعات:' : 'Sales:'} <b>\${money(dogsRev)}</b></span>
          <span style="color:#b91c1c">\${isAr ? 'الأرباح:' : 'Profit:'} <b>\${money(dogsProf)}</b></span>
        </div>
        <div style="font-size:9.5px;color:#475569;margin-bottom:3px">
          \${data.dogs.length > 0 ? data.dogs.map(s => \`• <b>\${esc(s.name)}</b> (\${s.qty})\`).join('  ') : (isAr ? 'لا توجد أصناف' : 'No items')}
        </div>
        <div style="font-size:8.5px;color:#991b1b;background:#fee2e2;padding:3px 5px;border-radius:4px">
          <b>💡 \${isAr ? 'الاستراتيجية:' : 'Strategy:'}</b> \${isAr ? 'إلغاء الصنف تدريجياً، رفع السعر لتعويض الهامش، أو استبداله بمنتج جديد أكثر جاذبية.' : 'Phase out item, increase price, or replace with more attractive items.'}
        </div>
      </div>
    </div>

    <!-- Detailed Table -->
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:12px">
      <thead>
        <tr style="background:#0f172a;color:#fff">
          <th style="padding:5px 3px;border:1px solid #334155;width:24px">#</th>
          <th style="padding:5px 3px;border:1px solid #334155;width:55px">SKU</th>
          <th style="padding:5px 5px;border:1px solid #334155;text-align:inherit">\${isAr ? 'اسم الصنف' : 'Item Name'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'المجموعة' : 'Group'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'المباع' : 'Qty'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'حصة%' : 'Mix%'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'سعر البيع' : 'Price'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'التكلفة' : 'Cost'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'هامش CM' : 'Margin'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'FC %' : 'FC %'}</th>
          <th style="padding:5px 3px;border:1px solid #334155">\${isAr ? 'إجمالي الربح' : 'Total Profit'}</th>
          <th style="padding:5px 3px;border:1px solid #334155;width:70px">\${isAr ? 'التصنيف' : 'Quadrant'}</th>
        </tr>
      </thead>
      <tbody>
        \${data.items.map((it, idx) => {
          let qBadge = '';
          if(it.quadrant === 'star') qBadge = \`<span style="color:#b45309;font-weight:bold">⭐ \${isAr ? 'نجم' : 'Star'}</span>\`;
          else if(it.quadrant === 'horse') qBadge = \`<span style="color:#1d4ed8;font-weight:bold">🐎 \${isAr ? 'حصان' : 'Horse'}</span>\`;
          else if(it.quadrant === 'puzzle') qBadge = \`<span style="color:#7e22ce;font-weight:bold">🧩 \${isAr ? 'لغز' : 'Puzzle'}</span>\`;
          else qBadge = \`<span style="color:#b91c1c;font-weight:bold">🐕 \${isAr ? 'كلب' : 'Dog'}</span>\`;

          return \`<tr style="border-bottom:1px solid #e2e8f0;background:\${idx%2===0?'#fff':'#f8fafc'}">
            <td style="padding:4px 2px;text-align:center">\${idx+1}</td>
            <td style="padding:4px 2px;text-align:center;font-family:monospace;font-size:9px">\${esc(it.code)}</td>
            <td style="padding:4px 5px;text-align:inherit"><b>\${esc(it.name)}</b></td>
            <td style="padding:4px 3px;text-align:center">\${esc(it.group)}</td>
            <td style="padding:4px 3px;text-align:center;font-weight:bold">\${nf(it.qty)}</td>
            <td style="padding:4px 3px;text-align:center">\${nf(it.popularityShare, 1)}%</td>
            <td style="padding:4px 3px;text-align:center">\${money(it.price)}</td>
            <td style="padding:4px 3px;text-align:center">\${money(it.unitCost)}</td>
            <td style="padding:4px 3px;text-align:center;color:#16a34a;font-weight:bold">\${money(it.margin)}</td>
            <td style="padding:4px 3px;text-align:center">\${nf(it.foodCostPct, 1)}%</td>
            <td style="padding:4px 3px;text-align:center;font-weight:bold">\${money(it.totalMargin)}</td>
            <td style="padding:4px 3px;text-align:center">\${qBadge}</td>
          </tr>\`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#f1f5f9;font-weight:bold;border-top:2px solid #0f172a">
          <td colspan="4" style="padding:5px;text-align:inherit">\${isAr ? 'الإجمالي العام' : 'Total Summary'}</td>
          <td style="padding:5px;text-align:center">\${nf(data.totalQty)}</td>
          <td style="padding:5px;text-align:center">100%</td>
          <td colspan="4"></td>
          <td style="padding:5px;text-align:center;color:#16a34a">\${money(data.totalMargin)} \${t("cur_unit")}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <!-- Signatures Footer -->
    <div class="sig" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-top:14px;text-align:center;font-size:10.5px">
      <div style="border-top:1px solid #94a3b8;padding-top:5px"><b>\${isAr ? 'مراقب التكاليف (Cost Controller)' : 'Cost Controller'}</b></div>
      <div style="border-top:1px solid #94a3b8;padding-top:5px"><b>\${isAr ? 'الشيف العمومي (Executive Chef)' : 'Executive Chef'}</b></div>
      <div style="border-top:1px solid #94a3b8;padding-top:5px"><b>\${isAr ? 'المدير العام (General Manager)' : 'General Manager'}</b></div>
    </div>
    <div class="pf" style="margin-top:10px;display:flex;justify-content:space-between;font-size:9.5px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:5px">
      <span>D-Deli / بوتشرز — نظام التحكم في التكاليف وهندسة المنيو V3</span>
      <span>\${new Date().toLocaleString()}</span>
    </div>
  </div>\`;

  pa.style.display = "block";
  window.print();
  setTimeout(() => { pa.style.display = "none"; pa.innerHTML = ""; }, 500);
}

function printMrpPlan(){
  const isAr = currentLang === 'ar';
  const pa = document.getElementById("printArea");
  if(!pa) return;

  const PREP_RAW = PREP_RAW_MASTER;
  const im = new Map(S.ing.map((g,i)=>[g.id,i]));
  const ingDemand = new Array(S.ing.length).fill(0);
  const actualSalesRev = Cc.salesTotal || 1;
  const scale = forecastRev > 0 ? (forecastRev / actualSalesRev) : 1;

  let totalForecastCost = 0;
  S.recipes.forEach(r => {
    const actQ = Cc.rq[r.id] || 0;
    const fQ = actQ * scale;
    if(!fQ) return;
    r.items.forEach(it => {
      const idx = im.get(it.ingredientId);
      if(idx != null){
        const need = num(it.std) * fQ;
        ingDemand[idx] += need;
        const g = S.ing[idx];
        const rawNeed = need / (num(g.yield)||1);
        totalForecastCost += rawNeed * num(g.price);
      }
    });
  });

  const prepBatches = PREP_RAW.map(p => {
    const idx = S.ing.findIndex(g => g.name === p[0]);
    const d = idx !== -1 ? ingDemand[idx] : 0;
    const b = d > 0 ? (S.roundUp ? Math.ceil(d / p[2] - 1e-9) : d / p[2]) : 0;
    return { name: p[0], code: p[1], batchSize: p[2], demand: d, batches: b, output: b * p[2] };
  });

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

  pa.innerHTML = \`<div class="pcard" style="width:100%;max-width:210mm;border:none;padding:8px;margin:0 auto">
    <div style="background:#0f172a;color:#fff;border-radius:8px;padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h2 style="margin:0 0 4px 0;font-size:17px;color:#38bdf8">🎯 D-Deli / بوتشرز — \${isAr ? 'خطة الإنتاج والطلبيات التقديرية (MRP)' : 'Procurement & Kitchen Production Plan'}</h2>
        <div style="font-size:11px;color:#cbd5e1">\${isAr ? 'حساب الاحتياجات الفعلية من الخامات وباتشات التحضير وأمر الشراء المباشر' : 'Material Requirement Planning & Purchase Orders'}</div>
      </div>
      <div style="text-align:inherit;font-size:10px;color:#94a3b8">
        <div><b>\${isAr ? 'المبيعات المستهدفة:' : 'Target Rev:'}</b> \${money(forecastRev)} \${t("cur_unit")}</div>
        <div><b>\${isAr ? 'نسبة الأمان:' : 'Buffer:'}</b> +\${forecastSafetyPct}%</div>
        <div><b>\${isAr ? 'التاريخ:' : 'Date:'}</b> \${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;margin-bottom:12px">
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'المبيعات المتوقعة' : 'Forecast Sales'}</div>
        <div style="font-size:13px;font-weight:bold;color:#0284c7">\${money(forecastRev)} \${t("cur_unit")}</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'تكلفة الخامات المتوقعة' : 'Forecast Cost'}</div>
        <div style="font-size:13px;font-weight:bold;color:#d97706">\${money(totalForecastCost)} \${t("cur_unit")}</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">Food Cost %</div>
        <div style="font-size:13px;font-weight:bold;color:#16a34a">\${nf(fcPct, 1)}%</div>
      </div>
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:6px;text-align:center;background:#f8fafc">
        <div style="font-size:9.5px;color:#64748b">\${isAr ? 'إجمالي أمر الشراء' : 'PO Order Value'}</div>
        <div style="font-size:13px;font-weight:bold;color:#2563eb">\${money(totalOrderCost)} \${t("cur_unit")}</div>
      </div>
    </div>

    <!-- PO Table -->
    <h4 style="margin:0 0 6px 0;font-size:12px;color:#0f172a">🛒 \${isAr ? 'أمر الشراء والتوريد المقترح (Purchase Order / Requisition)' : 'Procurement Purchase Order'}</h4>
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:12px">
      <thead>
        <tr style="background:#0f172a;color:#fff">
          <th style="padding:4px 2px;width:24px">#</th>
          <th style="padding:4px 6px;text-align:inherit">\${isAr ? 'اسم الصنف الخام' : 'Ingredient'}</th>
          <th style="padding:4px 4px;width:50px">\${isAr ? 'الوحدة' : 'Unit'}</th>
          <th style="padding:4px 4px;width:70px">\${isAr ? 'سعر الوحدة' : 'Price'}</th>
          <th style="padding:4px 4px;width:75px">\${isAr ? 'إجمالي الاحتياج' : 'Gross Need'}</th>
          <th style="padding:4px 4px;width:75px">\${isAr ? 'الرصيد الحالي' : 'Stock'}</th>
          <th style="padding:4px 4px;width:80px;background:#15803d">\${isAr ? 'صافي الشراء' : 'Net Order'}</th>
          <th style="padding:4px 4px;width:85px">\${isAr ? 'التكلفة' : 'Cost'}</th>
        </tr>
      </thead>
      <tbody>
        \${poList.map((it, idx) => \`<tr style="border-bottom:1px solid #e2e8f0;background:\${idx%2===0?'#fff':'#f8fafc'}">
          <td style="padding:4px 2px;text-align:center">\${idx+1}</td>
          <td style="padding:4px 6px;text-align:inherit"><b>\${esc(it.name)}</b></td>
          <td style="padding:4px 4px;text-align:center">\${esc(it.unit)}</td>
          <td style="padding:4px 4px;text-align:center">\${money(it.price)}</td>
          <td style="padding:4px 4px;text-align:center">\${nf(it.grossReq, 2)}</td>
          <td style="padding:4px 4px;text-align:center">\${nf(it.stock, 2)}</td>
          <td style="padding:4px 4px;text-align:center;font-weight:bold;color:#b91c1c">\${nf(it.netOrder, 2)}</td>
          <td style="padding:4px 4px;text-align:center;font-weight:bold">\${money(it.cost)}</td>
        </tr>\`).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#f1f5f9;font-weight:bold;border-top:2px solid #0f172a">
          <td colspan="6" style="padding:5px;text-align:inherit">\${isAr ? 'إجمالي أمر الشراء' : 'Total Order Cost'}</td>
          <td colspan="2" style="padding:5px;text-align:center;color:#16a34a">\${money(totalOrderCost)} \${t("cur_unit")}</td>
        </tr>
      </tfoot>
    </table>

    <div class="sig" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-top:14px;text-align:center;font-size:10.5px">
      <div style="border-top:1px solid #94a3b8;padding-top:5px"><b>\${isAr ? 'مسؤول المشتريات (Procurement)' : 'Purchasing Agent'}</b></div>
      <div style="border-top:1px solid #94a3b8;padding-top:5px"><b>\${isAr ? 'الشيف العمومي (Executive Chef)' : 'Executive Chef'}</b></div>
      <div style="border-top:1px solid #94a3b8;padding-top:5px"><b>\${isAr ? 'مدير التشغيل (Operations Manager)' : 'Operations Manager'}</b></div>
    </div>
  </div>\`;

  pa.style.display = "block";
  window.print();
  setTimeout(() => { pa.style.display = "none"; pa.innerHTML = ""; }, 500);
}

function printThermalPrep(){
  const isAr = currentLang === 'ar';
  const PREP_RAW = PREP_RAW_MASTER;
  const im = new Map(S.ing.map((g,i)=>[g.id,i]));
  const ingDemand = new Array(S.ing.length).fill(0);
  S.recipes.forEach(r => {
    const q = Cc.rq[r.id] || 0;
    if(!q) return;
    r.items.forEach(it => {
      const idx = im.get(it.ingredientId);
      if(idx != null) ingDemand[idx] += num(it.std) * q;
    });
  });

  const batches = PREP_RAW.map(p => {
    const idx = S.ing.findIndex(g => g.name === p[0]);
    const d = idx !== -1 ? ingDemand[idx] : 0;
    const b = d > 0 ? (S.roundUp ? Math.ceil(d / p[2] - 1e-9) : d / p[2]) : 0;
    return { name: p[0], code: p[1], batchSize: p[2], demand: d, batches: b, output: b * p[2] };
  }).filter(x => x.batches > 0 || x.demand > 0);

  const pa = document.getElementById("printArea");
  pa.innerHTML = \`<div class="thermal-receipt">
    <div class="th-hdr">
      <h2>🍽️ D-DELI / BUTCHERS</h2>
      <div><b>\${isAr?'بون تحضير وتصنيع المطبخ':'KITCHEN PREP PRODUCTION SLIP'}</b></div>
      <div style="font-size:9px;margin-top:4px">\${new Date().toLocaleString()}</div>
      <div style="font-size:9px">\${isAr?'الفترة:':'Period:'} \${S.dFrom} ~ \${S.dTo}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="text-align:inherit">\${isAr?'الصنف':'Item'}</th>
          <th>\${isAr?'المطلوب':'Req'}</th>
          <th>\${isAr?'باتش':'Batch'}</th>
          <th>\${isAr?'الإنتاج':'Total'}</th>
        </tr>
      </thead>
      <tbody>
        \${batches.map(b => \`<tr>
          <td style="text-align:inherit"><b>\${esc(b.name)}</b><br><span style="font-size:8px;color:#555">\${b.code} (\${b.batchSize}g)</span></td>
          <td style="text-align:center">\${nf(b.demand,1)}</td>
          <td style="text-align:center;font-weight:bold">\${nf(b.batches,2)}</td>
          <td style="text-align:center">\${nf(b.output,1)}</td>
        </tr>\`).join('')}
      </tbody>
    </table>
    <div class="th-tot" style="display:flex;justify-content:space-between">
      <span>\${isAr?'إجمالي الأصناف:':'Total Items:'}</span>
      <span>\${batches.length}</span>
    </div>
    <div class="th-sig">
      <div>\${isAr?'الشيف المسؤول: __________________':'Head Chef: __________________'}</div>
      <div style="margin-top:6px">\${isAr?'استلام الصالة / الفرع: __________________':'Received by: __________________'}</div>
    </div>
  </div>\`;
  pa.style.display = "block";
  window.print();
  setTimeout(() => { pa.style.display = "none"; pa.innerHTML = ""; }, 500);
}

function printThermalCount(){
  const isAr = currentLang === 'ar';
  const pa = document.getElementById("printArea");
  pa.innerHTML = \`<div class="thermal-receipt">
    <div class="th-hdr">
      <h2>🍽️ D-DELI / BUTCHERS</h2>
      <div><b>\${isAr?'بون جرد المخزون الفعلي':'PHYSICAL STOCK COUNT TICKET'}</b></div>
      <div style="font-size:9px;margin-top:4px">\${new Date().toLocaleString()}</div>
      <div style="font-size:9px">\${isAr?'المستخدم:':'User:'} \${me.name}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="text-align:inherit"># \${isAr?'الصنف':'Item'}</th>
          <th>\${isAr?'الوحدة':'Unit'}</th>
          <th>\${isAr?'دفتري':'Book'}</th>
          <th>\${isAr?'فعلي':'Actual'}</th>
        </tr>
      </thead>
      <tbody>
        \${S.ing.map((g,i) => {
          const netMove = Cc.recv[i] + Cc.tin[i] + Cc.production_in[i] - Cc.tout[i] - Cc.waste[i] - Cc.production_consume[i];
          const bookStock = num(S.beg[i]) + netMove;
          const endVal = S.end[i] !== undefined && S.end[i] !== '' ? S.end[i] : '____';
          return \`<tr>
            <td style="text-align:inherit">\${i+1}. \${esc(g.name)}</td>
            <td style="text-align:center">\${esc(g.unit)}</td>
            <td style="text-align:center">\${nf(bookStock)}</td>
            <td style="text-align:center;font-weight:bold;border:1px solid #333">\${endVal}</td>
          </tr>\`;
        }).join('')}
      </tbody>
    </table>
    <div class="th-sig">
      <div>\${isAr?'توقيع مسؤول الجرد: __________________':'Auditor Signature: __________________'}</div>
    </div>
  </div>\`;
  pa.style.display = "block";
  window.print();
  setTimeout(() => { pa.style.display = "none"; pa.innerHTML = ""; }, 500);
}

function printA4CountSheet(){
  const isAr = currentLang === 'ar';
  const pa = document.getElementById("printArea");
  pa.innerHTML = \`<div class="pcard">
    <div class="ph">
      <span class="t">📋 \${isAr?'شيت الجرد الميداني والمطابقة الدفترية':'Physical Inventory Audit & Reconciliation'}</span>
      <span class="c">\${S.dTo}</span>
    </div>
    <div class="sum">
      <div><div class="l">\${isAr?'تاريخ الجرد':'Audit Date'}</div><div class="v">\${S.dTo}</div></div>
      <div><div class="l">\${isAr?'عدد الأصناف':'Total Items'}</div><div class="v">\${S.ing.length}</div></div>
      <div><div class="l">\${isAr?'القيمة التقديرية':'Stock Value'}</div><div class="v">\${money(Cc.stockValue)}</div></div>
      <div><div class="l">\${isAr?'مسؤول الجرد':'Auditor'}</div><div class="v">\${esc(me.name)}</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>ID</th>
          <th style="text-align:inherit">\${isAr?'اسم الصنف / المكون':'Ingredient Name'}</th>
          <th>\${isAr?'القسم':'Category'}</th>
          <th>\${isAr?'الوحدة':'Unit'}</th>
          <th>\${isAr?'أول المدة':'Beg'}</th>
          <th>\${isAr?'الرصيد الدفتري':'Book Stock'}</th>
          <th style="background:#0f172a;color:#fff;width:90px">\${isAr?'الجرد الفعلي':'Actual Count'}</th>
          <th style="width:120px">\${isAr?'ملاحظات':'Notes'}</th>
        </tr>
      </thead>
      <tbody>
        \${S.ing.map((g,i) => {
          const netMove = Cc.recv[i] + Cc.tin[i] + Cc.production_in[i] - Cc.tout[i] - Cc.waste[i] - Cc.production_consume[i];
          const bookStock = num(S.beg[i]) + netMove;
          const endVal = S.end[i] !== undefined && S.end[i] !== '' ? S.end[i] : '';
          return \`<tr>
            <td>\${i+1}</td>
            <td class="idcell">\${g.id}</td>
            <td style="text-align:inherit"><b>\${esc(g.name)}</b></td>
            <td>\${esc(g.category||'—')}</td>
            <td>\${esc(g.unit)}</td>
            <td>\${nf(S.beg[i])}</td>
            <td>\${nf(bookStock)}</td>
            <td style="font-weight:bold;background:#fafafa">\${endVal}</td>
            <td></td>
          </tr>\`;
        }).join('')}
      </tbody>
    </table>
    <div class="sig">
      <div>\${isAr?'أمين المخزن':'Storekeeper'}</div>
      <div>\${isAr?'مراقب التكاليف (Cost Controller)':'Cost Controller'}</div>
      <div>\${isAr?'المدير العام / الشريك':'General Manager'}</div>
    </div>
  </div>\`;
  pa.style.display = "block";
  window.print();
  setTimeout(() => { pa.style.display = "none"; pa.innerHTML = ""; }, 500);
}

function printThermalWaste(){
  const isAr = currentLang === 'ar';
  const wasteMoves = S.ledger.filter(x => x.type === 'waste' && x.date >= S.dFrom && x.date <= S.dTo);
  const im = new Map(S.ing.map((g,i)=>[g.id,i]));
  let totalCost = 0;
  
  const pa = document.getElementById("printArea");
  pa.innerHTML = \`<div class="thermal-receipt">
    <div class="th-hdr">
      <h2>🍽️ D-DELI / BUTCHERS</h2>
      <div><b>\${isAr?'إذن توثيق الهدر والتوالف':'DAILY WASTE & SPOILAGE SLIP'}</b></div>
      <div style="font-size:9px;margin-top:4px">\${new Date().toLocaleString()}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="text-align:inherit">\${isAr?'الصنف':'Item'}</th>
          <th>\${isAr?'الكمية':'Qty'}</th>
          <th>\${isAr?'التكلفة':'Cost'}</th>
        </tr>
      </thead>
      <tbody>
        \${wasteMoves.map(w => {
          const idx = im.get(w.ingredientId);
          const g = idx != null ? S.ing[idx] : null;
          const cost = num(w.qty) * (g ? num(g.price) : 0);
          totalCost += cost;
          return \`<tr>
            <td style="text-align:inherit">\${esc(g?.name||w.ingredientId)}<br><span style="font-size:8px;color:#666">\${esc(w.note||'—')}</span></td>
            <td style="text-align:center">\${nf(w.qty)} \${esc(w.unit)}</td>
            <td style="text-align:center">\${money(cost)}</td>
          </tr>\`;
        }).join('')}
      </tbody>
    </table>
    <div class="th-tot" style="display:flex;justify-content:space-between">
      <span>\${isAr?'إجمالي تكلفة الهالك:':'Total Waste Cost:'}</span>
      <span>\${money(totalCost)} \${t("cur_unit")}</span>
    </div>
    <div class="th-sig">
      <div>\${isAr?'توقيع الشيف: __________________':'Chef Signature: __________________'}</div>
      <div style="margin-top:4px">\${isAr?'اعتماد مدير الفرع: __________________':'Manager Approval: __________________'}</div>
    </div>
  </div>\`;
  pa.style.display = "block";
  window.print();
  setTimeout(() => { pa.style.display = "none"; pa.innerHTML = ""; }, 500);
}

// ==================== Direct Excel XLSX Import & Multi-Sheet Export ====================
function openImportModal(){
  const isAr = currentLang === 'ar';
  const modal = document.createElement('div');
  modal.id = "importHubModal";
  modal.className = "modal-backdrop";
  modal.innerHTML = \`<div class="modal-box">
    <div class="modal-hdr">
      <h3>📊 \${isAr ? 'استيراد فواتير المشتريات وجداول الجرد من Excel' : 'Import Invoices & Inventory from Excel (.xlsx)'}</h3>
      <button class="modal-close" onclick="closeModal('importHubModal')">✕</button>
    </div>
    
    <div class="subtabs" style="margin-bottom:16px">
      <button class="subtab-btn active" id="btnImpTabRecv" onclick="switchImpTab('recv')">🛒 \${isAr?'استيراد فواتير المشتريات والتوريد':'Import Purchases (Receiving)'}</button>
      <button class="subtab-btn" id="btnImpTabCount" onclick="switchImpTab('count')">📋 \${isAr?'استيراد الجرد الفعلي':'Import Ending Count'}</button>
      <button class="subtab-btn" id="btnImpTabSales" onclick="switchImpTab('sales')">🧾 \${isAr?'استيراد مبيعات الكاشير':'Import POS Sales'}</button>
    </div>

    <!-- Panel 1: Receiving -->
    <div id="impPanelRecv">
      <p style="font-size:12px;color:var(--mut);margin-bottom:12px">\${isAr?'قم برفع ملف إكسيل يحتوي على أعمدة (اسم الصنف أو الكود، الكمية، السعر، التاريخ، رقم الفاتورة) لتسجيلها فوراً بحركات التوريد:':'Upload XLSX with columns (Name/Code, Qty, Price, Date, Reference) to log receiving entries:'}</p>
      <div style="border:2px dashed var(--line);border-radius:12px;padding:24px;text-align:center;background:var(--bg);margin-bottom:14px;cursor:pointer" onclick="document.getElementById('fileXlsxRecv').click()">
        <div style="font-size:32px;margin-bottom:8px">📥</div>
        <div style="font-weight:600">\${isAr?'انقر لاختيار ملف إكسيل فواتير التوريد':'Click to choose XLSX Receiving File'}</div>
        <input type="file" id="fileXlsxRecv" accept=".xlsx, .xls, .csv" style="display:none" onchange="processExcelReceiving(this)">
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="mini" onclick="downloadTemplate('receiving')">⬇️ \${isAr?'تحميل نموذج إكسيل مشتريات فارغ':'Download Blank Purchases Template'}</button>
      </div>
    </div>

    <!-- Panel 2: Count -->
    <div id="impPanelCount" style="display:none">
      <p style="font-size:12px;color:var(--mut);margin-bottom:12px">\${isAr?'قم برفع جدول إكسيل يحتوي على عمودين (كود الصنف أو اسمه، والكمية المجردة) لتحديث أرصدة الجرد الختامي فوراً:':'Upload XLSX with (Code/Name and Count Qty) to populate Ending Stock balances:'}</p>
      <div style="border:2px dashed var(--line);border-radius:12px;padding:24px;text-align:center;background:var(--bg);margin-bottom:14px;cursor:pointer" onclick="document.getElementById('fileXlsxCount').click()">
        <div style="font-size:32px;margin-bottom:8px">📋</div>
        <div style="font-weight:600">\${isAr?'انقر لاختيار ملف إكسيل الجرد الفعلي':'Click to choose XLSX Physical Count File'}</div>
        <input type="file" id="fileXlsxCount" accept=".xlsx, .xls, .csv" style="display:none" onchange="processExcelCount(this)">
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="mini" onclick="downloadTemplate('count')">⬇️ \${isAr?'تحميل نموذج إكسيل جرد فارغ':'Download Blank Inventory Template'}</button>
      </div>
    </div>

    <!-- Panel 3: Sales -->
    <div id="impPanelSales" style="display:none">
      <p style="font-size:12px;color:var(--mut);margin-bottom:12px">\${isAr?'قم برفع شيت مبيعات الكاشير بأعمدة (SKU، اسم الصنف، الكمية، السعر):':'Upload sales XLSX with (SKU, Item Name, Qty, Price):'}</p>
      <div style="border:2px dashed var(--line);border-radius:12px;padding:24px;text-align:center;background:var(--bg);margin-bottom:14px;cursor:pointer" onclick="document.getElementById('fileXlsxSales').click()">
        <div style="font-size:32px;margin-bottom:8px">🧾</div>
        <div style="font-weight:600">\${isAr?'انقر لاختيار ملف مبيعات الكاشير':'Click to choose POS Sales XLSX'}</div>
        <input type="file" id="fileXlsxSales" accept=".xlsx, .xls, .csv" style="display:none" onchange="processExcelSales(this)">
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="mini" onclick="downloadTemplate('sales')">⬇️ \${isAr?'تحميل نموذج مبيعات فارغ':'Download Blank Sales Template'}</button>
      </div>
    </div>

  </div>\`;
  document.body.appendChild(modal);
}

function switchImpTab(t){
  document.getElementById('impPanelRecv').style.display = t==='recv' ? 'block':'none';
  document.getElementById('impPanelCount').style.display = t==='count' ? 'block':'none';
  document.getElementById('impPanelSales').style.display = t==='sales' ? 'block':'none';
  document.getElementById('btnImpTabRecv').className = 'subtab-btn ' + (t==='recv'?'active':'');
  document.getElementById('btnImpTabCount').className = 'subtab-btn ' + (t==='count'?'active':'');
  document.getElementById('btnImpTabSales').className = 'subtab-btn ' + (t==='sales'?'active':'');
}

function processExcelReceiving(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
      if(rows.length < 2){ toast("⚠️ ملف فارغ"); return; }
      
      let added = 0;
      const imName = new Map(S.ing.map(g => [g.name.trim().toLowerCase(), g]));
      const imId = new Map(S.ing.map(g => [g.id.trim().toLowerCase(), g]));
      
      for(let r=1; r<rows.length; r++){
        const row = rows[r];
        if(!row || row.length === 0) continue;
        const key = String(row[0]||'').trim().toLowerCase();
        const qty = num(row[1]);
        const ref = String(row[2]||'INV-EXCEL').trim();
        const date = String(row[3]||S.dFrom).trim();
        const note = String(row[4]||'Excel Import').trim();
        
        const g = imId.get(key) || imName.get(key);
        if(g && qty > 0){
          S.ledger.push({
            id: uid("TXN"),
            date: (date >= S.dFrom && date <= S.dTo) ? date : S.dFrom,
            type: "recv",
            ingredientId: g.id,
            qty,
            unit: g.unit,
            reference: ref,
            note: note,
            user: me.username,
            createdAt: new Date().toISOString()
          });
          added++;
        }
      }
      
      Cc = compute();
      save();
      closeModal('importHubModal');
      toast("✓ " + (currentLang==='ar' ? 'تم استيراد ' + added + ' حركة توريد بنجاح' : 'Imported ' + added + ' receiving records'));
      renderTab();
    } catch(err) {
      toast("❌ خطأ في معالجة ملف الإكسيل");
    }
  };
  reader.readAsArrayBuffer(file);
}

function processExcelCount(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
      
      let updated = 0;
      const imName = new Map(S.ing.map((g, i) => [g.name.trim().toLowerCase(), i]));
      const imId = new Map(S.ing.map((g, i) => [g.id.trim().toLowerCase(), i]));
      
      for(let r=1; r<rows.length; r++){
        const row = rows[r];
        if(!row || row.length === 0) continue;
        const key = String(row[0]||'').trim().toLowerCase();
        const countQty = row[1] !== undefined ? num(row[1]) : null;
        
        const idx = imId.has(key) ? imId.get(key) : (imName.has(key) ? imName.get(key) : null);
        if(idx !== null && countQty !== null){
          S.end[idx] = countQty;
          updated++;
        }
      }
      
      Cc = compute();
      save();
      closeModal('importHubModal');
      toast("✓ " + (currentLang==='ar' ? 'تم تحديث جرد ' + updated + ' صنف بنجاح' : 'Updated ' + updated + ' counted items'));
      renderTab();
    } catch(err) {
      toast("❌ خطأ في معالجة ملف الجرد");
    }
  };
  reader.readAsArrayBuffer(file);
}

function processExcelSales(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
      
      let count = 0;
      for(let r=1; r<rows.length; r++){
        const row = rows[r];
        if(!row || row.length === 0) continue;
        const code = String(row[0]||'').trim();
        const name = String(row[1]||'').trim();
        const qty = num(row[2]);
        const price = num(row[3]);
        const group = String(row[4]||'General').trim();
        
        if(name && qty > 0){
          const exist = S.sales.find(s => s.code === code || s.name.trim().toLowerCase() === name.toLowerCase());
          if(exist){
            exist.qty = qty;
            exist.price = price || exist.price;
          } else {
            S.sales.push({ id: uid("SLS"), code: code||("SKU-"+(S.sales.length+1)), name, group, qty, price, recipeId: "" });
          }
          count++;
        }
      }
      
      Cc = compute();
      save();
      closeModal('importHubModal');
      toast("✓ " + (currentLang==='ar' ? 'تم استيراد ' + count + ' صنف مبيعات' : 'Imported ' + count + ' sales items'));
      renderTab();
    } catch(err) {
      toast("❌ خطأ في معالجة ملف المبيعات");
    }
  };
  reader.readAsArrayBuffer(file);
}

function downloadTemplate(type){
  if(!window.XLSX) return;
  const wb = XLSX.utils.book_new();
  let rows = [];
  let filename = "";
  
  if(type === 'receiving'){
    rows = [["Ingredient ID or Name", "Quantity", "Invoice Reference", "Date (YYYY-MM-DD)", "Notes"]];
    S.ing.slice(0, 10).forEach(g => rows.push([g.name, 10, "INV-001", S.dFrom, "المورد العام"]));
    filename = "Purchases_Receiving_Template.xlsx";
  } else if(type === 'count'){
    rows = [["Ingredient ID or Name", "Actual Count Quantity"]];
    S.ing.forEach(g => rows.push([g.name, ""]));
    filename = "Physical_Count_Template.xlsx";
  } else if(type === 'sales'){
    rows = [["SKU", "Item Name", "Quantity Sold", "Selling Price", "Group"]];
    S.sales.forEach(s => rows.push([s.code, s.name, s.qty, s.price, s.group]));
    filename = "POS_Sales_Template.xlsx";
  }
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, filename);
}

function exportMultiSheetXLSX(){
  if(!window.XLSX){ toast("⚠️ XLSX Library not loaded"); return; }
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Summary & Variance
  const summaryRows = [["ID", "Ingredient Name", "Unit", "Category", "Price", "Beg Stock", "Receiving", "Transfer In", "Prod In", "Transfer Out", "Waste", "Prod Consume", "End Count", "Actual Usage", "Theo Usage", "Variance", "Var Cost"]];
  S.ing.forEach((g, i) => {
    summaryRows.push([
      g.id, g.name, g.unit, CATS[g.cat]||g.category||"", g.price,
      num(S.beg[i]), Cc.recv[i], Cc.tin[i], Cc.production_in[i],
      Cc.tout[i], Cc.waste[i], Cc.production_consume[i],
      num(S.end[i]), Cc.actual[i], Cc.adj[i], Cc.vari[i], Cc.cvar[i]
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Summary_Variance");

  // Sheet 2: Ledger
  const ledgerRows = [["Tx ID", "Date", "Type", "Ingredient ID", "Quantity", "Unit", "Reference", "User", "Notes", "Timestamp"]];
  S.ledger.forEach(x => {
    ledgerRows.push([x.id, x.date, x.type, x.ingredientId, x.qty, x.unit, x.reference, x.user, x.note, x.createdAt]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ledgerRows), "Ledger_Movements");

  // Sheet 3: Sales
  const salesRows = [["SKU", "Item Name", "Group", "Quantity", "Price", "Total Sales", "Linked Recipe"]];
  S.sales.forEach(s => {
    salesRows.push([s.code, s.name, s.group, s.qty, s.price, num(s.qty)*num(s.price), s.recipeId]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesRows), "Sales_POS");

  // Sheet 4: Recipes BOM
  const recipeRows = [["Recipe Code", "Recipe Name", "Ingredient Name", "Ingredient ID", "Std Quantity", "Unit Price", "Cost"]];
  S.recipes.forEach(r => {
    r.items.forEach(it => {
      const g = S.ing.find(x => x.id === it.ingredientId);
      recipeRows.push([r.code, r.name, g?.name||it.ing, it.ingredientId, it.std, g?.price||0, num(it.std)*(g?num(g.price):0)]);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recipeRows), "Recipes_BOM");

  // Sheet 5: Expenses
  const expCats = S.expenseCategories || [];
  const catLookup = new Map(expCats.map(c => [c.id, c.nameAr || c.name]));
  const expenseRows = [["Expense ID", "Date", "Category", "Type", "Amount", "Payment Method", "Paid To", "Invoice / Ref", "Status", "Linked Stock Tx", "User", "Notes"]];
  (S.expenses || []).forEach(exp => {
    expenseRows.push([
      exp.id,
      exp.date,
      catLookup.get(exp.categoryId) || exp.categoryId,
      exp.isFoodCost ? "Food (Inventory)" : "Operating / General",
      exp.amount,
      exp.paymentMethod || "",
      exp.paidTo || "",
      exp.reference || "",
      exp.status || "paid",
      exp.linkedLedgerTxId || (exp.isFoodCost ? "Stock Linked" : "—"),
      exp.createdBy || "",
      exp.notes || ""
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expenseRows), "Expenses_Financial");

  // Sheet 6: Menu Engineering
  const meData = typeof computeMenuEngineeringData === 'function' ? computeMenuEngineeringData() : null;
  if(meData && meData.items){
    const meRows = [["SKU", "Item Name", "Group", "Qty Sold", "Mix %", "Selling Price", "Unit Cost", "Margin", "Margin %", "Total Revenue", "Total Profit", "Quadrant"]];
    meData.items.forEach(it => {
      meRows.push([
        it.code,
        it.name,
        it.group,
        it.qty,
        (it.popularityShare || 0).toFixed(1) + "%",
        it.price,
        it.unitCost,
        it.margin,
        (it.marginPct || 0).toFixed(1) + "%",
        it.revenue,
        it.totalMargin,
        it.quadrant
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meRows), "Menu_Engineering");
  }

  XLSX.writeFile(wb, "D-Deli_Full_Inventory_Expenses_Control.xlsx");
  toast("✓ " + (currentLang==='ar'?'تم تصدير ملف الإكسيل الشامل':'Full Workbook Exported'));
}

// ==================== Cloud & Multi-Device Sync Engine ====================
function openSyncModal(){
  const isAr = currentLang === 'ar';
  const syncPayload = btoa(encodeURIComponent(JSON.stringify(S)));
  const modal = document.createElement('div');
  modal.id = "syncHubModal";
  modal.className = "modal-backdrop";
  modal.innerHTML = \`<div class="modal-box">
    <div class="modal-hdr">
      <h3>☁️ \${isAr ? 'المزامنة السحابية والنسخ المباشر بين الفروع والأجهزة' : 'Cloud & Multi-Device Snapshot Sync'}</h3>
      <button class="modal-close" onclick="closeModal('syncHubModal')">✕</button>
    </div>
    
    <div style="margin-bottom:16px">
      <h4 style="margin:0 0 6px;color:#2563eb">🔑 \${isAr?'رمز المزامنة السريع الموحد (Sync Token)':'Compact Sync Token'}</h4>
      <p style="font-size:11px;color:var(--mut);margin:0 0 8px">\${isAr?'انسخ هذا الرمز لنقل كل البيانات والجرد والمبيعات إلى جهاز الفرع الآخر فوراً بنقرة زر:':'Copy this compact token to instantly load this exact state on another phone, tablet, or PC:'}</p>
      <div style="display:flex;gap:6px">
        <input type="text" id="txtSyncCode" value="\${syncPayload}" readonly style="flex:1;background:var(--bg);font-family:monospace;font-size:11px" onclick="this.select()">
        <button class="hbtn prim" onclick="copySyncToken()">📋 \${isAr?'نسخ الرمز':'Copy'}</button>
      </div>
    </div>

    <div style="border-top:1px dashed var(--line);padding-top:14px;margin-bottom:16px">
      <h4 style="margin:0 0 6px;color:#16a34a">📥 \${isAr?'استعادة أو تطبيق رمز المزامنة من جهاز آخر':'Apply Sync Token from another device'}</h4>
      <div style="display:flex;gap:6px">
        <input type="text" id="txtApplySyncCode" placeholder="\${isAr?'ألصق رمز المزامنة هنا...':'Paste sync token here...'}" style="flex:1">
        <button class="hbtn grn" onclick="applySyncToken()">⚡ \${isAr?'تطبيق المزامنة':'Apply Sync'}</button>
      </div>
    </div>

    <div style="border-top:1px dashed var(--line);padding-top:14px">
      <h4 style="margin:0 0 6px;color:#7c3aed">🌐 \${isAr?'رابط المزامنة السحابي (Webhook Endpoint)':'Cloud Webhook Sync'}</h4>
      <p style="font-size:11px;color:var(--mut);margin:0 0 8px">\${isAr?'إرسال نسخة من ملف الجرد بنقرة زر إلى السحابة أو النظام المركزي للفرع الرئيسي:':'Send complete inventory snapshot directly to central server/cloud webhook:'}</p>
      <div style="display:flex;gap:6px">
        <input type="url" id="txtCloudEndpoint" placeholder="https://api.your-domain.com/sync-inventory" value="\${S.settings?.cloudEndpoint||''}" style="flex:1">
        <button class="hbtn purple" onclick="sendCloudSync()">🚀 \${isAr?'إرسال للسحابة':'Send to Cloud'}</button>
      </div>
    </div>
  </div>\`;
  document.body.appendChild(modal);
}

function copySyncToken(){
  const inp = document.getElementById("txtSyncCode");
  if(inp){
    inp.select();
    navigator.clipboard.writeText(inp.value);
    toast("✓ " + (currentLang==='ar'?'تم نسخ رمز المزامنة إلى الحافظة':'Sync token copied to clipboard'));
  }
}

function applySyncToken(){
  const inp = document.getElementById("txtApplySyncCode");
  const code = inp?.value?.trim();
  if(!code){ toast("⚠️ " + (currentLang==='ar'?'يرجى لصق الرمز أولاً':'Please enter sync token')); return; }
  try {
    const raw = decodeURIComponent(atob(code));
    const parsed = JSON.parse(raw);
    if(parsed && parsed.ing && parsed.recipes){
      S = parsed;
      Cc = compute();
      save();
      closeModal('syncHubModal');
      toast("✓ " + (currentLang==='ar'?'تمت المزامنة وتطبيق البيانات بنجاح':'State synced successfully'));
      renderNav();
      renderTab();
    } else {
      toast("❌ رمز غير صالح");
    }
  } catch(e) {
    toast("❌ رمز المزامنة غير صالح");
  }
}

function sendCloudSync(){
  const url = document.getElementById("txtCloudEndpoint")?.value?.trim();
  if(!url){ toast("⚠️ " + (currentLang==='ar'?'يرجى إدخال رابط الـ Webhook':'Enter webhook URL')); return; }
  
  if(!S.settings) S.settings = {};
  S.settings.cloudEndpoint = url;
  save();
  
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: "D-Deli-FoodCost",
      branch: S.settings?.branch || "Main Branch",
      timestamp: new Date().toISOString(),
      state: S,
      totals: {
        sales: Cc.salesTotal,
        idealCost: Cc.idealCost,
        stockValue: Cc.stockValue,
        varianceCost: Cc.varCost
      }
    })
  }).then(res => {
    if(res.ok){
      toast("✓ " + (currentLang==='ar'?'تم إرسال نسخة المزامنة للسحابة بنجاح':'Cloud snapshot sent successfully'));
      closeModal('syncHubModal');
    } else {
      toast("⚠️ تم الإرسال مع تنبيه من الخادم: " + res.status);
    }
  }).catch(err => {
    toast("❌ فشل الاتصال برابط السحابة (تأكد من إعدادات CORS و الرابط)");
  });
}

function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.remove();
}
`;
