import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal, Switch, FlatList,
  RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  format, getDaysInMonth, getDate, subMonths, startOfMonth,
} from 'date-fns';

import { COLORS } from '../constants/colors';
import { CATEGORIES } from '../utils/categories';
import { useSettingsStore } from '../store/settingsStore';
import { useBudgetStore } from '../store/budgetStore';
import { useExpenseStore } from '../store/expenseStore';
import BudgetCard from '../components/BudgetCard';

const ALERT_THRESHOLDS = [50, 60, 70, 80, 90];

export default function BudgetScreen() {
  const { theme, currency }              = useSettingsStore();
  const { expenses }                     = useExpenseStore();
  const {
    budgets, addBudget, updateBudget,
    deleteBudget, syncBudgetSpent, copyLastMonthBudgets,
  } = useBudgetStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const today        = new Date();
  const currentMonth = format(today, 'yyyy-MM');
  const lastMonth    = format(subMonths(today, 1), 'yyyy-MM');
  const daysInMonth  = getDaysInMonth(today);
  const daysLeft     = daysInMonth - getDate(today);

  // Sync budget spent figures every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      syncBudgetSpent(expenses, currentMonth);
    }, [expenses, currentMonth])
  );

  const [refreshing, setRefreshing]   = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);  // null = new, object = edit

  // ─── Form state ────────────────────────────────────────────────────
  const [selCategory, setSelCategory]   = useState(null);
  const [limitInput, setLimitInput]     = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [searchCat, setSearchCat]       = useState('');

  // ─── Current month budgets ─────────────────────────────────────────
  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === currentMonth),
    [budgets, currentMonth]
  );

  const lastMonthBudgets = useMemo(
    () => budgets.filter((b) => b.month === lastMonth),
    [budgets, lastMonth]
  );

  // ─── Overall summary ───────────────────────────────────────────────
  const totalLimit = useMemo(
    () => monthBudgets.reduce((s, b) => s + b.monthlyLimit, 0),
    [monthBudgets]
  );
  const totalSpent = useMemo(
    () => monthBudgets.reduce((s, b) => s + (b.spent || 0), 0),
    [monthBudgets]
  );
  const overallPct = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const overallColor =
    overallPct >= 90 ? COLORS.danger :
    overallPct >= 70 ? COLORS.warning :
                       COLORS.success;

  // Categories that still don't have a budget this month (for the add form)
  const unbudgetedCategories = useMemo(() => {
    const used = new Set(monthBudgets.map((b) => b.category));
    return CATEGORIES.filter(
      (c) =>
        !used.has(c.name) &&
        c.name.toLowerCase().includes(searchCat.toLowerCase())
    );
  }, [monthBudgets, searchCat]);

  // ─── Helpers ───────────────────────────────────────────────────────
  function openAddModal() {
    setEditingBudget(null);
    setSelCategory(null);
    setLimitInput('');
    setAlertThreshold(80);
    setSearchCat('');
    setShowModal(true);
  }

  function openEditModal(budget) {
    setEditingBudget(budget);
    const cat = CATEGORIES.find((c) => c.name === budget.category) || null;
    setSelCategory(cat);
    setLimitInput(String(budget.monthlyLimit));
    setAlertThreshold(budget.alertThreshold || 80);
    setShowModal(true);
  }

  function handleSave() {
    const parsed = parseFloat(limitInput);
    if (!selCategory && !editingBudget) {
      Alert.alert('Select a category', 'Please choose a category for this budget.');
      return;
    }
    if (!limitInput || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid limit', 'Please enter a valid monthly budget amount.');
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        monthlyLimit: parsed,
        alertThreshold,
      });
    } else {
      addBudget({
        id: Date.now().toString(),
        category: selCategory.name,
        monthlyLimit: parsed,
        alertThreshold,
        month: currentMonth,
        spent: 0,
        currency,
      });
    }
    setShowModal(false);
  }

  async function handleCopyLastMonth() {
    if (lastMonthBudgets.length === 0) {
      Alert.alert('No previous budgets', `No budgets found for ${format(subMonths(today, 1), 'MMMM yyyy')}.`);
      return;
    }
    Alert.alert(
      'Copy Last Month\'s Budgets',
      `This will copy ${lastMonthBudgets.length} budget${lastMonthBudgets.length > 1 ? 's' : ''} from ${format(subMonths(today, 1), 'MMMM')} to ${format(today, 'MMMM')}. Existing budgets won't be overwritten.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: async () => {
            await copyLastMonthBudgets(lastMonth, currentMonth);
            syncBudgetSpent(expenses, currentMonth);
          },
        },
      ]
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    syncBudgetSpent(expenses, currentMonth);
    setRefreshing(false);
  }

  function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: C.text }]}>Budget</Text>
            <Text style={[styles.subtitle, { color: C.textMuted }]}>
              {format(today, 'MMMM yyyy')} · {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </Text>
          </View>
          <View style={styles.headerActions}>
            {lastMonthBudgets.length > 0 && monthBudgets.length === 0 && (
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: C.surface }]}
                onPress={handleCopyLastMonth}
              >
                <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
                <Text style={[styles.copyBtnText, { color: COLORS.primary }]}>Copy last month</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: COLORS.primary }]}
              onPress={openAddModal}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Overall Summary Card ───────────────────────────────── */}
        {monthBudgets.length > 0 && (
          <View style={[styles.overallCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.overallTop}>
              <View>
                <Text style={styles.overallLabel}>Total Budget</Text>
                <Text style={styles.overallAmount}>
                  {currency}{fmt(totalSpent)}
                  <Text style={styles.overallOf}> / {currency}{fmt(totalLimit)}</Text>
                </Text>
              </View>
              <View style={styles.overallRight}>
                <Text style={[styles.overallPct, { color: overallColor === COLORS.danger ? '#FCA5A5' : '#4ADE80' }]}>
                  {overallPct.toFixed(0)}%
                </Text>
                <Text style={styles.overallUsed}>used</Text>
              </View>
            </View>

            <View style={styles.overallTrack}>
              <View
                style={[
                  styles.overallFill,
                  {
                    width: `${overallPct}%`,
                    backgroundColor: overallPct >= 90 ? '#FCA5A5' : '#4ADE80',
                  },
                ]}
              />
            </View>

            {/* Mini stats row */}
            <View style={styles.overallStats}>
              <OverallStat
                icon="check-circle-outline"
                label="Remaining"
                value={`${currency}${fmt(Math.max(totalLimit - totalSpent, 0))}`}
                color="#4ADE80"
              />
              <View style={styles.overallDivider} />
              <OverallStat
                icon="calendar-today"
                label="Daily budget"
                value={daysLeft > 0 ? `${currency}${fmt(Math.max(totalLimit - totalSpent, 0) / daysLeft)}` : '—'}
                color="rgba(255,255,255,0.9)"
              />
              <View style={styles.overallDivider} />
              <OverallStat
                icon="alert-outline"
                label="Over budget"
                value={String(monthBudgets.filter((b) => (b.spent || 0) > b.monthlyLimit).length)}
                color={monthBudgets.some((b) => (b.spent || 0) > b.monthlyLimit) ? '#FCA5A5' : 'rgba(255,255,255,0.9)'}
              />
            </View>
          </View>
        )}

        {/* ── Budget Cards ───────────────────────────────────────── */}
        {monthBudgets.length === 0 ? (
          <EmptyState
            onAdd={openAddModal}
            onCopy={lastMonthBudgets.length > 0 ? handleCopyLastMonth : null}
            C={C}
          />
        ) : (
          <>
            {/* Sort: over-budget first, then by % descending */}
            {[...monthBudgets]
              .sort((a, b) => {
                const pa = (a.spent || 0) / a.monthlyLimit;
                const pb = (b.spent || 0) / b.monthlyLimit;
                return pb - pa;
              })
              .map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={openEditModal}
                />
              ))}

            {/* Add more / Copy buttons at bottom */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.bottomBtn, { backgroundColor: C.surface }]}
                onPress={openAddModal}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={COLORS.primary} />
                <Text style={[styles.bottomBtnText, { color: COLORS.primary }]}>Add Category</Text>
              </TouchableOpacity>

              {lastMonthBudgets.length > 0 && (
                <TouchableOpacity
                  style={[styles.bottomBtn, { backgroundColor: C.surface }]}
                  onPress={handleCopyLastMonth}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color={C.textMuted} />
                  <Text style={[styles.bottomBtnText, { color: C.textMuted }]}>Copy last month</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add / Edit Budget Modal ────────────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: C.background }]}>

              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  {editingBudget ? `Edit: ${editingBudget.category}` : 'New Budget'}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* Category selector (only for new budgets) */}
                {!editingBudget && (
                  <>
                    <Text style={[styles.modalLabel, { color: C.textMuted }]}>Category</Text>
                    <View style={[styles.searchWrap, { backgroundColor: C.surface }]}>
                      <MaterialCommunityIcons name="magnify" size={18} color={C.textMuted} />
                      <TextInput
                        style={[styles.searchInput, { color: C.text }]}
                        value={searchCat}
                        onChangeText={setSearchCat}
                        placeholder="Search categories..."
                        placeholderTextColor={C.textMuted}
                      />
                    </View>

                    <View style={styles.categoryGrid}>
                      {unbudgetedCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.name}
                          style={[
                            styles.catItem,
                            { borderColor: C.border },
                            selCategory?.name === cat.name && {
                              backgroundColor: COLORS.primary + '18',
                              borderColor: COLORS.primary,
                            },
                          ]}
                          onPress={() => setSelCategory(cat)}
                        >
                          <Text style={styles.catEmoji}>{cat.emoji}</Text>
                          <Text
                            style={[
                              styles.catName,
                              { color: selCategory?.name === cat.name ? COLORS.primary : C.text },
                            ]}
                            numberOfLines={2}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {unbudgetedCategories.length === 0 && (
                        <Text style={[styles.allBudgeted, { color: C.textMuted }]}>
                          All categories already have a budget this month! 🎉
                        </Text>
                      )}
                    </View>
                  </>
                )}

                {/* Monthly limit input */}
                <Text style={[styles.modalLabel, { color: C.textMuted }]}>Monthly Limit ({currency})</Text>
                <View style={[styles.amountRow, { backgroundColor: C.surface }]}>
                  <Text style={[styles.currencyPrefix, { color: C.textMuted }]}>{currency}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: C.text }]}
                    value={limitInput}
                    onChangeText={setLimitInput}
                    placeholder="0.00"
                    placeholderTextColor={C.textMuted}
                    keyboardType="decimal-pad"
                    autoFocus={!!editingBudget}
                  />
                </View>

                {/* Alert threshold */}
                <Text style={[styles.modalLabel, { color: C.textMuted }]}>
                  Alert Threshold — notify at {alertThreshold}% used
                </Text>
                <View style={styles.thresholdRow}>
                  {ALERT_THRESHOLDS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.thresholdChip,
                        { borderColor: C.border },
                        alertThreshold === t && {
                          backgroundColor: COLORS.warning,
                          borderColor: COLORS.warning,
                        },
                      ]}
                      onPress={() => setAlertThreshold(t)}
                    >
                      <Text
                        style={[
                          styles.thresholdText,
                          { color: alertThreshold === t ? '#FFF' : C.text },
                        ]}
                      >
                        {t}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Preview of what budget looks like */}
                {limitInput && parseFloat(limitInput) > 0 && (
                  <View style={[styles.preview, { backgroundColor: C.surface }]}>
                    <Text style={[styles.previewLabel, { color: C.textMuted }]}>Preview</Text>
                    <Text style={[styles.previewText, { color: C.text }]}>
                      Daily allowance:{' '}
                      <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                        {currency}{(parseFloat(limitInput) / daysInMonth).toFixed(2)}/day
                      </Text>
                    </Text>
                    <Text style={[styles.previewText, { color: C.text }]}>
                      Alert fires at:{' '}
                      <Text style={{ color: COLORS.warning, fontWeight: '700' }}>
                        {currency}{((alertThreshold / 100) * parseFloat(limitInput)).toFixed(2)}
                      </Text>
                    </Text>
                  </View>
                )}

                {/* Save button */}
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: (selCategory || editingBudget) && limitInput ? COLORS.primary : C.border },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function OverallStat({ icon, label, value, color }) {
  return (
    <View style={styles.overallStatItem}>
      <MaterialCommunityIcons name={icon} size={14} color="rgba(255,255,255,0.7)" />
      <Text style={styles.overallStatLabel}>{label}</Text>
      <Text style={[styles.overallStatValue, { color }]}>{value}</Text>
    </View>
  );
}

function EmptyState({ onAdd, onCopy, C }) {
  return (
    <View style={[styles.emptyState, { backgroundColor: C.surface }]}>
      <MaterialCommunityIcons name="wallet-outline" size={56} color={C.textMuted} />
      <Text style={[styles.emptyTitle, { color: C.text }]}>No budgets this month</Text>
      <Text style={[styles.emptySub, { color: C.textMuted }]}>
        Set spending limits per category to stay on track
      </Text>
      <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]} onPress={onAdd}>
        <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
        <Text style={styles.emptyBtnText}>Create Budget</Text>
      </TouchableOpacity>
      {onCopy && (
        <TouchableOpacity style={[styles.emptyCopyBtn, { borderColor: COLORS.primary }]} onPress={onCopy}>
          <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
          <Text style={[styles.emptyCopyText, { color: COLORS.primary }]}>Copy last month's budgets</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  copyBtnText: { fontSize: 13, fontWeight: '600' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },

  // Overall card
  overallCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 16 },
  overallTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  overallLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  overallAmount: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  overallOf: { fontSize: 14, fontWeight: '400' },
  overallRight: { alignItems: 'center' },
  overallPct: { fontSize: 28, fontWeight: '900' },
  overallUsed: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  overallTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  overallFill: { height: '100%', borderRadius: 4 },
  overallStats: { flexDirection: 'row' },
  overallStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  overallStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10 },
  overallStatValue: { fontSize: 14, fontWeight: '700' },
  overallDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  bottomActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 4 },
  bottomBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 13,
  },
  bottomBtnText: { fontSize: 13, fontWeight: '600' },

  emptyState: {
    marginHorizontal: 20, borderRadius: 20, padding: 36,
    alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 6, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  emptyCopyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1.5,
  },
  emptyCopyText: { fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalLabel: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 10, marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  catItem: {
    width: '30%', borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1,
  },
  catEmoji: { fontSize: 22, marginBottom: 4 },
  catName: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  allBudgeted: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, marginBottom: 18,
  },
  currencyPrefix: { fontSize: 20, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', paddingVertical: 14 },
  thresholdRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  thresholdChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, alignItems: 'center',
  },
  thresholdText: { fontSize: 13, fontWeight: '700' },
  preview: {
    borderRadius: 14, padding: 14, gap: 6, marginBottom: 18,
  },
  previewLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  previewText: { fontSize: 14 },
  saveBtn: { borderRadius: 16, padding: 17, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
