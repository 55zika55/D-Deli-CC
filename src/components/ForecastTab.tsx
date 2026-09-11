import React, { useState, useMemo } from 'react';
import { AppState, ComputedMetrics, Language, PrepItem, Ingredient, Recipe } from '../types';
import { TRANSLATIONS } from '../translations';
import { CATEGORIES_NAMES, PREP_ITEMS } from '../initialData';
import { num, nf, money } from '../utils/calculations';
import {
  TrendingUp,
  ShoppingCart,
  Factory,
  UtensilsCrossed,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Sliders,
  DollarSign,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { HistoricalSalesForecastCalculator } from './HistoricalSalesForecastCalculator';

interface ForecastTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onPostProductionBatch?: (prepItem: PrepItem, batches: number, date: string) => void;
  onOpenReportsPrint?: (report: 'forecast') => void;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({
  state,
  metrics,
  currentLang,
  canEdit,
  onPostProductionBatch,
  onOpenReportsPrint
}) => {
  // 1. Forecast Controls
  const [targetRevenue, setTargetRevenue] = useState<number>(200000);
  const [bufferPct, setBufferPct] = useState<number>(5); // 5% default safety/waste buffer
  const [netMode, setNetMode] = useState<boolean>(true); // deduct current stock
  const [activeSubView, setActiveSubView] = useState<'procurement' | 'production' | 'sales_mix'>('procurement');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [copiedMsg, setCopiedMsg] = useState<boolean>(false);
  const [prodSuccessMsg, setProdSuccessMsg] = useState<string>('');

  // Item-level manual quantity overrides (optional tweaking by user)
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [expandedPrepId, setExpandedPrepId] = useState<string | null>(null);

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Base Historical Sales Total
  const historicalTotalSales = useMemo(() => {
    return state.sales.reduce((sum, s) => sum + num(s.qty) * num(s.price), 0) || 1;
  }, [state.sales]);

  // Maps
  const ingMap = useMemo(() => new Map<string, Ingredient>(state.ing.map(g => [g.id, g])), [state.ing]);
  const ingNameMap = useMemo(() => new Map<string, Ingredient>(state.ing.map(g => [g.name, g])), [state.ing]);
  const recipeMap = useMemo(() => new Map<string, Recipe>(state.recipes.map(r => [r.id, r])), [state.recipes]);
  const recipeCodeMap = useMemo(() => new Map<string, Recipe>(state.recipes.map(r => [r.code, r])), [state.recipes]);

  // 2. Compute Forecasted Sales Quantities for all 53 Items
  const forecastedSales = useMemo(() => {
    const bufferMultiplier = 1 + bufferPct / 100;

    return state.sales.map(item => {
      const historicalItemRev = num(item.qty) * num(item.price);
      const salesMixPct = (historicalItemRev / historicalTotalSales) * 100;
      const targetItemRev = (salesMixPct / 100) * targetRevenue;
      
      const calcQty = num(item.price) > 0 ? (targetItemRev / num(item.price)) * bufferMultiplier : 0;
      const effectiveQty = qtyOverrides[item.id] !== undefined ? qtyOverrides[item.id] : Math.round(calcQty);
      const effectiveRev = effectiveQty * num(item.price);

      // Find recipe and calculate unit cost
      const recipe = item.recipeId ? recipeMap.get(item.recipeId) : null;
      let unitCost = 0;
      if (recipe) {
        recipe.items.forEach(it => {
          const ing = ingMap.get(it.ingredientId);
          if (ing) {
            unitCost += num(it.std) * num(ing.price);
          }
        });
      }

      return {
        item,
        salesMixPct,
        calculatedQty: calcQty,
        effectiveQty,
        effectiveRev,
        unitCost,
        foodCostPct: num(item.price) > 0 ? (unitCost / num(item.price)) * 100 : 0
      };
    });
  }, [state.sales, historicalTotalSales, targetRevenue, bufferPct, qtyOverrides, recipeMap, ingMap]);

  // 3. Explode Recipes -> Theoretical Ingredient Demand (including direct & prep-derived)
  const { grossDemandByIngId, totalMealsCount, totalForecastRevenue } = useMemo(() => {
    const demand: Record<string, number> = {};
    let totalMeals = 0;
    let totalRev = 0;

    forecastedSales.forEach(fs => {
      const q = fs.effectiveQty;
      totalMeals += q;
      totalRev += fs.effectiveRev;

      if (!q || !fs.item.recipeId) return;
      const recipe = recipeMap.get(fs.item.recipeId);
      if (!recipe) return;

      recipe.items.forEach(it => {
        demand[it.ingredientId] = (demand[it.ingredientId] || 0) + num(it.std) * q;
      });
    });

    return {
      grossDemandByIngId: demand,
      totalMealsCount: totalMeals,
      totalForecastRevenue: totalRev
    };
  }, [forecastedSales, recipeMap]);

  // 4. Calculate Prep Production Plan
  const prepPlan = useMemo(() => {
    return PREP_ITEMS.map((p, idx) => {
      let ing = ingNameMap.get(p.name);
      if (!ing) {
        if (p.name.includes('عجين بيتزا')) ing = ingNameMap.get('عجين بيتزا مخمر جاهز') || ingNameMap.get('بورشن عجين بيتزا');
        else if (p.name.includes('صلصه طماطم')) ing = ingNameMap.get('صلصه طماطم بيتزا') || ingNameMap.get('صلصه طماطم');
        else if (p.name.includes('كينوا')) ing = ingNameMap.get('صوص ليمون الكينوا سالاد');
        else if (p.name.includes('كاساديا') && p.name.includes('تتبيل')) ing = ingNameMap.get('تتبيله بعد التسوية دجاج كاساديا') || ingNameMap.get('تتبيله بعد التسويه دجاج كاساديا') || ingNameMap.get('تتبيله مع التسويه دجاج كاساديا');
      }
      const recipe = recipeCodeMap.get(p.recipeCode);
      let directDemand = ing ? (grossDemandByIngId[ing.id] || 0) : 0;

      // Sum aliases if any
      if (p.name.includes('عجين بيتزا')) {
        const altIng = ingNameMap.get('بورشن عجين بيتزا');
        if (altIng && altIng.id !== ing?.id) directDemand += (grossDemandByIngId[altIng.id] || 0);
      } else if (p.name.includes('صلصه طماطم')) {
        const altIng = ingNameMap.get('صلصه طماطم');
        if (altIng && altIng.id !== ing?.id) directDemand += (grossDemandByIngId[altIng.id] || 0);
      } else if (p.name.includes('كاساديا') && p.name.includes('تتبيل')) {
        const altIng1 = ingNameMap.get('تتبيله بعد التسويه دجاج كاساديا');
        const altIng2 = ingNameMap.get('تتبيله مع التسويه دجاج كاساديا');
        if (altIng1 && altIng1.id !== ing?.id) directDemand += (grossDemandByIngId[altIng1.id] || 0);
        if (altIng2 && altIng2.id !== ing?.id) directDemand += (grossDemandByIngId[altIng2.id] || 0);
      }

      const exactBatches = p.batchSize > 0 ? directDemand / p.batchSize : 0;
      const suggestedBatches = state.roundUp ? Math.ceil(exactBatches - 1e-9) : exactBatches;
      const expectedOutput = suggestedBatches * p.batchSize;

      // Ingredients needed for this prep item's production
      const subIngredients = recipe ? recipe.items.map(it => {
        const subIng = ingMap.get(it.ingredientId);
        const qtyPerBatch = num(it.std);
        const totalQtyNeeded = qtyPerBatch * suggestedBatches;
        const totalCost = totalQtyNeeded * (subIng ? num(subIng.price) : 0);
        return {
          ing: subIng,
          qtyPerBatch,
          totalQtyNeeded,
          totalCost
        };
      }) : [];

      const batchCost = subIngredients.reduce((sum, si) => sum + si.totalCost, 0);

      // Find all forecasted dishes that link to this prep item
      const linkedDishes: {
        code: string;
        name: string;
        group: string;
        qty: number;
        portionStd: number;
        totalDemand: number;
      }[] = [];

      forecastedSales.forEach(fs => {
        const r = fs.recipe;
        if (!r || fs.expectedQty <= 0) return;
        r.items.forEach(it => {
          let isMatch = false;
          if (ing && it.ingredientId === ing.id) isMatch = true;
          else if (it.ing === p.name) isMatch = true;
          else if (p.name.includes('عجين بيتزا') && (it.ing === 'بورشن عجين بيتزا' || it.ing === 'عجين بيتزا مخمر جاهز')) isMatch = true;
          else if (p.name.includes('صلصه طماطم') && (it.ing === 'صلصه طماطم' || it.ing === 'صلصه طماطم بيتزا')) isMatch = true;
          else if (p.name.includes('كاساديا') && p.name.includes('تتبيل') && it.ing.includes('كاساديا') && it.ing.includes('تتبيل')) isMatch = true;
          else if (p.name.includes('كينوا') && it.ing.includes('كينوا') && it.ing.includes('صوص')) isMatch = true;
          else if (p.name.includes('تونه مكس') && (it.ing.includes('تونه مكس') || it.ing === 'تونه مكس')) isMatch = true;
          else if (p.name.includes('خضار كاساديا') && (it.ing.includes('خضار كاساديا') || it.ing === 'خضار كاساديا')) isMatch = true;
          else if (p.name.includes('دجاج كاساديا') && it.ing.includes('دجاج كاساديا')) isMatch = true;
          else if (p.name.includes('دجاج شاورما') && it.ing.includes('دجاج شاورما')) isMatch = true;
          else if (p.name.includes('تومية شاورما') && it.ing.includes('توميه')) isMatch = true;
          else if (p.name.includes('سيزار') && it.ing.includes('سيزار سلاد')) isMatch = true;
          else if (p.name.includes('توابل الكبده') && it.ing.includes('توابل الكبده')) isMatch = true;
          else if (p.name.includes('طحينه') && it.ing.includes('طحينه')) isMatch = true;

          if (isMatch) {
            linkedDishes.push({
              code: fs.item.code,
              name: fs.item.name,
              group: fs.item.group || 'عام',
              qty: fs.expectedQty,
              portionStd: num(it.std),
              totalDemand: fs.expectedQty * num(it.std)
            });
          }
        });
      });

      return {
        id: `prep-${idx}`,
        prepItem: p,
        ing,
        recipe,
        directDemand,
        exactBatches,
        suggestedBatches,
        expectedOutput,
        subIngredients,
        batchCost,
        linkedDishes
      };
    });
  }, [ingNameMap, recipeCodeMap, grossDemandByIngId, state.roundUp, ingMap, forecastedSales]);

  // 5. Total Procurement Requisition (Exploded Raw Materials)
  // For procurement: Direct raw ingredients + sub-ingredients of required prep batches
  const procurementList = useMemo(() => {
    // Collect all raw materials
    const finalRawDemand: Record<string, number> = {};

    // 1. Direct ingredients from menu items (excluding semi-finished prep items)
    const prepIngNameSet = new Set(PREP_ITEMS.map(p => p.name));

    state.ing.forEach(g => {
      if (!prepIngNameSet.has(g.name)) {
        const d = grossDemandByIngId[g.id] || 0;
        if (d > 0) {
          finalRawDemand[g.id] = (finalRawDemand[g.id] || 0) + d;
        }
      }
    });

    // 2. Add raw ingredients from the prep production plan
    prepPlan.forEach(pp => {
      pp.subIngredients.forEach(si => {
        if (si.ing) {
          finalRawDemand[si.ing.id] = (finalRawDemand[si.ing.id] || 0) + si.totalQtyNeeded;
        }
      });
    });

    // Build the consolidated procurement rows
    return state.ing.map((g, idx) => {
      const grossRaw = finalRawDemand[g.id] || 0;
      const yieldPct = num(g.yield) || 1;
      const adjustedGross = grossRaw / yieldPct; // adjust for preparation yield

      const currentStock = num(state.end[idx]);
      const netRequired = netMode ? Math.max(0, adjustedGross - currentStock) : adjustedGross;
      const orderCost = netRequired * num(g.price);
      const grossCost = adjustedGross * num(g.price);

      return {
        ing: g,
        categoryName: CATEGORIES_NAMES[g.cat] || 'أخرى',
        grossRaw,
        adjustedGross,
        currentStock,
        netRequired,
        orderCost,
        grossCost
      };
    }).filter(row => row.adjustedGross > 0 || (netMode && row.netRequired > 0));
  }, [state.ing, grossDemandByIngId, prepPlan, netMode, state.end]);

  // 6. Overall Summary Metrics
  const totalProcurementCost = useMemo(() => {
    return procurementList.reduce((sum, item) => sum + (netMode ? item.orderCost : item.grossCost), 0);
  }, [procurementList, netMode]);

  const expectedFoodCostPct = useMemo(() => {
    return totalForecastRevenue > 0 ? (totalProcurementCost / totalForecastRevenue) * 100 : 0;
  }, [totalProcurementCost, totalForecastRevenue]);

  const totalBatchesCount = useMemo(() => {
    return prepPlan.reduce((sum, p) => sum + p.suggestedBatches, 0);
  }, [prepPlan]);

  // Filtered procurement list
  const filteredProcurement = useMemo(() => {
    return procurementList.filter(row => {
      const matchesSearch = !searchTerm || row.ing.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || row.ing.cat === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [procurementList, searchTerm, selectedCategory]);

  // Actions
  const handleCopyWhatsAppRequisition = () => {
    const lines: string[] = [];
    lines.push(`🛒 *طلب توريد خامات ومشتريات (D-Deli / بوتشرز)*`);
    lines.push(`🎯 المستهدف: مبيعات *${money(targetRevenue, 0)} ج.م*`);
    lines.push(`📅 تاريخ التوليد: ${new Date().toLocaleDateString('ar-EG')}`);
    lines.push(`🛡️ معامل الأمان: +${bufferPct}% | وضع الاحتساب: ${netMode ? 'صافي النواقص' : 'الطلب الإجمالي'}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    // Group by category
    const grouped: Record<string, typeof procurementList> = {};
    procurementList.forEach(p => {
      if (p.netRequired > 0) {
        if (!grouped[p.categoryName]) grouped[p.categoryName] = [];
        grouped[p.categoryName].push(p);
      }
    });

    Object.entries(grouped).forEach(([catName, items]) => {
      lines.push(`\n📌 *[ ${catName} ]*`);
      items.forEach(it => {
        let displayQty = '';
        if (it.ing.unit === 'جرام' && it.netRequired >= 1000) {
          displayQty = `${(it.netRequired / 1000).toFixed(2)} كجم (${nf(it.netRequired, 0)} جم)`;
        } else {
          displayQty = `${nf(it.netRequired, 1)} ${it.ing.unit}`;
        }
        lines.push(`▪️ ${it.ing.name}: *${displayQty}*`);
      });
    });

    lines.push(`\n━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *إجمالي التكلفة التقديرية للطلبية:* ${money(totalProcurementCost)} ج.م`);
    lines.push(`📊 *Food Cost المتوقع:* ${expectedFoodCostPct.toFixed(1)}%`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 3500);
  };

  const handlePrint = () => {
    if (onOpenReportsPrint) {
      onOpenReportsPrint('forecast');
    } else {
      window.print();
    }
  };

  const handlePostAllProduction = () => {
    if (!canEdit || !onPostProductionBatch) return;
    const confirmPost = confirm(`هل تود بالتأكيد ترحيل خطة تصنيع (${totalBatchesCount.toFixed(1)} باتش) إلى سجل حركة المخزون بتاريخ اليوم؟`);
    if (!confirmPost) return;

    let postedCount = 0;
    const todayStr = state.dTo || new Date().toISOString().split('T')[0];

    prepPlan.forEach(p => {
      if (p.suggestedBatches > 0) {
        onPostProductionBatch(p.prepItem, p.suggestedBatches, todayStr);
        postedCount++;
      }
    });

    setProdSuccessMsg(`✓ تم بنجاح ترحيل إنتاج (${postedCount}) صنف تجهيز إلى سجل المخزون وخصم خاماتها`);
    setTimeout(() => setProdSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Configuration Dashboard */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                  تخطيط الطلبيات والإنتاج المستقبلي (Sales Forecast & MRP)
                </h2>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  مُعزز ببيانات المبيعات
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                حدد مبلغ المبيعات المستهدف وسيقوم النظام تلقائياً بتفجير الوصفات واحتساب طلبية الخامات وخطة تصنيع المطبخ
              </p>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleCopyWhatsAppRequisition}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              title="نسخ طلبية المشتريات منسقة لواتساب"
            >
              {copiedMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMsg ? 'تم نسخ الطلبية بنجاح!' : 'نسخ لواتساب المشتريات'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              title="طباعة أمر التوريد والإنتاج"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الطلبية</span>
            </button>
          </div>
        </div>

        {/* 1.5 Smart Historical Sales Forecasting Engine */}
        <div className="pt-4">
          <HistoricalSalesForecastCalculator
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            onApplyForecast={(val) => setTargetRevenue(val)}
            currentAppliedRevenue={targetRevenue}
          />
        </div>

        {/* 2. Interactive Controls Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Target Revenue Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              مبلغ المبيعات المتوقع (ج.م):
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="5000"
                value={targetRevenue}
                onChange={e => setTargetRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-3 pr-4 py-2 bg-blue-50/50 dark:bg-slate-900 border-2 border-blue-500/60 rounded-xl text-sm font-bold text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1 pt-1 overflow-x-auto">
              {[50000, 100000, 200000, 350000, 500000].map(val => (
                <button
                  key={val}
                  onClick={() => setTargetRevenue(val)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                    targetRevenue === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Safety Buffer % */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              معامل الأمان والهالك (Buffer %):
            </label>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15, 20].map(pct => (
                <button
                  key={pct}
                  onClick={() => setBufferPct(pct)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    bufferPct === pct
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">يضيف نسبة احتياطية لتغطية الهالك وساعات الذروة</p>
          </div>

          {/* Requisition Mode (Net vs Gross) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
              طريقة احتساب كميات الشراء:
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setNetMode(true)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center ${
                  netMode
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                خصم المخزون الحالي
              </button>
              <button
                onClick={() => setNetMode(false)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center ${
                  !netMode
                    ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                إجمالي الطلبية الكامل
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {netMode ? 'يخصم الرصيد الحالي بالمخزن من كميات التوريد' : 'يطلب كامل الكمية دون النظر للمخزون'}
            </p>
          </div>

          {/* Round Up Setting */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
              تقريب الباتشات للإنتاج:
            </label>
            <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-300">تقريب لأعلى (Ceil):</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {state.roundUp ? 'مُفعّل (باتشات كاملة)' : 'كسور دقيقة'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">مبني على إعدادات تقريب الباتشات في النظام</p>
          </div>
        </div>

        {/* 3. KPI Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">المبيعات المستهدفة</span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono block mt-0.5">
              {money(targetRevenue, 0)} ج.م
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">إجمالي الوجبات المتوقعة</span>
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">
              {nf(totalMealsCount, 0)} وجبة
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">تكلفة خامات التوريد</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
              {money(totalProcurementCost, 0)} ج.م
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Food Cost المتوقع</span>
            <span className={`text-base font-extrabold font-mono block mt-0.5 ${
              expectedFoodCostPct <= 35 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {expectedFoodCostPct.toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">باتشات التحضير المطلوبة</span>
            <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono block mt-0.5">
              {nf(totalBatchesCount, 1)} باتش
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">أصناف الخامات للشراء</span>
            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono block mt-0.5">
              {procurementList.length} خامة
            </span>
          </div>
        </div>
      </div>

      {/* 4. Sub-Views Switcher (Procurement / Kitchen Production / Sales Mix) */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubView('procurement')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubView === 'procurement'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            <span>1. أمر توريد المشتريات ({filteredProcurement.length} صنف)</span>
          </button>

          <button
            onClick={() => setActiveSubView('production')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubView === 'production'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Factory className="w-4 h-4 text-purple-500" />
            <span>2. خطة تصنيع وتحضير المطبخ ({prepPlan.length} تجهيز)</span>
          </button>

          <button
            onClick={() => setActiveSubView('sales_mix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubView === 'sales_mix'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-blue-500" />
            <span>3. مبيعات الأصناف المتوقعة ({forecastedSales.length} وجبة)</span>
          </button>
        </div>
      </div>

      {prodSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>{prodSuccessMsg}</span>
        </div>
      )}

      {/* VIEW 1: PROCUREMENT PURCHASE ORDER */}
      {activeSubView === 'procurement' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                أمر توريد الخامات والمشتريات المفصل (Requisition Bill of Materials)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يشمل كافة الخامات المباشرة + مكونات باتشات التحضير معادلّة بنسبة الهالك والإنتاجية (Yield)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs dark:text-white font-medium"
                >
                  <option value="all">جميع التصنيفات والموردين</option>
                  {CATEGORIES_NAMES.map((cat, idx) => (
                    <option key={idx} value={idx}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="بحث عن خامة..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-right min-w-[180px]">اسم الخامة</th>
                  <th className="p-2.5 text-center w-28">التصنيف / المورد</th>
                  <th className="p-2.5 text-center w-16">الوحدة</th>
                  <th className="p-2.5 text-center w-24">الاحتياج الإجمالي</th>
                  <th className="p-2.5 text-center w-24">الرصيد الحالي</th>
                  <th className="p-2.5 text-center w-28 bg-emerald-950 text-emerald-300 font-bold">الصافي المطلوب شراؤه</th>
                  <th className="p-2.5 text-center w-24">سعر الوحدة</th>
                  <th className="p-2.5 text-center w-28">التكلفة التقديرية</th>
                  <th className="p-2.5 text-center w-24">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {filteredProcurement.map((row, idx) => {
                  const toOrder = netMode ? row.netRequired : row.adjustedGross;
                  const itemCost = netMode ? row.orderCost : row.grossCost;

                  // Friendly unit conversion (grams to kg)
                  let displayGross = `${nf(row.adjustedGross, 1)} ${row.ing.unit}`;
                  let displayOrder = `${nf(toOrder, 1)} ${row.ing.unit}`;
                  if (row.ing.unit === 'جرام' && row.adjustedGross >= 1000) {
                    displayGross = `${(row.adjustedGross / 1000).toFixed(2)} كجم`;
                  }
                  if (row.ing.unit === 'جرام' && toOrder >= 1000) {
                    displayOrder = `${(toOrder / 1000).toFixed(2)} كجم`;
                  }

                  const isSufficient = row.currentStock >= row.adjustedGross;

                  return (
                    <tr key={row.ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200 text-right">
                        {row.ing.name}
                      </td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {row.categoryName}
                        </span>
                      </td>
                      <td className="p-2 text-center font-semibold text-slate-500">{row.ing.unit}</td>
                      <td className="p-2 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {displayGross}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {nf(row.currentStock)} {row.ing.unit}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 text-sm">
                        {displayOrder}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">
                        {money(row.ing.price)}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {money(itemCost)}
                      </td>
                      <td className="p-2 text-center">
                        {isSufficient ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            مغطى بالمخزن
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            يلزم التوريد
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KITCHEN PRODUCTION & PREP PLAN */}
      {activeSubView === 'production' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Factory className="w-4 h-4 text-purple-600" />
                خطة التشغيل والتصنيع بالمطبخ (Kitchen Production & Batch Planner)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                حساب عدد الباتشات المعيارية اللازم تحضيرها لتغطية طلبات المبيعات المتوقعة
              </p>
            </div>

            {canEdit && onPostProductionBatch && (
              <button
                onClick={handlePostAllProduction}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Factory className="w-4 h-4" />
                <span>ترحيل خطة الإنتاج كاملة لسجل المخزون</span>
              </button>
            )}
          </div>

          {/* Prep Table */}
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-purple-50/60 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
            <span className="flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-300">
              <Info className="w-4 h-4" />
              اضغط على أي صنف محضر لعرض مقادير وخامات الوصفة بالكامل والكميات المطلوبة لتحضيرها والوجبات المباعة المرتبطة بها
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400">
              {expandedPrepId ? 'انقر مرة أخرى لإغلاق التفاصيل' : 'انقر على الصف للتوسيع'}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-right min-w-[200px]">صنف التجهيز / التحضير</th>
                  <th className="p-2.5 text-center w-24">كود الوصفة</th>
                  <th className="p-2.5 text-center w-28">حجم الباتش المعياري</th>
                  <th className="p-2.5 text-center w-28">الطلب المتوقع للوجبات</th>
                  <th className="p-2.5 text-center w-28 bg-purple-950 text-purple-300 font-bold">الباتشات المطلوب إنتاجها</th>
                  <th className="p-2.5 text-center w-28">الإنتاج الفعلي المتوقع</th>
                  <th className="p-2.5 text-center w-28">تكلفة الباتشات</th>
                  <th className="p-2.5 text-center w-16">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {prepPlan.map((p, idx) => {
                  const isExpanded = expandedPrepId === p.id;
                  let displayDemand = `${nf(p.directDemand, 0)} جم`;
                  let displayOutput = `${nf(p.expectedOutput, 0)} جم`;
                  if (p.directDemand >= 1000) {
                    displayDemand = `${(p.directDemand / 1000).toFixed(2)} كجم`;
                  }
                  if (p.expectedOutput >= 1000) {
                    displayOutput = `${(p.expectedOutput / 1000).toFixed(2)} كجم`;
                  }

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        onClick={() => setExpandedPrepId(isExpanded ? null : p.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-l-4 border-l-purple-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 text-right">
                          <div className="flex items-center gap-2">
                            <span>{p.prepItem.name}</span>
                            {p.prepItem.name.includes('كينوا') && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded font-semibold">
                                60 جم/سلطة
                              </span>
                            )}
                            {p.prepItem.name.includes('كاساديا') && p.prepItem.name.includes('تتبيل') && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 rounded font-semibold">
                                15 جم كاساديا + شاورما
                              </span>
                            )}
                          </div>
                          {p.recipe && (
                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                              {p.recipe.name}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {p.prepItem.recipeCode}
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {p.prepItem.batchSize >= 1000 ? `${(p.prepItem.batchSize / 1000).toFixed(1)} كجم` : `${nf(p.prepItem.batchSize)} جم`}
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold text-slate-900 dark:text-white">
                          {displayDemand}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 text-sm">
                          {nf(p.suggestedBatches, 1)}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {displayOutput}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {money(p.batchCost)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            aria-label="Toggle prep recipe details"
                            className="p-1 rounded-lg text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED RECIPE QUANTITIES & LINKED SALES DISHES */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-900/60">
                          <td colSpan={9} className="p-4 border-t border-purple-100 dark:border-purple-900/40">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* 1. Recipe Ingredients & Quantities to Prep */}
                              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <UtensilsCrossed className="w-4 h-4 text-purple-600" />
                                    <span>مقادير وخامات الوصفة للتحضير (Recipe Breakdown)</span>
                                  </div>
                                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                    {nf(p.suggestedBatches, 1)} باتش معتمد
                                  </span>
                                </div>

                                {p.subIngredients.length === 0 ? (
                                  <p className="text-xs text-slate-400 py-2 text-center">
                                    لا توجد تفاصيل خامات مسجلة لهذه الوصفة
                                  </p>
                                ) : (
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                        <th className="pb-1.5 text-right font-medium">الخامة</th>
                                        <th className="pb-1.5 text-center font-medium">معيار الباتش</th>
                                        <th className="pb-1.5 text-center font-bold text-purple-600 dark:text-purple-400">إجمالي المطلوب للتحضير</th>
                                        <th className="pb-1.5 text-center font-medium">السعر</th>
                                        <th className="pb-1.5 text-left font-medium">التكلفة</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                      {p.subIngredients.map((si, sIdx) => (
                                        <tr key={sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                          <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            {si.ing?.name || 'خامة'}
                                          </td>
                                          <td className="py-1.5 text-center text-slate-500">
                                            {nf(si.qtyPerBatch, 2)} {si.ing?.unit || 'وحدة'}
                                          </td>
                                          <td className="py-1.5 text-center font-bold text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30">
                                            {nf(si.totalQtyNeeded, 2)} {si.ing?.unit || 'وحدة'}
                                          </td>
                                          <td className="py-1.5 text-center font-mono text-slate-500">
                                            {money(si.ing?.price || 0)}
                                          </td>
                                          <td className="py-1.5 text-left font-mono font-semibold text-slate-800 dark:text-slate-200">
                                            {money(si.totalCost)}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr className="font-bold border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40">
                                        <td colSpan={4} className="py-1.5 text-right text-slate-700 dark:text-slate-200">
                                          إجمالي تكلفة خامات التحضير
                                        </td>
                                        <td className="py-1.5 text-left font-mono text-purple-600 dark:text-purple-400">
                                          {money(p.batchCost)}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                )}
                              </div>

                              {/* 2. Linked Sold Dishes Driving this Prep Item Demand */}
                              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                    <span>الأصناف المباعة المرتبطة بالطلب (Linked Sold Dishes)</span>
                                  </div>
                                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {p.linkedDishes.length} أصناف مباعة
                                  </span>
                                </div>

                                {p.linkedDishes.length === 0 ? (
                                  <div className="text-center py-4 text-slate-400 text-xs">
                                    لا توجد مبيعات متوقعة مرتبطة مباشرة بهذا الصنف حالياً
                                  </div>
                                ) : (
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                        <th className="pb-1.5 text-right font-medium">الوجبة المباعة</th>
                                        <th className="pb-1.5 text-center font-medium">المبيعات المتوقعة</th>
                                        <th className="pb-1.5 text-center font-medium">المعيار بالوجبة</th>
                                        <th className="pb-1.5 text-left font-bold text-emerald-600 dark:text-emerald-400">إجمالي الطلب</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                      {p.linkedDishes.map((ld, lIdx) => (
                                        <tr key={lIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                          <td className="py-1.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {ld.name}
                                            <span className="block text-[10px] text-slate-400 font-mono">
                                              {ld.code} | {ld.group}
                                            </span>
                                          </td>
                                          <td className="py-1.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                                            {nf(ld.qty, 0)} وجبة
                                          </td>
                                          <td className="py-1.5 text-center font-mono text-slate-600 dark:text-slate-400">
                                            {ld.portionStd >= 1 ? `${nf(ld.portionStd, 0)} جم` : `${(ld.portionStd * 1000).toFixed(0)} جم`}
                                          </td>
                                          <td className="py-1.5 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {ld.totalDemand >= 1000 ? `${(ld.totalDemand / 1000).toFixed(2)} كجم` : `${nf(ld.totalDemand, 0)} جم`}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SALES MIX BREAKDOWN & QUANTITIES */}
      {activeSubView === 'sales_mix' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                تحليل المزيج البيعي والكميات المتوقعة للوجبات (Product Sales Mix Breakdown)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                توزيع مبلغ المستهدف ({money(targetRevenue, 0)} ج.م) على كافة الأصناف الـ 53 مع إمكانية التعديل اليدوي
              </p>
            </div>

            {Object.keys(qtyOverrides).length > 0 && (
              <button
                onClick={() => setQtyOverrides({})}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
              >
                إلغاء التعديلات اليدوية واستعادة التوزيع التلقائي
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-center w-20">كود SKU</th>
                  <th className="p-2.5 text-right min-w-[200px]">الصنف / الوجبة</th>
                  <th className="p-2.5 text-center w-28">المجموعة</th>
                  <th className="p-2.5 text-center w-24">الوزن النسبي %</th>
                  <th className="p-2.5 text-center w-24">سعر البيع</th>
                  <th className="p-2.5 text-center w-28 bg-blue-950 text-blue-300 font-bold">الكمية المتوقعة</th>
                  <th className="p-2.5 text-center w-28">إجمالي الإيراد</th>
                  <th className="p-2.5 text-center w-24">تكلفة الوجبة</th>
                  <th className="p-2.5 text-center w-24">Food Cost %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {forecastedSales.map((row, idx) => {
                  return (
                    <tr key={row.item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {row.item.code}
                      </td>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200 text-right">
                        {row.item.name}
                      </td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {row.item.group}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {row.salesMixPct.toFixed(2)}%
                      </td>
                      <td className="p-2 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {money(row.item.price)}
                      </td>
                      <td className="p-2 text-center bg-blue-50/40 dark:bg-blue-950/20">
                        <input
                          type="number"
                          min="0"
                          value={row.effectiveQty}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setQtyOverrides(prev => ({ ...prev, [row.item.id]: val }));
                          }}
                          className="w-16 text-center font-bold text-sm bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg py-0.5 dark:text-white"
                        />
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {money(row.effectiveRev)}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">
                        {money(row.unitCost)}
                      </td>
                      <td className="p-2 text-center font-mono font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.foodCostPct <= 35
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          {row.foodCostPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
