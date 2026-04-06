import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../constants/colors';

/**
 * Full-screen biometric lock gate shown on app launch.
 * Calls onUnlock() if authentication succeeds.
 *
 * @param {Function} onUnlock - called when auth succeeds
 */
export default function BiometricLockScreen({ onUnlock }) {
  const [status, setStatus] = useState('idle'); // idle | authenticating | failed
  const [attempts, setAttempts] = useState(0);

  // Entrance animations
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-prompt biometric on mount
    authenticate();
  }, []);

  async function authenticate() {
    setStatus('authenticating');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SpendSmart',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Success — fade out then call onUnlock
        Animated.parallel([
          Animated.timing(logoOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(btnOpacity,  { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onUnlock());
      } else {
        setStatus('failed');
        setAttempts((a) => a + 1);
      }
    } catch (e) {
      setStatus('failed');
      setAttempts((a) => a + 1);
    }
  }

  const iconName =
    status === 'authenticating' ? 'fingerprint'    :
    status === 'failed'         ? 'lock-alert'      :
                                  'lock-outline';

  const iconColor =
    status === 'failed' ? COLORS.danger : COLORS.primary;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.center,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* App logo */}
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="piggy-bank" size={52} color="#FFF" />
        </View>
        <Text style={styles.appName}>SpendSmart</Text>

        {/* Lock icon */}
        <View style={[styles.lockWrap, { borderColor: iconColor + '40' }]}>
          <MaterialCommunityIcons name={iconName} size={44} color={iconColor} />
        </View>

        <Text style={styles.prompt}>
          {status === 'authenticating' ? 'Verifying identity…' :
           status === 'failed'         ? 'Authentication failed' :
                                         'App is locked'}
        </Text>

        {status === 'failed' && attempts > 0 && (
          <Text style={styles.sub}>
            {attempts >= 3
              ? 'Use your device passcode to unlock'
              : 'Tap the button below to try again'}
          </Text>
        )}
      </Animated.View>

      {/* Auth button */}
      <Animated.View style={[styles.btnWrap, { opacity: btnOpacity }]}>
        {status === 'authenticating' ? (
          <ActivityIndicator color={COLORS.primary} size="large" />
        ) : (
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={authenticate}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="fingerprint" size={22} color="#FFF" />
            <Text style={styles.unlockText}>
              {attempts >= 3 ? 'Use Passcode' : 'Unlock with Biometrics'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 4,
  },
  appName: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lockWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  prompt: {
    color: '#CBD5E1',
    fontSize: 17,
    fontWeight: '600',
  },
  sub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 19,
  },
  btnWrap: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  unlockText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
