import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
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
import { fetchRide, updateRideStatus } from '../lib/rides-api';
import { useRideSocket } from '../lib/use-ride-socket';

function formatLocationLabel(loc: Location): string {
  return loc.address ?? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
}

const TAXI_STEPS = ['Pedido', 'Motorista', 'A caminho', 'Chegou', 'Viagem'];
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

/** Índice 0-based do passo activo (dot pintado até aqui inclusive) */
function rideStepIndex(status: RideStatus): number {
  switch (status) {
    case 'searching':
      return 0;
    case 'driver_found':
      return 1;
    case 'driver_arriving':
      return 2;
    case 'arrived':
      return 3;
    case 'in_progress':
    case 'completed':
      return 4;
    default:
      return 0;
  }
}

function rideStatusLabel(status: RideStatus): string {
  const labels: Record<RideStatus, string> = {
    searching: 'A PROCURAR MOTORISTA',
    driver_found: 'MOTORISTA ENCONTRADO',
    driver_arriving: 'MOTORISTA A CAMINHO',
    arrived: 'TAXI CHEGOU',
    in_progress: 'EM VIAGEM',
    completed: 'CONCLUÍDO',
    cancelled: 'CANCELADO',
  };
  return labels[status] ?? status.toUpperCase();
}

function rideEtaHint(status: RideStatus): string {
  if (status === 'searching') return 'A procurar motorista disponível';
  if (status === 'driver_found') return 'Motorista atribuído — a preparar a rota';
  if (status === 'driver_arriving') return 'Acompanhe a trajetória do taxi no mapa';
  if (status === 'arrived') return 'O taxi está no ponto de recolha';
  if (status === 'in_progress') return 'Viagem em curso até ao destino';
  if (status === 'completed') return 'Viagem concluída';
  if (status === 'cancelled') return 'Corrida cancelada';
  return 'A acompanhar a solicitação';
}

