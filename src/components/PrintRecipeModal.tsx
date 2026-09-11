import React, { useState, useEffect } from 'react';
import { AppState, Recipe, Language, Ingredient } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, money, getRecipeUnitCost, getRecipeAvgSellingPrice } from '../utils/calculations';
import { exportRecipesExcel, exportSingleRecipeExcel, downloadXLSX } from '../utils/excel';
import { downloadElementAsPDF } from '../utils/pdfExport';
import { 
  Printer, 
  X, 
  ExternalLink, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  ChefHat, 
  DollarSign, 
  Search,
  Sliders,
  FileText,
  Building2,
  Calendar,
  Check,
  Eye,
  Settings2,
  Loader2
} from 'lucide-react';

interface PrintRecipeModalProps {
  state: AppState;
  currentLang: Language;
  recipeIndex: number | 'all';
  onClose: () => void;
}

export const PrintRecipeModal: React.FC<PrintRecipeModalProps> = ({
  state,
  currentLang,
  recipeIndex,
  onClose
}) => {
  const isAr = currentLang === 'ar';
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const ingMap = new Map<string, Ingredient>(state.ing.map(g => [g.id, g]));

  // Selected filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Print & Display Settings
  const [printMode, setPrintMode] = useState<'cost' | 'kitchen'>('cost'); // 'cost' = with prices, 'kitchen' = prep only (no prices)
  const [oneRecipePerPage, setOneRecipePerPage] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showIngredientCodes, setShowIngredientCodes] = useState<boolean>(true);
  const [showCostShares, setShowCostShares] = useState<boolean>(true);
  const [restaurantName, setRestaurantName] = useState<string>('D-Deli / بوتشرز');
  const [customNotes, setCustomNotes] = useState<string>('معايير التشغيل القياسية المعتمدة • حفظ وتخزين الخامات وفق اشتراطات سلامة الغذاء');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Clean up body class if component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('printing-recipes');
    };
  }, []);

  // Determine initial recipe list
  const baseRecipes: Recipe[] = recipeIndex === 'all' 
    ? state.recipes 
    : (typeof recipeIndex === 'number' && state.recipes[recipeIndex] ? [state.recipes[recipeIndex]] : state.recipes);

  // Filter recipes according to user selection
  const filteredRecipes = baseRecipes.filter(r => {
    if (selectedCategory !== 'all') {
      const matchCat = r.items.some(it => {
        const g = ingMap.get(it.ingredientId);
        return g && String(g.cat) === selectedCategory;
      });
      if (!matchCat) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchCode = (r.code || '').toLowerCase().includes(q);
      const matchId = (r.id || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchId) return false;
    }
    return true;
  });

  // Helper to generate the standalone HTML document for printing with embedded interactive settings
  const generatePrintableHTML = (): string => {
    const todayStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const recipesJSON = JSON.stringify(filteredRecipes.map(r => {
      const unitCost = getRecipeUnitCost(r, state.ing);
      const sellPrice = getRecipeAvgSellingPrice(r.id, state.sales);
      const fcPct = sellPrice > 0 ? (unitCost / sellPrice) * 100 : 0;
      const profitVal = sellPrice > 0 ? sellPrice - unitCost : 0;
      const profitPct = sellPrice > 0 ? (profitVal / sellPrice) * 100 : 0;

      const items = r.items.map((it, itIdx) => {
        const g = ingMap.get(it.ingredientId);
        const price = g?.price || 0;
        const itemCost = num(it.std) * price;
        const costShare = unitCost > 0 ? ((itemCost / unitCost) * 100).toFixed(1) : '0';
        return {
          idx: itIdx + 1,
          name: g?.name || it.ing || it.ingredientId,
          id: it.ingredientId,
          std: it.std,
          unit: g?.unit || '',
          price: price,
          cost: itemCost,
          costShare: costShare
        };
      });

      return {
        id: r.id,
        code: r.code,
        name: r.name,
        unitCost,
        sellPrice,
        fcPct,
        profitVal,
        profitPct,
        items
      };
    })).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>بطاقات الوصفات القياسية — ${restaurantName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      font-family: 'Alexandria', sans-serif !important;
    }
    body {
      background: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Interactive Print Settings Toolbar */
    #recipePrintSettingsBar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #2563eb;
    }
    .toolbar-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .btn-action {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-action:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: 0.15s;
    }
    .btn-secondary:hover {
      background: #334155;
      color: #ffffff;
    }
    .btn-toggle {
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-toggle.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }
    .search-input {
      background: #1e293b;
      border: 1px solid #334155;
      color: #ffffff;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      width: 180px;
    }
    .search-input:focus {
      outline: 2px solid #2563eb;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #cbd5e1;
      cursor: pointer;
      user-select: none;
    }

    /* Container for printable cards */
    #recipesContainer {
      max-width: 210mm;
      margin: 20px auto;
      padding: 0 10px;
    }

    .recipe-card {
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .page-break-enabled {
      page-break-after: always !important;
      break-after: page !important;
      margin-bottom: 0 !important;
    }

    .recipe-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .badge-code {
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .recipe-title {
      margin: 0;
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
    }
    .sub-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .summary-box {
      text-align: left;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 11px;
    }

    table.recipe-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: right;
      margin-bottom: 12px;
    }
    table.recipe-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 7px 8px;
      border: 1px solid #0f172a;
    }
    table.recipe-table td {
      padding: 7px 8px;
      border: 1px solid #e2e8f0;
    }
    table.recipe-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    table.recipe-table tfoot td {
      background: #e2e8f0;
      font-weight: bold;
      border-top: 2px solid #0f172a;
      padding: 8px;
    }

    .signatures-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed #94a3b8;
      padding-top: 8px;
      font-size: 10px;
      color: #64748b;
      margin-top: 8px;
    }

    /* Print Specific Media Rules */
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm 8mm;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      #recipePrintSettingsBar {
        display: none !important;
      }
      #recipesContainer {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .recipe-card {
        box-shadow: none !important;
        border: 2px solid #000000 !important;
      }
      .recipe-card.page-break-enabled {
        page-break-after: always !important;
        break-after: page !important;
      }
      table.recipe-table th {
        background: #0f172a !important;
        color: #ffffff !important;
      }
    }
  </style>
