import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShelterType } from '../types/shelter';
import { Colors } from '../constants/colors';

const TAG_STYLES: Record<ShelterType, { bg: string; text: string }> = {
  emergency: Colors.tagEmergency,
  transitional: Colors.tagTransitional,
  food: Colors.tagFood,
  medical: Colors.tagMedical,
};

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
  const colors = TAG_STYLES[type];
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
