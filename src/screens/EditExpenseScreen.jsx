import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';

import { COLORS } from '../constants/colors';
import { CATEGORIES } from '../utils/categories';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

export default function EditExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { expense } = route.params || {};
  const { theme, currency } = useSettingsStore();
  const { updateExpense, deleteExpense } = useExpenseStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const initCat = CATEGORIES.find((c) => c.name === expense?.category) || null;

  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [category, setCategory] = useState(initCat);
  const [subcategory, setSubcategory] = useState(expense?.subcategory || null);
  const [title, setTitle] = useState(expense?.title || '');
  const [note, setNote] = useState(expense?.note || '');
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod || 'Cash');
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring || false);

  function handleUpdate() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    updateExpense(expense.id, {
      amount: parseFloat(amount),
      category: category?.name || expense?.category,
      subcategory: subcategory || '',
      title,
      note,
      paymentMethod,
      isRecurring,
      updatedAt: new Date().toISOString(),
    });
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert('Delete Expense', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(expense.id);
          navigation.navigate('Dashboard');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Edit Expense</Text>
          <TouchableOpacity onPress={handleUpdate}>
            <Text style={[styles.saveBtn, { color: COLORS.primary }]}>Update</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.amountCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.amountLabel}>Amount ({currency})</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <Field label="Title" C={C}>
              <TextInput
                style={[styles.textField, { backgroundColor: C.surface, color: C.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Expense title"
                placeholderTextColor={C.textMuted}
              />
            </Field>

            <Field label="Payment Method" C={C}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: paymentMethod === method ? COLORS.primary : C.surface,
                          borderColor: paymentMethod === method ? COLORS.primary : C.border,
                        },
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text style={[styles.chipText, { color: paymentMethod === method ? '#FFF' : C.text }]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Field>

            <Field label="Note (optional)" C={C}>
              <TextInput
                style={[styles.textField, styles.noteField, { backgroundColor: C.surface, color: C.text }]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note..."
                placeholderTextColor={C.textMuted}
                multiline
              />
            </Field>

            <View style={[styles.toggleRow, { backgroundColor: C.surface }]}>
              <Text style={[styles.toggleLabel, { color: C.text }]}>Recurring</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: C.border, true: COLORS.primary + '80' }}
                thumbColor={isRecurring ? COLORS.primary : C.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.deleteText, { color: COLORS.danger }]}>Delete Expense</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, C }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: C.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 16, fontWeight: '700' },
  amountCard: {
    padding: 24, alignItems: 'center', marginHorizontal: 20,
    borderRadius: 20, marginBottom: 20,
  },
  amountLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 },
  amountInput: { fontSize: 48, fontWeight: '800', color: '#FFF', textAlign: 'center', minWidth: 200 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontWeight: '600', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  textField: { borderRadius: 12, padding: 14, fontSize: 15 },
  noteField: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 20,
  },
  deleteText: { fontSize: 15, fontWeight: '600' },
});
