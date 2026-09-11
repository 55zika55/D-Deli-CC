import React, { useState, useEffect } from 'react';
import { 
  AppState, 
  Ingredient,
  Recipe,
  SaleItem,
  User, 
  Language, 
  ActiveTab, 
  MovementType, 
  PrepItem,
  ExpenseRecord,
  ExpenseCategory 
} from './types';
import { TRANSLATIONS, ROLE_PERMS_MAP } from './translations';
import { INITIAL_STATE, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_PAYMENT_METHODS } from './initialData';
import { computeMetrics, num } from './utils/calculations';

// Components
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { DashboardTab } from './components/DashboardTab';
import { SalesTab } from './components/SalesTab';
import { RecipesTab } from './components/RecipesTab';
import { IdealTab } from './components/IdealTab';
import { MovesTab } from './components/MovesTab';
import { LedgerTab } from './components/LedgerTab';
import { SummaryTab } from './components/SummaryTab';
import { ParTab } from './components/ParTab';
import { PrepTab } from './components/PrepTab';
import { ForecastTab } from './components/ForecastTab';
import { MenuEngineeringTab } from './components/MenuEngineeringTab';
import { ExpensesTab } from './components/ExpensesTab';
import { UsersTab } from './components/UsersTab';
import { AuditTab } from './components/AuditTab';
import { HelpTab } from './components/HelpTab';
import { PrintRecipeModal } from './components/PrintRecipeModal';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';
import { ReportsPrintModal, ReportType } from './components/ReportsPrintModal';

// Icons
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Calculator, 
  PackagePlus, 
  ClipboardList, 
  Scale, 
  ShoppingCart, 
  Factory, 
  TrendingUp,
  Sparkles,
  Wallet,
  Users, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

const STORAGE_KEY = 'DDELI_V4_STATE_BURGER_RECIPES_EXACT_V4_5';
const USER_SESSION_KEY = 'DDELI_V3_USER';
const LANG_STORAGE_KEY = 'DDELI_V3_LANG';

