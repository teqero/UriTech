import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CAR_CARE_SERVICES, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { confirmServiceOrder } from '../lib/service-checkout';

export default function AutomovelScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Cuidado Automóvel</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleLabel}>Meu Veículo</Text>
        <Text style={styles.vehicleName}>Toyota Land Cruiser (LD-44-23)</Text>
        <Text style={styles.vehicleSub}>Serviço no seu local agora</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {CAR_CARE_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.name}
              style={styles.serviceCard}
              onPress={() => void confirmServiceOrder({
                service: 'automovel',
                dest: s.name,
                label: `Automóvel — ${s.name}`,
                amount: s.price || 2500,
              })}
            >
              <Text style={{ fontSize: 28 }}>{s.icon}</Text>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.servicePrice}>{s.price > 0 ? formatCurrency(s.price) : 'Taxa + Comb.'}</Text>
              <Text style={styles.serviceDuration}>{s.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.sosBtn} onPress={() => router.push('/assistencia')}>
          <Text style={styles.sosText}>🆘 Assistência Estrada</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: '#1A73E8', paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  vehicleCard: { backgroundColor: colors.white, margin: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg },
  vehicleLabel: { fontSize: 12, color: colors.gray500 },
  vehicleName: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  vehicleSub: { fontSize: 13, color: colors.primary, marginTop: 4 },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  serviceCard: { width: '47%', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
  serviceName: { fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  servicePrice: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  serviceDuration: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  sosBtn: { backgroundColor: colors.error, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing['3xl'] },
  sosText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
