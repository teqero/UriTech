'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapEmbed } from '@/components/MapEmbed';
import {
  DEFAULT_ORIGIN,
  SERVICE_LABELS,
  formatCurrency,
  formatPlaceLabel,
  previewDemoPlace,
  resolveDemoPlace,
} from '@uritech/shared';
import type { Ride } from '@uritech/shared';
import type { Order } from '@uritech/shared';
import {
  fetchRide,
  isApiRideId,
  rideEtaHint,
  rideStatusLabel,
  rideStepIndex,
} from '@/lib/rides-api';
import {
  fetchOrder,
  isApiOrderId,
  orderEtaHint,
  orderStatusLabel,
  orderStepIndex,
} from '@/lib/orders-api';
import styles from '../landing.module.css';
import trackingStyles from './tracking.module.css';

const STEPS = ['Pedido Confirmado', 'A Caminho', 'Entregue'];

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const destQuery = searchParams.get('dest') ?? '';
  const service = searchParams.get('service') ?? 'taxi';
  const refParam = searchParams.get('ref') ?? '#URI-98442';
  const cleanRef = refParam.replace(/^#/, '');

  const [ride, setRide] = useState<Ride | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const trackRide = service === 'taxi' && isApiRideId(cleanRef);
  const trackOrder = !trackRide && isApiOrderId(cleanRef);

  useEffect(() => {
    if (!trackRide) return;
    let active = true;
    const load = async () => {
      try {
        const data = await fetchRide(cleanRef);
        if (active && data) setRide(data);
      } catch {
        /* fallback estático */
      }
    };
    load();
    const timer = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [cleanRef, trackRide]);

  useEffect(() => {
    if (!trackOrder) return;
    let active = true;
    const load = async () => {
      try {
        const data = await fetchOrder(cleanRef);
        if (active && data) setOrder(data);
      } catch {
        /* fallback estático */
      }
    };
    load();
    const timer = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [cleanRef, trackOrder]);

  const destPlace = useMemo(() => {
    if (ride?.destination) return ride.destination;
    if (order?.deliveryLocation) return order.deliveryLocation;
    return destQuery ? resolveDemoPlace(destQuery) ?? previewDemoPlace(destQuery) : undefined;
  }, [destQuery, ride, order]);

  const pickup = ride?.pickup ?? order?.pickupLocation ?? DEFAULT_ORIGIN;
  const serviceLabel = SERVICE_LABELS[service] ?? SERVICE_LABELS[order?.serviceType ?? ''] ?? 'Pedido';
  const stepIndex = ride
    ? rideStepIndex(ride.status)
    : order
      ? Math.min(orderStepIndex(order.status), STEPS.length)
      : 1;
  const etaMin = ride ? Math.max(1, Math.round(ride.duration / 60)) : 12;
  const statusLabel = ride
    ? rideStatusLabel(ride.status)
    : order
      ? orderStatusLabel(order.status)
      : 'A CAMINHO';
  const etaHint = ride
    ? rideEtaHint(ride.status, service)
    : order
      ? orderEtaHint(order.status, service)
      : service === 'taxi'
        ? 'O motorista está a caminho'
        : 'O estafeta está a esta distância';
  const isComplete = ride?.status === 'completed' || order?.status === 'delivered';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>U</span>
          <span className={styles.logoText}>UriGo</span>
        </Link>
      </header>

      <div className={trackingStyles.layout}>
        <div className={trackingStyles.steps}>
          {STEPS.map((step, i) => (
            <div key={step} className={trackingStyles.step} style={{ opacity: i < stepIndex ? 1 : 0.4 }}>
              <div className={i < stepIndex ? trackingStyles.stepActive : trackingStyles.stepDot}>{i + 1}</div>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <MapEmbed
          origin={pickup}
          destination={destPlace}
          height={280}
          showUserLocation
        />

        {(destQuery || destPlace) && (
          <div className={trackingStyles.routeCard}>
            <div>
              <p className={trackingStyles.routeLabel}>Origem</p>
              <p className={trackingStyles.routeValue}>
                {pickup.address ?? formatPlaceLabel(DEFAULT_ORIGIN)}
              </p>
            </div>
            <div>
              <p className={trackingStyles.routeLabel}>Destino</p>
              <p className={trackingStyles.routeValue}>
                {destPlace?.address ?? destQuery}
              </p>
            </div>
          </div>
        )}

        <div className={trackingStyles.etaBlock}>
          <p className={trackingStyles.etaValue}>
            {isComplete ? 'Entregue ✓' : `${etaMin} Minutos`}
          </p>
          <p className={trackingStyles.etaHint}>{etaHint}</p>
        </div>

        {ride?.driverId ? (
          <div className={trackingStyles.driverCard}>
            <div className={trackingStyles.driverAvatar}>M</div>
            <div>
              <p className={trackingStyles.driverName}>Motorista UriGo</p>
              <p className={trackingStyles.driverMeta}>⭐ 4.9 • Veículo atribuído</p>
            </div>
          </div>
        ) : (
          <div className={trackingStyles.driverCard}>
            <div className={trackingStyles.driverAvatar}>C</div>
            <div>
              <p className={trackingStyles.driverName}>Carlos Manuel</p>
              <p className={trackingStyles.driverMeta}>⭐ 4.9 • Suzuki Any (LD-44-21)</p>
            </div>
          </div>
        )}

        <div className={trackingStyles.summary}>
          <h3>Detalhes do Pedido</h3>
          {[
            { label: 'Serviço', value: serviceLabel },
            { label: 'Referência', value: `#${cleanRef.slice(0, 12)}` },
            { label: 'Estado', value: statusLabel },
            ...(ride ? [{ label: 'Tarifa', value: formatCurrency(ride.fare) }] : []),
            ...(order ? [{ label: 'Total Pago', value: formatCurrency(order.total) }] : []),
            ...(!ride && !order ? [{ label: 'Total Pago', value: '5.200 Kz' }] : []),
          ].map((row) => (
            <div key={row.label} className={trackingStyles.summaryRow}>
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>

        <Link href="/profile" className={trackingStyles.secondaryBtn}>
          Ver Perfil
        </Link>
        <Link href="/" className={trackingStyles.primaryBtn}>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
