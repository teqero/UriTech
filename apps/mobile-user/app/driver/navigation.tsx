import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DEFAULT_ORIGIN, colors, spacing, borderRadius, previewDemoPlace } from '@uritech/shared';
import { UriMap } from '../../components/UriMap';

export default function NavigationScreen() {
  const { dest } = useLocalSearchParams<{ dest?: string }>();
  const [phase, setPhase] = useState<'pickup' | 'dropoff'>('pickup');

  const destination = dest ? previewDemoPlace(dest) : undefined;
  const pickup = DEFAULT_ORIGIN;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.mapArea}>
        <UriMap
          flex
          showUserLocation
          origin={phase === 'pickup' ? undefined : pickup}
          destination={phase === 'pickup' ? pickup : destination}
          destinationLabel={dest}
        />
        <View style={styles.mapOverlay}>
          <Text style={styles.phaseBadge}>
            {phase === 'pickup' ? 'A CAMINHO DA RECOLHA' : 'A CAMINHO DO DESTINO'}
          </Text>
        </View>
      </View>

      <View style={styles.tripCard}>
        <Text style={styles.clientName}>Cliente UriGo</Text>
        <Text style={styles.clientRating}>⭐ 4.8 • Corrida activa</Text>
        <Text style={styles.nextStep}>PRÓXIMO PASSO</Text>
        <Text style={styles.destination}>
          {phase === 'pickup' ? 'Recolher passageiro' : 'Levar ao destino'}
        </Text>
        <Text style={styles.address}>
          {phase === 'pickup'
            ? pickup.address ?? 'Ponto de recolha'
            : destination?.address ?? dest ?? 'Destino'}
        </Text>

        {phase === 'pickup' ? (
          <TouchableOpacity style={styles.arrivedBtn} onPress={() => setPhase('dropoff')}>
            <Text style={styles.arrivedText}>CHEGUEI À RECOLHA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.arrivedBtn} onPress={() => router.replace('/driver/trip-complete')}>
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
  clientName: { fontSize: 18, fontWeight: '700' },
  clientRating: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  nextStep: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: spacing.lg },
  destination: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  address: { fontSize: 13, color: colors.gray500, marginTop: 4, marginBottom: spacing.xl },
  arrivedBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  arrivedText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
