import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

const DRIVER_BLUE = '#1A73E8';

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: DRIVER_BLUE }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.statusLabel}>{isOnline ? 'ESTOU ONLINE' : 'OFFLINE'}</Text>
            <Text style={styles.earningsLabel}>Ganhos de Hoje</Text>
            <Text style={styles.earnings}>{formatCurrency(12450)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.onlineToggle, isOnline ? styles.onlineActive : styles.offlineActive]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Viagens</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>⭐ 4.9</Text>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
      </View>

      {isOnline && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Nova solicitação próxima</Text>
          <Text style={styles.alertDesc}>Há um pedido de Taxi a 1.2km</Text>
          <TouchableOpacity style={styles.viewBtn} onPress={() => router.push('/ride-request')}>
            <Text style={styles.viewBtnText}>VER PEDIDO</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mapArea}>
        <Text style={styles.mapText}>🗺️ Mapa com pedidos próximos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusLabel: { color: colors.primaryLight, fontSize: 12, fontWeight: '700', backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 8 },
  earningsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  earnings: { color: colors.white, fontSize: 28, fontWeight: '700', marginTop: 4 },
  onlineToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  onlineActive: { backgroundColor: colors.primary },
  offlineActive: { backgroundColor: colors.gray500 },
  onlineText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', padding: spacing.xl, gap: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  alertCard: { marginHorizontal: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.secondary },
  alertTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  alertDesc: { fontSize: 13, color: colors.gray500, marginBottom: spacing.md },
  viewBtn: { backgroundColor: DRIVER_BLUE, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  viewBtnText: { color: colors.white, fontWeight: '700' },
  mapArea: { flex: 1, margin: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  mapText: { color: colors.gray500 },
});
