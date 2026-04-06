import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';

import { COLORS } from '../constants/colors';
import { CATEGORIES } from '../utils/categories';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];
const RECURRING_OPTIONS = ['Daily', 'Weekly', 'Monthly'];

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const { theme, currency } = useSettingsStore();
  const { addExpense, getPastTitles, expenses } = useExpenseStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  // Form State
  const [amount,             setAmount]             = useState('');
  const [category,           setCategory]           = useState(null);
  const [subcategory,        setSubcategory]        = useState(null);
  const [title,              setTitle]              = useState('');
  const [note,               setNote]               = useState('');
  const [date,               setDate]               = useState(new Date());
  const [paymentMethod,      setPaymentMethod]      = useState('Cash');
  const [isRecurring,        setIsRecurring]        = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('Monthly');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [titleFocused,       setTitleFocused]       = useState(false);

  // ── Past-title suggestions filtered to the selected category ─────
  const pastTitles = useMemo(() => {
    if (!category) return [];
    // Filter expenses by category to get category-specific title suggestions
    const categoryTitles = expenses
      .filter((e) => e.category === category.name && e.title)
      .map((e) => e.title);
    const unique = [...new Set(categoryTitles)].slice(0, 20);
    // Fall back to all past titles if none exist for this category
    return unique.length > 0 ? unique : getPastTitles().slice(0, 10);
  }, [category, expenses]);

  const titleSuggestions = useMemo(() => {
    if (!titleFocused || pastTitles.length === 0) return [];
    if (!title.trim()) return pastTitles.slice(0, 5);
    const q = title.toLowerCase();
    return pastTitles
      .filter((t) => t.toLowerCase().includes(q) && t.toLowerCase() !== q)
      .slice(0, 5);
  }, [title, pastTitles, titleFocused]);

  // ── Save ──────────────────────────────────────────────────────────
  function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Missing Amount', 'Please enter a valid amount.');
      return;
    }
    if (!category) {
      Alert.alert('Missing Category', 'Please select a category.');
      return;
    }

    const expense = {
      id: uuid.v4(),
      amount: parseFloat(amount),
      currency,
      category: category.name,
      subcategory: subcategory || '',
      title: title.trim() || category.name,
      note,
      date: date.toISOString(),
      paymentMethod,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
      receipt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addExpense(expense);

    Toast.show({
      type: 'success',
      text1: 'Expense added!',
      text2: `${category.emoji}  ${expense.title}  ·  ${currency}${expense.amount.toFixed(2)}`,
      visibilityTime: 3000,
      topOffset: 60,
    });

    navigation.navigate('Dashboard');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Add Expense</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveBtn, { color: COLORS.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* Amount Input */}
          <View style={[styles.amountCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.amountLabel}>Amount ({currency})</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Form Fields */}
          <View style={styles.formBody}>

            {/* Category Picker */}
            <Field label="Category" C={C}>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: C.surface }]}
                onPress={() => setShowCategoryPicker(true)}
              >
                {category ? (
                  <View style={styles.categorySelected}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[styles.selectorText, { color: C.text }]}>
                      {category.name}
                      {subcategory ? ` › ${subcategory}` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.selectorPlaceholder, { color: C.textMuted }]}>
                    Select category
                  </Text>
                )}
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Field>

            {/* Category Grid (inline picker) */}
            {showCategoryPicker && (
              <View style={[styles.categoryGrid, { backgroundColor: C.surface }]}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryItem,
                      category?.name === cat.name && {
                        backgroundColor: COLORS.primary + '20',
                        borderColor: COLORS.primary,
                      },
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setSubcategory(null);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.catName,
                        {
                          color:
                            category?.name === cat.name ? COLORS.primary : C.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name.replace(/ & .*/, '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Subcategory (if category selected) */}
            {category && !showCategoryPicker && (
              <Field label="Subcategory (optional)" C={C}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.subcatRow}>
                    {category.subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub}
                        style={[
                          styles.subcatChip,
                          {
                            backgroundColor:
                              subcategory === sub
                                ? COLORS.primary
                                : C.surface,
                            borderColor:
                              subcategory === sub
                                ? COLORS.primary
                                : C.border,
                          },
                        ]}
                        onPress={() =>
                          setSubcategory(subcategory === sub ? null : sub)
                        }
                      >
                        <Text
                          style={[
                            styles.subcatText,
                            {
                              color:
                                subcategory === sub ? '#FFF' : C.text,
                            },
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </Field>
            )}

            {/* Title with auto-suggest */}
            <Field label="Title / Description" C={C}>
              <TextInput
                style={[styles.textField, { backgroundColor: C.surface, color: C.text }]}
                value={title}
                onChangeText={setTitle}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTimeout(() => setTitleFocused(false), 150)}
                placeholder="e.g. Lunch at Chipotle"
                placeholderTextColor={C.textMuted}
                returnKeyType="done"
              />
              {/* Suggestion dropdown */}
              {titleSuggestions.length > 0 && (
                <View style={[styles.suggestionBox, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {titleSuggestions.map((sug) => (
                    <TouchableOpacity
                      key={sug}
                      style={[styles.suggestionItem, { borderBottomColor: C.border }]}
                      onPress={() => {
                        setTitle(sug);
                        setTitleFocused(false);
                      }}
                    >
                      <MaterialCommunityIcons name="history" size={14} color={C.textMuted} />
                      <Text style={[styles.suggestionText, { color: C.text }]}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Field>

            {/* Date */}
            <Field label="Date" C={C}>
              <View style={[styles.selector, { backgroundColor: C.surface }]}>
                <MaterialCommunityIcons name="calendar" size={18} color={C.textMuted} />
                <Text style={[styles.selectorText, { color: C.text, marginLeft: 8 }]}>
                  {format(date, 'MMMM d, yyyy  h:mm a')}
                </Text>
              </View>
            </Field>

            {/* Payment Method */}
            <Field label="Payment Method" C={C}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.subcatRow}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.subcatChip,
                        {
                          backgroundColor:
                            paymentMethod === method ? COLORS.primary : C.surface,
                          borderColor:
                            paymentMethod === method ? COLORS.primary : C.border,
                        },
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.subcatText,
                          { color: paymentMethod === method ? '#FFF' : C.text },
                        ]}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Field>

            {/* Note */}
            <Field label="Note (optional)" C={C}>
              <TextInput
                style={[
                  styles.textField,
                  styles.noteField,
                  { backgroundColor: C.surface, color: C.text },
                ]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={3}
              />
            </Field>

            {/* Recurring Toggle */}
            <View style={[styles.toggleRow, { backgroundColor: C.surface }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: C.text }]}>
                  Recurring Expense
                </Text>
                <Text style={[styles.toggleSub, { color: C.textMuted }]}>
                  Repeat automatically
                </Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: C.border, true: COLORS.primary + '80' }}
                thumbColor={isRecurring ? COLORS.primary : C.textMuted}
              />
            </View>

            {isRecurring && (
              <Field label="Frequency" C={C}>
                <View style={styles.subcatRow}>
                  {RECURRING_OPTIONS.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.subcatChip,
                        {
                          backgroundColor:
                            recurringFrequency === freq ? COLORS.primary : C.surface,
                          borderColor:
                            recurringFrequency === freq ? COLORS.primary : C.border,
                        },
                      ]}
                      onPress={() => setRecurringFrequency(freq)}
                    >
                      <Text
                        style={[
                          styles.subcatText,
                          { color: recurringFrequency === freq ? '#FFF' : C.text },
                        ]}
                      >
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
            )}

          </View>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() =>
              Alert.alert('Discard Expense?', 'Your changes will not be saved.', [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
              ])
            }
          >
            <Text style={[styles.cancelText, { color: COLORS.danger }]}>
              Cancel
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 16, fontWeight: '700' },
  amountCard: {
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  amountLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 },
  amountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    minWidth: 200,
  },
  formBody: { paddingHorizontal: 20 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textField: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  noteField: { height: 80, textAlignVertical: 'top' },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
  },
  selectorText: { fontSize: 15, flex: 1 },
  selectorPlaceholder: { fontSize: 15, flex: 1 },
  categorySelected: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  categoryEmoji: { fontSize: 20 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  categoryItem: {
    width: '30%',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catEmoji: { fontSize: 24, marginBottom: 4 },
  catName: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  subcatRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  subcatChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  subcatText: { fontSize: 13, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 2 },
  cancelBtn: { alignItems: 'center', padding: 20 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  suggestionBox: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: { fontSize: 14 },
});
