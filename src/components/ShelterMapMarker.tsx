import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Text } from 'react-native';
import { Shelter, ShelterType } from '../types/shelter';
import { Colors } from '../constants/colors';

const TYPE_COLORS: Record<ShelterType, string> = {
  emergency: Colors.markerEmergency,
  transitional: Colors.markerTransitional,
  food: Colors.markerFood,
  medical: Colors.markerMedical,
};

function getPrimaryColor(types: ShelterType[]): string {
  for (const t of types) {
    if (TYPE_COLORS[t]) return TYPE_COLORS[t];
  }
  return Colors.primary;
}

interface Props {
  shelter: Shelter;
  distanceLabel?: string;
  onCalloutPress: () => void;
}

export function ShelterMapMarker({ shelter, distanceLabel, onCalloutPress }: Props) {
  const color = getPrimaryColor(shelter.type);

  return (
    <Marker
      coordinate={shelter.coordinates}
      pinColor={color}
      tracksViewChanges={false}
    >
      <Callout onPress={onCalloutPress} tooltip={false}>
        <View style={styles.callout}>
          <Text style={styles.calloutName} numberOfLines={2}>
            {shelter.name}
          </Text>
          {distanceLabel && (
            <Text style={styles.calloutDistance}>{distanceLabel}</Text>
          )}
          <Text style={styles.calloutHint}>Tap for details</Text>
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
    color: Colors.text,
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calloutHint: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
});
