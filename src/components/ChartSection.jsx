import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Reusable wrapper card for every chart on the Reports screen.
 * Handles: title, icon, loading state, empty state, and optional info tooltip.
 *
 * @param {string}    title      - Card heading
 * @param {string}    icon       - MaterialCommunityIcons name
 * @param {boolean}   loading    - Show spinner
 * @param {boolean}   isEmpty    - Show empty placeholder instead of children
 * @param {string}    emptyText  - Message when no data
 * @param {ReactNode} children   - The actual chart
 * @param {ReactNode} footer     - Optional footer row (legend, drill-down, etc.)
 */
export default function ChartSection({
  title,
  icon = 'chart-line',
  loading = false,
  isEmpty = false,
  emptyText = 'Add expenses to see this chart',
  children,
  footer,
  style,
}) {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.card, { backgroundColor: C.surface }, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: COLORS.primary + '18' }]}>
          <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} />
        </View>
        <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name={icon} size={44} color={C.textMuted} style={{ opacity: 0.4 }} />
          <Text style={[styles.emptyText, { color: C.textMuted }]}>{emptyText}</Text>
        </View>
      ) : (
        <View style={styles.body}>{children}</View>
      )}

      {/* Footer (legend, etc.) */}
      {!loading && !isEmpty && footer && (
        <View style={[styles.footer, { borderTopColor: C.border }]}>
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  body: { overflow: 'hidden' },
  center: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
