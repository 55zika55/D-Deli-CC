import React, { useState, useMemo } from 'react';
import { AppState, ComputedMetrics, MovementType, Language, User } from '../types';
import { TRANSLATIONS } from '../translations';
import { CATEGORIES_NAMES, CATEGORIES_COLORS } from '../initialData';
import { BatchMovementSheet, BatchSheetType } from './BatchMovementSheet';
import { 
  PackagePlus, 
  CheckCircle2, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Calendar, 
  X, 
  TrendingDown, 
  TrendingUp, 
  Boxes, 
  Eye, 
  Layers,
  ClipboardCheck,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { nf, money, num } from '../utils/calculations';
import { exportDailyMovementsExcel } from '../utils/excel';
import { SuggestedOrderModal } from './SuggestedOrderModal';
import { ShoppingCart } from 'lucide-react';
import { AutocompleteSelect, AutocompleteOption } from './AutocompleteSelect';

interface MovesTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  currentUser: User | null;
  canEdit: boolean;
  onAddTransaction: (tx: {
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }) => void;
  onBatchAddTransactions?: (txs: Array<{
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }>) => void;
  onBatchUpdateEndCounts?: (newEndCounts: number[]) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const MovesTab: React.FC<MovesTabProps> = ({
  state,
  metrics,
  currentLang,
  currentUser,
  canEdit,
  onAddTransaction,
  onBatchAddTransactions,
  onBatchUpdateEndCounts,
  onDeleteTransaction
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Main Active Tab: 'overview' | 'batch_recv' | 'batch_waste' | 'batch_tin' | 'batch_tout' | 'batch_end' | 'ledger'
  const [activeView, setActiveView] = useState<'overview' | 'batch_recv' | 'batch_waste' | 'batch_tin' | 'batch_end' | 'ledger'>('overview');

  // Display mode: Simple Consolidated (default) vs Detailed Columns
  const [showDetailedColumns, setShowDetailedColumns] = useState(false);

  // Search, Category, Date filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'moved_only'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<MovementType | 'all'>('all');
  const [showSuggestedOrderModal, setShowSuggestedOrderModal] = useState(false);
  
  // Quick Single Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalIngredientId, setModalIngredientId] = useState<string>(state.ing[0]?.id || '');
  const [modalDate, setModalDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (today >= state.dFrom && today <= state.dTo) return today;
    return state.dTo || state.dFrom;
  });
  const [modalType, setModalType] = useState<MovementType>('recv');
  const [modalQty, setModalQty] = useState('');
  const [modalRef, setModalRef] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState<string | null>(null);

  const moveTypes: { key: MovementType; label: string; badge: string }[] = [
    { key: 'recv', label: 'توريد مشتريات (+)', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' },
    { key: 'tin', label: 'تحويل وارد (+)', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' },
    { key: 'production_in', label: 'مصنعات وتجهيز (+)', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300' },
    { key: 'tout', label: 'تحويل صادر (-)', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300' },
    { key: 'waste', label: 'هدر وتوالف (-)', badge: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300' },
    { key: 'production_consume', label: 'استهلاك تشغيل (-)', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' }
  ];

  const getTypeLabel = (mType: MovementType) => {
    const found = moveTypes.find(m => m.key === mType);
    return found ? found.label : mType;
  };

  const getTypeBadgeClass = (mType: MovementType) => {
    const found = moveTypes.find(m => m.key === mType);
    return found ? found.badge : 'bg-slate-100 text-slate-700';
  };

  // Filtered transactions for the chosen date range
  const relevantLedger = useMemo(() => {
    return state.ledger.filter(tx => {
      if (selectedDateFilter === 'all') {
        return tx.date >= state.dFrom && tx.date <= state.dTo;
      }
      return tx.date === selectedDateFilter;
    });
  }, [state.ledger, state.dFrom, state.dTo, selectedDateFilter]);

  // Aggregate stats per ingredient
  const ingredientStats = useMemo(() => {
    const ingMap = new Map<string, {
      recv: number;
      tin: number;
      prodIn: number;
      tout: number;
      waste: number;
      prodConsume: number;
      totalMoves: number;
    }>();

    state.ing.forEach(g => {
      ingMap.set(g.id, {
        recv: 0,
        tin: 0,
        prodIn: 0,
        tout: 0,
        waste: 0,
        prodConsume: 0,
        totalMoves: 0
      });
    });

    relevantLedger.forEach(tx => {
      const stats = ingMap.get(tx.ingredientId);
      if (stats) {
        const q = num(tx.qty);
        stats.totalMoves += 1;
        if (tx.type === 'recv') stats.recv += q;
        else if (tx.type === 'tin') stats.tin += q;
        else if (tx.type === 'production_in') stats.prodIn += q;
        else if (tx.type === 'tout') stats.tout += q;
        else if (tx.type === 'waste') stats.waste += q;
        else if (tx.type === 'production_consume') stats.prodConsume += q;
      }
    });

    return state.ing.map((g, originalIndex) => {
      const st = ingMap.get(g.id) || {
        recv: 0,
        tin: 0,
        prodIn: 0,
        tout: 0,
        waste: 0,
        prodConsume: 0,
        totalMoves: 0
      };

      const beg = num(state.beg[originalIndex]);
      const end = num(state.end[originalIndex]);
      const totalIn = st.recv + st.tin + st.prodIn;
      const totalOut = st.tout + st.waste + st.prodConsume;
      const netMoves = totalIn - totalOut;

      return {
        originalIndex,
        id: g.id,
        name: g.name,
        cat: g.cat,
        unit: g.unit,
        price: num(g.price),
        yield: num(g.yield) || 1,
        beg,
        end,
        totalIn,
        totalOut,
        ...st,
        netMoves
      };
    });
  }, [state.ing, state.beg, state.end, relevantLedger]);

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    return ingredientStats.filter(item => {
      if (selectedCat !== 'all' && item.cat !== selectedCat) return false;
      if (filterMode === 'moved_only' && item.totalMoves === 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [ingredientStats, selectedCat, filterMode, searchTerm]);

  // Overall KPIs
  const summaryKPIs = useMemo(() => {
    let totalInQty = 0;
    let totalInVal = 0;
    let totalOutQty = 0;
    let totalOutVal = 0;
    let movedItemsCount = 0;

    ingredientStats.forEach(st => {
      totalInQty += st.totalIn;
      totalInVal += st.totalIn * st.price;
      totalOutQty += st.totalOut;
      totalOutVal += st.totalOut * st.price;
      if (st.totalMoves > 0) movedItemsCount++;
    });

    return {
      totalInQty,
      totalInVal,
      totalOutQty,
      totalOutVal,
      movedItemsCount,
      totalTransactions: relevantLedger.length
    };
  }, [ingredientStats, relevantLedger]);

  // Available unique dates
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    state.ledger.forEach(tx => {
      if (tx.date >= state.dFrom && tx.date <= state.dTo) {
        dates.add(tx.date);
      }
    });
    return Array.from(dates).sort();
  }, [state.ledger, state.dFrom, state.dTo]);

  // Ledger filtered
  const filteredLedger = useMemo(() => {
    return relevantLedger.filter(tx => {
      if (ledgerTypeFilter !== 'all' && tx.type !== ledgerTypeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const ing = state.ing.find(g => g.id === tx.ingredientId);
        const nameMatch = ing ? ing.name.toLowerCase().includes(q) : false;
        const idMatch = tx.ingredientId.toLowerCase().includes(q);
        const refMatch = (tx.reference || '').toLowerCase().includes(q);
        const noteMatch = (tx.note || '').toLowerCase().includes(q);
        return nameMatch || idMatch || refMatch || noteMatch;
      }
      return true;
    });
  }, [relevantLedger, ledgerTypeFilter, searchTerm, state.ing]);

  const handleOpenAddModal = (preselectedIngId?: string, defaultType: MovementType = 'recv') => {
    if (preselectedIngId) {
      setModalIngredientId(preselectedIngId);
    }
    setModalType(defaultType);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(modalQty);
    if (!modalDate || isNaN(q) || q <= 0 || !modalIngredientId) {
      alert("يرجى إدخال تاريخ صحيح وكمية أكبر من الصفر");
      return;
    }

    onAddTransaction({
      date: modalDate,
      type: modalType,
      ingredientId: modalIngredientId,
      qty: q,
      reference: modalRef.trim(),
      note: modalNote.trim()
    });

    setModalQty('');
    setModalRef('');
    setModalNote('');
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowAddModal(false);
    }, 1000);
  };

  const ingredientOptions: AutocompleteOption[] = useMemo(() => {
    return state.ing.map(g => ({
      value: g.id,
      label: g.name,
      badge: g.id,
      subLabel: `${CATEGORIES_NAMES[g.cat] || 'عام'} • سعر الوحدة: ${money(g.price)} ج.م / ${g.unit}`,
      category: CATEGORIES_NAMES[g.cat],
      searchText: `${g.name} ${g.id} ${g.unit} ${CATEGORIES_NAMES[g.cat] || ''}`
    }));
  }, [state.ing]);

  const selectedIngObj = state.ing.find(g => g.id === modalIngredientId);

  // If a batch sheet view is chosen:
  if (activeView.startsWith('batch_')) {
    const sheetType = activeView.replace('batch_', '') as BatchSheetType;
    return (
      <div className="space-y-3">
        {/* Simple Top Navigation Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveView('overview')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5"
            >
              <Boxes className="w-4 h-4" />
              <span>← العودة لكشف الحركات</span>
            </button>

            <button
              onClick={() => setActiveView('batch_recv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'batch_recv'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>بيان التوريدات (+)</span>
            </button>

            <button
              onClick={() => setActiveView('batch_waste')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'batch_waste'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>بيان الهدر والتوالف (-)</span>
            </button>

            <button
              onClick={() => setActiveView('batch_tin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'batch_tin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>بيان التحويل الوارد (+)</span>
            </button>

            <button
              onClick={() => setActiveView('batch_end')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'batch_end'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>جرد آخر المدة</span>
            </button>
          </div>

          <button
            onClick={() => setActiveView('ledger')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل القيود</span>
          </button>
        </div>

        {/* Batch Sheet Component */}
        <BatchMovementSheet
          sheetType={sheetType}
          state={state}
          metrics={metrics}
          currentLang={currentLang}
          currentUser={currentUser}
          canEdit={canEdit}
          onBatchAddTransactions={onBatchAddTransactions || (txs => txs.forEach(onAddTransaction))}
          onBatchUpdateEndCounts={onBatchUpdateEndCounts || (() => {})}
          onSwitchToOverview={() => setActiveView('overview')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Sleek, Simplified Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-2 flex-wrap">
        
        {/* Main Clean Tab Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          <button
            onClick={() => setActiveView('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'overview'
                ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>كشف الحركات الشامل</span>
          </button>

          <button
            onClick={() => setActiveView('batch_recv')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 transition flex items-center gap-1.5"
            title="تسجيل وتوريد فواتير المشتريات دفعة واحدة"
          >
            <PackagePlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ تسجيل توريدات ومشتريات</span>
          </button>

          <button
            onClick={() => setShowSuggestedOrderModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition flex items-center gap-1.5 shadow-sm"
            title="توليد طلب شراء مقترح بناءً على فرق مستوى البار والمخزون الحالي"
          >
            <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>⚡ طلب شراء مقترح (Par Order)</span>
          </button>

          <button
            onClick={() => setActiveView('batch_waste')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800/60 transition flex items-center gap-1.5"
            title="تسجيل الهدر والتوالف دفعة واحدة"
          >
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>- تسجيل هدر وتوالف</span>
          </button>

          <button
            onClick={() => setActiveView('batch_end')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition flex items-center gap-1.5"
            title="تحديث أرصدة الجرد الفعلي الختامي"
          >
            <ClipboardCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>جرد آخر المدة</span>
          </button>

        </div>

        {/* Right Tools: Single Quick Add + History Log */}
        <div className="flex items-center gap-1.5">
          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>حركة مفردة</span>
            </button>
          )}

          <button
            onClick={() => setActiveView(activeView === 'ledger' ? 'overview' : 'ledger')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === 'ledger'
                ? 'bg-slate-900 text-white dark:bg-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل القيود ({relevantLedger.length})</span>
          </button>
        </div>

      </div>

      {activeView === 'ledger' ? (
        /* Detailed Transactions History View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                📜 سجل القيود والعمليات المسجلة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مراجعة وتدقيق وإلغاء أي حركة مسجلة على مستوى الصنف والتاريخ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ledgerTypeFilter}
                onChange={e => setLedgerTypeFilter(e.target.value as MovementType | 'all')}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold dark:text-white focus:outline-none"
              >
                <option value="all">كل أنواع الحركات</option>
                {moveTypes.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>

              <button
                onClick={() => setActiveView('overview')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                العودة للكشف
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-right w-24">التاريخ</th>
                  <th className="p-2.5 text-center w-28">نوع الحركة</th>
                  <th className="p-2.5 text-right">اسم الصنف</th>
                  <th className="p-2.5 text-center w-24">الكمية</th>
                  <th className="p-2.5 text-center w-24">سعر الوحدة</th>
                  <th className="p-2.5 text-center w-28">إجمالي التكلفة</th>
                  <th className="p-2.5 text-right">المرجع / الإذن</th>
                  <th className="p-2.5 text-right">ملاحظات</th>
                  <th className="p-2.5 text-center w-20">المستخدم</th>
                  {canEdit && <th className="p-2.5 text-center w-12">حذف</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-850">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      لا توجد قيود مسجلة تطابق شروط التصفية
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((tx, idx) => {
                    const ing = state.ing.find(g => g.id === tx.ingredientId);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-semibold text-slate-700 dark:text-slate-300">{tx.date}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeClass(tx.type)}`}>
                            {getTypeLabel(tx.type)}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                          {ing?.name || tx.ingredientId}
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {nf(tx.qty)} {ing?.unit}
                        </td>
                        <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">
                          {money(ing?.price || 0)}
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {money((ing?.price || 0) * tx.qty)}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-mono">{tx.reference || '—'}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{tx.note || '—'}</td>
                        <td className="p-2 text-center text-slate-500 text-[11px]">{tx.user || '—'}</td>
                        {canEdit && (
                          <td className="p-2 text-center">
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف حركة ${getTypeLabel(tx.type)} لـ ${ing?.name}؟`)) {
                                  onDeleteTransaction ? onDeleteTransaction(tx.id) : null;
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg transition"
                              title="حذف هذا القيد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Movement Overview - Clean, High-Readability Presentation */
        <>
          {/* Simple, Clean 4-Card Summary Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            <div 
              onClick={() => setActiveView('batch_recv')}
              className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm cursor-pointer hover:border-emerald-400 transition"
              title="اضغط لفتح بيان التوريدات السريع"
            >
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
                <span>الوارد والتوريدات (+)</span>
                <PackagePlus className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {nf(summaryKPIs.totalInQty)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                القيمة: {money(summaryKPIs.totalInVal)} ج.م
              </div>
            </div>

            <div 
              onClick={() => setActiveView('batch_waste')}
              className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-red-200/80 dark:border-red-800/40 shadow-sm cursor-pointer hover:border-red-400 transition"
              title="اضغط لفتح بيان الهدر والتوالف السريع"
            >
              <div className="flex items-center justify-between text-red-700 dark:text-red-300 text-xs font-bold mb-1">
                <span>المنصرف والهدر (-)</span>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {nf(summaryKPIs.totalOutQty)}
              </div>
              <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                الخسارة: {money(summaryKPIs.totalOutVal)} ج.م
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-xs font-bold mb-1">
                <span>الأصناف المتحركة</span>
                <Boxes className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {summaryKPIs.movedItemsCount} <span className="text-xs font-normal text-slate-400">من {state.ing.length} صنف</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                إجمالي {summaryKPIs.totalTransactions} حركة مسجلة
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">
                <span>تصدير وطباعة</span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              </div>
              <button
                onClick={() => exportDailyMovementsExcel(state, ingredientStats, selectedDateFilter === 'all' ? `من ${state.dFrom} إلى ${state.dTo}` : `يوم ${selectedDateFilter}`)}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
            </div>

          </div>

          {/* Clean Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              
              {/* Search */}
              <div className="relative w-44 sm:w-56">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="🔍 بحث باسم الصنف..."
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>

              {/* Category */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCat}
                  onChange={e => setSelectedCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">كل الأقسام</option>
                  {CATEGORIES_NAMES.map((cName, idx) => (
                    <option key={idx} value={idx}>
                      {cName} ({state.ing.filter(g => g.cat === idx).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <select
                  value={selectedDateFilter}
                  onChange={e => setSelectedDateFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">كامل الفترة ({state.dFrom} - {state.dTo})</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>يوم {d}</option>
                  ))}
                </select>
              </div>

              {/* Filter moved items */}
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'moved_only' : 'all')}
                className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                  filterMode === 'moved_only'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {filterMode === 'moved_only' ? 'الأصناف المتحركة فقط ✓' : 'كل الأصناف'}
              </button>

            </div>

            {/* Toggle Detailed Columns */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetailedColumns(!showDetailedColumns)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1"
                title="توسيع وعرض أعمدة التفاصيل الكاملة (توريد، تحويل، تشغيل)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>{showDetailedColumns ? 'عرض ملخص مبسط' : 'عرض التفاصيل الكاملة'}</span>
              </button>
            </div>

          </div>

          {/* Streamlined, Crystal-Clear Movements Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                
                {/* Table Header */}
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5 text-center w-20">كود الصنف</th>
                    <th className="p-2.5 text-right min-w-[170px]">اسم المكون / الخامة</th>
                    <th className="p-2.5 text-center w-24">القسم</th>
                    <th className="p-2.5 text-center w-14">الوحدة</th>
                    <th className="p-2.5 text-center w-20">سعر الوحدة</th>
                    <th className="p-2.5 text-center w-20 bg-slate-800 text-slate-300">رصيد أول</th>

                    {/* Conditional Columns based on detailed toggle */}
                    {showDetailedColumns ? (
                      <>
                        <th className="p-2.5 text-center w-18 bg-emerald-950 text-emerald-300">توريدات (+)</th>
                        <th className="p-2.5 text-center w-18 bg-blue-950 text-blue-300">تحويل وارد (+)</th>
                        <th className="p-2.5 text-center w-18 bg-purple-950 text-purple-300">تصنيع وارد (+)</th>
                        <th className="p-2.5 text-center w-18 bg-orange-950 text-orange-300">تحويل صادر (-)</th>
                        <th className="p-2.5 text-center w-18 bg-red-950 text-red-300">هدر وتوالف (-)</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2.5 text-center w-24 bg-emerald-950/80 text-emerald-300 font-black">
                          إجمالي الوارد (+)
                        </th>
                        <th className="p-2.5 text-center w-24 bg-red-950/80 text-red-300 font-black">
                          المنصرف والهدر (-)
                        </th>
                      </>
                    )}

                    <th className="p-2.5 text-center w-22 bg-slate-800 text-yellow-300 font-black">صافي الحركة</th>
                    <th className="p-2.5 text-center w-20 bg-slate-800 text-slate-200 font-bold">رصيد آخر</th>
                    
                    {canEdit && (
                      <th className="p-2.5 text-center w-20 bg-slate-900 text-blue-400">إجراء</th>
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-850">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={showDetailedColumns ? 15 : 12} className="p-8 text-center text-slate-400">
                        لا توجد أصناف تطابق شروط البحث أو التصفية الحالية
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((st, idx) => {
                      const hasMoves = st.totalMoves > 0;
                      return (
                        <tr 
                          key={st.id} 
                          className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors ${
                            hasMoves ? 'bg-blue-50/20 dark:bg-slate-800/30' : ''
                          }`}
                        >
                          <td className="p-2 text-center font-semibold text-slate-400">
                            {st.originalIndex + 1}
                          </td>
                          <td className="p-2 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                            {st.id}
                          </td>
                          <td className="p-2 font-bold text-slate-800 dark:text-slate-100 text-right">
                            <div className="flex items-center justify-between">
                              <span>{st.name}</span>
                              {hasMoves && (
                                <button
                                  onClick={() => setSelectedItemHistory(st.id)}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 underline hover:text-blue-800 flex items-center gap-0.5 mr-2"
                                  title="عرض حركات الصنف بالتفصيل"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>({st.totalMoves})</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-1.5 text-center">
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                              style={{ backgroundColor: `${CATEGORIES_COLORS[st.cat]}25`, color: '#334155' }}
                            >
                              {CATEGORIES_NAMES[st.cat] || `قسم ${st.cat}`}
                            </span>
                          </td>
                          <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                            {st.unit}
                          </td>
                          <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">
                            {money(st.price)}
                          </td>
                          <td className="p-2 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-900/40">
                            {nf(st.beg)}
                          </td>

                          {/* Data Columns */}
                          {showDetailedColumns ? (
                            <>
                              <td className="p-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {st.recv > 0 ? `+${nf(st.recv)}` : '—'}
                              </td>
                              <td className="p-2 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {st.tin > 0 ? `+${nf(st.tin)}` : '—'}
                              </td>
                              <td className="p-2 text-center font-mono font-semibold text-purple-600 dark:text-purple-400">
                                {st.prodIn > 0 ? `+${nf(st.prodIn)}` : '—'}
                              </td>
                              <td className="p-2 text-center font-mono font-semibold text-orange-600 dark:text-orange-400">
                                {st.tout > 0 ? `-${nf(st.tout)}` : '—'}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-red-600 dark:text-red-400">
                                {st.waste > 0 ? `-${nf(st.waste)}` : '—'}
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Consolidated In */}
                              <td className="p-2 text-center font-mono font-bold bg-emerald-50/40 dark:bg-emerald-950/20">
                                {st.totalIn > 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-300">
                                    +{nf(st.totalIn)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>

                              {/* Consolidated Out */}
                              <td className="p-2 text-center font-mono font-bold bg-red-50/40 dark:bg-red-950/20">
                                {st.totalOut > 0 ? (
                                  <span className="text-red-600 dark:text-red-400">
                                    -{nf(st.totalOut)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* Net Movement */}
                          <td className="p-2 text-center font-mono font-black bg-slate-50/60 dark:bg-slate-900/40">
                            {st.netMoves > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">+{nf(st.netMoves)}</span>
                            ) : st.netMoves < 0 ? (
                              <span className="text-red-600 dark:text-red-400">{nf(st.netMoves)}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>

                          {/* End stock */}
                          <td className="p-2 text-center font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100/60 dark:bg-slate-800/60">
                            {nf(st.end)}
                          </td>

                          {/* Action */}
                          {canEdit && (
                            <td className="p-1.5 text-center">
                              <button
                                onClick={() => handleOpenAddModal(st.id)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition"
                                title="إضافة حركة سريعة لهذا الصنف"
                              >
                                + حركة
                              </button>
                            </td>
                          )}

                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Totals Footer */}
                <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10">
                  <tr>
                    <td colSpan={6} className="p-2.5 text-right">الإجمالي:</td>
                    <td className="p-2.5 text-center font-mono text-slate-300">
                      {nf(filteredRows.reduce((a, b) => a + b.beg, 0))}
                    </td>

                    {showDetailedColumns ? (
                      <>
                        <td className="p-2.5 text-center font-mono text-emerald-300">
                          {nf(filteredRows.reduce((a, b) => a + b.recv, 0))}
                        </td>
                        <td className="p-2.5 text-center font-mono text-blue-300">
                          {nf(filteredRows.reduce((a, b) => a + b.tin, 0))}
                        </td>
                        <td className="p-2.5 text-center font-mono text-purple-300">
                          {nf(filteredRows.reduce((a, b) => a + b.prodIn, 0))}
                        </td>
                        <td className="p-2.5 text-center font-mono text-orange-300">
                          {nf(filteredRows.reduce((a, b) => a + b.tout, 0))}
                        </td>
                        <td className="p-2.5 text-center font-mono text-red-300">
                          {nf(filteredRows.reduce((a, b) => a + b.waste, 0))}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 text-center font-mono text-emerald-300 font-black">
                          +{nf(filteredRows.reduce((a, b) => a + b.totalIn, 0))}
                        </td>
                        <td className="p-2.5 text-center font-mono text-red-300 font-black">
                          -{nf(filteredRows.reduce((a, b) => a + b.totalOut, 0))}
                        </td>
                      </>
                    )}

                    <td className="p-2.5 text-center font-mono text-yellow-300 font-black">
                      {nf(filteredRows.reduce((a, b) => a + b.netMoves, 0))}
                    </td>
                    <td className="p-2.5 text-center font-mono text-white font-black">
                      {nf(filteredRows.reduce((a, b) => a + b.end, 0))}
                    </td>
                    {canEdit && <td></td>}
                  </tr>
                </tfoot>

              </table>
            </div>
          </div>
        </>
      )}

      {/* Quick Add Single Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    تسجيل حركة يومية مفردة
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    إنزال حركة لصنف محدد بالتاريخ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-800 dark:text-white text-base">تم تسجيل الحركة بنجاح!</h4>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                
                {/* Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">التاريخ</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={e => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Movement Type */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">نوع الحركة</label>
                  <select
                    value={modalType}
                    onChange={e => setModalType(e.target.value as MovementType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {moveTypes.map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Ingredient Select with Autocomplete */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>الصنف / المكون</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      بحث فوري ذكي
                    </span>
                  </label>
                  <AutocompleteSelect
                    options={ingredientOptions}
                    value={modalIngredientId}
                    onChange={val => setModalIngredientId(val)}
                    placeholder="ابحث باسم المكون أو الكود (مثال: جبنة، ING-002)..."
                    required
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    الكمية ({selectedIngObj?.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="0.00"
                    value={modalQty}
                    onChange={e => setModalQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-sm text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Reference & Note */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">رقم الفاتورة / الإذن</label>
                    <input
                      type="text"
                      placeholder="اختياري..."
                      value={modalRef}
                      onChange={e => setModalRef(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">ملاحظات</label>
                    <input
                      type="text"
                      placeholder="اختياري..."
                      value={modalNote}
                      onChange={e => setModalNote(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Estimated Cost Preview */}
                {selectedIngObj && Number(modalQty) > 0 && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                    <span>القيمة التقديرية:</span>
                    <span className="font-bold text-xs font-mono">{money(Number(modalQty) * selectedIngObj.price)} ج.م</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition"
                  >
                    حفظ الحركة
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* Item History Modal */}
      {selectedItemHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  حركات: {state.ing.find(g => g.id === selectedItemHistory)?.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">كود: {selectedItemHistory}</span>
              </div>
              <button
                onClick={() => setSelectedItemHistory(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {relevantLedger.filter(tx => tx.ingredientId === selectedItemHistory).length === 0 ? (
                <div className="p-6 text-center text-slate-400">لا توجد حركات مسجلة لهذا الصنف</div>
              ) : (
                relevantLedger.filter(tx => tx.ingredientId === selectedItemHistory).map(tx => (
                  <div key={tx.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getTypeBadgeClass(tx.type)}`}>
                          {getTypeLabel(tx.type)}
                        </span>
                        <span className="font-mono text-slate-500">{tx.date}</span>
                      </div>
                      {tx.reference && <div className="text-[11px] text-slate-400 mt-0.5">مرجع: {tx.reference}</div>}
                    </div>
                    <div className="text-left font-mono font-bold text-sm">
                      {tx.type === 'recv' || tx.type === 'tin' || tx.type === 'production_in' ? (
                        <span className="text-emerald-600">+{nf(tx.qty)}</span>
                      ) : (
                        <span className="text-red-600">-{nf(tx.qty)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedItemHistory(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition text-xs"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Suggested Order Modal */}
      <SuggestedOrderModal
        isOpen={showSuggestedOrderModal}
        onClose={() => setShowSuggestedOrderModal(false)}
        state={state}
        metrics={metrics}
        currentLang={currentLang}
        canEdit={canEdit}
        onSendToReceiving={(txs) => {
          if (onBatchAddTransactions) {
            onBatchAddTransactions(txs);
          } else {
            txs.forEach(tx => onAddTransaction(tx));
          }
        }}
      />

    </div>
  );
};
