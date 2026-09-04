import React, { useState } from 'react';
import { AppState, ComputedMetrics, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { CATEGORIES_NAMES } from '../initialData';
import { num, nf, money } from '../utils/calculations';
import { Calculator, Search } from 'lucide-react';

interface IdealTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onUpdateIngredient: (index: number, field: 'price' | 'yield', value: number) => void;
}

export const IdealTab: React.FC<IdealTabProps> = ({
  state,
  metrics,
  currentLang,
  canEdit,
  onUpdateIngredient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const filtered = state.ing.map((g, originalIndex) => ({ g, originalIndex })).filter(({ g }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return g.name.toLowerCase().includes(term) || g.id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_ideal")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("help_p2")}
              </p>
            </div>
          </div>

          <div className="relative flex-1 sm:w-64">
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

        {/* Theoretical Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 text-center w-24">ID</th>
                <th className="p-2.5 text-right min-w-[200px]">{t("col_name")}</th>
                <th className="p-2.5 text-center w-20">{t("col_unit")}</th>
                <th className="p-2.5 text-center w-24">{t("col_price")}</th>
                <th className="p-2.5 text-center w-24">{t("col_yield")}</th>
                <th className="p-2.5 text-center w-28">{t("col_raw_ideal")}</th>
                <th className="p-2.5 text-center w-28">{t("col_adj_ideal")}</th>
                <th className="p-2.5 text-center w-28">{t("col_cost")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filtered.map(({ g, originalIndex }, idx) => {
                const rawVal = metrics.raw[originalIndex];
                const adjVal = metrics.adj[originalIndex];
                const costVal = adjVal * num(g.price);

                return (
                  <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2 text-center font-mono text-[10px] text-slate-400">{g.id}</td>
                    <td className="p-2 font-medium text-slate-800 dark:text-slate-200 text-right">{g.name}</td>
                    <td className="p-2 text-center font-semibold text-slate-500">{g.unit}</td>
                    <td className="p-2 text-center">
                      <input
                        disabled={!canEdit}
                        type="number"
                        step="0.0001"
                        min="0"
                        value={g.price}
                        onChange={e => onUpdateIngredient(originalIndex, 'price', num(e.target.value))}
                        className="w-20 text-center px-1 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 font-bold text-xs"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        disabled={!canEdit}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={g.yield}
                        onChange={e => onUpdateIngredient(originalIndex, 'yield', Math.min(1, Math.max(0.01, num(e.target.value))))}
                        className="w-16 text-center px-1 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 font-bold text-xs"
                      />
                    </td>
                    <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300">{nf(rawVal)}</td>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{nf(adjVal)}</td>
                    <td className="p-2 text-center font-bold text-slate-900 dark:text-white">{money(costVal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10">
              <tr>
                <td colSpan={8} className="p-2.5 text-center">{t("col_total")}</td>
                <td className="p-2.5 text-center text-sm text-emerald-400">{money(metrics.idealCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
