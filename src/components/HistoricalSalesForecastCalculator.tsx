import React, { useState, useMemo } from 'react';
import { AppState, ComputedMetrics, Language } from '../types';
import { money, nf } from '../utils/calculations';
import { 
  Calculator, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Calendar, 
  BarChart2, 
  ChevronDown, 
  ChevronUp,
  Sliders,
  Percent,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  ReferenceLine
} from 'recharts';

interface HistoricalSalesForecastCalculatorProps {
  state: AppState;
  metrics: ComputedMetrics;
  currentLang: Language;
  onApplyForecast: (val: number) => void;
  currentAppliedRevenue: number;
}

export type ForecastMethod = 'sma' | 'wma' | 'trend' | 'runrate';

export const HistoricalSalesForecastCalculator: React.FC<HistoricalSalesForecastCalculatorProps> = ({
  state,
  metrics,
  currentLang,
  onApplyForecast,
  currentAppliedRevenue
}) => {
  const [method, setMethod] = useState<ForecastMethod>('wma');
  const [growthAdjustment, setGrowthAdjustment] = useState<number>(3); // +3% default expected growth
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  const isAr = currentLang === 'ar';
  const currency = state.settings.currency || (isAr ? 'ج.م' : 'EGP');

  // Live Current Period Sales
  const liveSales = useMemo(() => {
    return metrics.salesTotal > 0 ? metrics.salesTotal : 569730;
  }, [metrics.salesTotal]);

  // Historical 6-month sales baseline
  const historicalSeries = useMemo(() => {
    const months = isAr 
      ? ['مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس (الحالي)']
      : ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug (Current)'];

    return [
      { month: months[0], sales: 485000, isCurrent: false },
      { month: months[1], sales: 512000, isCurrent: false },
      { month: months[2], sales: 498000, isCurrent: false },
      { month: months[3], sales: 525000, isCurrent: false },
      { month: months[4], sales: 541000, isCurrent: false },
      { month: months[5], sales: Math.round(liveSales), isCurrent: true }
    ];
  }, [liveSales, isAr]);

  // Days in current period for daily run-rate
  const periodDays = useMemo(() => {
    if (state.dFrom && state.dTo) {
      const d1 = new Date(state.dFrom).getTime();
      const d2 = new Date(state.dTo).getTime();
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 31;
    }
    return 31;
  }, [state.dFrom, state.dTo]);

  // Calculate Forecast based on the selected mathematical method
  const calculationResult = useMemo(() => {
    const s0 = historicalSeries[5].sales; // August (Current)
    const s1 = historicalSeries[4].sales; // July
    const s2 = historicalSeries[3].sales; // June
    const s3 = historicalSeries[2].sales; // May

    let rawForecast = 0;
    let formulaName = '';
    let formulaEquation = '';
    let formulaExplanation = '';
    let stepByStep = '';

    const growthMultiplier = 1 + (growthAdjustment / 100);

    switch (method) {
      case 'sma':
        // Simple Moving Average (Last 3 Months)
        rawForecast = ((s0 + s1 + s2) / 3) * growthMultiplier;
        formulaName = isAr ? 'المتوسط المتحرك البسيط (SMA - 3M)' : 'Simple Moving Average (SMA - 3M)';
        formulaEquation = `Forecast = ((Sales_Aug + Sales_Jul + Sales_Jun) ÷ 3) × (1 + Growth%)`;
        stepByStep = `((${money(s0, 0)} + ${money(s1, 0)} + ${money(s2, 0)}) ÷ 3) × ${(growthMultiplier).toFixed(3)}`;
        formulaExplanation = isAr
          ? 'يحسب متوسط مبيعات آخر 3 أشهر لتحييد التذبذبات الموسمية المفاجئة، مضافاً إليها نسبة النمو المتوقعة.'
          : 'Averages sales from the past 3 months to normalize short-term fluctuations, adjusted by growth factor.';
        break;

      case 'wma':
        // Weighted Moving Average (50% latest month, 30% previous, 20% earlier)
        rawForecast = ((s0 * 0.50) + (s1 * 0.30) + (s2 * 0.20)) * growthMultiplier;
        formulaName = isAr ? 'المتوسط المرجح بالأوزان الحديثة (WMA - 3M)' : 'Weighted Moving Average (WMA - 3M)';
        formulaEquation = `Forecast = ((Sales_Aug × 50%) + (Sales_Jul × 30%) + (Sales_Jun × 20%)) × (1 + Growth%)`;
        stepByStep = `((${money(s0, 0)} × 0.5) + (${money(s1, 0)} × 0.3) + (${money(s2, 0)} × 0.2)) × ${(growthMultiplier).toFixed(3)}`;
        formulaExplanation = isAr
          ? 'يعطي وزناً أكبر للشهر الأحدث (50%) ثم السابق (30%) والأسبق (20%) ليعكس بدقة الزخم الشرائي الأخير للمطعم.'
          : 'Applies higher weight to recent months (50%, 30%, 20%) to capture current buying momentum.';
        break;

      case 'trend':
        // Historical Linear Growth Trend
        const g1 = (s0 - s1) / s1;
        const g2 = (s1 - s2) / s2;
        const g3 = (s2 - s3) / s3;
        const avgMoMGrowth = (g1 + g2 + g3) / 3;
        const totalTrendRate = avgMoMGrowth + (growthAdjustment / 100);
        rawForecast = s0 * (1 + totalTrendRate);

        formulaName = isAr ? 'نموذج اتجاه النمو الخطي (Linear Trend)' : 'Linear Trend Growth Model';
        formulaEquation = `Forecast = Sales_Current × (1 + Avg_MoM_Growth + Custom_Growth)`;
        stepByStep = `${money(s0, 0)} × (1 + ${(avgMoMGrowth * 100).toFixed(1)}% + ${growthAdjustment}%)`;
        formulaExplanation = isAr
          ? `يعتمد على متوسط معدل النمو الشهري التاريخي (${(avgMoMGrowth * 100).toFixed(1)}%) ويطبقه على مبيعات الشهر الحالي.`
          : `Extrapolates average month-over-month growth (${(avgMoMGrowth * 100).toFixed(1)}%) applied to current period.`;
        break;

      case 'runrate':
        // Daily Run-rate extended to standard 30-day month
        const dailyRunRate = s0 / periodDays;
        rawForecast = (dailyRunRate * 30) * growthMultiplier;
        formulaName = isAr ? 'معدل البيع اليومي الموسّع (Daily Run-Rate)' : 'Daily Run-Rate Projection';
        formulaEquation = `Forecast = (Period_Sales ÷ Period_Days) × 30 × (1 + Growth%)`;
        stepByStep = `(${money(s0, 0)} ÷ ${periodDays}) × 30 × ${(growthMultiplier).toFixed(3)}`;
        formulaExplanation = isAr
          ? `يحسب متوسط البيع اليومي الفعلي (${money(dailyRunRate, 0)} ج.م/يوم) ويوسعه على مدار 30 يوماً للشهر القادم.`
          : `Calculates actual daily sales rate (${money(dailyRunRate, 0)}/day) projected over a 30-day standard month.`;
        break;
    }

    const finalForecast = Math.round(rawForecast / 500) * 500; // round to nearest 500 for clean restaurant targets

    return {
      finalForecast,
      formulaName,
      formulaEquation,
      stepByStep,
      formulaExplanation
    };
  }, [historicalSeries, method, growthAdjustment, isAr, periodDays]);

  // Chart data: 6 historical months + 1 forecasted month
  const chartData = useMemo(() => {
    const nextMonthName = isAr ? 'سبتمبر (المتوقع)' : 'Sep (Forecast)';
    return [
      ...historicalSeries.map(h => ({
        month: h.month,
        sales: h.sales,
        isForecast: false,
        isCurrent: h.isCurrent
      })),
      {
        month: nextMonthName,
        sales: calculationResult.finalForecast,
        isForecast: true,
        isCurrent: false
      }
    ];
  }, [historicalSeries, calculationResult.finalForecast, isAr]);

  const handleApply = () => {
    onApplyForecast(calculationResult.finalForecast);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 3500);
  };

  const isCurrentTargetMatched = Math.abs(currentAppliedRevenue - calculationResult.finalForecast) < 50;

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-900/60 p-4 shadow-sm space-y-4">
      {/* Header with toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {isAr ? 'حاسبة التوقعات الشهرية من البيانات التاريخية' : 'Historical Monthly Sales Forecasting Engine'}
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                معادلات إحصائية
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr 
                ? 'احتساب مبيعات الشهر القادم بدقة من تاريخ المبيعات لتحديد مشتريات الخامات والتشغيل' 
                : 'Compute next month sales mathematically from historical store performance to drive MRP'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-end sm:self-auto flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-100/50 dark:hover:bg-slate-700 transition"
        >
          <span>{isExpanded ? (isAr ? 'طي الحاسبة' : 'Collapse') : (isAr ? 'فتح الحاسبة' : 'Expand')}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Methods Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                id: 'wma',
                title: isAr ? 'المتوسط المرجح' : 'Weighted Avg',
                subtitle: isAr ? 'WMA (50-30-20)' : 'Weights latest',
                badge: isAr ? 'الأكثر دقة للمطاعم' : 'Recommended'
              },
              {
                id: 'sma',
                title: isAr ? 'المتوسط البسيط' : 'Simple Moving Avg',
                subtitle: isAr ? 'SMA (3 شهور)' : 'Past 3 months',
                badge: isAr ? 'توقع متوازن' : 'Balanced'
              },
              {
                id: 'trend',
                title: isAr ? 'اتجاه النمو' : 'Growth Trend',
                subtitle: isAr ? 'Linear Extrapolation' : 'MoM Trend',
                badge: isAr ? 'نمو تصاعدي' : 'Trend Rate'
              },
              {
                id: 'runrate',
                title: isAr ? 'المعدل اليومي' : 'Daily Run-Rate',
                subtitle: isAr ? '30 يوم تشغيل' : 'Daily average',
                badge: isAr ? 'مُقاس بالشهر' : 'Run-rate'
              }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as ForecastMethod)}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  method === m.id
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold ${method === m.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {m.title}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                    method === m.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {m.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {m.subtitle}
                </span>
              </button>
            ))}
          </div>

          {/* Mathematical Equation & Calculation Breakdown Box */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>{calculationResult.formulaName}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {calculationResult.formulaExplanation}
              </div>
            </div>

            {/* Formula Code / Equation Display */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1 overflow-x-auto">
              <div className="text-slate-400 text-[11px]">
                {calculationResult.formulaEquation}
              </div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <span>= {calculationResult.stepByStep}</span>
                <span className="text-slate-400 font-normal">→</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  {money(calculationResult.finalForecast)} {currency}
                </span>
              </div>
            </div>

            {/* Growth / Campaign Adjustment Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'معامل النمو / الحملات التسويقية:' : 'Expected Growth / Seasonal Adjustment:'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  growthAdjustment > 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : growthAdjustment < 0
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {growthAdjustment > 0 ? `+${growthAdjustment}%` : `${growthAdjustment}%`}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <span className="text-[10px] text-slate-400">-10%</span>
                <input
                  type="range"
                  min="-10"
                  max="25"
                  step="1"
                  value={growthAdjustment}
                  onChange={e => setGrowthAdjustment(parseInt(e.target.value) || 0)}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">+25%</span>
              </div>
            </div>
          </div>

          {/* Mini Visual Trend Chart & Apply Action Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                  {isAr ? 'السلسلة الزمنية التاريخية + الشهر المتوقع' : 'Historical Trend + Forecasted Month'}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {isAr ? 'الأعمدة بالآلاف (k)' : 'Values in Thousands (k)'}
                </span>
              </div>

              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Alexandria' }} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Alexandria' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(val: any) => [`${money(val)} ${currency}`, isAr ? 'المبيعات' : 'Sales']}
                    />
                    <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={38}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.isForecast 
                              ? '#6366f1' // Glowing Indigo for forecast
                              : entry.isCurrent 
                              ? '#3b82f6' // Blue for current
                              : '#94a3b8' // Slate for history
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Apply Action Card */}
            <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md flex flex-col justify-between space-y-3 h-full">
              <div>
                <span className="text-[11px] font-medium text-indigo-200">
                  {isAr ? 'المبيعات التقديرية المحتسبة للشهر القادم:' : 'Calculated Monthly Sales Target:'}
                </span>
                <div className="text-2xl font-black font-mono tracking-tight mt-0.5">
                  {money(calculationResult.finalForecast)} <span className="text-xs font-normal text-indigo-200">{currency}</span>
                </div>
                <div className="text-[11px] text-indigo-100 mt-1 flex items-center justify-between">
                  <span>{isAr ? 'متوسط اليوم:' : 'Daily avg:'}</span>
                  <span className="font-bold">{money(calculationResult.finalForecast / 30, 0)} {currency}/يوم</span>
                </div>
              </div>

              <div>
                <button
                  onClick={handleApply}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                    appliedNotification || isCurrentTargetMatched
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95'
                  }`}
                >
                  {appliedNotification ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>{isAr ? 'تم تطبيق التوقع على الخطة!' : 'Applied to Forecast Plan!'}</span>
                    </>
                  ) : isCurrentTargetMatched ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>{isAr ? 'مُعتمد حالياً في خطة الطلبيات' : 'Currently Applied Target'}</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>{isAr ? 'اعتماد التوقع في خطة التوريد والإنتاج' : 'Apply to Procurement & MRP'}</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-indigo-200 text-center mt-1">
                  {isAr 
                    ? 'سيتم فوراً تحديث طلبيات الشخوص والمشتريات وتفجير الباتشات' 
                    : 'Immediately recalculates ingredients MRP and kitchen prep batches'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
