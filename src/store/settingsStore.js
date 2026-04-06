import { create } from 'zustand';
import { storageService } from '../services/storageService';
import * as SecureStore from 'expo-secure-store';

const DEFAULTS = {
  currency: 'USD',
  theme: 'system',
  monthStartDay: 1,
  weekStartDay: 'Monday',
  aiProvider: 'openai',
  openAIKey: '',
  biometricLock: false,
  exportFormat: 'CSV',
  onboardingDone: false,
};

export const useSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,

  loadSettings: async () => {
    const settings = await storageService.get('@settings', {});
    // Load API key from secure store
    let openAIKey = '';
    try {
      openAIKey = (await SecureStore.getItemAsync('openai_key')) || '';
    } catch (_) {}

    set({ ...DEFAULTS, ...settings, openAIKey, isLoaded: true });
  },

  _persist: async (updates) => {
    const current = { ...get() };
    delete current.isLoaded;
    delete current.loadSettings;
    delete current._persist;
    // Remove functions before saving
    const toSave = {};
    for (const [k, v] of Object.entries({ ...current, ...updates })) {
      if (typeof v !== 'function') toSave[k] = v;
    }
    await storageService.set('@settings', toSave);
  },

  setCurrency: async (currency) => {
    set({ currency });
    await get()._persist({ currency });
  },

  setTheme: async (theme) => {
    set({ theme });
    await get()._persist({ theme });
  },

  setMonthStartDay: async (monthStartDay) => {
    set({ monthStartDay });
    await get()._persist({ monthStartDay });
  },

  setAIProvider: async (aiProvider) => {
    set({ aiProvider });
    await get()._persist({ aiProvider });
  },

  setOpenAIKey: async (key) => {
    set({ openAIKey: key });
    try {
      await SecureStore.setItemAsync('openai_key', key);
    } catch (_) {}
  },

  setBiometricLock: async (biometricLock) => {
    set({ biometricLock });
    await get()._persist({ biometricLock });
  },

  setOnboardingDone: async (value = true) => {
    set({ onboardingDone: value });
    await storageService.set('@onboarding_done', value);
    await get()._persist({ onboardingDone: value });
  },
}));
