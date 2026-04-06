import { create } from 'zustand';
import { storageService } from '../services/storageService';

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  isLoaded: false,

  // ─── Load ────────────────────────────────────────────────────────
  loadExpenses: async () => {
    try {
      const expenses = await storageService.get('@expenses', []);
      set({ expenses, isLoaded: true });
    } catch (e) {
      console.error('[expenseStore] loadExpenses:', e);
      set({ isLoaded: true });
    }
  },

  // ─── CRUD ────────────────────────────────────────────────────────
  addExpense: async (expense) => {
    const expenses = [expense, ...get().expenses];   // prepend so newest first
    set({ expenses });
    await storageService.set('@expenses', expenses);
  },

  updateExpense: async (id, updates) => {
    const expenses = get().expenses.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    set({ expenses });
    await storageService.set('@expenses', expenses);
  },

  deleteExpense: async (id) => {
    const expenses = get().expenses.filter((e) => e.id !== id);
    set({ expenses });
    await storageService.set('@expenses', expenses);
  },

  clearAllExpenses: async () => {
    set({ expenses: [] });
    await storageService.setImmediate('@expenses', []);
  },

  // ─── Selectors ───────────────────────────────────────────────────

  /** Filter expenses within a start/end Date range */
  getExpensesForPeriod: (startDate, endDate) => {
    return get().expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
  },

  /** Group expenses by category within a period */
  getExpensesByCategory: (startDate, endDate) => {
    const filtered = get().getExpensesForPeriod(startDate, endDate);
    return filtered.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
  },

  /** Sum all expense amounts within a period */
  getTotalForPeriod: (startDate, endDate) => {
    return get()
      .getExpensesForPeriod(startDate, endDate)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  /** Get expenses for a given 'yyyy-MM' month string */
  getExpensesForMonth: (yearMonth) => {
    return get().expenses.filter((e) => e.date.startsWith(yearMonth));
  },

  /** Sum expenses for a given 'yyyy-MM' month string */
  getTotalForMonth: (yearMonth) => {
    return get()
      .getExpensesForMonth(yearMonth)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  /**
   * Get daily totals for a given month: { 'yyyy-MM-dd': amount }
   * Useful for the heatmap and line chart.
   */
  getDailyTotalsForMonth: (yearMonth) => {
    const monthExpenses = get().getExpensesForMonth(yearMonth);
    return monthExpenses.reduce((acc, e) => {
      const day = e.date.substring(0, 10);
      acc[day] = (acc[day] || 0) + e.amount;
      return acc;
    }, {});
  },

  /**
   * Get monthly totals for a list of { yearMonth } objects.
   * Returns [{ yearMonth, total }, ...]
   */
  getMonthlyTotals: (months) => {
    return months.map(({ yearMonth, label }) => ({
      yearMonth,
      label,
      total: get().getTotalForMonth(yearMonth),
    }));
  },

  /**
   * Get the most recent N expenses, sorted descending by date.
   */
  getRecentExpenses: (limit = 10) => {
    return [...get().expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },

  /**
   * Search expenses by title, category or note (case-insensitive).
   */
  searchExpenses: (query) => {
    if (!query) return get().expenses;
    const q = query.toLowerCase();
    return get().expenses.filter(
      (e) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.note || '').toLowerCase().includes(q)
    );
  },

  /**
   * Get unique past titles for auto-suggest in the Add Expense form.
   */
  getPastTitles: () => {
    const titles = get()
      .expenses.map((e) => e.title)
      .filter(Boolean);
    return [...new Set(titles)].slice(0, 20);
  },
}));
