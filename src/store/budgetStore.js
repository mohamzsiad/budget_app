import { create } from 'zustand';
import { format } from 'date-fns';
import { storageService } from '../services/storageService';

export const useBudgetStore = create((set, get) => ({
  budgets: [],
  isLoaded: false,
  /** Set of budget IDs whose alert has already been triggered this session */
  _alertedIds: new Set(),

  // ─── Load ─────────────────────────────────────────────────────────
  loadBudgets: async () => {
    try {
      const budgets = await storageService.get('@budgets', []);
      set({ budgets, isLoaded: true });
    } catch (e) {
      console.error('[budgetStore] loadBudgets:', e);
      set({ isLoaded: true });
    }
  },

  // ─── CRUD ─────────────────────────────────────────────────────────
  addBudget: async (budget) => {
    // Replace existing budget for same category+month if it exists
    const filtered = get().budgets.filter(
      (b) => !(b.category === budget.category && b.month === budget.month)
    );
    const budgets = [...filtered, budget];
    set({ budgets });
    await storageService.set('@budgets', budgets);
  },

  updateBudget: async (id, updates) => {
    const budgets = get().budgets.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    set({ budgets });
    await storageService.set('@budgets', budgets);
  },

  deleteBudget: async (id) => {
    const budgets = get().budgets.filter((b) => b.id !== id);
    // Also remove from alerted set
    const _alertedIds = new Set(get()._alertedIds);
    _alertedIds.delete(id);
    set({ budgets, _alertedIds });
    await storageService.set('@budgets', budgets);
  },

  // ─── Sync spent amounts from the expense list ─────────────────────
  /**
   * Recalculates `spent` for every budget in `yearMonth` by summing
   * expenses. Fires threshold alerts if a budget has just crossed its
   * alert percentage for the first time this session.
   *
   * @param {Array}  expenses   - full expense array from expenseStore
   * @param {string} yearMonth  - 'yyyy-MM'
   * @param {Function} onAlert  - optional callback(budget, pct) when threshold crossed
   */
  syncBudgetSpent: (expenses, yearMonth, onAlert) => {
    const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));

    const byCategory = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const _alertedIds = new Set(get()._alertedIds);
    let alertFired = false;

    const budgets = get().budgets.map((b) => {
      if (b.month !== yearMonth) return b;

      const spent = byCategory[b.category] || 0;
      const pct   = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;

      // Threshold alert — fire once per session per budget
      const threshold = b.alertThreshold || 80;
      if (pct >= threshold && !_alertedIds.has(b.id) && onAlert) {
        _alertedIds.add(b.id);
        alertFired = true;
        onAlert(b, pct);
      }

      return { ...b, spent };
    });

    set({ budgets, _alertedIds });
    // Persist the updated spent values
    storageService.set('@budgets', budgets);
  },

  // ─── Selectors ───────────────────────────────────────────────────
  getBudgetsForMonth: (yearMonth) => {
    return get().budgets.filter((b) => b.month === yearMonth);
  },

  getTotalBudgetForMonth: (yearMonth) => {
    return get()
      .getBudgetsForMonth(yearMonth)
      .reduce((s, b) => s + b.monthlyLimit, 0);
  },

  getTotalSpentForMonth: (yearMonth) => {
    return get()
      .getBudgetsForMonth(yearMonth)
      .reduce((s, b) => s + (b.spent || 0), 0);
  },

  getOverBudgetCategories: (yearMonth) => {
    return get()
      .getBudgetsForMonth(yearMonth)
      .filter((b) => (b.spent || 0) > b.monthlyLimit);
  },

  // ─── Copy last month's budgets into a new month ───────────────────
  copyLastMonthBudgets: async (lastMonth, currentMonth) => {
    const lastMonthBudgets = get().getBudgetsForMonth(lastMonth);
    const existingCategories = new Set(
      get().getBudgetsForMonth(currentMonth).map((b) => b.category)
    );

    // Only copy categories that don't already have a budget this month
    const newBudgets = lastMonthBudgets
      .filter((b) => !existingCategories.has(b.category))
      .map((b) => ({
        ...b,
        id:    `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        month: currentMonth,
        spent: 0,
      }));

    if (newBudgets.length === 0) return;

    const budgets = [...get().budgets, ...newBudgets];
    set({ budgets });
    await storageService.set('@budgets', budgets);
  },
}));
