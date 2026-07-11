import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { countByStatus, INITIAL_VENDOR_ORDERS, type VendorOrder } from '../../lib/orders';
import { fetchVendorOrders, mapApiOrderToVendor } from '../../lib/orders-api';

const VENDOR_RED = '#EE2737';

export default function VendorDashboardScreen() {
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_VENDOR_ORDERS);
  const [isOpen, setIsOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const apiOrders = await fetchVendorOrders();
      setOrders(apiOrders.map(mapApiOrderToVendor));
    } catch {
      /* keep demo fallback */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const novos = countByStatus(orders, 'novos');
  const preparando = countByStatus(orders, 'preparando');
  const prontos = countByStatus(orders, 'prontos');
  const entregues = countByStatus(orders, 'historico');

  const goOrders = (tab: string) => {
    router.push({ pathname: '/(vendor-tabs)/orders', params: { tab } } as never);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: VENDOR_RED }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.storeName}>Kero Kilamba</Text>
            <Text style={styles.role}>Gestor da Loja</Text>
          </View>
          <TouchableOpacity
            style={[styles.openBadge, !isOpen && styles.closedBadge]}
            onPress={() => setIsOpen((v) => !v)}
          >
            <Text style={styles.openText}>{isOpen ? 'ABERTO' : 'FECHADO'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'NOVOS', value: novos, color: colors.secondary, tab: 'novos' },
          { label: 'PREPARANDO', value: preparando, color: '#1A73E8', tab: 'preparando' },
          { label: 'PRONTOS', value: prontos, color: colors.primary, tab: 'prontos' },
          { label: 'ENTREGUES', value: entregues, color: colors.gray500, tab: 'historico' },
        ].map((s) => (
          <TouchableOpacity key={s.label} style={styles.statCard} onPress={() => goOrders(s.tab)}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.salesCard}>
        <Text style={styles.salesLabel}>Vendas de Hoje</Text>
        <Text style={styles.salesValue}>{formatCurrency(154200)}</Text>
        <Text style={styles.salesChange}>+12.4% em relação a ontem</Text>
      </View>

      {novos > 0 ? (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>Você tem {novos} pedidos pendentes!</Text>
          <TouchableOpacity style={styles.alertBtn} onPress={() => goOrders('novos')}>
            <Text style={styles.alertBtnText}>VER AGORA</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.menuRow}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(vendor-tabs)/menu' as never)}>
          <Text style={styles.menuEmoji}>📋</Text>
          <Text style={styles.menuText}>Cardápio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(vendor-tabs)/orders' as never)}>
          <Text style={styles.menuEmoji}>🏷️</Text>
          <Text style={styles.menuText}>Promoções</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(vendor-tabs)/analytics' as never)}>
          <Text style={styles.menuEmoji}>📊</Text>
          <Text style={styles.menuText}>Relatórios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { color: colors.white, fontSize: 22, fontWeight: '700' },
  role: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  openBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  closedBadge: { backgroundColor: colors.gray500 },
  openText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  statsRow: { flexDirection: 'row', padding: spacing.xl, gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 9, color: colors.gray500, marginTop: 2, fontWeight: '600', textAlign: 'center' },
  salesCard: { marginHorizontal: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  salesLabel: { fontSize: 13, color: colors.gray500 },
  salesValue: { fontSize: 32, fontWeight: '700', color: VENDOR_RED, marginVertical: 4 },
  salesChange: { fontSize: 13, color: colors.primary },
  alertBanner: { marginHorizontal: spacing.xl, backgroundColor: '#FFF3E8', borderRadius: borderRadius.lg, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  alertText: { fontSize: 14, fontWeight: '600', flex: 1 },
  alertBtn: { backgroundColor: colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  alertBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  menuRow: { flexDirection: 'row', marginHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing['3xl'] },
  menuItem: { flex: 1, backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  menuEmoji: { fontSize: 24, marginBottom: 6 },
  menuText: { fontSize: 13, fontWeight: '600' },
});
