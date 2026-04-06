import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    id: 'welcome',
    icon: 'piggy-bank',
    title: 'Welcome to SpendSmart',
    subtitle: 'Track expenses, manage budgets, and get AI-powered financial insights — all stored privately on your device.',
    color: COLORS.primary,
  },
  {
    id: 'currency',
    icon: 'currency-usd',
    title: 'Set Your Currency',
    subtitle: 'Choose your default currency for all transactions.',
    color: '#10B981',
    input: 'currency',
  },
  {
    id: 'categories',
    icon: 'tag-multiple',
    title: 'Spend by Category',
    subtitle: "We've pre-loaded 15 categories with subcategories. Customize them anytime in Settings.",
    color: '#F59E0B',
  },
  {
    id: 'budgets',
    icon: 'wallet',
    title: 'Set a Monthly Budget',
    subtitle: 'Start with an overall monthly spending limit. Add per-category budgets in the Budget tab.',
    color: '#8B5CF6',
    input: 'budget',
  },
  {
    id: 'ai',
    icon: 'robot',
    title: 'Enable AI Planner',
    subtitle: 'Optionally add your OpenAI or Gemini API key for personalized financial advice. You can skip this.',
    color: '#EF4444',
    input: 'apikey',
    optional: true,
  },
  {
    id: 'done',
    icon: 'check-circle',
    title: "You're All Set!",
    subtitle: 'Start tracking your expenses and take control of your finances today.',
    color: COLORS.primary,
  },
];

export default function OnboardingScreen() {
  const { setOnboardingDone, setCurrency, setOpenAIKey } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [currencyInput, setCurrencyInput] = useState('USD');
  const [budgetInput,   setBudgetInput]   = useState('');
  const [apiKeyInput,   setAPIKeyInput]   = useState('');

  // Animations
  const slideX    = useRef(new Animated.Value(0)).current;  // content slide
  const iconScale = useRef(new Animated.Value(1)).current;  // icon bounce
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const dotWidths = useRef(STEPS.map(() => new Animated.Value(8))).current;

  // ── Animate dot widths whenever step changes ─────────────────────
  useEffect(() => {
    const animations = dotWidths.map((val, i) =>
      Animated.timing(val, {
        toValue: i === step ? 24 : 8,
        duration: 250,
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, [step]);

  // ── Slide transition between steps ──────────────────────────────
  function animateToStep(nextStep) {
    const direction = nextStep > step ? 1 : -1;

    // Phase 1: slide out current + shrink icon
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -width * 0.3 * direction,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);

      // Reset for entrance from opposite side
      slideX.setValue(width * 0.3 * direction);

      // Phase 2: slide in new content + bounce icon
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function next() {
    if (step < STEPS.length - 1) {
      animateToStep(step + 1);
    } else {
      finish();
    }
  }

  function back() {
    if (step > 0) animateToStep(step - 1);
  }

  function finish() {
    if (currencyInput) setCurrency(currencyInput.toUpperCase());
    if (apiKeyInput)   setOpenAIKey(apiKeyInput);
    setOnboardingDone(true);
  }

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.container}>

      {/* Top row: back button + skip */}
      <View style={styles.topRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#64748B" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        {step === 0 && (
          <TouchableOpacity onPress={finish}>
            <Text style={styles.skipText}>Skip setup</Text>
          </TouchableOpacity>
        )}
        {step > 0 && step < STEPS.length - 1 && (
          <Text style={styles.stepCounter}>{step + 1} / {STEPS.length}</Text>
        )}
        {(step === STEPS.length - 1) && <View />}
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {STEPS.map((s, i) => (
          <Animated.View
            key={s.id}
            style={[
              styles.dot,
              {
                width: dotWidths[i],
                backgroundColor: i === step ? current.color : '#E2E8F0',
              },
            ]}
          />
        ))}
      </View>

      {/* Animated slide content */}
      <Animated.View
        style={[
          styles.slideContent,
          { transform: [{ translateX: slideX }] },
        ]}
      >
        {/* Icon with bounce */}
        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: current.color + '18' },
            { opacity: iconOpacity, transform: [{ scale: iconScale }] },
          ]}
        >
          <MaterialCommunityIcons name={current.icon} size={72} color={current.color} />
        </Animated.View>

        <Text style={styles.slideTitle}>{current.title}</Text>
        <Text style={styles.slideSubtitle}>{current.subtitle}</Text>

        {/* Currency input */}
        {current.input === 'currency' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.onboardInput, { borderColor: current.color }]}
              value={currencyInput}
              onChangeText={setCurrencyInput}
              placeholder="USD"
              autoCapitalize="characters"
              maxLength={3}
            />
            <Text style={styles.inputHint}>3-letter code (USD, EUR, GBP…)</Text>
          </View>
        )}

        {/* Budget input */}
        {current.input === 'budget' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.onboardInput, { borderColor: current.color }]}
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="e.g. 3000"
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputHint}>Monthly spending limit ({currencyInput || 'USD'})</Text>
          </View>
        )}

        {/* AI key input */}
        {current.input === 'apikey' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.onboardInput, { borderColor: current.color }]}
              value={apiKeyInput}
              onChangeText={setAPIKeyInput}
              placeholder="sk-... or AIzaSy..."
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHint}>Stored securely on your device · Never transmitted</Text>
          </View>
        )}

        {/* Category preview chips */}
        {current.id === 'categories' && (
          <View style={styles.chipRow}>
            {['🍔 Food', '🚗 Transport', '🏠 Housing', '💊 Health', '🎮 Fun', '💡 Utilities'].map((label) => (
              <View key={label} style={[styles.chip, { backgroundColor: current.color + '15', borderColor: current.color + '40' }]}>
                <Text style={[styles.chipText, { color: current.color }]}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Done confetti-style badges */}
        {current.id === 'done' && (
          <View style={styles.doneFeatures}>
            {[
              { icon: 'check-circle', label: 'Expense Tracking' },
              { icon: 'check-circle', label: 'Budget Alerts' },
              { icon: 'check-circle', label: 'Reports & Charts' },
              { icon: 'check-circle', label: 'AI Financial Planner' },
            ].map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <MaterialCommunityIcons name={f.icon} size={20} color={COLORS.success} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {current.optional && (
          <TouchableOpacity style={styles.skipBtn} onPress={next}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: current.color }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {step === STEPS.length - 1 ? 'Get Started 🚀' : 'Continue'}
          </Text>
          {step < STEPS.length - 1 && (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  stepCounter: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  skipText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },

  inputContainer: { width: '100%', gap: 6 },
  onboardInput: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F172A',
  },
  inputHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  doneFeatures: { gap: 10, marginTop: 4, alignSelf: 'stretch' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  featureText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },

  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 18,
  },
  nextText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
});
