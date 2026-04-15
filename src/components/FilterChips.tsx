import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { ShelterType } from '../types/shelter';
import { useTheme } from '../theme/useTheme';

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
  const theme = useTheme();
  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: theme.colors.primarySoft, borderBottomColor: theme.colors.border },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          const count = counts?.[opt.value];
          const label = `${opt.label}${count != null ? ` (${count})` : ''}`;

          return (
            <View key={opt.value}>
              <Chip
                selected={active}
                onPress={() => onToggle(opt.value)}
                mode={active ? 'flat' : 'outlined'}
                compact={false}
                showSelectedCheck={false}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                ]}
                textStyle={[
                  styles.chipText,
                  { color: active ? theme.colors.surface : theme.colors.textSecondary },
                ]}
                accessibilityLabel={`Filter by ${opt.label}${count != null ? `, ${count} available` : ''}`}
              >
                {label}
              </Chip>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 22,
    minHeight: 42,
    minWidth: 128,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
