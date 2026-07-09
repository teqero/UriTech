'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_ORIGIN } from '@uritech/shared';

export interface BrowserCoords {
  latitude: number;
  longitude: number;
}

export function useBrowserLocation(enabled = true) {
  const [location, setLocation] = useState<BrowserCoords | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setDenied(false);
      setLoading(false);
    };

    const onError = () => {
      setDenied(true);
      setLocation({ latitude: DEFAULT_ORIGIN.latitude, longitude: DEFAULT_ORIGIN.longitude });
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 12000,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      maximumAge: 20000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { location, loading, denied };
}
