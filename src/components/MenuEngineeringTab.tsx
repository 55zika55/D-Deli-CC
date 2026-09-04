import React, { useState, useMemo } from 'react';
import { 
  AppState, 
  Language, 
  MenuEngineeringCategory,
  MenuEngineeringItem 
} from '../types';
import { 
  calculateMenuEngineering, 
  money, 
  nf 
} from '../utils/calculations';
import { 
  Sparkles, 
  Star, 
  Zap, 
  HelpCircle, 
  AlertTriangle, 
  Filter, 
  Search, 
  Download, 
  Printer, 
  TrendingUp, 
  PieChart, 
  SlidersHorizontal,
  ChevronDown,
  Info,
  CheckCircle2,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MenuEngineeringTabProps {
  state: AppState;
  currentLang: Language;
  onNavigateRecipe?: (recipeId: string) => void;
}

export const MenuEngineeringTab: React.FC<MenuEngineeringTabProps> = ({
  state,
  currentLang,
  onNavigateRecipe
}) => {
  const isAr = currentLang === 'ar';

  // Filters state
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hurdleFactor, setHurdleFactor] = useState<number>(0.7); // 70% standard or 1.0 (100% avg)
  const [sortField, setSortField] = useState<keyof MenuEngineeringItem>('totalProfit');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Available groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    state.sales.forEach(s => {
      if (s.group && s.group.trim()) {
        set.add(s.group.trim());
      }
    });
    return Array.from(set).sort();
  }, [state.sales]);

  // Compute Menu Engineering data
  const { items: allItems, summary } = useMemo(() => {
    return calculateMenuEngineering(state.sales, state.recipes, state.ing, {
      hurdleFactor,
      selectedGroup
    });
  }, [state.sales, state.recipes, state.ing, hurdleFactor, selectedGroup]);

  // Filter & sort items
  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q) || (item.nameEn && item.nameEn.toLowerCase().includes(q));
          const matchCode = item.code.toLowerCase().includes(q) || (item.recipeCode && item.recipeCode.toLowerCase().includes(q));
          const matchGroup = item.group.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchGroup) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = (valA as string).toLowerCase();
          valB = (valB as string || '').toLowerCase();
        }
        if (valA! < valB!) return sortAsc ? -1 : 1;
        if (valA! > valB!) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [allItems, selectedCategory, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof MenuEngineeringItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredItems.map((it, idx) => ({
      '#': idx + 1,
      [isAr ? 'كود الصنف SKU' : 'SKU']: it.code,
      [isAr ? 'اسم الصنف' : 'Item Name']: it.name,
      [isAr ? 'المجموعة' : 'Category/Group']: it.group,
      [isAr ? 'الكمية المباعة' : 'Qty Sold']: it.qty,
      [isAr ? 'حصة المبيعات %' : 'Menu Mix %']: `${nf(it.menuMixPct, 1)}%`,
      [isAr ? 'سعر البيع' : 'Selling Price']: it.price,
      [isAr ? 'تكلفة الصنف' : 'Unit Cost']: it.cost,
      [isAr ? 'هامش الربح للقطعة CM' : 'Contribution Margin']: it.margin,
      [isAr ? 'Food Cost %' : 'Food Cost %']: `${nf(it.foodCostPct, 1)}%`,
      [isAr ? 'إجمالي المبيعات' : 'Total Revenue']: it.totalRevenue,
      [isAr ? 'إجمالي التكلفة' : 'Total Cost']: it.totalCost,
      [isAr ? 'إجمالي الأرباح' : 'Total Gross Profit']: it.totalProfit,
      [isAr ? 'حصة الأرباح %' : 'Profit Share %']: `${nf(it.profitSharePct, 1)}%`,
      [isAr ? 'تصنيف المنيو' : 'Quadrant']: 
        it.category === 'star' ? (isAr ? '⭐ نجم (Star)' : 'Star') :
        it.category === 'horse' ? (isAr ? '🐎 حصان عمل (Horse)' : 'Plowhorse') :
        it.category === 'puzzle' ? (isAr ? '🧩 لغز (Puzzle)' : 'Puzzle') :
        (isAr ? '🐕 متعثر (Dog)' : 'Dog'),
      [isAr ? 'الخطة الاستراتيجية المقترحة' : 'Action Plan & Strategy']: isAr ? it.strategyAr : it.strategyEn
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Menu Engineering');
    XLSX.writeFile(wb, `Menu_Engineering_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-amber-300">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                {isAr ? 'تحليل ومصفوفة هندسة المنيو (Menu Engineering Matrix)' : 'Menu Engineering & Profit Matrix'}
              </h2>
            </div>
            <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
              {isAr
                ? 'تصنيف الأصناف المباعة إلى أربعة أقسام (النجوم Stars، أحصنة العمل Horses، الألغاز Puzzles، والأصناف المتعثرة Dogs) بالاعتماد على حجم الشعبية وهامش الربحية لاتخاذ قرارات تسعيرية وتشغيلية مدروسة.'
                : 'Classify sold menu items into four quadrants (Stars, Plowhorses, Puzzles, and Dogs) based on popularity (Menu Mix) and Contribution Margin to drive strategic menu & pricing decisions.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تصدير إكسيل' : 'Export Excel'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>
          </div>
        </div>

        {/* Benchmarks strip */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'متوسط هامش الربح (المعيار)' : 'Benchmark Margin (Avg CM)'}</div>
            <div className="font-bold text-sm text-emerald-400">{money(summary.avgMargin)} {isAr ? 'ج.م' : 'EGP'}</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'حد الشعبية الأدنى (المعيار)' : 'Popularity Threshold'}</div>
            <div className="font-bold text-sm text-sky-400">{nf(summary.avgQtyPerItem * hurdleFactor, 0)} {isAr ? 'قطعة' : 'Units'} <span className="text-[10px] text-slate-400">({nf(summary.popularityBenchmarkPct, 1)}%)</span></div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'إجمالي الأرباح الإجمالية' : 'Total Gross Profit'}</div>
            <div className="font-bold text-sm text-amber-400">{money(summary.totalProfit)} {isAr ? 'ج.م' : 'EGP'}</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'متوسط Food Cost %' : 'Overall Food Cost %'}</div>
            <div className="font-bold text-sm text-indigo-300">{nf(summary.overallFoodCostPct, 1)}%</div>
          </div>
        </div>
      </div>

      {/* 4 Quadrants Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STARS */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'star' ? 'all' : 'star')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2 ${
            selectedCategory === 'star'
              ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-400/20'
              : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <Star className="w-5 h-5 fill-amber-400" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{isAr ? '⭐ النجوم (Stars)' : '⭐ Stars'}</h3>
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  {isAr ? 'شعبية عالية + ربح مرتفع' : 'High Volume + High Profit'}
                </span>
              </div>
            </div>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{summary.starsCount}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>{isAr ? 'الكمية المباعة:' : 'Qty Sold:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{nf(summary.starsQty, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'إجمالي الأرباح:' : 'Total Profit:'}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{money(summary.starsProfit)} {isAr ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'حصة الأرباح:' : 'Profit Share:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.totalProfit > 0 ? nf((summary.starsProfit / summary.totalProfit) * 100, 1) : 0}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200/80 line-clamp-2">
            💡 {isAr ? 'حافظ على ثبات الجودة والتقديم، ولا تغير الوصفة.' : 'Protect recipe quality and keep prominent visibility.'}
          </div>
        </div>

        {/* WORKHORSES / PLOWHORSES */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'horse' ? 'all' : 'horse')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2 ${
            selectedCategory === 'horse'
              ? 'bg-blue-500/10 border-blue-500 shadow-md ring-2 ring-blue-400/20'
              : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{isAr ? '🐎 أحصنة العمل (Horses)' : '🐎 Plowhorses'}</h3>
                <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                  {isAr ? 'شعبية عالية + ربح منخفض' : 'High Volume + Low Profit'}
                </span>
              </div>
            </div>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{summary.horsesCount}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>{isAr ? 'الكمية المباعة:' : 'Qty Sold:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{nf(summary.horsesQty, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'إجمالي الأرباح:' : 'Total Profit:'}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{money(summary.horsesProfit)} {isAr ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'حصة الأرباح:' : 'Profit Share:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.totalProfit > 0 ? nf((summary.horsesProfit / summary.totalProfit) * 100, 1) : 0}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-200/80 line-clamp-2">
            💡 {isAr ? 'ارفع السعر تدريجياً أو أعد هندسة التكلفة دون التأثير على الشعبية.' : 'Test minor price increases or reduce component costs.'}
          </div>
        </div>

        {/* PUZZLES */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'puzzle' ? 'all' : 'puzzle')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2 ${
            selectedCategory === 'puzzle'
              ? 'bg-purple-500/10 border-purple-500 shadow-md ring-2 ring-purple-400/20'
              : 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/50 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <HelpCircle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{isAr ? '🧩 الألغاز (Puzzles)' : '🧩 Puzzles'}</h3>
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                  {isAr ? 'شعبية منخفضة + ربح مرتفع' : 'Low Volume + High Profit'}
                </span>
              </div>
            </div>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{summary.puzzlesCount}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>{isAr ? 'الكمية المباعة:' : 'Qty Sold:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{nf(summary.puzzlesQty, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'إجمالي الأرباح:' : 'Total Profit:'}</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{money(summary.puzzlesProfit)} {isAr ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'حصة الأرباح:' : 'Profit Share:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.totalProfit > 0 ? nf((summary.puzzlesProfit / summary.totalProfit) * 100, 1) : 0}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-200/80 line-clamp-2">
            💡 {isAr ? 'حسّن موقعه في القائمة ودرب الويترز على اقتراحه (Upselling).' : 'Reposition on menu and train floor staff to upsell.'}
          </div>
        </div>

        {/* DOGS */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'dog' ? 'all' : 'dog')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2 ${
            selectedCategory === 'dog'
              ? 'bg-rose-500/10 border-rose-500 shadow-md ring-2 ring-rose-400/20'
              : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{isAr ? '🐕 المتعثرة (Dogs)' : '🐕 Dogs'}</h3>
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                  {isAr ? 'شعبية منخفضة + ربح منخفض' : 'Low Volume + Low Profit'}
                </span>
              </div>
            </div>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{summary.dogsCount}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>{isAr ? 'الكمية المباعة:' : 'Qty Sold:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{nf(summary.dogsQty, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'إجمالي الأرباح:' : 'Total Profit:'}</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{money(summary.dogsProfit)} {isAr ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'حصة الأرباح:' : 'Profit Share:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.totalProfit > 0 ? nf((summary.dogsProfit / summary.totalProfit) * 100, 1) : 0}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-100 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-200/80 line-clamp-2">
            💡 {isAr ? 'ادرس استبداله أو إزالته أو تقليل هدر خاماته المخزونة.' : 'Consider eliminating, replacing, or raising price.'}
          </div>
        </div>
      </div>

      {/* Visual 2x2 Matrix Graphic Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'مصفوفة التوزيع الرباعية (Boston / Kasavana-Smith Matrix)' : 'Visual 2x2 Menu Engineering Matrix'}</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              {isAr ? 'المحور الرأسي: هامش المساهمة الربحي (CM) • المحور الأفقي: حجم المبيعات (Popularity)' : 'Vertical: Contribution Margin (CM) • Horizontal: Sales Volume (Popularity)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'معيار الشعبية:' : 'Hurdle Rate:'}
            </span>
            <button
              onClick={() => setHurdleFactor(hurdleFactor === 0.7 ? 1.0 : 0.7)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {hurdleFactor === 0.7 ? (isAr ? '70% القياسي' : '70% Hurdle') : (isAr ? '100% المتوسط' : '100% Avg')}
            </button>
          </div>
        </div>

        {/* 2x2 Grid Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TOP RIGHT / LEFT: STARS */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-sm text-amber-900 dark:text-amber-200">{isAr ? '⭐ النجوم (Stars)' : '⭐ Stars'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold">
                  {summary.starsCount} {isAr ? 'أصناف' : 'Items'}
                </span>
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium mb-3">
                {isAr ? '↑ ربحية مرتفعة  •  ↑ مبيعات مرتفعة' : '↑ High Margin  •  ↑ High Volume'}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {allItems.filter(i => i.category === 'star').map(item => (
                  <span
                    key={item.id}
                    onClick={() => { setSelectedCategory('star'); setSearchQuery(item.name); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 text-xs font-semibold cursor-pointer hover:scale-105 transition shadow-2xs"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({nf(item.qty, 0)} | {money(item.margin)})</span>
                  </span>
                ))}
                {summary.starsCount === 0 && (
                  <span className="text-xs text-amber-600/70 italic py-2">{isAr ? 'لا توجد أصناف في هذا القسم حالياً' : 'No items in this quadrant'}</span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
              📌 {isAr ? 'إجراء: الحفاظ على المعايير والجودة وتثبيت الموضع' : 'Action: Maintain quality and prominent placement'}
            </div>
          </div>

          {/* PUZZLES */}
          <div className="bg-purple-50/50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-sm text-purple-900 dark:text-purple-200">{isAr ? '🧩 الألغاز (Puzzles)' : '🧩 Puzzles'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 font-bold">
                  {summary.puzzlesCount} {isAr ? 'أصناف' : 'Items'}
                </span>
              </div>
              <div className="text-[11px] text-purple-800 dark:text-purple-300 font-medium mb-3">
                {isAr ? '↑ ربحية مرتفعة  •  ↓ مبيعات منخفضة' : '↑ High Margin  •  ↓ Low Volume'}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {allItems.filter(i => i.category === 'puzzle').map(item => (
                  <span
                    key={item.id}
                    onClick={() => { setSelectedCategory('puzzle'); setSearchQuery(item.name); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 text-xs font-semibold cursor-pointer hover:scale-105 transition shadow-2xs"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({nf(item.qty, 0)} | {money(item.margin)})</span>
                  </span>
                ))}
                {summary.puzzlesCount === 0 && (
                  <span className="text-xs text-purple-600/70 italic py-2">{isAr ? 'لا توجد أصناف في هذا القسم حالياً' : 'No items in this quadrant'}</span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-300">
              📌 {isAr ? 'إجراء: تدريب الويترز على الترشيح والتسويق وتغيير الاسم أو الموضع' : 'Action: Upsell via servers, featured marketing, rebranding'}
            </div>
          </div>

          {/* PLOWHORSES */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-sm text-blue-900 dark:text-blue-200">{isAr ? '🐎 أحصنة العمل (Horses)' : '🐎 Plowhorses'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200 font-bold">
                  {summary.horsesCount} {isAr ? 'أصناف' : 'Items'}
                </span>
              </div>
              <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium mb-3">
                {isAr ? '↓ ربحية منخفضة  •  ↑ مبيعات مرتفعة' : '↓ Low Margin  •  ↑ High Volume'}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {allItems.filter(i => i.category === 'horse').map(item => (
                  <span
                    key={item.id}
                    onClick={() => { setSelectedCategory('horse'); setSearchQuery(item.name); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100 text-xs font-semibold cursor-pointer hover:scale-105 transition shadow-2xs"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({nf(item.qty, 0)} | {money(item.margin)})</span>
                  </span>
                ))}
                {summary.horsesCount === 0 && (
                  <span className="text-xs text-blue-600/70 italic py-2">{isAr ? 'لا توجد أصناف في هذا القسم حالياً' : 'No items in this quadrant'}</span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300">
              📌 {isAr ? 'إجراء: إعادة هندسة التكلفة، تقليل الهدر، أو رفع السعر بهدوء' : 'Action: Re-engineer recipe, test slight price increase'}
            </div>
          </div>

          {/* DOGS */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-sm text-rose-900 dark:text-rose-200">{isAr ? '🐕 الأصناف المتعثرة (Dogs)' : '🐕 Dogs'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 font-bold">
                  {summary.dogsCount} {isAr ? 'أصناف' : 'Items'}
                </span>
              </div>
              <div className="text-[11px] text-rose-800 dark:text-rose-300 font-medium mb-3">
                {isAr ? '↓ ربحية منخفضة  •  ↓ مبيعات منخفضة' : '↓ Low Margin  •  ↓ Low Volume'}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {allItems.filter(i => i.category === 'dog').map(item => (
                  <span
                    key={item.id}
                    onClick={() => { setSelectedCategory('dog'); setSearchQuery(item.name); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100 text-xs font-semibold cursor-pointer hover:scale-105 transition shadow-2xs"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({nf(item.qty, 0)} | {money(item.margin)})</span>
                  </span>
                ))}
                {summary.dogsCount === 0 && (
                  <span className="text-xs text-rose-600/70 italic py-2">{isAr ? 'لا توجد أصناف في هذا القسم حالياً' : 'No items in this quadrant'}</span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-900 dark:text-rose-300">
              📌 {isAr ? 'إجراء: تقييم الإلغاء، أو استبدال الصنف، أو رفع السعر بشكل مباشر' : 'Action: Consider removal or redesigning recipe completely'}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 rtl:left-auto" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو SKU...' : 'Search by name or SKU...'}
              className="w-full pl-3 pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {isAr ? 'المجموعة:' : 'Group:'}
            </span>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{isAr ? 'كل المجموعات (الكل)' : 'All Groups'}</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Quadrant Category Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setSelectedCategory('star')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedCategory === 'star'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <span>⭐</span>
              <span>{isAr ? 'Stars' : 'Stars'}</span>
            </button>
            <button
              onClick={() => setSelectedCategory('horse')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedCategory === 'horse'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
              }`}
            >
              <span>🐎</span>
              <span>{isAr ? 'Horses' : 'Horses'}</span>
            </button>
            <button
              onClick={() => setSelectedCategory('puzzle')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedCategory === 'puzzle'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <span>🧩</span>
              <span>{isAr ? 'Puzzles' : 'Puzzles'}</span>
            </button>
            <button
              onClick={() => setSelectedCategory('dog')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedCategory === 'dog'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <span>🐕</span>
              <span>{isAr ? 'Dogs' : 'Dogs'}</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 self-center font-medium">
          {isAr ? `عرض ${filteredItems.length} من ${allItems.length} صنف` : `Showing ${filteredItems.length} of ${allItems.length} items`}
        </div>
      </div>

      {/* Main Analysis Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-12 text-center">#</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الصنف / SKU' : 'Item / SKU'}</span>
                    {sortField === 'name' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th className="p-3">{isAr ? 'المجموعة' : 'Group'}</th>
                <th 
                  onClick={() => handleSort('qty')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'الكمية المباعة' : 'Qty Sold'}</span>
                    {sortField === 'qty' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('menuMixPct')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'الشعبية (MM%)' : 'Menu Mix %'}</span>
                    {sortField === 'menuMixPct' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'سعر البيع' : 'Price'}</span>
                    {sortField === 'price' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cost')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'التكلفة' : 'Cost'}</span>
                    {sortField === 'cost' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('margin')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'هامش الربح CM' : 'Margin CM'}</span>
                    {sortField === 'margin' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('foodCostPct')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'Food Cost %' : 'Food Cost %'}</span>
                    {sortField === 'foodCostPct' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('totalProfit')}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isAr ? 'إجمالي الأرباح' : 'Total Profit'}</span>
                    {sortField === 'totalProfit' && <span>{sortAsc ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th className="p-3 text-center">{isAr ? 'تصنيف المنيو' : 'Category'}</th>
                <th className="p-3 min-w-[280px]">{isAr ? 'التوصية التشغيلية والاستراتيجية' : 'Action Plan'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((it, idx) => {
                const isStar = it.category === 'star';
                const isHorse = it.category === 'horse';
                const isPuzzle = it.category === 'puzzle';
                const isDog = it.category === 'dog';

                return (
                  <tr 
                    key={it.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{it.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{it.code}</span>
                        {it.recipeCode && (
                          <span className="text-indigo-500 dark:text-indigo-400">({it.recipeCode})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {it.group}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {nf(it.qty, 0)}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                      <span className={it.isHighPopularity ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                        {nf(it.menuMixPct, 1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-200">
                      {money(it.price)}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                      {money(it.cost)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={it.isHighProfitability ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                        {money(it.margin)}
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        it.foodCostPct > 35 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : it.foodCostPct < 25
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}>
                        {nf(it.foodCostPct, 1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {money(it.totalProfit)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {isStar && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>⭐ {isAr ? 'نجم (Star)' : 'Star'}</span>
                        </span>
                      )}
                      {isHorse && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold text-[11px] border border-blue-300 dark:border-blue-800">
                          <Zap className="w-3.5 h-3.5 text-blue-500" />
                          <span>🐎 {isAr ? 'حصان (Horse)' : 'Plowhorse'}</span>
                        </span>
                      )}
                      {isPuzzle && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold text-[11px] border border-purple-300 dark:border-purple-800">
                          <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                          <span>🧩 {isAr ? 'لغز (Puzzle)' : 'Puzzle'}</span>
                        </span>
                      )}
                      {isDog && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold text-[11px] border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span>🐕 {isAr ? 'متعثر (Dog)' : 'Dog'}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
                      {isAr ? it.strategyAr : it.strategyEn}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
