import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, isToday, isYesterday } from 'date-fns';

import { COLORS } from '../constants/colors';
import { CATEGORY_MAP } from '../utils/categories';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';

/**
 * A single expense row card.
 * Shows: category icon/emoji, title, subcategory, date, amount, payment method.
 * Tap → Expense Detail screen.
 */
export default function ExpenseCard({ expense, onDelete, style }) {
  const navigation = useNavigation();
  const { theme } = useSettingsStore();
  const { deleteExpense } = useExpenseStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const cat = CATEGORY_MAP[expense.category];
  const catColor = COLORS.categories[expense.category] || COLORS.primary;

  // Slide-to-delete animation
  const translateX = useRef(new Animated.Value(0)).current;

  function formatExpenseDate(isoString) {
    const d = new Date(isoString);
    if (isToday(d))     return `Today · ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday · ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d · h:mm a');
  }

  function handleLongPress() {
    Alert.alert(
      expense.title || expense.category,
      `${expense.currency}${expense.amount.toFixed(2)}`,
      [
        { text: 'View Details', onPress: () => navigation.navigate('ExpenseDetail', { expense }) },
        { text: 'Edit', onPress: () => navigation.navigate('EditExpense', { expense }) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteExpense(expense.id);
            onDelete?.();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface }, style]}
      onPress={() => navigation.navigate('ExpenseDetail', { expense })}
      onLongPress={handleLongPress}
      activeOpacity={0.75}
    >
      {/* Category Icon */}
      <View style={[styles.iconWrap, { backgroundColor: catColor + '18' }]}>
        <Text style={styles.emoji}>{cat?.emoji || '💰'}</Text>
      </View>

      {/* Middle: title + date */}
      <View style={styles.middle}>
        <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
          {expense.title || expense.category}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: C.textMuted }]}>
            {formatExpenseDate(expense.date)}
          </Text>
          {expense.isRecurring && (
            <View style={[styles.badge, { backgroundColor: COLORS.primary + '18' }]}>
              <MaterialCommunityIcons name="refresh" size={10} color={COLORS.primary} />
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                {expense.recurringFrequency}
              </Text>
            </View>
          )}
        </View>
        {expense.subcategory ? (
          <Text style={[styles.subcategory, { color: C.textMuted }]} numberOfLines={1}>
            {expense.subcategory}
          </Text>
        ) : null}
      </View>

      {/* Right: amount + payment */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: C.text }]}>
          -{expense.currency}{expense.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <Text style={[styles.paymentMethod, { color: C.textMuted }]}>
          {getPaymentIcon(expense.paymentMethod)} {expense.paymentMethod}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function getPaymentIcon(method) {
  switch (method) {
    case 'Credit Card':  return '💳';
    case 'Debit Card':   return '💳';
    case 'Cash':         return '💵';
    case 'Bank Transfer':return '🏦';
    default:             return '💰';
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 22 },
  middle: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 12 },
  subcategory: { fontSize: 11, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '700' },
  paymentMethod: { fontSize: 11 },
});
