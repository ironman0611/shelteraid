import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search city, zip, or shelter name...'}
        placeholderTextColor={Colors.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Search shelters"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: Layout.fontSizeBody,
    color: Colors.text,
    minHeight: Layout.minTapTarget,
  },
});
