import React, { useCallback, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { ShelterCard } from '../components/ShelterCard';
import { useLocation } from '../hooks/useLocation';
import { useShelters } from '../hooks/useShelters';
import { Shelter, ShelterType } from '../types/shelter';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

type SearchStackParamList = {
  SearchMain: undefined;
  Detail: { shelterId: string };
};

export function SearchScreen() {
  const { location } = useLocation();
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();

  const { shelters, filters, setFilters, searchQuery, setSearchQuery, counts } =
    useShelters(
      location?.latitude ?? null,
      location?.longitude ?? null,
    );

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(debouncedQuery), 300);
    return () => clearTimeout(timer);
  }, [debouncedQuery, setSearchQuery]);

  const handleToggleFilter = useCallback(
    (type: ShelterType) => {
      setFilters((prev) =>
        prev.includes(type)
          ? prev.filter((t) => t !== type)
          : [...prev, type],
      );
    },
    [setFilters],
  );

  const renderItem = useCallback(
    ({ item }: { item: Shelter }) => (
      <ShelterCard
        shelter={item}
        onPress={() =>
          navigation.navigate('Detail', { shelterId: item.id })
        }
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SearchBar value={debouncedQuery} onChangeText={setDebouncedQuery} />
      <FilterChips selected={filters} onToggle={handleToggleFilter} counts={counts} />

      <FlatList
        data={shelters}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No shelters found. Try a different search or filter.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Layout.screenPadding,
    paddingTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Layout.fontSizeBody,
    marginTop: 40,
  },
});
