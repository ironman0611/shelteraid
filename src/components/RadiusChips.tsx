import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Chip } from 'react-native-paper';
import { RADIUS_OPTIONS, RadiusOption } from '../constants/radius';
import { useTheme } from '../theme/useTheme';

interface Props {
  radiusMiles: RadiusOption;
  onSelect: (miles: RadiusOption) => void;
  /** When false, radius has no effect on data (location unavailable). */
  locationAvailable: boolean;
}

export function RadiusChips({ radiusMiles, onSelect, locationAvailable }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.colors.primarySoft,
          borderBottomColor: theme.colors.border,
          opacity: locationAvailable ? 1 : 0.55,
        },
      ]}
      pointerEvents={locationAvailable ? 'auto' : 'none'}
    >
      <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
        {locationAvailable ? 'Within distance' : 'Enable location to filter by distance'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {RADIUS_OPTIONS.map((opt) => {
          const isSelected =
            opt.value === null ? radiusMiles === null : radiusMiles === opt.value;

          return (
            <Chip
              key={`${opt.label}-${opt.value ?? 'any'}`}
              selected={isSelected}
              onPress={() => onSelect(opt.value)}
              mode={isSelected ? 'flat' : 'outlined'}
              showSelectedCheck={false}
              compact
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                  : { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
              ]}
              textStyle={[
                styles.chipText,
                { color: isSelected ? theme.colors.surface : theme.colors.textSecondary },
              ]}
              accessibilityLabel={
                opt.value === null
                  ? 'Any distance'
                  : `Within ${opt.value} miles${isSelected ? ', selected' : ''}`
              }
              accessibilityState={{ selected: isSelected }}
            >
              {opt.label}
            </Chip>
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
  caption: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
