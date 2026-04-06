import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Animated shimmer skeleton placeholder.
 * Drop-in replacement for any loading state.
 *
 * @param {number}  width   - box width (number or '100%')
 * @param {number}  height  - box height
 * @param {number}  radius  - border radius
 * @param {object}  style   - extra style overrides
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const { theme } = useSettingsStore();
  const isDark    = theme === 'dark';
  const baseColor = isDark ? '#1E293B' : '#E2E8F0';
  const shimColor = isDark ? '#334155' : '#F1F5F9';

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const bgColor = shimmer.interpolate({
    inputRange:  [0, 1],
    outputRange: [baseColor, shimColor],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: bgColor },
        style,
      ]}
    />
  );
}

/**
 * Pre-built skeleton for a single expense card row.
 */
export function ExpenseCardSkeleton() {
  const { theme } = useSettingsStore();
  const C = theme === 'dark' ? COLORS.dark : COLORS.light;
  return (
    <View style={[skStyles.card, { backgroundColor: C.surface }]}>
      <Skeleton width={46} height={46} radius={14} />
      <View style={skStyles.middle}>
        <Skeleton width="70%" height={14} radius={6} />
        <Skeleton width="45%" height={11} radius={5} style={{ marginTop: 6 }} />
      </View>
      <View style={skStyles.right}>
        <Skeleton width={64} height={14} radius={6} />
        <Skeleton width={44} height={11} radius={5} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * Pre-built skeleton for the summary card.
 */
export function SummaryCardSkeleton() {
  return (
    <View style={[skStyles.summaryCard, { backgroundColor: COLORS.primary + '60' }]}>
      <Skeleton width={120} height={13} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
      <Skeleton width={180} height={40} radius={8} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      <View style={skStyles.summaryRow}>
        <Skeleton width={80} height={16} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
        <Skeleton width={80} height={16} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
      </View>
    </View>
  );
}

/**
 * Pre-built skeleton for the budget card.
 */
export function BudgetCardSkeleton() {
  const { theme } = useSettingsStore();
  const C = theme === 'dark' ? COLORS.dark : COLORS.light;
  return (
    <View style={[skStyles.budgetCard, { backgroundColor: C.surface }]}>
      <View style={skStyles.budgetTop}>
        <Skeleton width={46} height={46} radius={14} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Skeleton width="60%" height={15} radius={6} />
          <Skeleton width="40%" height={11} radius={5} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={40} height={22} radius={6} />
      </View>
      <Skeleton width="100%" height={9} radius={5} style={{ marginTop: 4 }} />
      <View style={skStyles.budgetBottom}>
        <Skeleton width="40%" height={13} radius={5} />
        <Skeleton width="30%" height={13} radius={5} />
      </View>
    </View>
  );
}

/**
 * Pre-built skeleton for the Dashboard quick stats row.
 */
export function StatRowSkeleton() {
  const { theme } = useSettingsStore();
  const C = theme === 'dark' ? COLORS.dark : COLORS.light;
  return (
    <View style={skStyles.statRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[skStyles.statCard, { backgroundColor: C.surface }]}>
          <Skeleton width={22} height={22} radius={11} style={{ alignSelf: 'center' }} />
          <Skeleton width="80%" height={11} radius={5} style={{ alignSelf: 'center', marginTop: 5 }} />
          <Skeleton width="60%" height={14} radius={5} style={{ alignSelf: 'center', marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, gap: 12,
    marginHorizontal: 20, marginBottom: 8,
  },
  middle: { flex: 1 },
  right: { alignItems: 'flex-end' },
  summaryCard: {
    borderRadius: 22, padding: 22,
    marginHorizontal: 20, marginBottom: 16, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  budgetCard: {
    borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginBottom: 12,
  },
  budgetTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  budgetBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 22 },
  statCard: { flex: 1, borderRadius: 14, padding: 12 },
});
