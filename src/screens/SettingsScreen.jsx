import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as DocumentPicker from 'expo-document-picker';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore }  from '../store/expenseStore';
import { useIncomeStore }   from '../store/incomeStore';
import { useBudgetStore }   from '../store/budgetStore';
import { exportJSON, exportCSV, importJSON } from '../services/exportService';
import { storageService } from '../services/storageService';
import CurrencyPicker from '../components/CurrencyPicker';
import { getCurrencySymbol } from '../constants/currencies';

const APP_VERSION = '1.0.0';
const MONTH_START_DAYS = [1, 5, 10, 15, 20, 25, 28];

export default function SettingsScreen() {
  const navigation = useNavigation();

  const {
    theme, setTheme,
    currency, setCurrency,
    aiProvider, setAIProvider,
    openAIKey, setOpenAIKey,
    biometricLock, setBiometricLock,
    monthStartDay, setMonthStartDay,
    setOnboardingDone,
  } = useSettingsStore();

  const { expenses, clearAllExpenses } = useExpenseStore();
  const { incomes }                    = useIncomeStore();
  const { budgets }                    = useBudgetStore();

  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showAPIKey, setShowAPIKey]                 = useState(false);
  const [apiKeyInput, setAPIKeyInput]               = useState(openAIKey || '');
  const [exporting, setExporting]                   = useState(false);
  const [importing, setImporting]                   = useState(false);

  // ─── Biometric lock toggle ────────────────────────────────────────
  async function handleBiometricToggle(value) {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();

      if (!compatible) {
        Alert.alert('Not Supported', 'Biometric authentication is not available on this device.');
        return;
      }
      if (!enrolled) {
        Alert.alert('Not Set Up', 'Please set up Face ID or fingerprint in your device settings first.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your identity to enable biometric lock',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        setBiometricLock(true);
        Alert.alert('Biometric Lock Enabled', 'SpendSmart will require authentication on next launch.');
      }
    } else {
      Alert.alert(
        'Disable Biometric Lock',
        'Are you sure you want to disable biometric lock?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: () => setBiometricLock(false) },
        ]
      );
    }
  }

  // ─── Export JSON ──────────────────────────────────────────────────
  async function handleExportJSON() {
    try {
      setExporting(true);
      await exportJSON();
    } catch (e) {
      Alert.alert('Export Failed', e.message);
    } finally {
      setExporting(false);
    }
  }

  // ─── Export CSV ───────────────────────────────────────────────────
  async function handleExportCSV() {
    try {
      setExporting(true);
      const label = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      await exportCSV(expenses, label);
    } catch (e) {
      Alert.alert('Export Failed', e.message);
    } finally {
      setExporting(false);
    }
  }

  // ─── Import JSON ──────────────────────────────────────────────────
  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setImporting(true);
      await importJSON(result.assets[0].uri);
      Alert.alert(
        'Import Successful',
        'Your data has been restored. Please restart the app to see all changes.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Import Failed', e.message || 'The file could not be imported. Make sure it is a valid SpendSmart backup.');
    } finally {
      setImporting(false);
    }
  }

  // ─── Clear all data ───────────────────────────────────────────────
  function handleClearData() {
    Alert.alert(
      'Clear All Data',
      `This will permanently delete ALL your data:\n• ${expenses.length} expenses\n• ${incomes.length} income entries\n• ${budgets.length} budgets\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              clearAllExpenses(),
              storageService.clearAll(),
            ]);
            setOnboardingDone(false);
            Alert.alert('Done', 'All data has been cleared. The app will restart onboarding.');
          },
        },
      ]
    );
  }

  // ─── Save API key ─────────────────────────────────────────────────
  async function handleSaveKey() {
    await setOpenAIKey(apiKeyInput.trim());
    Alert.alert('Saved', 'API key saved securely on your device.');
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* ── Appearance ─────────────────────────────────────────── */}
        <SectionLabel title="Appearance" C={C} />
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <SettingRow icon="theme-light-dark" label="Theme" C={C}>
            <SegmentControl
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark',  label: 'Dark' },
                { value: 'system',label: 'Auto' },
              ]}
              value={theme}
              onChange={setTheme}
              C={C}
            />
          </SettingRow>
        </View>

        {/* ── Finance ────────────────────────────────────────────── */}
        <SectionLabel title="Finance" C={C} />
        <View style={[styles.card, { backgroundColor: C.surface }]}>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.success + '18' }]}>
                <MaterialCommunityIcons name="currency-usd" size={18} color={COLORS.success} />
              </View>
              <Text style={[styles.rowLabel, { color: C.text }]}>Default Currency</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: COLORS.primary }]}>
                {getCurrencySymbol(currency)} {currency}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} />
            </View>
          </TouchableOpacity>

          <Divider C={C} />

          <SettingRow icon="calendar-start" label="Month Start Day" C={C} iconColor={COLORS.info}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {MONTH_START_DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.chip,
                      { borderColor: C.border },
                      monthStartDay === d && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    ]}
                    onPress={() => setMonthStartDay(d)}
                  >
                    <Text style={[styles.chipText, { color: monthStartDay === d ? '#FFF' : C.text }]}>
                      {d === 1 ? '1st' : `${d}th`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </SettingRow>
        </View>

        {/* ── AI Assistant ───────────────────────────────────────── */}
        <SectionLabel title="AI Assistant" C={C} />
        <View style={[styles.card, { backgroundColor: C.surface }]}>

          <SettingRow icon="robot-outline" label="AI Provider" C={C} iconColor={COLORS.primary}>
            <SegmentControl
              options={[
                { value: 'openai',  label: 'OpenAI' },
                { value: 'gemini',  label: 'Gemini' },
              ]}
              value={aiProvider}
              onChange={setAIProvider}
              C={C}
            />
          </SettingRow>

          <Divider C={C} />

          {/* API Key */}
          <View style={styles.apiKeySection}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '18' }]}>
                <MaterialCommunityIcons name="key-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: C.text }]}>API Key</Text>
            </View>

            <View style={[styles.apiKeyInput, { backgroundColor: C.background }]}>
              <TextInput
                style={[styles.apiKeyText, { color: C.text }]}
                value={apiKeyInput}
                onChangeText={setAPIKeyInput}
                placeholder={aiProvider === 'openai' ? 'sk-…' : 'AIzaSy…'}
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showAPIKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowAPIKey(!showAPIKey)}>
                <MaterialCommunityIcons
                  name={showAPIKey ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveKeyBtn, { backgroundColor: apiKeyInput.trim() ? COLORS.primary : C.border }]}
              onPress={handleSaveKey}
              disabled={!apiKeyInput.trim()}
            >
              <Text style={styles.saveKeyText}>Save Key</Text>
            </TouchableOpacity>

            <Text style={[styles.keyHint, { color: C.textMuted }]}>
              Your key is stored encrypted on your device and never sent anywhere except the AI provider.
            </Text>
          </View>
        </View>

        {/* ── Security ───────────────────────────────────────────── */}
        <SectionLabel title="Security" C={C} />
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.warning + '18' }]}>
                <MaterialCommunityIcons name="fingerprint" size={18} color={COLORS.warning} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: C.text }]}>Biometric Lock</Text>
                <Text style={[styles.rowSub, { color: C.textMuted }]}>Face ID or fingerprint on launch</Text>
              </View>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: C.border, true: COLORS.warning + '80' }}
              thumbColor={biometricLock ? COLORS.warning : C.textMuted}
            />
          </View>
        </View>

        {/* ── Data Management ────────────────────────────────────── */}
        <SectionLabel title="Data Management" C={C} />
        <View style={[styles.card, { backgroundColor: C.surface }]}>

          <DataRow
            icon="download-outline"
            label="Export Full Backup (JSON)"
            sub={`${expenses.length} expenses · ${budgets.length} budgets`}
            iconColor={COLORS.primary}
            onPress={handleExportJSON}
            loading={exporting}
            C={C}
          />
          <Divider C={C} />

          <DataRow
            icon="file-delimited-outline"
            label="Export Expenses as CSV"
            sub="Spreadsheet-compatible format"
            iconColor={COLORS.success}
            onPress={handleExportCSV}
            loading={exporting}
            C={C}
          />
          <Divider C={C} />

          <DataRow
            icon="upload-outline"
            label="Import from Backup"
            sub="Restore from a JSON backup file"
            iconColor={COLORS.info}
            onPress={handleImport}
            loading={importing}
            C={C}
          />
          <Divider C={C} />

          <DataRow
            icon="delete-forever-outline"
            label="Clear All Data"
            sub="Permanently delete everything"
            iconColor={COLORS.danger}
            labelColor={COLORS.danger}
            onPress={handleClearData}
            C={C}
          />
        </View>

        {/* ── About ──────────────────────────────────────────────── */}
        <SectionLabel title="About" C={C} />
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View style={styles.aboutRow}>
            <View style={[styles.appIcon, { backgroundColor: COLORS.primary }]}>
              <MaterialCommunityIcons name="piggy-bank" size={22} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.appName, { color: C.text }]}>SpendSmart</Text>
              <Text style={[styles.appVersion, { color: C.textMuted }]}>Version {APP_VERSION}</Text>
            </View>
          </View>
          <Divider C={C} />
          <View style={styles.statsRow}>
            <StatPill icon="receipt-text-outline" value={expenses.length} label="Expenses" C={C} />
            <StatPill icon="wallet-outline"       value={budgets.length}  label="Budgets"  C={C} />
            <StatPill icon="cash-outline"         value={0}               label="Incomes"  C={C} />
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        selected={currency}
        onSelect={setCurrency}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function SectionLabel({ title, C }) {
  return (
    <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{title}</Text>
  );
}

function SettingRow({ icon, label, iconColor = COLORS.primary, children, C }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: (iconColor || COLORS.primary) + '18' }]}>
          <MaterialCommunityIcons name={icon} size={18} color={iconColor || COLORS.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function SegmentControl({ options, value, onChange, C }) {
  return (
    <View style={[styles.segment, { backgroundColor: C.background }]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.segBtn, value === opt.value && styles.segBtnActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.segText, { color: value === opt.value ? '#FFF' : C.textMuted }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DataRow({ icon, label, sub, iconColor, labelColor, onPress, loading, C }) {
  return (
    <TouchableOpacity style={styles.dataRow} onPress={onPress} disabled={loading} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: (iconColor || COLORS.primary) + '18' }]}>
        {loading
          ? <ActivityIndicator size="small" color={iconColor} />
          : <MaterialCommunityIcons name={icon} size={18} color={iconColor || COLORS.primary} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: labelColor || C.text }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: C.textMuted }]}>{sub}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} />
    </TouchableOpacity>
  );
}

function Divider({ C }) {
  return <View style={[styles.divider, { backgroundColor: C.border }]} />;
}

function StatPill({ icon, value, label, C }) {
  return (
    <View style={styles.statPill}>
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} />
      <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: C.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  title: { fontSize: 20, fontWeight: '800' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  card: { marginHorizontal: 20, borderRadius: 18, overflow: 'hidden' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, gap: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 1 },
  rowValue: { fontSize: 15, fontWeight: '700' },

  // Segment control
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 2 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  segBtnActive: { backgroundColor: COLORS.primary },
  segText: { fontSize: 12, fontWeight: '600' },

  // Month start chips
  chipRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },

  // API Key
  apiKeySection: { padding: 16, gap: 10 },
  apiKeyInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  apiKeyText: { flex: 1, fontSize: 14, fontFamily: 'monospace' },
  saveKeyBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveKeyText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  keyHint: { fontSize: 11, lineHeight: 16 },

  // Data rows
  dataRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },

  // About
  aboutRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  appIcon: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  appName: { fontSize: 17, fontWeight: '800' },
  appVersion: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 0 },
  statPill: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11 },

  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
});
