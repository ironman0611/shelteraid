import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShelterMapMarker } from '../components/ShelterMapMarker';
import { FilterChips } from '../components/FilterChips';
import { NearMeButton } from '../components/NearMeButton';
import { useLocation } from '../hooks/useLocation';
import { useShelters } from '../hooks/useShelters';
import { ShelterType, ShelterWithDistance } from '../types/shelter';
import { formatDistance } from '../data/distanceUtils';
import { useTheme } from '../theme/useTheme';

type MapStackParamList = {
  MapMain: undefined;
  Detail: { shelterId: string };
};

const DEFAULT_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

export function MapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { location, requestPermission } = useLocation();
  const navigation =
    useNavigation<NativeStackNavigationProp<MapStackParamList>>();

  const { shelters, filters, setFilters, counts, totalCount } = useShelters(
    location?.latitude ?? null,
    location?.longitude ?? null,
    200,
  );

  const region: Region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }
    : DEFAULT_REGION;

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

  const handleNearMe = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        500,
      );
    } else {
      requestPermission();
    }
  }, [location, requestPermission]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        clusterColor={theme.colors.primary}
        clusterTextColor={theme.colors.surface}
        clusterFontFamily="System"
        radius={50}
        minZoomLevel={0}
        maxZoomLevel={20}
        animationEnabled={false}
      >
        {shelters.map((shelter) => (
          <ShelterMapMarker
            key={shelter.id}
            shelter={shelter}
            distanceLabel={
              'distance' in shelter
                ? formatDistance((shelter as ShelterWithDistance).distance)
                : undefined
            }
            onCalloutPress={() =>
              navigation.navigate('Detail', { shelterId: shelter.id })
            }
          />
        ))}
      </ClusteredMapView>

      <View
        style={[
          styles.filterOverlay,
          { backgroundColor: theme.colors.primarySoft, shadowColor: theme.colors.shadow },
        ]}
      >
        <FilterChips selected={filters} onToggle={handleToggleFilter} counts={counts} />
      </View>

      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.border,
            bottom: insets.bottom + 18,
          },
        ]}
      >
        <Text style={[styles.countText, { color: theme.colors.primary }]}>
          {shelters.length === totalCount
            ? `${totalCount} shelters`
            : `${shelters.length} of ${totalCount} shelters`}
        </Text>
      </View>

      <NearMeButton onPress={handleNearMe} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countBadge: {
    position: 'absolute',
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
