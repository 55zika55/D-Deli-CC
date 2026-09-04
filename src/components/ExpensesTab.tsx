import React, { useState, useMemo } from 'react';
import { 
  AppState, 
  User, 
  Language, 
  ExpenseRecord, 
  ExpenseCategory, 
  ExpenseType,
  UserPermissions 
} from '../types';
import { TRANSLATIONS } from '../translations';
import { computeExpenseMetrics, num, nf, money } from '../utils/calculations';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Wallet, 
  Utensils, 
  Layers, 
  FileText, 
  Tag, 
  Trash2, 
  Edit3, 
  Eye, 
  Settings, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  ArrowUpDown,
  Download,
  Printer,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ExpensesTabProps {
  state: AppState;
  currentUser: User | null;
  currentLang: Language;
  perms: UserPermissions;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
  onAddCategory: (category: Omit<ExpenseCategory, 'id'>) => void;
  onUpdateCategory: (category: ExpenseCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAudit: (action: string, details: string) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  state,
  currentUser,
  currentLang,
  perms,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAudit
}) => {
  const isAr = currentLang === 'ar';
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // View state
  const [subTab, setSubTab] = useState<'list' | 'categories' | 'food_items' | 'daily' | 'financial'>('list');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'non_food'>('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterIngredient, setFilterIngredient] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState(state.dFrom || '');
  const [customTo, setCustomTo] = useState(state.dTo || '');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ExpenseRecord | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Form fields
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRef, setFormRef] = useState('');
  const [formCategory, setFormCategory] = useState(state.expenseCategories?.[0]?.id || 'CAT-EXP-01');
  const [formType, setFormType] = useState<ExpenseType>('food');
  const [formIngredientId, setFormIngredientId] = useState('');
  const [formQty, setFormQty] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState('كجم');
  const [formUnitPrice, setFormUnitPrice] = useState<number | ''>('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('نقدي');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  // Category form fields
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catType, setCatType] = useState<'food' | 'non_food' | 'all'>('non_food');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [catActive, setCatActive] = useState(true);

  // Compute date range based on preset
  const { effectiveFrom, effectiveTo } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (datePreset === 'today') {
      return { effectiveFrom: today, effectiveTo: today };
    } else if (datePreset === 'week') {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - 7)).toISOString().slice(0, 10);
      return { effectiveFrom: firstDay, effectiveTo: today };
    } else if (datePreset === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      return { effectiveFrom: firstDay, effectiveTo: today };
    } else if (datePreset === 'custom') {
      return { effectiveFrom: customFrom, effectiveTo: customTo };
    }
    // 'all' uses current app period
    return { effectiveFrom: state.dFrom, effectiveTo: state.dTo };
  }, [datePreset, customFrom, customTo, state.dFrom, state.dTo]);

  // Compute metrics
  const metrics = useMemo(() => {
    return computeExpenseMetrics(
      state.expenses || [],
      state.expenseCategories || [],
      state.ing || [],
      effectiveFrom,
      effectiveTo
    );
  }, [state.expenses, state.expenseCategories, state.ing, effectiveFrom, effectiveTo]);

  // Distinct suppliers and payment methods for filters
  const distinctSuppliers = useMemo(() => {
    const set = new Set<string>();
    (state.expenses || []).forEach(e => {
      if (e.supplier?.trim()) set.add(e.supplier.trim());
    });
    return Array.from(set);
  }, [state.expenses]);

  // Filtered expenses list for table
  const displayExpenses = useMemo(() => {
    return metrics.filteredExpenses.filter(e => {
      if (filterCategory !== 'all' && e.categoryId !== filterCategory) return false;
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterSupplier !== 'all' && e.supplier !== filterSupplier) return false;
      if (filterPaymentMethod !== 'all' && e.paymentMethod !== filterPaymentMethod) return false;
      if (filterIngredient !== 'all' && e.ingredientId !== filterIngredient) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const ing = state.ing.find(g => g.id === e.ingredientId);
        const matchRef = e.reference?.toLowerCase().includes(q);
        const matchNote = e.note?.toLowerCase().includes(q);
        const matchSup = e.supplier?.toLowerCase().includes(q);
        const matchUser = e.user?.toLowerCase().includes(q);
        const matchIng = ing?.name.toLowerCase().includes(q);
        return matchRef || matchNote || matchSup || matchUser || matchIng || e.id.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [metrics.filteredExpenses, filterCategory, filterType, filterSupplier, filterPaymentMethod, filterIngredient, searchTerm, state.ing]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormRef(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory(state.expenseCategories?.[0]?.id || 'CAT-EXP-01');
    setFormType('food');
    setFormIngredientId(state.ing?.[0]?.id || '');
    setFormQty('');
    setFormUnit(state.ing?.[0]?.unit || 'كجم');
    setFormUnitPrice(state.ing?.[0]?.price || '');
    setFormSupplier('');
    setFormPaymentMethod(state.paymentMethods?.[0] || 'نقدي');
    setFormNote('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setFormDate(exp.date);
    setFormRef(exp.reference);
    setFormCategory(exp.categoryId);
    setFormType(exp.type);
    setFormIngredientId(exp.ingredientId || '');
    setFormQty(exp.qty);
    setFormUnit(exp.unit);
    setFormUnitPrice(exp.unitPrice);
    setFormSupplier(exp.supplier);
    setFormPaymentMethod(exp.paymentMethod);
    setFormNote(exp.note);
    setFormError('');
    setIsFormOpen(true);
  };

  // Auto update unit and price when ingredient changes
  const handleIngredientChange = (ingId: string) => {
    setFormIngredientId(ingId);
    const ing = state.ing.find(g => g.id === ingId);
    if (ing) {
      setFormUnit(ing.unit);
      if (!formUnitPrice || formUnitPrice === 0) {
        setFormUnitPrice(ing.price);
      }
    }
  };

  // Save Expense Form
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const qty = num(formQty);
    const price = num(formUnitPrice);

    if (formType === 'food') {
      if (!formIngredientId) {
        setFormError(isAr ? '⚠️ يجب اختيار الصنف الغذائي من قائمة الخامات' : '⚠️ Must select a food ingredient');
        return;
      }
      if (qty <= 0) {
        setFormError(isAr ? '⚠️ يجب إدخال كمية صحيحة أكبر من الصفر' : '⚠️ Quantity must be greater than 0');
        return;
      }
      if (price <= 0) {
        setFormError(isAr ? '⚠️ يجب إدخال سعر الوحدة بشكل صحيح' : '⚠️ Unit price must be greater than 0');
        return;
      }
    } else {
      // Non food
      if (qty <= 0 && price <= 0) {
        setFormError(isAr ? '⚠️ يجب إدخال قيمة المصروف أو الكمية والسعر' : '⚠️ Please enter valid expense amount');
        return;
      }
    }

    const total = qty > 0 && price > 0 ? qty * price : (price > 0 ? price : qty);

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        date: formDate,
        reference: formRef || editingExpense.reference,
        categoryId: formCategory,
        type: formType,
        ingredientId: formType === 'food' ? formIngredientId : null,
        qty: formType === 'food' ? qty : (qty > 0 ? qty : 1),
        unit: formType === 'food' ? formUnit : '',
        unitPrice: formType === 'food' ? price : total,
        total,
        supplier: formSupplier,
        paymentMethod: formPaymentMethod,
        note: formNote
      });
    } else {
      onAddExpense({
        date: formDate,
        reference: formRef || `EXP-${Date.now().toString().slice(-5)}`,
        categoryId: formCategory,
        type: formType,
        ingredientId: formType === 'food' ? formIngredientId : null,
        qty: formType === 'food' ? qty : (qty > 0 ? qty : 1),
        unit: formType === 'food' ? formUnit : '',
        unitPrice: formType === 'food' ? price : total,
        total,
        supplier: formSupplier,
        paymentMethod: formPaymentMethod,
        inventoryTransactionId: null,
        note: formNote,
        user: currentUser?.name || currentUser?.username || 'admin'
      });
    }

    setIsFormOpen(false);
  };

  // Category Management Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatType('non_food');
    setCatColor('#3b82f6');
    setCatActive(true);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatNameEn(cat.nameEn || '');
    setCatType(cat.type || 'non_food');
    setCatColor(cat.color || '#3b82f6');
    setCatActive(cat.active);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: catName.trim(),
        nameEn: catNameEn.trim() || undefined,
        type: catType,
        color: catColor,
        active: catActive
      });
    } else {
      onAddCategory({
        name: catName.trim(),
        nameEn: catNameEn.trim() || undefined,
        type: catType,
        color: catColor,
        active: catActive,
        order: (state.expenseCategories?.length || 0) + 1
      });
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategoryCheck = (catId: string) => {
    const isUsed = (state.expenses || []).some(e => e.categoryId === catId);
    if (isUsed) {
      alert(isAr ? '❌ لا يمكن حذف هذه الفئة لأنها مستخدمة في مصروفات مسجلة بالفعل. يمكنك تعطيلها بدلاً من ذلك.' : '❌ Cannot delete this category because it is already used in existing expenses.');
      return;
    }
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الفئة؟' : 'Are you sure you want to delete this category?')) {
      onDeleteCategory(catId);
    }
  };

  const canWrite = perms.canEditExpenses || perms.write_expenses || currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'purchasing';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-2xl">
              💰
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {isAr ? 'نظام المصروفات والتقرير المالي المتكامل' : 'Integrated Expenses & Financial Control'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  V4 Ledger Connected
                </span>
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {isAr 
                  ? 'تسجيل ومتابعة مشتريات الأغذية والمصروفات التشغيلية والربط التلقائي بمخزون الصنف' 
                  : 'Track food purchases & operating expenses with automatic stock ledger synchronization'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {canWrite && (
            <button
              onClick={handleOpenAdd}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-900/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? '＋ تسجيل مصروف جديد' : '＋ New Expense'}</span>
            </button>
          )}

          {perms.manage_expense_categories !== false && (
            <button
              onClick={() => setSubTab('categories')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition text-sm"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'إدارة الفئات' : 'Categories'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Filter & Presets Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" />
            {isAr ? 'فترة التقرير:' : 'Period:'}
          </span>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDatePreset('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                datePreset === 'all' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'كامل الفترة' : 'Full Period'}
            </button>
            <button
              onClick={() => setDatePreset('today')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                datePreset === 'today' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={() => setDatePreset('week')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                datePreset === 'week' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'آخر 7 أيام' : 'Last 7 Days'}
            </button>
            <button
              onClick={() => setDatePreset('month')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                datePreset === 'month' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'هذا الشهر' : 'This Month'}
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                datePreset === 'custom' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'مخصص' : 'Custom'}
            </button>
          </div>
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {effectiveFrom} ~ {effectiveTo}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'إجمالي المصروفات' : 'Total Expenses'}
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {money(metrics.totalExpenses)} <span className="text-xs font-normal text-slate-500">{state.settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.count} {isAr ? 'عملية مسجلة' : 'transactions'}
          </div>
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            💰
          </div>
        </div>

        {/* Food Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'مصروفات غذائية (مخزنية)' : 'Food Purchases'}
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {money(metrics.foodExpenses)} <span className="text-xs font-normal text-slate-500">{state.settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.totalExpenses > 0 ? `${((metrics.foodExpenses / metrics.totalExpenses) * 100).toFixed(1)}% من الإجمالي` : '0%'}
          </div>
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            🥩
          </div>
        </div>

        {/* Non-Food Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'مصروفات غير غذائية' : 'Non-Food Expenses'}
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {money(metrics.nonFoodExpenses)} <span className="text-xs font-normal text-slate-500">{state.settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.totalExpenses > 0 ? `${((metrics.nonFoodExpenses / metrics.totalExpenses) * 100).toFixed(1)}% من الإجمالي` : '0%'}
          </div>
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            🧾
          </div>
        </div>

        {/* Expense Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'عدد الفواتير' : 'Invoices Count'}
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {metrics.count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.dailyTrend.length} {isAr ? 'أيام بحركات' : 'active days'}
          </div>
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            🔢
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            {isAr ? 'أكبر فئة إنفاق' : 'Top Category'}
          </div>
          <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-1 truncate" title={metrics.topCategory?.name || '—'}>
            {metrics.topCategory?.name || '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.topCategory ? `${metrics.topCategory.pct.toFixed(0)}% (${money(metrics.topCategory.total)})` : '—'}
          </div>
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            🏆
          </div>
        </div>

        {/* Avg Expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'متوسط المصروف' : 'Avg Expense'}
          </div>
          <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {money(metrics.avgExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'لكل عملية' : 'per transaction'}
          </div>
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
            ⚖️
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-sm font-medium">
        <button
          onClick={() => setSubTab('list')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'list'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? 'سجل المصروفات' : 'Expenses Ledger'}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {displayExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('food_items')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'food_items'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>{isAr ? 'مشتريات المواد الغذائية' : 'Food Purchases by Item'}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            {metrics.foodItemBreakdown.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('daily')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'daily'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isAr ? 'التقرير اليومي والشهري' : 'Daily & Period Report'}</span>
        </button>

        <button
          onClick={() => setSubTab('financial')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'financial'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{isAr ? 'التحليل المالي والموردين' : 'Financial P&L & Suppliers'}</span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`px-4 py-2.5 rounded-t-xl border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'categories'
              ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'فئات المصروفات' : 'Expense Categories'}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {state.expenseCategories?.length || 0}
          </span>
        </button>
      </div>

      {/* Sub-Tab 1: Expenses Ledger Table */}
      {subTab === 'list' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث برقم المستند، الصنف، المورد، الملاحظات...' : 'Search by Ref, Item, Supplier, Notes...'}
                className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full md:w-44 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{isAr ? 'جميع الفئات' : 'All Categories'}</option>
              {(state.expenseCategories || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="w-full md:w-36 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{isAr ? 'كل الأنواع' : 'All Types'}</option>
              <option value="food">{isAr ? '🥩 غذائي / مخزني' : 'Food'}</option>
              <option value="non_food">{isAr ? '🧾 غير غذائي' : 'Non-Food'}</option>
            </select>

            {/* Supplier Filter */}
            {distinctSuppliers.length > 0 && (
              <select
                value={filterSupplier}
                onChange={e => setFilterSupplier(e.target.value)}
                className="w-full md:w-36 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">{isAr ? 'جميع الموردين' : 'All Suppliers'}</option>
                {distinctSuppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {/* Payment Method Filter */}
            <select
              value={filterPaymentMethod}
              onChange={e => setFilterPaymentMethod(e.target.value)}
              className="w-full md:w-32 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{isAr ? 'طرق الدفع' : 'Payment Method'}</option>
              {(state.paymentMethods || []).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3 text-center w-10">#</th>
                    <th className="p-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3">{isAr ? 'رقم المستند / المرجع' : 'Ref / Invoice'}</th>
                    <th className="p-3">{isAr ? 'الفئة' : 'Category'}</th>
                    <th className="p-3">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="p-3">{isAr ? 'الصنف / البيان' : 'Item / Description'}</th>
                    <th className="p-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-3 text-center">{isAr ? 'الوحدة' : 'Unit'}</th>
                    <th className="p-3 text-left">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="p-3 text-left">{isAr ? 'الإجمالي' : 'Total'}</th>
                    <th className="p-3">{isAr ? 'المورد' : 'Supplier'}</th>
                    <th className="p-3">{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                    <th className="p-3">{isAr ? 'المستخدم' : 'User'}</th>
                    <th className="p-3 text-center">{isAr ? 'حركة المخزون' : 'Stock Txn'}</th>
                    <th className="p-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {displayExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <span>{isAr ? 'لا توجد مصروفات مطابقة للشروط المحددة' : 'No expenses matching current filters'}</span>
                          {canWrite && (
                            <button
                              onClick={handleOpenAdd}
                              className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                            >
                              {isAr ? '＋ تسجيل أول مصروف الآن' : '＋ Add first expense now'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayExpenses.map((exp, idx) => {
                      const cat = state.expenseCategories?.find(c => c.id === exp.categoryId);
                      const ing = exp.ingredientId ? state.ing.find(g => g.id === exp.ingredientId) : null;
                      const isFood = exp.type === 'food';

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-mono font-medium whitespace-nowrap">{exp.date}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{exp.reference || exp.id}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span 
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
                              style={{ 
                                backgroundColor: `${cat?.color || '#64748b'}15`, 
                                borderColor: `${cat?.color || '#64748b'}40`,
                                color: cat?.color || '#64748b'
                              }}
                            >
                              {cat?.name || exp.categoryId}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isFood ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                🥩 {isAr ? 'غذائي' : 'Food'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                🧾 {isAr ? 'غير غذائي' : 'Non-Food'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium">
                            {isFood ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{ing?.name || exp.ingredientId}</span>
                                {exp.note && <span className="text-[10px] text-slate-400 truncate max-w-xs">{exp.note}</span>}
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{exp.note || cat?.name || 'مصروف عام'}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-medium">
                            {exp.qty > 0 ? nf(exp.qty) : '—'}
                          </td>
                          <td className="p-3 text-center text-slate-500 text-[11px]">
                            {exp.unit || '—'}
                          </td>
                          <td className="p-3 text-left font-mono">
                            {exp.unitPrice > 0 ? money(exp.unitPrice) : '—'}
                          </td>
                          <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                            {money(exp.total)} <span className="text-[10px] font-normal text-slate-400">{state.settings.currency}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {exp.supplier || '—'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                              {exp.paymentMethod || 'نقدي'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {exp.user || 'admin'}
                          </td>
                          <td className="p-3 text-center">
                            {exp.inventoryTransactionId ? (
                              <span 
                                title={`مرتبط بحركة استلام Ledger ID: ${exp.inventoryTransactionId}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>recv</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewingExpense(exp)}
                                title={isAr ? 'عرض التفاصيل' : 'View Details'}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {canWrite && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(exp)}
                                    title={isAr ? 'تعديل المصروف' : 'Edit Expense'}
                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(isAr ? 'هل أنت متأكد من حذف هذا المصروف؟ إذا كان غذائياً سيتم عكس حركة المخزون تلقائياً.' : 'Are you sure you want to delete this expense? Linked inventory movement will be reversed.')) {
                                        onDeleteExpense(exp.id);
                                      }
                                    }}
                                    title={isAr ? 'حذف المصروف' : 'Delete Expense'}
                                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {displayExpenses.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <tr>
                      <td colSpan={9} className="p-3 text-left">
                        {isAr ? 'إجمالي المصروفات المعروضة:' : 'Total Filtered Expenses:'}
                      </td>
                      <td className="p-3 text-left font-mono text-emerald-600 dark:text-emerald-400">
                        {money(displayExpenses.reduce((acc, e) => acc + num(e.total), 0))} {state.settings.currency}
                      </td>
                      <td colSpan={5}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Food Items Purchases Breakdown */}
      {subTab === 'food_items' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🥩</span>
                  <span>{isAr ? 'تقرير مشتريات وتوريدات المواد الغذائية حسب الصنف' : 'Food Purchases & Receiving by Ingredient'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'تجميع الكميات المشتراة من كل صنف مخزني وإجمالي التكلفة ومتوسط سعر الوحدة' : 'Aggregated bought quantities and weighted average purchasing costs'}
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {isAr ? 'إجمالي مشتريات الأغذية:' : 'Total Food:'} {money(metrics.foodExpenses)} {state.settings.currency}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3 text-center w-10">#</th>
                    <th className="p-3">{isAr ? 'كود الصنف' : 'ID'}</th>
                    <th className="p-3">{isAr ? 'اسم الصنف / المكون' : 'Ingredient Name'}</th>
                    <th className="p-3">{isAr ? 'القسم' : 'Category'}</th>
                    <th className="p-3 text-center">{isAr ? 'الوحدة' : 'Unit'}</th>
                    <th className="p-3 text-center">{isAr ? 'إجمالي الكمية المشتراة' : 'Total Bought Qty'}</th>
                    <th className="p-3 text-left">{isAr ? 'متوسط سعر الشراء' : 'Avg Unit Price'}</th>
                    <th className="p-3 text-left">{isAr ? 'إجمالي التكلفة' : 'Total Cost'}</th>
                    <th className="p-3 text-center">{isAr ? 'النسبة من مشتريات الأغذية' : '% of Food Purchases'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics.foodItemBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400">
                        {isAr ? 'لا توجد مشتريات غذائية مسجلة خلال هذه الفترة' : 'No food purchases recorded in this period'}
                      </td>
                    </tr>
                  ) : (
                    metrics.foodItemBreakdown.map((item, idx) => {
                      const pct = metrics.foodExpenses > 0 ? (item.totalCost / metrics.foodExpenses) * 100 : 0;
                      return (
                        <tr key={item.ingredientId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono text-slate-500">{item.ingredientId}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                          <td className="p-3 text-slate-500">{item.catName}</td>
                          <td className="p-3 text-center text-slate-500">{item.unit}</td>
                          <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                            {nf(item.qty)} {item.unit}
                          </td>
                          <td className="p-3 text-left font-mono">
                            {money(item.avgUnitPrice)}
                          </td>
                          <td className="p-3 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {money(item.totalCost)} {state.settings.currency}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {metrics.foodItemBreakdown.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={7} className="p-3 text-left">{isAr ? 'الإجمالي:' : 'Total:'}</td>
                      <td className="p-3 text-left font-mono text-emerald-600 dark:text-emerald-400">
                        {money(metrics.foodExpenses)} {state.settings.currency}
                      </td>
                      <td className="p-3 text-center font-mono">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Daily & Periodic Trend */}
      {subTab === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>📅</span>
                  <span>{isAr ? 'التقرير اليومي للمصروفات (Food vs Non-Food)' : 'Daily Expenses Trend Report'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'توزيع المصروفات اليومية بين المواد الغذائية والمصروفات التشغيلية' : 'Daily breakdown of food purchases vs operating expenses'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3 text-center w-10">#</th>
                    <th className="p-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3 text-left">{isAr ? 'مصروفات غذائية' : 'Food Purchases'}</th>
                    <th className="p-3 text-left">{isAr ? 'مصروفات غير غذائية' : 'Non-Food Expenses'}</th>
                    <th className="p-3 text-left">{isAr ? 'إجمالي اليوم' : 'Daily Total'}</th>
                    <th className="p-3 text-center">{isAr ? 'نسبة الغذائي %' : 'Food %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics.dailyTrend.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        {isAr ? 'لا توجد حركات مسجلة خلال الفترة' : 'No expenses in this period'}
                      </td>
                    </tr>
                  ) : (
                    metrics.dailyTrend.map((d, idx) => {
                      const foodRatio = d.total > 0 ? (d.foodTotal / d.total) * 100 : 0;
                      return (
                        <tr key={d.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{d.date}</td>
                          <td className="p-3 text-left font-mono text-emerald-600 dark:text-emerald-400">{money(d.foodTotal)}</td>
                          <td className="p-3 text-left font-mono text-amber-600 dark:text-amber-400">{money(d.nonFoodTotal)}</td>
                          <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-slate-100">{money(d.total)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              foodRatio > 50 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}>
                              {foodRatio.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {metrics.dailyTrend.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={2} className="p-3 text-left">{isAr ? 'الإجمالي العام:' : 'Grand Total:'}</td>
                      <td className="p-3 text-left font-mono text-emerald-600 dark:text-emerald-400">{money(metrics.foodExpenses)}</td>
                      <td className="p-3 text-left font-mono text-amber-600 dark:text-amber-400">{money(metrics.nonFoodExpenses)}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-slate-100">{money(metrics.totalExpenses)}</td>
                      <td className="p-3 text-center font-mono">
                        {metrics.totalExpenses > 0 ? ((metrics.foodExpenses / metrics.totalExpenses) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Financial Summary, Suppliers, and Payment Methods */}
      {subTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Financial Summary Card (Brief P&L) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>{isAr ? 'الملخص المالي ومؤشرات التكلفة (Financial Summary)' : 'Financial Summary & Cost Indicators'}</span>
            </h3>

            {/* Metrics List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{isAr ? 'إجمالي المبيعات (Sales Revenue)' : 'Total Sales Revenue'}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {money(state.sales.reduce((acc, s) => acc + num(s.qty) * num(s.price), 0))} {state.settings.currency}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">{isAr ? 'إجمالي مشتريات الأغذية والمخزون' : 'Total Food Purchases'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {money(metrics.foodExpenses)} {state.settings.currency}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="text-amber-800 dark:text-amber-300 font-medium">{isAr ? 'إجمالي المصروفات التشغيلية غير الغذائية' : 'Total Non-Food Expenses'}</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {money(metrics.nonFoodExpenses)} {state.settings.currency}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-white font-bold">
                <span>{isAr ? 'إجمالي المصروفات الكلية' : 'Total Combined Expenses'}</span>
                <span className="font-mono text-sm text-emerald-400">
                  {money(metrics.totalExpenses)} {state.settings.currency}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400">{isAr ? 'نسبة تكلفة الأغذية المقدرة (Food Cost %)' : 'Theoretical Food Cost %'}</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {(() => {
                    const salesTot = state.sales.reduce((acc, s) => acc + num(s.qty) * num(s.price), 0);
                    return salesTot > 0 ? `${((metrics.foodExpenses / salesTot) * 100).toFixed(1)}%` : '—';
                  })()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400">{isAr ? 'قيمة المخزون الختامي الفعلي' : 'Ending Stock Value'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {money(state.end.reduce((acc, v, i) => acc + num(v) * num(state.ing[i]?.price), 0))} {state.settings.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Suppliers Report */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span>{isAr ? 'مصروفات حسب المورد (Suppliers Breakdown)' : 'Expenses by Supplier'}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">{isAr ? 'المورد' : 'Supplier'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الفواتير' : 'Invoices'}</th>
                    <th className="p-2.5 text-left">{isAr ? 'غذائي' : 'Food'}</th>
                    <th className="p-2.5 text-left">{isAr ? 'غير غذائي' : 'Non-Food'}</th>
                    <th className="p-2.5 text-left">{isAr ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics.supplierBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        {isAr ? 'لا توجد بيانات موردين' : 'No supplier data'}
                      </td>
                    </tr>
                  ) : (
                    metrics.supplierBreakdown.map(s => (
                      <tr key={s.supplier} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{s.supplier}</td>
                        <td className="p-2.5 text-center font-mono">{s.invoicesCount}</td>
                        <td className="p-2.5 text-left font-mono text-emerald-600 dark:text-emerald-400">{money(s.foodTotal)}</td>
                        <td className="p-2.5 text-left font-mono text-amber-600 dark:text-amber-400">{money(s.nonFoodTotal)}</td>
                        <td className="p-2.5 text-left font-mono font-bold text-slate-900 dark:text-slate-100">{money(s.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'المصروفات حسب طريقة الدفع' : 'Expenses by Payment Method'}</span>
            </h3>

            <div className="space-y-3">
              {metrics.paymentMethodBreakdown.map(p => (
                <div key={p.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{p.method} ({p.count} فواتير)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {money(p.total)} {state.settings.currency} ({p.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, p.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Progress Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>{isAr ? 'توزيع المصروفات حسب الفئة' : 'Category Distribution'}</span>
            </h3>

            <div className="space-y-3">
              {metrics.categoryBreakdown.map(cat => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5" style={{ color: cat.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name} ({cat.count})
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {money(cat.total)} ({cat.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ backgroundColor: cat.color, width: `${Math.min(100, cat.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Categories Management */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span>{isAr ? 'إدارة فئات المصروفات' : 'Expense Categories Management'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'إضافة وتعديل وحذف وتفعيل الفئات المالية لتنظيم بنود الصرف' : 'Configure, add, edit, and organize expense categories'}
                </p>
              </div>
              {perms.manage_expense_categories !== false && (
                <button
                  onClick={handleOpenAddCategory}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? '＋ إضافة فئة جديدة' : '＋ Add Category'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(state.expenseCategories || []).map(cat => {
                const usedCount = (state.expenses || []).filter(e => e.categoryId === cat.id).length;
                const totalSpent = (state.expenses || []).filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + num(e.total), 0);

                return (
                  <div 
                    key={cat.id} 
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        >
                          {cat.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {cat.name}
                            {!cat.active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                                {isAr ? 'معطلة' : 'Inactive'}
                              </span>
                            )}
                          </div>
                          {cat.nameEn && <div className="text-[11px] text-slate-400 font-sans">{cat.nameEn}</div>}
                        </div>
                      </div>

                      {perms.manage_expense_categories !== false && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            title={isAr ? 'تعديل الفئة' : 'Edit'}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryCheck(cat.id)}
                            title={isAr ? 'حذف الفئة' : 'Delete'}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>{usedCount} {isAr ? 'حركات مسجلة' : 'expenses'}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {money(totalSpent)} {state.settings.currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add/Edit Expense Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>💰</span>
                <span>{editingExpense ? (isAr ? 'تعديل مصروف' : 'Edit Expense') : (isAr ? 'تسجيل مصروف جديد' : 'New Expense')}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                  {isAr ? 'نوع المصروف:' : 'Expense Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('food');
                      if (!formIngredientId && state.ing.length > 0) {
                        handleIngredientChange(state.ing[0].id);
                      }
                    }}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                      formType === 'food'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>🥩</span>
                    <span>{isAr ? 'غذائي / مخزني (يضاف للرصيد)' : 'Food / Inventory (Enters Ledger)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('non_food')}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                      formType === 'non_food'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>🧾</span>
                    <span>{isAr ? 'غير غذائي (تشغيلي / إداري)' : 'Non-Food / Operating'}</span>
                  </button>
                </div>
              </div>

              {/* Date & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'رقم المستند / الفاتورة' : 'Invoice / Ref #'}
                  </label>
                  <input
                    type="text"
                    value={formRef}
                    onChange={e => setFormRef(e.target.value)}
                    placeholder="INV-10025"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isAr ? 'فئة المصروف *' : 'Category *'}
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {(state.expenseCategories || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* If Food: Ingredient Selector */}
              {formType === 'food' && (
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4" />
                    <span>{isAr ? 'اختيار صنف المخزون التابع (حركة استلام توريد recv)' : 'Select Inventory Ingredient'}</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      {isAr ? 'الصنف / الخامة *' : 'Ingredient *'}
                    </label>
                    <select
                      required
                      value={formIngredientId}
                      onChange={e => handleIngredientChange(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="">{isAr ? '— اختر الصنف —' : '— Select Item —'}</option>
                      {state.ing.map((g, gIdx) => (
                        <option key={`${g.id}-${gIdx}`} value={g.id}>
                          {g.name} ({g.unit}) — السعر المرجعي: {g.price} {state.settings.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Quantity, Unit, Price, and Total */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'الكمية *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formQty}
                    onChange={e => setFormQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="20"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'الوحدة' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    placeholder={isAr ? 'كجم / عدد' : 'kg / pcs'}
                    disabled={formType === 'food'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'سعر الوحدة *' : 'Unit Price *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formUnitPrice}
                    onChange={e => setFormUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="350"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'إجمالي القيمة' : 'Total Amount'}
                  </label>
                  <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {money(num(formQty) * num(formUnitPrice))} {state.settings.currency}
                  </div>
                </div>
              </div>

              {/* Supplier & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'المورد / جهة الصرف' : 'Supplier / Vendor'}
                  </label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={e => setFormSupplier(e.target.value)}
                    placeholder={isAr ? 'اسم المورد أو المحل' : 'Supplier Name'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {isAr ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={e => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {(state.paymentMethods || []).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isAr ? 'ملاحظات وتفاصيل إضافية' : 'Notes / Description'}
                </label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder={isAr ? 'اكتب أي تفاصيل أخرى...' : 'Additional notes...'}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30"
                >
                  {editingExpense ? (isAr ? '💾 حفظ التعديل' : 'Save Changes') : (isAr ? '＋ حفظ المصروف' : 'Record Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Expense Details Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🧾</span>
                <span>{isAr ? 'تفاصيل سند المصروف' : 'Expense Details'}</span>
              </h3>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'رقم السند الداخلي' : 'Expense ID'}</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{viewingExpense.id}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'رقم الفاتورة / المرجع' : 'Invoice Reference'}</span>
                <span className="font-mono font-bold">{viewingExpense.reference || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'التاريخ' : 'Date'}</span>
                <span className="font-mono">{viewingExpense.date}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'النوع' : 'Type'}</span>
                <span className="font-bold">{viewingExpense.type === 'food' ? (isAr ? '🥩 غذائي / مخزني' : 'Food') : (isAr ? '🧾 غير غذائي' : 'Non-Food')}</span>
              </div>

              {viewingExpense.type === 'food' && viewingExpense.ingredientId && (
                <>
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                    <span>{isAr ? 'الصنف المخزني' : 'Ingredient'}</span>
                    <span className="font-bold">{state.ing.find(g => g.id === viewingExpense.ingredientId)?.name || viewingExpense.ingredientId}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">{isAr ? 'الكمية والوحدة' : 'Quantity'}</span>
                    <span className="font-mono font-bold">{nf(viewingExpense.qty)} {viewingExpense.unit}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500">{isAr ? 'سعر الوحدة' : 'Unit Price'}</span>
                    <span className="font-mono">{money(viewingExpense.unitPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span>{isAr ? 'حركة المخزون المرتبطة (Ledger Txn ID)' : 'Linked Inventory Txn ID'}</span>
                    <span className="font-mono font-bold">{viewingExpense.inventoryTransactionId || 'TXN-RECV'}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between p-2 rounded bg-slate-900 text-white font-bold text-sm">
                <span>{isAr ? 'إجمالي القيمة' : 'Total Amount'}</span>
                <span className="font-mono text-emerald-400">{money(viewingExpense.total)} {state.settings.currency}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'المورد' : 'Supplier'}</span>
                <span>{viewingExpense.supplier || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
                <span>{viewingExpense.paymentMethod || 'نقدي'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">{isAr ? 'المستخدم المسجل' : 'Registered By'}</span>
                <span>{viewingExpense.user || 'admin'}</span>
              </div>
              {viewingExpense.note && (
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <div className="font-semibold text-slate-500 mb-1">{isAr ? 'ملاحظات:' : 'Notes:'}</div>
                  <div>{viewingExpense.note}</div>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setViewingExpense(null)}
                className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🏷️</span>
                <span>{editingCategory ? (isAr ? 'تعديل فئة مصروفات' : 'Edit Category') : (isAr ? 'إضافة فئة جديدة' : 'Add Category')}</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isAr ? 'اسم الفئة (عربي) *' : 'Category Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder={isAr ? 'مثال: صيانة معدات' : 'Category Name'}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isAr ? 'اسم الفئة (إنجليزي)' : 'Category Name (English)'}
                </label>
                <input
                  type="text"
                  value={catNameEn}
                  onChange={e => setCatNameEn(e.target.value)}
                  placeholder="e.g. Equipment Maintenance"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isAr ? 'اللون المميز' : 'Badge Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={catColor}
                    onChange={e => setCatColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={catColor}
                    onChange={e => setCatColor(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActiveCheckbox"
                  checked={catActive}
                  onChange={e => setCatActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="catActiveCheckbox" className="text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? 'فئة نشطة ومتاحة للاختيار' : 'Active Category'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow"
                >
                  {isAr ? 'حفظ الفئة' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
