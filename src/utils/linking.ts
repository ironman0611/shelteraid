import { Linking, Platform } from 'react-native';

export function openDialer(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

export function openDirections(lat: number, lon: number, label: string) {
  const encoded = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `maps:?daddr=${lat},${lon}&q=${encoded}`
      : `geo:${lat},${lon}?q=${lat},${lon}(${encoded})`;
  Linking.openURL(url);
}

export function openWebsite(url: string) {
  Linking.openURL(url);
}
