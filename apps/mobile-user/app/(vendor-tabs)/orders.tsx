import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import {
  INITIAL_VENDOR_ORDERS, VENDOR_ORDER_TABS, actionLabel,
  type VendorOrder, type VendorOrderStatus,
} from '../../lib/orders';
import {
  fetchVendorOrders,
  mapApiOrderToVendor,
  updateOrderStatus,
  vendorActionToOrderStatus,
} from '../../lib/orders-api';

const VENDOR_RED = '#EE2737';

function tabFromParam(tab?: string): VendorOrderStatus {
  if (tab === 'preparando' || tab === 'prontos' || tab === 'historico') return tab;
  return 'novos';
}

export default function VendorOrdersListScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<VendorOrderStatus>(tabFromParam(tab));
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_VENDOR_ORDERS);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const apiOrders = await fetchVendorOrders();
      setOrders(apiOrders.map(mapApiOrderToVendor));
      setUseApi(true);
    } catch {
      setUseApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (tab) setActiveTab(tabFromParam(tab));
  }, [tab]);

  const filtered = useMemo(
    () => orders.filter((o) => o.status === activeTab),
    [orders, activeTab],
  );

  const advance = async (order: VendorOrder) => {
    const nextStatus = vendorActionToOrderStatus(order.status);
    if (!nextStatus) return;

    if (useApi && order.apiId) {
      try {
        const updated = await updateOrderStatus(order.apiId, nextStatus);
        setOrders((prev) =>
          prev.map((o) => (o.apiId === order.apiId ? mapApiOrderToVendor(updated) : o)),
        );
      } catch (e) {
        Alert.alert('Pedido', e instanceof Error ? e.message : 'Erro ao actualizar');
      }
      return;
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        const tabs: VendorOrderStatus[] = ['novos', 'preparando', 'prontos', 'historico'];
        const idx = tabs.indexOf(o.status);
        const next = tabs[idx + 1];
        return next ? { ...o, status: next } : o;
      }),
    );
  };

  const cancel = async (order: VendorOrder) => {
    if (useApi && order.apiId) {
      try {
        await updateOrderStatus(order.apiId, 'cancelled');
        setOrders((prev) => prev.filter((o) => o.apiId !== order.apiId));
      } catch (e) {
        Alert.alert('Cancelar', e instanceof Error ? e.message : 'Erro ao cancelar');
      }
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: VENDOR_RED }]}>
        <Text style={styles.headerTitle}>Pedidos</Text>
      </View>

      <View style={styles.tabs}>
        {VENDOR_ORDER_TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={VENDOR_RED} />
      ) : (
        <ScrollView style={styles.content}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>Nenhum pedido nesta secção.</Text>
          ) : (
            filtered.map((order) => (
              <View key={order.apiId ?? order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <Text style={styles.orderTime}>{order.time}</Text>
                </View>
                <Text style={styles.customer}>{order.customer}</Text>
                <Text style={styles.items}>{order.items}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.total}>{formatCurrency(order.total)}</Text>
                </View>
                {order.status !== 'historico' ? (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(order)}>
                      <Text style={styles.cancelText}>CANCELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => advance(order)}>
                      <Text style={styles.acceptText}>{actionLabel(order.status)}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.doneBadge}>
                    <Text style={styles.doneText}>✓ Entregue</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: '#FFF0F0' },
  tabText: { fontSize: 11, fontWeight: '600', color: colors.gray500 },
  tabTextActive: { color: VENDOR_RED, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  empty: { textAlign: 'center', color: colors.gray500, marginTop: spacing.xl },
  orderCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontSize: 13, color: VENDOR_RED, fontWeight: '700' },
  orderTime: { fontSize: 12, color: colors.gray500 },
  customer: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  items: { fontSize: 13, color: colors.gray500, marginBottom: spacing.md },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  totalLabel: { fontSize: 14, color: colors.gray500 },
  total: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error, alignItems: 'center' },
  cancelText: { color: colors.error, fontWeight: '700', fontSize: 13 },
  acceptBtn: { flex: 2, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  acceptText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  doneBadge: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  doneText: { color: colors.primary, fontWeight: '700' },
});
