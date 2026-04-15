import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTheme } from '../theme/useTheme';

interface Props {
  onPress: () => void;
}

export function NearMeButton({ onPress }: Props) {
  const theme = useTheme();
  return (
    <FAB
      icon="crosshairs-gps"
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityLabel="Center map on my location"
      color={theme.colors.primary}
      customSize={56}
      mode="elevated"
      visible
      variant="surface"
    />
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 92,
    right: 16,
    borderWidth: 1,
  },
});
