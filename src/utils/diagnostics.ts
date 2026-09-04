import { AppState, LedgerTransaction, Ingredient, Recipe, SaleItem } from '../types';
import { num } from './calculations';

export type DiagnosticSeverity = 'critical' | 'warning' | 'info' | 'success';
export type DiagnosticCategory = 
  | 'ledger_integrity'
  | 'stock_consistency'
  | 'recipe_sales'
  | 'financial_dates'
  | 'performance_stats';

export interface DiagnosticIssue {
  id: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  title: string;
  description: string;
  itemRef?: string;
  suggestedAction?: string;
  autoFixable?: boolean;
  fixType?: 'clean_orphan_tx' | 'zero_negative_stock' | 'link_missing_recipe' | 'sync_units';
}

export interface DiagnosticReport {
  timestamp: string;
  durationMs: number;
  totalTransactionsScanned: number;
  totalIngredientsScanned: number;
  totalRecipesScanned: number;
  totalSalesScanned: number;
  healthScore: number; // 0 - 100
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    passCount: number;
  };
  issues: DiagnosticIssue[];
  performanceMetrics: {
    executionTimeMs: number;
    ledgerCount: number;
    inventoryCount: number;
    memoryEstimateKb: number;
  };
}

/**
 * Runs a comprehensive validation and consistency check on AppState.
 */
