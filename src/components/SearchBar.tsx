import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useTheme } from '../theme/useTheme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Searchbar
        mode="bar"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search city, zip, or shelter name...'}
        inputStyle={{ color: theme.colors.text }}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
        accessibilityLabel="Search shelters"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
  },
});