async function notifyTaxiArrivedLocally(rideId: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Taxi chegou!',
        body: 'O motorista está no ponto de recolha. Dirija-se ao veículo.',
        data: { type: 'ride', rideId, status: 'arrived' },
        sound: true,
      },
      trigger: null,
    });
  } catch {
    /* permissões ou web */
  }
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
  const [cancelling, setCancelling] = useState(false);
  const arrivedAlerted = useRef(false);

  const trackApi = shouldTrackApi(ref);
  const isLoja = service === 'lojas';
  const isTaxi = !isLoja;

  const { connected, ride: wsRide, driverLocation, driverTrail } = useRideSocket(
    isTaxi && trackApi && ref ? ref : null,
  );

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
        /* fallback UI */
      } finally {
        if (active) setPolling(false);
      }
    };

    load();
    const timer = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ref, trackApi, isLoja]);

  const currentRide = wsRide ?? ride;

  // Aviso de chegada: banner + vibração + notificação local
  useEffect(() => {
    if (!isTaxi || !currentRide || currentRide.status !== 'arrived') return;
    if (arrivedAlerted.current) return;
    arrivedAlerted.current = true;
    if (Platform.OS !== 'web') Vibration.vibrate([0, 400, 200, 400]);
    void notifyTaxiArrivedLocally(currentRide.id);
    Alert.alert('Taxi chegou!', 'O motorista está no ponto de recolha. Dirija-se ao veículo.');
  }, [isTaxi, currentRide?.id, currentRide?.status]);

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
  const etaMin = order
    ? 15
    : currentRide
      ? Math.max(1, Math.round(currentRide.duration / 60))
      : 12;
  const statusLabel = order
    ? orderStatusLabel(order.status)
    : currentRide
      ? rideStatusLabel(currentRide.status)
      : 'A CAMINHO';
  const etaHint = order
    ? orderEtaHint(order.status)
    : currentRide
      ? rideEtaHint(currentRide.status)
      : 'Motorista a caminho';

  const showDriverTrail =
    isTaxi &&
    !!currentRide &&
    (currentRide.status === 'driver_arriving' ||
      currentRide.status === 'arrived' ||
      currentRide.status === 'in_progress');

  const canCancel =
    isTaxi &&
    trackApi &&
    !!ref &&
    !!currentRide &&
    (currentRide.status === 'searching' ||
      currentRide.status === 'driver_found' ||
      currentRide.status === 'driver_arriving');

  const onCancel = () => {
    if (!ref) return;
    Alert.alert('Cancelar corrida', 'Tem a certeza que deseja cancelar?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await updateRideStatus(ref, 'cancelled');
            const data = await fetchRide(ref);
            if (data) setRide(data);
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível cancelar');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rastreamento</Text>
        {polling ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <View style={{ width: 24 }} />
        )}
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

        {isTaxi && currentRide?.status === 'arrived' && (
          <View style={styles.arrivalBanner}>
            <Ionicons name="car-sport" size={22} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.arrivalTitle}>Taxi chegou!</Text>
              <Text style={styles.arrivalBody}>Dirija-se ao ponto de recolha.</Text>
            </View>
          </View>
        )}

        {isTaxi && (
          <View style={styles.wsBadge}>
            <Ionicons
              name={connected ? 'radio' : 'radio-button-off'}
              size={12}
              color={connected ? '#2E7D32' : colors.gray500}
            />
            <Text style={[styles.wsText, { color: connected ? '#2E7D32' : colors.gray500 }]}>
              {connected ? 'Em tempo real' : 'A sincronizar…'}
              {driverTrail.length > 1 ? ` · ${driverTrail.length} pts rota` : ''}
            </Text>
          </View>
        )}

        <UriMap
          destinationLabel={dest ?? destination?.address ?? ''}
          origin={pickup}
          destination={
            currentRide?.status === 'in_progress' || currentRide?.status === 'completed'
              ? destination
              : undefined
          }
          height={240}
          showUserLocation
          markers={
            driverLocation
              ? [
                  {
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                    title: 'Taxi',
                    pinColor: '#1A73E8',
                  },
                ]
              : []
          }
          trailCoordinates={showDriverTrail ? driverTrail : []}
          showDriverToPickup={
            showDriverTrail &&
            (currentRide?.status === 'driver_arriving' || currentRide?.status === 'arrived')
          }
        />

        {(dest || destination) && (
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={styles.routeLabel}>Recolha</Text>
                <Text style={styles.routeValue}>{formatLocationLabel(pickup)}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
              <View>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeValue}>
                  {destination?.address ?? (destPlace ? formatPlaceLabel(destPlace) : dest)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.etaCard}>
          <Text style={styles.etaValue}>
            {currentRide?.status === 'arrived'
              ? '●'
              : order?.status === 'delivered' || currentRide?.status === 'completed'
                ? '✓'
                : `${etaMin} min`}
          </Text>
          <Text style={styles.etaHint}>{etaHint}</Text>
          <Text style={styles.statusPill}>{statusLabel}</Text>
        </View>

        {(currentRide?.driverId || order?.driverId) && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>M</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{order ? 'Entregador UriGo' : 'Motorista UriGo'}</Text>
              <Text style={styles.driverMeta}>
                ⭐ 4.9 •{' '}
                {currentRide?.status === 'arrived'
                  ? 'À espera no local'
                  : currentRide?.status === 'driver_arriving'
                    ? 'A caminho da recolha'
                    : order
                      ? 'Entrega activa'
                      : 'Veículo atribuído'}
              </Text>
              {driverLocation && (
                <Text style={styles.driverGps}>
                  GPS {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Detalhes da solicitação</Text>
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

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && styles.btnDisabled]}
            onPress={onCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.cancelBtnText}>Cancelar solicitação</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/activity')}>
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
  stepLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  stepLabelMuted: { color: colors.gray500 },
  arrivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2E7D32',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  arrivalTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  arrivalBody: { color: colors.white, fontSize: 13, marginTop: 2, opacity: 0.95 },
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
  etaHint: { fontSize: 14, color: colors.gray500, marginTop: 4, textAlign: 'center' },
  statusPill: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
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
  driverGps: { fontSize: 11, color: colors.gray500, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
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
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cancelBtnText: { color: colors.error, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.7 },
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
