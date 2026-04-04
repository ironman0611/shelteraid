import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ShelterType } from '../types/shelter';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

const FILTER_OPTIONS: { label: string; value: ShelterType }[] = [
  { label: 'Emergency', value: 'emergency' },
  { label: 'Transitional', value: 'transitional' },
  { label: 'Food & Meals', value: 'food' },
  { label: 'Medical', value: 'medical' },
];

interface Props {
  selected: ShelterType[];
  onToggle: (type: ShelterType) => void;
  counts?: Record<ShelterType, number>;
}

export function FilterChips({ selected, onToggle, counts }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_OPTIONS.map((opt) => {
        const active = selected.includes(opt.value);
        const count = counts?.[opt.value];
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${opt.label}${count != null ? `, ${count} available` : ''}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
              {count != null && (
                <Text style={[styles.countText, active && styles.countTextActive]}>
                  {' '}({count})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Layout.chipBorderRadius,
    borderWidth: 1.5,
    borderColor: '#d0d5dd',
    backgroundColor: Colors.surface,
    minHeight: Layout.minTapTarget,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Layout.fontSizeSmall,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  chipTextActive: {
    color: '#fff',
  },
  countText: {
    fontSize: Layout.fontSizeXSmall,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  countTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});
