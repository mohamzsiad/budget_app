import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore }  from '../store/expenseStore';
import { useIncomeStore }   from '../store/incomeStore';
import { useBudgetStore }   from '../store/budgetStore';
import { storageService }   from '../services/storageService';
import { callAI }           from '../services/aiService';
import AIChatBubble         from '../components/AIChatBubble';

const AI_HISTORY_KEY = '@ai_history';
const MAX_STORED_MESSAGES = 30;

// ─── Quick-prompt suggestions shown when chat is fresh ──────────────
const QUICK_PROMPTS = [
  { icon: 'chart-pie', label: 'Monthly budget plan',         text: 'Create a detailed monthly budget plan for me based on my income and spending patterns.' },
  { icon: 'alert-circle-outline', label: 'Where am I overspending?', text: 'Analyse my expenses and tell me where I am overspending compared to healthy benchmarks.' },
  { icon: 'piggy-bank-outline',   label: 'How much to save?',        text: 'Based on my income and expenses, how much should I realistically save each month?' },
  { icon: 'airplane',             label: 'Can I afford a vacation?',  text: 'Can I afford to go on vacation next month? What would I need to cut back on?' },
  { icon: 'trending-down',        label: 'Reduce my bills',           text: 'Which of my recurring subscriptions or bills could I reduce or cancel to save money?' },
  { icon: 'cash-multiple',        label: 'Investment tips',           text: 'Given my current savings rate, what would you suggest I invest in and how much?' },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your AI financial advisor 👋\n\nI have access to your actual expense data, income, and budget figures — so my advice is tailored specifically to you.\n\nTap one of the suggestions below to get started, or ask me anything about your finances.",
  timestamp: new Date().toISOString(),
};

