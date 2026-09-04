import React, { useState } from 'react';
import { AppState, Language, Ingredient } from '../types';
import { TRANSLATIONS } from '../translations';
import { exportLedgerExcel } from '../utils/excel';
import { nf } from '../utils/calculations';
import { ClipboardList, FileSpreadsheet, Trash2, Search } from 'lucide-react';

interface LedgerTabProps {
  state: AppState;
  currentLang: Language;
  canEdit: boolean;
  onDeleteTransaction: (id: string) => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  state,
  currentLang,
  canEdit,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const ingMap = new Map<string, Ingredient>(state.ing.map(g => [g.id, g]));

  const inPeriodTransactions = state.ledger.filter(tx => {
    return tx.date >= state.dFrom && tx.date <= state.dTo;
  });

  const filtered = inPeriodTransactions.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const g = ingMap.get(tx.ingredientId);
    return (
      tx.id.toLowerCase().includes(term) ||
      tx.reference.toLowerCase().includes(term) ||
      tx.user.toLowerCase().includes(term) ||
      (g && g.name.toLowerCase().includes(term)) ||
      tx.ingredientId.toLowerCase().includes(term)
    );
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recv': return { label: t('move_recv'), bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
      case 'tin': return { label: t('move_tin'), bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
      case 'tout': return { label: t('move_tout'), bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' };
      case 'waste': return { label: t('move_waste'), bg: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
      case 'production_in': return { label: t('move_production_in'), bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' };
      case 'production_consume': return { label: t('move_production_consume'), bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
      default: return { label: type, bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_ledger")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {inPeriodTransactions.length} {t("period_tx_count")} ({state.dFrom} → {state.dTo})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white"
            >
              <option value="all">كل الأنواع</option>
              <option value="recv">{t("move_recv")}</option>
              <option value="tin">{t("move_tin")}</option>
              <option value="tout">{t("move_tout")}</option>
              <option value="waste">{t("move_waste")}</option>
              <option value="production_in">{t("move_production_in")}</option>
              <option value="production_consume">{t("move_production_consume")}</option>
            </select>

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

            <button
              onClick={() => exportLedgerExcel(state)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-24">{t("col_date")}</th>
                <th className="p-2.5 text-center w-28">{t("col_tx_id")}</th>
                <th className="p-2.5 text-center w-28">{t("col_type")}</th>
                <th className="p-2.5 text-right min-w-[180px]">{t("col_name")}</th>
                <th className="p-2.5 text-center w-20">{t("col_qty")}</th>
                <th className="p-2.5 text-center w-16">{t("col_unit")}</th>
                <th className="p-2.5 text-center w-24">{t("col_ref")}</th>
                <th className="p-2.5 text-center w-20">{t("col_user")}</th>
                {canEdit && <th className="p-2.5 text-center w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="p-8 text-center text-slate-400">
                    لا توجد حركات مخزون مسجلة في هذه الفترة
                  </td>
                </tr>
              ) : (
                filtered.map(tx => {
                  const g = ingMap.get(tx.ingredientId);
                  const typeBadge = getTypeLabel(tx.type);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-2 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                        {tx.date}
                      </td>
                      <td className="p-2 text-center font-mono text-[10px] text-slate-400">
                        {tx.id}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeBadge.bg}`}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="p-2 font-medium text-slate-800 dark:text-slate-200 text-right">
                        {g?.name || tx.ingredientId}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900 dark:text-white">
                        {nf(tx.qty)}
                      </td>
                      <td className="p-2 text-center text-slate-500 font-medium">
                        {tx.unit || g?.unit || ''}
                      </td>
                      <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                        {tx.reference || '—'}
                      </td>
                      <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {tx.user}
                      </td>
                      {canEdit && (
                        <td className="p-2 text-center">
                          <button
                            onClick={() => {
                              if (confirm(t("confirm_delete"))) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title={t("btn_delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
