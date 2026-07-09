import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

const DRIVER_BLUE = '#1A73E8';

const rides = [
  { id: '1', from: 'Aeroporto 4 de Fevereiro', to: 'Talatona', fare: 2800, date: '04/07/2026' },
  { id: '2', from: 'Ilha de Luanda', to: 'Kilamba', fare: 3500, date: '04/07/2026' },
  { id: '3', from: 'Maianga', to: 'Baixa de Luanda', fare: 1200, date: '03/07/2026' },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: DRIVER_BLUE }]}>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>
      <ScrollView style={styles.content}>
        {rides.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideRoute}>
              <Text style={styles.rideFrom}>{ride.from}</Text>
              <Text style={styles.rideArrow}>→</Text>
              <Text style={styles.rideTo}>{ride.to}</Text>
            </View>
            <View style={styles.rideMeta}>
              <Text style={styles.rideDate}>{ride.date} • Concluída</Text>
              <Text style={styles.rideFare}>{formatCurrency(ride.fare)}</Text>
            </View>
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
  rideCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  rideRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  rideFrom: { fontSize: 14, fontWeight: '600', flex: 1 },
  rideArrow: { color: colors.gray500 },
  rideTo: { fontSize: 14, fontWeight: '600', flex: 1 },
  rideMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  rideDate: { fontSize: 12, color: colors.gray500 },
  rideFare: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
