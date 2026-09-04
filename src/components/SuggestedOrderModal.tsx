import React, { useState, useMemo } from 'react';
import { AppState, ComputedMetrics, Language, MovementType } from '../types';
import { TRANSLATIONS } from '../translations';
import { CATEGORIES_NAMES } from '../initialData';
import { num, nf, money } from '../utils/calculations';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Send, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  PackagePlus, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SuggestedOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onSendToReceiving: (txs: Array<{
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }>) => void;
}

export const SuggestedOrderModal: React.FC<SuggestedOrderModalProps> = ({
  isOpen,
  onClose,
  state,
  metrics,
  currentLang,
  canEdit,
  onSendToReceiving
}) => {
  if (!isOpen) return null;

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const isAr = currentLang === 'ar';
  const avgFactor = metrics.days || 1;

  // Custom order settings state
  const [parDays, setParDays] = useState<number>(state.parDays || 7);
  const [safetyBufferPct, setSafetyBufferPct] = useState<number>(0); // Extra buffer % e.g. 10%
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'needed_only' | 'all'>('needed_only');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [poReference, setPoReference] = useState(() => `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
  
  // Custom adjusted quantities by user (overrides default suggestion if edited)
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [isSuccessSent, setIsSuccessSent] = useState(false);

  // Compute suggestions for each ingredient
  const orderItems = useMemo(() => {
    return state.ing.map((g, idx) => {
      const avgDaily = metrics.adj[idx] / avgFactor;
      const currentStock = Math.max(0, num(state.end[idx]));
      const daysCover = avgDaily > 0 ? currentStock / avgDaily : Infinity;
      
      // Target par calculation with optional safety buffer
      const basePar = avgDaily * parDays;
      const parLevel = basePar * (1 + safetyBufferPct / 100);
      
      // Raw deficit between Par and Available stock
      const rawDeficit = Math.max(0, parLevel - currentStock);
      
      // Round to 2 decimal places or 1 if large
      const suggestedQty = rawDeficit > 0 ? Math.ceil(rawDeficit * 10) / 10 : 0;
      const unitPrice = num(g.price);
      
      // Order quantity is custom quantity if modified, otherwise suggested
      const isCustom = customQuantities[g.id] !== undefined;
      const orderQty = isCustom ? customQuantities[g.id] : suggestedQty;
      const totalCost = orderQty * unitPrice;
      const isSelected = selectedItems[g.id] !== undefined ? selectedItems[g.id] : (orderQty > 0);

      // Urgency level
      let urgency: 'urgent' | 'warning' | 'normal' | 'excess' = 'normal';
      if (currentStock <= 0 && avgDaily > 0) {
        urgency = 'urgent'; // Out of stock
      } else if (daysCover < 2 && avgDaily > 0) {
        urgency = 'urgent'; // Less than 2 days cover
      } else if (daysCover < parDays && avgDaily > 0) {
        urgency = 'warning'; // Below par
      } else if (daysCover > parDays * 2) {
        urgency = 'excess'; // Overstocked
      }

      return {
        id: g.id,
        name: g.name,
        cat: g.cat,
        unit: g.unit,
        unitPrice,
        avgDaily,
        currentStock,
        daysCover,
        parLevel,
        suggestedQty,
        orderQty,
        totalCost,
        urgency,
        isSelected
      };
    });
  }, [state.ing, state.end, metrics.adj, avgFactor, parDays, safetyBufferPct, customQuantities, selectedItems]);

  // Filtered rows for the table
  const filteredItems = useMemo(() => {
    return orderItems.filter(item => {
      if (selectedCat !== 'all' && item.cat !== selectedCat) return false;
      if (filterMode === 'needed_only' && item.suggestedQty <= 0 && item.orderQty <= 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [orderItems, selectedCat, filterMode, searchTerm]);

  // Totals for selected items to order
  const orderSummary = useMemo(() => {
    let totalItems = 0;
    let totalQty = 0;
    let totalAmount = 0;
    let urgentCount = 0;

    orderItems.forEach(item => {
      if (item.isSelected && item.orderQty > 0) {
        totalItems += 1;
        totalQty += item.orderQty;
        totalAmount += item.totalCost;
      }
      if (item.urgency === 'urgent') {
        urgentCount += 1;
      }
    });

    return { totalItems, totalQty, totalAmount, urgentCount };
  }, [orderItems]);

  const handleToggleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    filteredItems.forEach(item => {
      if (item.orderQty > 0 || !checked) {
        next[item.id] = checked;
      }
    });
    setSelectedItems(prev => ({ ...prev, ...next }));
  };

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false
    }));
  };

  const handleQtyChange = (id: string, val: number) => {
    setCustomQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, val)
    }));
  };

  const handleResetToCalculated = () => {
    setCustomQuantities({});
    setSelectedItems({});
  };

  // Convert suggested order into immediate receiving transactions
  const handleConfirmSendToReceiving = () => {
    const itemsToOrder = orderItems.filter(i => i.isSelected && i.orderQty > 0);
    if (itemsToOrder.length === 0) {
      alert(isAr ? 'لم يتم تحديد أي أصناف لإنشاء طلب الشراء!' : 'No items selected for the purchase order!');
      return;
    }

    const txs = itemsToOrder.map(item => ({
      date: orderDate,
      type: 'recv' as MovementType,
      ingredientId: item.id,
      qty: item.orderQty,
      reference: poReference,
      note: isAr ? `طلب شراء مقترح (حد البار ${parDays} يوم) - رصيد سابق ${nf(item.currentStock)}` : `Auto Suggested PO (Par ${parDays}d)`
    }));

    onSendToReceiving(txs);
    setIsSuccessSent(true);
    setTimeout(() => {
      setIsSuccessSent(false);
      onClose();
    }, 1800);
  };

  // Export to Excel
  const handleExportPOExcel = () => {
    const itemsToOrder = orderItems.filter(i => (filterMode === 'needed_only' ? (i.isSelected && i.orderQty > 0) : true));
    
    const rows = [
      [isAr ? "أمر توريد / طلب شراء مقترح (Suggested Purchase Order)" : "Suggested Purchase Order"],
      [isAr ? `تاريخ الطلب: ${orderDate}` : `Date: ${orderDate}`, isAr ? `رقم الإذن/المرجع: ${poReference}` : `PO Ref: ${poReference}`],
      [isAr ? `أيام التغطية المستهدفة (Par): ${parDays} يوم` : `Target Par: ${parDays} Days`, isAr ? `نسبة الأمان الإضافية: ${safetyBufferPct}%` : `Buffer: ${safetyBufferPct}%`],
      [],
      [
        isAr ? "كود الصنف" : "Item ID",
        isAr ? "اسم المكون / الخامة" : "Ingredient Name",
        isAr ? "القسم" : "Category",
        isAr ? "الوحدة" : "Unit",
        isAr ? "معدل الاستهلاك اليومي" : "Daily Avg",
        isAr ? "الرصيد الحالي" : "Current Stock",
        isAr ? "مستوى البار المستهدف" : "Par Level",
        isAr ? "الكمية المطلوبة للشراء" : "Order Qty",
        isAr ? "سعر الوحدة التقديري" : "Unit Price",
        isAr ? "إجمالي التكلفة" : "Total Cost",
        isAr ? "حالة الأمان" : "Urgency Status"
      ]
    ];

    itemsToOrder.forEach(item => {
      rows.push([
        item.id,
        item.name,
        CATEGORIES_NAMES[item.cat] || "",
        item.unit,
        nf(item.avgDaily),
        nf(item.currentStock),
        nf(item.parLevel),
        nf(item.orderQty),
        money(item.unitPrice),
        money(item.totalCost),
        item.urgency === 'urgent' ? (isAr ? 'عاجل جداً / نفد' : 'Critical') : item.urgency === 'warning' ? (isAr ? 'تحت البار' : 'Low') : (isAr ? 'طبيعي' : 'Normal')
      ]);
    });

    rows.push([]);
    rows.push([
      isAr ? "الإجمالي الكلي:" : "Total:",
      "", "", "", "", "", "",
      nf(orderSummary.totalQty),
      "",
      money(orderSummary.totalAmount) + (isAr ? " ج.م" : " EGP"),
      ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suggested_PO");
    XLSX.writeFile(wb, `Suggested_Order_${poReference}_${orderDate}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {isAr ? '🛒 توليد طلب شراء مقترح (Suggested Purchase Order)' : 'Suggested Purchase Order Generator'}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isAr ? 'حساب آلي ذكي' : 'Smart Par Algorithm'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr 
                  ? 'حساب الكميات المطلوبة بدقة بناءً على فرق مستوى البار (Par) والرصيد الفعلي المتوفر ومعدل الاستهلاك اليومي'
                  : 'Calculates exact order quantities based on Par Level minus Current Available Stock'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPOExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title={isAr ? 'تصدير أمر الشراء إلى Excel' : 'Export PO to Excel'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير إكسيل' : 'Excel PO'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Top Controls: Par Days, Buffer, Date, PO Ref */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                {isAr ? '📅 أيام التغطية (Par Days):' : 'Par Coverage Days:'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={parDays}
                  onChange={e => setParDays(Math.max(1, parseInt(e.target.value) || 7))}
                  className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg font-bold text-center text-xs dark:text-white"
                />
                <span className="text-slate-500 font-medium">{isAr ? 'أيام' : 'days'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                {isAr ? '🛡️ نسبة أمان إضافية (Buffer):' : 'Safety Buffer %:'}
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={safetyBufferPct}
                  onChange={e => setSafetyBufferPct(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs dark:text-white focus:outline-none"
                >
                  <option value="0">{isAr ? '0% (بدون زيادة)' : '0% (Exact Par)'}</option>
                  <option value="10">{isAr ? '+10% أمان احتياطي' : '+10% Safety'}</option>
                  <option value="20">{isAr ? '+20% عطلات ونهاية أسبوع' : '+20% Weekend'}</option>
                  <option value="30">{isAr ? '+30% مواسم وضغط عالي' : '+30% High Peak'}</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                {isAr ? '📅 تاريخ أمر الشراء:' : 'Order Date:'}
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs dark:text-white"
              />
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                {isAr ? '🔖 رقم المرجع / PO Ref:' : 'PO Reference:'}
              </label>
              <input
                type="text"
                value={poReference}
                onChange={e => setPoReference(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs dark:text-white"
              />
            </div>

          </div>

          {/* Secondary Filters: Search, Category, Filter Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              
              <div className="relative w-48 sm:w-56">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={isAr ? '🔍 بحث باسم الصنف أو الكود...' : 'Filter items...'}
                  className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCat}
                  onChange={e => setSelectedCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">{isAr ? 'كل الأقسام' : 'All Categories'}</option>
                  {CATEGORIES_NAMES.map((cName, idx) => (
                    <option key={idx} value={idx}>{cName}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('needed_only')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterMode === 'needed_only'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'الأصناف المطلوبة فقط 🚨' : 'Items Needed Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'جميع الأصناف' : 'All Items'}
                </button>
              </div>

            </div>

            <button
              type="button"
              onClick={handleResetToCalculated}
              className="px-2.5 py-1.5 text-slate-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition"
              title={isAr ? 'استعادة الكميات المحسوبة تلقائياً' : 'Reset to auto calculated'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>

        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-2.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && filteredItems.every(i => i.isSelected)}
                      onChange={e => handleToggleSelectAll(e.target.checked)}
                      className="rounded border-slate-600 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-2.5 text-center w-16">{isAr ? 'كود' : 'Code'}</th>
                  <th className="p-2.5 text-right min-w-[160px]">{isAr ? 'اسم الصنف / الخامة' : 'Ingredient'}</th>
                  <th className="p-2.5 text-center w-14">{isAr ? 'الوحدة' : 'Unit'}</th>
                  <th className="p-2.5 text-center w-20">{isAr ? 'الاستهلاك/يوم' : 'Daily Avg'}</th>
                  <th className="p-2.5 text-center w-20 bg-slate-800 text-slate-300">{isAr ? 'الرصيد الحالي' : 'Stock'}</th>
                  <th className="p-2.5 text-center w-20">{isAr ? 'التغطية' : 'Cover'}</th>
                  <th className="p-2.5 text-center w-20 bg-slate-800 text-blue-300 font-bold">{isAr ? 'مستوى البار' : 'Par'}</th>
                  <th className="p-2.5 text-center w-28 bg-blue-950 text-yellow-300 font-bold">{isAr ? 'كمية الطلب ✏️' : 'Order Qty'}</th>
                  <th className="p-2.5 text-center w-20">{isAr ? 'سعر الوحدة' : 'Price'}</th>
                  <th className="p-2.5 text-center w-24 bg-slate-800 text-emerald-300 font-bold">{isAr ? 'التكلفة الإجمالية' : 'Total Cost'}</th>
                  <th className="p-2.5 text-center w-24">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      {filterMode === 'needed_only' 
                        ? (isAr ? '🎉 ممتاز! جميع الأصناف ضمن مستويات البار الآمنة ولا توجد نواقص تحتاج شراء حالياً.' : 'Great! All items are within safe par levels.')
                        : (isAr ? 'لا توجد أصناف تطابق شروط التصفية' : 'No items match filter criteria')}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isDeficit = item.orderQty > 0;
                    return (
                      <tr 
                        key={item.id}
                        className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors ${
                          item.urgency === 'urgent' 
                            ? 'bg-red-50/40 dark:bg-red-950/20' 
                            : item.isSelected && isDeficit 
                            ? 'bg-blue-50/20 dark:bg-blue-950/10 font-semibold' 
                            : ''
                        }`}
                      >
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.isSelected}
                            onChange={() => handleToggleItem(item.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-2 text-center font-mono text-[11px] text-slate-500">{item.id}</td>
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-100 text-right">
                          {item.name}
                        </td>
                        <td className="p-2 text-center text-slate-500 font-medium">{item.unit}</td>
                        <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">{nf(item.avgDaily)}</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-900/40">
                          {nf(item.currentStock)}
                        </td>
                        <td className="p-2 text-center font-mono font-semibold">
                          {isFinite(item.daysCover) ? (
                            <span className={item.daysCover < 2 ? 'text-red-600 font-bold' : item.daysCover < parDays ? 'text-amber-600' : 'text-emerald-600'}>
                              {item.daysCover.toFixed(1)} {isAr ? 'ي' : 'd'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400 bg-slate-50/60 dark:bg-slate-900/40">
                          {nf(item.parLevel)}
                        </td>

                        {/* Editable Order Quantity */}
                        <td className="p-1.5 text-center bg-blue-50/30 dark:bg-blue-950/30">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.orderQty || ''}
                            placeholder="0"
                            onChange={e => handleQtyChange(item.id, parseFloat(e.target.value) || 0)}
                            className={`w-24 px-2 py-1 text-center font-bold rounded-lg border text-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              item.orderQty > 0 
                                ? 'bg-white dark:bg-slate-900 border-blue-500 text-blue-600 dark:text-blue-400' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                            }`}
                          />
                        </td>

                        <td className="p-2 text-center font-mono text-slate-500">{money(item.unitPrice)}</td>
                        
                        <td className="p-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50/60 dark:bg-slate-900/40">
                          {item.totalCost > 0 ? money(item.totalCost) : '—'}
                        </td>

                        <td className="p-2 text-center">
                          {item.urgency === 'urgent' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 animate-pulse">
                              {isAr ? 'عاجل جداً' : 'Urgent'}
                            </span>
                          ) : item.urgency === 'warning' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              {isAr ? 'تحت البار' : 'Under Par'}
                            </span>
                          ) : item.urgency === 'excess' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {isAr ? 'فائض آمن' : 'Excess'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {isAr ? 'آمن' : 'Safe'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          
          {/* Summary Badges */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isAr ? 'الأصناف المحددة:' : 'Selected Items:'}</span>
              <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {orderSummary.totalItems} {isAr ? 'صنف' : 'items'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isAr ? 'إجمالي الكميات:' : 'Total Qty:'}</span>
              <span className="font-bold font-mono text-yellow-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {nf(orderSummary.totalQty)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isAr ? 'التكلفة الإجمالية التقديرية:' : 'Total Cost:'}</span>
              <span className="font-black font-mono text-emerald-400 text-sm bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/40">
                {money(orderSummary.totalAmount)} {isAr ? 'ج.م' : 'EGP'}
              </span>
            </div>

            {orderSummary.urgentCount > 0 && (
              <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                {orderSummary.urgentCount} {isAr ? 'صنف حرج/نافد' : 'Critical Items'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              {isAr ? 'إلغاء' : 'Close'}
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleConfirmSendToReceiving}
                disabled={orderSummary.totalItems === 0}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-lg ${
                  orderSummary.totalItems > 0
                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 cursor-pointer shadow-blue-500/25'
                    : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isAr ? 'إرسال واستلام فوري في المشتريات (+)' : 'Direct Create Receiving PO (+)'}</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Success Notification */}
      {isSuccessSent && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'تم توليد وتوريد طلب الشراء بنجاح!' : 'PO Generated Successfully!'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isAr 
                ? `تم تسجيل توريد ${orderSummary.totalItems} صنف بالمرجع (${poReference}) في كشف الحركات اليومية`
                : `Recorded ${orderSummary.totalItems} items under reference ${poReference}`}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
