import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { HelpCircle, Calculator, Package, CheckSquare, Layers, Download } from 'lucide-react';

interface HelpTabProps {
  currentLang: Language;
}

export const HelpTab: React.FC<HelpTabProps> = ({ currentLang }) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-xs">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t("tab_help")} — دليل نظام D-Deli V3 الاحترافي
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              دليل شامل لمعادلات حساب تكلفة الطعام، تتبع المخزون، وتصدير الملف المستقل
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>1. الاستهلاك النظري (Theoretical Usage)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("help_p2")}
            </p>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-800 dark:text-blue-300 font-mono text-[11px]">
              Raw Theoretical = Sales Qty × Recipe Standard
              <br />
              Adjusted Theoretical = Raw / Yield %
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>2. الاستهلاك الفعلي (Actual Consumption)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("help_p3")}
            </p>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-800 dark:text-emerald-300 font-mono text-[11px]">
              Actual = (Beg + Recv + Tin + Prod_In) - (Tout + Waste + Prod_Consume + End)
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              <span>3. حساب الفروقات (Variance Analysis)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("help_p4")}
            </p>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-800 dark:text-amber-300 font-mono text-[11px]">
              Variance = Adjusted Theoretical - Actual
              <br />
              Cost Variance = Variance × Unit Price
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>4. التحضيرات الداخلية (Internal Prep)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("help_p5")}
            </p>
          </div>
        </div>

        {/* Single File HTML Export Guide */}
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm">
            <Download className="w-4 h-4 text-amber-600" />
            <span>5. ميزة ملف الـ HTML المستقل بالكامل (Single File HTML)</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            عند الضغط على زر <strong>تحميل كملف HTML مستقل كامل</strong> في أعلى الشاشة، يتم تجميع كل الكود، والمكتبات، وقواعد البيانات، ومحرك التكلفة، ونظام الدخول، واللغات في <strong>ملف واحد فقط بصيغة .html</strong> يمكنك تشغيله على أي جهاز أو هاتف أو لابتوب بدون إنترنت أو خادم خارجي.
          </p>
        </div>
      </div>
    </div>
  );
};
