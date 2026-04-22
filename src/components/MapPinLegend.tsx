import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShelterType } from '../types/shelter';
import { useTheme } from '../theme/useTheme';

const ITEMS: { type: ShelterType; label: string }[] = [
  { type: 'emergency', label: 'Emergency' },
  { type: 'transitional', label: 'Transitional' },
  { type: 'food', label: 'Food' },
  { type: 'medical', label: 'Medical' },
];

function colorForType(type: ShelterType, theme: ReturnType<typeof useTheme>): string {
  switch (type) {
    case 'emergency':
      return theme.colors.statusClosed;
    case 'transitional':
      return theme.colors.tagTransitional.text;
    case 'food':
      return theme.colors.statusLimited;
    case 'medical':
      return theme.colors.tagMedical.text;
  }
}

export function MapPinLegend() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel="Map pin colors: Emergency red, Transitional blue, Food orange, Medical purple, Other green"
    >
      {ITEMS.map(({ type, label }) => (
        <View key={type} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: colorForType(type, theme) }]} />
          <Text style={[styles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        <Text style={[styles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          Other
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    rowGap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
