import AsyncStorage from '@react-native-async-storage/async-storage';

// Debounce write queue to batch AsyncStorage writes (500ms)
const writeQueue = {};

export const storageService = {
  /**
   * Get a value from AsyncStorage.
   * @param {string} key - Storage key
   * @param {*} defaultValue - Value to return if key doesn't exist
   */
  get: async (key, defaultValue = null) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (error) {
      console.error(`[Storage] Error reading ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Set a value in AsyncStorage (debounced 500ms).
   */
  set: (key, value) => {
    return new Promise((resolve, reject) => {
      if (writeQueue[key]) {
        clearTimeout(writeQueue[key].timeout);
      }
      writeQueue[key] = {
        timeout: setTimeout(async () => {
          try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
            delete writeQueue[key];
            resolve();
          } catch (error) {
            console.error(`[Storage] Error writing ${key}:`, error);
            reject(error);
          }
        }, 500),
      };
    });
  },

  /**
   * Immediately write (no debounce). Use for critical writes.
   */
  setImmediate: async (key, value) => {
    try {
      if (writeQueue[key]) {
        clearTimeout(writeQueue[key].timeout);
        delete writeQueue[key];
      }
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Error writing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Remove a key from AsyncStorage.
   */
  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
    }
  },

  /**
   * Clear all SpendSmart keys.
   */
  clearAll: async () => {
    try {
      const keys = ['@expenses', '@incomes', '@budgets', '@settings', '@ai_history', '@onboarding_done'];
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('[Storage] Error clearing all:', error);
    }
  },

  /**
   * Export all data as a single JSON object.
   */
  exportAll: async () => {
    try {
      const keys = ['@expenses', '@incomes', '@budgets', '@settings'];
      const pairs = await AsyncStorage.multiGet(keys);
      const result = {};
      for (const [key, value] of pairs) {
        result[key] = value ? JSON.parse(value) : null;
      }
      return result;
    } catch (error) {
      console.error('[Storage] Error exporting:', error);
      return {};
    }
  },

  /**
   * Import data from a JSON object.
   */
  importAll: async (data) => {
    try {
      const pairs = Object.entries(data).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('[Storage] Error importing:', error);
      throw error;
    }
  },
};
