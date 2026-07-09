import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Order } from '@uritech/shared';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { acceptDeliveryOrder } from '../../lib/orders-api';
import { apiFetch } from '../../lib/api-fetch';

async function fetchOrder(id: string): Promise<Order | null> {
  const res = await apiFetch(`/orders/${id}`);
  if (!res.ok) return null;
  return res.json() as Promise<Order>;
}

export default function DeliveryRequestScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetchOrder(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleAccept = async () => {
    if (!orderId) return;
    setAccepting(true);
    try {
      await acceptDeliveryOrder(orderId);
      router.replace('/(delivery-tabs)/routes');
    } catch (e) {
      Alert.alert('Aceitar', e instanceof Error ? e.message : 'Não foi possível aceitar');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F06400" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.missing}>Entrega não encontrada.</Text>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => router.back()}>
          <Text style={styles.rejectText}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>ENTREGA LOJA</Text>
        <Text style={styles.fare}>{formatCurrency(order.total)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>RECOLHA</Text>
          <Text style={styles.locationValue}>{order.pickupLocation.address ?? 'Loja'}</Text>
        </View>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>ENTREGA</Text>
          <Text style={styles.locationValue}>{order.deliveryLocation.address ?? 'Cliente'}</Text>
        </View>

        <View style={styles.itemsCard}>
          <Text style={styles.itemsLabel}>ITENS</Text>
          <Text style={styles.itemsValue}>
            {order.items.map((i) => i.name).join(', ') || 'Pedido da loja'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.acceptBtn, accepting && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.acceptText}>ACEITAR ENTREGA</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => router.back()}>
          <Text style={styles.rejectText}>RECUSAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missing: { fontSize: 16, color: colors.gray500, marginBottom: spacing.lg },
  header: { backgroundColor: '#F06400', paddingTop: 60, paddingBottom: spacing.xl, alignItems: 'center' },
  badge: { color: colors.white, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  fare: { color: colors.white, fontSize: 36, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  locationCard: { padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  locationLabel: { fontSize: 11, color: colors.gray500, fontWeight: '700' },
  locationValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  itemsCard: { padding: spacing.lg, backgroundColor: colors.gray50, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  itemsLabel: { fontSize: 11, color: colors.gray500, fontWeight: '700' },
  itemsValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  acceptBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  btnDisabled: { opacity: 0.7 },
  acceptText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rejectBtn: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  rejectText: { color: colors.error, fontWeight: '700' },
});