export function runSystemDiagnostics(state: AppState): DiagnosticReport {
  const startTime = performance.now();
  const issues: DiagnosticIssue[] = [];
  let passChecks = 0;

  const ingMap = new Map<string, Ingredient>();
  const ingNameMap = new Map<string, Ingredient>();
  state.ing.forEach(g => {
    ingMap.set(g.id, g);
    ingNameMap.set(g.name.trim().toLowerCase(), g);
  });

  const recipeMap = new Map<string, Recipe>();
  state.recipes.forEach(r => recipeMap.set(r.id, r));

  // --- 1. Ledger Integrity & Orphan Transaction Checks ---
  const orphanTxs: LedgerTransaction[] = [];
  const invalidDateTxs: LedgerTransaction[] = [];
  const invalidQtyTxs: LedgerTransaction[] = [];
  const unitMismatchTxs: { tx: LedgerTransaction; ingUnit: string }[] = [];

  state.ledger.forEach(tx => {
    // Check if ingredient exists
    const ing = ingMap.get(tx.ingredientId);
    if (!ing) {
      orphanTxs.push(tx);
    } else {
      // Check unit consistency
      if (tx.unit && ing.unit && tx.unit.trim().toLowerCase() !== ing.unit.trim().toLowerCase()) {
        unitMismatchTxs.push({ tx, ingUnit: ing.unit });
      }
    }

    // Check invalid quantities
    if (isNaN(tx.qty) || tx.qty <= 0) {
      invalidQtyTxs.push(tx);
    }

    // Check invalid or malformed dates
    if (!tx.date || isNaN(Date.parse(tx.date))) {
      invalidDateTxs.push(tx);
    }
  });

  if (orphanTxs.length > 0) {
    issues.push({
      id: 'diag_orphan_txs',
      category: 'ledger_integrity',
      severity: 'critical',
      title: `حركات مخزنية معلقة (Orphan Transactions): ${orphanTxs.length} حركة`,
      description: `تم العثور على ${orphanTxs.length} حركة في دفتر الأستاذ تشير إلى خامات غير موجودة في قاعدة البيانات (مثل: ${orphanTxs.slice(0, 3).map(x => x.ingredientId).join(', ')}).`,
      suggestedAction: 'قم بتنظيف الحركات المعلقة أو إعادة تسجيل الخامات المفقودة.',
      autoFixable: true,
      fixType: 'clean_orphan_tx'
    });
  } else {
    passChecks++;
  }

  if (invalidQtyTxs.length > 0) {
    issues.push({
      id: 'diag_invalid_qty',
      category: 'ledger_integrity',
      severity: 'warning',
      title: `حركات بكميات غير صالحة أو سالبة: ${invalidQtyTxs.length} حركة`,
      description: `يوجد ${invalidQtyTxs.length} حركة تحتوي على قيم كميات صفرية أو سالبة أو غير رقمية في الدفتر.`,
      suggestedAction: 'مراجعة وتعديل قيم الحركات المتأثرة.'
    });
  } else {
    passChecks++;
  }

  if (invalidDateTxs.length > 0) {
    issues.push({
      id: 'diag_invalid_dates',
      category: 'ledger_integrity',
      severity: 'warning',
      title: `حركات بدون تاريخ صحيح: ${invalidDateTxs.length} حركة`,
      description: `يوجد ${invalidDateTxs.length} حركة بدون تاريخ قياسي صالح مما قد يؤثر على تصفية الفترات المحاسبية.`,
      suggestedAction: 'تحديث تواريخ الحركات لتطابق تاريخ الدورة المحاسبية.'
    });
  } else {
    passChecks++;
  }

  if (unitMismatchTxs.length > 0) {
    issues.push({
      id: 'diag_unit_mismatches',
      category: 'ledger_integrity',
      severity: 'info',
      title: `اختلاف في وحدة القياس المسجلة بالحركة: ${unitMismatchTxs.length} حركة`,
      description: `بعض الحركات مسجلة بوحدات قياس تختلف نصياً عن وحدة الخامة الأساسية في دليل الخامات.`,
      suggestedAction: 'مزامنة وتوحيد وحدات القياس.',
      autoFixable: true,
      fixType: 'sync_units'
    });
  } else {
    passChecks++;
  }

  // --- 2. Inventory Balances & Negative Stock Checks ---
  const negativeBeg: { name: string; val: number }[] = [];
  const negativeEnd: { name: string; val: number }[] = [];
  const missingPrices: string[] = [];
  const zeroYields: string[] = [];

  state.ing.forEach((ing, i) => {
    const beg = num(state.beg[i]);
    const end = num(state.end[i]);

    if (beg < 0) {
      negativeBeg.push({ name: ing.name, val: beg });
    }
    if (end < 0) {
      negativeEnd.push({ name: ing.name, val: end });
    }
    if (num(ing.price) <= 0) {
      missingPrices.push(ing.name);
    }
    if (num(ing.yield) <= 0 || num(ing.yield) > 2) {
      zeroYields.push(ing.name);
    }
  });

  if (negativeBeg.length > 0 || negativeEnd.length > 0) {
    const totalNeg = negativeBeg.length + negativeEnd.length;
    issues.push({
      id: 'diag_negative_stock',
      category: 'stock_consistency',
      severity: 'critical',
      title: `أرصدة مخزنية سالبة (Negative Balances): ${totalNeg} خامة`,
      description: `تم رصد أرصدة سالبة في بضاعة أول المدة (${negativeBeg.length}) أو آخر المدة (${negativeEnd.length}) مثل (${[...negativeBeg, ...negativeEnd].slice(0, 3).map(x => x.name).join(', ')}). في الواقع المخزني لا يمكن أن تكون الكميات المادية سالبة.`,
      suggestedAction: 'تعديل وتصفير الأرصدة السالبة وإعادة فحص الجرد الفعلي.',
      autoFixable: true,
      fixType: 'zero_negative_stock'
    });
  } else {
    passChecks++;
  }

  if (missingPrices.length > 0) {
    issues.push({
      id: 'diag_missing_prices',
      category: 'stock_consistency',
      severity: 'warning',
      title: `خامات بسعر شراء صفر: ${missingPrices.length} خامة`,
      description: `توجد خامات بسعر 0 مثل (${missingPrices.slice(0, 3).join(', ')}). سيؤدي ذلك لظهور تكلفة الوجبات التي تستخدمها بصفر.`,
      suggestedAction: 'تسجيل أسعار التكلفة الصحيحة في دليل الخامات.'
    });
  } else {
    passChecks++;
  }

  if (zeroYields.length > 0) {
    issues.push({
      id: 'diag_invalid_yields',
      category: 'stock_consistency',
      severity: 'warning',
      title: `نسب تشفية وهدر غير قياسية (Yield): ${zeroYields.length} خامة`,
      description: `نسبة التشفية (Yield) لبعض الخامات تساوي صفر أو تتجاوز النطاق الطبيعي مما يفسد حساب الاستهلاك النظري المعدل.`,
      suggestedAction: 'تعديل نسبة التشفية لتكون قيمة بين 0.1 و 1.0 (الافتراضي 1.0).'
    });
  } else {
    passChecks++;
  }

  // --- 3. Recipe & Sales Integrity Checks ---
  const unlinkedSales: SaleItem[] = [];
  const emptyRecipes: Recipe[] = [];
  const unlinkedRecipeItems: { recipeName: string; missingIng: string }[] = [];

  state.sales.forEach(sale => {
    if (num(sale.qty) > 0) {
      if (!sale.recipeId || !recipeMap.has(sale.recipeId)) {
        unlinkedSales.push(sale);
      }
    }
  });

  state.recipes.forEach(r => {
    if (!r.items || r.items.length === 0) {
      emptyRecipes.push(r);
    } else {
      r.items.forEach(it => {
        if (!ingMap.has(it.ingredientId)) {
          unlinkedRecipeItems.push({
            recipeName: r.name,
            missingIng: it.ing || it.ingredientId
          });
        }
      });
    }
  });

  if (unlinkedSales.length > 0) {
    issues.push({
      id: 'diag_unlinked_sales',
      category: 'recipe_sales',
      severity: 'warning',
      title: `مبيعات غير مربوطة بوصفات قياسية: ${unlinkedSales.length} صنف مبيع`,
      description: `أصناف مبيعات مثل (${unlinkedSales.slice(0, 3).map(s => s.name).join(', ')}) مباعة بكميات دون ربطها بوصفة، فلن يحسب استهلاكها النظري من المخزن.`,
      suggestedAction: 'ربط صنف المبيعات بكود الوصفة القياسية المطابقة.'
    });
  } else {
    passChecks++;
  }

  if (unlinkedRecipeItems.length > 0) {
    issues.push({
      id: 'diag_unlinked_recipe_items',
      category: 'recipe_sales',
      severity: 'critical',
      title: `مكونات وصفات تشير لخامات محذوفة: ${unlinkedRecipeItems.length} مكون`,
      description: `بعض الوصفات القياسية تحتوي على خامات لم تعد موجودة في دليل الخامات.`,
      suggestedAction: 'تحديث الوصفات واختيار الخامات البديلة.'
    });
  } else {
    passChecks++;
  }

  if (emptyRecipes.length > 0) {
    issues.push({
      id: 'diag_empty_recipes',
      category: 'recipe_sales',
      severity: 'info',
      title: `وصفات بدون مكونات: ${emptyRecipes.length} وصفة`,
      description: `توجد بطاقات وصفات قياسية لم يتم إضافة مكونات وجرامات لها حتى الآن.`,
      suggestedAction: 'إضافة مكونات الوصفة وتكلفتها.'
    });
  } else {
    passChecks++;
  }

  // --- 4. Period & Calculation Consistency ---
  if (!state.dFrom || !state.dTo || state.dFrom > state.dTo) {
    issues.push({
      id: 'diag_invalid_period',
      category: 'financial_dates',
      severity: 'critical',
      title: 'تواريخ الدورة المحاسبية غير متطابقة',
      description: `تاريخ البداية (${state.dFrom}) أكبر من تاريخ النهاية (${state.dTo}).`,
      suggestedAction: 'ضبط تواريخ الفترة المحاسبية في لوحة التحكم.'
    });
  } else {
    passChecks++;
  }

  const endTime = performance.now();
  const durationMs = Math.round((endTime - startTime) * 100) / 100;

  // Calculate Health Score (100 base, deductions for critical/warning)
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  let healthScore = 100 - (criticalCount * 25) - (warningCount * 8) - (infoCount * 2);
  healthScore = Math.max(0, Math.min(100, healthScore));

  const totalStateBytes = JSON.stringify(state).length;

  return {
    timestamp: new Date().toISOString(),
    durationMs,
    totalTransactionsScanned: state.ledger.length,
    totalIngredientsScanned: state.ing.length,
    totalRecipesScanned: state.recipes.length,
    totalSalesScanned: state.sales.length,
    healthScore,
    summary: {
      criticalCount,
      warningCount,
      infoCount,
      passCount: passChecks
    },
    issues,
    performanceMetrics: {
      executionTimeMs: durationMs,
      ledgerCount: state.ledger.length,
      inventoryCount: state.ing.length,
      memoryEstimateKb: Math.round(totalStateBytes / 1024)
    }
  };
}

