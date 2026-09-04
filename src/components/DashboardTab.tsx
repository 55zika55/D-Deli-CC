import React from 'react';
import { AppState, ComputedMetrics, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { CATEGORIES_NAMES, CATEGORIES_COLORS } from '../initialData';
import { nf, money } from '../utils/calculations';
import { MonthlyVarianceChart } from './MonthlyVarianceChart';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  AlertTriangle, 
  Archive, 
  Trash2, 
  Scale, 
  FileQuestion,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface DashboardTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  onSetPeriod: (from: string, to: string) => void;
  onOpenDiagnostics?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  state,
  metrics,
  currentLang,
  onSetPeriod,
  onOpenDiagnostics
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const isAr = currentLang === 'ar';
  const currency = state.settings.currency || (isAr ? 'ج.م' : 'EGP');

  const [fromInput, setFromInput] = React.useState(state.dFrom);
  const [toInput, setToInput] = React.useState(state.dTo);

  const handleApplyPeriod = () => {
    if (fromInput && toInput && fromInput <= toInput) {
      onSetPeriod(fromInput, toInput);
    } else {
      alert("يرجى اختيار تواريخ صحيحة للفترة");
    }
  };

  const rankedOverConsumptions = [...state.ing.keys()]
    .sort((a, b) => metrics.cvar[a] - metrics.cvar[b])
    .filter(i => metrics.vari[i] < 0)
    .slice(0, 10);

  // Category variance sums
  const catSums = CATEGORIES_NAMES.map((_, catIdx) => {
    let sum = 0;
    state.ing.forEach((g, i) => {
      if (g.cat === catIdx) sum += metrics.cvar[i];
    });
    return { name: CATEGORIES_NAMES[catIdx], sum, color: CATEGORIES_COLORS[catIdx] };
  });

  const maxAbsCat = Math.max(...catSums.map(c => Math.abs(c.sum)), 1);

  return (
    <div className="space-y-4">
      {/* Date Range Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{t("period")}:</span>
          </div>
          <input
            type="date"
            value={fromInput}
            onChange={e => setFromInput(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs dark:bg-slate-900 dark:text-white"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={toInput}
            onChange={e => setToInput(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs dark:bg-slate-900 dark:text-white"
          />
          <button
            onClick={handleApplyPeriod}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition"
          >
            {t("apply_period")}
          </button>
          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full font-bold">
            {metrics.days} {t("days_count")}
          </span>

          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg font-bold transition"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'فحص نزاهة البيانات' : 'Data Health Check'}</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t("period_hint")}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Sales Total */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_total_sales")}
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {money(metrics.salesTotal, 0)}
          </div>
          <div className="text-[10px] text-slate-400">{currency}</div>
        </div>

        {/* Theoretical Cost */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-indigo-600 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_ideal_cost")}
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {money(metrics.idealCost, 0)}
          </div>
          <div className="text-[10px] text-slate-400">{currency}</div>
        </div>

        {/* Food Cost % */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-emerald-600 mb-1">
            <Percent className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_food_cost_pct")}
          </div>
          <div className={`text-base sm:text-lg font-bold mt-1 px-2 py-0.5 rounded-lg inline-block ${
            metrics.foodCostPct > 35 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          }`}>
            {metrics.foodCostPct > 0 ? `${metrics.foodCostPct.toFixed(1)}%` : '—'}
          </div>
        </div>

        {/* Ending Stock Value */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-purple-600 mb-1">
            <Archive className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_stock_value")}
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {money(metrics.stockValue, 0)}
          </div>
          <div className="text-[10px] text-slate-400">{currency}</div>
        </div>

        {/* Waste Cost */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-red-500 mb-1">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_waste_cost")}
          </div>
          <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 mt-1">
            {money(metrics.wasteCost, 0)}
          </div>
          <div className="text-[10px] text-slate-400">{currency}</div>
        </div>

        {/* Cost Variance */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-amber-500 mb-1">
            <Scale className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_cost_variance")}
          </div>
          <div className={`text-base sm:text-lg font-bold mt-1 ${metrics.varCost < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {money(metrics.varCost, 0)}
          </div>
          <div className="text-[9px] text-slate-400">{t("kpi_variance_sub")}</div>
        </div>

        {/* Over Items Count */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_over_items")}
          </div>
          <div className={`text-base sm:text-lg font-bold mt-1 px-2 py-0.5 rounded-lg inline-block ${
            metrics.negCount > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          }`}>
            {metrics.negCount}
          </div>
        </div>

        {/* No Recipe Sales */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center text-orange-500 mb-1">
            <FileQuestion className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium min-h-[28px] flex items-center justify-center">
            {t("kpi_no_recipe")}
          </div>
          <div className={`text-base sm:text-lg font-bold mt-1 px-2 py-0.5 rounded-lg inline-block ${
            metrics.noRecipe > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
          }`}>
            {metrics.noRecipe}
          </div>
        </div>
      </div>

      {/* Monthly Food Cost & Variance Analysis Chart */}
      <MonthlyVarianceChart
        state={state}
        metrics={metrics}
        currentLang={currentLang}
      />

      {/* Two Column Layout: Top 10 Over-Consumption & Operational Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Over-Consumption Table */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{t("top_10_over")}</span>
            </h3>
            <span className="text-[11px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full font-bold">
              {metrics.days} {t("days_count")}
            </span>
          </div>

          <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white sticky top-0">
                <tr>
                  <th className="p-2 text-center w-8">#</th>
                  <th className="p-2 text-right">{t("col_name")}</th>
                  <th className="p-2 text-center">ID</th>
                  <th className="p-2 text-center">{t("col_variance")}</th>
                  <th className="p-2 text-center">{t("col_variance_cost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rankedOverConsumptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-emerald-600 font-semibold">
                      🎉 لا توجد فروقات استهلاك سالبة حاليًا!
                    </td>
                  </tr>
                ) : (
                  rankedOverConsumptions.map((idx, k) => {
                    const ing = state.ing[idx];
                    return (
                      <tr key={ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-2 text-center font-bold text-slate-500">{k + 1}</td>
                        <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{ing.name}</td>
                        <td className="p-2 text-center font-mono text-[10px] text-slate-400">{ing.id}</td>
                        <td className="p-2 text-center font-bold text-red-600 dark:text-red-400">
                          {nf(metrics.vari[idx])} {ing.unit}
                        </td>
                        <td className="p-2 text-center font-bold text-red-600 dark:text-red-400">
                          {money(metrics.cvar[idx])}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Statistics */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{t("operational_stats")}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{t("total_ingredients")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{state.ing.length} صنف</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{t("total_recipes")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{state.recipes.length} وصفة</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{t("period_tx_count")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{state.ledger.length} حركة مسجلة</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{t("period_prod_in")}</span>
                <span className="font-bold text-emerald-600">{nf(metrics.production_in.reduce((a, b) => a + b, 0))}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{t("period_prod_out")}</span>
                <span className="font-bold text-amber-600">{nf(metrics.production_consume.reduce((a, b) => a + b, 0))}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{t("period_days_label")}</span>
                <span className="font-bold text-blue-600">{metrics.days} يوم</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variance Cost by Category Visual Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-600" />
          <span>{t("cat_variance_cost")}</span>
        </h3>

        <div className="space-y-3">
          {catSums.map((cat, i) => {
            const pct = Math.max(4, Math.min(100, (Math.abs(cat.sum) / maxAbsCat) * 100));
            const isNegative = cat.sum < 0;
            return (
              <div key={i} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                  </div>
                  <span className={`font-bold ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                    {money(cat.sum)} {currency}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isNegative ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
