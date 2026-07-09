import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

const DRIVER_BLUE = '#1A73E8';

const WEEKLY = [
  { day: 'Seg', pct: 60, amount: 1800 },
  { day: 'Ter', pct: 80, amount: 2400 },
  { day: 'Qua', pct: 45, amount: 1350 },
  { day: 'Qui', pct: 90, amount: 2700 },
  { day: 'Sex', pct: 70, amount: 2100 },
  { day: 'Sáb', pct: 95, amount: 2850 },
  { day: 'Dom', pct: 55, amount: 1650 },
];

export default function EarningsScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: DRIVER_BLUE }]}>
        <Text style={styles.headerTitle}>Ganhos</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total do Mês</Text>
          <Text style={styles.totalValue}>{formatCurrency(342500)}</Text>
          <Text style={styles.totalChange}>+18% vs mês anterior</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumo Semanal</Text>
        {WEEKLY.map((row) => (
          <View key={row.day} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{row.day}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${row.pct}%` }]} />
            </View>
            <Text style={styles.dayValue}>{formatCurrency(row.amount)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  totalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing['2xl'], alignItems: 'center', marginBottom: spacing['2xl'] },
  totalLabel: { fontSize: 14, color: colors.gray500 },
  totalValue: { fontSize: 36, fontWeight: '700', color: colors.primary, marginVertical: 8 },
  totalChange: { fontSize: 13, color: colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  dayLabel: { width: 30, fontSize: 13, fontWeight: '600' },
  barContainer: { flex: 1, height: 8, backgroundColor: colors.gray100, borderRadius: 4 },
  bar: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  dayValue: { width: 80, fontSize: 12, fontWeight: '600', textAlign: 'right' },
});
