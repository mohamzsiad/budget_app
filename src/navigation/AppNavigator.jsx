import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import StackNavigator from './StackNavigator';
import { useSettingsStore } from '../store/settingsStore';
import { COLORS } from '../constants/colors';

const Root = createNativeStackNavigator();

export default function AppNavigator() {
  const { onboardingDone, theme } = useSettingsStore();
  const isDark = theme === 'dark';

  // Navigation theme
  const navTheme = {
    dark: isDark,
    colors: {
      primary: COLORS.primary,
      background: isDark ? COLORS.dark.background : COLORS.light.background,
      card: isDark ? COLORS.dark.surface : COLORS.light.surface,
      text: isDark ? COLORS.dark.text : COLORS.light.text,
      border: isDark ? COLORS.dark.border : COLORS.light.border,
      notification: COLORS.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Root.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Root.Screen name="App" component={StackNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
