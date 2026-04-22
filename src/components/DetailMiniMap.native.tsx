import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Props = {
  coordinates: { latitude: number; longitude: number };
};

export function DetailMiniMap({ coordinates }: Props) {
  return (
    <MapView
      style={styles.miniMap}
      initialRegion={{
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      <Marker coordinate={coordinates} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  miniMap: {
    height: 150,
  },
});
