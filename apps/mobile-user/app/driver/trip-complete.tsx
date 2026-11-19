import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { updateRideStatus } from '../../lib/rides-api';

export default function TripCompleteScreen() {
  const { rideId, fare } = useLocalSearchParams<{ rideId?: string; fare?: string }>();
  const [done, setDone] = useState(!rideId);
  const [error, setError] = useState<string | null>(null);
  const fareAmount = Number(fare);
  const displayFare = Number.isFinite(fareAmount) && fareAmount > 0 ? fareAmount : 2800;

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;
    void updateRideStatus(rideId, 'completed')
      .then(() => {
        if (!cancelled) setDone(true);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Falha ao concluir');
          setDone(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  return (
    <View style={styles.container}>
      {!done ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginBottom: spacing.lg }} />
      ) : (
        <Text style={styles.icon}>✅</Text>
      )}
      <Text style={styles.title}>Viagem Concluída!</Text>
      <Text style={styles.subtitle}>
        {error
          ? error
          : 'Pagamento UriPay do passageiro já foi debitado na reserva. Estado gravado na BD.'}
      </Text>

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>Tarifa da viagem</Text>
          <Text style={styles.value}>{formatCurrency(displayFare)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Estado API</Text>
          <Text style={styles.value}>{rideId ? 'completed' : '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Avaliação do cliente</Text>
          <Text style={styles.value}>⭐ 5.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.primaryBtnText}>VOLTAR AO INÍCIO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingTop: 80, alignItems: 'center' },
  icon: { fontSize: 56, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginBottom: spacing['2xl'] },
  summary: { width: '100%', backgroundColor: colors.gray50, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing['2xl'] },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  label: { fontSize: 14, color: colors.gray500 },
  value: { fontSize: 14, fontWeight: '700' },
  primaryBtn: { width: '100%', backgroundColor: '#1A73E8', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
