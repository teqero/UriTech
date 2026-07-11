import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { confirmServiceOrder } from '../lib/service-checkout';

const POOL_PASSENGERS = [
  { name: 'Ana Silva', pickup: 'Recolha: Luanda Sul' },
  { name: 'Carlos Neto', pickup: 'Recolha: Talatona' },
];

export default function PoolScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partilhar Viagem</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Poupa até 40% ao partilhar com outros.</Text>

        {POOL_PASSENGERS.map((p) => (
          <View key={p.name} style={styles.passengerCard}>
            <Text style={styles.passengerName}>{p.name}</Text>
            <Text style={styles.passengerPickup}>{p.pickup}</Text>
          </View>
        ))}

        <View style={styles.poolCard}>
          <Text style={styles.poolTitle}>UriGo Pool</Text>
          <View style={styles.priceCompare}>
            <View style={styles.priceCol}>
              <Text style={styles.priceOld}>{formatCurrency(3500)}</Text>
              <View style={styles.discountBadge}><Text style={styles.discountText}>-25%</Text></View>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceNew}>{formatCurrency(2100)}</Text>
              <View style={[styles.discountBadge, styles.discountGreen]}><Text style={styles.discountText}>-15%</Text></View>
            </View>
          </View>
          <Text style={styles.savings}>Poupe {formatCurrency(1400)} (40% off)</Text>
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/taxi')}>
          <Text style={styles.secondaryBtnText}>MANTER VIAGEM PRIVADA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => void confirmServiceOrder({
            service: 'pool',
            dest: 'UriGo Pool',
            label: 'Pool — viagem partilhada',
            amount: 900,
          })}
        >
          <Text style={styles.primaryBtnText}>ACEITAR OFERTA POOL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  subtitle: { fontSize: 15, color: colors.gray500, marginBottom: spacing.xl },
  passengerCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray100 },
  passengerName: { fontSize: 16, fontWeight: '700' },
  passengerPickup: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  poolCard: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.xl, padding: spacing.xl, marginVertical: spacing.xl, alignItems: 'center' },
  poolTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, marginBottom: spacing.lg },
  priceCompare: { flexDirection: 'row', gap: spacing['2xl'], marginBottom: spacing.md },
  priceCol: { alignItems: 'center' },
  priceOld: { fontSize: 22, fontWeight: '600', color: colors.gray500, textDecorationLine: 'line-through' },
  priceNew: { fontSize: 32, fontWeight: '700', color: colors.primary },
  discountBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  discountGreen: { backgroundColor: colors.primary },
  discountText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  savings: { fontSize: 14, fontWeight: '600', color: colors.primary },
  secondaryBtn: { borderWidth: 1, borderColor: colors.gray300, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  secondaryBtnText: { fontWeight: '700', fontSize: 14, color: colors.gray700 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing['3xl'] },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
