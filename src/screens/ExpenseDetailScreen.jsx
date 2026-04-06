import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';

import { COLORS } from '../constants/colors';
import { CATEGORIES } from '../utils/categories';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';

export default function ExpenseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { expense } = route.params || {};
  const { theme } = useSettingsStore();
  const { deleteExpense } = useExpenseStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  if (!expense) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={[styles.errorText, { color: C.text }]}>Expense not found.</Text>
      </SafeAreaView>
    );
  }

  const cat = CATEGORIES.find((c) => c.name === expense.category);

  function handleDelete() {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(expense.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={[styles.topCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.topEmoji}>{cat?.emoji || '💰'}</Text>
          <Text style={styles.topAmount}>{expense.currency}{expense.amount.toFixed(2)}</Text>
          <Text style={styles.topTitle}>{expense.title}</Text>
          <Text style={styles.topDate}>
            {format(new Date(expense.date), 'EEEE, MMMM d, yyyy  h:mm a')}
          </Text>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: C.surface }]}>
          <DetailRow label="Category" value={`${cat?.emoji || ''} ${expense.category}`} C={C} />
          {expense.subcategory ? (
            <DetailRow label="Subcategory" value={expense.subcategory} C={C} />
          ) : null}
          <DetailRow label="Payment Method" value={expense.paymentMethod} C={C} />
          {expense.note ? (
            <DetailRow label="Note" value={expense.note} C={C} />
          ) : null}
          {expense.isRecurring ? (
            <DetailRow label="Recurring" value={`🔄 ${expense.recurringFrequency}`} C={C} />
          ) : null}
          <DetailRow
            label="Added"
            value={format(new Date(expense.createdAt), 'MMM d, yyyy h:mm a')}
            C={C}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('EditExpense', { expense })}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
            <Text style={styles.editBtnText}>Edit Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: COLORS.danger }]}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.deleteBtnText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, C }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: C.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: C.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topCard: { alignItems: 'center', padding: 32, gap: 6 },
  topEmoji: { fontSize: 48, marginBottom: 4 },
  topAmount: { color: '#FFF', fontSize: 40, fontWeight: '800' },
  topTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '600' },
  topDate: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  detailCard: { margin: 20, borderRadius: 16, overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  actions: { paddingHorizontal: 20, gap: 12 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, padding: 16,
  },
  editBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, padding: 16, borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 16, fontWeight: '700' },
  errorText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
