import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_ORIGIN,
  SERVICE_LABELS,
  colors,
  spacing,
  borderRadius,
  formatPlaceLabel,
  previewDemoPlace,
  resolveDemoPlace,
} from '@uritech/shared';
import type { Order, OrderStatus, Ride, RideStatus, Location } from '@uritech/shared';
import { UriMap } from '../components/UriMap';
import { fetchOrder } from '../lib/orders-api';
import { fetchRide } from '../lib/rides-api';
import { useRideSocket } from '../lib/use-ride-socket';

function formatLocationLabel(loc: Location): string {
  return loc.address ?? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
}

const TAXI_STEPS = ['Confirmado', 'A Caminho', 'Entregue'];
const LOJA_STEPS = ['Confirmado', 'Preparando', 'A Caminho', 'Entregue'];

function shouldTrackApi(ref?: string): boolean {
  if (!ref) return false;
  if (/^URI-\d{5}$/i.test(ref)) return false;
  return true;
}

function orderStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 1;
    case 'preparing':
      return 2;
    case 'ready':
    case 'picked_up':
      return 3;
    case 'in_transit':
      return 4;
    case 'delivered':
      return 5;
    default:
      return 1;
  }
}

function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'PEDIDO RECEBIDO',
    confirmed: 'CONFIRMADO',
    preparing: 'A PREPARAR',
    ready: 'PRONTO PARA ENTREGA',
    picked_up: 'RECOLHIDO',
    in_transit: 'A CAMINHO',
    delivered: 'ENTREGUE',
    cancelled: 'CANCELADO',
  };
  return labels[status] ?? status.toUpperCase();
}

function orderEtaHint(status: OrderStatus): string {
  if (status === 'pending' || status === 'confirmed') return 'Loja a confirmar o pedido';
  if (status === 'preparing') return 'Loja a preparar a encomenda';
  if (status === 'ready') return 'À espera do entregador';
  if (status === 'picked_up' || status === 'in_transit') return 'Entregador a caminho';
  if (status === 'delivered') return 'Pedido entregue';
  return 'A acompanhar pedido';
}

function rideStepIndex(status: RideStatus): number {
  switch (status) {
    case 'searching':
      return 0;
    case 'driver_found':
      return 1;
    case 'driver_arriving':
    case 'in_progress':
      return 2;
    case 'completed':
      return 3;
    default:
      return 0;
  }
}

function rideStatusLabel(status: RideStatus): string {
  const labels: Record<RideStatus, string> = {
    searching: 'A PROCURAR MOTORISTA',
    driver_found: 'MOTORISTA ENCONTRADO',
    driver_arriving: 'MOTORISTA A CAMINHO',
    in_progress: 'EM CURSO',
    completed: 'CONCLUÍDO',
    cancelled: 'CANCELADO',
  };
  return labels[status] ?? status.toUpperCase();
}

function rideEtaHint(status: RideStatus): string {
  if (status === 'searching') return 'A procurar motorista disponível';
  if (status === 'driver_found') return 'Motorista a preparar-se';
  if (status === 'cancelled') return 'Corrida cancelada';
  return 'Motorista a caminho';
}

