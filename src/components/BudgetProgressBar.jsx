import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Reusable budget progress bar.
 * Color: green < 60%, yellow 60–80%, red > 80%
 *
 * @param {number} spent       - amount spent
 * @param {number} limit       - budget limit
 * @param {string} currency    - currency symbol
 * @param {boolean} showLabels - show spent/limit labels below
 * @param {number} height      - bar height in px (default 8)
 */
export default function BudgetProgressBar({
  spent = 0,
  limit = 0,
  currency = '$',
  showLabels = true,
  height = 8,
  style,
}) {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const barColor =
    pct >= 100 ? COLORS.danger :
    pct >= 80  ? COLORS.danger :
    pct >= 60  ? COLORS.warning :
                 COLORS.success;

  function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, backgroundColor: C.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={[styles.spentText, { color: barColor }]}>
            {currency}{fmt(spent)} spent
          </Text>
          <Text style={[styles.limitText, { color: C.textMuted }]}>
            of {currency}{fmt(limit)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  track: {
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  spentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  limitText: {
    fontSize: 12,
  },
});
