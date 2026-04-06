import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDaysInMonth, getDate, format } from 'date-fns';
import { COLORS } from '../constants/colors';
import { CATEGORY_MAP } from '../utils/categories';
import { useSettingsStore } from '../store/settingsStore';
import { useBudgetStore } from '../store/budgetStore';

/**
 * Full budget card — shows category, progress bar, spend vs limit,
 * days remaining, and projected end-of-month spend.
 *
 * @param {object}   budget       - budget record from budgetStore
 * @param {Function} onEdit       - called when the card is long-pressed
 */
export default function BudgetCard({ budget, onEdit }) {
  const { theme, currency } = useSettingsStore();
  const { deleteBudget }    = useBudgetStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const today        = new Date();
  const daysPassed   = getDate(today);
  const daysInMonth  = getDaysInMonth(today);
  const daysLeft     = daysInMonth - daysPassed;

  const spent  = budget.spent  || 0;
  const limit  = budget.monthlyLimit || 1;
  const pct    = Math.min((spent / limit) * 100, 100);

  // Projection: daily average × days in month
  const dailyAvg  = daysPassed > 0 ? spent / daysPassed : 0;
  const projected = dailyAvg * daysInMonth;
  const remaining = Math.max(limit - spent, 0);

  // Colour thresholds
  const barColor =
    pct >= 100 ? COLORS.danger :
    pct >= 80  ? COLORS.danger :
    pct >= 60  ? COLORS.warning :
                 COLORS.success;

  const projectedOver = projected > limit;
  const cat = CATEGORY_MAP[budget.category];

  // Animated width for progress bar
  const widthAnim = useRef(new Animated.Value(0)).current;
  Animated.timing(widthAnim, {
    toValue: pct,
    duration: 600,
    useNativeDriver: false,
  }).start();

  function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function handleLongPress() {
    Alert.alert(
      budget.category,
      `${currency}${fmt(spent)} spent of ${currency}${fmt(limit)}`,
      [
        { text: 'Edit Budget',  onPress: () => onEdit?.(budget) },
        {
          text: 'Delete Budget',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete Budget?', 'This budget will be removed.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(budget.id) },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface }]}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      {/* Top row: icon + name + percentage */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: (COLORS.categories[budget.category] || COLORS.primary) + '18' }]}>
          <Text style={styles.emoji}>{cat?.emoji || '💰'}</Text>
        </View>

        <View style={styles.nameCol}>
          <Text style={[styles.categoryName, { color: C.text }]}>{budget.category}</Text>
          <Text style={[styles.daysLeft, { color: C.textMuted }]}>
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in month
          </Text>
        </View>

        <View style={styles.pctWrap}>
          <Text style={[styles.pctText, { color: barColor }]}>{pct.toFixed(0)}%</Text>
          {pct >= (budget.alertThreshold || 80) && pct < 100 && (
            <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.warning} />
          )}
          {pct >= 100 && (
            <MaterialCommunityIcons name="alert-octagon" size={14} color={COLORS.danger} />
          )}
        </View>
      </View>

      {/* Animated progress bar */}
      <View style={[styles.track, { backgroundColor: C.border }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Spend row */}
      <View style={styles.spendRow}>
        <Text style={[styles.spentText, { color: C.text }]}>
          {currency}{fmt(spent)}
          <Text style={[styles.limitText, { color: C.textMuted }]}> / {currency}{fmt(limit)}</Text>
        </Text>
        <Text style={[styles.remainText, { color: pct >= 100 ? COLORS.danger : COLORS.success }]}>
          {pct >= 100
            ? `Over by ${currency}${fmt(spent - limit)}`
            : `${currency}${fmt(remaining)} left`}
        </Text>
      </View>

      {/* Projection row */}
      <View style={[styles.projectionRow, { backgroundColor: (projectedOver ? COLORS.danger : COLORS.success) + '12' }]}>
        <MaterialCommunityIcons
          name={projectedOver ? 'trending-up' : 'trending-down'}
          size={13}
          color={projectedOver ? COLORS.danger : COLORS.success}
        />
        <Text style={[styles.projectionText, { color: projectedOver ? COLORS.danger : COLORS.success }]}>
          Projected: {currency}{fmt(projected)} by end of month
          {projectedOver ? ' — over budget!' : ' — on track ✓'}
        </Text>
      </View>

      {/* Alert threshold indicator */}
      {budget.alertThreshold && pct < budget.alertThreshold && (
        <View style={styles.thresholdHint}>
          <Text style={[styles.thresholdText, { color: C.textMuted }]}>
            Alert at {budget.alertThreshold}% · {currency}{fmt((budget.alertThreshold / 100) * limit)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 22 },
  nameCol: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '700' },
  daysLeft: { fontSize: 12, marginTop: 2 },
  pctWrap: { alignItems: 'center', gap: 3 },
  pctText: { fontSize: 20, fontWeight: '800' },
  track: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: { height: '100%', borderRadius: 5 },
  spendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spentText: { fontSize: 14, fontWeight: '700' },
  limitText: { fontWeight: '400', fontSize: 14 },
  remainText: { fontSize: 13, fontWeight: '600' },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 2,
  },
  projectionText: { fontSize: 12, flex: 1 },
  thresholdHint: { marginTop: 6 },
  thresholdText: { fontSize: 11 },
});