export const App: React.FC = () => {
  // 1. Language state
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return (localStorage.getItem(LANG_STORAGE_KEY) as Language) || 'ar';
  });

  // 2. Application Core State
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ing && parsed.recipes && parsed.sales) {
          // Master ingredient synchronization:
          // Preserve any custom user-edited prices or yields from local storage,
          // but ensure all ingredients from INITIAL_STATE are present with canonical unique IDs.
          const userIngMap = new Map<string, Ingredient>();
          parsed.ing.forEach((item: Ingredient) => {
            if (item && item.name) {
              userIngMap.set(item.name.trim(), item);
            }
          });

          parsed.ing = INITIAL_STATE.ing.map((canonicalIng) => {
            const userItem = userIngMap.get(canonicalIng.name.trim());
            if (userItem) {
              return {
                ...canonicalIng,
                price: typeof userItem.price === 'number' ? userItem.price : canonicalIng.price,
                yield: typeof userItem.yield === 'number' ? userItem.yield : canonicalIng.yield
              };
            }
            return canonicalIng;
          });

          // Version 5 migration: Wipe old sales and load the official August 2026 sales report
          if (!parsed.version || parsed.version < 5) {
            parsed.version = 5;
            parsed.sales = INITIAL_STATE.sales;
            parsed.dFrom = "2026-08-01";
            parsed.dTo = "2026-08-31";
          }

          // Always ensure latest clean recipe definitions (including the 5 exact pizzas from the image)
          parsed.recipes = INITIAL_STATE.recipes;

          // Update sales recipe linkages and pizza items
          const recipeCodeMap = new Map<string, string>(parsed.recipes.map((r: Recipe) => [r.code, r.id]));
          const pizzaSkuMap: Record<string, { name: string; recipeCode: string; price: number }> = {
            'SKU140': { name: 'بيتزا تشيكن رانش (Fried Chicken Ranch)', recipeCode: 'RCP-140', price: 125.00 },
            'SKU116': { name: 'بيتزا بيبروني (Pepperoni)', recipeCode: 'RCP-127', price: 85.00 },
            'SKU117': { name: 'بيتزا مارجريتا (Margarita)', recipeCode: 'RCP-126', price: 90.00 },
            'SKU113': { name: 'بيتزا تشيكن ماشروم (Chicken Mushroom)', recipeCode: 'RCP-128', price: 105.00 },
            'SKU118': { name: 'بيتزا خضار (Vegeterian)', recipeCode: 'RCP-129', price: 80.00 },
          };

          parsed.sales.forEach((s: SaleItem) => {
            const pz = pizzaSkuMap[s.code];
            if (pz) {
              s.name = pz.name;
              s.recipeCode = pz.recipeCode;
              s.group = 'Pizza';
              if (!s.price || s.price <= 0) s.price = pz.price;
            }
            if (s.recipeCode && recipeCodeMap.has(s.recipeCode)) {
              s.recipeId = recipeCodeMap.get(s.recipeCode)!;
            }
          });

          // Ensure array lengths for beg and end match ing length
          if (!parsed.beg) parsed.beg = [];
          if (!parsed.end) parsed.end = [];
          while (parsed.beg.length < parsed.ing.length) parsed.beg.push(0);
          while (parsed.end.length < parsed.ing.length) parsed.end.push(0);
          if (parsed.beg.length > parsed.ing.length) parsed.beg = parsed.beg.slice(0, parsed.ing.length);
          if (parsed.end.length > parsed.ing.length) parsed.end = parsed.end.slice(0, parsed.ing.length);

          // Ensure expenses, expenseCategories, and paymentMethods are initialized
          if (!parsed.expenses) parsed.expenses = [];
          if (!parsed.expenseCategories || parsed.expenseCategories.length === 0) {
            parsed.expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
          }
          if (!parsed.paymentMethods || parsed.paymentMethods.length === 0) {
            parsed.paymentMethods = DEFAULT_PAYMENT_METHODS;
          }

          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse stored state:', e);
      }
    }
    // Return clean initial state by default
    return INITIAL_STATE;
  });

  // 3. User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = sessionStorage.getItem(USER_SESSION_KEY);
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 4. Navigation Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dash');

  // 5. Recipe Print Modal State
  const [printRecipeIndex, setPrintRecipeIndex] = useState<number | 'all' | null>(null);

  // 6. System Diagnostics Modal State
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // 7. Comprehensive Reports & PDF Print Modal State
  const [reportsPrintModalReport, setReportsPrintModalReport] = useState<ReportType | null>(null);

  // Auto-save state to localStorage
  const saveStateToStorage = (newState: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Audit logger helper
  const logAudit = (action: string, details: string) => {
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      at: new Date().toLocaleString(),
      user: currentUser ? currentUser.name : 'System',
      action,
      details
    };
    setState(prev => {
      const updated = {
        ...prev,
        audit: [...(prev.audit || []), newLog]
      };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    logAudit('user_login', `Logged in as ${user.username} (${user.role})`);
  };

  const handleLogout = () => {
    if (currentUser) {
      logAudit('user_logout', `User ${currentUser.username} logged out`);
    }
    setCurrentUser(null);
    sessionStorage.removeItem(USER_SESSION_KEY);
  };

  // Permissions check
  const userPerms = currentUser ? (ROLE_PERMS_MAP[currentUser.role] || ROLE_PERMS_MAP.viewer) : ROLE_PERMS_MAP.viewer;

  // Computed metrics
  const metrics = computeMetrics(state);

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  // Manual save trigger with feedback
  const handleSave = () => {
    saveStateToStorage(state);
    logAudit('manual_save', 'Manual state save triggered by user');
    alert('✓ تم حفظ جميع البيانات والإعدادات بنجاح!');
  };

  const handleImportState = (newState: AppState) => {
    setState(newState);
    saveStateToStorage(newState);
    alert('✓ تم استيراد البيانات وتحديث النظام بنجاح!');
  };

  const handleSetPeriod = (dFrom: string, dTo: string) => {
    setState(prev => {
      const updated = { ...prev, dFrom, dTo };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('period_change', `Changed date range: ${dFrom} to ${dTo}`);
  };

  // Sales Handlers
  const handleUpdateSale = (index: number, field: string, value: string | number) => {
    setState(prev => {
      const newSales = [...prev.sales];
      newSales[index] = { ...newSales[index], [field]: value };
      const updated = { ...prev, sales: newSales };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleAddSale = (item?: Partial<SaleItem>) => {
    setState(prev => {
      const newId = item?.code || ('SKU_' + (prev.sales.length + 1).toString().padStart(3, '0'));
      const newSales = [
        ...prev.sales,
        {
          id: newId,
          code: newId,
          name: item?.name || 'صنف مبيعات جديد',
          group: item?.group || 'وجبات',
          qty: item?.qty !== undefined ? item.qty : 1,
          price: item?.price !== undefined ? item.price : 100,
          recipeId: item?.recipeId !== undefined ? item.recipeId : (prev.recipes[0]?.id || '')
        }
      ];
      const updated = { ...prev, sales: newSales };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('add_sale_item', `Added new sales SKU item: ${item?.name || 'New SKU'}`);
  };

  const handleDeleteSale = (index: number) => {
    setState(prev => {
      const newSales = prev.sales.filter((_, i) => i !== index);
      const updated = { ...prev, sales: newSales };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('delete_sale_item', `Deleted sales item at index ${index}`);
  };

  const handleResetToAugustSales = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في استعادة مبيعات تقرير شهر أغسطس 2026 الرسمية وحذف أي أصناف أو مبيعات قديمة؟")) {
      setState(prev => {
        const updated = {
          ...prev,
          version: 5,
          sales: INITIAL_STATE.sales,
          dFrom: "2026-08-01",
          dTo: "2026-08-31"
        };
        saveStateToStorage(updated);
        return updated;
      });
      logAudit('reset_august_sales', 'استعادة مبيعات تقرير أغسطس 2026 الرسمية وحذف البيانات القديمة (7,683 صنف - 569,730 ج.م)');
    }
  };

  // Recipe Handlers
  const handleAddRecipe = () => {
    setState(prev => {
      const newId = 'R' + (prev.recipes.length + 1).toString().padStart(3, '0');
      const newRecipes = [
        ...prev.recipes,
        {
          id: newId,
          code: 'RCP-' + (prev.recipes.length + 1),
          name: 'وصفة جديدة',
          items: [{ ingredientId: prev.ing[0]?.id || '', std: 100 }]
        }
      ];
      const updated = { ...prev, recipes: newRecipes };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('add_recipe', 'Created new recipe');
  };

  const handleDeleteRecipe = (index: number) => {
    setState(prev => {
      const newRecipes = prev.recipes.filter((_, i) => i !== index);
      const updated = { ...prev, recipes: newRecipes };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('delete_recipe', `Deleted recipe at index ${index}`);
  };

  const handleUpdateRecipeName = (recipeIndex: number, name: string) => {
    setState(prev => {
      const newRecipes = [...prev.recipes];
      newRecipes[recipeIndex] = { ...newRecipes[recipeIndex], name };
      const updated = { ...prev, recipes: newRecipes };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleAddRecipeItem = (recipeIndex: number) => {
    setState(prev => {
      const newRecipes = [...prev.recipes];
      const items = [...newRecipes[recipeIndex].items, { ingredientId: prev.ing[0]?.id || '', std: 100 }];
      newRecipes[recipeIndex] = { ...newRecipes[recipeIndex], items };
      const updated = { ...prev, recipes: newRecipes };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleDeleteRecipeItem = (recipeIndex: number, itemIndex: number) => {
    setState(prev => {
      const newRecipes = [...prev.recipes];
      const items = newRecipes[recipeIndex].items.filter((_, i) => i !== itemIndex);
      newRecipes[recipeIndex] = { ...newRecipes[recipeIndex], items };
      const updated = { ...prev, recipes: newRecipes };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleUpdateRecipeItem = (
    recipeIndex: number,
    itemIndex: number,
    field: 'ingredientId' | 'std',
    value: string | number
  ) => {
    setState(prev => {
      const newRecipes = [...prev.recipes];
      const items = [...newRecipes[recipeIndex].items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      newRecipes[recipeIndex] = { ...newRecipes[recipeIndex], items };
      const updated = { ...prev, recipes: newRecipes };
      saveStateToStorage(updated);
      return updated;
    });
  };

  // Ingredient Handlers
  const handleUpdateIngredient = (index: number, field: 'price' | 'yield', value: number) => {
    setState(prev => {
      const newIng = [...prev.ing];
      newIng[index] = { ...newIng[index], [field]: value };
      const updated = { ...prev, ing: newIng };
      saveStateToStorage(updated);
      return updated;
    });
  };

  // Inventory count Handlers
  const handleUpdateInventoryCount = (index: number, field: 'beg' | 'end', value: number) => {
    setState(prev => {
      const targetArray = field === 'beg' ? [...prev.beg] : [...prev.end];
      targetArray[index] = value;
      const updated = {
        ...prev,
        [field]: targetArray
      };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleBatchUpdateEndCounts = (newEndCounts: number[]) => {
    setState(prev => {
      const updated = {
        ...prev,
        end: newEndCounts
      };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('batch_inventory_count', `Recorded physical inventory counts for ${newEndCounts.length} items`);
  };

  // Movement / Ledger Transaction Handlers
  const handleAddTransaction = (tx: {
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }) => {
    const ingObj = state.ing.find(g => g.id === tx.ingredientId);
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      date: tx.date,
      type: tx.type,
      ingredientId: tx.ingredientId,
      qty: tx.qty,
      unit: ingObj?.unit || '',
      price: ingObj?.price || 0,
      totalCost: (ingObj?.price || 0) * tx.qty,
      reference: tx.reference,
      note: tx.note,
      user: currentUser ? currentUser.name : 'Admin',
      createdAt: new Date().toISOString()
    };

    setState(prev => {
      const updated = {
        ...prev,
        ledger: [...prev.ledger, newTx]
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('add_transaction', `Added ${tx.type} transaction for ${tx.ingredientId} qty ${tx.qty}`);
  };

  const handleBatchAddTransactions = (txs: Array<{
    date: string;
    type: MovementType;
    ingredientId: string;
    qty: number;
    reference: string;
    note: string;
  }>) => {
    if (!txs || txs.length === 0) return;
    const now = new Date().toISOString();
    const userName = currentUser ? currentUser.name : 'Admin';
    
    const newTransactions = txs.map((tx, idx) => {
      const ingObj = state.ing.find(g => g.id === tx.ingredientId);
      return {
        id: 'tx_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
        date: tx.date,
        type: tx.type,
        ingredientId: tx.ingredientId,
        qty: tx.qty,
        unit: ingObj?.unit || '',
        price: ingObj?.price || 0,
        totalCost: (ingObj?.price || 0) * tx.qty,
        reference: tx.reference,
        note: tx.note,
        user: userName,
        createdAt: now
      };
    });

    setState(prev => {
      const updated = {
        ...prev,
        ledger: [...prev.ledger, ...newTransactions]
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('batch_add_transactions', `Batch added ${newTransactions.length} transactions (${txs[0]?.type || 'movement'}) for date ${txs[0]?.date}`);
  };

  const handleDeleteTransaction = (id: string) => {
    setState(prev => {
      const updated = {
        ...prev,
        ledger: prev.ledger.filter(tx => tx.id !== id)
      };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('delete_transaction', `Deleted transaction ${id}`);
  };

  // Par days handler
  const handleUpdateParDays = (days: number) => {
    setState(prev => {
      const updated = { ...prev, parDays: days };
      saveStateToStorage(updated);
      return updated;
    });
  };

  // Internal prep batch execution handler
  const handlePostProduction = (prepItem: PrepItem, batches: number, date: string) => {
    let producedIng = state.ing.find(g => g.name === prepItem.name);
    if (!producedIng) {
      if (prepItem.name.includes('عجين بيتزا')) {
        producedIng = state.ing.find(g => g.name.includes('عجين بيتزا') || g.name === 'بورشن عجين بيتزا');
      } else if (prepItem.name.includes('صلصه طماطم')) {
        producedIng = state.ing.find(g => g.name.includes('صلصه طماطم') || g.name === 'صلصه طماطم بيتزا');
      } else if (prepItem.name.includes('كينوا')) {
        producedIng = state.ing.find(g => g.name.includes('كينوا'));
      } else if (prepItem.name.includes('كاساديا') && prepItem.name.includes('تتبيل')) {
        producedIng = state.ing.find(g => g.name.includes('كاساديا') && g.name.includes('تتبيل'));
      }
    }
    const recipe = state.recipes.find(r => r.code === prepItem.recipeCode || r.id === prepItem.recipeCode);
    if (!recipe) {
      console.warn("Recipe not found for code:", prepItem.recipeCode);
      return;
    }

    const producedIngId = producedIng ? producedIng.id : (state.ing[0]?.id || 'ING-001');
    const producedQty = batches * prepItem.batchSize;
    const nowIso = new Date().toISOString();
    const timestamp = Date.now();

    const inTx = {
      id: 'tx_prod_in_' + timestamp + '_' + Math.random().toString(36).substr(2, 4),
      date,
      type: 'production_in' as MovementType,
      ingredientId: producedIngId,
      qty: producedQty,
      unit: producedIng?.unit || 'جرام',
      price: producedIng?.price || 0,
      totalCost: (producedIng?.price || 0) * producedQty,
      reference: `PROD-${prepItem.recipeCode}`,
      note: `إنتاج داخلي: ${batches} باتش من (${prepItem.name}) [إجمالي: ${producedQty} ${producedIng?.unit || 'جرام'}]`,
      user: currentUser ? currentUser.name : 'Kitchen',
      createdAt: nowIso
    };

    const outTxs = recipe.items.map((it, idx) => {
      let rawIng = state.ing.find(g => g.id === it.ingredientId);
      if (!rawIng && it.ing) {
        rawIng = state.ing.find(g => g.name === it.ing);
      }
      const consumedQty = batches * num(it.std);
      return {
        id: `tx_prod_out_${timestamp}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        date,
        type: 'production_consume' as MovementType,
        ingredientId: rawIng ? rawIng.id : it.ingredientId,
        qty: consumedQty,
        unit: rawIng?.unit || 'جرام',
        price: rawIng?.price || 0,
        totalCost: (rawIng?.price || 0) * consumedQty,
        reference: `PROD-${prepItem.recipeCode}`,
        note: `استهلاك مكونات تصنيع (${prepItem.name})`,
        user: currentUser ? currentUser.name : 'Kitchen',
        createdAt: nowIso
      };
    });

    setState(prev => {
      const updated = {
        ...prev,
        ledger: [...prev.ledger, inTx, ...outTxs]
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('post_production', `تسجيل إنتاج ${batches} باتش من (${prepItem.name}) بتكلفة وخصم مكونات الوصفة`);
  };

  // User Management Handlers
  const handleAddUser = () => {
    setState(prev => {
      const newId = 'u_' + (prev.users.length + 1);
      const newUsers: User[] = [
        ...prev.users,
        {
          id: newId,
          username: 'user_' + (prev.users.length + 1),
          password: '123',
          name: 'موظف جديد',
          role: 'kitchen',
          active: true
        }
      ];
      const updated = { ...prev, users: newUsers };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('add_user', 'Added new system user');
  };

  const handleDeleteUser = (index: number) => {
    setState(prev => {
      const newUsers = prev.users.filter((_, i) => i !== index);
      const updated = { ...prev, users: newUsers };
      saveStateToStorage(updated);
      return updated;
    });
    logAudit('delete_user', `Deleted user at index ${index}`);
  };

  const handleUpdateUser = (index: number, field: keyof User, value: string | boolean) => {
    setState(prev => {
      const newUsers = [...prev.users];
      newUsers[index] = { ...newUsers[index], [field]: value };
      const updated = { ...prev, users: newUsers };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const handleClearAudit = () => {
    setState(prev => {
      const updated = { ...prev, audit: [] };
      saveStateToStorage(updated);
      return updated;
    });
  };

  // Expense Management Handlers
  const handleAddExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newExpId = 'EXP-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 3).toUpperCase();
    const nowIso = new Date().toISOString();
    const userName = currentUser ? currentUser.name : 'Admin';

    let linkedTxId: string | null = null;
    let newLedgerTx = null;

    if (expenseData.type === 'food' && expenseData.ingredientId) {
      linkedTxId = 'tx_exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const ingObj = state.ing.find(g => g.id === expenseData.ingredientId);
      newLedgerTx = {
        id: linkedTxId,
        date: expenseData.date,
        type: 'recv' as MovementType,
        ingredientId: expenseData.ingredientId,
        qty: expenseData.qty,
        unit: expenseData.unit || ingObj?.unit || '',
        price: expenseData.unitPrice,
        totalCost: expenseData.total,
        reference: expenseData.reference,
        note: `مشتريات غذائية: ${expenseData.reference}${expenseData.supplier ? ` — مورد: ${expenseData.supplier}` : ''}${expenseData.note ? ` (${expenseData.note})` : ''}`,
        user: userName,
        createdAt: nowIso
      };
    }

    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: newExpId,
      inventoryTransactionId: linkedTxId,
      createdAt: nowIso
    };

    setState(prev => {
      const updated = {
        ...prev,
        expenses: [newExpense, ...(prev.expenses || [])],
        ledger: newLedgerTx ? [...prev.ledger, newLedgerTx] : prev.ledger
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit(
      'add_expense', 
      `تسجيل مصروف: ${newExpense.reference} بقيمة ${newExpense.total} ج.م [${newExpense.type === 'food' ? `غذائي ومخزني: ${expenseData.ingredientId} كمية ${expenseData.qty} مع ترحيل استلام للمخزون` : 'غير غذائي تشغيلي'}]`
    );
  };

  const handleUpdateExpense = (updatedExp: ExpenseRecord) => {
    const nowIso = new Date().toISOString();
    const userName = currentUser ? currentUser.name : 'Admin';

    setState(prev => {
      let newLedger = [...prev.ledger];
      let finalExp = { ...updatedExp };

      if (updatedExp.type === 'food' && updatedExp.ingredientId) {
        const ingObj = prev.ing.find(g => g.id === updatedExp.ingredientId);
        if (updatedExp.inventoryTransactionId) {
          // Update existing ledger txn
          const txIdx = newLedger.findIndex(tx => tx.id === updatedExp.inventoryTransactionId);
          if (txIdx >= 0) {
            newLedger[txIdx] = {
              ...newLedger[txIdx],
              date: updatedExp.date,
              ingredientId: updatedExp.ingredientId,
              qty: updatedExp.qty,
              unit: updatedExp.unit || ingObj?.unit || '',
              price: updatedExp.unitPrice,
              totalCost: updatedExp.total,
              reference: updatedExp.reference,
              note: `مشتريات غذائية: ${updatedExp.reference}${updatedExp.supplier ? ` — مورد: ${updatedExp.supplier}` : ''}${updatedExp.note ? ` (${updatedExp.note})` : ''}`
            };
          } else {
            // Re-create missing txn
            newLedger.push({
              id: updatedExp.inventoryTransactionId,
              date: updatedExp.date,
              type: 'recv' as MovementType,
              ingredientId: updatedExp.ingredientId,
              qty: updatedExp.qty,
              unit: updatedExp.unit || ingObj?.unit || '',
              price: updatedExp.unitPrice,
              totalCost: updatedExp.total,
              reference: updatedExp.reference,
              note: `مشتريات غذائية: ${updatedExp.reference}${updatedExp.supplier ? ` — مورد: ${updatedExp.supplier}` : ''}`,
              user: userName,
              createdAt: nowIso
            });
          }
        } else {
          // Create new ledger txn
          const newTxId = 'tx_exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
          finalExp.inventoryTransactionId = newTxId;
          newLedger.push({
            id: newTxId,
            date: updatedExp.date,
            type: 'recv' as MovementType,
            ingredientId: updatedExp.ingredientId,
            qty: updatedExp.qty,
            unit: updatedExp.unit || ingObj?.unit || '',
            price: updatedExp.unitPrice,
            totalCost: updatedExp.total,
            reference: updatedExp.reference,
            note: `مشتريات غذائية: ${updatedExp.reference}${updatedExp.supplier ? ` — مورد: ${updatedExp.supplier}` : ''}`,
            user: userName,
            createdAt: nowIso
          });
        }
      } else {
        // Non-food: remove linked ledger transaction if existed previously
        if (updatedExp.inventoryTransactionId) {
          newLedger = newLedger.filter(tx => tx.id !== updatedExp.inventoryTransactionId);
          finalExp.inventoryTransactionId = null;
        }
      }

      const newExpenses = (prev.expenses || []).map(e => e.id === finalExp.id ? finalExp : e);
      const updated = {
        ...prev,
        expenses: newExpenses,
        ledger: newLedger
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('update_expense', `تعديل سند المصروف: ${updatedExp.reference} (قيمة ${updatedExp.total} ج.م)`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const targetExp = (state.expenses || []).find(e => e.id === expenseId);
    setState(prev => {
      let newLedger = prev.ledger;
      if (targetExp?.inventoryTransactionId) {
        newLedger = prev.ledger.filter(tx => tx.id !== targetExp.inventoryTransactionId);
      }
      const updated = {
        ...prev,
        expenses: (prev.expenses || []).filter(e => e.id !== expenseId),
        ledger: newLedger
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('delete_expense', `حذف سند المصروف: ${targetExp?.reference || expenseId} وعكس حركة المخزون المرتبطة`);
  };

  // Category Management Handlers
  const handleAddCategory = (catData: Omit<ExpenseCategory, 'id'>) => {
    const newCatId = 'CAT-EXP-' + (state.expenseCategories?.length || 0 + 1).toString().padStart(2, '0') + '-' + Math.random().toString(36).substr(2, 3).toUpperCase();
    const newCat: ExpenseCategory = {
      ...catData,
      id: newCatId
    };

    setState(prev => {
      const updated = {
        ...prev,
        expenseCategories: [...(prev.expenseCategories || []), newCat]
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('add_expense_category', `إضافة فئة مصروفات جديدة: ${newCat.name}`);
  };

  const handleUpdateCategory = (updatedCat: ExpenseCategory) => {
    setState(prev => {
      const updated = {
        ...prev,
        expenseCategories: (prev.expenseCategories || []).map(c => c.id === updatedCat.id ? updatedCat : c)
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('update_expense_category', `تعديل فئة مصروفات: ${updatedCat.name}`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setState(prev => {
      const updated = {
        ...prev,
        expenseCategories: (prev.expenseCategories || []).filter(c => c.id !== categoryId)
      };
      saveStateToStorage(updated);
      return updated;
    });

    logAudit('delete_expense_category', `حذف فئة مصروفات: ${categoryId}`);
  };

  // Navigation items config
  const navTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dash', label: t('tab_dash'), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sales', label: t('tab_sales'), icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'recipes', label: t('tab_recipes'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'ideal', label: t('tab_ideal'), icon: <Calculator className="w-4 h-4" /> },
    { id: 'moves', label: t('tab_moves'), icon: <PackagePlus className="w-4 h-4" /> },
    { id: 'ledger', label: t('tab_ledger'), icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'summary', label: t('tab_summary'), icon: <Scale className="w-4 h-4" /> },
    { id: 'par', label: t('tab_par'), icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'prep', label: t('tab_prep'), icon: <Factory className="w-4 h-4" /> },
    { id: 'forecast', label: t('tab_forecast'), icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'menu_eng', label: t('tab_menu_eng'), icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { id: 'expenses', label: t('tab_expenses'), icon: <Wallet className="w-4 h-4 text-emerald-500" /> },
    { id: 'users', label: t('tab_users'), icon: <Users className="w-4 h-4" /> },
    { id: 'audit', label: t('tab_audit'), icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'help', label: t('tab_help'), icon: <HelpCircle className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header Toolbar */}
      <Header
        state={state}
        currentUser={currentUser}
        currentLang={currentLang}
        onSave={handleSave}
        onLogout={handleLogout}
        onImportState={handleImportState}
        onLanguageChange={handleLanguageChange}
        onAudit={logAudit}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onOpenReportsPrint={(report) => setReportsPrintModalReport(report || 'summary')}
      />

      {/* 2. Login Overlay if not authenticated */}
      {!currentUser && (
        <LoginModal
          users={state.users}
          currentLang={currentLang}
          onLogin={handleLogin}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {/* 3. Main Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-[61px] z-30 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 py-2">
          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'dash' && (
          <DashboardTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            onSetPeriod={handleSetPeriod}
            onOpenDiagnostics={() => setShowDiagnostics(true)}
          />
        )}

        {activeTab === 'sales' && (
          <SalesTab
            state={state}
            currentLang={currentLang}
            canEdit={userPerms.canEditSales}
            onUpdateSale={handleUpdateSale}
            onAddSale={handleAddSale}
            onDeleteSale={handleDeleteSale}
            onOpenMenuEngineering={() => setActiveTab('menu_eng')}
            onResetToAugustSales={handleResetToAugustSales}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesTab
            state={state}
            currentLang={currentLang}
            canEdit={userPerms.canEditRecipes}
            onAddRecipe={handleAddRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onUpdateRecipeName={handleUpdateRecipeName}
            onAddRecipeItem={handleAddRecipeItem}
            onDeleteRecipeItem={handleDeleteRecipeItem}
            onUpdateRecipeItem={handleUpdateRecipeItem}
            onPrintRecipe={idx => setPrintRecipeIndex(idx)}
            onPrintAllRecipes={() => setPrintRecipeIndex('all')}
          />
        )}

        {activeTab === 'ideal' && (
          <IdealTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            canEdit={userPerms.canEditPrices}
            onUpdateIngredient={handleUpdateIngredient}
          />
        )}

        {activeTab === 'moves' && (
          <MovesTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            currentUser={currentUser}
            canEdit={userPerms.canRecordTransactions}
            onAddTransaction={handleAddTransaction}
            onBatchAddTransactions={handleBatchAddTransactions}
            onBatchUpdateEndCounts={handleBatchUpdateEndCounts}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerTab
            state={state}
            currentLang={currentLang}
            canEdit={userPerms.canRecordTransactions}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            canEdit={userPerms.canEditInventory}
            onUpdateInventoryCount={handleUpdateInventoryCount}
            onBatchUpdateEndCounts={handleBatchUpdateEndCounts}
            onOpenReportsPrint={(report) => setReportsPrintModalReport(report || 'summary')}
          />
        )}

        {activeTab === 'par' && (
          <ParTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            canEdit={userPerms.canEditPrices}
            onUpdateParDays={handleUpdateParDays}
            onSendToReceiving={handleBatchAddTransactions}
          />
        )}

        {activeTab === 'prep' && (
          <PrepTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            canEdit={userPerms.canRecordTransactions}
            onPostProduction={handlePostProduction}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastTab
            state={state}
            metrics={metrics}
            currentLang={currentLang}
            canEdit={userPerms.canRecordTransactions}
            onPostProductionBatch={handlePostProduction}
            onOpenReportsPrint={(report) => setReportsPrintModalReport(report || 'forecast')}
          />
        )}

        {activeTab === 'menu_eng' && (
          <MenuEngineeringTab
            state={state}
            currentLang={currentLang}
            onOpenReportsPrint={(report) => setReportsPrintModalReport(report || 'menu_eng')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            state={state}
            currentUser={currentUser}
            currentLang={currentLang}
            perms={userPerms}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAudit={logAudit}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            state={state}
            currentLang={currentLang}
            canManageUsers={userPerms.canManageUsers}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTab
            state={state}
            currentLang={currentLang}
            canManage={userPerms.canManageUsers}
            onClearAudit={handleClearAudit}
            onOpenDiagnostics={() => setShowDiagnostics(true)}
          />
        )}

        {activeTab === 'help' && (
          <HelpTab currentLang={currentLang} />
        )}
      </main>

      {/* 5. Recipe Print Modal */}
      {printRecipeIndex !== null && (
        <PrintRecipeModal
          state={state}
          currentLang={currentLang}
          recipeIndex={printRecipeIndex}
          onClose={() => setPrintRecipeIndex(null)}
        />
      )}

      {/* 6. System Diagnostic & Integrity Report Modal */}
      {showDiagnostics && (
        <DiagnosticReportModal
          state={state}
          currentLang={currentLang}
          onClose={() => setShowDiagnostics(false)}
          onApplyRepairs={(repairedState, logSummary) => {
            setState(repairedState);
            saveStateToStorage(repairedState);
            logAudit('system_repair', `Applied repairs: ${logSummary.join(' | ')}`);
          }}
          onAudit={logAudit}
        />
      )}

      {/* 7. Comprehensive Reports & PDF Print Center Modal */}
      {reportsPrintModalReport !== null && (
        <ReportsPrintModal
          state={state}
          metrics={metrics}
          currentLang={currentLang}
          initialReport={reportsPrintModalReport}
          onClose={() => setReportsPrintModalReport(null)}
        />
      )}
    </div>
  );
};

export default App;
