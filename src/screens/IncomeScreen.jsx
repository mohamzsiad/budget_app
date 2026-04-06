import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import uuid from 'react-native-uuid';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useIncomeStore } from '../store/incomeStore';

const SOURCES = ['Salary', 'Freelance', 'Investment', 'Rental', 'Side Business', 'Gift', 'Other'];
const RECURRING_OPTIONS = ['Daily', 'Weekly', 'Monthly'];

export default function IncomeScreen() {
  const { theme, currency } = useSettingsStore();
  const { incomes, addIncome, deleteIncome } = useIncomeStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('Monthly');

  const totalThisMonth = incomes
    .filter((i) => i.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, i) => sum + i.amount, 0);

  function handleAdd() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    addIncome({
      id: uuid.v4(),
      amount: parseFloat(amount),
      source,
      description,
      date: new Date().toISOString(),
      isRecurring,
      recurringFrequency: isRecurring ? frequency : null,
      currency,
    });
    setShowModal(false);
    setAmount('');
    setDescription('');
    setIsRecurring(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Income</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => setShowModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.summaryLabel}>{format(new Date(), 'MMMM yyyy')} Income</Text>
          <Text style={styles.summaryAmount}>{currency}{totalThisMonth.toFixed(2)}</Text>
        </View>

        {/* Income List */}
        {incomes.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: C.surface }]}>
            <MaterialCommunityIcons name="cash-plus" size={52} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>No income recorded</Text>
            <Text style={[styles.emptySub, { color: C.textMuted }]}>Tap + to add your income</Text>
          </View>
        ) : (
          incomes.map((income) => (
            <View key={income.id} style={[styles.incomeCard, { backgroundColor: C.surface }]}>
              <View style={styles.incomeLeft}>
                <Text style={styles.sourceEmoji}>
                  {income.source === 'Salary' ? '💼' : income.source === 'Freelance' ? '💻' : income.source === 'Investment' ? '📈' : '💵'}
                </Text>
                <View>
                  <Text style={[styles.incomeSource, { color: C.text }]}>{income.source}</Text>
                  <Text style={[styles.incomeDesc, { color: C.textMuted }]}>
                    {income.description || format(new Date(income.date), 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>
              <View style={styles.incomeRight}>
                <Text style={[styles.incomeAmount, { color: COLORS.success }]}>
                  +{income.currency}{income.amount.toFixed(2)}
                </Text>
                {income.isRecurring && (
                  <Text style={[styles.recurringBadge, { color: COLORS.primary }]}>
                    🔄 {income.recurringFrequency}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: C.background }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Add Income</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: C.surface, color: C.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder={`Amount (${currency})`}
              placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={[styles.modalLabel, { color: C.textMuted }]}>Source</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.chipRow}>
                {SOURCES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chip,
                      { borderColor: C.border },
                      source === s && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    ]}
                    onPress={() => setSource(s)}
                  >
                    <Text style={[styles.chipText, { color: source === s ? '#FFF' : C.text }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.modalInput, { backgroundColor: C.surface, color: C.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={C.textMuted}
            />

            <View style={[styles.toggleRow, { backgroundColor: C.surface }]}>
              <Text style={[styles.toggleLabel, { color: C.text }]}>Recurring</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: C.border, true: COLORS.primary + '80' }}
                thumbColor={isRecurring ? COLORS.primary : C.textMuted}
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: C.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: C.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: COLORS.primary }]}
                onPress={handleAdd}
              >
                <Text style={styles.modalSaveText}>Add Income</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 },
  summaryAmount: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  emptyState: {
    marginHorizontal: 20, borderRadius: 20, padding: 36,
    alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13 },
  incomeCard: {
    marginHorizontal: 20, borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  incomeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceEmoji: { fontSize: 28 },
  incomeSource: { fontSize: 15, fontWeight: '700' },
  incomeDesc: { fontSize: 12, marginTop: 2 },
  incomeRight: { alignItems: 'flex-end' },
  incomeAmount: { fontSize: 16, fontWeight: '700' },
  recurringBadge: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 20,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSave: { flex: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