</head>
<body>

  <!-- Interactive Print Settings Toolbar -->
  <div id="recipePrintSettingsBar">
    <div class="toolbar-group">
      <button class="btn-action" onclick="window.print()">
        <span>🖨️ طباعة التقرير (Print / PDF)</span>
      </button>
      
      <!-- Print Mode: Cost vs Kitchen -->
      <div style="display:flex;gap:3px;background:#1e293b;padding:3px;border-radius:8px">
        <button id="btnModeCost" class="btn-toggle active" onclick="setPrintMode('cost')">💰 بطاقة تكلفة وأسعار</button>
        <button id="btnModeKitchen" class="btn-toggle" onclick="setPrintMode('kitchen')">👨‍🍳 أمر تشغيل مطبخ</button>
      </div>

      <!-- Page Break Toggle -->
      <label class="checkbox-label">
        <input type="checkbox" id="chkPageBreak" checked onchange="togglePageBreak(this.checked)">
        <span>صفحة مستقلة لكل وصفة (A4)</span>
      </label>
    </div>

    <!-- Right Options: Live Search & Display Toggles -->
    <div class="toolbar-group">
      <label class="checkbox-label">
        <input type="checkbox" id="chkSignatures" checked onchange="toggleSignatures(this.checked)">
        <span>التوقيعات</span>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" id="chkCodes" checked onchange="toggleCodes(this.checked)">
        <span>كود المكون</span>
      </label>

      <input type="text" id="recipeSearch" class="search-input" placeholder="🔍 بحث فوري عن وصفة..." oninput="filterRecipes(this.value)">

      <span id="recipeCounter" style="font-size:11px;color:#94a3b8;font-weight:600"></span>
    </div>
  </div>

  <!-- Recipes Cards Container -->
  <div id="recipesContainer"></div>

  <script>
    const RECIPES_DATA = ${recipesJSON};
    let currentMode = 'cost';
    let isPageBreak = true;
    let showSig = true;
    let showCode = true;
    let searchFilter = '';

    function money(n) {
      return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderRecipes() {
      const container = document.getElementById('recipesContainer');
      const filtered = RECIPES_DATA.filter(r => {
        if (!searchFilter) return true;
        const q = searchFilter.toLowerCase();
        return (r.name || '').toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q);
      });

      document.getElementById('recipeCounter').innerText = filtered.length + ' وصفة';

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:50px;color:#64748b;font-weight:bold;">لا توجد وصفات مطابقة لخيارات البحث</div>';
        return;
      }

      container.innerHTML = filtered.map(r => {
        const rows = r.items.map(it => {
          if (currentMode === 'kitchen') {
            return \`
              <tr>
                <td style="text-align:center;color:#64748b;font-weight:bold;">\${it.idx}</td>
                <td style="font-weight:bold;">\${it.name}</td>
                \${showCode ? \`<td style="text-align:center;color:#64748b;">\${it.id}</td>\` : ''}
                <td style="text-align:center;font-weight:bold;font-size:13px;">\${it.std}</td>
                <td style="text-align:center;">\${it.unit}</td>
                <td style="text-align:center;color:#94a3b8;">__________________</td>
              </tr>
            \`;
          }

          return \`
            <tr>
              <td style="text-align:center;color:#64748b;font-weight:bold;">\${it.idx}</td>
              <td style="font-weight:bold;">\${it.name}</td>
              \${showCode ? \`<td style="text-align:center;color:#64748b;">\${it.id}</td>\` : ''}
              <td style="text-align:center;font-weight:bold;font-size:13px;">\${it.std}</td>
              <td style="text-align:center;">\${it.unit}</td>
              <td style="text-align:center;">\${money(it.price)}</td>
              <td style="text-align:center;font-weight:bold;">\${money(it.cost)}</td>
              <td style="text-align:center;color:#64748b;">\${it.costShare}%</td>
            </tr>
          \`;
        }).join('');

        return \`
          <div class="recipe-card \${isPageBreak ? 'page-break-enabled' : ''}">
            <div class="recipe-header">
              <div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span class="badge-code">\${r.code}</span>
                  <h1 class="recipe-title">\${r.name}</h1>
                </div>
                <div class="sub-meta">
                  ID: <b>\${r.id}</b> • بطاقة المعايير الفنية والتشغيل • \${${JSON.stringify(restaurantName)}}
                </div>
              </div>

              \${currentMode === 'cost' ? \`
                <div class="summary-box">
                  <div style="font-size:13px;font-weight:900;color:#1e3a8a;">التكلفة: \${money(r.unitCost)} ج.م</div>
                  <div>سعر البيع: <b>\${r.sellPrice > 0 ? money(r.sellPrice) + ' ج.م' : 'غير محدد'}</b></div>
                  <div style="font-weight:bold;color:\${r.fcPct > 35 ? '#b45309' : '#047857'}">
                    Food Cost: \${r.fcPct > 0 ? r.fcPct.toFixed(1) + '%' : '—'} | Margin: \${r.profitPct > 0 ? r.profitPct.toFixed(1) + '%' : '—'}
                  </div>
                </div>
              \` : \`
                <div style="text-align:left;background:#f1f5f9;border:1px solid #94a3b8;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:bold;color:#334155;">
                  👨‍🍳 أمر تشغيل وتجهيز مطبخ<br/>
                  <span style="font-size:10px;font-weight:normal;color:#64748b;">(معايير الإنتاج القياسية)</span>
                </div>
              \`}
            </div>

            <table class="recipe-table">
              <thead>
                <tr>
                  <th style="width:35px;text-align:center;">#</th>
                  <th>اسم المكون / الخامة</th>
                  \${showCode ? '<th style="width:80px;text-align:center;">كود الصنف</th>' : ''}
                  <th style="width:90px;text-align:center;">الكمية المعيارية</th>
                  <th style="width:60px;text-align:center;">الوحدة</th>
                  \${currentMode === 'cost' ? \`
                    <th style="width:80px;text-align:center;">سعر الوحدة</th>
                    <th style="width:85px;text-align:center;">التكلفة</th>
                    <th style="width:65px;text-align:center;">النسبة %</th>
                  \` : \`
                    <th style="width:130px;text-align:center;">ملاحظات الاستلام</th>
                  \`}
                </tr>
              </thead>
              <tbody>
                \${rows}
              </tbody>
              <tfoot>
                \${currentMode === 'cost' ? \`
                  <tr>
                    <td colspan="\${showCode ? 6 : 5}" style="text-align:left;">إجمالي تكلفة المكونات المعيارية:</td>
                    <td style="text-align:center;font-size:13px;color:#1e3a8a;">\${money(r.unitCost)} ج.م</td>
                    <td style="text-align:center;">100%</td>
                  </tr>
                \` : \`
                  <tr>
                    <td colspan="3" style="text-align:left;">إجمالي عدد المكونات:</td>
                    <td colspan="\${showCode ? 3 : 2}" style="text-align:center;font-weight:800;">\${r.items.length} أصناف خامات</td>
                  </tr>
                \`}
              </tfoot>
            </table>

            \${showSig ? \`
              <div class="signatures-block">
                <div>\${${JSON.stringify(restaurantName)}} • تاريخ الإصدار: \${${JSON.stringify(todayStr)}}</div>
                <div style="display:flex;gap:20px;">
                  <span>اعتماد الشيف: ________________</span>
                  <span>مراقبة التكاليف: ________________</span>
                </div>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }

    function setPrintMode(mode) {
      currentMode = mode;
      document.getElementById('btnModeCost').classList.toggle('active', mode === 'cost');
      document.getElementById('btnModeKitchen').classList.toggle('active', mode === 'kitchen');
      renderRecipes();
    }

    function togglePageBreak(val) {
      isPageBreak = val;
      renderRecipes();
    }

    function toggleSignatures(val) {
      showSig = val;
      renderRecipes();
    }

    function toggleCodes(val) {
      showCode = val;
      renderRecipes();
    }

    function filterRecipes(val) {
      searchFilter = val;
      renderRecipes();
    }

    // Initial render
    renderRecipes();
  </script>
</body>
</html>`;
  };

  // Direct High-Resolution PDF Download
  const handleDownloadPDF = async () => {
    const scrollContainer = document.querySelector('.recipe-print-scroll-area') as HTMLElement;
    if (!scrollContainer) {
      handleInstantPrint();
      return;
    }
    setIsPrinting(true);
    setStatusMessage(isAr ? 'جاري تحويل ومعالجة بطاقات الوصفات إلى ملف PDF عالي الجودة...' : 'Generating PDF...');
    try {
      await downloadElementAsPDF(scrollContainer, {
        orientation: 'portrait',
        filename: `D-Deli_Recipe_Cards_${filteredRecipes.length}_${new Date().toISOString().slice(0, 10)}`,
        scale: 2,
        onProgress: setStatusMessage
      });
      setStatusMessage(isAr ? '✓ تم تنزيل ملف PDF بنجاح!' : '✓ PDF downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('PDF export failed:', err);
      setStatusMessage(isAr ? 'تعذر التوليد المباشر، جاري استدعاء نافذة الطباعة كبديل...' : 'Fallback to print dialog...');
      setTimeout(() => handleInstantPrint(), 1000);
    } finally {
      setIsPrinting(false);
    }
  };

  // 1. Direct, instant native print trigger
  const handleInstantPrint = () => {
    setIsPrinting(true);
    setStatusMessage(isAr ? 'جاري فتح نافذة الطباعة الفورية...' : 'Opening print dialog...');
    
    try {
      const htmlContent = generatePrintableHTML();
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setStatusMessage(isAr ? '✓ تم إرسال أمر الطباعة بنجاح' : '✓ Print command sent successfully');
          } catch (printErr) {
            console.warn('Iframe print error, attempting window.print:', printErr);
            document.body.classList.add('printing-recipes');
            window.print();
            setTimeout(() => document.body.classList.remove('printing-recipes'), 1000);
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              setIsPrinting(false);
              setTimeout(() => setStatusMessage(null), 3500);
            }, 2000);
          }
        }, 300);
      } else {
        document.body.classList.add('printing-recipes');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-recipes');
          setIsPrinting(false);
          setTimeout(() => setStatusMessage(null), 3500);
        }, 1000);
      }
    } catch (err) {
      console.error('Print generation failed:', err);
      document.body.classList.add('printing-recipes');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-recipes');
        setIsPrinting(false);
      }, 1000);
    }
  };

  // 2. Open printable view in a clean new tab (with interactive settings)
  const handleOpenNewTab = () => {
    try {
      const htmlContent = generatePrintableHTML();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        // If popup was blocked by browser sandbox
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.click();
      } else {
        printWindow.focus();
      }
      setStatusMessage(isAr ? '✓ تم فتح صفحة إعدادات الطباعة في نافذة جديدة' : '✓ Opened in new window');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Open new tab failed:', err);
      handleInstantPrint();
    }
  };

  // 3. Download standalone HTML with embedded print settings
  const handleDownloadHTML = () => {
    try {
      const htmlContent = generatePrintableHTML();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `D-Deli_Recipes_Print_${filteredRecipes.length}_${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage(isAr ? '✓ تم تنزيل ملف HTML التفاعلي مع إعدادات الطباعة بنجاح!' : '✓ HTML with print settings saved!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // 4. Export to Excel
  const handleExportExcel = () => {
    if (filteredRecipes.length === 1) {
      const targetIdx = state.recipes.findIndex(r => r.id === filteredRecipes[0].id);
      if (targetIdx >= 0) {
        exportSingleRecipeExcel(targetIdx, state);
        return;
      }
    }

    const headers = [
      "كود الوصفة",
      "اسم الوصفة",
      "كود المكون",
      "اسم المكون",
      "الكمية المعيارية",
      "الوحدة",
      "سعر الوحدة",
      "تكلفة المكون",
      "إجمالي تكلفة الوجبة",
      "سعر البيع",
      "نسبة Food Cost"
    ];

    const rows: (string | number)[][] = [headers];

    filteredRecipes.forEach(r => {
      const unitCost = getRecipeUnitCost(r, state.ing);
      const sellPrice = getRecipeAvgSellingPrice(r.id, state.sales);
      const fc = sellPrice > 0 ? (unitCost / sellPrice) * 100 : 0;

      r.items.forEach(it => {
        const g = ingMap.get(it.ingredientId);
        const p = g?.price || 0;
        const c = num(it.std) * p;
        rows.push([
          r.code,
          r.name,
          it.ingredientId,
          g?.name || it.ing,
          it.std,
          g?.unit || "",
          p,
          c,
          unitCost,
          sellPrice > 0 ? sellPrice : "",
          fc > 0 ? `${fc.toFixed(1)}%` : ""
        ]);
      });
    });

    downloadXLSX(rows, `D-Deli_Recipes_Print_Batch_${filteredRecipes.length}.xlsx`, "Recipes");
    setStatusMessage(isAr ? '✓ تم تصدير ملف الإكسيل بنجاح' : '✓ Excel exported');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print-modal-container">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-700 print-modal-card">
        
        {/* Sticky Control & Actions Bar */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            
            {/* Title & Count */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                <Printer className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>{isAr ? 'طباعة تقارير فورية للوصفات القياسية' : 'Recipe Instant Reports Hub'}</span>
                  <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {filteredRecipes.length} {isAr ? 'وصفة' : 'recipes'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'طباعة فورية بنقرة واحدة بخط Alexandria، مع إعدادات كاملة وتصدير HTML تفاعلي وإكسيل' 
                    : '1-click instant printing with Alexandria font, full options & interactive HTML export'}
                </p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Direct PDF Download Button */}
              <button
                onClick={handleDownloadPDF}
                disabled={isPrinting || filteredRecipes.length === 0}
                className="bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'تنزيل ملف PDF مباشر عالي الجودة' : 'Download Direct PDF'}
              >
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isAr ? '📥 تنزيل PDF مباشر' : 'Download PDF'}</span>
              </button>

              {/* Instant Direct Print Button */}
              <button
                onClick={handleInstantPrint}
                disabled={isPrinting || filteredRecipes.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'طباعة فورية مباشرة عبر نافذة الطابعة' : 'Instant Print'}
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? (isAr ? 'جاري التحضير...' : 'Printing...') : (isAr ? '🖨️ نافذة الطباعة' : 'Print Dialog')}</span>
              </button>

              {/* Open in New Window Button */}
              <button
                onClick={handleOpenNewTab}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'فتح صفحة الطباعة مع شريط الإعدادات في نافذة جديدة' : 'Open in New Tab'}
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'نافذة جديدة' : 'New Tab'}</span>
              </button>

              {/* Download Printable HTML with Settings */}
              <button
                onClick={handleDownloadHTML}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'تنزيل ملف HTML جاهز للطباعة يحتوي على شريط إعدادات مدمج' : 'Save Interactive HTML'}
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'تنزيل HTML بإعدادات الطباعة' : 'Save HTML with Settings'}</span>
              </button>

              {/* Export to Excel */}
              <button
                onClick={handleExportExcel}
                className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title={isAr ? 'تصدير جدول الوصفات ومكوناتها إلى إكسيل' : 'Export to Excel'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              {/* Settings Toggle Button */}
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  showAdvancedSettings 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isAr ? 'إعدادات الطباعة وخيارات التقرير' : 'Print Settings'}
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-toolbar: Filters, Search, and Print Layout Options */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Search and Category Filter */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث باسم الوصفة أو الكود...' : 'Search recipe name or code...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quick Preset: All vs Single */}
              {baseRecipes.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      searchTerm === '' && selectedCategory === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? `الكل (${baseRecipes.length})` : 'All'}
                  </button>
                </div>
              )}
            </div>

            {/* Print Mode & Formatting Toggles */}
            <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-300">
              
              {/* Cost Mode vs Kitchen Prep Mode */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setPrintMode('cost')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                    printMode === 'cost' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3 h-3 text-amber-300" />
                  <span>{isAr ? 'بطاقة تكلفة وأسعار' : 'Cost & Margin'}</span>
                </button>
                <button
                  onClick={() => setPrintMode('kitchen')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                    printMode === 'kitchen' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ChefHat className="w-3 h-3 text-purple-200" />
                  <span>{isAr ? 'أمر تشغيل مطبخ (بدون أسعار)' : 'Kitchen Prep (No Prices)'}</span>
                </button>
              </div>

              {/* 1 Recipe per Page Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-xs select-none">
                <input
                  type="checkbox"
                  checked={oneRecipePerPage}
                  onChange={e => setOneRecipePerPage(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-900"
                />
                <span>{isAr ? 'صفحة مستقلة لكل وصفة (A4)' : '1 Recipe per Page'}</span>
              </label>

              {/* Show Signatures */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-xs select-none">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={e => setShowSignatures(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-900"
                />
                <span>{isAr ? 'التوقيعات' : 'Signatures'}</span>
              </label>

            </div>

          </div>

          {/* Advanced Print & HTML Export Settings Drawer */}
          {showAdvancedSettings && (
            <div className="mt-3 bg-slate-850 p-3.5 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isAr ? 'اسم المنشأة / المطعم' : 'Restaurant Title'}</span>
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'خيارات إضافية' : 'Options'}</span>
                </label>
                <div className="space-y-1 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showIngredientCodes}
                      onChange={e => setShowIngredientCodes(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 bg-slate-900"
                    />
                    <span>{isAr ? 'إظهار أكواد المكونات' : 'Show Ingredient Codes'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showCostShares}
                      onChange={e => setShowCostShares(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 bg-slate-900"
                    />
                    <span>{isAr ? 'إظهار نسب التكلفة %' : 'Show Cost Shares %'}</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'ملاحظات أمر التشغيل أسفل التقرير' : 'Footer Notes'}</span>
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Status Message Notification */}
          {statusMessage && (
            <div className="mt-2 text-xs font-semibold text-blue-300 bg-blue-950/60 border border-blue-800 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Scrollable Printable Cards Body (Preview & Direct Window Print Target) */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950/70 recipe-print-scroll-area print:p-0 print:space-y-6 print:bg-white print:overflow-visible">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Printer className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">{isAr ? 'لا توجد وصفات تطابق البحث المحدد' : 'No recipes match the search filter'}</p>
            </div>
          ) : (
            filteredRecipes.map((r) => {
              const unitCost = getRecipeUnitCost(r, state.ing);
              const sellPrice = getRecipeAvgSellingPrice(r.id, state.sales);
              const fcPct = sellPrice > 0 ? (unitCost / sellPrice) * 100 : 0;
              const profitVal = sellPrice > 0 ? sellPrice - unitCost : 0;
              const profitPct = sellPrice > 0 ? (profitVal / sellPrice) * 100 : 0;

              return (
                <div 
                  key={r.id} 
                  className={`bg-white text-slate-900 border-2 border-slate-800 rounded-2xl p-5 shadow-md print:border-2 print:border-black print:rounded-none print:p-4 print:shadow-none recipe-print-page ${
                    oneRecipePerPage ? 'page-break-always' : ''
                  }`}
                >
                  {/* Recipe Card Header */}
                  <div className="flex flex-wrap justify-between items-start border-b-2 border-slate-900 pb-3 mb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          {r.code}
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900">
                          {r.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500">
                        ID: <b className="font-bold text-slate-700">{r.id}</b> • بطاقة المعايير الفنية والتشغيل • {restaurantName}
                      </p>
                    </div>

                    {printMode === 'cost' ? (
                      <div className="text-left bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                        <div className="text-sm font-black text-blue-900">
                          التكلفة: {money(unitCost)} <span className="text-[10px] text-slate-500">ج.م</span>
                        </div>
                        <div className="text-xs text-slate-700">
                          سعر البيع: <span className="font-bold">{sellPrice > 0 ? `${money(sellPrice)} ج.م` : '—'}</span>
                        </div>
                        <div className="text-xs font-bold mt-0.5 flex items-center gap-2">
                          <span className={fcPct > 35 ? 'text-amber-700' : 'text-emerald-700'}>
                            Food Cost: {fcPct > 0 ? `${fcPct.toFixed(1)}%` : '—'}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-blue-700">
                            Margin: {profitPct > 0 ? `${profitPct.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-left bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs">
                        <div className="font-bold text-purple-900 flex items-center gap-1">
                          <ChefHat className="w-4 h-4 text-purple-600" />
                          <span>أمر تشغيل وتجهيز مطبخ</span>
                        </div>
                        <div className="text-[11px] text-purple-700">
                          معايير الإنتاج القياسية (بدون بيانات مالية)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recipe BOM Ingredients Table */}
                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-900 text-white font-bold">
                        <tr>
                          <th className="p-2.5 text-center w-8">#</th>
                          <th className="p-2.5">اسم المكون / الخامة (Ingredient)</th>
                          {showIngredientCodes && <th className="p-2.5 text-center w-24">كود الصنف</th>}
                          <th className="p-2.5 text-center w-28">الكمية المعيارية</th>
                          <th className="p-2.5 text-center w-16">الوحدة</th>
                          {printMode === 'cost' ? (
                            <>
                              <th className="p-2.5 text-center w-24">سعر الوحدة</th>
                              <th className="p-2.5 text-center w-24">التكلفة</th>
                              {showCostShares && <th className="p-2.5 text-center w-20">النسبة %</th>}
                            </>
                          ) : (
                            <th className="p-2.5 text-center w-36">ملاحظات الشيف / الاستلام</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {r.items.map((it, itIdx) => {
                          const g = ingMap.get(it.ingredientId);
                          const price = g?.price || 0;
                          const cost = num(it.std) * price;
                          const costShare = unitCost > 0 ? (cost / unitCost) * 100 : 0;

                          return (
                            <tr key={itIdx} className={itIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 text-center text-slate-400 font-bold">{itIdx + 1}</td>
                              <td className="p-2 font-bold text-slate-900">{g?.name || it.ing || it.ingredientId}</td>
                              {showIngredientCodes && (
                                <td className="p-2 text-center text-[11px] text-slate-500 font-semibold">{it.ingredientId}</td>
                              )}
                              <td className="p-2 text-center font-black text-sm text-slate-900">{it.std}</td>
                              <td className="p-2 text-center font-semibold text-slate-600">{g?.unit || ''}</td>
                              {printMode === 'cost' ? (
                                <>
                                  <td className="p-2 text-center text-slate-600">{money(price, 3)}</td>
                                  <td className="p-2 text-center font-black text-slate-900">{money(cost)}</td>
                                  {showCostShares && (
                                    <td className="p-2 text-center text-slate-500 text-[11px]">{costShare.toFixed(1)}%</td>
                                  )}
                                </>
                              ) : (
                                <td className="p-2 text-center text-slate-300">________________</td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      {printMode === 'cost' ? (
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900">
                          <tr>
                            <td colSpan={showIngredientCodes ? 5 : 4} className="p-2.5 text-left text-slate-800">إجمالي تكلفة المكونات المعيارية للوجبة:</td>
                            <td className="p-2.5 text-center text-blue-800 font-black text-sm">{money(unitCost)} ج.م</td>
                            <td className="p-2.5 text-center text-slate-500">{showCostShares ? '100%' : ''}</td>
                          </tr>
                        </tfoot>
                      ) : (
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900">
                          <tr>
                            <td colSpan={3} className="p-2.5 text-left text-slate-800">إجمالي عدد مكونات الوصفة:</td>
                            <td colSpan={showIngredientCodes ? 3 : 2} className="p-2.5 text-center font-bold text-slate-900">{r.items.length} أصناف خامات</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Custom Notes */}
                  {customNotes && (
                    <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <b>ملاحظات:</b> {customNotes}
                    </div>
                  )}

                  {/* Footer notes & Signatures */}
                  {showSignatures && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] text-slate-500 gap-2">
                      <div>نظام إدارة التكاليف والمخزون • تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
                      <div className="flex items-center gap-4 font-semibold text-slate-700">
                        <span>توقيع الشيف المسؤول: ____________</span>
                        <span>مراقبة التكاليف: ____________</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
