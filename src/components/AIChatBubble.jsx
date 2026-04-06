import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

/**
 * A single chat bubble in the AI Planner screen.
 *
 * @param {object} message - { role: 'user'|'assistant', content, timestamp }
 */
export default function AIChatBubble({ message }) {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {/* AI avatar */}
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
          <MaterialCommunityIcons name="robot-outline" size={16} color="#FFF" />
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: COLORS.primary }
          : { backgroundColor: C.surface },
      ]}>
        <Text style={[
          styles.content,
          { color: isUser ? '#FFF' : C.text },
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.time,
          { color: isUser ? 'rgba(255,255,255,0.6)' : C.textMuted },
        ]}>
          {format(new Date(message.timestamp), 'h:mm a')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    fontSize: 14,
    lineHeight: 21,
  },
  time: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
});
