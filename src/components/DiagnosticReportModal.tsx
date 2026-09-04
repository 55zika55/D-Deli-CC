import React, { useState, useMemo } from 'react';
import { AppState, Language } from '../types';
import { 
  runSystemDiagnostics, 
  autoRepairDataIssues, 
  DiagnosticReport, 
  DiagnosticIssue 
} from '../utils/diagnostics';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle, 
  Wrench, 
  RefreshCw, 
  Cpu, 
  Database, 
  ShieldCheck, 
  FileText, 
  Download, 
  ArrowRight,
  Gauge,
  Clock,
  Sparkles
} from 'lucide-react';

interface DiagnosticReportModalProps {
  state: AppState;
  currentLang: Language;
  onClose: () => void;
  onApplyRepairs: (repairedState: AppState, logSummary: string[]) => void;
  onAudit: (action: string, details: string) => void;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  state,
  currentLang,
  onClose,
  onApplyRepairs,
  onAudit
}) => {
  const isAr = currentLang === 'ar';
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isFixing, setIsFixing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Generate Report
  const report: DiagnosticReport = useMemo(() => {
    return runSystemDiagnostics(state);
  }, [state]);

  const filteredIssues = useMemo(() => {
    if (activeCategory === 'all') return report.issues;
    return report.issues.filter(i => i.category === activeCategory);
  }, [report, activeCategory]);

  const handleRunAutoFix = (fixType?: string) => {
    setIsFixing(true);
    const fixesToApply = fixType 
      ? [fixType] 
      : report.issues.filter(i => i.autoFixable && i.fixType).map(i => i.fixType as string);

    setTimeout(() => {
      const { repairedState, repairedSummary } = autoRepairDataIssues(state, fixesToApply);
      onApplyRepairs(repairedState, repairedSummary);
      setIsFixing(false);
      const msg = isAr 
        ? `✓ تم تطبيق الإصلاحات بنجاح: ${repairedSummary.join(' | ') || 'تمت المزامنة'}`
        : `✓ Repairs applied successfully: ${repairedSummary.join(' | ')}`;
      setSuccessToast(msg);
      onAudit('system_auto_repair', `Applied automatic consistency fixes: ${fixesToApply.join(', ')}`);
      setTimeout(() => setSuccessToast(null), 4000);
    }, 200);
  };

  const handleExportReportJSON = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `D-Deli_Diagnostic_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onAudit('export_diagnostic_report', 'Exported full diagnostic & data validation report');
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (score >= 70) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 md:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold">
                  {isAr ? 'تقرير فحص النزاهة وتشخيص النظام' : 'System Diagnostic & Validation Report'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  v3.4 Audit Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr 
                  ? 'فحص شامل لاتساق دفتر الأستاذ، الأرصدة السالبة، ربط الوصفات وكفاءة الأداء'
                  : 'Deep scan for ledger integrity, negative balances, recipe links and performance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Toast Notification */}
          {successToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Health Score */}
            <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center ${getHealthColor(report.healthScore)}`}>
              <Gauge className="w-5 h-5 mb-1" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">مؤشر سلامة البيانات</span>
              <span className="text-2xl font-black">{report.healthScore}%</span>
              <span className="text-[10px] font-semibold mt-0.5">
                {report.healthScore === 100 ? 'بيانات سليمة 100%' : report.healthScore >= 80 ? 'جيدة جداً' : 'تتطلب معالجة'}
              </span>
            </div>

            {/* Total Scanned Records */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>الحركات المفحوصة</span>
                <Database className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-1">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{report.totalTransactionsScanned}</span>
                <span className="text-[10px] text-slate-500 block">حركة في دفتر الأستاذ</span>
              </div>
            </div>

            {/* Ingredients & Recipes Count */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>الخامات والوصفات</span>
                <Cpu className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-1">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {report.totalIngredientsScanned} <span className="text-xs font-normal text-slate-400">/ {report.totalRecipesScanned}</span>
                </span>
                <span className="text-[10px] text-slate-500 block">خامات / وصفات قياسية</span>
              </div>
            </div>

            {/* Engine Performance */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>سرعة الفحص</span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-1">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{report.durationMs} ms</span>
                <span className="text-[10px] text-slate-500 block">حجم الذاكرة: ~{report.performanceMetrics.memoryEstimateKb} KB</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Counts & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">النتائج:</span>
              <span className="flex items-center gap-1 text-red-600 font-bold bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                <XCircle className="w-3.5 h-3.5" />
                {report.summary.criticalCount} حرجة
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                {report.summary.warningCount} تنبيهات
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {report.summary.passCount} اختبار ناجح
              </span>
            </div>

            <div className="flex items-center gap-2">
              {report.issues.some(i => i.autoFixable) && (
                <button
                  onClick={() => handleRunAutoFix()}
                  disabled={isFixing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isFixing ? 'جاري الإصلاح...' : 'إصلاح المشاكل التلقائية'}</span>
                </button>
              )}

              <button
                onClick={handleExportReportJSON}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير JSON</span>
              </button>
            </div>
          </div>

          {/* Issue Category Filters */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: `الكل (${report.issues.length})` },
              { id: 'ledger_integrity', label: 'حركات الدفتر' },
              { id: 'stock_consistency', label: 'أرصدة المخزون' },
              { id: 'recipe_sales', label: 'الوصفات والمبيعات' },
              { id: 'financial_dates', label: 'التواريخ والفترات' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Diagnostic Issues List */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  {isAr ? 'لم يتم العثور على أي مشاكل أو تعارضات في البيانات' : 'No data inconsistencies detected'}
                </h4>
                <p className="text-slate-500 text-[11px] mt-1">
                  {isAr 
                    ? 'دفتر الأستاذ متطابق بالكامل مع دليل الخامات، ولا توجد أرصدة سالبة أو حركات معلقة.'
                    : 'All ledger entries, recipe links, and stock balances are perfectly consistent.'}
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isCrit = issue.severity === 'critical';
                const isWarn = issue.severity === 'warning';
                return (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isCrit
                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/80'
                        : isWarn
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
                        : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {isCrit ? (
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{issue.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                              isCrit ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' :
                              isWarn ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                              'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            }`}>
                              {issue.severity.toUpperCase()}
                            </span>
                          </h5>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {issue.description}
                          </p>
                          {issue.suggestedAction && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 pt-0.5">
                              <span className="text-blue-600 dark:text-blue-400 font-bold">الإجراء الموصى به:</span>
                              <span>{issue.suggestedAction}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {issue.autoFixable && issue.fixType && (
                        <button
                          onClick={() => handleRunAutoFix(issue.fixType)}
                          disabled={isFixing}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1 transition whitespace-nowrap"
                        >
                          <Wrench className="w-3 h-3 text-emerald-600" />
                          <span>إصلاح تلقائي</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Validation Checklist Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">معايير الفحص الأوتوماتيكي:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                فحص عدم وجود حركات معلقة (Orphan Txns)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                فحص الأرصدة السالبة ومخزون أول وآخر المدة
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                التحقق من ربط المبيعات ببطاقات الوصفات القياسية
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                التحقق من نسب الهدر والتشفية (Yield Ratio Validation)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            توقيت الفحص: {new Date(report.timestamp).toLocaleTimeString()}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};
