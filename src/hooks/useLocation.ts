import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface Coords {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: Coords | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

/**
 * Dev-only fake location for testing other cities, e.g.
 *   EXPO_PUBLIC_MOCK_LOCATION="51.5072,-0.1276" npx expo start --tunnel -c
 * Ignored in production builds.
 */
function getMockLocation(): Coords | null {
  if (!__DEV__) return null;
  const raw = process.env.EXPO_PUBLIC_MOCK_LOCATION;
  if (!raw) return null;
  const [lat, lon] = raw.split(',').map((v) => Number(v.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    console.warn(`Ignoring invalid EXPO_PUBLIC_MOCK_LOCATION "${raw}" (expected "lat,lon")`);
    return null;
  }
  return { latitude: lat, longitude: lon };
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const mock = getMockLocation();
      if (mock) {
        setLocation(mock);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch (e) {
      setError('Could not get location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return { location, loading, error, requestPermission };
}
