import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDaysInMonth, getDate, subMonths,
} from 'date-fns';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';
import { useIncomeStore } from '../store/incomeStore';
import { useBudgetStore } from '../store/budgetStore';
import { getTopCategories, calcSavingsRate, getBiggestExpenseDay } from '../utils/calculations';
import { getLastNMonths } from '../utils/dateHelpers';

import PeriodToggle from '../components/PeriodToggle';
import ChartSection from '../components/ChartSection';
import SpendingHeatmap from '../components/SpendingHeatmap';
import ExpenseCard from '../components/ExpenseCard';

const { width } = Dimensions.get('window');
const CHART_W = width - 80;

const PERIODS = ['Weekly', 'Monthly'];

export default function ReportsScreen() {
  const { theme, currency } = useSettingsStore();
  const { expenses, getExpensesForPeriod, getExpensesByCategory, getDailyTotalsForMonth } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { budgets } = useBudgetStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const [period, setPeriod]           = useState('Monthly');
  const [drillCategory, setDrillCategory] = useState(null); // category name for drill-down
  const [drillDay, setDrillDay]           = useState(null); // 'yyyy-MM-dd' for day tap

  const today         = new Date();
  const currentYearMonth = format(today, 'yyyy-MM');
  const last6Months   = useMemo(() => getLastNMonths(6), []);

  // ─── Period date range ────────────────────────────────────────────
  const { periodStart, periodEnd } = useMemo(() => {
    if (period === 'Weekly') {
      // Last 7 days
      const end   = new Date();
      const start = new Date(); start.setDate(start.getDate() - 6);
      return { periodStart: start, periodEnd: end };
    }
    return {
      periodStart: startOfMonth(today),
      periodEnd:   endOfMonth(today),
    };
  }, [period]);

  const periodExpenses = useMemo(
    () => getExpensesForPeriod(periodStart, periodEnd),
    [expenses, periodStart, periodEnd]
  );

  const totalSpent  = useMemo(() => periodExpenses.reduce((s, e) => s + e.amount, 0), [periodExpenses]);
  const totalIncome = useMemo(() => {
    return incomes
      .filter((i) => {
        const d = new Date(i.date);
        return d >= periodStart && d <= periodEnd;
      })
      .reduce((s, i) => s + i.amount, 0);
  }, [incomes, periodStart, periodEnd]);

  // ─── Chart 1: Line chart data (spending over time) ────────────────
  const lineData = useMemo(() => {
    if (period === 'Monthly') {
      const days = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
      const dailyTotals = getDailyTotalsForMonth(currentYearMonth);
      return days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        return {
          value: dailyTotals[key] || 0,
          label: format(d, 'd'),
          labelTextStyle: { color: C.textMuted, fontSize: 9 },
          dataPointText: '',
        };
      });
    }
    // Weekly: last 7 days
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = format(d, 'yyyy-MM-dd');
      const dayTotal = expenses
        .filter((e) => e.date.startsWith(key))
        .reduce((s, e) => s + e.amount, 0);
      return {
        value: dayTotal,
        label: format(d, 'EEE'),
        labelTextStyle: { color: C.textMuted, fontSize: 10 },
      };
    });
  }, [expenses, period, currentYearMonth, C.textMuted]);

  const lineMax = useMemo(() => {
    const max = Math.max(...lineData.map((d) => d.value), 1);
    return Math.ceil(max * 1.25);
  }, [lineData]);

  const hasLineData = lineData.some((d) => d.value > 0);

  // ─── Chart 2: Donut/Pie chart data (category breakdown) ───────────
  const byCategory = useMemo(
    () => getExpensesByCategory(periodStart, periodEnd),
    [expenses, periodStart, periodEnd]
  );

  const pieData = useMemo(() => {
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        value,
        color: COLORS.categories[name] || COLORS.primary,
        text: '',
        label: name,
      }));
  }, [byCategory]);

  const hasPieData = pieData.length > 0;
  const [focusedPie, setFocusedPie] = useState(null);

  // ─── Chart 3: Horizontal bar chart (top categories) ───────────────
  const topCats = useMemo(() => getTopCategories(byCategory, 6), [byCategory]);

  const barData = useMemo(() => {
    return topCats.map(({ name, amount }) => ({
      value: amount,
      label: name.split(' ')[0],
      frontColor: COLORS.categories[name] || COLORS.primary,
      topLabelComponent: () => (
        <Text style={{ color: C.textMuted, fontSize: 9, marginBottom: 2 }}>
          {currency}{amount.toFixed(0)}
        </Text>
      ),
    }));
  }, [topCats, C.textMuted, currency]);

  const hasBarData = barData.length > 0;

  // Budget reference lines for top categories
  const budgetLineData = useMemo(() => {
    return topCats.map(({ name }) => {
      const b = budgets.find((b) => b.category === name && b.month === currentYearMonth);
      return b ? b.monthlyLimit : null;
    });
  }, [topCats, budgets, currentYearMonth]);

  // ─── Chart 4: Grouped bar chart (income vs expenses, 6 months) ────
  const groupedBarData = useMemo(() => {
    return last6Months.flatMap(({ yearMonth, label }) => {
      const spent  = expenses
        .filter((e) => e.date.startsWith(yearMonth))
        .reduce((s, e) => s + e.amount, 0);
      const earned = incomes
        .filter((i) => i.date.startsWith(yearMonth))
        .reduce((s, i) => s + i.amount, 0);
      return [
        {
          value: earned,
          label,
          frontColor: COLORS.success,
          spacing: 4,
          labelTextStyle: { color: C.textMuted, fontSize: 9 },
        },
        {
          value: spent,
          frontColor: COLORS.danger,
          spacing: 16,
        },
      ];
    });
  }, [expenses, incomes, last6Months, C.textMuted]);

  const hasGroupedData = groupedBarData.some((d) => d.value > 0);

  // ─── Chart 5: Heatmap data ─────────────────────────────────────────
  const dailyTotals = useMemo(
    () => getDailyTotalsForMonth(currentYearMonth),
    [expenses, currentYearMonth]
  );
  const hasHeatmapData = Object.keys(dailyTotals).length > 0;

  // Day drill-down: expenses for a tapped day
  const drillDayExpenses = useMemo(() => {
    if (!drillDay) return [];
    return expenses.filter((e) => e.date.startsWith(drillDay));
  }, [expenses, drillDay]);

  // Category drill-down: expenses for a tapped pie slice
  const drillCatExpenses = useMemo(() => {
    if (!drillCategory) return [];
    return periodExpenses.filter((e) => e.category === drillCategory);
  }, [periodExpenses, drillCategory]);

  // ─── Summary stats ────────────────────────────────────────────────
  const daysPassed    = getDate(today);
  const avgDailySpend = daysPassed > 0 ? totalSpent / daysPassed : 0;
  const savingsRate   = calcSavingsRate(totalIncome, totalSpent);
  const biggestDay    = getBiggestExpenseDay(dailyTotals);
  const topCatName    = topCats[0]?.name || '—';

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Reports</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>
            {format(today, 'MMMM yyyy')}
          </Text>
        </View>

        {/* Period Toggle */}
        <PeriodToggle
          value={period}
          onChange={setPeriod}
          style={styles.toggle}
        />

        {/* ── Chart 1: Spending Over Time ─────────────────────────── */}
        <ChartSection
          title="Spending Over Time"
          icon="chart-line"
          isEmpty={!hasLineData}
          emptyText="Add expenses to see your spending trend"
        >
          <LineChart
            data={lineData}
            width={CHART_W}
            height={160}
            spacing={period === 'Monthly' ? CHART_W / 32 : CHART_W / 8}
            color={COLORS.primary}
            thickness={2.5}
            startFillColor={COLORS.primary}
            endFillColor={COLORS.primary + '10'}
            startOpacity={0.25}
            endOpacity={0.02}
            areaChart
            curved
            hideDataPoints={period === 'Monthly'}
            dataPointsColor={COLORS.primary}
            dataPointsRadius={4}
            yAxisColor="transparent"
            xAxisColor={C.border}
            yAxisTextStyle={{ color: C.textMuted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 9 }}
            maxValue={lineMax}
            noOfSections={4}
            rulesColor={C.border}
            rulesType="solid"
            initialSpacing={8}
            endSpacing={8}
            formatYLabel={(v) => `${currency}${parseInt(v)}`}
          />
        </ChartSection>

        {/* ── Chart 2: Category Donut ──────────────────────────────── */}
        <ChartSection
          title="Category Breakdown"
          icon="chart-donut"
          isEmpty={!hasPieData}
          emptyText="Add categorised expenses to see the breakdown"
          footer={
            hasPieData ? (
              <CategoryLegend
                data={pieData}
                currency={currency}
                totalSpent={totalSpent}
                onPress={(label) => setDrillCategory(label)}
                C={C}
              />
            ) : null
          }
        >
          <View style={styles.donutRow}>
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={52}
              innerCircleColor={C.surface}
              centerLabelComponent={() => (
                <View style={styles.donutCenter}>
                  <Text style={[styles.donutTotal, { color: C.text }]}>
                    {currency}{totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={[styles.donutLabel, { color: C.textMuted }]}>total</Text>
                </View>
              )}
              focusOnPress
              onPress={(item) => setDrillCategory(item.label)}
            />
            {/* Top 4 slice labels */}
            <View style={styles.donutSideLegend}>
              {pieData.slice(0, 4).map((d) => (
                <TouchableOpacity
                  key={d.label}
                  style={styles.donutSideItem}
                  onPress={() => setDrillCategory(d.label)}
                >
                  <View style={[styles.dot, { backgroundColor: d.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.donutSideName, { color: C.text }]} numberOfLines={1}>
                      {d.label.split(' ')[0]}
                    </Text>
                    <Text style={[styles.donutSideAmt, { color: C.textMuted }]}>
                      {currency}{d.value.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ChartSection>

        {/* ── Chart 3: Top Categories Bar ──────────────────────────── */}
        <ChartSection
          title="Top Categories"
          icon="chart-bar"
          isEmpty={!hasBarData}
          emptyText="Add expenses to compare category spend"
        >
          <BarChart
            data={barData}
            width={CHART_W}
            height={160}
            barWidth={CHART_W / (barData.length * 2 + 1)}
            spacing={CHART_W / (barData.length * 4)}
            roundedTop
            roundedBottom
            hideRules={false}
            rulesColor={C.border}
            rulesType="solid"
            yAxisColor="transparent"
            xAxisColor={C.border}
            yAxisTextStyle={{ color: C.textMuted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 9 }}
            noOfSections={4}
            initialSpacing={12}
            showValuesAsTopLabel={false}
          />
          {/* Budget reference markers */}
          {topCats.some((_, i) => budgetLineData[i]) && (
            <View style={styles.budgetNote}>
              <View style={[styles.budgetDash, { backgroundColor: COLORS.warning }]} />
              <Text style={[styles.budgetNoteText, { color: C.textMuted }]}>
                — Budget limit
              </Text>
            </View>
          )}
        </ChartSection>

        {/* ── Chart 4: Income vs Expenses (6 months) ───────────────── */}
        <ChartSection
          title="Income vs Expenses"
          icon="chart-bar-stacked"
          isEmpty={!hasGroupedData}
          emptyText="Add income and expenses to compare"
          footer={
            hasGroupedData ? (
              <View style={styles.groupedLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.success }]} />
                  <Text style={[styles.legendText, { color: C.textMuted }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.danger }]} />
                  <Text style={[styles.legendText, { color: C.textMuted }]}>Expenses</Text>
                </View>
              </View>
            ) : null
          }
        >
          <BarChart
            data={groupedBarData}
            width={CHART_W}
            height={160}
            barWidth={16}
            spacing={4}
            roundedTop
            hideRules={false}
            rulesColor={C.border}
            rulesType="solid"
            yAxisColor="transparent"
            xAxisColor={C.border}
            yAxisTextStyle={{ color: C.textMuted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 9 }}
            noOfSections={4}
            initialSpacing={8}
          />
        </ChartSection>

        {/* ── Chart 5: Daily Heatmap ───────────────────────────────── */}
        <ChartSection
          title="Daily Spending Heatmap"
          icon="calendar-month"
          isEmpty={!hasHeatmapData}
          emptyText="Spend money this month to see the heatmap"
        >
          <SpendingHeatmap
            dailyTotals={dailyTotals}
            month={today}
            currency={currency}
            onDayPress={(dateStr, amount) => {
              if (amount > 0) setDrillDay(dateStr);
            }}
          />
        </ChartSection>

        {/* ── Summary Statistics ───────────────────────────────────── */}
        <View style={[styles.statsCard, { backgroundColor: C.surface }]}>
          <Text style={[styles.statsTitle, { color: C.text }]}>Summary Statistics</Text>

          <StatRow
            label="Average daily spend"
            value={`${currency}${avgDailySpend.toFixed(2)}`}
            C={C}
          />
          <StatRow
            label="Biggest expense day"
            value={
              biggestDay.day
                ? `${format(new Date(biggestDay.day), 'MMM d')} · ${currency}${biggestDay.amount.toFixed(2)}`
                : '—'
            }
            C={C}
          />
          <StatRow
            label="Most expensive category"
            value={topCatName}
            C={C}
          />
          <StatRow
            label="Savings rate"
            value={totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
            valueColor={
              savingsRate >= 20 ? COLORS.success :
              savingsRate >= 0  ? COLORS.warning :
              COLORS.danger
            }
            C={C}
            last
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Category Drill-Down Modal ───────────────────────────────── */}
      <DrillDownModal
        visible={!!drillCategory}
        title={drillCategory || ''}
        expenses={drillCatExpenses}
        currency={currency}
        C={C}
        onClose={() => setDrillCategory(null)}
      />

      {/* ── Day Drill-Down Modal ────────────────────────────────────── */}
      <DrillDownModal
        visible={!!drillDay}
        title={drillDay ? format(new Date(drillDay), 'EEEE, MMMM d') : ''}
        expenses={drillDayExpenses}
        currency={currency}
        C={C}
        onClose={() => setDrillDay(null)}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function CategoryLegend({ data, currency, totalSpent, onPress, C }) {
  return (
    <View style={styles.legendGrid}>
      {data.map((d) => {
        const pct = totalSpent > 0 ? ((d.value / totalSpent) * 100).toFixed(1) : '0';
        return (
          <TouchableOpacity
            key={d.label}
            style={styles.legendGridItem}
            onPress={() => onPress(d.label)}
          >
            <View style={[styles.legendColorSquare, { backgroundColor: d.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.legendCatName, { color: C.text }]} numberOfLines={1}>
                {d.label}
              </Text>
              <Text style={[styles.legendCatAmt, { color: C.textMuted }]}>
                {currency}{d.value.toFixed(2)} · {pct}%
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatRow({ label, value, valueColor, C, last }) {
  return (
    <View style={[
      styles.statRow,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
    ]}>
      <Text style={[styles.statLabel, { color: C.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor || C.text }]}>{value}</Text>
    </View>
  );
}

function DrillDownModal({ visible, title, expenses, currency, C, onClose }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: C.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: C.text }]}>{title}</Text>
              <Text style={[styles.modalSubtitle, { color: C.textMuted }]}>
                {expenses.length} transaction{expenses.length !== 1 ? 's' : ''} · {currency}{total.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <Text style={[styles.noData, { color: C.textMuted }]}>No transactions found.</Text>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(e) => e.id}
              renderItem={({ item }) => (
                <ExpenseCard
                  expense={item}
                  style={{ marginHorizontal: 0, marginBottom: 8 }}
                />
              )}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  toggle: { margin: 20, marginBottom: 16, marginTop: 12 },

  // Donut chart
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  donutCenter: { alignItems: 'center' },
  donutTotal: { fontSize: 16, fontWeight: '800' },
  donutLabel: { fontSize: 11 },
  donutSideLegend: { flex: 1, gap: 10 },
  donutSideItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  donutSideName: { fontSize: 13, fontWeight: '600' },
  donutSideAmt: { fontSize: 11 },

  // Category legend grid
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
  },
  legendColorSquare: { width: 12, height: 12, borderRadius: 3 },
  legendCatName: { fontSize: 12, fontWeight: '600' },
  legendCatAmt: { fontSize: 11 },

  // Grouped bar legend
  groupedLegend: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 12 },

  // Budget note
  budgetNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  budgetDash: { width: 20, height: 2 },
  budgetNoteText: { fontSize: 11 },

  // Summary stats card
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  statsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  // Drill-down modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 13, marginTop: 3 },
  noData: { textAlign: 'center', paddingVertical: 30, fontSize: 14 },
});
