import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useTheme } from '../theme/useTheme';

interface Props {
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  accessibilityLabel?: string;
}

export function ActionButton({ label, variant, onPress, accessibilityLabel }: Props) {
  const theme = useTheme();
  const primary = variant === 'primary';

  return (
    <View style={styles.container}>
      <Button
        mode={primary ? 'contained' : 'outlined'}
        onPress={onPress}
        contentStyle={styles.content}
        style={[
          styles.button,
          !primary && {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
          },
        ]}
        labelStyle={[
          styles.text,
          { color: primary ? theme.colors.surface : theme.colors.text },
        ]}
        buttonColor={primary ? theme.colors.primary : undefined}
        accessibilityLabel={accessibilityLabel ?? label}
      >
        {label}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    borderRadius: 12,
  },
  content: { minHeight: 48 },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
