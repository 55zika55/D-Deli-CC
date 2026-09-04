import React, { useState } from 'react';
import { AppState, ComputedMetrics, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, nf, money } from '../utils/calculations';
import { Scale, Search, FileSpreadsheet, ClipboardCheck, Printer } from 'lucide-react';
import { exportSummaryExcel } from '../utils/excel';
import { PhysicalInventoryModal } from './PhysicalInventoryModal';

interface SummaryTabProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  canEdit: boolean;
  onUpdateInventoryCount: (index: number, field: 'beg' | 'end', value: number) => void;
  onBatchUpdateEndCounts?: (newEndCounts: number[]) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  state,
  metrics,
  currentLang,
  canEdit,
  onUpdateInventoryCount,
  onBatchUpdateEndCounts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCountModal, setShowCountModal] = useState(false);
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const filtered = state.ing.map((g, originalIndex) => ({ g, originalIndex })).filter(({ g }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return g.name.toLowerCase().includes(term) || g.id.toLowerCase().includes(term);
  });

  const handleApplyBatchCounts = (newCounts: number[]) => {
    if (onBatchUpdateEndCounts) {
      onBatchUpdateEndCounts(newCounts);
    } else {
      newCounts.forEach((val, idx) => {
        onUpdateInventoryCount(idx, 'end', val);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_summary")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("help_p3")} • {t("help_p4")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
            <div className="relative flex-1 sm:w-52 min-w-[140px]">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t("btn_search_placeholder")}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={() => setShowCountModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition active:scale-95"
              title="فتح كشف وفورمة الجرد الفعلي الميداني للطباعة والإدخال السريع"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>📋 فورمة الجرد الفعلي</span>
            </button>

            <button
              onClick={() => exportSummaryExcel(state, metrics, currentLang)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2 text-center w-8">#</th>
                <th className="p-2 text-right min-w-[170px]">{t("col_name")}</th>
                <th className="p-2 text-center w-12">{t("col_unit")}</th>
                <th className="p-2 text-center w-20">{t("col_adj_ideal")}</th>
                <th className="p-2 text-center w-18">{t("col_beg")}</th>
                <th className="p-2 text-center w-16">{t("col_recv")}</th>
                <th className="p-2 text-center w-16">{t("col_tin")}</th>
                <th className="p-2 text-center w-16">{t("col_prod_in")}</th>
                <th className="p-2 text-center w-16">{t("col_tout")}</th>
                <th className="p-2 text-center w-16">{t("col_waste")}</th>
                <th className="p-2 text-center w-18">{t("col_prod_consume")}</th>
                <th className="p-2 text-center w-18">{t("col_end")}</th>
                <th className="p-2 text-center w-20">{t("col_actual")}</th>
                <th className="p-2 text-center w-20">{t("col_variance")}</th>
                <th className="p-2 text-center w-24">{t("col_variance_cost")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filtered.map(({ g, originalIndex }, idx) => {
                const adjVal = metrics.adj[originalIndex];
                const begVal = num(state.beg[originalIndex]);
                const recvVal = metrics.recv[originalIndex];
                const tinVal = metrics.tin[originalIndex];
                const prodInVal = metrics.production_in[originalIndex];
                const toutVal = metrics.tout[originalIndex];
                const wasteVal = metrics.waste[originalIndex];
                const prodConsumeVal = metrics.production_consume[originalIndex];
                const endVal = num(state.end[originalIndex]);
                const actVal = metrics.actual[originalIndex];
                const varVal = metrics.vari[originalIndex];
                const cvarVal = metrics.cvar[originalIndex];

                const isNegative = varVal < 0;

                return (
                  <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-1.5 text-center font-bold text-slate-400">{originalIndex + 1}</td>
                    <td className="p-1.5 font-medium text-slate-800 dark:text-slate-200 text-right">{g.name}</td>
                    <td className="p-1.5 text-center text-slate-500 font-semibold">{g.unit}</td>
                    <td className="p-1.5 text-center font-semibold text-blue-600 dark:text-blue-400">{nf(adjVal)}</td>
                    <td className="p-1 text-center">
                      <input
                        disabled={!canEdit}
                        type="number"
                        min="0"
                        value={state.beg[originalIndex] || ""}
                        onChange={e => onUpdateInventoryCount(originalIndex, 'beg', num(e.target.value))}
                        className="w-14 text-center px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-xs font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center text-slate-600 dark:text-slate-300">{recvVal > 0 ? nf(recvVal) : '—'}</td>
                    <td className="p-1.5 text-center text-slate-600 dark:text-slate-300">{tinVal > 0 ? nf(tinVal) : '—'}</td>
                    <td className="p-1.5 text-center text-purple-600 dark:text-purple-400 font-semibold">{prodInVal > 0 ? nf(prodInVal) : '—'}</td>
                    <td className="p-1.5 text-center text-slate-600 dark:text-slate-300">{toutVal > 0 ? nf(toutVal) : '—'}</td>
                    <td className="p-1.5 text-center text-red-500 font-semibold">{wasteVal > 0 ? nf(wasteVal) : '—'}</td>
                    <td className="p-1.5 text-center text-amber-600 font-semibold">{prodConsumeVal > 0 ? nf(prodConsumeVal) : '—'}</td>
                    <td className="p-1 text-center">
                      <input
                        disabled={!canEdit}
                        type="number"
                        min="0"
                        value={state.end[originalIndex] || ""}
                        onChange={e => onUpdateInventoryCount(originalIndex, 'end', num(e.target.value))}
                        className="w-14 text-center px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-xs font-bold"
                      />
                    </td>
                    <td className="p-1.5 text-center font-bold text-slate-900 dark:text-white">{nf(actVal)}</td>
                    <td className={`p-1.5 text-center font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {nf(varVal)}
                    </td>
                    <td className={`p-1.5 text-center font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {money(cvarVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10">
              <tr>
                <td colSpan={13} className="p-2 text-left">{t("col_total")}</td>
                <td className="p-2 text-center">{nf(metrics.vari.reduce((a, b) => a + b, 0))}</td>
                <td className={`p-2 text-center text-sm ${metrics.varCost < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {money(metrics.varCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Physical Inventory Count Sheet Modal */}
      {showCountModal && (
        <PhysicalInventoryModal
          state={state}
          metrics={metrics}
          currentLang={currentLang}
          canEdit={canEdit}
          onClose={() => setShowCountModal(false)}
          onApplyCounts={handleApplyBatchCounts}
        />
      )}
    </div>
  );
};
