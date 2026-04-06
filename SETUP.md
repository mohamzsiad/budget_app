# SpendSmart — Setup Guide

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- Or use the **Expo Go** app on your physical device

---

## Quick Start

```bash
# 1. Navigate into the project
cd SpendSmart

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

---

## Project Structure

```
SpendSmart/
├── App.jsx                      # Entry point — loads stores, renders navigator
├── app.json                     # Expo config
├── package.json
├── babel.config.js
├── tailwind.config.js
└── src/
    ├── navigation/
    │   ├── AppNavigator.jsx     # Root navigator (Onboarding vs App)
    │   ├── TabNavigator.jsx     # Bottom tabs (5 tabs + FAB)
    │   └── StackNavigator.jsx   # Stack overlays (Detail, Edit, Settings)
    ├── screens/
    │   ├── DashboardScreen.jsx
    │   ├── AddExpenseScreen.jsx
    │   ├── EditExpenseScreen.jsx
    │   ├── ExpenseDetailScreen.jsx
    │   ├── ReportsScreen.jsx
    │   ├── BudgetScreen.jsx
    │   ├── AIPlannerScreen.jsx
    │   ├── IncomeScreen.jsx
    │   ├── SettingsScreen.jsx
    │   └── OnboardingScreen.jsx
    ├── store/
    │   ├── expenseStore.js      # Zustand — expense CRUD + selectors
    │   ├── incomeStore.js       # Zustand — income CRUD
    │   ├── budgetStore.js       # Zustand — budget CRUD + sync
    │   └── settingsStore.js     # Zustand — user settings + SecureStore
    ├── services/
    │   ├── storageService.js    # AsyncStorage wrapper (debounced writes)
    │   ├── aiService.js         # OpenAI / Gemini API calls
    │   └── exportService.js     # CSV / JSON export & import
    ├── utils/
    │   ├── categories.js        # All 15 categories + subcategories
    │   ├── calculations.js      # Totals, averages, projections
    │   ├── dateHelpers.js       # Period ranges, grouping by day/month
    │   └── formatters.js        # Currency, date, percent formatting
    └── constants/
        ├── colors.js            # Brand + category color palette
        ├── theme.js             # Full theme object (light & dark)
        └── currencies.js        # 50+ world currencies
```

---

## Build Prompts (Step-by-Step)

This project was scaffolded with **Prompt 1 — Setup & Navigation**. Continue building with:

| Step | What to build |
|------|--------------|
| **Prompt 2** | Wire Dashboard to real Zustand data (totals, recent transactions list) |
| **Prompt 3** | Build all 5 chart types in ReportsScreen using `react-native-gifted-charts` |
| **Prompt 4** | Add receipt photo capture to AddExpenseScreen |
| **Prompt 5** | Implement Budget sync (auto-update `spent` when expenses change) |
| **Prompt 6** | Add Onboarding persistence + biometric lock |
| **Prompt 7** | Add daily/budget/recurring push notifications |
| **Prompt 8** | Polish: animations, skeleton loaders, empty states |

---

## AI Planner Setup

1. Get a free API key from [platform.openai.com](https://platform.openai.com) or [aistudio.google.com](https://aistudio.google.com)
2. Open the app → Settings → AI Assistant
3. Paste your key — it's stored securely using Expo SecureStore (never leaves your device)

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` | Navigation framework |
| `@react-navigation/bottom-tabs` | Tab bar |
| `@react-navigation/native-stack` | Stack screens |
| `zustand` | Lightweight state management |
| `@react-native-async-storage/async-storage` | Local data persistence |
| `react-native-gifted-charts` | Charts (line, bar, pie, heatmap) |
| `expo-secure-store` | Encrypted API key storage |
| `expo-local-authentication` | Biometric lock |
| `date-fns` | Date utilities |
| `react-native-uuid` | UUID generation for expense IDs |
| `react-native-toast-message` | Success/error toasts |
| `nativewind` | Tailwind CSS for React Native |

---

## Data Storage

All data is stored **locally on the device** — no backend, no cloud sync.

| AsyncStorage Key | Contents |
|-----------------|---------|
| `@expenses` | Array of all expense objects |
| `@incomes` | Array of all income objects |
| `@budgets` | Array of budget objects (per month) |
| `@settings` | User settings object |
| `@ai_history` | AI chat message history |
| `@onboarding_done` | Boolean first-launch flag |

---

*Built with Claude · SpendSmart v1.0.0*
