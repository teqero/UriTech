import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DEFAULT_ORIGIN, colors, spacing, borderRadius, previewDemoPlace } from '@uritech/shared';
import { UriMap } from '../../components/UriMap';
import { updateRideStatus } from '../../lib/rides-api';
import { useRideSocket } from '../../lib/use-ride-socket';
import { useUserLocation } from '../../lib/use-user-location';

type Phase = 'to_pickup' | 'at_pickup' | 'to_dropoff';

export default function NavigationScreen() {
  const { dest, rideId, fare } = useLocalSearchParams<{ dest?: string; rideId?: string; fare?: string }>();
  const [phase, setPhase] = useState<Phase>('to_pickup');
  const [busy, setBusy] = useState(false);

  const destination = dest ? previewDemoPlace(dest) : undefined;
  const pickup = DEFAULT_ORIGIN;

  const { connected, sendDriverLocation } = useRideSocket(rideId ?? null);
  const { location: userLocation } = useUserLocation(true);

  useEffect(() => {
    if (!rideId) return;
    void updateRideStatus(rideId, 'driver_arriving').catch(() => {
      /* already advanced */
    });
  }, [rideId]);

  useEffect(() => {
    if (!rideId || !connected || !userLocation) return;

    sendDriverLocation(userLocation.latitude, userLocation.longitude);
    const interval = setInterval(() => {
      sendDriverLocation(userLocation.latitude, userLocation.longitude);
    }, 3000);

    return () => clearInterval(interval);
  }, [rideId, connected, userLocation, sendDriverLocation]);

  const onArrivedPickup = useCallback(async () => {
    if (!rideId) {
      setPhase('at_pickup');
      return;
    }
    setBusy(true);
    try {
      await updateRideStatus(rideId, 'arrived');
      setPhase('at_pickup');
      Alert.alert('Chegada', 'Cliente notificado: taxi no ponto de recolha.');
    } catch (e) {
      Alert.alert('Estado', e instanceof Error ? e.message : 'Não foi possível actualizar');
    } finally {
      setBusy(false);
    }
  }, [rideId]);

  const onStartTrip = useCallback(async () => {
    if (!rideId) {
      setPhase('to_dropoff');
      return;
    }
    setBusy(true);
    try {
      await updateRideStatus(rideId, 'in_progress');
      setPhase('to_dropoff');
    } catch (e) {
      Alert.alert('Estado', e instanceof Error ? e.message : 'Não foi possível iniciar');
    } finally {
      setBusy(false);
    }
  }, [rideId]);

  const onArrivedDestination = useCallback(() => {
    router.replace({
      pathname: '/driver/trip-complete',
      params: { rideId: rideId ?? '', fare: fare ?? '' },
    });
  }, [rideId, fare]);

  const phaseBadge =
    phase === 'to_pickup'
      ? 'A CAMINHO DA RECOLHA'
      : phase === 'at_pickup'
        ? 'NO PONTO DE RECOLHA'
        : 'A CAMINHO DO DESTINO';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.mapArea}>
        <UriMap
          flex
          showUserLocation
          origin={phase === 'to_dropoff' ? pickup : undefined}
          destination={phase === 'to_dropoff' ? destination : pickup}
          destinationLabel={phase === 'to_dropoff' ? dest : pickup.address}
        />
        <View style={styles.mapOverlay}>
          <Text style={styles.phaseBadge}>{phaseBadge}</Text>
        </View>
      </View>

      <View style={styles.tripCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.clientName}>Cliente UriGo</Text>
            <Text style={styles.clientRating}>⭐ 4.8 • Corrida activa</Text>
          </View>
          {rideId && (
            <View style={[styles.wsBadge, connected && styles.wsBadgeConnected]}>
              <Text style={[styles.wsText, connected && styles.wsTextConnected]}>
                {connected ? '● Online' : '○ A ligar…'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.nextStep}>PRÓXIMO PASSO</Text>
        <Text style={styles.destination}>
          {phase === 'to_pickup'
            ? 'Ir à recolha'
            : phase === 'at_pickup'
              ? 'À espera do passageiro'
              : 'Levar ao destino'}
        </Text>
        <Text style={styles.address}>
          {phase === 'to_dropoff'
            ? destination?.address ?? dest ?? 'Destino'
            : pickup.address ?? 'Ponto de recolha'}
        </Text>

        {phase === 'to_pickup' && (
          <TouchableOpacity
            style={[styles.arrivedBtn, busy && styles.btnDisabled]}
            onPress={onArrivedPickup}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.arrivedText}>CHEGUEI À RECOLHA</Text>
            )}
          </TouchableOpacity>
        )}
        {phase === 'at_pickup' && (
          <TouchableOpacity
            style={[styles.arrivedBtn, busy && styles.btnDisabled]}
            onPress={onStartTrip}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.arrivedText}>INICIAR VIAGEM</Text>
            )}
          </TouchableOpacity>
        )}
        {phase === 'to_dropoff' && (
          <TouchableOpacity style={styles.arrivedBtn} onPress={onArrivedDestination}>
            <Text style={styles.arrivedText}>CHEGOU AO DESTINO</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  backBtn: { position: 'absolute', top: 50, left: spacing.xl, zIndex: 10, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backText: { fontWeight: '600', color: '#1A73E8' },
  mapArea: { flex: 1, position: 'relative' },
  mapOverlay: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  phaseBadge: { fontSize: 11, fontWeight: '700', color: colors.primary, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  tripCard: { backgroundColor: colors.white, padding: spacing.xl, borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, elevation: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  clientName: { fontSize: 18, fontWeight: '700' },
  clientRating: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  wsBadge: { backgroundColor: colors.gray100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  wsBadgeConnected: { backgroundColor: '#E8F5E9' },
  wsText: { fontSize: 10, fontWeight: '700', color: colors.gray500 },
  wsTextConnected: { color: '#2E7D32' },
  nextStep: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: spacing.lg },
  destination: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  address: { fontSize: 13, color: colors.gray500, marginTop: 4, marginBottom: spacing.xl },
  arrivedBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  arrivedText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
