import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface Props {
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  accessibilityLabel?: string;
}

export function ActionButton({ label, variant, onPress, accessibilityLabel }: Props) {
  const buttonStyle: ViewStyle =
    variant === 'primary' ? styles.primary : styles.secondary;

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.textPrimary : styles.textSecondary,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTapTarget,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: '#eff8ff',
    borderWidth: 1.5,
    borderColor: '#b2ddff',
  },
  text: {
    fontSize: Layout.fontSizeBody,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#fff',
  },
  textSecondary: {
    color: '#175cd3',
  },
});
