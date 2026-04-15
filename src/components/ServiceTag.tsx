import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShelterType } from '../types/shelter';
import { useTheme } from '../theme/useTheme';

const TAG_LABELS: Record<ShelterType, string> = {
  emergency: 'Emergency',
  transitional: 'Transitional',
  food: 'Food',
  medical: 'Medical',
};

interface Props {
  type: ShelterType;
}

export function ServiceTag({ type }: Props) {
  const theme = useTheme();
  const tagStyles: Record<ShelterType, { bg: string; text: string }> = {
    emergency: theme.colors.tagEmergency,
    transitional: theme.colors.tagTransitional,
    food: theme.colors.tagFood,
    medical: theme.colors.tagMedical,
  };
  const colors = tagStyles[type];
  return (
    <View style={[styles.tag, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {TAG_LABELS[type]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
