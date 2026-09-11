export type Language = 'ar' | 'en' | 'fr';

export type ActiveTab = 'dash' | 'sales' | 'recipes' | 'ideal' | 'moves' | 'ledger' | 'summary' | 'par' | 'prep' | 'forecast' | 'menu_eng' | 'expenses' | 'users' | 'audit' | 'help';

export type UserRole = 'admin' | 'manager' | 'kitchen' | 'purchasing' | 'viewer';

export interface UserPermissions {
  view: boolean;
  canEditSales: boolean;
  canEditRecipes: boolean;
  canEditPrices: boolean;
  canRecordTransactions: boolean;
  canEditInventory: boolean;
  canEditExpenses?: boolean;
  canManageUsers: boolean;
  canExport: boolean;
  canViewAudit: boolean;
  write_sales?: boolean;
  write_recipes?: boolean;
  write_inventory?: boolean;
  write_production?: boolean;
  write_expenses?: boolean;
  manage_expense_categories?: boolean;
  manage_users?: boolean;
  view_audit?: boolean;
  export?: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  nameEn?: string;
  unit: string;
  cat: number;
  price: number;
  yield: number;
}

export interface RecipeItem {
  ingredientId: string;
  ing: string;
  std: number;
}

export interface Recipe {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  items: RecipeItem[];
}

export interface SaleItem {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  group: string;
  qty: number;
  price: number;
  recipeId: string;
  recipeCode: string;
}

export type MovementType = 'recv' | 'tin' | 'tout' | 'waste' | 'production_in' | 'production_consume';

export interface LedgerTransaction {
  id: string;
  date: string;
  type: MovementType;
  ingredientId: string;
  qty: number;
  unit: string;
  reference: string;
  note: string;
  user: string;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  at: string;
  user: string;
  action: string;
  details: string;
}

export interface PrepItem {
  name: string;
  recipeCode: string;
  batchSize: number;
}

export type ExpenseType = 'food' | 'non_food';

export interface ExpenseCategory {
  id: string;
  name: string;
  nameEn?: string;
  nameFr?: string;
  type?: 'food' | 'non_food' | 'all';
  color?: string;
  icon?: string;
  active: boolean;
  order?: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  reference: string;
  categoryId: string;
  type: ExpenseType;
  ingredientId: string | null;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  supplier: string;
  paymentMethod: string;
  inventoryTransactionId: string | null;
  note: string;
  user: string;
  createdAt: string;
}

export interface AppState {
  version: number;
  ing: Ingredient[];
  sales: SaleItem[];
  recipes: Recipe[];
  ledger: LedgerTransaction[];
  beg: number[];
  end: number[];
  expenses: ExpenseRecord[];
  expenseCategories: ExpenseCategory[];
  paymentMethods: string[];
  parDays: number;
  roundUp: boolean;
  dFrom: string;
  dTo: string;
  users: User[];
  audit: AuditRecord[];
  settings: {
    currency: string;
    language: Language;
  };
  lastBackup: string;
}

export interface ComputedMetrics {
  rq: Record<string, number>;
  raw: number[];
  adj: number[];
  recv: number[];
  tin: number[];
  tout: number[];
  waste: number[];
  production_in: number[];
  production_consume: number[];
  actual: number[];
  vari: number[];
  cvar: number[];
  salesTotal: number;
  idealCost: number;
  varCost: number;
  wasteCost: number;
  negCount: number;
  noRecipe: number;
  stockValue: number;
  days: number;
  foodCostPct: number;
  totalExpenses?: number;
  foodExpenses?: number;
  nonFoodExpenses?: number;
}

export type MenuEngineeringCategory = 'star' | 'horse' | 'puzzle' | 'dog';

export interface MenuEngineeringItem {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  group: string;
  qty: number;
  price: number;
  cost: number;
  margin: number; // CM: price - cost
  foodCostPct: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  menuMixPct: number; // popularity %
  profitSharePct: number; // profit share %
  isHighPopularity: boolean;
  isHighProfitability: boolean;
  category: MenuEngineeringCategory;
  recipeId?: string;
  recipeCode?: string;
  strategyAr: string;
  strategyEn: string;
}

export interface MenuEngineeringSummary {
  totalQty: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallFoodCostPct: number;
  avgPrice: number;
  avgCost: number;
  avgMargin: number;
  avgQtyPerItem: number;
  popularityBenchmarkPct: number;
  itemsCount: number;
  starsCount: number;
  horsesCount: number;
  puzzlesCount: number;
  dogsCount: number;
  starsProfit: number;
  horsesProfit: number;
  puzzlesProfit: number;
  dogsProfit: number;
  starsQty: number;
  horsesQty: number;
  puzzlesQty: number;
  dogsQty: number;
}

export interface PrepLinkedDish {
  dishCode: string;
  dishName: string;
  dishGroup: string;
  soldQty: number;
  portionStd: number;
  totalDemand: number;
}

export interface PrepSubIngredientDetail {
  ingId: string;
  ingName: string;
  unit: string;
  unitPrice: number;
  qtyPerBatch: number;
  totalQtyNeeded: number;
  totalCost: number;
}

export interface PrepProductionLink {
  id: string;
  prepItem: PrepItem;
  ingredient?: Ingredient;
  recipe?: Recipe;
  linkedDishes: PrepLinkedDish[];
  totalDemand: number;
  batchSize: number;
  batchesExact: number;
  batchesSuggested: number;
  expectedOutput: number;
  postedBatches: number;
  postedQty: number;
  remainingBatches: number;
  subIngredients: PrepSubIngredientDetail[];
  batchCost: number;
  totalProductionCost: number;
}

