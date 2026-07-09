import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  DEFAULT_ORIGIN,
  colors,
  estimateRideMinutes,
  getStaticMapUrl,
  previewDemoPlace,
} from '@uritech/shared';
import { fitMapRegion, useUserLocation } from '../lib/use-user-location';
import type { UriMapProps } from './uri-map-types';

export function UriMap({
  destinationLabel,
  origin,
  destination: destinationProp,
  height = 180,
  flex = false,
  showUserLocation = true,
  markers = [],
}: UriMapProps) {
  const destPlace = useMemo(() => {
    if (destinationProp) return destinationProp;
    return destinationLabel ? previewDemoPlace(destinationLabel) : undefined;
  }, [destinationProp, destinationLabel]);

  const originPoint = origin ?? DEFAULT_ORIGIN;
  const { location: userLocation, loading: locating } = useUserLocation(showUserLocation);

  const routePoints = useMemo(() => {
    const pts = [
      showUserLocation && userLocation ? userLocation : { latitude: originPoint.latitude, longitude: originPoint.longitude },
    ];
    if (destPlace) pts.push({ latitude: destPlace.latitude, longitude: destPlace.longitude });
    markers.forEach((m) => pts.push({ latitude: m.latitude, longitude: m.longitude }));
    return pts;
  }, [showUserLocation, userLocation, originPoint, destPlace, markers]);

  const region = useMemo(() => fitMapRegion(routePoints), [routePoints]);
  const eta = destPlace ? estimateRideMinutes(originPoint, destPlace) : null;
  const wrapStyle = flex ? styles.flex : { height };
  const [mapReady, setMapReady] = useState(false);
  const staticUrl = getStaticMapUrl(originPoint, destPlace);

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mapReady) {
    return (
      <View style={[styles.wrap, wrapStyle]}>
        <Image source={{ uri: staticUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, wrapStyle]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        region={region}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={{ latitude: originPoint.latitude, longitude: originPoint.longitude }}
          title="Origem"
          pinColor={colors.primary}
        />
        {destPlace ? (
          <Marker
            coordinate={{ latitude: destPlace.latitude, longitude: destPlace.longitude }}
            title={destPlace.name}
            pinColor="#DC2626"
          />
        ) : null}
        {markers.map((m, i) => (
          <Marker
            key={`${m.latitude}-${m.longitude}-${i}`}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            pinColor={m.pinColor ?? colors.secondary}
          />
        ))}
        {destPlace ? (
          <Polyline
            coordinates={[
              {
                latitude: showUserLocation && userLocation ? userLocation.latitude : originPoint.latitude,
                longitude: showUserLocation && userLocation ? userLocation.longitude : originPoint.longitude,
              },
              { latitude: destPlace.latitude, longitude: destPlace.longitude },
            ]}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        ) : null}
      </MapView>

      {(locating || (destPlace && eta != null)) && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {locating ? 'A obter GPS…' : `~${eta} min · ${destPlace?.district ?? destPlace?.city ?? ''}`}
          </Text>
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
    backgroundColor: colors.gray50,
    overflow: 'hidden',
    position: 'relative',
  },
  flex: { flex: 1, minHeight: 180 },
  map: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '600' },
});
