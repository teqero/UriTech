import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '@uritech/shared';

export default function NavigationScreen() {
  const [phase, setPhase] = useState<'pickup' | 'dropoff'>('pickup');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.mapArea}>
        <Text style={styles.distance}>{phase === 'pickup' ? '450m' : '2.1 km'}</Text>
        <Text style={styles.direction}>
          {phase === 'pickup'
            ? 'Siga em frente para o Aeroporto 4 de Fevereiro'
            : 'Vire direita para Av. 4 de Fevereiro (Baía de Luanda)'}
        </Text>
        <Text style={styles.phaseBadge}>{phase === 'pickup' ? 'A CAMINHO DA RECOLHA' : 'A CAMINHO DO DESTINO'}</Text>
      </View>

      <View style={styles.tripCard}>
        <Text style={styles.clientName}>Carlos Manuel</Text>
        <Text style={styles.clientRating}>⭐ 4.8 • Cliente Premium</Text>
        <Text style={styles.nextStep}>PRÓXIMO PASSO</Text>
        <Text style={styles.destination}>
          {phase === 'pickup' ? 'Recolher passageiro no Aeroporto' : 'Levar ao Hotel Epic Sana'}
        </Text>
        <Text style={styles.address}>
          {phase === 'pickup'
            ? 'Terminal Internacional, 4 de Fevereiro'
            : 'Desembarque na Av. 4 de Fevereiro (Baía de Luanda)'}
        </Text>

        {phase === 'pickup' ? (
          <TouchableOpacity style={styles.arrivedBtn} onPress={() => setPhase('dropoff')}>
            <Text style={styles.arrivedText}>CHEGUEI À RECOLHA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.arrivedBtn} onPress={() => router.replace('/trip-complete')}>
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
  mapArea: { flex: 1, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  distance: { fontSize: 48, fontWeight: '700', color: '#1A73E8' },
  direction: { fontSize: 16, textAlign: 'center', marginTop: spacing.md, color: colors.gray700 },
  phaseBadge: { marginTop: spacing.lg, fontSize: 11, fontWeight: '700', color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  tripCard: { backgroundColor: colors.white, padding: spacing.xl, borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, elevation: 8 },
  clientName: { fontSize: 18, fontWeight: '700' },
  clientRating: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  nextStep: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: spacing.lg },
  destination: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  address: { fontSize: 13, color: colors.gray500, marginTop: 4, marginBottom: spacing.xl },
  arrivedBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  arrivedText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
