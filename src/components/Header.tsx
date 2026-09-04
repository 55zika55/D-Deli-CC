import React, { useRef } from 'react';
import { AppState, User, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateSingleFileHTML } from '../utils/singleFileGenerator';
import { exportSummaryExcel } from '../utils/excel';
import { computeMetrics } from '../utils/calculations';
import { 
  Save, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  LogOut, 
  Globe, 
  Code, 
  User as UserIcon,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface HeaderProps {
  state: AppState;
  currentUser: User | null;
  currentLang: Language;
  onSave: () => void;
  onLogout: () => void;
  onImportState: (newState: AppState) => void;
  onLanguageChange: (lang: Language) => void;
  onAudit: (action: string, details: string) => void;
  onOpenDiagnostics?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  currentUser,
  currentLang,
  onSave,
  onLogout,
  onImportState,
  onLanguageChange,
  onAudit,
  onOpenDiagnostics
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `D-Deli_V3_Backup_${state.dFrom}_${state.dTo}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onAudit("backup_export_json", `Exported JSON Backup`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.ing && parsed.recipes && parsed.sales) {
          onImportState(parsed);
          onAudit("backup_import_json", `Imported backup file: ${file.name}`);
        } else {
          alert("الملف لا يحتوي على بنية بيانات D-Deli صالحة");
        }
      } catch (err) {
        alert("خطأ في قراءة ملف الـ JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadSingleHTML = () => {
    const htmlString = generateSingleFileHTML(state);
    const blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `D-Deli_FoodCost_Standalone_${currentLang.toUpperCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onAudit("export_single_html", `Exported 100% Standalone HTML Single File`);
  };

  const handleExportExcel = () => {
    const metrics = computeMetrics(state);
    exportSummaryExcel(state, metrics, currentLang);
    onAudit("export_excel_summary", `Exported Full Food Cost Summary Excel`);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-inner font-bold">
              🍽️
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg tracking-tight flex items-center gap-2">
                D-Deli / بوتشرز
                <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full font-medium">
                  V3 Pro
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t("app_subtitle")}
              </p>
            </div>
          </div>

          {/* User Badge on mobile */}
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 md:hidden text-xs">
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-200">{currentUser.name.split(' ')[0]}</span>
            </div>
          )}
        </div>

        {/* Global Toolbar & Language Switcher */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          {/* User Role Badge on Desktop */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="leading-none">
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 capitalize font-mono">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {/* Multi-Language Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onLanguageChange('ar')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentLang === 'ar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="العربية"
            >
              عربي 🇸🇦
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentLang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="English"
            >
              EN 🇬🇧
            </button>
            <button
              onClick={() => onLanguageChange('fr')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentLang === 'fr' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Français"
            >
              FR 🇫🇷
            </button>
          </div>

          {/* Action Buttons */}
          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition border border-indigo-500/40"
              title={currentLang === 'ar' ? 'تقرير فحص النزاهة وتشخيص النظام' : 'System Diagnostic & Health Check'}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
              <span className="hidden sm:inline">{currentLang === 'ar' ? 'فحص النظام' : 'Diagnostics'}</span>
            </button>
          )}

          <button
            onClick={onSave}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            title={t("save_btn")}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t("save_btn")}</span>
          </button>

          {/* Standalone HTML Downloader */}
          <button
            onClick={handleDownloadSingleHTML}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            title="تحميل كملف HTML مستقل كامل بملف واحد"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t("download_html")}</span>
            <span className="lg:hidden">HTML</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            title={t("excel_btn")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {/* Backup Options */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportJSON}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title={t("export_json")}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title={t("import_json")}
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-red-600/90 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ml-1"
            title={t("logout_btn")}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("logout_btn")}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
