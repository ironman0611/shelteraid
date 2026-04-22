import React, { useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { ShelterCard } from '../components/ShelterCard';
import { useMyShelters } from '../context/MySheltersContext';
import { loadShelters } from '../data/shelterService';
import { Shelter } from '../types/shelter';
import { useTheme } from '../theme/useTheme';
import { Layout } from '../constants/layout';
import { MAX_MY_SHELTERS } from '../storage/mySheltersStorage';

type MyStackParamList = {
  MyMain: undefined;
  Detail: { shelterId: string };
};

export function MySheltersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const { savedIds, removeShelter, isReady } = useMyShelters();

  const shelters = useMemo(() => {
    const all = loadShelters();
    const byId = new Map(all.map((s) => [s.id, s]));
    return savedIds.map((id) => byId.get(id)).filter((s): s is Shelter => s != null);
  }, [savedIds]);

  const confirmRemove = useCallback(
    (shelter: Shelter) => {
      Alert.alert(
        'Remove shelter?',
        `${shelter.name} will be removed from My Shelter.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => void removeShelter(shelter.id),
          },
        ],
      );
    },
    [removeShelter],
  );

  const renderItem = useCallback(
    ({ item }: { item: Shelter }) => (
      <View style={styles.row}>
        <View style={styles.cardWrap}>
          <ShelterCard
            shelter={item}
            onPress={() => navigation.navigate('Detail', { shelterId: item.id })}
          />
        </View>
        <Pressable
          onPress={() => confirmRemove(item)}
          style={({ pressed }) => [
            styles.removeBtn,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name} from My Shelter`}
        >
          <Icon source="trash-can-outline" size={22} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    ),
    [confirmRemove, navigation, theme.colors],
  );

  if (!isReady) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {savedIds.length} of {MAX_MY_SHELTERS} saved locally on this device
      </Text>
      <FlatList
        data={shelters}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
            No saved shelters yet. Open a shelter and tap &quot;Save to My Shelter&quot; to add one
            here.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: Layout.fontSizeBody,
  },
  subtitle: {
    fontSize: Layout.fontSizeSmall,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 10,
    paddingBottom: 4,
  },
  list: {
    padding: Layout.screenPadding,
    paddingTop: 8,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 40,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  cardWrap: {
    flex: 1,
    minWidth: 0,
  },
  removeBtn: {
    width: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
});
