import React, { useState, useMemo } from 'react';
import { AppState, Language, SaleItem } from '../types';
import { TRANSLATIONS } from '../translations';
import { num, nf, money } from '../utils/calculations';
import { ShoppingBag, Search, Plus, Trash2, Sparkles, X, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { AutocompleteSelect, AutocompleteOption } from './AutocompleteSelect';

interface SalesTabProps {
  state: AppState;
  currentLang: Language;
  canEdit: boolean;
  onUpdateSale: (index: number, field: string, value: string | number) => void;
  onAddSale: (item?: Partial<SaleItem>) => void;
  onDeleteSale: (index: number) => void;
  onOpenMenuEngineering?: () => void;
  onResetToAugustSales?: () => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  state,
  currentLang,
  canEdit,
  onUpdateSale,
  onAddSale,
  onDeleteSale,
  onOpenMenuEngineering,
  onResetToAugustSales
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Quick Add Form States with Autocomplete
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('وجبات');
  const [newQty, setNewQty] = useState('10');
  const [newPrice, setNewPrice] = useState('100');
  const [successAddMsg, setSuccessAddMsg] = useState(false);

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;
  const isAr = currentLang === 'ar';

  let totalQty = 0;
  let totalRevenue = 0;
  state.sales.forEach(s => {
    totalQty += num(s.qty);
    totalRevenue += num(s.qty) * num(s.price);
  });

  // Autocomplete options for recipes
  const recipeOptions: AutocompleteOption[] = useMemo(() => {
    const list: AutocompleteOption[] = [
      {
        value: '',
        label: t("col_no_recipe") || (isAr ? 'بدون وصفة ربط' : 'No linked recipe'),
        badge: isAr ? 'غير مربوط' : 'Unlinked'
      }
    ];

    state.recipes.forEach(r => {
      list.push({
        value: r.id,
        label: `${r.code} — ${r.name}`,
        badge: r.code,
        subLabel: `${r.items.length} ${isAr ? 'مكونات وخامات' : 'ingredients'}`,
        searchText: `${r.name} ${r.code} ${r.id}`
      });
    });

    return list;
  }, [state.recipes, currentLang, isAr]);

  // Autocomplete options for modal selection (recipes only)
  const modalRecipeOptions: AutocompleteOption[] = useMemo(() => {
    return state.recipes.map(r => ({
      value: r.id,
      label: `${r.name} (${r.code})`,
      badge: r.code,
      subLabel: `${r.items.length} ${isAr ? 'مكونات في الوصفة المعيارية' : 'items in standard recipe'}`,
      searchText: `${r.name} ${r.code}`
    }));
  }, [state.recipes, isAr]);

  // When user selects a recipe in the Add modal, auto-fill fields
  const handleSelectRecipeInModal = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const foundRecipe = state.recipes.find(r => r.id === recipeId);
    if (foundRecipe) {
      if (!newName || newName === 'صنف مبيعات جديد') {
        setNewName(foundRecipe.name);
      }
      if (!newSkuCode) {
        setNewSkuCode(`SKU_${String(state.sales.length + 1).padStart(3, '0')}`);
      }
    }
  };

  const handleOpenAddModal = () => {
    setNewSkuCode(`SKU_${String(state.sales.length + 1).padStart(3, '0')}`);
    setNewName('');
    setNewGroup('وجبات');
    setNewQty('10');
    setNewPrice('100');
    setSelectedRecipeId(state.recipes[0]?.id || '');
    if (state.recipes[0]) {
      setNewName(state.recipes[0].name);
    }
    setShowAddModal(true);
  };

  const handleSaveNewSaleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddSale({
      code: newSkuCode.trim() || `SKU_${String(state.sales.length + 1).padStart(3, '0')}`,
      name: newName.trim(),
      group: newGroup.trim() || 'وجبات',
      qty: parseFloat(newQty) || 1,
      price: parseFloat(newPrice) || 0,
      recipeId: selectedRecipeId || undefined
    });

    setSuccessAddMsg(true);
    setTimeout(() => {
      setSuccessAddMsg(false);
      setShowAddModal(false);
    }, 800);
  };

  const filteredSales = state.sales.map((s, originalIndex) => ({ s, originalIndex })).filter(({ s }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.code.toLowerCase().includes(term) ||
      s.name.toLowerCase().includes(term) ||
      s.group.toLowerCase().includes(term) ||
      (s.recipeCode && s.recipeCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Official August 2026 Sales Report Status Header */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              08
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'تقرير مبيعات شهر أغسطس 2026 المعتمد' : 'Official August 2026 Sales Report'}
                </span>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {state.sales.length} {isAr ? 'صنفاً' : 'SKUs'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isAr ? 'إجمالي الكمية المباعة: ' : 'Total Sold Qty: '}
                <strong className="text-blue-700 dark:text-blue-400 font-mono">{nf(totalQty)}</strong>
                {' | '}
                {isAr ? 'إجمالي إيراد المبيعات: ' : 'Total Sales Revenue: '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{money(totalRevenue)}</strong>
              </p>
            </div>
          </div>

          {onResetToAugustSales && canEdit && (
            <button
              onClick={onResetToAugustSales}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition whitespace-nowrap self-stretch md:self-auto justify-center"
              title={isAr ? 'استعادة مبيعات تقرير أغسطس 2026 وحذف التعديلات المؤقتة' : 'Restore Official August 2026 Sales Report'}
            >
              <span>🔄</span>
              <span>{isAr ? 'استعادة مبيعات أغسطس 2026 الأصلية' : 'Restore August 2026 Sales'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t("tab_sales")}
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {state.sales.length} SKUs
            </span>
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

            {onOpenMenuEngineering && (
              <button
                onClick={onOpenMenuEngineering}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
                title={t("tab_menu_eng")}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("tab_menu_eng")}</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
                title="إضافة صنف بالبحث الفوري"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة صنف مبيعات (بحث فوري)' : 'Add SKU (Autocomplete)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 text-center w-24">SKU</th>
                <th className="p-2.5 text-right min-w-[200px]">{t("col_name")}</th>
                <th className="p-2.5 text-center w-28">{t("col_group")}</th>
                <th className="p-2.5 text-center w-20">{t("col_qty")}</th>
                <th className="p-2.5 text-center w-20">{t("col_price")}</th>
                <th className="p-2.5 text-center w-24">{t("col_total")}</th>
                <th className="p-2.5 text-right min-w-[250px]">{t("col_recipe_link")} (بحث فوري)</th>
                {canEdit && <th className="p-2.5 text-center w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filteredSales.map(({ s, originalIndex }, idx) => {
                const totalItemRev = num(s.qty) * num(s.price);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2 text-center">
                      <input
                        disabled={!canEdit}
                        type="text"
                        value={s.code}
                        onChange={e => onUpdateSale(originalIndex, 'code', e.target.value)}
                        className="w-20 text-center px-1 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-mono text-[11px]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        disabled={!canEdit}
                        type="text"
                        value={s.name}
                        onChange={e => onUpdateSale(originalIndex, 'name', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium text-xs text-right"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        disabled={!canEdit}
                        type="text"
                        value={s.group}
                        onChange={e => onUpdateSale(originalIndex, 'group', e.target.value)}
                        className="w-24 text-center px-1 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-xs"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        disabled={!canEdit}
                        type="number"
                        min="0"
                        value={s.qty}
                        onChange={e => onUpdateSale(originalIndex, 'qty', e.target.value)}
                        className="w-16 text-center px-1 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 font-bold text-xs"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        disabled={!canEdit}
                        type="number"
                        step="0.1"
                        min="0"
                        value={s.price}
                        onChange={e => onUpdateSale(originalIndex, 'price', e.target.value)}
                        className="w-16 text-center px-1 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 font-bold text-xs"
                      />
                    </td>
                    <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-200">
                      {money(totalItemRev)}
                    </td>
                    <td className="p-2">
                      <AutocompleteSelect
                        disabled={!canEdit}
                        options={recipeOptions}
                        value={s.recipeId || ''}
                        onChange={val => onUpdateSale(originalIndex, 'recipeId', val)}
                        placeholder="اختر أو ابحث عن وصفة..."
                        className="w-full"
                        inputClassName="py-1 px-2 text-[11px] rounded-lg border-slate-200 dark:border-slate-700"
                      />
                    </td>
                    {canEdit && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => onDeleteSale(originalIndex)}
                          className="text-red-500 hover:text-red-700 p-1 transition"
                          title={t("btn_delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-10">
              <tr>
                <td colSpan={4} className="p-2.5 text-center">{t("col_total")}</td>
                <td className="p-2.5 text-center">{nf(totalQty, 0)}</td>
                <td className="p-2.5 text-center"></td>
                <td className="p-2.5 text-center">{money(totalRevenue)}</td>
                <td colSpan={canEdit ? 2 : 1}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Quick Add Sale Item Modal with Autocomplete */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-xl">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isAr ? 'إضافة صنف مبيعات بالبحث الفوري' : 'Add Sale Item with Autocomplete'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'اختر الوصفة بالبحث السريع لتعبئة البيانات تلقائياً' : 'Search recipe to auto-fill SKU details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successAddMsg ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-800 dark:text-white text-base">
                  {isAr ? 'تمت إضافة صنف المبيعات بنجاح!' : 'Sale item added successfully!'}
                </h4>
              </div>
            ) : (
              <form onSubmit={handleSaveNewSaleItem} className="space-y-3.5 text-xs">
                {/* Recipe Autocomplete Search */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{isAr ? 'الوصفة المعيارية المرتبطة (بحث فوري)' : 'Linked Standard Recipe (Autocomplete)'}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {isAr ? 'تعبئة تلقائية' : 'Auto-fill'}
                    </span>
                  </label>
                  <AutocompleteSelect
                    options={modalRecipeOptions}
                    value={selectedRecipeId}
                    onChange={handleSelectRecipeInModal}
                    placeholder={isAr ? 'ابحث باسم الوجبة أو كود الوصفة (برجر، كاساديا، سلطة)...' : 'Search by recipe name or code...'}
                    autoFocus
                  />
                </div>

                {/* SKU Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">كود الصنف (SKU)</label>
                    <input
                      type="text"
                      value={newSkuCode}
                      onChange={e => setNewSkuCode(e.target.value)}
                      placeholder="SKU_001"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">اسم صنف المبيعات</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="اسم الوجبة أو المنتج..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Group, Quantity, Price */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">المجموعة</label>
                    <input
                      type="text"
                      value={newGroup}
                      onChange={e => setNewGroup(e.target.value)}
                      placeholder="وجبات / مقبلات..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">الكمية المباعة</label>
                    <input
                      type="number"
                      min="0"
                      value={newQty}
                      onChange={e => setNewQty(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl font-bold font-mono dark:text-amber-200 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">سعر البيع (ج.م)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder="100.00"
                      className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-xl font-bold font-mono dark:text-blue-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Total Value Preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">إجمالي مبيعات الصنف التقديري:</span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {money((parseFloat(newQty) || 0) * (parseFloat(newPrice) || 0))} ج.م
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition"
                  >
                    حفظ وإضافة إلى المبيعات
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
