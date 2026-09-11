import React, { useState, useMemo } from 'react';
import { AppState, ComputedMetrics, Language } from '../types';
import { CATEGORIES_NAMES, CATEGORIES_COLORS } from '../initialData';
import { TRANSLATIONS } from '../translations';
import { nf, money, num } from '../utils/calculations';
import { exportPhysicalCountSheetExcel } from '../utils/excel';
import { 
  ClipboardCheck, 
  Printer, 
  FileSpreadsheet, 
  X, 
  Eye, 
  EyeOff, 
  Save, 
  Filter, 
  CheckCircle2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Boxes,
  RotateCcw,
  Search,
  Check,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

interface PhysicalInventoryModalProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onClose: () => void;
  onApplyCounts: (newEndCounts: number[]) => void;
  onOpenReportsPrint?: (report: 'inventory') => void;
}

export const PhysicalInventoryModal: React.FC<PhysicalInventoryModalProps> = ({
  state,
  metrics,
  currentLang,
  canEdit,
  onClose,
  onApplyCounts,
  onOpenReportsPrint
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Local state for counts being typed
  const [counts, setCounts] = useState<string[]>(() => {
    return state.ing.map((_, i) => (state.end[i] !== undefined && state.end[i] !== null ? String(state.end[i]) : ''));
  });

  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');
  const [blindMode, setBlindMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'full_summary' | 'compact'>('full_summary');
  const [search, setSearch] = useState<string>('');
  const [appliedMsg, setAppliedMsg] = useState<boolean>(false);

  const handleCountChange = (index: number, val: string) => {
    setCounts(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleFillExpected = () => {
    if (!window.confirm("هل تريد تعبئة خانات الجرد الفعلي بالرصيد الدفتري المتوقع للمراجعة السريعة؟")) return;
    setCounts(state.ing.map((_, i) => {
      const exp = Math.max(0, (state.beg[i] || 0) + (metrics.recv[i] || 0) + (metrics.tin[i] || 0) + (metrics.production_in[i] || 0) - (metrics.tout[i] || 0) - (metrics.waste[i] || 0) - (metrics.production_consume[i] || 0) - (metrics.adj[i] || 0));
      return String(Number(exp.toFixed(2)));
    }));
  };

  const handleClearAll = () => {
    if (!window.confirm("هل تريد مسح جميع القيم المدخلة في الجرد الفعلي؟")) return;
    setCounts(state.ing.map(() => ''));
  };

  const handleSaveAndApply = () => {
    const numericCounts = counts.map(c => (c.trim() === '' ? 0 : num(c)));
    onApplyCounts(numericCounts);
    setAppliedMsg(true);
    setTimeout(() => {
      setAppliedMsg(false);
      onClose();
    }, 1200);
  };

  // Compute live dynamic metrics based on counts currently entered in the modal
  const liveRows = useMemo(() => {
    return state.ing.map((g, originalIndex) => {
      const adjVal = metrics.adj[originalIndex] || 0;
      const begVal = num(state.beg[originalIndex]);
      const recvVal = metrics.recv[originalIndex] || 0;
      const tinVal = metrics.tin[originalIndex] || 0;
      const prodInVal = metrics.production_in[originalIndex] || 0;
      const toutVal = metrics.tout[originalIndex] || 0;
      const wasteVal = metrics.waste[originalIndex] || 0;
      const prodConsumeVal = metrics.production_consume[originalIndex] || 0;
      
      const countStr = counts[originalIndex];
      const hasCount = countStr !== undefined && countStr.trim() !== '';
      const endVal = hasCount ? num(countStr) : num(state.end[originalIndex]);

      // Inflow & Outflow
      const totalIn = begVal + recvVal + tinVal + prodInVal;
      const totalOut = toutVal + wasteVal + prodConsumeVal;

      // Actual consumption based on counted stock
      const actVal = totalIn - totalOut - endVal;
      
      // Variance = Theoretical (adj) - Actual
      const varVal = adjVal - actVal;
      const cvarVal = varVal * num(g.price);

      // Book expected stock = totalIn - totalOut - adjVal
      const expectedStock = Math.max(0, totalIn - totalOut - adjVal);

      return {
        originalIndex,
        g,
        adjVal,
        begVal,
        recvVal,
        tinVal,
        prodInVal,
        toutVal,
        wasteVal,
        prodConsumeVal,
        countStr,
        hasCount,
        endVal,
        actVal,
        varVal,
        cvarVal,
        expectedStock,
        price: num(g.price)
      };
    });
  }, [state.ing, state.beg, state.end, metrics, counts]);

  const filteredRows = useMemo(() => {
    return liveRows.filter(({ g }) => {
      if (selectedCat !== 'all' && g.cat !== selectedCat) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [liveRows, selectedCat, search]);

  const countedCount = counts.filter(c => c.trim() !== '').length;
  const totalCount = state.ing.length;

  // Header Summary KPI calculations based on current live rows
  const totals = useMemo(() => {
    let totalVarCost = 0;
    let totalVarQty = 0;
    let totalEndValue = 0;
    let totalBegValue = 0;
    let totalAdjValue = 0;

    liveRows.forEach(r => {
      totalVarCost += r.cvarVal;
      totalVarQty += r.varVal;
      totalEndValue += r.endVal * r.price;
      totalBegValue += r.begVal * r.price;
      totalAdjValue += r.adjVal * r.price;
    });

    return {
      totalVarCost,
      totalVarQty,
      totalEndValue,
      totalBegValue,
      totalAdjValue
    };
  }, [liveRows]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-1 sm:p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[96vw] xl:max-w-7xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] flex flex-col my-auto overflow-hidden animate-fadeIn">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg">
                  📋 كشف وفورمة الجرد الفعلي للمخزون وتحليل الفروقات
                </h3>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                  جميع الأصناف ({state.ing.length})
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  مطابق لجدول الملخص 1:1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إدخال وعد الجرد الفعلي الميداني مع الاحتساب اللحظي للاستهلاك الفعلي والفروقات وتكلفة الفاقد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenReportsPrint) {
                  onOpenReportsPrint('inventory');
                } else {
                  window.print();
                }
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              title="طباعة وتصدير كشف الجرد على ورق A4 أو PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة الكشف / PDF</span>
            </button>

            <button
              onClick={() => exportPhysicalCountSheetExcel(state, blindMode, metrics)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              title="تصدير كشف الجرد والفروقات كاملاً إلى Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Top KPI Summary Strip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs no-print">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-[11px] text-slate-500 font-medium mb-0.5">حالة إدخال الجرد</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span>{countedCount} / {totalCount} صنف</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold">
                {Math.round((countedCount / totalCount) * 100)}%
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-[11px] text-slate-500 font-medium mb-0.5">قيمة المخزون المعدود</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {money(totals.totalEndValue)} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-[11px] text-slate-500 font-medium mb-0.5">تكلفة الاستهلاك النظري</div>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {money(totals.totalAdjValue)} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 sm:col-span-1">
            <div className="text-[11px] text-slate-500 font-medium mb-0.5">إجمالي كمية الفروقات</div>
            <div className={`text-sm font-bold ${totals.totalVarQty < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {totals.totalVarQty > 0 ? `+${nf(totals.totalVarQty)}` : nf(totals.totalVarQty)}
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border shadow-sm col-span-2 sm:col-span-4 lg:col-span-1 ${
            totals.totalVarCost < 0 
              ? 'bg-red-50/80 border-red-200 dark:bg-red-950/40 dark:border-red-800/80 text-red-900 dark:text-red-200' 
              : 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="text-[11px] font-semibold mb-0.5">صافي تكلفة الفروقات</div>
            <div className="text-sm font-black">
              {money(totals.totalVarCost)} ج.م
            </div>
          </div>
        </div>

        {/* Controls Toolbar (hidden on print) */}
        <div className="p-3 bg-slate-100/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent text-xs font-semibold focus:outline-none dark:text-white cursor-pointer"
              >
                <option value="all">كل الأقسام والتصنيفات ({state.ing.length} صنف)</option>
                {CATEGORIES_NAMES.map((cName, idx) => {
                  const count = state.ing.filter(g => g.cat === idx).length;
                  return (
                    <option key={idx} value={idx}>
                      {cName} ({count} صنف)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-56">
              <input
                type="text"
                placeholder="🔍 بحث باسم الصنف أو الكود..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => setViewMode('full_summary')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'full_summary'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>عرض تفصيلي بالملخص والفروقات</span>
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'compact'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>عرض مصغر للعد السريع</span>
              </button>
            </div>

            {/* Blind Mode Toggle */}
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`px-2.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition shadow-sm ${
                blindMode 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="إخفاء الرصيد الدفتري لضمان عد نزيه ومستقل"
            >
              {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{blindMode ? 'جرد أعمى (مفعل)' : 'جرد أعمى'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFillExpected}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              title="تعبئة الخانات تلقائياً بالرصيد المتوقع دفترياً"
            >
              تعبئة بالمتوقع
            </button>

            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              title="مسح جميع الأرقام المدخلة"
            >
              تصفير
            </button>

            {canEdit && (
              <button
                onClick={handleSaveAndApply}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" />
                <span>تطبيق على المخزون الختامي</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable Paper Header (visible on print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">🍽️ كشف الجرد الفعلي للمخزون وتحليل الفروقات — D-Deli / بوتشرز</h4>
            <p className="text-slate-500">تاريخ الجرد: {state.dTo} • الفترة: من {state.dFrom} إلى {state.dTo} • إجمالي {state.ing.length} صنف</p>
          </div>
          <div className="text-left text-slate-500">
            <div>الفرع: <span className="font-semibold text-slate-800 dark:text-slate-200">الرئيسي</span></div>
            <div>لجنة الجرد: ___________________</div>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-900 text-white sticky top-0 z-10 shadow">
              {viewMode === 'full_summary' ? (
                /* Full Summary & Variances Header */
                <tr>
                  <th className="p-2 text-center w-8 border border-slate-700">#</th>
                  <th className="p-2 text-center w-18 border border-slate-700">كود الصنف</th>
                  <th className="p-2 text-right min-w-[160px] border border-slate-700">{t("col_name")}</th>
                  <th className="p-2 text-center w-20 border border-slate-700">{t("col_cat")}</th>
                  <th className="p-2 text-center w-12 border border-slate-700">{t("col_unit")}</th>
                  <th className="p-2 text-center w-16 border border-slate-700">سعر الوحدة</th>
                  <th className="p-2 text-center w-18 border border-slate-700 bg-slate-800 text-blue-300 font-bold">{t("col_adj_ideal")}</th>
                  {!blindMode && (
                    <>
                      <th className="p-2 text-center w-16 border border-slate-700">{t("col_beg")}</th>
                      <th className="p-2 text-center w-14 border border-slate-700 bg-emerald-950/70 text-emerald-300 font-bold">توريد (+)</th>
                      <th className="p-2 text-center w-14 border border-slate-700 bg-blue-950/70 text-blue-300">تحويل (+)</th>
                      <th className="p-2 text-center w-14 border border-slate-700 bg-purple-950/70 text-purple-300">تصنيع (+)</th>
                      <th className="p-2 text-center w-14 border border-slate-700 bg-orange-950/70 text-orange-300">صادر (-)</th>
                      <th className="p-2 text-center w-14 border border-slate-700 bg-red-950/70 text-red-300 font-bold">هدر (-)</th>
                      <th className="p-2 text-center w-14 border border-slate-700 bg-amber-950/70 text-amber-300">استهلاك (-)</th>
                    </>
                  )}
                  <th className="p-2 text-center w-24 bg-blue-900 border border-blue-700 text-yellow-300 font-black">
                    الجرد الفعلي (المعدود)
                  </th>
                  <th className="p-2 text-center w-18 border border-slate-700 bg-slate-800 text-slate-200 font-bold">{t("col_actual")}</th>
                  <th className="p-2 text-center w-18 border border-slate-700 bg-slate-800 text-yellow-300 font-bold">{t("col_variance")}</th>
                  <th className="p-2 text-center w-22 border border-slate-700 bg-slate-800 text-yellow-300 font-bold">{t("col_variance_cost")}</th>
                </tr>
              ) : (
                /* Compact Count Sheet Header */
                <tr>
                  <th className="p-2 text-center w-10 border border-slate-700">#</th>
                  <th className="p-2 text-center w-20 border border-slate-700">كود الصنف</th>
                  <th className="p-2 text-right min-w-[180px] border border-slate-700">اسم المكون / الخامة</th>
                  <th className="p-2 text-center w-24 border border-slate-700">القسم</th>
                  <th className="p-2 text-center w-14 border border-slate-700">الوحدة</th>
                  {!blindMode && (
                    <th className="p-2 text-center w-20 border border-slate-700">رصيد أول</th>
                  )}
                  <th className="p-2 text-center w-28 bg-blue-900 border border-blue-700 text-yellow-300 font-bold">
                    الجرد الفعلي (المعدود)
                  </th>
                  {!blindMode && (
                    <th className="p-2 text-center w-20 border border-slate-700">الفرق التقديري</th>
                  )}
                  <th className="p-2 text-center min-w-[120px] border border-slate-700">ملاحظات / حالة الصنف</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-850">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'full_summary' ? 18 : 9} className="p-8 text-center text-slate-400">
                    لا توجد أصناف تطابق شروط البحث أو التصفية الحالية
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const isNegative = r.varVal < 0;
                  const hasEntered = r.hasCount;

                  if (viewMode === 'full_summary') {
                    return (
                      <tr 
                        key={`${r.g.id}-${r.originalIndex}`} 
                        className={`hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors ${
                          hasEntered ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                        }`}
                      >
                        <td className="p-1.5 text-center font-bold text-slate-400 border border-slate-200 dark:border-slate-800">
                          {r.originalIndex + 1}
                        </td>
                        <td className="p-1.5 text-center font-mono font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                          {r.g.id}
                        </td>
                        <td className="p-1.5 font-bold text-slate-800 dark:text-slate-100 text-right border border-slate-200 dark:border-slate-800">
                          <span>{r.g.name}</span>
                        </td>
                        <td className="p-1 text-center border border-slate-200 dark:border-slate-800">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                            style={{ backgroundColor: `${CATEGORIES_COLORS[r.g.cat]}30`, color: '#334155' }}
                          >
                            {CATEGORIES_NAMES[r.g.cat] || `قسم ${r.g.cat}`}
                          </span>
                        </td>
                        <td className="p-1.5 text-center font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          {r.g.unit}
                        </td>
                        <td className="p-1.5 text-center font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                          {money(r.price)}
                        </td>
                        <td className="p-1.5 text-center font-semibold font-mono text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20 border border-slate-200 dark:border-slate-800">
                          {nf(r.adjVal)}
                        </td>

                        {!blindMode && (
                          <>
                            <td className="p-1.5 text-center font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                              {nf(r.begVal)}
                            </td>
                            <td className="p-1.5 text-center font-mono text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
                              {r.recvVal > 0 ? `+${nf(r.recvVal)}` : '—'}
                            </td>
                            <td className="p-1.5 text-center font-mono text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-800">
                              {r.tinVal > 0 ? `+${nf(r.tinVal)}` : '—'}
                            </td>
                            <td className="p-1.5 text-center font-mono text-purple-700 dark:text-purple-400 border border-slate-200 dark:border-slate-800">
                              {r.prodInVal > 0 ? `+${nf(r.prodInVal)}` : '—'}
                            </td>
                            <td className="p-1.5 text-center font-mono text-orange-700 dark:text-orange-400 border border-slate-200 dark:border-slate-800">
                              {r.toutVal > 0 ? `-${nf(r.toutVal)}` : '—'}
                            </td>
                            <td className="p-1.5 text-center font-mono text-red-600 dark:text-red-400 font-bold border border-slate-200 dark:border-slate-800">
                              {r.wasteVal > 0 ? `-${nf(r.wasteVal)}` : '—'}
                            </td>
                            <td className="p-1.5 text-center font-mono text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800">
                              {r.prodConsumeVal > 0 ? `-${nf(r.prodConsumeVal)}` : '—'}
                            </td>
                          </>
                        )}

                        {/* Interactive Physical Count Field */}
                        <td className="p-1 text-center bg-blue-50/50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-700">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={!canEdit}
                            value={r.countStr}
                            onChange={e => handleCountChange(r.originalIndex, e.target.value)}
                            className="w-20 text-center py-1 px-1.5 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 font-black text-xs text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Live Actual Consumption */}
                        <td className="p-1.5 text-center font-bold font-mono text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
                          {nf(r.actVal)}
                        </td>

                        {/* Live Variance */}
                        <td className={`p-1.5 text-center font-bold font-mono border border-slate-200 dark:border-slate-800 ${
                          isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {r.varVal > 0 ? `+${nf(r.varVal)}` : nf(r.varVal)}
                        </td>

                        {/* Live Variance Cost */}
                        <td className={`p-1.5 text-center font-black font-mono border border-slate-200 dark:border-slate-800 ${
                          isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {money(r.cvarVal)}
                        </td>
                      </tr>
                    );
                  }

                  // Compact view
                  const estDiff = r.hasCount ? r.endVal - r.begVal : null;
                  return (
                    <tr 
                      key={`${r.g.id}-${r.originalIndex}`} 
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <td className="p-2 text-center font-bold text-slate-400 border border-slate-200 dark:border-slate-800">
                        {r.originalIndex + 1}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {r.g.id}
                      </td>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-100 text-right border border-slate-200 dark:border-slate-800">
                        <span>{r.g.name}</span>
                      </td>
                      <td className="p-1.5 text-center border border-slate-200 dark:border-slate-800">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                          style={{ backgroundColor: `${CATEGORIES_COLORS[r.g.cat]}30`, color: '#334155' }}
                        >
                          {CATEGORIES_NAMES[r.g.cat] || `قسم ${r.g.cat}`}
                        </span>
                      </td>
                      <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        {r.g.unit}
                      </td>
                      {!blindMode && (
                        <td className="p-2 text-center font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          {nf(r.begVal)}
                        </td>
                      )}
                      <td className="p-1 text-center bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="—"
                          disabled={!canEdit}
                          value={r.countStr}
                          onChange={e => handleCountChange(r.originalIndex, e.target.value)}
                          className="w-24 text-center py-1 px-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-bold text-sm text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      {!blindMode && (
                        <td className="p-2 text-center font-mono font-bold border border-slate-200 dark:border-slate-800">
                          {estDiff !== null ? (
                            <span className={estDiff < 0 ? 'text-red-500' : 'text-emerald-600'}>
                              {estDiff > 0 ? `+${nf(estDiff)}` : nf(estDiff)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="p-1 border border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          placeholder="سليم / منتهي / ملاحظة..."
                          className="w-full text-xs px-2 py-1 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none dark:text-white"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10 shadow">
              {viewMode === 'full_summary' ? (
                <tr>
                  <td colSpan={6} className="p-2 text-right">الإجمالي العام:</td>
                  <td className="p-2 text-center font-mono text-blue-300">{nf(liveRows.reduce((a, b) => a + b.adjVal, 0))}</td>
                  {!blindMode && (
                    <>
                      <td className="p-2 text-center font-mono">{nf(liveRows.reduce((a, b) => a + b.begVal, 0))}</td>
                      <td className="p-2 text-center font-mono text-emerald-400">{nf(liveRows.reduce((a, b) => a + b.recvVal, 0))}</td>
                      <td className="p-2 text-center font-mono text-blue-400">{nf(liveRows.reduce((a, b) => a + b.tinVal, 0))}</td>
                      <td className="p-2 text-center font-mono text-purple-400">{nf(liveRows.reduce((a, b) => a + b.prodInVal, 0))}</td>
                      <td className="p-2 text-center font-mono text-orange-400">{nf(liveRows.reduce((a, b) => a + b.toutVal, 0))}</td>
                      <td className="p-2 text-center font-mono text-red-400">{nf(liveRows.reduce((a, b) => a + b.wasteVal, 0))}</td>
                      <td className="p-2 text-center font-mono text-amber-400">{nf(liveRows.reduce((a, b) => a + b.prodConsumeVal, 0))}</td>
                    </>
                  )}
                  <td className="p-2 text-center font-mono text-yellow-300 font-black">{nf(liveRows.reduce((a, b) => a + b.endVal, 0))}</td>
                  <td className="p-2 text-center font-mono">{nf(liveRows.reduce((a, b) => a + b.actVal, 0))}</td>
                  <td className={`p-2 text-center font-mono ${totals.totalVarQty < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {nf(totals.totalVarQty)}
                  </td>
                  <td className={`p-2 text-center font-mono text-sm ${totals.totalVarCost < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {money(totals.totalVarCost)}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={5} className="p-2 text-right">الإجمالي:</td>
                  {!blindMode && <td className="p-2 text-center font-mono">{nf(liveRows.reduce((a, b) => a + b.begVal, 0))}</td>}
                  <td className="p-2 text-center font-mono text-yellow-300 font-bold">{nf(liveRows.reduce((a, b) => a + b.endVal, 0))}</td>
                  {!blindMode && <td></td>}
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>

          {/* Printable Signature Section */}
          <div className="mt-8 pt-6 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">مسؤول الجرد</div>
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div className="text-[10px] text-slate-500">الاسم والتوقيع</div>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">أمين المخزن</div>
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div className="text-[10px] text-slate-500">الاسم والتوقيع</div>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">الشيف التنفيذي</div>
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div className="text-[10px] text-slate-500">الاسم والتوقيع</div>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">مدير التشغيل</div>
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div className="text-[10px] text-slate-500">الاسم والتوقيع</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden on print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>نصيحة: يمكنك التنقل بين الخانات بسرعة باستخدام زر Tab على لوحة المفاتيح والضغط على تطبيق لحفظ الجرد فوراً.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              إلغاء
            </button>

            {canEdit && (
              <button
                onClick={handleSaveAndApply}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق الجرد الفعلي على السيستم</span>
              </button>
            )}
          </div>
        </div>

        {appliedMsg && (
          <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center text-white animate-fadeIn">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
            <h3 className="text-lg font-bold">تم تطبيق الجرد الفعلي بنجاح!</h3>
            <p className="text-xs text-slate-300">تم تحديث المخزون الختامي لجميع الأصناف وحساب الفروقات فوراً.</p>
          </div>
        )}

      </div>
    </div>
  );
};
