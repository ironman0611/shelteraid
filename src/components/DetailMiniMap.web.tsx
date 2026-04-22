import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Layout } from '../constants/layout';
import { useTheme } from '../theme/useTheme';

type Props = {
  coordinates: { latitude: number; longitude: number };
};

export function DetailMiniMap({ coordinates }: Props) {
  const theme = useTheme();
  const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;

  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.85 }]}
      accessibilityRole="link"
      accessibilityLabel="Open location in Google Maps"
    >
      <View style={[styles.inner, { backgroundColor: theme.colors.primarySoft }]}>
        <Text style={[styles.label, { color: theme.colors.primary }]}>View on Google Maps</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 150,
    justifyContent: 'center',
  },
  inner: {
    padding: 16,
    borderRadius: Layout.borderRadius,
    alignItems: 'center',
  },
  label: {
    fontSize: Layout.fontSizeBody,
    fontWeight: '600',
  },
});
