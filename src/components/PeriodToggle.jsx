import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

const PERIODS = ['Daily', 'Weekly', 'Monthly'];

/**
 * Pill-style period switcher: Daily | Weekly | Monthly
 *
 * @param {string}   value    - currently selected period
 * @param {Function} onChange - called with the new period string
 */
export default function PeriodToggle({ value, onChange, style }) {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: C.surface }, style]}>
      {PERIODS.map((period) => {
        const active = value === period;
        return (
          <TouchableOpacity
            key={period}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(period)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, { color: active ? '#FFF' : C.textMuted }]}>
              {period}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
