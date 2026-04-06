import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import AIPlannerScreen from '../screens/AIPlannerScreen';

import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Button for the center "Add" tab
function AddTabButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  const tabBarStyle = {
    backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
    borderTopColor: isDark ? COLORS.dark.border : COLORS.light.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  };

  const activeTintColor = COLORS.primary;
  const inactiveTintColor = isDark ? COLORS.dark.textMuted : COLORS.light.textMuted;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'chart-bar' : 'chart-bar'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Center FAB-style Add button */}
      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <AddTabButton onPress={props.onPress} />,
        }}
      />

      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Budget',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AIPlanner"
        component={AIPlannerScreen}
        options={{
          tabBarLabel: 'AI Plan',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'robot' : 'robot-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
