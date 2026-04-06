import { create } from 'zustand';
import { storageService } from '../services/storageService';

export const useIncomeStore = create((set, get) => ({
  incomes: [],
  isLoaded: false,

  loadIncomes: async () => {
    const incomes = await storageService.get('@incomes', []);
    set({ incomes, isLoaded: true });
  },

  addIncome: async (income) => {
    const incomes = [...get().incomes, income];
    set({ incomes });
    await storageService.set('@incomes', incomes);
  },

  updateIncome: async (id, updates) => {
    const incomes = get().incomes.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    set({ incomes });
    await storageService.set('@incomes', incomes);
  },

  deleteIncome: async (id) => {
    const incomes = get().incomes.filter((i) => i.id !== id);
    set({ incomes });
    await storageService.set('@incomes', incomes);
  },

  getTotalForMonth: (yearMonth) => {
    return get()
      .incomes.filter((i) => i.date.startsWith(yearMonth))
      .reduce((sum, i) => sum + i.amount, 0);
  },
}));