export default function AIPlannerScreen() {
  const { theme, currency, openAIKey, aiProvider } = useSettingsStore();
  const { expenses }  = useExpenseStore();
  const { incomes }   = useIncomeStore();
  const { budgets }   = useBudgetStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const [messages, setMessages]   = useState([WELCOME_MESSAGE]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const flatListRef               = useRef(null);
  const typingDots                = useRef(new Animated.Value(0)).current;

  // ─── Load persisted chat history ──────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!historyLoaded) {
        storageService.get(AI_HISTORY_KEY, null).then((saved) => {
          if (saved && saved.length > 0) {
            setMessages(saved);
          }
          setHistoryLoaded(true);
        });
      }
    }, [historyLoaded])
  );

  // ─── Persist messages to storage ──────────────────────────────────
  async function persistMessages(msgs) {
    const toStore = msgs.slice(-MAX_STORED_MESSAGES);
    await storageService.set(AI_HISTORY_KEY, toStore);
  }

  // ─── Typing animation ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingDots, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingDots.stopAnimation();
      typingDots.setValue(0);
    }
  }, [loading]);

  // ─── Auto-scroll to bottom ────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages, loading]);

  // ─── Build financial context for the AI system prompt ─────────────
  function buildContext() {
    const now          = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const monthLabel   = format(now, 'MMMM yyyy');

    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    const monthIncomes  = incomes.filter((i)  => i.date.startsWith(currentMonth));
    const monthBudgets  = budgets.filter((b)  => b.month === currentMonth);

    const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome   = monthIncomes.reduce((s, i)  => s + i.amount, 0);

    const byCategory = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Last 3 months history
    const history = {};
    for (let i = 1; i <= 3; i++) {
      const d   = new Date(now); d.setMonth(d.getMonth() - i);
      const ym  = format(d, 'yyyy-MM');
      const lbl = format(d, 'MMMM');
      history[lbl] = expenses
        .filter((e) => e.date.startsWith(ym))
        .reduce((s, e) => s + e.amount, 0);
    }

    return {
      month: monthLabel,
      currency,
      totalExpenses,
      totalIncome,
      netBalance: totalIncome - totalExpenses,
      byCategory,
      budgets: monthBudgets,
      transactionCount: monthExpenses.length,
      last3MonthsHistory: history,
    };
  }

  // ─── Send message ─────────────────────────────────────────────────
  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    if (!openAIKey) {
      Alert.alert(
        'API Key Required',
        'Please go to Settings → AI Assistant and add your OpenAI or Gemini API key to use the AI Planner.',
        [{ text: 'OK' }]
      );
      return;
    }

    const userMsg = {
      id:        Date.now().toString(),
      role:      'user',
      content:   userText,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const context = buildContext();
      const reply   = await callAI(userText, context, messages, {
        apiKey:   openAIKey,
        provider: aiProvider,
      });

      const aiMsg = {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   reply,
        timestamp: new Date().toISOString(),
      };
      const final = [...updated, aiMsg];
      setMessages(final);
      await persistMessages(final);
    } catch (err) {
      const errMsg = {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   `Sorry, I ran into an issue: ${err.message}\n\nPlease check your API key in Settings → AI Assistant.`,
        timestamp: new Date().toISOString(),
      };
      const final = [...updated, errMsg];
      setMessages(final);
      await persistMessages(final);
    } finally {
      setLoading(false);
    }
  }

  // ─── Clear chat ───────────────────────────────────────────────────
  function clearChat() {
    Alert.alert('Start New Plan', 'Clear the chat history and start fresh?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setMessages([WELCOME_MESSAGE]);
          await storageService.setImmediate(AI_HISTORY_KEY, [WELCOME_MESSAGE]);
        },
      },
    ]);
  }

  const showQuickPrompts = messages.length <= 1 && !loading;

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <MaterialCommunityIcons name="robot-outline" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.title, { color: C.text }]}>AI Planner</Text>
              <Text style={[styles.subtitle, { color: C.textMuted }]}>
                {aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4o'}
                {openAIKey ? ' · Connected' : ' · No API key'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={[styles.clearBtn, { backgroundColor: C.surface }]}>
            <MaterialCommunityIcons name="refresh" size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Context banner (shows what data AI has access to) ── */}
        {messages.length <= 1 && (
          <ContextBanner
            expenses={expenses}
            incomes={incomes}
            budgets={budgets}
            currency={currency}
            C={C}
          />
        )}

        {/* ── Message list ──────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <AIChatBubble message={item} />}
          ListFooterComponent={
            loading ? <TypingIndicator typingDots={typingDots} C={C} /> : null
          }
        />

        {/* ── Quick prompts ─────────────────────────────────────── */}
        {showQuickPrompts && (
          <View style={styles.quickSection}>
            <Text style={[styles.quickLabel, { color: C.textMuted }]}>Suggestions</Text>
            <FlatList
              data={QUICK_PROMPTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.label}
              contentContainerStyle={styles.quickList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: C.surface, borderColor: C.border }]}
                  onPress={() => sendMessage(item.text)}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons name={item.icon} size={15} color={COLORS.primary} />
                  <Text style={[styles.quickText, { color: C.text }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Input bar ─────────────────────────────────────────── */}
        <View style={[styles.inputBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <TextInput
            style={[styles.input, { color: C.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about your finances…"
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={600}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !loading ? COLORS.primary : C.border },
            ]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFF" />
              : <MaterialCommunityIcons name="send" size={18} color="#FFF" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function ContextBanner({ expenses, incomes, budgets, currency, C }) {
  const now          = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const monthSpent   = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((s, e) => s + e.amount, 0);
  const monthIncome  = incomes
    .filter((i) => i.date.startsWith(currentMonth))
    .reduce((s, i) => s + i.amount, 0);
  const activeBudgets = budgets.filter((b) => b.month === currentMonth).length;

  return (
    <View style={[styles.contextBanner, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' }]}>
      <MaterialCommunityIcons name="shield-check-outline" size={14} color={COLORS.primary} />
      <Text style={[styles.contextText, { color: COLORS.primary }]}>
        AI has access to: {expenses.length} expenses · {currency}{monthSpent.toFixed(0)} spent this month
        {monthIncome > 0 ? ` · ${currency}${monthIncome.toFixed(0)} income` : ''}
        {activeBudgets > 0 ? ` · ${activeBudgets} budgets` : ''}
      </Text>
    </View>
  );
}

function TypingIndicator({ typingDots, C }) {
  return (
    <View style={styles.typingRow}>
      <View style={[styles.aiAvatarSmall, { backgroundColor: COLORS.primary }]}>
        <MaterialCommunityIcons name="robot-outline" size={12} color="#FFF" />
      </View>
      <View style={[styles.typingBubble, { backgroundColor: C.surface }]}>
        <Animated.Text style={[styles.typingText, { color: C.textMuted, opacity: typingDots }]}>
          ●●●
        </Animated.Text>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 1 },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  contextText: { fontSize: 11, flex: 1, lineHeight: 16 },

  messageList: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 8 },

  // Typing indicator
  typingRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 8, paddingHorizontal: 16, marginBottom: 10,
  },
  aiAvatarSmall: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  typingBubble: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
  },
  typingText: { fontSize: 16, letterSpacing: 3 },

  // Quick prompts
  quickSection: { paddingBottom: 8 },
  quickLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: 16, marginBottom: 8,
  },
  quickList: { paddingHorizontal: 16, gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1,
  },
  quickText: { fontSize: 13 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  input: {
    flex: 1, fontSize: 15, maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
});
