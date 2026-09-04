import * as XLSX from 'xlsx';
import { AppState, ComputedMetrics, Language } from '../types';
import { CATEGORIES_NAMES } from '../initialData';
import { getRecipeUnitCost, getRecipeAvgSellingPrice } from './calculations';

export function downloadXLSX(data: (string | number)[][], filename: string, sheetName: string = "Sheet1"): void {
  try {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  } catch (err) {
    console.error("XLSX export failed, falling back to CSV", err);
    downloadCSV(data, filename.replace(/\.xlsx$/i, '.csv'));
  }
}

export function downloadCSV(data: (string | number)[][], filename: string): void {
  const csvContent = "\uFEFF" + data.map(row => 
    row.map(cell => {
      const str = String(cell ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  ).join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSummaryExcel(state: AppState, computed: ComputedMetrics, lang: Language): void {
  const isAr = lang === 'ar';
  const headers = isAr
    ? ["كود المكون", "اسم المكون", "الوحدة", "التصنيف", "السعر", "نسبة الاستفادة Yield", "الاستهلاك النظري المعدل", "الاستهلاك الفعلي", "فرق الكمية (Variance)", "تكلفة الفرق (ج.م)"]
    : ["Ingredient ID", "Ingredient Name", "Unit", "Category", "Unit Price", "Yield %", "Theoretical Adjusted", "Actual Consumption", "Variance Qty", "Variance Cost"];

  const rows: (string | number)[][] = [headers];

  state.ing.forEach((g, i) => {
    rows.push([
      g.id,
      g.name,
      g.unit,
      CATEGORIES_NAMES[g.cat] || `Cat ${g.cat}`,
      g.price,
      g.yield,
      computed.adj[i],
      computed.actual[i],
      computed.vari[i],
      computed.cvar[i]
    ]);
  });

  rows.push([]);
  rows.push([
    isAr ? "الإجمالي" : "Total",
    "",
    "",
    "",
    "",
    "",
    computed.adj.reduce((a, b) => a + b, 0),
    computed.actual.reduce((a, b) => a + b, 0),
    computed.vari.reduce((a, b) => a + b, 0),
    computed.varCost
  ]);

  downloadXLSX(rows, `D-Deli_FoodCost_Summary_${state.dFrom}_${state.dTo}.xlsx`, "Summary");
}

export function exportRecipesExcel(state: AppState, lang: Language): void {
  const isAr = lang === 'ar';
  const headers = isAr
    ? ["كود الوصفة الداخلي", "كود الوصفة", "اسم الوصفة", "عدد المكونات", "تكلفة الوحدة", "سعر البيع المقترح", "Food Cost %"]
    : ["Recipe ID", "Recipe Code", "Recipe Name", "Ingredients Count", "Unit Cost", "Selling Price", "Food Cost %"];

  const rows: (string | number)[][] = [headers];

  state.recipes.forEach(r => {
    const cost = getRecipeUnitCost(r, state.ing);
    const sellPrice = getRecipeAvgSellingPrice(r.id, state.sales);
    const fc = sellPrice > 0 ? (cost / sellPrice) * 100 : 0;
    rows.push([
      r.id,
      r.code,
      r.name,
      r.items.length,
      cost,
      sellPrice > 0 ? sellPrice : "",
      fc > 0 ? `${fc.toFixed(1)}%` : ""
    ]);
  });

  downloadXLSX(rows, `D-Deli_Recipes_Master.xlsx`, "Recipes");
}

export function exportSingleRecipeExcel(recipeIndex: number, state: AppState): void {
  const r = state.recipes[recipeIndex];
  if (!r) return;
  const ingMap = new Map(state.ing.map(g => [g.id, g]));
  const totalCost = getRecipeUnitCost(r, state.ing);
  const sellPrice = getRecipeAvgSellingPrice(r.id, state.sales);

  const rows: (string | number)[][] = [
    ["Recipe ID", r.id],
    ["Recipe Code", r.code],
    ["Recipe Name", r.name],
    ["Unit Cost", totalCost],
    ["Selling Price", sellPrice > 0 ? sellPrice : "—"],
    [],
    ["#", "Ingredient ID", "Ingredient Name", "Unit", "Standard Qty", "Unit Price", "Component Cost"]
  ];

  r.items.forEach((it, idx) => {
    const g = ingMap.get(it.ingredientId);
    const p = g?.price || 0;
    rows.push([
      idx + 1,
      it.ingredientId,
      g?.name || it.ing,
      g?.unit || "",
      it.std,
      p,
      it.std * p
    ]);
  });

  rows.push([]);
  rows.push(["", "", "", "", "", "Total Cost", totalCost]);

  downloadXLSX(rows, `Recipe_${r.code}_${r.name.slice(0, 15).replace(/\s+/g, '_')}.xlsx`, "Recipe");
}

export function exportLedgerExcel(state: AppState): void {
  const ingMap = new Map(state.ing.map(g => [g.id, g]));
  const rows: (string | number)[][] = [
    ["Date", "Transaction ID", "Movement Type", "Ingredient ID", "Ingredient Name", "Quantity", "Unit", "Reference", "Notes", "User", "Created At"]
  ];

  state.ledger.forEach(tx => {
    const g = ingMap.get(tx.ingredientId);
    rows.push([
      tx.date,
      tx.id,
      tx.type,
      tx.ingredientId,
      g?.name || "",
      tx.qty,
      tx.unit,
      tx.reference,
      tx.note,
      tx.user,
      tx.createdAt
    ]);
  });

  downloadXLSX(rows, `D-Deli_Inventory_Ledger.xlsx`, "Ledger");
}

export function exportAuditExcel(state: AppState): void {
  const rows: (string | number)[][] = [
    ["Timestamp", "User", "Action", "Details"]
  ];

  state.audit.forEach(a => {
    rows.push([
      a.at,
      a.user,
      a.action,
      a.details
    ]);
  });

  downloadXLSX(rows, `D-Deli_Audit_Trail.xlsx`, "Audit");
}

export function exportPhysicalCountSheetExcel(
  state: AppState, 
  blindMode: boolean = false,
  metrics?: ComputedMetrics
): void {
  const headers = metrics ? [
    "م",
    "كود الصنف",
    "اسم المكون / الخامة",
    "القسم / التصنيف",
    "الوحدة",
    "سعر الوحدة (ج.م)",
    "الاستهلاك النظري",
    "رصيد أول",
    "توريدات",
    "تحويل وارد",
    "تصنيع وارد",
    "تحويل صادر",
    "هدر وتوالف",
    "استهلاك تصنيع",
    "الجرد الفعلي (المعدود)",
    "الاستهلاك الفعلي",
    "فرق الاستهلاك",
    "تكلفة الفرق (ج.م)",
    "ملاحظات"
  ] : [
    "م",
    "كود الصنف",
    "اسم المكون / الخامة",
    "القسم / التصنيف",
    "الوحدة",
    blindMode ? "رصيد دفتري (أعمى)" : "رصيد أول المدة الدفتري",
    "الجرد الفعلي 1 (العد الميداني)",
    "الجرد الفعلي 2 / النهائي",
    "فرق الجرد",
    "ملاحظات / حالة الصنف / الصلاحية"
  ];

  const rows: (string | number)[][] = [
    ["🍽️ كشف وفورمة الجرد الفعلي للمخزون وتحليل الفروقات — D-Deli / بوتشرز"],
    [`تاريخ الجرد: ${state.dTo || new Date().toISOString().slice(0, 10)}`, `الفترة: من ${state.dFrom} إلى ${state.dTo}`],
    [],
    headers
  ];

  state.ing.forEach((g, idx) => {
    const beg = state.beg[idx] || 0;
    const end = state.end[idx] !== undefined && state.end[idx] !== null ? state.end[idx] : "";
    
    if (metrics) {
      rows.push([
        idx + 1,
        g.id,
        g.name,
        CATEGORIES_NAMES[g.cat] || `قسم ${g.cat}`,
        g.unit,
        g.price,
        metrics.adj[idx] || 0,
        beg,
        metrics.recv[idx] || 0,
        metrics.tin[idx] || 0,
        metrics.production_in[idx] || 0,
        metrics.tout[idx] || 0,
        metrics.waste[idx] || 0,
        metrics.production_consume[idx] || 0,
        end !== "" ? end : "",
        metrics.actual[idx] || 0,
        metrics.vari[idx] || 0,
        metrics.cvar[idx] || 0,
        ""
      ]);
    } else {
      rows.push([
        idx + 1,
        g.id,
        g.name,
        CATEGORIES_NAMES[g.cat] || `قسم ${g.cat}`,
        g.unit,
        blindMode ? "—" : beg,
        end !== "" ? end : "",
        end !== "" ? end : "",
        (end !== "" && !blindMode) ? Number(end) - Number(beg) : "",
        ""
      ]);
    }
  });

  rows.push([]);
  rows.push(["توقيع مسؤول الجرد: ___________________", "توقيع أمين المخزن: ___________________", "توقيع الشيف المسؤول: ___________________", "توقيع مدير الفرع: ___________________"]);

  downloadXLSX(rows, `D-Deli_Physical_Inventory_Full_Report_${state.dTo || 'Current'}.xlsx`, "StockCountSheet");
}

export function exportDailyMovementsExcel(
  state: AppState, 
  itemStats: Array<{
    id: string;
    name: string;
    cat: number;
    unit: string;
    price: number;
    beg: number;
    recv: number;
    tin: number;
    prodIn: number;
    tout: number;
    waste: number;
    prodConsume: number;
    netMoves: number;
    end: number;
  }>,
  dateFilterText: string = 'Full Period'
): void {
  const headers = [
    "م",
    "كود الصنف",
    "اسم المكون / الخامة",
    "القسم / التصنيف",
    "الوحدة",
    "سعر الوحدة (ج.م)",
    "رصيد أول",
    "التوريدات (Recv)",
    "تحويل وارد (Tin)",
    "مصنعات واردة (Prod In)",
    "تحويل صادر (Tout)",
    "هدر وتوالف (Waste)",
    "استهلاك تصنيع (Prod Cons)",
    "صافي الحركات",
    "رصيد آخر المدة"
  ];

  const rows: (string | number)[][] = [
    ["📦 كشف الحركات اليومية لجميع الأصناف والمخزون — D-Deli / بوتشرز"],
    [`نطاق التقرير: ${dateFilterText}`, `الفترة المحاسبية: من ${state.dFrom} إلى ${state.dTo}`],
    [],
    headers
  ];

  itemStats.forEach((st, idx) => {
    rows.push([
      idx + 1,
      st.id,
      st.name,
      CATEGORIES_NAMES[st.cat] || `قسم ${st.cat}`,
      st.unit,
      st.price,
      st.beg,
      st.recv,
      st.tin,
      st.prodIn,
      st.tout,
      st.waste,
      st.prodConsume,
      st.netMoves,
      st.end
    ]);
  });

  rows.push([]);
  rows.push([
    "الإجمالي",
    "",
    "",
    "",
    "",
    "",
    itemStats.reduce((a, b) => a + b.beg, 0),
    itemStats.reduce((a, b) => a + b.recv, 0),
    itemStats.reduce((a, b) => a + b.tin, 0),
    itemStats.reduce((a, b) => a + b.prodIn, 0),
    itemStats.reduce((a, b) => a + b.tout, 0),
    itemStats.reduce((a, b) => a + b.waste, 0),
    itemStats.reduce((a, b) => a + b.prodConsume, 0),
    itemStats.reduce((a, b) => a + b.netMoves, 0),
    itemStats.reduce((a, b) => a + b.end, 0)
  ]);

  downloadXLSX(rows, `D-Deli_Daily_Movements_Report_${state.dTo}.xlsx`, "DailyMovements");
}

export function exportBatchEntrySheetExcel(
  title: string,
  date: string,
  reference: string,
  notes: string,
  items: Array<{
    id: string;
    name: string;
    cat: number;
    unit: string;
    price: number;
    currentStock: number;
    qty: number;
    cost: number;
    note: string;
  }>
): void {
  const headers = [
    "م",
    "كود الصنف",
    "اسم المكون / الخامة",
    "القسم / التصنيف",
    "الوحدة",
    "سعر الوحدة (ج.م)",
    "الرصيد الدفتري / السابق",
    "الكمية المسجلة",
    "إجمالي القيمة (ج.م)",
    "ملاحظات البند"
  ];

  const rows: (string | number)[][] = [
    [`📋 ${title} — D-Deli / بوتشرز`],
    [`التاريخ: ${date}`, `المرجع / الإذن: ${reference || '—'}`, `ملاحظات: ${notes || '—'}`],
    [],
    headers
  ];

  let totalQty = 0;
  let totalCost = 0;

  items.forEach((item, idx) => {
    totalQty += item.qty;
    totalCost += item.cost;
    rows.push([
      idx + 1,
      item.id,
      item.name,
      CATEGORIES_NAMES[item.cat] || `قسم ${item.cat}`,
      item.unit,
      item.price,
      item.currentStock,
      item.qty > 0 ? item.qty : "",
      item.cost > 0 ? item.cost : "",
      item.note || ""
    ]);
  });

  rows.push([]);
  rows.push([
    "الإجمالي",
    "",
    "",
    "",
    "",
    "",
    "",
    totalQty,
    totalCost,
    ""
  ]);

  downloadXLSX(rows, `${title.replace(/[/\\?%*:|"<>]/g, '_')}_${date}.xlsx`, "BatchSheet");
}

export function exportExpensesExcel(state: AppState, lang: Language): void {
  const isAr = lang === 'ar';
  const catMap = new Map((state.expenseCategories || []).map(c => [c.id, c]));
  
  const headers = isAr
    ? ["كود السند", "التاريخ", "الفئة", "نوع المصروف", "المبلغ (ج.م)", "طريقة الدفع", "المورد / الجهة المستلمة", "رقم الفاتورة / المرجع", "حركة المخزون المرتبطة", "المستخدم", "ملاحظات وتفاصيل"]
    : ["Expense ID", "Date", "Category", "Type", "Amount", "Payment Method", "Paid To / Vendor", "Invoice / Ref", "Linked Stock Tx", "User", "Notes"];

  const rows: (string | number)[][] = [headers];
  let totalAmount = 0;

  (state.expenses || []).forEach(exp => {
    totalAmount += exp.total || 0;
    const cat = catMap.get(exp.categoryId);
    const catName = cat ? (isAr ? (cat.name || cat.nameEn || exp.categoryId) : (cat.nameEn || cat.name || exp.categoryId)) : exp.categoryId;
    const typeLabel = exp.type === 'food'
      ? (isAr ? 'مشتريات غذائية (مخزون)' : 'Food Inventory') 
      : (isAr ? 'مصروف تشغيلي / عام' : 'Operating / General');

    rows.push([
      exp.id,
      exp.date,
      catName,
      typeLabel,
      exp.total,
      exp.paymentMethod || '',
      exp.supplier || '',
      exp.reference || '',
      exp.inventoryTransactionId || (exp.type === 'food' ? (isAr ? 'مرتبط بالمخزون' : 'Stock linked') : '—'),
      exp.user || '',
      exp.note || ''
    ]);
  });

  rows.push([]);
  rows.push([
    isAr ? "إجمالي المصروفات" : "Total Expenses",
    "",
    "",
    "",
    totalAmount,
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ]);

  downloadXLSX(rows, `D-Deli_Expenses_Report_${state.dFrom}_${state.dTo}.xlsx`, "Expenses");
}

