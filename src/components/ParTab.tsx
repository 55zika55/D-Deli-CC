import React, { useState } from 'react';
import { AppState, ComputedMetrics, Language, MovementType } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, nf, money } from '../utils/calculations';
import { SuggestedOrderModal } from './SuggestedOrderModal';
import { ShoppingCart, Search, AlertCircle, Sparkles, Send, FileSpreadsheet } from 'lucide-react';

interface ParTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onUpdateParDays: (days: number) => void;
  onSendToReceiving?: (txs: Array<{
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }>) => void;
}

export const ParTab: React.FC<ParTabProps> = ({
  state,
  metrics,
  currentLang,
  canEdit,
  onUpdateParDays,
  onSendToReceiving
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestedOrderModal, setShowSuggestedOrderModal] = useState(false);
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const isAr = currentLang === 'ar';
  const avgFactor = metrics.days;

  // Calculate overall shortage stats for banner
  let totalDeficitCost = 0;
  let deficitItemsCount = 0;

  state.ing.forEach((g, idx) => {
    const avgDaily = metrics.adj[idx] / avgFactor;
    const currentStock = num(state.end[idx]);
    const parLevel = avgDaily * state.parDays;
    const suggestedBuy = Math.max(0, parLevel - currentStock);
    if (suggestedBuy > 0) {
      deficitItemsCount++;
      totalDeficitCost += suggestedBuy * num(g.price);
    }
  });

  const filtered = state.ing.map((g, originalIndex) => ({ g, originalIndex })).filter(({ g }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return g.name.toLowerCase().includes(term) || g.id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Top Banner with Suggested Order Quick Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg">
                {isAr ? '🛒 إدارة المشتريات وحد الأمان (Par Level & Re-Order)' : 'Par Level & Re-Order Management'}
              </h3>
              <span className="bg-yellow-400 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded-full">
                {state.parDays} {isAr ? 'أيام تغطية' : 'Days'}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              {deficitItemsCount > 0 
                ? (isAr 
                    ? `يوجد ${deficitItemsCount} صنف بحاجة للشراء والتوريد فوراً لتغطية حد الأمان بقيمة ${money(totalDeficitCost)} ج.م` 
                    : `${deficitItemsCount} items need re-ordering (${money(totalDeficitCost)} EGP)`)
                : (isAr ? 'جميع الأصناف والمخزون في الحدود الآمنة والمستهدفة' : 'All stock is within safe levels')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSuggestedOrderModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-900 rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>{isAr ? '⚡ توليد طلب شراء مقترح (Suggested Order)' : 'Generate Suggested Order'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_par")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                حساب حد الأمان للشراء والتوريد بناءً على الاستهلاك الفعلي للمطعم
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">أيام التغطية المستهدفة:</span>
              <input
                disabled={!canEdit}
                type="number"
                min="1"
                max="90"
                value={state.parDays}
                onChange={e => onUpdateParDays(Math.max(1, parseInt(e.target.value) || 7))}
                className="w-14 text-center px-1.5 py-0.5 rounded border border-blue-400 dark:border-blue-600 font-bold bg-white dark:bg-slate-800 dark:text-white"
              />
              <span className="text-slate-500">يوم</span>
            </div>

            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t("btn_search_placeholder")}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Par Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 text-right min-w-[200px]">{t("col_name")}</th>
                <th className="p-2.5 text-center w-16">{t("col_unit")}</th>
                <th className="p-2.5 text-center w-24">{t("col_daily_avg")}</th>
                <th className="p-2.5 text-center w-24">{t("col_curr_stock")}</th>
                <th className="p-2.5 text-center w-24">{t("col_coverage_days")}</th>
                <th className="p-2.5 text-center w-24">{t("col_par")}</th>
                <th className="p-2.5 text-center w-24">{t("col_suggested_buy")}</th>
                <th className="p-2.5 text-center w-28">{t("col_cost")}</th>
                <th className="p-2.5 text-center w-28">{t("col_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filtered.map(({ g, originalIndex }, idx) => {
                const avgDaily = metrics.adj[originalIndex] / avgFactor;
                const currentStock = num(state.end[originalIndex]);
                const daysCover = avgDaily > 0 ? currentStock / avgDaily : Infinity;
                const parLevel = avgDaily * state.parDays;
                const suggestedBuy = Math.max(0, parLevel - currentStock);
                const buyCost = suggestedBuy * num(g.price);

                let badge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {t("badge_safe_par")}
                  </span>
                );

                if (avgDaily > 0 && daysCover < state.parDays) {
                  badge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 animate-pulse">
                      {t("badge_urgent_buy")}
                    </span>
                  );
                } else if (avgDaily > 0 && daysCover < state.parDays * 1.5) {
                  badge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {t("badge_near_par")}
                    </span>
                  );
                }

                return (
                  <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-medium text-slate-800 dark:text-slate-200 text-right">{g.name}</td>
                    <td className="p-2 text-center text-slate-500 font-semibold">{g.unit}</td>
                    <td className="p-2 text-center text-slate-600 dark:text-slate-400 font-semibold">{nf(avgDaily)}</td>
                    <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-200">{nf(currentStock)}</td>
                    <td className="p-2 text-center font-mono font-bold">
                      {isFinite(daysCover) ? `${daysCover.toFixed(1)} يوم` : '—'}
                    </td>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{nf(parLevel)}</td>
                    <td className={`p-2 text-center font-bold ${suggestedBuy > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                      {suggestedBuy > 0 ? nf(suggestedBuy) : '0'}
                    </td>
                    <td className="p-2 text-center font-bold text-slate-900 dark:text-white">
                      {buyCost > 0 ? money(buyCost) : '0.00'}
                    </td>
                    <td className="p-2 text-center">{badge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggested Order Modal */}
      <SuggestedOrderModal
        isOpen={showSuggestedOrderModal}
        onClose={() => setShowSuggestedOrderModal(false)}
        state={state}
        metrics={metrics}
        currentLang={currentLang}
        canEdit={canEdit}
        onSendToReceiving={onSendToReceiving || (() => {})}
      />
    </div>
  );
};

