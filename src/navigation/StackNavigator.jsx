import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditExpenseScreen from '../screens/EditExpenseScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import IncomeScreen from '../screens/IncomeScreen';
import TabNavigator from './TabNavigator';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  const headerStyle = {
    backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
  };

  const headerTintColor = isDark ? COLORS.dark.text : COLORS.light.text;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle,
        headerTintColor,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main Tab Layout — no header */}
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* Overlay Screens */}
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{
          title: 'Expense Detail',
          presentation: 'card',
        }}
      />

      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{
          title: 'Edit Expense',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          presentation: 'card',
        }}
      />

      <Stack.Screen
        name="Income"
        component={IncomeScreen}
        options={{
          title: 'Income',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}
