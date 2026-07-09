'use client';

import { useMemo } from 'react';
import {
  DEFAULT_ORIGIN,
  estimateRideMinutes,
  type Location,
} from '@uritech/shared';
import { useBrowserLocation } from '@/lib/use-browser-location';
import styles from './MapEmbed.module.css';

type MapEmbedProps = {
  origin?: Location;
  destination?: Location;
  height?: number;
  className?: string;
  showUserLocation?: boolean;
};

function buildOsmEmbedUrl(origin: Location, destination?: Location, user?: Location | null) {
  const points = [
    { lat: origin.latitude, lng: origin.longitude },
    ...(destination ? [{ lat: destination.latitude, lng: destination.longitude }] : []),
    ...(user ? [{ lat: user.latitude, lng: user.longitude }] : []),
  ];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.015;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;

  const markers = points.map((p) => `marker=${p.lat}%2C${p.lng}`).join('&');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&${markers}`;
}

export function MapEmbed({
  origin = DEFAULT_ORIGIN,
  destination,
  height = 220,
  className,
  showUserLocation = false,
}: MapEmbedProps) {
  const { location: userLocation, loading: locating } = useBrowserLocation(showUserLocation);

  const mapUrl = useMemo(
    () => buildOsmEmbedUrl(origin, destination, showUserLocation ? userLocation : null),
    [origin, destination, showUserLocation, userLocation],
  );

  const eta = destination ? estimateRideMinutes(origin, destination) : null;

  return (
    <div className={`${styles.wrap} ${className ?? ''}`} style={{ height }}>
      <iframe
        key={mapUrl}
        title="Mapa"
        src={mapUrl}
        className={styles.frame}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {(locating && showUserLocation) || (destination && eta != null) || (showUserLocation && userLocation) ? (
        <div className={styles.badge}>
          {locating && showUserLocation
            ? 'A obter GPS…'
            : destination && eta != null
              ? `~${eta} min · ${destination.city ?? 'Luanda'}`
              : 'A sua posição no mapa'}
        </div>
      ) : null}
    </div>
  );
}
