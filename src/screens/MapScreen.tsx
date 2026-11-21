import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShelterMapMarker } from '../components/ShelterMapMarker';
import { FilterChips } from '../components/FilterChips';
import { RadiusChips } from '../components/RadiusChips';
import { MapPinLegend } from '../components/MapPinLegend';
import { NearMeButton } from '../components/NearMeButton';
import { DEFAULT_RADIUS_MILES, RadiusOption } from '../constants/radius';
import { useLocation } from '../hooks/useLocation';
import { useShelters } from '../hooks/useShelters';
import { ShelterType, ShelterWithDistance } from '../types/shelter';
import { formatDistance } from '../data/distanceUtils';
import { regionForSearchRadius } from '../utils/mapRegion';
import { useTheme } from '../theme/useTheme';

type MapStackParamList = {
  MapMain: undefined;
  Detail: { shelterId: string };
};

/** Matches the ~420 mi framing `regionForSearchRadius` uses for "Any". */
const ANY_RADIUS_VIEW_MILES = 400;
/** Only keep the user's own position in the fitted view when shelters are reasonably close. */
const INCLUDE_USER_IN_FIT_MILES = 150;
const FIT_PADDING = { top: 180, right: 60, bottom: 160, left: 60 };

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
  const [radiusMiles, setRadiusMiles] = useState<RadiusOption>(DEFAULT_RADIUS_MILES);

  const { shelters, filters, setFilters, counts, totalCount, outsideRadius } = useShelters(
    location?.latitude ?? null,
    location?.longitude ?? null,
    200,
    radiusMiles,
  );

  const region: Region = location
    ? regionForSearchRadius(location.latitude, location.longitude, radiusMiles)
    : DEFAULT_REGION;

  const nearestMiles =
    shelters.length > 0 && 'distance' in shelters[0]
      ? (shelters[0] as ShelterWithDistance).distance
      : null;

  // When the results aren't around the user (nothing in radius, or "Any" with the nearest
  // shelter far away), frame the map on the shelters instead of the user's position.
  const needsFit =
    location != null &&
    shelters.length > 0 &&
    (outsideRadius ||
      (radiusMiles == null && nearestMiles != null && nearestMiles > ANY_RADIUS_VIEW_MILES));
  const fitKey = needsFit ? `${shelters.length}:${shelters[0].id}` : '';

  const fitToResults = useCallback(() => {
    if (!location || !mapRef.current) return;
    const coords = shelters.map((s) => s.coordinates);
    if (nearestMiles != null && nearestMiles <= INCLUDE_USER_IN_FIT_MILES) {
      coords.push({ latitude: location.latitude, longitude: location.longitude });
    }
    mapRef.current.fitToCoordinates(coords, { edgePadding: FIT_PADDING, animated: true });
  }, [location, shelters, nearestMiles]);

  useEffect(() => {
    if (!location) return;
    const t = requestAnimationFrame(() => {
      if (needsFit) {
        fitToResults();
      } else {
        mapRef.current?.animateToRegion(
          regionForSearchRadius(location.latitude, location.longitude, radiusMiles),
          450,
        );
      }
    });
    return () => cancelAnimationFrame(t);
    // fitKey captures result changes; fitToResults is intentionally read fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, radiusMiles, needsFit, fitKey]);

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
    if (needsFit) {
      fitToResults();
    } else if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        regionForSearchRadius(location.latitude, location.longitude, radiusMiles),
        500,
      );
    } else {
      requestPermission();
    }
  }, [location, requestPermission, radiusMiles, needsFit, fitToResults]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        minZoomLevel={0}
        maxZoomLevel={20}
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
      </MapView>

      <View
        style={[
          styles.filterOverlay,
          { backgroundColor: theme.colors.primarySoft, shadowColor: theme.colors.shadow },
        ]}
      >
        <FilterChips selected={filters} onToggle={handleToggleFilter} counts={counts} />
        <RadiusChips
          radiusMiles={radiusMiles}
          onSelect={setRadiusMiles}
          locationAvailable={location != null}
        />
        {outsideRadius && nearestMiles != null && (
          <Text
            style={[styles.notice, { color: theme.colors.textSecondary }]}
            accessibilityRole="alert"
          >
            {`No shelters within ${radiusMiles} mi. Showing the ${shelters.length} nearest (closest is ${formatDistance(nearestMiles)} away).`}
            {nearestMiles > ANY_RADIUS_VIEW_MILES
              ? ' Shelter Aid currently covers U.S. locations only.'
              : ''}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.legendWrap,
          {
            bottom: insets.bottom + 56,
          },
        ]}
      >
        <MapPinLegend />
      </View>

      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.border,
            bottom: insets.bottom + 16,
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
  notice: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  legendWrap: {
    position: 'absolute',
    left: 16,
    right: 88,
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
