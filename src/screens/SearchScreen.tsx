import React, { useCallback, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { RadiusChips } from '../components/RadiusChips';
import { ShelterCard } from '../components/ShelterCard';
import { DEFAULT_RADIUS_MILES, RadiusOption } from '../constants/radius';
import { useLocation } from '../hooks/useLocation';
import { useShelters } from '../hooks/useShelters';
import { Shelter, ShelterType } from '../types/shelter';
import { useTheme } from '../theme/useTheme';

const PAGE_SIZE = 50;

type SearchStackParamList = {
  SearchMain: undefined;
  Detail: { shelterId: string };
};

export function SearchScreen() {
  const theme = useTheme();
  const { location } = useLocation();
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();

  const [listLimit, setListLimit] = useState(PAGE_SIZE);
  const [radiusMiles, setRadiusMiles] = useState<RadiusOption>(DEFAULT_RADIUS_MILES);

  const { shelters, filters, setFilters, searchQuery, setSearchQuery, counts, totalCount } =
    useShelters(
      location?.latitude ?? null,
      location?.longitude ?? null,
      listLimit,
      radiusMiles,
    );

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedQuery);
      setListLimit(PAGE_SIZE); // reset pagination on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedQuery, setSearchQuery]);

  useEffect(() => {
    setListLimit(PAGE_SIZE);
  }, [radiusMiles]);

  const handleToggleFilter = useCallback(
    (type: ShelterType) => {
      setFilters((prev) =>
        prev.includes(type)
          ? prev.filter((t) => t !== type)
          : [...prev, type],
      );
      setListLimit(PAGE_SIZE); // reset pagination on filter change
    },
    [setFilters],
  );

  const handleLoadMore = useCallback(() => {
    if (shelters.length < totalCount) {
      setListLimit((prev) => prev + PAGE_SIZE);
    }
  }, [shelters.length, totalCount]);

  const renderItem = useCallback(
    ({ item }: { item: Shelter }) => (
      <ShelterCard
        shelter={item}
        showSavedBadge
        onPress={() =>
          navigation.navigate('Detail', { shelterId: item.id })
        }
      />
    ),
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar value={debouncedQuery} onChangeText={setDebouncedQuery} />
      <FilterChips selected={filters} onToggle={handleToggleFilter} counts={counts} />
      <RadiusChips
        radiusMiles={radiusMiles}
        onSelect={setRadiusMiles}
        locationAvailable={location != null}
      />

      <FlatList
        data={shelters}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
            {location != null && radiusMiles != null
              ? 'No shelters in this distance. Try a larger radius, different filters, or search.'
              : 'No shelters found. Try a different search or filter.'}
          </Text>
        }
        ListFooterComponent={
          shelters.length < totalCount ? (
            <Text style={[styles.loadMore, { color: theme.colors.textSecondary }]}>
              Showing {shelters.length} of {totalCount} — scroll for more
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 40,
  },
  loadMore: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 16,
  },
});
