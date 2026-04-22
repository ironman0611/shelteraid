import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '../constants/layout';
import { useTheme } from '../theme/useTheme';

export function MapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Map on mobile</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          The interactive map runs in the Shelter Aid iOS and Android apps. On the web, use the Search tab to
          browse shelters and open details.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  card: {
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    fontSize: Layout.fontSizeBody,
    lineHeight: 22,
  },
});
