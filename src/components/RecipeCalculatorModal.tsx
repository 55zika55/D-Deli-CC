import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient, Language, AppState } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, nf, money, getRecipeAvgSellingPrice } from '../utils/calculations';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Percent, 
  Printer, 
  FileSpreadsheet, 
  Layers, 
  PieChart, 
  CheckCircle2, 
  Sliders, 
  ArrowRight,
  Info,
  Scale
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface RecipeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  state: AppState;
  currentLang: Language;
  onUpdateRecipeItem?: (recipeIndex: number, itemIndex: number, field: 'ingredientId' | 'std', value: string | number) => void;
}

export const RecipeCalculatorModal: React.FC<RecipeCalculatorModalProps> = ({
  isOpen,
  onClose,
  recipe,
  state,
  currentLang,
  onUpdateRecipeItem
}) => {
  if (!isOpen || !recipe) return null;

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const isAr = currentLang === 'ar';

  const ingMap = useMemo(() => new Map<string, Ingredient>(state.ing.map(g => [g.id, g])), [state.ing]);
  
  // Historical selling price from sales if exists
  const initialHistoricalSellPrice = useMemo(() => {
    const p = getRecipeAvgSellingPrice(recipe.id, state.sales);
    return p > 0 ? p : 150; // fallback reasonable default if no sales
  }, [recipe.id, state.sales]);

  // Interactive selling price state
  const [sellingPrice, setSellingPrice] = useState<number>(initialHistoricalSellPrice);
  const [portionYield, setPortionYield] = useState<number>(1); // Number of portions yielded by this recipe standard
  const [taxPct, setTaxPct] = useState<number>(14); // VAT % (14% default in Egypt)
  const [servicePct, setServicePct] = useState<number>(0); // Service charge %
  const [targetFoodCostPct, setTargetFoodCostPct] = useState<number>(30); // Target food cost % (e.g. 30%)
  const [wasteFactorPct, setWasteFactorPct] = useState<number>(0); // Kitchen preparation waste contingency %

  // Simulated recipe standard ingredient quantities (can test changes without breaking original BOM)
  const [simulatedQtys, setSimulatedQtys] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    recipe.items.forEach((item, idx) => {
      initial[idx] = num(item.std);
    });
    return initial;
  });

  // Calculate detailed ingredient costs breakdown
  const ingredientsBreakdown = useMemo(() => {
    let baseRawCost = 0;

    const items = recipe.items.map((it, idx) => {
      const g = ingMap.get(it.ingredientId);
      const unitPrice = num(g?.price || 0);
      const yieldFactor = num(g?.yield) > 0 ? num(g?.yield) : 1;
      
      // Quantity per batch/dish
      const stdQty = simulatedQtys[idx] !== undefined ? simulatedQtys[idx] : num(it.std);
      
      // Cost accounting for yield (AP Price vs EP Cost)
      const epUnitPrice = yieldFactor < 1 ? unitPrice / yieldFactor : unitPrice;
      const itemCost = stdQty * epUnitPrice;
      baseRawCost += itemCost;

      return {
        idx,
        ingredientId: it.ingredientId,
        name: g?.name || it.ingredientId,
        unit: g?.unit || '',
        cat: g?.cat ?? 0,
        unitPrice,
        yieldFactor,
        epUnitPrice,
        stdQty,
        itemCost
      };
    });

    // Contingency waste factor
    const contingencyCost = baseRawCost * (wasteFactorPct / 100);
    const totalBatchCost = baseRawCost + contingencyCost;
    const costPerPortion = portionYield > 0 ? totalBatchCost / portionYield : totalBatchCost;

    return {
      items,
      baseRawCost,
      contingencyCost,
      totalBatchCost,
      costPerPortion
    };
  }, [recipe.items, ingMap, simulatedQtys, wasteFactorPct, portionYield]);

  // Pricing & Profitability calculations
  const financials = useMemo(() => {
    const cost = ingredientsBreakdown.costPerPortion;
    const price = Math.max(0.01, sellingPrice);

    // Food Cost %
    const foodCostPct = (cost / price) * 100;

    // Gross Profit Margin per portion
    const grossProfitVal = price - cost;
    const grossProfitPct = (grossProfitVal / price) * 100;

    // Suggested Selling Price based on target food cost %
    const suggestedPriceAtTarget = targetFoodCostPct > 0 ? cost / (targetFoodCostPct / 100) : price;

    // Net revenue after VAT / taxes
    const taxAmount = price * (taxPct / 100);
    const serviceAmount = price * (servicePct / 100);
    const netRevenue = price - taxAmount;
    const netProfitVal = netRevenue - cost;
    const netProfitPct = price > 0 ? (netProfitVal / price) * 100 : 0;

    // Health Rating
    let status: 'ideal' | 'acceptable' | 'high_cost' | 'loss' = 'ideal';
    if (cost >= price) status = 'loss';
    else if (foodCostPct > 38) status = 'high_cost';
    else if (foodCostPct > 32) status = 'acceptable';
    else status = 'ideal';

    return {
      cost,
      price,
      foodCostPct,
      grossProfitVal,
      grossProfitPct,
      suggestedPriceAtTarget,
      taxAmount,
      serviceAmount,
      netRevenue,
      netProfitVal,
      netProfitPct,
      status
    };
  }, [ingredientsBreakdown.costPerPortion, sellingPrice, targetFoodCostPct, taxPct, servicePct]);

  // Handle standard simulation change
  const handleQtyChange = (idx: number, val: number) => {
    setSimulatedQtys(prev => ({
      ...prev,
      [idx]: Math.max(0, val)
    }));
  };

  const handleResetQtys = () => {
    const initial: Record<number, number> = {};
    recipe.items.forEach((item, idx) => {
      initial[idx] = num(item.std);
    });
    setSimulatedQtys(initial);
  };

  // Export recipe costing card to Excel
  const handleExportCostCardExcel = () => {
    const rows = [
      [isAr ? "بطاقة تحليل وحساب تكلفة الوصفة (Recipe Costing Sheet)" : "Recipe Costing & Margin Sheet"],
      [isAr ? `اسم الوصفة: ${recipe.name}` : `Recipe: ${recipe.name}`, isAr ? `كود الوصفة: ${recipe.code}` : `Code: ${recipe.code}`],
      [isAr ? `تاريخ الحساب: ${new Date().toLocaleDateString()}` : `Date: ${new Date().toLocaleDateString()}`, isAr ? `عدد الحصص (Yield): ${portionYield}` : `Portions: ${portionYield}`],
      [],
      [
        isAr ? "كود الخامة" : "Item ID",
        isAr ? "اسم المكون / الخامة" : "Ingredient",
        isAr ? "الوحدة" : "Unit",
        isAr ? "الكمية المعيارية" : "Std Qty",
        isAr ? "سعر الشراء (AP)" : "AP Price",
        isAr ? "نسبة الصافي (Yield%)" : "Yield %",
        isAr ? "تكلفة الصافي (EP)" : "EP Price",
        isAr ? "تكلفة المكون" : "Item Cost",
        isAr ? "نسبة من تكلفة الطبق" : "Cost Share %"
      ]
    ];

    ingredientsBreakdown.items.forEach(it => {
      const sharePct = ingredientsBreakdown.baseRawCost > 0 ? (it.itemCost / ingredientsBreakdown.baseRawCost) * 100 : 0;
      rows.push([
        it.ingredientId,
        it.name,
        it.unit,
        nf(it.stdQty),
        money(it.unitPrice),
        `${(it.yieldFactor * 100).toFixed(0)}%`,
        money(it.epUnitPrice),
        money(it.itemCost),
        `${sharePct.toFixed(1)}%`
      ]);
    });

    rows.push([]);
    rows.push([
      isAr ? "إجمالي تكلفة المكونات:" : "Total Raw Cost:",
      "", "", "", "", "", "",
      money(ingredientsBreakdown.totalBatchCost) + (isAr ? " ج.م" : " EGP"),
      "100%"
    ]);
    rows.push([
      isAr ? "تكلفة الحصة الواحدة (Portion Cost):" : "Cost Per Portion:",
      "", "", "", "", "", "",
      money(financials.cost) + (isAr ? " ج.م" : " EGP")
    ]);
    rows.push([
      isAr ? "سعر البيع المقترح / الحالي:" : "Selling Price:",
      "", "", "", "", "", "",
      money(financials.price) + (isAr ? " ج.م" : " EGP")
    ]);
    rows.push([
      isAr ? "نسبة تكلفة الطعام (Food Cost %):" : "Food Cost %:",
      "", "", "", "", "", "",
      `${financials.foodCostPct.toFixed(1)}%`
    ]);
    rows.push([
      isAr ? "هامش الربح الإجمالي (Gross Margin):" : "Gross Profit Margin:",
      "", "", "", "", "", "",
      `${financials.grossProfitPct.toFixed(1)}% (${money(financials.grossProfitVal)} EGP)`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recipe_Cost");
    XLSX.writeFile(wb, `Recipe_Costing_${recipe.code}_${recipe.name}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {isAr ? '🧮 حاسبة تكلفة الوصفة وهامش الربح' : 'Recipe Cost & Profit Margin Calculator'}
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                  {recipe.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {recipe.name} — {isAr ? 'تحليل تفصيلي لتكلفة كل مكون وتحديد سعر البيع وهامش الربحية' : 'Interactive BOM Costing & Profit Simulator'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCostCardExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title={isAr ? 'تصدير شيت التكلفة لـ Excel' : 'Export Costing to Excel'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير بطاقة التكلفة' : 'Excel Cost Card'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Financial KPI Dashboard Strip */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Food Cost % Metric */}
            <div className={`p-3 rounded-2xl border transition-all ${
              financials.status === 'loss'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-700 dark:text-red-300'
                : financials.status === 'high_cost'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{isAr ? 'نسبة تكلفة الطعام' : 'Food Cost %'}</span>
                <Percent className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono">
                {financials.foodCostPct.toFixed(1)}%
              </div>
              <div className="text-[11px] font-semibold mt-0.5">
                {financials.status === 'loss'
                  ? (isAr ? '❌ خسارة! التكلفة أعلى من السعر' : 'Loss: Cost > Price')
                  : financials.status === 'high_cost'
                  ? (isAr ? '⚠️ تكلفة مرتفعة (أعلى من 35%)' : 'High Food Cost')
                  : (isAr ? '✓ نسبة مثالية ومربحة' : 'Optimal Margin')}
              </div>
            </div>

            {/* Recipe Total Cost */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                <span>{isAr ? 'إجمالي تكلفة الطبق' : 'Portion Unit Cost'}</span>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                {money(financials.cost)} <span className="text-xs font-semibold text-slate-400">{isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {recipe.items.length} {isAr ? 'مكونات خام ومعيارية' : 'BOM Ingredients'}
              </div>
            </div>

            {/* Selling Price & Gross Profit */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-blue-200 dark:border-blue-800/40 shadow-sm">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold mb-1">
                <span>{isAr ? 'سعر البيع في المنيو' : 'Selling Price (Menu)'}</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                {money(financials.price)} <span className="text-xs font-semibold text-slate-400">{isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                {isAr ? 'الربح الإجمالي:' : 'Gross Profit:'} {money(financials.grossProfitVal)} ج.م ({financials.grossProfitPct.toFixed(1)}%)
              </div>
            </div>

            {/* Target Price Recommendation */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/40 shadow-sm">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
                <span>{isAr ? `السعر المقترح (${targetFoodCostPct}%)` : `Target Price (${targetFoodCostPct}%)`}</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                {money(financials.suggestedPriceAtTarget)} <span className="text-xs font-semibold text-slate-400">{isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr ? 'لتحقيق هدف التكلفة المستهدف' : 'To meet target food cost'}
              </div>
            </div>

          </div>
        </div>

        {/* Pricing Simulator Inputs & Controls */}
        <div className="p-3 sm:p-4 bg-slate-100/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              {isAr ? 'لوحة تحكم وتجربة التسعير (Price & Margin Simulator):' : 'Pricing & Margin Controls:'}
            </span>
            <button
              onClick={handleResetQtys}
              className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold underline"
            >
              {isAr ? 'استعادة الكميات الأصلية للوصفة' : 'Reset standard quantities'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                {isAr ? '💵 سعر البيع للزبون:' : 'Menu Selling Price:'}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-blue-400 rounded-lg font-mono font-bold text-base text-blue-600 dark:text-blue-400 focus:outline-none"
                />
                <span className="text-slate-500 font-semibold">{isAr ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                {isAr ? '🎯 التكلفة المستهدفة (Target %):' : 'Target Food Cost %:'}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="80"
                  value={targetFoodCostPct}
                  onChange={e => setTargetFoodCostPct(Math.max(1, parseFloat(e.target.value) || 30))}
                  className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-purple-400 rounded-lg font-mono font-bold text-base text-purple-600 dark:text-purple-400 focus:outline-none"
                />
                <span className="text-slate-500 font-semibold">%</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                {isAr ? '🍽️ عدد الحصص الناتجة (Yield):' : 'Batch Portion Yield:'}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={portionYield}
                  onChange={e => setPortionYield(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-base dark:text-white focus:outline-none"
                />
                <span className="text-slate-500 font-semibold">{isAr ? 'طبق' : 'portion'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                {isAr ? '🛡️ هدر تشغيل إضافي (Waste %):' : 'Kitchen Contingency %:'}
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={wasteFactorPct}
                  onChange={e => setWasteFactorPct(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-xs dark:text-white focus:outline-none"
                >
                  <option value="0">{isAr ? '0% (معياري بدون هدر)' : '0% (Exact)'}</option>
                  <option value="3">{isAr ? '+3% هدر تجهيز بسيط' : '+3% Normal'}</option>
                  <option value="5">{isAr ? '+5% هدر مطبخ عام' : '+5% Standard'}</option>
                  <option value="10">{isAr ? '+10% هدر تسوية وقلي' : '+10% High Prep'}</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Ingredients Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-center w-20">{isAr ? 'كود' : 'Code'}</th>
                  <th className="p-2.5 text-right min-w-[180px]">{isAr ? 'اسم المكون / الخامة' : 'Ingredient Name'}</th>
                  <th className="p-2.5 text-center w-16">{isAr ? 'الوحدة' : 'Unit'}</th>
                  <th className="p-2.5 text-center w-28 bg-blue-950 text-yellow-300 font-bold">
                    {isAr ? 'الكمية المعيارية ✏️' : 'Standard Qty'}
                  </th>
                  <th className="p-2.5 text-center w-24">{isAr ? 'سعر الشراء (AP)' : 'AP Price'}</th>
                  <th className="p-2.5 text-center w-20">{isAr ? 'صافي التصافي' : 'Yield %'}</th>
                  <th className="p-2.5 text-center w-24 bg-slate-800 text-slate-300">{isAr ? 'سعر الصافي (EP)' : 'EP Price'}</th>
                  <th className="p-2.5 text-center w-28 bg-slate-800 text-emerald-300 font-bold">{isAr ? 'تكلفة المكون' : 'Cost'}</th>
                  <th className="p-2.5 text-center w-24">{isAr ? 'حصة التكلفة' : 'Cost Share'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {ingredientsBreakdown.items.map((it, idx) => {
                  const costShare = ingredientsBreakdown.baseRawCost > 0 ? (it.itemCost / ingredientsBreakdown.baseRawCost) * 100 : 0;
                  const isTopCost = costShare >= 25; // Top cost driver (>25% of dish cost)

                  return (
                    <tr 
                      key={idx}
                      className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors ${
                        isTopCost ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2 text-center font-mono text-[11px] text-slate-500">{it.ingredientId}</td>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-100 text-right">
                        <div className="flex items-center justify-between">
                          <span>{it.name}</span>
                          {isTopCost && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                              {isAr ? 'خامة رئيسية' : 'Major Driver'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-center text-slate-500 font-medium">{it.unit}</td>

                      {/* Editable Standard Quantity for Simulation */}
                      <td className="p-1.5 text-center bg-blue-50/30 dark:bg-blue-950/30">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={it.stdQty}
                          onChange={e => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-center font-bold rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      <td className="p-2 text-center font-mono text-slate-500">{money(it.unitPrice)}</td>
                      <td className="p-2 text-center font-mono font-semibold">
                        {(it.yieldFactor * 100).toFixed(0)}%
                      </td>
                      <td className="p-2 text-center font-mono text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-900/40">
                        {money(it.epUnitPrice)}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50/60 dark:bg-slate-900/40">
                        {money(it.itemCost)}
                      </td>
                      <td className="p-2 text-center font-mono">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div 
                              className={`h-full ${isTopCost ? 'bg-amber-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(100, costShare)}%` }} 
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {costShare.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10">
                <tr>
                  <td colSpan={8} className="p-2.5 text-right">
                    {isAr ? 'إجمالي تكلفة المكونات (Raw Cost):' : 'Total Batch Ingredients Cost:'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-emerald-300 text-sm">
                    {money(ingredientsBreakdown.totalBatchCost)}
                  </td>
                  <td className="p-2.5 text-center text-slate-300">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer / Action */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">{isAr ? 'التكلفة لكل طبق:' : 'Cost / Portion:'} </span>
              <strong className="text-white font-mono text-sm font-bold">{money(financials.cost)} ج.م</strong>
            </div>
            <div>
              <span className="text-slate-400">{isAr ? 'سعر البيع:' : 'Price:'} </span>
              <strong className="text-blue-400 font-mono text-sm font-bold">{money(financials.price)} ج.م</strong>
            </div>
            <div>
              <span className="text-slate-400">{isAr ? 'هامش الربح:' : 'Gross Margin:'} </span>
              <strong className="text-emerald-400 font-mono text-sm font-bold">
                {money(financials.grossProfitVal)} ج.م ({financials.grossProfitPct.toFixed(1)}%)
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              {isAr ? 'إغلاق الحاسبة' : 'Done'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
