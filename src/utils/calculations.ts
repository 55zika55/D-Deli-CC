import { 
  AppState, 
  ComputedMetrics, 
  MovementType, 
  MenuEngineeringItem, 
  MenuEngineeringSummary, 
  Recipe, 
  Ingredient, 
  SaleItem,
  ExpenseRecord,
  ExpenseCategory
} from '../types';

export const DAY_MS = 86400000;

export function dateDiff(from: string, to: string): number {
  try {
    const diff = Math.floor((new Date(to + "T00:00:00").getTime() - new Date(from + "T00:00:00").getTime()) / DAY_MS) + 1;
    return Math.max(1, isFinite(diff) ? diff : 1);
  } catch {
    return 30;
  }
}

export function num(v: unknown): number {
  const n = parseFloat(String(v ?? 0));
  return isFinite(n) ? n : 0;
}

export function nf(n: number | string, decimals: number = 2): string {
  const d = Math.max(0, Math.min(20, Math.floor(num(decimals))));
  return num(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

export function money(n: number | string, decimals: number = 2): string {
  const d = Math.max(0, Math.min(20, Math.floor(num(decimals))));
  const minD = Math.min(d, 2);
  return num(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: minD });
}

export function computeMetrics(state: AppState): ComputedMetrics {
  const ingCount = state.ing.length;
  const ingIndexMap = new Map<string, number>();
  state.ing.forEach((g, i) => ingIndexMap.set(g.id, i));

  // Sales quantity per recipe
  const rq: Record<string, number> = {};
  state.sales.forEach(s => {
    if (s.recipeId) {
      rq[s.recipeId] = (rq[s.recipeId] || 0) + num(s.qty);
    }
  });

  // Raw theoretical demand for each ingredient
  const raw: number[] = new Array(ingCount).fill(0);
  state.recipes.forEach(r => {
    const q = rq[r.id] || 0;
    if (!q) return;
    r.items.forEach(it => {
      const idx = ingIndexMap.get(it.ingredientId);
      if (idx !== undefined && idx >= 0 && idx < ingCount) {
        raw[idx] += num(it.std) * q;
      }
    });
  });

  // Adjusted theoretical demand (divided by yield)
  const adj = raw.map((v, i) => {
    const y = num(state.ing[i]?.yield) || 1;
    return v / y;
  });

  // Filter ledger transactions within current active period
  const inPeriodLedger = state.ledger.filter(x => x.date >= state.dFrom && x.date <= state.dTo);

  const recv: number[] = new Array(ingCount).fill(0);
  const tin: number[] = new Array(ingCount).fill(0);
  const tout: number[] = new Array(ingCount).fill(0);
  const waste: number[] = new Array(ingCount).fill(0);
  const production_in: number[] = new Array(ingCount).fill(0);
  const production_consume: number[] = new Array(ingCount).fill(0);

  inPeriodLedger.forEach(x => {
    const idx = ingIndexMap.get(x.ingredientId);
    if (idx !== undefined && idx >= 0 && idx < ingCount) {
      const q = num(x.qty);
      if (x.type === 'recv') recv[idx] += q;
      else if (x.type === 'tin') tin[idx] += q;
      else if (x.type === 'tout') tout[idx] += q;
      else if (x.type === 'waste') waste[idx] += q;
      else if (x.type === 'production_in') production_in[idx] += q;
      else if (x.type === 'production_consume') production_consume[idx] += q;
    }
  });

  // Actual consumption formula:
  // Actual = Beg + Recv + Tin + Prod_In - Tout - Waste - Prod_Consume - End
  const actual: number[] = state.ing.map((_, i) => {
    const beg = num(state.beg[i]);
    const end = num(state.end[i]);
    return beg + recv[i] + tin[i] + production_in[i] - tout[i] - waste[i] - production_consume[i] - end;
  });

  // Variance = Adjusted Theoretical - Actual
  const vari: number[] = adj.map((v, i) => v - actual[i]);
  const cvar: number[] = vari.map((v, i) => v * num(state.ing[i]?.price));

  const salesTotal = state.sales.reduce((acc, s) => acc + num(s.qty) * num(s.price), 0);
  const idealCost = adj.reduce((acc, v, i) => acc + v * num(state.ing[i]?.price), 0);
  const wasteCost = waste.reduce((acc, v, i) => acc + v * num(state.ing[i]?.price), 0);
  const varCost = cvar.reduce((acc, b) => acc + b, 0);
  const stockValue = state.end.reduce((acc, v, i) => acc + num(v) * num(state.ing[i]?.price), 0);
  const days = dateDiff(state.dFrom, state.dTo);
  const foodCostPct = salesTotal > 0 ? (idealCost / salesTotal) * 100 : 0;

  // Period expenses
  const inPeriodExpenses = (state.expenses || []).filter(e => e.date >= state.dFrom && e.date <= state.dTo);
  const totalExpenses = inPeriodExpenses.reduce((sum, e) => sum + num(e.total), 0);
  const foodExpenses = inPeriodExpenses.filter(e => e.type === 'food').reduce((sum, e) => sum + num(e.total), 0);
  const nonFoodExpenses = inPeriodExpenses.filter(e => e.type === 'non_food').reduce((sum, e) => sum + num(e.total), 0);

  return {
    rq,
    raw,
    adj,
    recv,
    tin,
    tout,
    waste,
    production_in,
    production_consume,
    actual,
    vari,
    cvar,
    salesTotal,
    idealCost,
    varCost,
    wasteCost,
    negCount: vari.filter(v => v < 0).length,
    noRecipe: state.sales.filter(s => num(s.qty) > 0 && !s.recipeId).length,
    stockValue,
    days,
    foodCostPct,
    totalExpenses,
    foodExpenses,
    nonFoodExpenses
  };
}

export function getRecipeUnitCost(recipe: { items: { ingredientId: string; std: number }[] }, ingList: { id: string; price: number }[]): number {
  const ingMap = new Map(ingList.map(g => [g.id, g.price]));
  return recipe.items.reduce((acc, it) => {
    const p = ingMap.get(it.ingredientId) || 0;
    return acc + num(it.std) * num(p);
  }, 0);
}

export function getRecipeAvgSellingPrice(recipeId: string, sales: { recipeId: string; price: number; qty: number }[]): number {
  let totalRev = 0;
  let totalQty = 0;
  sales.forEach(s => {
    if (s.recipeId === recipeId) {
      totalRev += num(s.price) * num(s.qty);
      totalQty += num(s.qty);
    }
  });
  return totalQty > 0 ? totalRev / totalQty : 0;
}

export function calculateMenuEngineering(
  sales: SaleItem[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  options: { hurdleFactor?: number; selectedGroup?: string } = {}
): { items: MenuEngineeringItem[]; summary: MenuEngineeringSummary } {
  const hurdleFactor = options.hurdleFactor ?? 0.7; // Standard 70% menu engineering hurdle rate
  const selectedGroup = options.selectedGroup || 'all';

  // Filter by group if needed
  const filteredSales = selectedGroup === 'all'
    ? sales
    : sales.filter(s => (s.group || 'عام') === selectedGroup);

  const recipeMap = new Map(recipes.map(r => [r.id, r]));
  const recipeCodeMap = new Map(recipes.map(r => [r.code, r]));

  // Calculate costs and metrics for each sale item
  const rawItems = filteredSales.map(sale => {
    let recipe = sale.recipeId ? recipeMap.get(sale.recipeId) : undefined;
    if (!recipe && sale.recipeCode) {
      recipe = recipeCodeMap.get(sale.recipeCode);
    }
    if (!recipe && sale.code) {
      recipe = recipeCodeMap.get(sale.code);
    }

    const cost = recipe ? getRecipeUnitCost(recipe, ingredients) : 0;
    const price = num(sale.price);
    const qty = num(sale.qty);
    const margin = price - cost;
    const foodCostPct = price > 0 ? (cost / price) * 100 : 0;
    const totalRevenue = qty * price;
    const totalCost = qty * cost;
    const totalProfit = qty * margin;

    return {
      sale,
      recipe,
      qty,
      price,
      cost,
      margin,
      foodCostPct,
      totalRevenue,
      totalCost,
      totalProfit
    };
  });

  const totalQty = rawItems.reduce((acc, it) => acc + it.qty, 0);
  const totalRevenue = rawItems.reduce((acc, it) => acc + it.totalRevenue, 0);
  const totalCost = rawItems.reduce((acc, it) => acc + it.totalCost, 0);
  const totalProfit = rawItems.reduce((acc, it) => acc + it.totalProfit, 0);
  const itemsCount = rawItems.length;

  const avgQtyPerItem = itemsCount > 0 ? totalQty / itemsCount : 0;
  const benchmarkQty = avgQtyPerItem * hurdleFactor;
  const popularityBenchmarkPct = totalQty > 0 ? (benchmarkQty / totalQty) * 100 : (itemsCount > 0 ? (100 / itemsCount) * hurdleFactor : 0);

  // Weighted Average Contribution Margin
  const avgMargin = totalQty > 0 ? totalProfit / totalQty : (itemsCount > 0 ? rawItems.reduce((a, b) => a + b.margin, 0) / itemsCount : 0);
  const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
  const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
  const overallFoodCostPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  const items: MenuEngineeringItem[] = rawItems.map(it => {
    const isHighPopularity = it.qty >= benchmarkQty;
    const isHighProfitability = it.margin >= avgMargin;

    let category: 'star' | 'horse' | 'puzzle' | 'dog';
    let strategyAr = '';
    let strategyEn = '';

    if (isHighPopularity && isHighProfitability) {
      category = 'star';
      strategyAr = '⭐ نجم المنيو: حافظ على ثبات الجودة وحجم الحصة، واجعله في موقع بارز بصدارة القائمة.';
      strategyEn = 'Star: Maintain quality and portion control. Keep prominent menu placement.';
    } else if (isHighPopularity && !isHighProfitability) {
      category = 'horse';
      strategyAr = '🐎 حصان العمل (شائع منخفض الربح): اختبر رفع السعر تدريجياً، أو وفّر في تكلفة المكونات، أو ادمجه مع إضافات مربحة.';
      strategyEn = 'Plowhorse: High volume, low margin. Test small price bump, trim ingredient cost, or pair with sides.';
    } else if (!isHighPopularity && isHighProfitability) {
      category = 'puzzle';
      strategyAr = '🧩 اللغز (ربح مرتفع مبيعات قليلة): حسّن تموضعه في المنيو، ودرب طاقم الصالة على ترشيحه (Upselling)، وفعّل عروضاً تسويقية.';
      strategyEn = 'Puzzle: High margin, low volume. Reposition on menu, train servers to upsell, and run promotions.';
    } else {
      category = 'dog';
      strategyAr = '🐕 صنف متعثر: مبيعات وأرباح متدنية؛ ادرس استبداله بابتكار جديد أو رفع سعره أو تقليص مخزونه.';
      strategyEn = 'Dog: Low volume & profit. Consider menu rationalization, repricing, or replacing with a new concept.';
    }

    const menuMixPct = totalQty > 0 ? (it.qty / totalQty) * 100 : 0;
    const profitSharePct = totalProfit > 0 ? (it.totalProfit / totalProfit) * 100 : 0;

    return {
      id: it.sale.id,
      code: it.sale.code,
      name: it.sale.name,
      nameEn: it.sale.nameEn,
      group: it.sale.group || 'عام',
      qty: it.qty,
      price: it.price,
      cost: it.cost,
      margin: it.margin,
      foodCostPct: it.foodCostPct,
      totalRevenue: it.totalRevenue,
      totalCost: it.totalCost,
      totalProfit: it.totalProfit,
      menuMixPct,
      profitSharePct,
      isHighPopularity,
      isHighProfitability,
      category,
      recipeId: it.recipe?.id,
      recipeCode: it.recipe?.code,
      strategyAr,
      strategyEn
    };
  });

  const stars = items.filter(i => i.category === 'star');
  const horses = items.filter(i => i.category === 'horse');
  const puzzles = items.filter(i => i.category === 'puzzle');
  const dogs = items.filter(i => i.category === 'dog');

  const summary: MenuEngineeringSummary = {
    totalQty,
    totalRevenue,
    totalCost,
    totalProfit,
    overallFoodCostPct,
    avgPrice,
    avgCost,
    avgMargin,
    avgQtyPerItem,
    popularityBenchmarkPct,
    itemsCount,
    starsCount: stars.length,
    horsesCount: horses.length,
    puzzlesCount: puzzles.length,
    dogsCount: dogs.length,
    starsProfit: stars.reduce((a, b) => a + b.totalProfit, 0),
    horsesProfit: horses.reduce((a, b) => a + b.totalProfit, 0),
    puzzlesProfit: puzzles.reduce((a, b) => a + b.totalProfit, 0),
    dogsProfit: dogs.reduce((a, b) => a + b.totalProfit, 0),
    starsQty: stars.reduce((a, b) => a + b.qty, 0),
    horsesQty: horses.reduce((a, b) => a + b.qty, 0),
    puzzlesQty: puzzles.reduce((a, b) => a + b.qty, 0),
    dogsQty: dogs.reduce((a, b) => a + b.qty, 0)
  };

  return { items, summary };
}

export interface ExpenseMetricsResult {
  filteredExpenses: ExpenseRecord[];
  totalExpenses: number;
  foodExpenses: number;
  nonFoodExpenses: number;
  count: number;
  avgExpense: number;
  topCategory: { name: string; total: number; pct: number } | null;
  categoryBreakdown: Array<{
    categoryId: string;
    name: string;
    color: string;
    count: number;
    total: number;
    pct: number;
  }>;
  foodItemBreakdown: Array<{
    ingredientId: string;
    name: string;
    catName: string;
    unit: string;
    qty: number;
    totalCost: number;
    avgUnitPrice: number;
  }>;
  supplierBreakdown: Array<{
    supplier: string;
    invoicesCount: number;
    foodTotal: number;
    nonFoodTotal: number;
    total: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    total: number;
    pct: number;
  }>;
  dailyTrend: Array<{
    date: string;
    foodTotal: number;
    nonFoodTotal: number;
    total: number;
  }>;
}

export function computeExpenseMetrics(
  expenses: ExpenseRecord[],
  categories: ExpenseCategory[],
  ingredients: Ingredient[],
  fromDate?: string,
  toDate?: string
): ExpenseMetricsResult {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const ingMap = new Map(ingredients.map(g => [g.id, g]));

  const filteredExpenses = (expenses || []).filter(e => {
    if (fromDate && e.date < fromDate) return false;
    if (toDate && e.date > toDate) return false;
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + num(e.total), 0);
  const foodExpenses = filteredExpenses.filter(e => e.type === 'food').reduce((sum, e) => sum + num(e.total), 0);
  const nonFoodExpenses = filteredExpenses.filter(e => e.type === 'non_food').reduce((sum, e) => sum + num(e.total), 0);
  const count = filteredExpenses.length;
  const avgExpense = count > 0 ? totalExpenses / count : 0;

  // Category breakdown
  const catAgg: Record<string, { count: number; total: number }> = {};
  filteredExpenses.forEach(e => {
    const cid = e.categoryId || 'other';
    if (!catAgg[cid]) catAgg[cid] = { count: 0, total: 0 };
    catAgg[cid].count += 1;
    catAgg[cid].total += num(e.total);
  });

  const categoryBreakdown = Object.keys(catAgg).map(cid => {
    const cObj = catMap.get(cid);
    const total = catAgg[cid].total;
    return {
      categoryId: cid,
      name: cObj?.name || cid,
      color: cObj?.color || '#64748b',
      count: catAgg[cid].count,
      total,
      pct: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
    };
  }).sort((a, b) => b.total - a.total);

  const topCategory = categoryBreakdown.length > 0 ? {
    name: categoryBreakdown[0].name,
    total: categoryBreakdown[0].total,
    pct: categoryBreakdown[0].pct
  } : null;

  // Food Item breakdown
  const foodAgg: Record<string, { qty: number; totalCost: number }> = {};
  filteredExpenses.filter(e => e.type === 'food' && e.ingredientId).forEach(e => {
    const iid = e.ingredientId!;
    if (!foodAgg[iid]) foodAgg[iid] = { qty: 0, totalCost: 0 };
    foodAgg[iid].qty += num(e.qty);
    foodAgg[iid].totalCost += num(e.total);
  });

  const foodItemBreakdown = Object.keys(foodAgg).map(iid => {
    const ing = ingMap.get(iid);
    const qty = foodAgg[iid].qty;
    const totalCost = foodAgg[iid].totalCost;
    return {
      ingredientId: iid,
      name: ing?.name || iid,
      catName: ing ? `قسم ${ing.cat}` : '—',
      unit: ing?.unit || 'وحدة',
      qty,
      totalCost,
      avgUnitPrice: qty > 0 ? totalCost / qty : 0
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  // Supplier breakdown
  const supAgg: Record<string, { invoices: Set<string>; foodTotal: number; nonFoodTotal: number; total: number }> = {};
  filteredExpenses.forEach(e => {
    const sup = (e.supplier && e.supplier.trim()) ? e.supplier.trim() : 'عام / غير محدد';
    if (!supAgg[sup]) supAgg[sup] = { invoices: new Set(), foodTotal: 0, nonFoodTotal: 0, total: 0 };
    supAgg[sup].invoices.add(e.reference || e.id);
    const val = num(e.total);
    supAgg[sup].total += val;
    if (e.type === 'food') supAgg[sup].foodTotal += val;
    else supAgg[sup].nonFoodTotal += val;
  });

  const supplierBreakdown = Object.keys(supAgg).map(sup => ({
    supplier: sup,
    invoicesCount: supAgg[sup].invoices.size,
    foodTotal: supAgg[sup].foodTotal,
    nonFoodTotal: supAgg[sup].nonFoodTotal,
    total: supAgg[sup].total
  })).sort((a, b) => b.total - a.total);

  // Payment method breakdown
  const pmAgg: Record<string, { count: number; total: number }> = {};
  filteredExpenses.forEach(e => {
    const pm = (e.paymentMethod && e.paymentMethod.trim()) ? e.paymentMethod.trim() : 'نقدي';
    if (!pmAgg[pm]) pmAgg[pm] = { count: 0, total: 0 };
    pmAgg[pm].count += 1;
    pmAgg[pm].total += num(e.total);
  });

  const paymentMethodBreakdown = Object.keys(pmAgg).map(pm => {
    const total = pmAgg[pm].total;
    return {
      method: pm,
      count: pmAgg[pm].count,
      total,
      pct: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
    };
  }).sort((a, b) => b.total - a.total);

  // Daily Trend
  const dateAgg: Record<string, { foodTotal: number; nonFoodTotal: number; total: number }> = {};
  filteredExpenses.forEach(e => {
    const d = e.date || '—';
    if (!dateAgg[d]) dateAgg[d] = { foodTotal: 0, nonFoodTotal: 0, total: 0 };
    const val = num(e.total);
    dateAgg[d].total += val;
    if (e.type === 'food') dateAgg[d].foodTotal += val;
    else dateAgg[d].nonFoodTotal += val;
  });

  const dailyTrend = Object.keys(dateAgg).sort().map(d => ({
    date: d,
    foodTotal: dateAgg[d].foodTotal,
    nonFoodTotal: dateAgg[d].nonFoodTotal,
    total: dateAgg[d].total
  }));

  return {
    filteredExpenses,
    totalExpenses,
    foodExpenses,
    nonFoodExpenses,
    count,
    avgExpense,
    topCategory,
    categoryBreakdown,
    foodItemBreakdown,
    supplierBreakdown,
    paymentMethodBreakdown,
    dailyTrend
  };
}

