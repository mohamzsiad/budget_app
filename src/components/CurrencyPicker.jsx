import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Modal, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { CURRENCIES } from '../constants/currencies';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Full-screen modal currency picker with search.
 *
 * @param {boolean}  visible
 * @param {string}   selected   - currently selected currency code e.g. 'USD'
 * @param {Function} onSelect   - called with (currencyCode)
 * @param {Function} onClose
 */
export default function CurrencyPicker({ visible, selected, onSelect, onClose }) {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const C = isDark ? COLORS.dark : COLORS.light;

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return CURRENCIES;
    const q = query.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(code) {
    onSelect(code);
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: C.background }]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Select Currency</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: C.surface }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search currency name or code…"
            placeholderTextColor={C.textMuted}
            autoFocus
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => {
            const isSelected = item.code === selected;
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  { borderBottomColor: C.border },
                  isSelected && { backgroundColor: COLORS.primary + '12' },
                ]}
                onPress={() => handleSelect(item.code)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Text style={[styles.symbol, { color: COLORS.primary }]}>{item.symbol}</Text>
                  <View>
                    <Text style={[styles.name, { color: C.text }]}>{item.name}</Text>
                    <Text style={[styles.code, { color: C.textMuted }]}>{item.code}</Text>
                  </View>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 64,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  symbol: { fontSize: 22, fontWeight: '700', width: 36, textAlign: 'center' },
  name: { fontSize: 15, fontWeight: '500' },
  code: { fontSize: 12, marginTop: 1 },
});
