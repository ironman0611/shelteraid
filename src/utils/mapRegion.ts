import { Region } from 'react-native-maps';
import type { RadiusOption } from '../constants/radius';

/** Average miles per degree of latitude (continental US). */
const MI_PER_DEG_LAT = 69;

/**
 * Map region centered on the user so the visible area roughly matches the search radius.
 * `radiusMiles === null` ("Any") uses a wider regional view.
 */
export function regionForSearchRadius(
  latitude: number,
  longitude: number,
  radiusMiles: RadiusOption,
): Region {
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const milesPerDegLon = MI_PER_DEG_LAT * Math.max(cosLat, 0.25);

  if (radiusMiles == null) {
    const spanMiles = 420;
    const pad = 1.15;
    const latDelta = (2 * spanMiles * pad) / MI_PER_DEG_LAT;
    const lonDelta = (2 * spanMiles * pad) / milesPerDegLon;
    return {
      latitude,
      longitude,
      latitudeDelta: clamp(latDelta, 0.35, 45),
      longitudeDelta: clamp(lonDelta, 0.35, 45),
    };
  }

  const pad = 1.22;
  const latDelta = (2 * radiusMiles * pad) / MI_PER_DEG_LAT;
  const lonDelta = (2 * radiusMiles * pad) / milesPerDegLon;

  return {
    latitude,
    longitude,
    latitudeDelta: clamp(latDelta, 0.02, 25),
    longitudeDelta: clamp(lonDelta, 0.02, 25),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
