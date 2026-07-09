import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

const VENDOR_RED = '#EE2737';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: VENDOR_RED }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Receita do Mês</Text>
          <Text style={styles.totalValue}>{formatCurrency(1845000)}</Text>
          <Text style={styles.change}>+12.4% vs mês anterior</Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.metric}><Text style={styles.metricValue}>342</Text><Text style={styles.metricLabel}>Pedidos</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>4.8</Text><Text style={styles.metricLabel}>Avaliação</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>28 min</Text><Text style={styles.metricLabel}>Tempo Médio</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>92%</Text><Text style={styles.metricLabel}>Aceitação</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { padding: 4 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  totalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing['2xl'], alignItems: 'center', marginBottom: spacing['2xl'] },
  totalLabel: { fontSize: 14, color: colors.gray500 },
  totalValue: { fontSize: 36, fontWeight: '700', color: VENDOR_RED, marginTop: 8 },
  change: { fontSize: 13, color: colors.primary, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { width: '47%', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: '700' },
  metricLabel: { fontSize: 12, color: colors.gray500, marginTop: 4 },
});
