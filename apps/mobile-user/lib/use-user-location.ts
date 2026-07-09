import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_ORIGIN } from '@uritech/shared';

export interface UserCoords {
  latitude: number;
  longitude: number;
}

export function useUserLocation(enabled = true) {
  const [location, setLocation] = useState<UserCoords | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let active = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (status !== 'granted') {
          setDenied(true);
          setLocation({ latitude: DEFAULT_ORIGIN.latitude, longitude: DEFAULT_ORIGIN.longitude });
          setLoading(false);
          return;
        }
        setDenied(false);
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLoading(false);
        }
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 6000 },
          (update) => {
            setLocation({ latitude: update.coords.latitude, longitude: update.coords.longitude });
            setLoading(false);
          },
        );
      } catch {
        if (active) {
          setLocation({ latitude: DEFAULT_ORIGIN.latitude, longitude: DEFAULT_ORIGIN.longitude });
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [enabled]);

  return { location, loading, denied };
}

export function fitMapRegion(points: UserCoords[]) {
  if (points.length === 0) {
    return {
      latitude: DEFAULT_ORIGIN.latitude,
      longitude: DEFAULT_ORIGIN.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }
  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.025, (maxLat - minLat) * 1.5 + 0.01),
    longitudeDelta: Math.max(0.025, (maxLng - minLng) * 1.5 + 0.01),
  };
}
