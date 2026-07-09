import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import type { Order, OrderStatus } from '@uritech/shared';
import {
  advanceDeliveryOrder,
  fetchRiderActiveOrders,
} from '../../lib/orders-api';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  picked_up: 'Iniciar entrega',
  in_transit: 'Marcar como entregue',
};

function statusLabel(status: OrderStatus): string {
  const labels: Record<string, string> = {
    picked_up: 'Recolhido — a caminho do cliente',
    in_transit: 'Em trânsito',
    delivered: 'Entregue',
  };
  return labels[status] ?? status;
}

export default function DeliveryRoutesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchRiderActiveOrders();
      setOrders(data);
    } catch (e) {
      if (!silent) {
        Alert.alert('Rotas', e instanceof Error ? e.message : 'Erro ao carregar rotas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const advance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    setAdvancingId(order.id);
    try {
      const updated = await advanceDeliveryOrder(order.id, next);
      setOrders((prev) =>
        next === 'delivered' ? prev.filter((o) => o.id !== order.id) : prev.map((o) => (o.id === order.id ? updated : o)),
      );
    } catch (e) {
      Alert.alert('Entrega', e instanceof Error ? e.message : 'Não foi possível actualizar');
    } finally {
      setAdvancingId(null);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar rotas…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rotas activas</Text>
      <Text style={styles.subtitle}>
        {orders.length === 0
          ? 'Sem entregas em curso. Aceite pedidos prontos no separador Início.'
          : `${orders.length} entrega(s) em curso`}
      </Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma rota activa</Text>
            <Text style={styles.emptyHint}>Pedidos aceites aparecem aqui para recolha e entrega.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const next = NEXT_STATUS[item.status];
          const action = ACTION_LABEL[item.status];
          return (
            <View style={styles.card}>
              <Text style={styles.step}>Paragem {index + 1}</Text>
              <Text style={styles.cardTitle}>Recolha — {item.pickupLocation.address}</Text>
              <Text style={styles.cardDest}>Entrega — {item.deliveryLocation.address}</Text>
              <Text style={styles.cardItems}>
                {item.items.map((i) => i.name).join(', ')} • {formatCurrency(item.total)}
              </Text>
              <Text style={styles.cardStatus}>{statusLabel(item.status)}</Text>
              {next && action && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  disabled={advancingId === item.id}
                  onPress={() => advance(item)}
                >
                  {advancingId === item.id ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.actionBtnText}>{action}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, paddingTop: 60, backgroundColor: colors.gray50 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.gray500 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.gray500, marginBottom: spacing.lg },
  emptyList: { flexGrow: 1 },
  emptyCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: colors.gray500, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  step: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDest: { fontSize: 14, color: colors.gray700, marginBottom: 6 },
  cardItems: { fontSize: 12, color: colors.gray500, marginBottom: 8 },
  cardStatus: { fontSize: 12, fontWeight: '600', color: colors.secondary, marginBottom: spacing.md },
  actionBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionBtnText: { color: colors.white, fontWeight: '700' },
});
