import React, { useState } from 'react';
import { AppState, ComputedMetrics, Language, PrepItem, Ingredient, Recipe } from '../types';
import { TRANSLATIONS } from '../translations';
import { PREP_ITEMS } from '../initialData';
import { num, nf, money } from '../utils/calculations';
import {
  Factory,
  CheckCircle2,
  Play,
  X,
  Calendar,
  Package,
  Layers,
  ArrowDownRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  ShoppingCart,
  Info
} from 'lucide-react';

interface PrepTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onPostProduction: (item: PrepItem, batches: number, date: string) => void;
}

export const PrepTab: React.FC<PrepTabProps> = ({
  state,
  metrics,
  currentLang,
  canEdit,
  onPostProduction
}) => {
  const [prodDate, setProdDate] = useState(state.dTo);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<{
    item: PrepItem;
    batches: number;
  } | null>(null);
  const [expandedPrepRow, setExpandedPrepRow] = useState<string | null>(null);

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const ingMap = new Map<string, Ingredient>(state.ing.map(g => [g.name, g]));
  const idIngMap = new Map<string, Ingredient>(state.ing.map(g => [g.id, g]));
  const recipeMap = new Map<string, Recipe>(state.recipes.map(r => [r.code, r]));

  const findIngAndDemand = (prepName: string) => {
    let g = ingMap.get(prepName);
    if (!g) {
      if (prepName.includes('عجين بيتزا')) g = ingMap.get('عجين بيتزا مخمر جاهز') || ingMap.get('بورشن عجين بيتزا');
      else if (prepName.includes('صلصه طماطم')) g = ingMap.get('صلصه طماطم بيتزا') || ingMap.get('صلصه طماطم');
      else if (prepName.includes('كينوا')) g = ingMap.get('صوص ليمون الكينوا سالاد');
      else if (prepName.includes('كاساديا') && prepName.includes('تتبيل')) g = ingMap.get('تتبيله بعد التسوية دجاج كاساديا') || ingMap.get('تتبيله بعد التسويه دجاج كاساديا') || ingMap.get('تتبيله مع التسويه دجاج كاساديا');
    }
    const gIndex = g ? state.ing.findIndex(x => x.id === g.id) : -1;
    let rawDemand = gIndex >= 0 ? (metrics.raw[gIndex] || 0) : 0;
    
    // Sum any related alias demand
    if (prepName.includes('عجين بيتزا')) {
      const altIdx = state.ing.findIndex(x => x.name === 'بورشن عجين بيتزا');
      if (altIdx >= 0 && altIdx !== gIndex) rawDemand += (metrics.raw[altIdx] || 0);
    } else if (prepName.includes('صلصه طماطم')) {
      const altIdx = state.ing.findIndex(x => x.name === 'صلصه طماطم');
      if (altIdx >= 0 && altIdx !== gIndex) rawDemand += (metrics.raw[altIdx] || 0);
    } else if (prepName.includes('كاساديا') && prepName.includes('تتبيل')) {
      const altIdx1 = state.ing.findIndex(x => x.name === 'تتبيله بعد التسويه دجاج كاساديا');
      const altIdx2 = state.ing.findIndex(x => x.name === 'تتبيله مع التسويه دجاج كاساديا');
      if (altIdx1 >= 0 && altIdx1 !== gIndex) rawDemand += (metrics.raw[altIdx1] || 0);
      if (altIdx2 >= 0 && altIdx2 !== gIndex) rawDemand += (metrics.raw[altIdx2] || 0);
    }
    return { g, rawDemand };
  };

  const getPrepDetails = (p: PrepItem, batches: number) => {
    const recipe = recipeMap.get(p.recipeCode);
    const subIngredients = recipe ? recipe.items.map(it => {
      const subIng = idIngMap.get(it.ingredientId);
      const qtyPerBatch = num(it.std);
      const totalQtyNeeded = qtyPerBatch * batches;
      const totalCost = totalQtyNeeded * (subIng ? num(subIng.price) : 0);
      return {
        ing: subIng,
        qtyPerBatch,
        totalQtyNeeded,
        totalCost
      };
    }) : [];

    const batchCost = subIngredients.reduce((sum, si) => sum + si.totalCost, 0);

    const linkedDishes: {
      code: string;
      name: string;
      group: string;
      qty: number;
      portionStd: number;
      totalDemand: number;
    }[] = [];

    const { g } = findIngAndDemand(p.name);
    state.sales.forEach(s => {
      const q = num(s.qty);
      if (q <= 0) return;
      const r = state.recipes.find(rc => rc.id === s.recipeId || rc.code === s.code);
      if (!r) return;
      r.items.forEach(it => {
        let isMatch = false;
        if (g && it.ingredientId === g.id) isMatch = true;
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
            code: s.code,
            name: s.name,
            group: s.group || 'عام',
            qty: q,
            portionStd: num(it.std),
            totalDemand: q * num(it.std)
          });
        }
      });
    });

    return { recipe, subIngredients, batchCost, linkedDishes };
  };

  const handleOpenModal = (p: PrepItem, calculatedBatches: number) => {
    if (!canEdit) return;
    const initialBatches = calculatedBatches > 0 ? calculatedBatches : 1;
    setActiveModalItem({
      item: p,
      batches: initialBatches
    });
  };

  const handleConfirmProduction = () => {
    if (!activeModalItem || !canEdit) return;
    const batches = Number(activeModalItem.batches);
    if (isNaN(batches) || batches <= 0) {
      alert("يرجى إدخال عدد باتشات صحيح أكبر من الصفر");
      return;
    }

    onPostProduction(activeModalItem.item, batches, prodDate);
    const itemName = activeModalItem.item.name;
    setActiveModalItem(null);
    setSuccessMsg(`✓ تم تسجيل إنتاج ${batches} باتش من (${itemName}) بنجاح وخصم المكونات من المخزون`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_prep")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("help_p5")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">تاريخ الترحيل:</span>
            <input
              type="date"
              value={prodDate}
              min={state.dFrom}
              max={state.dTo}
              onChange={e => setProdDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {successMsg && (
          <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Prep Items Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 text-right min-w-[200px]">{t("col_name")}</th>
                <th className="p-2.5 text-center w-24">{t("recipe_code")}</th>
                <th className="p-2.5 text-center w-28">{t("col_batch_yield")}</th>
                <th className="p-2.5 text-center w-28">{t("col_theo_demand")}</th>
                <th className="p-2.5 text-center w-24">{t("col_batch_count")}</th>
                <th className="p-2.5 text-center w-28">{t("col_real_output")}</th>
                <th className="p-2.5 text-center w-28">{t("col_actions")}</th>
                <th className="p-2.5 text-center w-14">الوصفة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {PREP_ITEMS.map((p, idx) => {
                const { g, rawDemand } = findIngAndDemand(p.name);
                const batches = rawDemand > 0 ? (state.roundUp ? Math.ceil(rawDemand / p.batchSize - 1e-9) : rawDemand / p.batchSize) : 0;
                const actualOutput = batches * p.batchSize;
                const recipe = recipeMap.get(p.recipeCode);
                const isExpanded = expandedPrepRow === p.recipeCode;
                const details = isExpanded ? getPrepDetails(p, batches > 0 ? batches : 1) : null;

                return (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() => setExpandedPrepRow(isExpanded ? null : p.recipeCode)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 text-right">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.name.includes('كينوا') && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded font-semibold">
                              60 جم/سلطة
                            </span>
                          )}
                          {p.name.includes('كاساديا') && p.name.includes('تتبيل') && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 rounded font-semibold">
                              15 جم كاساديا + شاورما
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {recipe ? recipe.name : ''}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.recipeCode}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {nf(p.batchSize, 0)} {g?.unit || 'جرام'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-900 dark:text-white">
                        {nf(rawDemand)} {g?.unit || 'جرام'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-purple-600 dark:text-purple-400 text-sm">
                        {nf(batches, 2)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {nf(actualOutput)} {g?.unit || 'جرام'}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          disabled={!canEdit}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(p, batches);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 mx-auto shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{t("btn_record_prod")}</span>
                        </button>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          aria-label="Toggle prep recipe details"
                          className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED RECIPE DETAILS */}
                    {isExpanded && details && (
                      <tr className="bg-slate-50/80 dark:bg-slate-900/60">
                        <td colSpan={9} className="p-4 border-t border-blue-100 dark:border-blue-900/40">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* 1. Recipe Ingredients */}
                            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                  <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                                  <span>مقادير وخامات الوصفة للتحضير بالمطبخ ({p.recipeCode})</span>
                                </div>
                                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                  {nf(batches > 0 ? batches : 1, 1)} باتش مطلوب
                                </span>
                              </div>

                              {details.subIngredients.length === 0 ? (
                                <p className="text-xs text-slate-400 py-2 text-center">
                                  لا توجد تفاصيل خامات مسجلة لهذه الوصفة
                                </p>
                              ) : (
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                      <th className="pb-1.5 text-right font-medium">الخامة</th>
                                      <th className="pb-1.5 text-center font-medium">معيار الباتش</th>
                                      <th className="pb-1.5 text-center font-bold text-blue-600 dark:text-blue-400">إجمالي المطلوب للتحضير</th>
                                      <th className="pb-1.5 text-center font-medium">السعر</th>
                                      <th className="pb-1.5 text-left font-medium">التكلفة</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {details.subIngredients.map((si, sIdx) => (
                                      <tr key={sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">
                                          {si.ing?.name || 'خامة'}
                                        </td>
                                        <td className="py-1.5 text-center text-slate-500">
                                          {nf(si.qtyPerBatch, 2)} {si.ing?.unit || 'وحدة'}
                                        </td>
                                        <td className="py-1.5 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
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
                                        إجمالي تكلفة الخامات المطلوبة للتحضير
                                      </td>
                                      <td className="py-1.5 text-left font-mono text-blue-600 dark:text-blue-400">
                                        {money(details.batchCost)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                            </div>

                            {/* 2. Linked Sold Dishes */}
                            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                  <span>الأصناف المباعة المرتبطة بالطلب (Linked Sold Dishes)</span>
                                </div>
                                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {details.linkedDishes.length} أصناف مباعة
                                </span>
                              </div>

                              {details.linkedDishes.length === 0 ? (
                                <div className="text-center py-4 text-slate-400 text-xs">
                                  لا توجد مبيعات مسجلة مرتبطة مباشرة بهذا الصنف المحضر
                                </div>
                              ) : (
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                      <th className="pb-1.5 text-right font-medium">الوجبة المباعة</th>
                                      <th className="pb-1.5 text-center font-medium">مبيعات أغسطس</th>
                                      <th className="pb-1.5 text-center font-medium">المعيار بالوجبة</th>
                                      <th className="pb-1.5 text-left font-bold text-emerald-600 dark:text-emerald-400">إجمالي الاستهلاك</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {details.linkedDishes.map((ld, lIdx) => (
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

      {/* Production Recording Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5" />
                <div>
                  <h4 className="font-bold text-sm">تسجيل تشغيل وإنتاج باتش</h4>
                  <p className="text-[11px] text-blue-100">{activeModalItem.item.name} ({activeModalItem.item.recipeCode})</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Info Card */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">حجم الباتش القياسي:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {nf(activeModalItem.item.batchSize, 0)} جرام
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">تاريخ الإنتاج:</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{prodDate}</span>
                  </div>
                </div>
              </div>

              {/* Batches Counter & Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  عدد الباتشات المراد إنتاجها:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(prev => prev ? { ...prev, batches: Math.max(0.5, Number((prev.batches - 1).toFixed(2))) } : null)}
                    className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-lg flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={activeModalItem.batches}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setActiveModalItem(prev => prev ? { ...prev, batches: isNaN(val) ? 0 : val } : null);
                    }}
                    className="flex-1 h-10 text-center font-bold text-lg bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-xl dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(prev => prev ? { ...prev, batches: Number((prev.batches + 1).toFixed(2)) } : null)}
                    className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-lg flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Summary Impact */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    <span>إجمالي الإنتاج الناتج (يضاف للمخزون):</span>
                  </span>
                  <span className="text-sm">{nf(activeModalItem.batches * activeModalItem.item.batchSize, 0)} جرام</span>
                </div>
              </div>

              {/* Components Consumption List */}
              {(() => {
                const recipe = recipeMap.get(activeModalItem.item.recipeCode);
                if (!recipe || !recipe.items || recipe.items.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <ArrowDownRight className="w-4 h-4 text-amber-600" />
                      <span>المكونات الخام التي ستخصم من المخزون:</span>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="p-2 text-right">المكون الخام</th>
                            <th className="p-2 text-center">لكل باتش</th>
                            <th className="p-2 text-center text-amber-600 dark:text-amber-400">إجمالي الخصم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {recipe.items.map((it, i) => {
                            const rawIng = state.ing.find(g => g.id === it.ingredientId || g.name === it.ing);
                            const unitStd = num(it.std);
                            const totalConsumed = unitStd * activeModalItem.batches;
                            return (
                              <tr key={i}>
                                <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                                  {rawIng ? rawIng.name : it.ing || it.ingredientId}
                                </td>
                                <td className="p-2 text-center text-slate-500">
                                  {nf(unitStd)} {rawIng?.unit || 'جرام'}
                                </td>
                                <td className="p-2 text-center font-bold text-amber-700 dark:text-amber-400">
                                  {nf(totalConsumed)} {rawIng?.unit || 'جرام'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmProduction}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد وتسجيل الإنتاج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

