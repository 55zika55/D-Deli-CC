import React, { useState } from 'react';
import { AppState, Recipe, Language, Ingredient } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, nf, money, getRecipeUnitCost, getRecipeAvgSellingPrice } from '../utils/calculations';
import { exportRecipesExcel, exportSingleRecipeExcel } from '../utils/excel';
import { RecipeCalculatorModal } from './RecipeCalculatorModal';
import { 
  BookOpen, 
  Printer, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Sparkles
} from 'lucide-react';

interface RecipesTabProps {
  state: AppState;
  currentLang: Language;
  canEdit: boolean;
  onAddRecipe: () => void;
  onDeleteRecipe: (index: number) => void;
  onUpdateRecipeName: (recipeIndex: number, name: string) => void;
  onAddRecipeItem: (recipeIndex: number) => void;
  onDeleteRecipeItem: (recipeIndex: number, itemIndex: number) => void;
  onUpdateRecipeItem: (recipeIndex: number, itemIndex: number, field: 'ingredientId' | 'std', value: string | number) => void;
  onPrintRecipe: (recipeIndex: number) => void;
  onPrintAllRecipes: () => void;
}

export const RecipesTab: React.FC<RecipesTabProps> = ({
  state,
  currentLang,
  canEdit,
  onAddRecipe,
  onDeleteRecipe,
  onUpdateRecipeName,
  onAddRecipeItem,
  onDeleteRecipeItem,
  onUpdateRecipeItem,
  onPrintRecipe,
  onPrintAllRecipes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecipeIndex, setExpandedRecipeIndex] = useState<number | null>(0);
  const [calculatorRecipe, setCalculatorRecipe] = useState<Recipe | null>(null);
  const [customSellingPrices, setCustomSellingPrices] = useState<Record<string, number>>({});
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const isAr = currentLang === 'ar';

  // Recipe sold quantities from sales
  const recipeSalesCount: Record<string, number> = {};
  state.sales.forEach(s => {
    if (s.recipeId) {
      recipeSalesCount[s.recipeId] = (recipeSalesCount[s.recipeId] || 0) + num(s.qty);
    }
  });

  const ingMap = new Map<string, Ingredient>(state.ing.map(g => [g.id, g]));

  const filteredRecipes = state.recipes.map((r, originalIndex) => ({ r, originalIndex })).filter(({ r }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.code.toLowerCase().includes(term) || r.name.toLowerCase().includes(term) || r.id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t("tab_recipes")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {state.recipes.length} {t("total_recipes")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t("btn_search_placeholder")}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {canEdit && (
            <button
              onClick={onAddRecipe}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("btn_add_recipe")}</span>
            </button>
          )}

          <button
            onClick={() => exportRecipesExcel(state, currentLang)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            title="Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={onPrintAllRecipes}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            title={t("btn_print_all")}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t("btn_print_all")}</span>
          </button>
        </div>
      </div>

      {/* Recipes Master Table */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl mb-4">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 text-center w-28">{t("recipe_id")}</th>
                <th className="p-2.5 text-center w-24">{t("recipe_code")}</th>
                <th className="p-2.5 text-right min-w-[240px]">{t("col_name")}</th>
                <th className="p-2.5 text-center w-20">{t("col_ingredients_count")}</th>
                <th className="p-2.5 text-center w-20">{t("col_sold_qty")}</th>
                <th className="p-2.5 text-center w-24">{t("col_unit_cost")}</th>
                <th className="p-2.5 text-center w-24">{t("kpi_food_cost_pct")}</th>
                <th className="p-2.5 text-center w-36">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filteredRecipes.map(({ r, originalIndex }, idx) => {
                const cost = getRecipeUnitCost(r, state.ing);
                const defaultSellPrice = getRecipeAvgSellingPrice(r.id, state.sales);
                const currentSellPrice = customSellingPrices[r.id] !== undefined ? customSellingPrices[r.id] : defaultSellPrice;
                const fc = currentSellPrice > 0 ? (cost / currentSellPrice) * 100 : 0;
                const sold = recipeSalesCount[r.id] || 0;
                const isExpanded = expandedRecipeIndex === originalIndex;

                return (
                  <tr 
                    key={r.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                    onClick={() => setExpandedRecipeIndex(isExpanded ? null : originalIndex)}
                  >
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2 text-center font-mono text-[10px] text-slate-400">{r.id}</td>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">{r.code}</td>
                    <td className="p-2">
                      <input
                        disabled={!canEdit}
                        type="text"
                        value={r.name}
                        onClick={e => e.stopPropagation()}
                        onChange={e => onUpdateRecipeName(originalIndex, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium text-right text-xs"
                      />
                    </td>
                    <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                      {r.items.length}
                    </td>
                    <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-200">
                      {nf(sold, 0)}
                    </td>
                    <td className="p-2 text-center font-bold text-slate-900 dark:text-white font-mono">
                      {money(cost)}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold font-mono ${
                        fc > 35 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : fc > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {fc > 0 ? `${fc.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setCalculatorRecipe(r)}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                          title={isAr ? 'حاسبة التكلفة وهامش الربح' : 'Cost & Margin Calculator'}
                        >
                          <Calculator className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isAr ? 'حاسبة' : 'Calc'}</span>
                        </button>
                        <button
                          onClick={() => onPrintRecipe(originalIndex)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition"
                          title={t("btn_print_pdf")}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportSingleRecipeExcel(originalIndex, state)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition"
                          title="Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => onDeleteRecipe(originalIndex)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                            title={t("btn_delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedRecipeIndex(isExpanded ? null : originalIndex)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Recipe BOM Inspector & Inline Profit Calculator */}
        {expandedRecipeIndex !== null && state.recipes[expandedRecipeIndex] && (
          <div className="border-2 border-blue-500/30 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/40 animate-in fade-in duration-200">
            {(() => {
              const selectedRecipe = state.recipes[expandedRecipeIndex];
              const totalCost = getRecipeUnitCost(selectedRecipe, state.ing);
              const defaultSellPrice = getRecipeAvgSellingPrice(selectedRecipe.id, state.sales);
              const sellPrice = customSellingPrices[selectedRecipe.id] !== undefined ? customSellingPrices[selectedRecipe.id] : defaultSellPrice;
              
              // Calculations for profit & food cost
              const foodCostPct = sellPrice > 0 ? (totalCost / sellPrice) * 100 : 0;
              const grossProfitVal = sellPrice > 0 ? sellPrice - totalCost : 0;
              const grossProfitPct = sellPrice > 0 ? (grossProfitVal / sellPrice) * 100 : 0;

              return (
                <div className="space-y-4">
                  {/* Recipe Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs">
                        {selectedRecipe.code}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {selectedRecipe.name}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        ({selectedRecipe.id})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCalculatorRecipe(selectedRecipe)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                      >
                        <Calculator className="w-4 h-4" />
                        <span>{isAr ? 'فتح الحاسبة التفصيلية المتكاملة 🧮' : 'Open Detailed Calculator'}</span>
                      </button>
                      
                      <button
                        onClick={() => onPrintRecipe(expandedRecipeIndex)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t("btn_print_pdf")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Recipe Cost & Profit Margin Calculator Strip */}
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        {isAr ? 'حاسبة تكلفة الوصفة وتحديد هامش الربح السريع:' : 'Recipe Cost & Profit Margin Calculator:'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'قم بتعديل سعر البيع لرؤية هامش الربح ونسبة تكلفة الطعام فوراً' : 'Adjust selling price to test margins'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      
                      {/* Ingredient Cost */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-slate-500 font-semibold mb-1">{isAr ? 'تكلفة المكونات (Cost):' : 'Dish Cost:'}</div>
                        <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                          {money(totalCost)} <span className="text-[10px] text-slate-400">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </div>

                      {/* Selling Price Input */}
                      <div className="bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60">
                        <label className="block text-blue-700 dark:text-blue-300 font-bold mb-1">
                          {isAr ? 'سعر البيع المقترح ✏️:' : 'Selling Price ✏️:'}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={sellPrice || ''}
                            placeholder="0.00"
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setCustomSellingPrices(prev => ({ ...prev, [selectedRecipe.id]: val }));
                            }}
                            className="w-full px-2 py-0.5 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg font-mono font-bold text-sm text-blue-700 dark:text-blue-300 focus:outline-none"
                          />
                          <span className="text-slate-500 font-bold text-[10px]">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </div>

                      {/* Gross Profit Amount */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-slate-500 font-semibold mb-1">{isAr ? 'هامش الربح (المبلغ):' : 'Gross Margin ($):'}</div>
                        <div className={`text-base font-black font-mono ${grossProfitVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                          {money(grossProfitVal)} <span className="text-[10px] text-slate-400">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </div>

                      {/* Food Cost % and Profit % */}
                      <div className={`p-2.5 rounded-xl border ${
                        foodCostPct > 35 
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300' 
                          : foodCostPct > 0 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                        <div className="font-semibold mb-0.5 text-[11px] flex items-center justify-between">
                          <span>{isAr ? 'Food Cost %:' : 'Food Cost %:'}</span>
                          <span className="font-bold">{foodCostPct > 0 ? `${foodCostPct.toFixed(1)}%` : '—'}</span>
                        </div>
                        <div className="font-semibold text-[11px] flex items-center justify-between">
                          <span>{isAr ? 'هامش الربح %:' : 'Profit Margin:'}</span>
                          <span className="font-black">{grossProfitPct > 0 ? `${grossProfitPct.toFixed(1)}%` : '0%'}</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Recipe Ingredients Items Table */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="p-2.5 text-center w-8">#</th>
                          <th className="p-2.5 text-right">{t("col_name")}</th>
                          <th className="p-2.5 text-center">ID</th>
                          <th className="p-2.5 text-center">{t("col_unit")}</th>
                          <th className="p-2.5 text-center">{t("col_qty")} (Standard)</th>
                          <th className="p-2.5 text-center">{t("col_price")}</th>
                          <th className="p-2.5 text-center">{t("col_cost")}</th>
                          <th className="p-2.5 text-center">{isAr ? 'نسبة من التكلفة' : 'Cost Share'}</th>
                          {canEdit && <th className="p-2.5 text-center w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {selectedRecipe.items.map((it, itemIdx) => {
                          const g = ingMap.get(it.ingredientId);
                          const p = g?.price || 0;
                          const itemCost = num(it.std) * p;
                          const itemShare = totalCost > 0 ? (itemCost / totalCost) * 100 : 0;

                          return (
                            <tr key={itemIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="p-2 text-center font-bold text-slate-400">{itemIdx + 1}</td>
                              <td className="p-2">
                                <select
                                  disabled={!canEdit}
                                  value={it.ingredientId}
                                  onChange={e => onUpdateRecipeItem(expandedRecipeIndex, itemIdx, 'ingredientId', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-xs font-semibold"
                                >
                                  {state.ing.map((ing, ingIdx) => (
                                    <option key={`${ing.id}-${ingIdx}`} value={ing.id}>
                                      {ing.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2 text-center font-mono text-[10px] text-slate-400">{it.ingredientId}</td>
                              <td className="p-2 text-center text-slate-600 dark:text-slate-300 font-medium">{g?.unit || ''}</td>
                              <td className="p-2 text-center">
                                <input
                                  disabled={!canEdit}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={it.std}
                                  onChange={e => onUpdateRecipeItem(expandedRecipeIndex, itemIdx, 'std', num(e.target.value))}
                                  className="w-20 text-center px-1 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 font-bold font-mono"
                                />
                              </td>
                              <td className="p-2 text-center text-slate-500 font-mono">{money(p, 4)}</td>
                              <td className="p-2 text-center font-bold text-slate-900 dark:text-white font-mono">{money(itemCost)}</td>
                              <td className="p-2 text-center font-mono text-slate-500">
                                {itemShare.toFixed(1)}%
                              </td>
                              {canEdit && (
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => onDeleteRecipeItem(expandedRecipeIndex, itemIdx)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title={t("btn_delete")}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-900 text-white font-bold">
                        <tr>
                          <td colSpan={6} className="p-2.5 text-left">{t("col_cost")}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-400 text-sm font-mono">
                            {money(totalCost)}
                          </td>
                          <td className="p-2.5 text-center text-slate-300">100%</td>
                          {canEdit && (
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => onAddRecipeItem(expandedRecipeIndex)}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded font-semibold text-xs"
                                title={t("btn_add_item")}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Recipe Calculator Modal */}
      <RecipeCalculatorModal
        isOpen={calculatorRecipe !== null}
        onClose={() => setCalculatorRecipe(null)}
        recipe={calculatorRecipe}
        state={state}
        currentLang={currentLang}
        onUpdateRecipeItem={onUpdateRecipeItem}
      />
    </div>
  );
};
