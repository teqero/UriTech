import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

export default function RideRequestScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>TAXI PREMIUM</Text>
        <Text style={styles.fare}>{formatCurrency(2800)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>RECOLHA</Text>
          <Text style={styles.locationValue}>Aeroporto 4 de Fevereiro</Text>
        </View>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>DESTINO</Text>
          <Text style={styles.locationValue}>Hotel Epic Sana, Luanda</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>DISTÂNCIA</Text>
            <Text style={styles.metaValue}>5.4 km</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>TEMPO ESTIMADO</Text>
            <Text style={styles.metaValue}>18 min</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.acceptBtn} onPress={() => router.push('/navigation')}>
          <Text style={styles.acceptText}>ACEITAR PEDIDO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => router.back()}>
          <Text style={styles.rejectText}>RECUSAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Driver ride request — PDF Parte 2 pág. 11
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
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
  acceptText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rejectBtn: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  rejectText: { color: colors.error, fontWeight: '700' },
});
