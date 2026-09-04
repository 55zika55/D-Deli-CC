import React, { useState } from 'react';
import { AppState, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { ShieldCheck, Search, Trash2, Activity } from 'lucide-react';

interface AuditTabProps {
  state: AppState;
  currentLang: Language;
  canManage: boolean;
  onClearAudit: () => void;
  onOpenDiagnostics?: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  state,
  currentLang,
  canManage,
  onClearAudit,
  onOpenDiagnostics
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const logs = ((state.audit || (state as any).auditLogs || []) as any[]).slice().reverse();

  const filtered = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const timeStr = (log.at || log.timestamp || '').toLowerCase();
    return (
      log.user.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      timeStr.includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("tab_audit")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                سجل تدقيق وتتبع العمليات وتعديلات البيانات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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

            {onOpenDiagnostics && (
              <button
                onClick={onOpenDiagnostics}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>فحص النزاهة والتشخيص</span>
              </button>
            )}

            {canManage && (
              <button
                onClick={() => {
                  if (confirm("هل تريد تفريغ سجل التدقيق؟")) {
                    onClearAudit();
                  }
                }}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ السجل</span>
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-36">التوقيت</th>
                <th className="p-2.5 text-center w-28">{t("col_user")}</th>
                <th className="p-2.5 text-center w-36">الإجراء</th>
                <th className="p-2.5 text-right min-w-[280px]">التفاصيل والبيانات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    لا توجد أحداث مسجلة في سجل التدقيق
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                      {log.at || log.timestamp}
                    </td>
                    <td className="p-2 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {log.user}
                    </td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300 font-mono text-xs text-right">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