/**
 * Automatically applies non-destructive repairs to common diagnostic issues.
 */
export function autoRepairDataIssues(state: AppState, fixTypes: string[]): {
  repairedState: AppState;
  repairedSummary: string[];
} {
  const ingMap = new Map<string, Ingredient>(state.ing.map(g => [g.id, g]));
  const summary: string[] = [];
  let updatedLedger = [...state.ledger];
  let updatedBeg = [...state.beg];
  let updatedEnd = [...state.end];

  // 1. Clean Orphan Transactions
  if (fixTypes.includes('clean_orphan_tx')) {
    const originalCount = updatedLedger.length;
    updatedLedger = updatedLedger.filter(tx => ingMap.has(tx.ingredientId));
    const removedCount = originalCount - updatedLedger.length;
    if (removedCount > 0) {
      summary.push(`تم تنظيف ${removedCount} حركة معلقة تشير لخامات غير موجودة.`);
    }
  }

  // 2. Zero Negative Stock
  if (fixTypes.includes('zero_negative_stock')) {
    let begFixed = 0;
    let endFixed = 0;
    updatedBeg = updatedBeg.map(val => {
      const n = num(val);
      if (n < 0) {
        begFixed++;
        return 0;
      }
      return n;
    });

    updatedEnd = updatedEnd.map(val => {
      const n = num(val);
      if (n < 0) {
        endFixed++;
        return 0;
      }
      return n;
    });

    if (begFixed > 0 || endFixed > 0) {
      summary.push(`تم تصحيح ${begFixed + endFixed} رصيد سالب وتحويلها إلى الصفر.`);
    }
  }

  // 3. Sync Units
  if (fixTypes.includes('sync_units')) {
    let syncedCount = 0;
    updatedLedger = updatedLedger.map(tx => {
      const ing = ingMap.get(tx.ingredientId);
      if (ing && ing.unit && tx.unit !== ing.unit) {
        syncedCount++;
        return { ...tx, unit: ing.unit };
      }
      return tx;
    });
    if (syncedCount > 0) {
      summary.push(`تمت مزامنة وتوحيد وحدة القياس لـ ${syncedCount} حركة مخزنية.`);
    }
  }

  const repairedState: AppState = {
    ...state,
    ledger: updatedLedger,
    beg: updatedBeg,
    end: updatedEnd
  };

  return {
    repairedState,
    repairedSummary: summary
  };
}
