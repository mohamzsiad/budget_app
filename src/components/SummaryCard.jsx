import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

/**
 * The big summary card shown at the top of the Dashboard.
 * Displays: Total Spent, Total Income, Net Balance, and budget progress bar.
 *
 * @param {number}  totalSpent
 * @param {number}  totalIncome
 * @param {number}  totalBudget   - sum of all active monthly budgets (0 = no budget set)
 * @param {string}  currency      - currency symbol
 * @param {string}  period        - 'Daily' | 'Weekly' | 'Monthly'
 */
export default function SummaryCard({
  totalSpent = 0,
  totalIncome = 0,
  totalBudget = 0,
  currency = '$',
  period = 'Monthly',
}) {
  const netBalance = totalIncome - totalSpent;
  const isPositive = netBalance >= 0;
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const budgetColor =
    budgetPct >= 90 ? '#EF4444' :
    budgetPct >= 70 ? '#F59E0B' :
    '#FFFFFF';

  function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <LinearGradient
      colors={['#6366F1', '#818CF8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Top label */}
      <Text style={styles.periodLabel}>{period} Overview</Text>

      {/* Main amount */}
      <Text style={styles.mainAmount}>
        {currency}{fmt(totalSpent)}
      </Text>
      <Text style={styles.mainLabel}>Total Spent</Text>

      {/* Divider row */}
      <View style={styles.divider} />

      {/* Income / Balance row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <MaterialCommunityIcons name="arrow-down-circle" size={14} color="rgba(255,255,255,0.75)" />
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <Text style={styles.statValue}>{currency}{fmt(totalIncome)}</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <MaterialCommunityIcons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.statLabel}>Balance</Text>
          </View>
          <Text style={[styles.statValue, { color: isPositive ? '#4ADE80' : '#FCA5A5' }]}>
            {isPositive ? '+' : '-'}{currency}{fmt(Math.abs(netBalance))}
          </Text>
        </View>
      </View>

      {/* Budget progress */}
      {totalBudget > 0 && (
        <View style={styles.budgetSection}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>
              Budget Used
            </Text>
            <Text style={[styles.budgetPct, { color: budgetColor }]}>
              {budgetPct.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${budgetPct}%`,
                  backgroundColor: budgetColor,
                },
              ]}
            />
          </View>
          <Text style={styles.budgetRemaining}>
            {currency}{fmt(Math.max(totalBudget - totalSpent, 0))} remaining of {currency}{fmt(totalBudget)}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  periodLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  mainAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  mainLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  budgetSection: {
    gap: 6,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  budgetPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetRemaining: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
});
