import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format as fnsFormat } from 'date-fns';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';
import { useIncomeStore } from '../store/incomeStore';
import { useBudgetStore } from '../store/budgetStore';
import { getDateRange } from '../utils/dateHelpers';
import { getTopCategories } from '../utils/calculations';

import SummaryCard from '../components/SummaryCard';
import PeriodToggle from '../components/PeriodToggle';
import ExpenseCard from '../components/ExpenseCard';
import FAB from '../components/FAB';
import {
  SummaryCardSkeleton,
  StatRowSkeleton,
  ExpenseCardSkeleton,
} from '../components/SkeletonLoader';

const RECENT_LIMIT = 10;

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { theme, currency } = useSettingsStore();

  const { expenses, loadExpenses, isLoaded: expensesLoaded } = useExpenseStore();
  const { incomes,  loadIncomes,  isLoaded: incomesLoaded  } = useIncomeStore();
  const { budgets,  loadBudgets,  syncBudgetSpent, isLoaded: budgetsLoaded } = useBudgetStore();

  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const [period, setPeriod] = useState('Monthly');
  const [refreshing, setRefreshing] = useState(false);

  // True only when all three stores have finished loading from storage
  const isReady = expensesLoaded && incomesLoaded && budgetsLoaded;

  const today = new Date();
  const currentMonth = fnsFormat(today, 'yyyy-MM');

  // Reload budgets/sync when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        syncBudgetSpent(expenses, currentMonth);
      }
    }, [expenses, currentMonth, isReady])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadExpenses(), loadIncomes(), loadBudgets()]);
    syncBudgetSpent(expenses, currentMonth);
    setRefreshing(false);
  }, [expenses, currentMonth]);

  // ─── Computed values ──────────────────────────────────────────────
  const { start, end } = useMemo(
    () => getDateRange(period, today),
    [period]
  );

  const periodExpenses = useMemo(
    () => expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    }),
    [expenses, start, end]
  );

  const periodIncomes = useMemo(
    () => incomes.filter((i) => {
      const d = new Date(i.date);
      return d >= start && d <= end;
    }),
    [incomes, start, end]
  );

  const totalSpent  = useMemo(() => periodExpenses.reduce((s, e) => s + e.amount, 0), [periodExpenses]);
  const totalIncome = useMemo(() => periodIncomes.reduce((s, i) => s + i.amount, 0), [periodIncomes]);

  const totalBudget = useMemo(() => {
    if (period !== 'Monthly') return 0;
    return budgets
      .filter((b) => b.month === currentMonth)
      .reduce((s, b) => s + b.monthlyLimit, 0);
  }, [budgets, currentMonth, period]);

  const highestExpense = useMemo(
    () => periodExpenses.reduce((max, e) => (e.amount > max ? e.amount : max), 0),
    [periodExpenses]
  );

  const topCategory = useMemo(() => {
    const byCategory = periodExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const top = getTopCategories(byCategory, 1);
    return top.length > 0 ? top[0].name : null;
  }, [periodExpenses]);

  const recentExpenses = useMemo(
    () => [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, RECENT_LIMIT),
    [expenses]
  );

  // ─── Greeting ────────────────────────────────────────────────────
  function getGreeting() {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ─── List header ─────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Top header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textMuted }]}>
            {getGreeting()}, Mohamed! 👋
          </Text>
          <Text style={[styles.monthTitle, { color: C.text }]}>
            {fnsFormat(today, 'MMMM yyyy')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: C.surface }]}
            onPress={() => navigation.navigate('Income')}
          >
            <MaterialCommunityIcons name="cash-plus" size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: C.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Toggle */}
      <PeriodToggle
        value={period}
        onChange={setPeriod}
        style={styles.toggle}
      />

      {/* Summary Card — skeleton while loading */}
      {!isReady ? (
        <SummaryCardSkeleton />
      ) : (
        <SummaryCard
          totalSpent={totalSpent}
          totalIncome={totalIncome}
          totalBudget={totalBudget}
          currency={currency}
          period={period}
        />
      )}

      {/* Quick Stats — skeleton while loading */}
      {!isReady ? (
        <StatRowSkeleton />
      ) : (
        <View style={styles.statsRow}>
          <StatCard
            icon="arrow-up-bold-circle"
            iconColor={COLORS.danger}
            label="Highest"
            value={`${currency}${highestExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            C={C}
          />
          <StatCard
            icon="receipt-text-outline"
            iconColor={COLORS.primary}
            label="Transactions"
            value={String(periodExpenses.length)}
            C={C}
          />
          <StatCard
            icon="tag-outline"
            iconColor={COLORS.warning}
            label="Top Category"
            value={topCategory ? topCategory.split(' ')[0] : '—'}
            C={C}
          />
        </View>
      )}

      {/* Recent Transactions header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
          <Text style={[styles.seeAll, { color: COLORS.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Skeleton list items while loading ───────────────────────────
  const SkeletonList = (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <ExpenseCardSkeleton key={i} />
      ))}
    </View>
  );

  const ListEmpty = (
    <View style={[styles.emptyState, { backgroundColor: C.surface }]}>
      <MaterialCommunityIcons name="receipt-text-outline" size={56} color={C.textMuted} />
      <Text style={[styles.emptyTitle, { color: C.text }]}>No expenses yet</Text>
      <Text style={[styles.emptySub, { color: C.textMuted }]}>
        Tap the + button below to add your first expense
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={styles.emptyBtnText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FlatList
        data={isReady ? recentExpenses : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ExpenseCard
            expense={item}
            style={[
              styles.expenseCard,
              index === recentExpenses.length - 1 && { marginBottom: 100 },
            ]}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !isReady
            ? SkeletonList
            : <View style={{ paddingHorizontal: 20 }}>{ListEmpty}</View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Floating Action Button */}
      <FAB />
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function StatCard({ icon, iconColor, label, value, C }) {
  return (
    <View style={[styles.statCard, { backgroundColor: C.surface }]}>
      <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      <Text style={[styles.statLabel, { color: C.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: C.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  greeting: { fontSize: 13, marginBottom: 3 },
  monthTitle: { fontSize: 22, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggle: { marginHorizontal: 20, marginBottom: 16 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 5,
  },
  statLabel: { fontSize: 11, textAlign: 'center' },
  statValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },

  expenseCard: { marginHorizontal: 20, marginBottom: 8 },

  emptyState: {
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    marginTop: 6,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
