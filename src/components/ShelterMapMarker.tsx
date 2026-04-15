import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Text } from 'react-native';
import { Shelter, ShelterType } from '../types/shelter';
import { useTheme } from '../theme/useTheme';

function getPrimaryColor(
  types: ShelterType[],
  theme: ReturnType<typeof useTheme>,
): string {
  const typeColors: Record<ShelterType, string> = {
    emergency: theme.colors.statusClosed,
    transitional: theme.colors.tagTransitional.text,
    food: theme.colors.statusLimited,
    medical: theme.colors.tagMedical.text,
  };
  for (const t of types) {
    if (typeColors[t]) return typeColors[t];
  }
  return theme.colors.primary;
}

interface Props {
  shelter: Shelter;
  distanceLabel?: string;
  onCalloutPress: () => void;
}

export function ShelterMapMarker({ shelter, distanceLabel, onCalloutPress }: Props) {
  const theme = useTheme();
  const color = getPrimaryColor(shelter.type, theme);

  return (
    <Marker
      coordinate={shelter.coordinates}
      pinColor={color}
      tracksViewChanges={false}
    >
      <Callout onPress={onCalloutPress} tooltip={false}>
        <View style={styles.callout}>
          <Text style={[styles.calloutName, { color: theme.colors.text }]} numberOfLines={2}>
            {shelter.name}
          </Text>
          {distanceLabel && (
            <Text style={[styles.calloutDistance, { color: theme.colors.textSecondary }]}>
              {distanceLabel}
            </Text>
          )}
          <Text style={[styles.calloutHint, { color: theme.colors.primary }]}>Tap for details</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: {
    width: 180,
    padding: 8,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 12,
    marginBottom: 4,
  },
  calloutHint: {
    fontSize: 11,
    fontWeight: '500',
  },
});
