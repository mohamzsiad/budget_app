import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import {
  View, ActivityIndicator, StyleSheet,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

import AppNavigator        from './src/navigation/AppNavigator';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import { useSettingsStore } from './src/store/settingsStore';
import { useExpenseStore }  from './src/store/expenseStore';
import { useIncomeStore }   from './src/store/incomeStore';
import { useBudgetStore }   from './src/store/budgetStore';
import { COLORS } from './src/constants/colors';

function AppRoot() {
  const [loading,   setLoading]   = useState(true);
  const [locked,    setLocked]    = useState(false);   // biometric gate
  const systemScheme = useColorScheme();

  const { loadSettings, theme, biometricLock } = useSettingsStore();
  const { expenses, loadExpenses }             = useExpenseStore();
  const { loadIncomes }                        = useIncomeStore();
  const { loadBudgets, syncBudgetSpent }       = useBudgetStore();

  const resolvedTheme = theme === 'system' ? (systemScheme || 'light') : theme;
  const isDark = resolvedTheme === 'dark';

  // Track the previous expense count so we only re-sync when expenses change
  const prevExpenseCount = useRef(0);

  // ── Bootstrap: load all stores in parallel ──────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        await Promise.all([
          loadSettings(),
          loadExpenses(),
          loadIncomes(),
          loadBudgets(),
        ]);
      } catch (e) {
        console.error('[App] Bootstrap error:', e);
      } finally {
        setLoading(false);
        // After settings are loaded we know whether biometric is on
        // useEffect below will handle setting locked state once loading is false
      }
    }
    bootstrap();
  }, []);

  // ── Once loading finishes, apply biometric gate if enabled ──────
  useEffect(() => {
    if (!loading && biometricLock) {
      setLocked(true);
    }
  }, [loading, biometricLock]);

  // ── Auto-sync budgets whenever the expense list changes ──────────
  useEffect(() => {
    if (!loading && expenses.length !== prevExpenseCount.current) {
      prevExpenseCount.current = expenses.length;
      const currentMonth = format(new Date(), 'yyyy-MM');

      syncBudgetSpent(expenses, currentMonth, (budget, pct) => {
        const overBudget = pct >= 100;
        Toast.show({
          type:  overBudget ? 'error' : 'info',
          text1: overBudget
            ? `⚠️ Over Budget: ${budget.category}`
            : `🔔 Budget Alert: ${budget.category}`,
          text2: overBudget
            ? `You've exceeded your ${budget.currency}${budget.monthlyLimit.toFixed(2)} limit`
            : `You've used ${pct.toFixed(0)}% of your ${budget.currency}${budget.monthlyLimit.toFixed(2)} budget`,
          visibilityTime: 4000,
          topOffset: 60,
        });
      });
    }
  }, [expenses, loading]);

  // ── Splash / loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[
        styles.splash,
        { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background },
      ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Biometric gate ───────────────────────────────────────────────
  if (locked) {
    return (
      <BiometricLockScreen onUnlock={() => setLocked(false)} />
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppRoot />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
