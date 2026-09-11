import React, { useState, useRef, useMemo } from 'react';
import { AppState, ComputedMetrics, Language, SaleItem, Ingredient, Recipe } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, nf, money, getRecipeUnitCost } from '../utils/calculations';
import { downloadElementAsPDF, downloadPrintableHTML, executeReportPrint } from '../utils/pdfExport';
import { 
  Printer, 
  Download, 
  FileText, 
  X, 
  Check, 
  Layers, 
  PieChart, 
  ShoppingBag, 
  Scale, 
  TrendingDown, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  Loader2
} from 'lucide-react';

export type ReportType = 'summary' | 'sales' | 'inventory' | 'variance' | 'menu_eng' | 'forecast' | 'expenses';

interface ReportsPrintModalProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  initialReport?: ReportType;
  onClose: () => void;
}

export const ReportsPrintModal: React.FC<ReportsPrintModalProps> = ({
  state,
  metrics,
  currentLang,
  initialReport = 'summary',
  onClose
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>(initialReport);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const isAr = currentLang === 'ar';
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Group sales by category for August report
  const salesByCategory = useMemo(() => {
    const map = new Map<string, { items: SaleItem[]; totalQty: number; totalRevenue: number }>();
    state.sales.forEach(s => {
      const cat = s.cat || (isAr ? 'أخرى' : 'Other');
      if (!map.has(cat)) {
        map.set(cat, { items: [], totalQty: 0, totalRevenue: 0 });
      }
      const group = map.get(cat)!;
      const qty = num(s.qty);
      const price = num(s.price);
      group.items.push(s);
      group.totalQty += qty;
      group.totalRevenue += qty * price;
    });
    return Array.from(map.entries());
  }, [state.sales, isAr]);

  // Total sales metrics
  const totalSalesQty = useMemo(() => state.sales.reduce((sum, s) => sum + num(s.qty), 0), [state.sales]);
  const totalSalesRevenue = useMemo(() => state.sales.reduce((sum, s) => sum + (num(s.qty) * num(s.price)), 0), [state.sales]);

  // Menu Engineering calculations
  const menuEngData = useMemo(() => {
    const totalQty = state.sales.reduce((acc, s) => acc + num(s.qty), 0);
    const avgQtyPerItem = state.sales.length > 0 ? totalQty / state.sales.length : 0;
    const popularityHurdle = avgQtyPerItem * 0.7; // 70% threshold

    const ingMap = new Map<string, Ingredient>(state.ing.map(g => [g.id, g]));
    const recipeMap = new Map<string, Recipe>(state.recipes.map(r => [r.id, r]));

    const items = state.sales.map(s => {
      const qty = num(s.qty);
      const price = num(s.price);
      const revenue = qty * price;
      
      let unitCost = 0;
      if (s.recipeId && recipeMap.has(s.recipeId)) {
        const recipe = recipeMap.get(s.recipeId)!;
        unitCost = getRecipeUnitCost(recipe, state.ing);
      }

      const unitMargin = Math.max(0, price - unitCost);
      const totalMargin = unitMargin * qty;
      const fcPct = price > 0 ? (unitCost / price) * 100 : 0;

      return {
        ...s,
        qty,
        price,
        revenue,
        unitCost,
        unitMargin,
        totalMargin,
        fcPct
      };
    });

    const totalProfit = items.reduce((acc, it) => acc + it.totalMargin, 0);
    const avgMargin = totalQty > 0 ? totalProfit / totalQty : 0;

    const classified = items.map(it => {
      const isHighPop = it.qty >= popularityHurdle;
      const isHighMargin = it.unitMargin >= avgMargin;

      let classification: 'star' | 'horse' | 'puzzle' | 'dog' = 'dog';
      let classLabel = isAr ? 'كلب (Dog - منخفض)' : 'Dog (Low/Low)';
      let badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';

      if (isHighPop && isHighMargin) {
        classification = 'star';
        classLabel = isAr ? 'نجم (Star - رابح وشائع)' : 'Star (High/High)';
        badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      } else if (isHighPop && !isHighMargin) {
        classification = 'horse';
        classLabel = isAr ? 'حصان عمل (Plowhorse - شائع)' : 'Plowhorse (High Pop/Low Margin)';
        badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
      } else if (!isHighPop && isHighMargin) {
        classification = 'puzzle';
        classLabel = isAr ? 'لغز (Puzzle - ربح مرتفع)' : 'Puzzle (Low Pop/High Margin)';
        badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
      }

      return { ...it, classification, classLabel, badgeClass };
    });

    return {
      items: classified,
      totalQty,
      totalProfit,
      avgMargin,
      popularityHurdle
    };
  }, [state.sales, state.recipes, state.ing, isAr]);

  // Operating Expenses calculations
  const totalExpenses = useMemo(() => {
    return (state.expenses || []).reduce((sum, e) => sum + num(e.amount), 0);
  }, [state.expenses]);

  // Generate standalone HTML representation for print / save
  const generateStandaloneHTML = () => {
    if (!reportRef.current) return '';
    const reportHtml = reportRef.current.innerHTML;

    return `<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${currentLang}">
<head>
  <meta charset="utf-8">
  <title>D-Deli Food Cost Official Report - ${activeReport.toUpperCase()}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${orientation};
      margin: 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Alexandria', sans-serif !important;
    }
    body {
      background: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 10px;
      font-size: 9pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .no-print button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    .no-print button:hover {
      background: #1d4ed8;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      font-size: 8.5pt;
    }
    thead {
      display: table-header-group;
      background: #f1f5f9;
      color: #0f172a;
    }
    tr {
      page-break-inside: avoid;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong>D-Deli / بوتشرز - تقرير رسمي معتمد</strong>
      <span style="opacity: 0.8; margin: 0 8px;">|</span>
      <span>${state.dFrom} إلى ${state.dTo}</span>
    </div>
    <button onclick="window.print()">🖨️ طباعة الآن (Print / Save as PDF)</button>
  </div>
  <div>
    ${reportHtml}
  </div>
</body>
</html>`;
  };

  // Direct PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    setStatusMessage(isAr ? 'جاري تحويل ومعالجة التقرير إلى ملف PDF عالي الجودة...' : 'Generating high-resolution PDF...');

    try {
      const reportNameMap: Record<ReportType, string> = {
        summary: 'FoodCost_Inventory_Summary',
        sales: 'Official_August_Sales_Report',
        inventory: 'Physical_Inventory_Count_Sheet',
        variance: 'Variance_and_Shrinkage_Analysis',
        menu_eng: 'Menu_Engineering_Matrix',
        forecast: 'MRP_Forecast_and_Supply_Plan',
        expenses: 'Operating_Expenses_Report'
      };

      const filename = `D-Deli_${reportNameMap[activeReport]}_${state.dTo || new Date().toISOString().slice(0, 10)}`;

      await downloadElementAsPDF(reportRef.current, {
        orientation,
        filename,
        scale: 1.3,
        onProgress: setStatusMessage
      });

      setStatusMessage(isAr ? '✓ تم تنزيل ملف الـ PDF بنجاح!' : '✓ PDF downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setStatusMessage(isAr ? 'جاري فتح نافذة الطباعة / الحفظ كـ PDF كبديل آمن وسريع...' : 'Opening safe print window as alternative...');
      setTimeout(() => {
        handleInstantPrint();
      }, 300);
    } finally {
      setIsGenerating(false);
    }
  };

  // Instant Native Print Dialog Handler
  const handleInstantPrint = () => {
    setStatusMessage(isAr ? 'جاري استدعاء أمر الطباعة المعتمد...' : 'Triggering print command...');
    executeReportPrint(reportRef.current, generateStandaloneHTML, (msg) => {
      setStatusMessage(msg);
      setTimeout(() => setStatusMessage(null), 4000);
    });
  };

  // Open in New Tab Handler
  const handleOpenNewTab = () => {
    try {
      const html = generateStandaloneHTML();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, '_blank');
      if (!printWin) {
        handleDownloadHTML();
      } else {
        setStatusMessage(isAr ? '✓ تم فتح صفحة التقرير في نافذة مستقلة للطباعة' : '✓ Opened in new tab');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Open new tab error:', err);
      handleDownloadHTML();
    }
  };

  // Download Standalone HTML file for offline printing
  const handleDownloadHTML = () => {
    try {
      const html = generateStandaloneHTML();
      downloadPrintableHTML(html, `D-Deli_${activeReport}_Report_${state.dTo}.html`);
      setStatusMessage(isAr ? '✓ تم تنزيل ملف التقرير المستقل (HTML) بنجاح!' : '✓ Report HTML file downloaded!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Download HTML error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print-modal-container">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-700 print-modal-card">
        
        {/* Modal Top Header (Hidden on Print) */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold text-xl">
              🖨️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg">
                  {isAr ? 'مركز طباعة التقارير الرسمية وإصدار PDF' : 'Official Reports & PDF Print Center'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  D-Deli A4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr 
                  ? 'تصدير وطباعة كافة تقارير تكلفة الأغذية، مبيعات أغسطس، الجرد الفعلي، وهندسة المنيو بجودة عالية' 
                  : 'Export & print all food cost, sales, physical inventory, and engineering reports in crisp A4'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Selector Tabs (Hidden on Print) */}
        <div className="bg-slate-850 p-2.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs print:hidden">
          <button
            onClick={() => setActiveReport('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeReport === 'summary' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isAr ? 'ملخص تكلفة الأغذية والمخزون' : 'Food Cost & Summary'}</span>
          </button>

          <button
            onClick={() => setActiveReport('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeReport === 'sales' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAr ? 'تقرير مبيعات أغسطس 2026' : 'August 2026 Sales'}</span>
          </button>

          <button
            onClick={() => setActiveReport('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeReport === 'inventory' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'كشف الجرد الفعلي الميداني' : 'Physical Inventory Sheet'}</span>
          </button>

          <button
            onClick={() => setActiveReport('menu_eng')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeReport === 'menu_eng' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'مصفوفة هندسة المنيو' : 'Menu Engineering'}</span>
          </button>

          <button
            onClick={() => setActiveReport('forecast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeReport === 'forecast' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{isAr ? 'خطة التوريد والاحتياجات MRP' : 'MRP Supply Plan'}</span>
          </button>

          <button
            onClick={() => setActiveReport('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeReport === 'expenses' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isAr ? 'المصروفات التشغيلية' : 'Operating Expenses'}</span>
          </button>
        </div>

        {/* Action Controls & Format Toolbar (Hidden on Print) */}
        <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Layout Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  orientation === 'portrait' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                📄 {isAr ? 'عمودي (Portrait)' : 'Portrait'}
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  orientation === 'landscape' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                📑 {isAr ? 'أفقي (Landscape)' : 'Landscape'}
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={e => setIncludeSignatures(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>{isAr ? 'إدراج خانات التوقيع والاعتماد' : 'Include Signatures'}</span>
            </label>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl font-bold shadow-md transition active:scale-95 disabled:opacity-50"
              title="تنزيل ملف PDF مباشر على جهازك"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isAr ? '📥 تنزيل ملف PDF مباشر' : '📥 Download PDF'}</span>
            </button>

            {/* Instant Native Print Button */}
            <button
              onClick={handleInstantPrint}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl font-bold shadow-md transition active:scale-95 disabled:opacity-50"
              title="فتح أمر الطباعة الفورية أو الحفظ كـ PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? '🖨️ طباعة التقرير (Print)' : '🖨️ Print Report'}</span>
            </button>

            {/* Open in New Window */}
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-2.5 py-2 rounded-xl font-medium transition"
              title="فتح التقرير في نافذة مستقلة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'نافذة جديدة' : 'New Tab'}</span>
            </button>

            {/* Save HTML */}
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-2.5 py-2 rounded-xl font-medium transition"
              title="حفظ ملف HTML للطباعة بدون إنترنت"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'حفظ HTML' : 'Save HTML'}</span>
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div className="bg-blue-50 dark:bg-blue-950/80 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-blue-500 hover:text-blue-700 font-bold">✕</button>
          </div>
        )}

        {/* Printable Report Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/70 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible flex justify-center">
          
          <div 
            ref={reportRef}
            id="printable-report-card"
            className={`bg-white text-slate-900 border border-slate-300 shadow-xl rounded-xl p-6 sm:p-8 w-full max-w-5xl text-xs print:border-none print:shadow-none print:rounded-none print:p-2 ${
              orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
            }`}
            style={{ minHeight: '297mm' }}
          >
            {/* Standard Official Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                  🍽️
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                    D-Deli / بوتشرز للأغذية والمشروبات
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    نظام الرقابة على تكلفة الأغذية وإدارة المخزون والمبيعات القياسية
                  </p>
                </div>
              </div>

              <div className="text-left text-[11px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-900">
                  {isAr ? 'فترة التقرير:' : 'Report Period:'} <span className="font-mono">{state.dFrom} ~ {state.dTo}</span>
                </div>
                <div>
                  {isAr ? 'تاريخ الإصدار:' : 'Issue Date:'} <span className="font-mono">{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                </div>
                <div className="text-slate-500">
                  {isAr ? 'كود الوثيقة:' : 'Document ID:'} <span className="font-mono uppercase">DOC-FC-{activeReport.slice(0, 3)}-0826</span>
                </div>
              </div>
            </div>

            {/* 1. REPORT CONTENT: SUMMARY & INVENTORY */}
            {activeReport === 'summary' && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">
                    {isAr ? 'تقرير ملخص تكلفة الأغذية والمخزون وحركة الأصناف' : 'Food Cost & Inventory Summary Report'}
                  </h2>
                  <span className="text-[11px] font-bold text-blue-800">
                    {isAr ? 'إجمالي المبيعات المعتمدة:' : 'Approved Sales:'} {money(totalSalesRevenue)} {isAr ? 'ج.م' : 'EGP'}
                  </span>
                </div>

                {/* Financial KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500">{isAr ? 'رصيد أول المدة' : 'Beg Inventory'}</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{money(metrics.begVal)}</div>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500">{isAr ? 'إجمالي المشتريات' : 'Purchases'}</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{money(metrics.purVal)}</div>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-500">{isAr ? 'رصيد آخر المدة' : 'End Inventory'}</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{money(metrics.endVal)}</div>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg bg-blue-50 border-blue-300">
                    <div className="text-[10px] text-blue-700 font-bold">{isAr ? 'تكلفة الغذاء الفعلية (Cost %)' : 'Actual Cost %'}</div>
                    <div className="text-xs font-black text-blue-900 mt-0.5">{money(metrics.actualCost)} ({nf(metrics.actualCostPct, 1)}%)</div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="w-full text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900">
                    <tr>
                      <th className="p-1 border border-slate-300 text-center w-6">#</th>
                      <th className="p-1 border border-slate-300 text-right">{isAr ? 'الصنف / الخامة' : 'Ingredient'}</th>
                      <th className="p-1 border border-slate-300 text-center w-10">{isAr ? 'الوحدة' : 'Unit'}</th>
                      <th className="p-1 border border-slate-300 text-center">{isAr ? 'السعر' : 'Price'}</th>
                      <th className="p-1 border border-slate-300 text-center">{isAr ? 'أول المدة' : 'Beg'}</th>
                      <th className="p-1 border border-slate-300 text-center">{isAr ? 'وارد' : 'In'}</th>
                      <th className="p-1 border border-slate-300 text-center">{isAr ? 'آخر المدة' : 'End'}</th>
                      <th className="p-1 border border-slate-300 text-center font-bold">{isAr ? 'الاستهلاك الفعلي' : 'Act Cons'}</th>
                      <th className="p-1 border border-slate-300 text-center font-bold">{isAr ? 'المعياري' : 'Ideal'}</th>
                      <th className="p-1 border border-slate-300 text-center">{isAr ? 'الفارق' : 'Var'}</th>
                      <th className="p-1 border border-slate-300 text-center font-bold">{isAr ? 'التكلفة الفعلية' : 'Total Cost'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ing.map((g, idx) => {
                      const beg = num(state.beg[idx]);
                      const pur = num(state.pur[idx]);
                      const end = num(state.end[idx]);
                      const act = Math.max(0, beg + pur - end);
                      const ideal = num(metrics.idealCons[idx]);
                      const varQty = act - ideal;
                      const cost = act * num(g.price);

                      return (
                        <tr key={g.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-1 border border-slate-300 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-1 border border-slate-300 font-semibold">{g.name}</td>
                          <td className="p-1 border border-slate-300 text-center text-slate-600">{g.unit}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{money(g.price)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{nf(beg, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{nf(pur, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{nf(end, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono font-bold text-slate-900">{nf(act, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-slate-700">{nf(ideal, 1)}</td>
                          <td className={`p-1 border border-slate-300 text-center font-mono ${varQty > 0.01 ? 'text-rose-700 font-bold' : 'text-emerald-700'}`}>
                            {varQty > 0 ? `+${nf(varQty, 1)}` : nf(varQty, 1)}
                          </td>
                          <td className="p-1 border border-slate-300 text-center font-mono font-bold text-slate-900">{money(cost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={10} className="p-1.5 border border-slate-300 text-left px-3">
                        {isAr ? 'الإجمالي الكلي لتكلفة استهلاك الخامات:' : 'Total Actual Food Cost:'}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center font-mono text-xs">
                        {money(metrics.actualCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 2. REPORT CONTENT: AUGUST 2026 OFFICIAL SALES REPORT */}
            {activeReport === 'sales' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-300 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-blue-950">
                      {isAr ? 'تقرير مبيعات شهر أغسطس 2026 المعتمد (التقرير الميداني الرسمي)' : 'Official August 2026 Sales Report'}
                    </h2>
                    <p className="text-[11px] text-blue-800">
                      {isAr ? 'إجمالي الأصناف: 53 صنفاً مقسمة حسب الفئات' : 'Total 53 SKUs grouped by sales category'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700">
                      {isAr ? 'إجمالي الكمية المباعة:' : 'Total Sold Units:'} <strong className="text-blue-900 font-mono text-sm">{nf(totalSalesQty)}</strong>
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      {isAr ? 'إجمالي الإيراد المحقق:' : 'Total Revenue:'} <strong className="text-emerald-900 font-mono text-sm">{money(totalSalesRevenue)} {isAr ? 'ج.م' : 'EGP'}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {salesByCategory.map(([category, group], gIdx) => (
                    <div key={category} className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between font-bold text-[11px]">
                        <span className="text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">{gIdx + 1}</span>
                          {category} ({group.items.length} {isAr ? 'أصناف' : 'items'})
                        </span>
                        <span className="text-slate-700 font-mono">
                          {isAr ? 'الكمية:' : 'Qty:'} {nf(group.totalQty)} | {isAr ? 'الإيراد:' : 'Revenue:'} {money(group.totalRevenue)} {isAr ? 'ج.م' : 'EGP'}
                        </span>
                      </div>

                      <table className="w-full text-[10px] border-collapse">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="p-1 border-b border-slate-300 text-center w-14">{isAr ? 'كود' : 'Code'}</th>
                            <th className="p-1 border-b border-slate-300 text-right">{isAr ? 'اسم الوجبة / الصنف' : 'Item Name'}</th>
                            <th className="p-1 border-b border-slate-300 text-center w-20">{isAr ? 'سعر البيع' : 'Price'}</th>
                            <th className="p-1 border-b border-slate-300 text-center w-20">{isAr ? 'الكمية المباعة' : 'Sold Qty'}</th>
                            <th className="p-1 border-b border-slate-300 text-center w-28">{isAr ? 'إجمالي الإيراد' : 'Total Revenue'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((s, itemIdx) => (
                            <tr key={s.code || itemIdx} className={itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="p-1 border-b border-slate-200 text-center font-mono text-slate-500">{s.code}</td>
                              <td className="p-1 border-b border-slate-200 font-medium text-slate-900">{s.name}</td>
                              <td className="p-1 border-b border-slate-200 text-center font-mono">{money(s.price)}</td>
                              <td className="p-1 border-b border-slate-200 text-center font-mono font-bold text-blue-900">{nf(s.qty)}</td>
                              <td className="p-1 border-b border-slate-200 text-center font-mono font-bold text-slate-900">{money(num(s.qty) * num(s.price))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* Grand Total Footer */}
                <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between font-bold text-xs">
                  <span>{isAr ? 'الإجمالي العام لمبيعات شهر أغسطس 2026 (53 صنفاً):' : 'Grand Total August 2026 Sales (53 SKUs):'}</span>
                  <div className="flex items-center gap-4 font-mono text-sm">
                    <span>{nf(totalSalesQty)} {isAr ? 'قطعة' : 'units'}</span>
                    <span className="text-emerald-400">{money(totalSalesRevenue)} {isAr ? 'ج.م' : 'EGP'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. REPORT CONTENT: PHYSICAL INVENTORY COUNT SHEET */}
            {activeReport === 'inventory' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-300 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-purple-950">
                      {isAr ? 'كشف الجرد الفعلي الميداني للمخازن والمطبخ (ورقة العد والحصر)' : 'Physical Inventory Count & Audit Sheet'}
                    </h2>
                    <p className="text-[11px] text-purple-800">
                      {isAr ? 'معدة للطباعة والاستخدام الميداني من قبل لجان الجرد والمطابقة' : 'Prepared for physical counting and stock verification'}
                    </p>
                  </div>
                  <div className="text-[11px] text-purple-900 font-bold">
                    {isAr ? 'عدد الخامات:' : 'Total Ingredients:'} {state.ing.length}
                  </div>
                </div>

                <table className="w-full text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900">
                    <tr>
                      <th className="p-1 border border-slate-300 text-center w-6">#</th>
                      <th className="p-1 border border-slate-300 text-center w-12">{isAr ? 'الكود' : 'Code'}</th>
                      <th className="p-1 border border-slate-300 text-right">{isAr ? 'اسم الخامة / الصنف' : 'Ingredient Name'}</th>
                      <th className="p-1 border border-slate-300 text-center w-12">{isAr ? 'الوحدة' : 'Unit'}</th>
                      <th className="p-1 border border-slate-300 text-center w-16">{isAr ? 'رصيد أول' : 'Beg'}</th>
                      <th className="p-1 border border-slate-300 text-center w-16">{isAr ? 'الوارد' : 'In'}</th>
                      <th className="p-1 border border-slate-300 text-center w-20 bg-amber-50 font-bold">{isAr ? 'العد الفعلي' : 'Count 1'}</th>
                      <th className="p-1 border border-slate-300 text-center w-20 bg-amber-50 font-bold">{isAr ? 'إعادة العد' : 'Count 2'}</th>
                      <th className="p-1 border border-slate-300 text-center w-28">{isAr ? 'ملاحظات وتوقيع' : 'Notes & Sign'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ing.map((g, idx) => (
                      <tr key={g.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1 border border-slate-300 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono text-slate-600">{g.id}</td>
                        <td className="p-1 border border-slate-300 font-semibold text-slate-900">{g.name}</td>
                        <td className="p-1 border border-slate-300 text-center text-slate-600">{g.unit}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono">{nf(state.beg[idx] || 0, 1)}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono">{nf(state.pur[idx] || 0, 1)}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono font-bold bg-amber-50/40">
                          {num(state.end[idx]) > 0 ? nf(state.end[idx], 1) : '___________'}
                        </td>
                        <td className="p-1 border border-slate-300 text-center bg-amber-50/40">___________</td>
                        <td className="p-1 border border-slate-300 text-center text-slate-400">_________________</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. REPORT CONTENT: MENU ENGINEERING MATRIX */}
            {activeReport === 'menu_eng' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-300 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-indigo-950">
                      {isAr ? 'تقرير مصفوفة هندسة قائمة الطعام (Menu Engineering & Profit Matrix)' : 'Menu Engineering & Profit Matrix'}
                    </h2>
                    <p className="text-[11px] text-indigo-800">
                      {isAr ? 'تصنيف بوسطن الاستراتيجي (النجوم، أحصنة العمل، الألغاز، والأصناف المتعثرة)' : 'Boston Consulting Group Menu Matrix Analysis'}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-indigo-900">
                    <div>{isAr ? 'متوسط هامش الربح:' : 'Avg Margin:'} <strong className="font-mono">{money(menuEngData.avgMargin)} {isAr ? 'ج.م' : 'EGP'}</strong></div>
                    <div>{isAr ? 'حد الشعبية:' : 'Pop Hurdle:'} <strong className="font-mono">{nf(menuEngData.popularityHurdle, 0)} {isAr ? 'قطعة' : 'units'}</strong></div>
                  </div>
                </div>

                <table className="w-full text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900">
                    <tr>
                      <th className="p-1 border border-slate-300 text-center w-6">#</th>
                      <th className="p-1 border border-slate-300 text-right">{isAr ? 'اسم الوجبة' : 'Item Name'}</th>
                      <th className="p-1 border border-slate-300 text-center w-16">{isAr ? 'الفئة' : 'Category'}</th>
                      <th className="p-1 border border-slate-300 text-center w-14">{isAr ? 'الكمية' : 'Sold'}</th>
                      <th className="p-1 border border-slate-300 text-center w-14">{isAr ? 'سعر البيع' : 'Price'}</th>
                      <th className="p-1 border border-slate-300 text-center w-14">{isAr ? 'التكلفة' : 'Cost'}</th>
                      <th className="p-1 border border-slate-300 text-center w-14">{isAr ? 'الهامش' : 'Margin'}</th>
                      <th className="p-1 border border-slate-300 text-center w-14">Cost %</th>
                      <th className="p-1 border border-slate-300 text-center w-24">{isAr ? 'التصنيف' : 'Quadrant'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuEngData.items.map((it, idx) => (
                      <tr key={it.code || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-1 border border-slate-300 font-semibold">{it.name}</td>
                        <td className="p-1 border border-slate-300 text-center text-slate-600">{it.cat}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono font-bold text-blue-900">{nf(it.qty)}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono">{money(it.price)}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono">{money(it.unitCost)}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono font-bold text-emerald-800">{money(it.unitMargin)}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono">{nf(it.fcPct, 1)}%</td>
                        <td className="p-1 border border-slate-300 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${it.badgeClass}`}>
                            {it.classLabel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. REPORT CONTENT: MRP FORECAST & PURCHASE PLAN */}
            {activeReport === 'forecast' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-emerald-950">
                      {isAr ? 'خطة التنبؤ وتفجير الاحتياجات التوريدية (MRP Supply & Purchasing Plan)' : 'MRP Supply & Purchasing Plan'}
                    </h2>
                    <p className="text-[11px] text-emerald-800">
                      {isAr ? 'الاحتياجات المتوقعة من الخامات لتغطية الإنتاج والمبيعات المستهدفة' : 'Projected ingredient requirements and replenishment orders'}
                    </p>
                  </div>
                </div>

                <table className="w-full text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900">
                    <tr>
                      <th className="p-1 border border-slate-300 text-center w-6">#</th>
                      <th className="p-1 border border-slate-300 text-right">{isAr ? 'الخامة' : 'Ingredient'}</th>
                      <th className="p-1 border border-slate-300 text-center w-12">{isAr ? 'الوحدة' : 'Unit'}</th>
                      <th className="p-1 border border-slate-300 text-center w-16">{isAr ? 'السعر' : 'Unit Price'}</th>
                      <th className="p-1 border border-slate-300 text-center w-20">{isAr ? 'الرصيد الحالي' : 'Stock'}</th>
                      <th className="p-1 border border-slate-300 text-center w-20">{isAr ? 'الاحتياج المقدر' : 'Req Qty'}</th>
                      <th className="p-1 border border-slate-300 text-center w-24 font-bold">{isAr ? 'الكمية المقترحة للشراء' : 'Order Qty'}</th>
                      <th className="p-1 border border-slate-300 text-center w-24 font-bold">{isAr ? 'التكلفة المقدرة' : 'Est Cost'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ing.slice(0, 30).map((g, idx) => {
                      const endStock = num(state.end[idx]);
                      const reqQty = num(metrics.idealCons[idx]);
                      const orderQty = Math.max(0, reqQty - endStock);
                      const estCost = orderQty * num(g.price);

                      return (
                        <tr key={g.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-1 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-1 border border-slate-300 font-semibold">{g.name}</td>
                          <td className="p-1 border border-slate-300 text-center text-slate-600">{g.unit}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{money(g.price)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{nf(endStock, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-blue-900 font-bold">{nf(reqQty, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono font-bold text-amber-800">{nf(orderQty, 1)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono font-bold text-slate-900">{money(estCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. REPORT CONTENT: OPERATING EXPENSES */}
            {activeReport === 'expenses' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-amber-950">
                      {isAr ? 'تقرير المصروفات التشغيلية والعمومية (Operating Expenses Report)' : 'Operating Expenses Report'}
                    </h2>
                    <p className="text-[11px] text-amber-800">
                      {isAr ? 'بيان المصروفات الثابتة والمتغيرة ونسبتها من إجمالي مبيعات الشهر' : 'Operating, fixed, and variable overheads breakdown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-900">
                      {isAr ? 'إجمالي المصروفات:' : 'Total Expenses:'} <strong className="font-mono text-sm">{money(totalExpenses)} {isAr ? 'ج.م' : 'EGP'}</strong>
                    </span>
                  </div>
                </div>

                <table className="w-full text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900">
                    <tr>
                      <th className="p-1 border border-slate-300 text-center w-6">#</th>
                      <th className="p-1 border border-slate-300 text-center w-20">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="p-1 border border-slate-300 text-right">{isAr ? 'بند المصروف' : 'Expense Title'}</th>
                      <th className="p-1 border border-slate-300 text-center w-24">{isAr ? 'التصنيف' : 'Category'}</th>
                      <th className="p-1 border border-slate-300 text-center w-24">{isAr ? 'طريقة الدفع' : 'Payment Method'}</th>
                      <th className="p-1 border border-slate-300 text-center w-24 font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.expenses || []).map((exp, idx) => (
                      <tr key={exp.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono">{exp.date}</td>
                        <td className="p-1 border border-slate-300 font-semibold">{exp.title}</td>
                        <td className="p-1 border border-slate-300 text-center text-slate-700">{exp.category}</td>
                        <td className="p-1 border border-slate-300 text-center text-slate-600">{exp.paymentMethod || 'Cash'}</td>
                        <td className="p-1 border border-slate-300 text-center font-mono font-bold text-slate-900">{money(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={5} className="p-1.5 border border-slate-300 text-left px-3">
                        {isAr ? 'إجمالي المصروفات التشغيلية:' : 'Total Operating Expenses:'}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center font-mono text-xs">
                        {money(totalExpenses)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Official Signatures Block */}
            {includeSignatures && (
              <div className="mt-8 pt-6 border-t-2 border-slate-400 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-4">
                  <div className="font-bold text-slate-900 text-[11px]">{isAr ? 'الشيف التنفيذي / مدير المطبخ' : 'Executive Chef'}</div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                    ............................................................
                  </div>
                  <div className="text-[10px] text-slate-500">{isAr ? 'التوقيع والتاريخ' : 'Signature & Date'}</div>
                </div>

                <div className="space-y-4">
                  <div className="font-bold text-slate-900 text-[11px]">{isAr ? 'مراقب التكاليف (Cost Controller)' : 'Cost Controller'}</div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                    ............................................................
                  </div>
                  <div className="text-[10px] text-slate-500">{isAr ? 'التوقيع والتاريخ' : 'Signature & Date'}</div>
                </div>

                <div className="space-y-4">
                  <div className="font-bold text-slate-900 text-[11px]">{isAr ? 'المدير العام / الاعتماد النهائي' : 'General Manager'}</div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                    ............................................................
                  </div>
                  <div className="text-[10px] text-slate-500">{isAr ? 'التوقيع والتاريخ' : 'Signature & Date'}</div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
              <div>
                D-Deli / بوتشرز • نظام ضبط تكلفة الأغذية والإيرادات V3 Pro • مستند رسمي غير قابل للتعديل بعد الاعتماد
              </div>
              <div className="font-mono">
                صفحة 1 من 1 • A4 300DPI
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
