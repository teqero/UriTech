import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import type { Order } from '@uritech/shared';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';
import { fetchAvailableDeliveries, fetchDeliveryOrders } from '../../lib/orders-api';
import { UriMap } from '../../components/UriMap';

export default function DeliveryHomeScreen() {
  const theme = useProfileTheme();
  const [available, setAvailable] = useState(true);
  const [pending, setPending] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!available) return;
    setLoading(true);
    try {
      const [open, mine] = await Promise.all([
        fetchAvailableDeliveries(),
        fetchDeliveryOrders(),
      ]);
      setPending(open);
      setActive(mine.filter((o) => o.driverId));
    } catch {
      setPending([]);
      setActive([]);
    } finally {
      setLoading(false);
    }
  }, [available]);

  useEffect(() => {
    load();
    if (!available) return;
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [available, load]);

  const next = pending[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={styles.status}>{available ? 'DISPONÍVEL' : 'INDISPONÍVEL'}</Text>
        <Text style={styles.earningsLabel}>Ganhos de Hoje</Text>
        <Text style={styles.earnings}>{formatCurrency(8650)}</Text>
        <TouchableOpacity
          style={[styles.toggle, { backgroundColor: available ? colors.primary : colors.gray500 }]}
          onPress={() => setAvailable(!available)}
        >
          <Text style={styles.toggleText}>{available ? 'Online' : 'Offline'}</Text>
        </TouchableOpacity>
      </View>

      {available && loading && pending.length === 0 && active.length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.headerBg} />
      ) : null}

      {available && next ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nova entrega disponível</Text>
          <Text style={styles.cardDesc}>
            {next.pickupLocation.address ?? 'Loja'} → {next.deliveryLocation.address ?? 'Cliente'} •{' '}
            {formatCurrency(next.total)}
          </Text>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() =>
              router.push({ pathname: '/delivery/delivery-request', params: { orderId: next.id } })
            }
          >
            <Text style={styles.acceptText}>VER ENTREGA</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {available && active.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {active.length} entrega{active.length !== 1 ? 's' : ''} em curso
          </Text>
          <Text style={styles.cardDesc}>
            {active[0].pickupLocation.address ?? 'Loja'} → {active[0].deliveryLocation.address ?? 'Cliente'}
          </Text>
        </View>
      ) : null}

      {available && !loading && !next && active.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sem entregas activas</Text>
          <Text style={styles.cardDesc}>Novos pedidos aparecem quando a loja marca como prontos.</Text>
        </View>
      ) : null}

      <View style={styles.mapArea}>
        {available ? (
          <UriMap
            flex
            showUserLocation
            origin={next?.pickupLocation ?? active[0]?.pickupLocation}
            destination={next?.deliveryLocation ?? active[0]?.deliveryLocation}
          />
        ) : (
          <Text style={styles.mapText}>Offline — active para receber entregas</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, padding: spacing.xl },
  status: { color: colors.white, fontWeight: '700', fontSize: 12, marginBottom: 8 },
  earningsLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  earnings: { color: colors.white, fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: spacing.lg },
  toggle: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toggleText: { color: colors.white, fontWeight: '700' },
  card: { margin: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: colors.gray500, marginTop: 4, marginBottom: spacing.md },
  acceptBtn: { backgroundColor: '#F06400', padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  acceptText: { color: colors.white, fontWeight: '700' },
  mapArea: { flex: 1, marginHorizontal: spacing.xl, marginBottom: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xl, overflow: 'hidden', minHeight: 200 },
  mapText: { color: colors.gray500, textAlign: 'center', paddingHorizontal: spacing.lg },
});
