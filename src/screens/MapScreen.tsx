import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShelterMapMarker } from '../components/ShelterMapMarker';
import { FilterChips } from '../components/FilterChips';
import { NearMeButton } from '../components/NearMeButton';
import { useLocation } from '../hooks/useLocation';
import { useShelters } from '../hooks/useShelters';
import { ShelterType, ShelterWithDistance } from '../types/shelter';
import { formatDistance } from '../data/distanceUtils';
import { Colors } from '../constants/colors';

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
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        clusterColor={Colors.primary}
        clusterTextColor="#fff"
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

      <View style={styles.filterOverlay}>
        <FilterChips selected={filters} onToggle={handleToggleFilter} counts={counts} />
      </View>

      <View style={styles.countBadge}>
        <Text style={styles.countText}>
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
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countBadge: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
