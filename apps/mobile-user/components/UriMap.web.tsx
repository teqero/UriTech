import { createElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  DEFAULT_ORIGIN,
  estimateRideMinutes,
  getMapEmbedUrl,
  previewDemoPlace,
} from '@uritech/shared';
import type { DemoPlace } from '@uritech/shared';
import { useUserLocation } from '../lib/use-user-location';
import type { UriMapProps } from './uri-map-types';

export function UriMap({
  destinationLabel,
  origin,
  destination: destinationProp,
  height = 180,
  flex = false,
  showUserLocation = true,
}: UriMapProps) {
  const destPlace: DemoPlace | undefined = useMemo(() => {
    if (destinationProp) return destinationProp as DemoPlace;
    return destinationLabel ? previewDemoPlace(destinationLabel) : undefined;
  }, [destinationProp, destinationLabel]);

  const originPoint = origin ?? DEFAULT_ORIGIN;
  useUserLocation(showUserLocation);
  const eta = destPlace ? estimateRideMinutes(originPoint, destPlace) : null;
  const wrapStyle = flex ? styles.flex : { height };
  const mapUrl = getMapEmbedUrl(originPoint, destPlace);

  return (
    <View style={[styles.wrap, wrapStyle]}>
      {createElement('iframe', {
        key: mapUrl,
        title: 'Mapa',
        src: mapUrl,
        style: { width: '100%', height: '100%', border: 0 },
      })}
      {destPlace && eta != null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>~{eta} min · {destPlace.district ?? destPlace.city}</Text>
        </View>
      )}
    </View>
  );
}

export function DemoMap(props: UriMapProps) {
  return <UriMap {...props} />;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    position: 'relative',
  },
  flex: { flex: 1, minHeight: 180 },
  badge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
