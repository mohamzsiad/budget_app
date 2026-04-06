import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameMonth,
} from 'date-fns';
import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL = 36;
const GAP  = 4;

/**
 * Calendar-style daily spending heatmap.
 * Colour intensity = spend amount for that day.
 *
 * @param {Object}   dailyTotals  - { 'yyyy-MM-dd': amount }
 * @param {Date}     month        - Reference date for the displayed month
 * @param {string}   currency     - Currency symbol
 * @param {Function} onDayPress   - Called with (dateString, amount)
 */
export default function SpendingHeatmap({
  dailyTotals = {},
  month = new Date(),
  currency = '$',
  onDayPress,
}) {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const monthStart = startOfMonth(month);
  const monthEnd   = endOfMonth(month);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Determine max spend for colour scale
  const maxSpend = Math.max(...Object.values(dailyTotals), 1);

  // Leading empty cells so the first day lands on the right column
  const startWeekday = getDay(monthStart); // 0 = Sun
  const leadingBlanks = Array(startWeekday).fill(null);
  const allCells = [...leadingBlanks, ...days];

  // Build rows of 7
  const rows = [];
  for (let i = 0; i < allCells.length; i += 7) {
    rows.push(allCells.slice(i, i + 7));
  }

  function getCellColor(date) {
    if (!date) return 'transparent';
    const key    = format(date, 'yyyy-MM-dd');
    const amount = dailyTotals[key] || 0;
    if (amount === 0) return isDark ? C.surfaceAlt : '#F1F5F9';

    const intensity = Math.min(amount / maxSpend, 1);
    // Interpolate from light indigo to deep indigo
    const alpha = Math.round(20 + intensity * 235).toString(16).padStart(2, '0');
    return `${COLORS.primary}${alpha}`;
  }

  function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <View style={styles.container}>
      {/* Day-of-week labels */}
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={[styles.dayLabel, { color: C.textMuted }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar rows */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((day, colIdx) => {
            if (!day) {
              return <View key={`blank-${colIdx}`} style={styles.cell} />;
            }
            const key    = format(day, 'yyyy-MM-dd');
            const amount = dailyTotals[key] || 0;
            const bgColor = getCellColor(day);
            const isToday = key === format(new Date(), 'yyyy-MM-dd');

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.cell,
                  { backgroundColor: bgColor },
                  isToday && styles.todayCell,
                ]}
                onPress={() => onDayPress?.(key, amount)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNum,
                  {
                    color: amount > 0
                      ? (amount / maxSpend > 0.5 ? '#FFF' : C.text)
                      : C.textMuted,
                    fontWeight: isToday ? '800' : '400',
                  },
                ]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Pad short final row */}
          {row.length < 7 && Array(7 - row.length).fill(null).map((_, i) => (
            <View key={`pad-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}

      {/* Colour scale legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendLabel, { color: C.textMuted }]}>Less</Text>
        {[0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map((v) => {
          const alpha = Math.round(20 + v * 235).toString(16).padStart(2, '0');
          return (
            <View
              key={v}
              style={[styles.legendDot, { backgroundColor: `${COLORS.primary}${alpha}` }]}
            />
          );
        })}
        <Text style={[styles.legendLabel, { color: C.textMuted }]}>More</Text>
        <Text style={[styles.legendMax, { color: C.textMuted }]}>
          Max: {currency}{fmt(maxSpend)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  dayLabels: {
    flexDirection: 'row',
    marginBottom: GAP,
  },
  dayLabel: {
    width: CELL,
    marginRight: GAP,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 8,
    marginRight: GAP,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayNum: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  legendLabel: { fontSize: 10 },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendMax: {
    fontSize: 10,
    marginLeft: 'auto',
  },
});
