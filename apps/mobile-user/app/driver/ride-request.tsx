import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import type { Ride } from '@uritech/shared';
import { acceptRide, fetchRide } from '../../lib/rides-api';

export default function RideRequestScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }
    fetchRide(rideId)
      .then(setRide)
      .finally(() => setLoading(false));
  }, [rideId]);

  const handleAccept = async () => {
    if (!rideId) return;
    setAccepting(true);
    try {
      await acceptRide(rideId);
      router.push({
        pathname: '/driver/navigation',
        params: { dest: ride?.destination.address ?? '', rideId },
      });
    } catch (e) {
      Alert.alert('Aceitar', e instanceof Error ? e.message : 'Não foi possível aceitar');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.missingText}>Pedido não encontrado.</Text>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => router.back()}>
          <Text style={styles.rejectText}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distanceKm = (ride.distance / 1000).toFixed(1);
  const durationMin = Math.round(ride.duration / 60);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>{ride.vehicleType.toUpperCase()}</Text>
        <Text style={styles.fare}>{formatCurrency(ride.fare)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>RECOLHA</Text>
          <Text style={styles.locationValue}>{ride.pickup.address ?? 'Origem'}</Text>
        </View>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>DESTINO</Text>
          <Text style={styles.locationValue}>{ride.destination.address ?? 'Destino'}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>DISTÂNCIA</Text>
            <Text style={styles.metaValue}>{distanceKm} km</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>TEMPO ESTIMADO</Text>
            <Text style={styles.metaValue}>{durationMin} min</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.acceptBtn, accepting && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.acceptText}>ACEITAR PEDIDO</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => router.back()}>
          <Text style={styles.rejectText}>RECUSAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missingText: { fontSize: 16, color: colors.gray500, marginBottom: spacing.lg },
  header: { backgroundColor: '#1A73E8', paddingTop: 60, paddingBottom: spacing.xl, alignItems: 'center' },
  badge: { color: colors.white, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  fare: { color: colors.white, fontSize: 36, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  locationCard: { padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  locationLabel: { fontSize: 11, color: colors.gray500, fontWeight: '700' },
  locationValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl },
  meta: { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  metaLabel: { fontSize: 11, color: colors.gray500, fontWeight: '700' },
  metaValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  acceptBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  btnDisabled: { opacity: 0.7 },
  acceptText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rejectBtn: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  rejectText: { color: colors.error, fontWeight: '700' },
});
