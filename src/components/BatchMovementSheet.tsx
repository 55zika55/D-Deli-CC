import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ComputedMetrics, MovementType, Language, User } from '../types';
import { CATEGORIES_NAMES, CATEGORIES_COLORS } from '../initialData';
import { TRANSLATIONS } from '../translations';
import { nf, money, num } from '../utils/calculations';
import { exportBatchEntrySheetExcel } from '../utils/excel';
import { 
  PackagePlus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  TrendingDown, 
  ClipboardCheck, 
  Save, 
  Calendar, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  Check,
  ArrowRight
} from 'lucide-react';

export type BatchSheetType = 'recv' | 'tin' | 'production_in' | 'tout' | 'waste' | 'end';

interface BatchMovementSheetProps {
  sheetType: BatchSheetType;
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  currentUser: User | null;
  canEdit: boolean;
  onBatchAddTransactions: (txs: Array<{
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }>) => void;
  onBatchUpdateEndCounts: (newEndCounts: number[]) => void;
  onSwitchToOverview: () => void;
}

export const BatchMovementSheet: React.FC<BatchMovementSheetProps> = ({
  sheetType,
  state,
  metrics,
  currentLang,
  currentUser,
  canEdit,
  onBatchAddTransactions,
  onBatchUpdateEndCounts,
  onSwitchToOverview
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Configuration according to movement type
  const config = useMemo(() => {
    switch (sheetType) {
      case 'recv':
        return {
          title: '📥 بيان التوريدات والمشتريات (+)',
          shortTitle: 'بيان التوريدات',
          desc: 'إنزال فواتير المشتريات وخامات الموردين دفعة واحدة بالتاريخ ورقم الفاتورة',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          refPlaceholder: 'مثال: فاتورة #4582 / إذن استلام',
          notePlaceholder: 'اسم المورد أو ملاحظات الشحنة...',
          actionBtnText: 'حفظ وتسجيل التوريدات',
          icon: <PackagePlus className="w-5 h-5 text-emerald-500" />
        };
      case 'tin':
        return {
          title: '🔄 بيان التحويلات الواردة (+)',
          shortTitle: 'بيان التحويل الوارد',
          desc: 'تسجيل أذون التحويل الواردة من الفروع الأخرى أو المستودع المركزي',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
          refPlaceholder: 'مثال: إذن تحويل #TR-102',
          notePlaceholder: 'الفرع أو المستودع المحول منه...',
          actionBtnText: 'حفظ وتسجيل التحويل الوارد',
          icon: <ArrowDownLeft className="w-5 h-5 text-blue-500" />
        };
      case 'production_in':
        return {
          title: '🍳 بيان المصنعات والتجهيزات الواردة (+)',
          shortTitle: 'بيان المصنعات الواردة',
          desc: 'إنزال دفعات وتجهيزات المطبخ المركزي وأوامر التشغيل',
          badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
          refPlaceholder: 'مثال: أمر تشغيل #PRD-88',
          notePlaceholder: 'الوردية أو الشيف المسؤول...',
          actionBtnText: 'حفظ بيان المصنعات',
          icon: <Layers className="w-5 h-5 text-purple-500" />
        };
      case 'tout':
        return {
          title: '📤 بيان التحويلات الصادرة (-)',
          shortTitle: 'بيان التحويل الصادر',
          desc: 'تسجيل أذون صرف وتحويل الخامات والمواد الصادرة لفروع أخرى',
          badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
          refPlaceholder: 'مثال: إذن تحويل #TO-551',
          notePlaceholder: 'الفرع المستلم...',
          actionBtnText: 'حفظ التحويل الصادر',
          icon: <ArrowUpRight className="w-5 h-5 text-orange-500" />
        };
      case 'waste':
        return {
          title: '🗑️ بيان الهدر والتوالف (-)',
          shortTitle: 'بيان الهدر والتوالف',
          desc: 'تسجيل الهدر والتوالف اليومية للمطبخ بالتاريخ والسبب',
          badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
          refPlaceholder: 'مثال: تقرير هدر وردية #W-90',
          notePlaceholder: 'ملاحظات وتفاصيل التلف...',
          actionBtnText: 'حفظ بيان الهدر والتوالف',
          icon: <TrendingDown className="w-5 h-5 text-red-500" />
        };
      case 'end':
        return {
          title: '📋 بيان رصيد آخر المدة (الجرد الفعلي)',
          shortTitle: 'جرد آخر المدة',
          desc: 'إنزال وتحديث أرصدة الجرد الفعلي للمخزون الختامي لجميع الأصناف',
          badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
          refPlaceholder: 'مثال: محضر جرد #INV-2026',
          notePlaceholder: 'ملاحظات الجرد وحالة المخزن...',
          actionBtnText: 'حفظ وتحديث رصيد آخر المدة',
          icon: <ClipboardCheck className="w-5 h-5 text-indigo-500" />
        };
    }
  }, [sheetType]);

  // Common Header State
  const [batchDate, setBatchDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (today >= state.dFrom && today <= state.dTo) return today;
    return state.dTo || state.dFrom;
  });
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [wasteReason, setWasteReason] = useState<string>('تالف تحضير');

  // Quantities entered for each ingredient
  const [quantities, setQuantities] = useState<string[]>(() => {
    if (sheetType === 'end') {
      return state.ing.map((_, i) => (state.end[i] !== undefined && state.end[i] !== null ? String(state.end[i]) : ''));
    }
    return state.ing.map(() => '');
  });

  // Optional item notes
  const [itemNotes, setItemNotes] = useState<string[]>(() => state.ing.map(() => ''));

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');
  const [showEnteredOnly, setShowEnteredOnly] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{ count: number; totalCost: number } | null>(null);

  // When sheetType changes, reinitialize
  useEffect(() => {
    if (sheetType === 'end') {
      setQuantities(state.ing.map((_, i) => (state.end[i] !== undefined && state.end[i] !== null ? String(state.end[i]) : '')));
    } else {
      setQuantities(state.ing.map(() => ''));
    }
    setItemNotes(state.ing.map(() => ''));
  }, [sheetType, state.ing, state.end]);

  const handleQtyChange = (idx: number, val: string) => {
    setQuantities(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleItemNoteChange = (idx: number, val: string) => {
    setItemNotes(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleClearAll = () => {
    if (!window.confirm(`هل أنت متأكد من تصفير كافة الكميات المدخلة في ${config.shortTitle}؟`)) return;
    setQuantities(state.ing.map(() => ''));
    setItemNotes(state.ing.map(() => ''));
  };

  const handleFillExpectedEndStock = () => {
    if (!window.confirm("هل تريد تعبئة خانات الرصيد الختامي بالرصيد الدفتري المتوقع؟")) return;
    setQuantities(state.ing.map((_, i) => {
      const exp = Math.max(0, (state.beg[i] || 0) + (metrics.recv[i] || 0) + (metrics.tin[i] || 0) + (metrics.production_in[i] || 0) - (metrics.tout[i] || 0) - (metrics.waste[i] || 0) - (metrics.production_consume[i] || 0) - (metrics.adj[i] || 0));
      return String(Number(exp.toFixed(2)));
    }));
  };

  const handleFillBegStock = () => {
    if (!window.confirm("هل تريد نسخ أرصدة أول المدة إلى هذا البيان؟")) return;
    setQuantities(state.ing.map((_, i) => String(state.beg[i] || 0)));
  };

  // Live item calculations
  const rows = useMemo(() => {
    return state.ing.map((g, originalIndex) => {
      const price = num(g.price);
      const beg = num(state.beg[originalIndex]);
      const end = num(state.end[originalIndex]);
      
      const qtyStr = quantities[originalIndex] || '';
      const hasQty = qtyStr.trim() !== '' && !isNaN(Number(qtyStr)) && Number(qtyStr) > 0;
      const qtyNum = hasQty ? Number(qtyStr) : 0;
      const rowCost = qtyNum * price;
      const note = itemNotes[originalIndex] || '';

      const recv = metrics.recv[originalIndex] || 0;
      const tin = metrics.tin[originalIndex] || 0;
      const tout = metrics.tout[originalIndex] || 0;
      const waste = metrics.waste[originalIndex] || 0;
      const currentStock = Math.max(0, beg + recv + tin - tout - waste);

      return {
        originalIndex,
        id: g.id,
        name: g.name,
        cat: g.cat,
        unit: g.unit,
        price,
        beg,
        end,
        currentStock,
        qtyStr,
        hasQty,
        qtyNum,
        rowCost,
        note
      };
    });
  }, [state.ing, state.beg, state.end, metrics, quantities, itemNotes]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (selectedCat !== 'all' && r.cat !== selectedCat) return false;
      if (showEnteredOnly && !r.hasQty) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, selectedCat, showEnteredOnly, search]);

  // Overall batch statistics
  const batchStats = useMemo(() => {
    let enteredCount = 0;
    let totalQty = 0;
    let totalCost = 0;

    rows.forEach(r => {
      if (r.hasQty) {
        enteredCount++;
        totalQty += r.qtyNum;
        totalCost += r.rowCost;
      }
    });

    return {
      enteredCount,
      totalQty,
      totalCost,
      totalItems: state.ing.length
    };
  }, [rows, state.ing.length]);

  // Batch Submission
  const handleSubmitBatch = () => {
    if (!batchDate) {
      alert("يرجى تحديد تاريخ صحيح للبيان");
      return;
    }

    if (sheetType === 'end') {
      const newEndCounts = quantities.map(q => (q.trim() === '' ? 0 : num(q)));
      onBatchUpdateEndCounts(newEndCounts);
      setSuccessOverlay({ count: batchStats.enteredCount || state.ing.length, totalCost: batchStats.totalCost });
    } else {
      const txsToSubmit: Array<{
        date: string;
        type: MovementType;
        ingredientId: string;
        qty: number;
        reference: string;
        note: string;
      }> = [];

      rows.forEach(r => {
        if (r.hasQty) {
          const finalNoteParts = [];
          if (sheetType === 'waste' && wasteReason) finalNoteParts.push(`[${wasteReason}]`);
          if (notes.trim()) finalNoteParts.push(notes.trim());
          if (r.note.trim()) finalNoteParts.push(`(${r.note.trim()})`);

          txsToSubmit.push({
            date: batchDate,
            type: sheetType as MovementType,
            ingredientId: r.id,
            qty: r.qtyNum,
            reference: reference.trim() || `${config.shortTitle} — ${batchDate}`,
            note: finalNoteParts.join(' ')
          });
        }
      });

      if (txsToSubmit.length === 0) {
        alert("لم يتم إدخال أي كميات في البيان. يرجى إدخال كمية لصنف واحد على الأقل قبل الحفظ.");
        return;
      }

      onBatchAddTransactions(txsToSubmit);
      setSuccessOverlay({ count: txsToSubmit.length, totalCost: batchStats.totalCost });
    }
  };

  const handleExportExcel = () => {
    exportBatchEntrySheetExcel(
      config.title,
      batchDate,
      reference,
      notes + (sheetType === 'waste' ? ` [${wasteReason}]` : ''),
      rows.map(r => ({
        id: r.id,
        name: r.name,
        cat: r.cat,
        unit: r.unit,
        price: r.price,
        currentStock: r.currentStock,
        qty: r.qtyNum,
        cost: r.rowCost,
        note: r.note
      }))
    );
  };

  const resetForNewBatch = () => {
    setSuccessOverlay(null);
    setQuantities(state.ing.map(() => ''));
    setItemNotes(state.ing.map(() => ''));
    setReference('');
  };

  return (
    <div className="space-y-3">
      {/* Header Info & Date Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
        
        {/* Title row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
              {config.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {config.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {config.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Inputs row: Date, Ref, Notes, Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300">التاريخ</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBatchDate(new Date().toISOString().slice(0, 10))}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  اليوم
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setBatchDate(y.toISOString().slice(0, 10));
                  }}
                  className="text-[10px] text-slate-500 font-semibold hover:underline"
                >
                  أمس
                </button>
              </div>
            </div>
            <input
              type="date"
              value={batchDate}
              onChange={e => setBatchDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">رقم الفاتورة / المرجع</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={config.refPlaceholder}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">ملاحظات عامة</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={config.notePlaceholder}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
            />
          </div>

          {sheetType === 'waste' ? (
            <div className="space-y-1">
              <label className="font-bold text-red-600 dark:text-red-400">سبب الهدر والتالف</label>
              <select
                value={wasteReason}
                onChange={e => setWasteReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-red-50 dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl font-semibold text-red-700 dark:text-red-300 focus:outline-none"
              >
                <option value="تالف تحضير">تالف تحضير وتجهيز</option>
                <option value="انتهاء صلاحية">انتهاء فترة الصلاحية</option>
                <option value="حرق وسوء تسوية">حرق وسوء تسوية</option>
                <option value="سقوط وتلوث">سقوط وتلوث</option>
                <option value="سوء تخزين وتبريد">سوء تخزين وتبريد</option>
                <option value="هدر وتعديل زبون">هدر وتعديل زبون</option>
                <option value="أخرى">أسباب أخرى</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1 flex flex-col justify-end">
              <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>المستخدم:</span>
                <span className="font-bold">{currentUser ? currentUser.name : 'مسؤول النظام'}</span>
              </div>
            </div>
          )}

        </div>

        {/* Live Summary Strip */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500">الأصناف المدخلة: </span>
              <strong className="text-blue-600 dark:text-blue-400 font-bold">{batchStats.enteredCount} صنف</strong>
            </div>
            <div>
              <span className="text-slate-500">إجمالي الكمية: </span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">{nf(batchStats.totalQty)}</strong>
            </div>
            <div>
              <span className="text-slate-500">القيمة التقديرية: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{money(batchStats.totalCost)} ج.م</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sheetType === 'end' && (
              <button
                type="button"
                onClick={handleFillExpectedEndStock}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-semibold transition"
              >
                تعبئة بالمتوقع
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-1 text-slate-500 hover:text-red-500 text-[11px] transition"
            >
              تصفير
            </button>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative w-44 sm:w-56">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 بحث باسم الصنف..."
              className="w-full pl-7 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
          </div>

          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs dark:text-white focus:outline-none"
          >
            <option value="all">كل الأقسام</option>
            {CATEGORIES_NAMES.map((cName, idx) => (
              <option key={idx} value={idx}>{cName}</option>
            ))}
          </select>

          <button
            onClick={() => setShowEnteredOnly(!showEnteredOnly)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
              showEnteredOnly
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {showEnteredOnly ? 'المدخل فقط ✓' : 'كل الأصناف'}
          </button>
        </div>

        {/* Save button in toolbar */}
        {canEdit && (
          <button
            type="button"
            onClick={handleSubmitBatch}
            disabled={batchStats.enteredCount === 0 && sheetType !== 'end'}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm ${
              batchStats.enteredCount > 0 || sheetType === 'end'
                ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{config.actionBtnText} ({batchStats.enteredCount})</span>
          </button>
        )}
      </div>

      {/* Clean Interactive Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2 text-center w-10">#</th>
                <th className="p-2 text-center w-20">الكود</th>
                <th className="p-2 text-right min-w-[170px]">اسم المكون / الخامة</th>
                <th className="p-2 text-center w-20">القسم</th>
                <th className="p-2 text-center w-14">الوحدة</th>
                <th className="p-2 text-center w-20">سعر الوحدة</th>
                <th className="p-2 text-center w-20 bg-slate-800 text-slate-300">الرصيد الحالي</th>
                <th className="p-2 text-center w-32 bg-blue-900 text-yellow-300 font-bold">
                  الكمية ✏️
                </th>
                <th className="p-2 text-center w-24 bg-slate-800 text-emerald-300 font-bold">القيمة</th>
                <th className="p-2 text-center min-w-[120px]">ملاحظة (اختياري)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-850">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد أصناف تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr 
                    key={r.id} 
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors ${
                      r.hasQty ? 'bg-blue-50/30 dark:bg-blue-950/20 font-semibold' : ''
                    }`}
                  >
                    <td className="p-2 text-center text-slate-400">{r.originalIndex + 1}</td>
                    <td className="p-2 text-center font-mono text-slate-500">{r.id}</td>
                    <td className="p-2 font-bold text-slate-800 dark:text-slate-100 text-right">{r.name}</td>
                    <td className="p-1 text-center">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                        style={{ backgroundColor: `${CATEGORIES_COLORS[r.cat]}25`, color: '#334155' }}
                      >
                        {CATEGORIES_NAMES[r.cat]}
                      </span>
                    </td>
                    <td className="p-2 text-center text-slate-600 dark:text-slate-300">{r.unit}</td>
                    <td className="p-2 text-center font-mono text-slate-500">{money(r.price)}</td>
                    <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                      {nf(r.currentStock)}
                    </td>

                    {/* Quantity Input */}
                    <td className="p-1 text-center bg-blue-50/20 dark:bg-blue-950/20">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={!canEdit}
                        value={r.qtyStr}
                        onChange={e => handleQtyChange(r.originalIndex, e.target.value)}
                        onFocus={e => e.target.select()}
                        className={`w-24 text-center py-1 px-1.5 rounded-lg border text-xs font-bold transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          r.hasQty 
                            ? 'border-blue-500 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      />
                    </td>

                    <td className="p-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {r.rowCost > 0 ? money(r.rowCost) : '—'}
                    </td>

                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="ملاحظة..."
                        value={r.note}
                        disabled={!canEdit}
                        onChange={e => handleItemNoteChange(r.originalIndex, e.target.value)}
                        className="w-full text-xs px-2 py-0.5 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none dark:text-white"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10">
              <tr>
                <td colSpan={6} className="p-2 text-right">الإجمالي:</td>
                <td className="p-2 text-center font-mono text-slate-400">
                  {nf(filteredRows.reduce((a, b) => a + b.currentStock, 0))}
                </td>
                <td className="p-2 text-center font-mono text-yellow-300 font-bold">
                  {nf(batchStats.totalQty)}
                </td>
                <td className="p-2 text-center font-mono text-emerald-300 font-bold">
                  {money(batchStats.totalCost)}
                </td>
                <td className="p-2 text-center text-slate-400 text-[11px]">
                  {batchStats.enteredCount} صنف
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Success Modal */}
      {successOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              تم حفظ البيان بنجاح!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              تم تسجيل {successOverlay.count} صنف بتاريخ {batchDate} بقيمة {money(successOverlay.totalCost)} ج.م
            </p>
            <div className="pt-2 flex flex-col gap-1.5">
              <button
                onClick={resetForNewBatch}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
              >
                تسجيل بيان جديد
              </button>
              <button
                onClick={onSwitchToOverview}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                العودة لكشف الحركات
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
