import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ROADSIDE_PROBLEMS, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';

export default function AssistenciaScreen() {
  const [selected, setSelected] = useState('tire');

  return (
    <View style={styles.container}>
      <View style={styles.sosHeader}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.sosTitle}>Assistência Estrada</Text>
        <Text style={styles.sosBadge}>SOS</Text>
      </View>

      <TouchableOpacity style={styles.sosButton}>
        <Text style={styles.sosButtonText}>Prima para Ajuda Imediata</Text>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <View style={styles.locationCard}>
          <View>
            <Text style={styles.locationLabel}>Localização Atual</Text>
            <Text style={styles.locationValue}>Via Expressa, Km 24 - Luanda</Text>
          </View>
          <TouchableOpacity><Text style={styles.changeBtn}>Mudar</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Qual é o problema?</Text>
        <View style={styles.problemsGrid}>
          {ROADSIDE_PROBLEMS.map((p) => (
            <TouchableOpacity key={p.id} style={[styles.problemCard, selected === p.id && styles.problemSelected]} onPress={() => setSelected(p.id)}>
              <Text style={{ fontSize: 24 }}>{p.icon}</Text>
              <Text style={styles.problemLabel}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.estimateCard}>
          <View style={styles.estimateHeader}>
            <Text style={styles.provider}>Reboques Luanda Express</Text>
            <Text style={styles.distance}>A 2.5km de si</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Estimativa de Preço:</Text>
            <Text style={styles.estimatePrice}>{formatCurrency(12500)}</Text>
          </View>
          <Text style={styles.eta}>Chegada: 15 min</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigateToOrderConfirmed({
            service: 'servicos',
            dest: ROADSIDE_PROBLEMS.find((p) => p.id === selected)?.label ?? 'Assistência',
            label: 'Assistência Estrada SOS',
            amount: '12500',
          })}
        >
          <Text style={styles.primaryBtnText}>SOLICITAR ASSISTÊNCIA</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  sosHeader: { backgroundColor: colors.error, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sosTitle: { flex: 1, color: colors.white, fontSize: 18, fontWeight: '700' },
  sosBadge: { backgroundColor: colors.white, color: colors.error, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12 },
  sosButton: { backgroundColor: colors.error, marginHorizontal: spacing.xl, marginTop: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  sosButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  content: { flex: 1, padding: spacing.xl },
  locationCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.gray50, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  locationLabel: { fontSize: 12, color: colors.gray500 },
  locationValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  changeBtn: { color: colors.primary, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  problemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  problemCard: { width: '31%', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg },
  problemSelected: { borderColor: colors.error, borderWidth: 2, backgroundColor: '#FFF0F0' },
  problemLabel: { fontSize: 10, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  estimateCard: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  estimateHeader: { marginBottom: 8 },
  provider: { fontSize: 15, fontWeight: '700' },
  distance: { fontSize: 12, color: colors.gray500 },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  estimateLabel: { fontSize: 14 },
  estimatePrice: { fontSize: 18, fontWeight: '700', color: colors.primary },
  eta: { fontSize: 13, color: colors.gray500 },
  primaryBtn: { backgroundColor: colors.error, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing['3xl'] },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