export default function RastreamentoScreen() {
  const { dest, service, ref } = useLocalSearchParams<{
    dest?: string;
    service?: string;
    ref?: string;
  }>();

  const [ride, setRide] = useState<Ride | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [polling, setPolling] = useState(false);

  const trackApi = shouldTrackApi(ref);
  const isLoja = service === 'lojas';
  const isTaxi = !isLoja;

  // WebSocket para corridas em tempo real
  const { connected, ride: wsRide, driverLocation } = useRideSocket(
    isTaxi && trackApi && ref ? ref : null,
  );

  // Polling REST para dados iniciais e fallback
  useEffect(() => {
    if (!trackApi || !ref) return;

    let active = true;
    const load = async () => {
      setPolling(true);
      try {
        if (isLoja) {
          const data = await fetchOrder(ref);
          if (active && data) setOrder(data);
        } else {
          const data = await fetchRide(ref);
          if (active && data) setRide(data);
        }
      } catch {
        /* fallback to static UI */
      } finally {
        if (active) setPolling(false);
      }
    };

    load();
    const timer = setInterval(load, 8000); // polling mais lento — WebSocket é primário
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ref, trackApi, isLoja]);

  // Merge dados WebSocket com dados REST
  const currentRide = wsRide ?? ride;

  const destPlace = useMemo(
    () => (dest ? resolveDemoPlace(dest) ?? previewDemoPlace(dest) : undefined),
    [dest],
  );

  const pickup = order?.pickupLocation ?? currentRide?.pickup ?? DEFAULT_ORIGIN;
  const destination = order?.deliveryLocation ?? currentRide?.destination;
  const serviceLabel = SERVICE_LABELS[service ?? 'taxi'] ?? 'Pedido';
  const orderRef = ref ?? 'URI-98442';
  const steps = isLoja ? LOJA_STEPS : TAXI_STEPS;
  const stepIndex = order
    ? orderStepIndex(order.status)
    : currentRide
      ? rideStepIndex(currentRide.status) + 1
      : 1;
  const etaMin = order ? 15 : currentRide ? Math.max(1, Math.round(currentRide.duration / 60)) : 12;
  const statusLabel = order
    ? orderStatusLabel(order.status)
    : currentRide
      ? rideStatusLabel(currentRide.status)
      : 'A CAMINHO';
  const etaHint = order ? orderEtaHint(order.status) : currentRide ? rideEtaHint(currentRide.status) : 'Motorista a caminho';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rastreamento</Text>
        {polling ? <ActivityIndicator size="small" color={colors.white} /> : <View style={{ width: 24 }} />}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepDot, i < stepIndex && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i < stepIndex && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i >= stepIndex && styles.stepLabelMuted]}>{step}</Text>
            </View>
          ))}
        </View>

        {isTaxi && (
          <View style={styles.wsBadge}>
            <Ionicons name={connected ? 'radio' : 'radio-button-off'} size={12} color={connected ? '#2E7D32' : colors.gray500} />
            <Text style={[styles.wsText, { color: connected ? '#2E7D32' : colors.gray500 }]}>
              {connected ? 'Em tempo real' : 'A sincronizar…'}
            </Text>
          </View>
        )}

        <UriMap
          destinationLabel={dest ?? destination?.address ?? ''}
          origin={pickup}
          destination={destination}
          height={220}
          showUserLocation
          markers={driverLocation ? [{ latitude: driverLocation.latitude, longitude: driverLocation.longitude, title: 'Motorista', pinColor: '#1A73E8' }] : []}
        />

        {(dest || destination) && (
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={styles.routeLabel}>Origem</Text>
                <Text style={styles.routeValue}>{formatLocationLabel(pickup)}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
              <View>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeValue}>
                  {destination?.address ??
                    (destPlace ? formatPlaceLabel(destPlace) : dest)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.etaCard}>
          <Text style={styles.etaValue}>
            {(order?.status === 'delivered' || currentRide?.status === 'completed') ? '✓' : `${etaMin} min`}
          </Text>
          <Text style={styles.etaHint}>{etaHint}</Text>
        </View>

        {(currentRide?.driverId || order?.driverId) && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>M</Text>
            </View>
            <View>
              <Text style={styles.driverName}>{order ? 'Entregador UriGo' : 'Motorista UriGo'}</Text>
              <Text style={styles.driverMeta}>⭐ 4.9 • {order ? 'Entrega activa' : 'Veículo atribuído'}</Text>
            </View>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Detalhes</Text>
          {[
            { label: 'Serviço', value: serviceLabel },
            { label: 'Referência', value: `#${orderRef.replace(/^#/, '').slice(0, 12)}` },
            { label: 'Estado', value: statusLabel },
            ...(order
              ? [{ label: 'Total', value: `${order.total.toLocaleString('pt-AO')} Kz` }]
              : currentRide
                ? [{ label: 'Tarifa', value: `${currentRide.fare.toLocaleString('pt-AO')} Kz` }]
                : []),
          ].map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(tabs)/activity')}
        >
          <Text style={styles.primaryBtnText}>Ver Atividade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryBtnText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: colors.gray500 },
  stepNumActive: { color: colors.white },
  stepLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  stepLabelMuted: { color: colors.gray500 },
  wsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  wsText: { fontSize: 11, fontWeight: '600' },
  routeCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeLabel: { fontSize: 11, color: colors.gray500 },
  routeValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  etaCard: { alignItems: 'center', marginVertical: spacing.xl },
  etaValue: { fontSize: 40, fontWeight: '700', color: colors.primary },
  etaHint: { fontSize: 14, color: colors.gray500, marginTop: 4 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: { color: colors.white, fontSize: 20, fontWeight: '700' },
  driverName: { fontSize: 16, fontWeight: '700' },
  driverMeta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  summary: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  summaryLabel: { fontSize: 13, color: colors.gray500 },
  summaryValue: { fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  secondaryBtnText: { color: colors.gray700, fontWeight: '600' },
});
