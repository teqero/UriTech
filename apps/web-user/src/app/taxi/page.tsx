'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DestinationSearch } from '@/components/DestinationSearch';
import { MapEmbed } from '@/components/MapEmbed';
import {
  DEFAULT_ORIGIN,
  VEHICLE_OPTIONS,
  formatCurrency,
  formatPlaceLabel,
  previewDemoPlace,
  resolveDemoPlace,
} from '@uritech/shared';
import { createRide } from '@/lib/rides-api';
import { useAuth } from '@/components/AuthProvider';
import styles from '../landing.module.css';
import taxiStyles from './taxi.module.css';

export default function TaxiPage() {
  const router = useRouter();
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const initialDest = searchParams.get('dest') ?? '';
  const [destination, setDestination] = useState(initialDest);
  const [selectedVehicle, setSelectedVehicle] = useState('2');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const destPlace = useMemo(() => previewDemoPlace(destination), [destination]);
  const vehicle = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicle) ?? VEHICLE_OPTIONS[1];

  const handleConfirm = async () => {
    if (!destination.trim()) {
      setError('Indique o destino.');
      return;
    }
    if (!session) {
      router.push('/login');
      return;
    }

    const place = resolveDemoPlace(destination);
    const destLocation = place
      ? {
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.name,
          city: place.city,
          province: place.province,
          country: place.country,
        }
      : { latitude: -8.8383, longitude: 13.2344, address: destination, city: 'Luanda', country: 'Angola' };

    setBooking(true);
    setError('');
    try {
      const ride = await createRide({
        mode: 'fixed',
        destination: destLocation,
        fare: vehicle.price,
        vehicleType: vehicle.type,
      });
      router.push(
        `/tracking?service=taxi&dest=${encodeURIComponent(destination)}&ref=${encodeURIComponent(ride.id)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível reservar');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>U</span>
          <span className={styles.logoText}>UriGo</span>
        </Link>
      </header>

      <div className={taxiStyles.layout}>
        <MapEmbed destination={destPlace} height={240} showUserLocation />

        <h1 className={taxiStyles.title}>Reservar Viagem</h1>

        <div className={taxiStyles.locationCard}>
          <span className={taxiStyles.dotGreen} />
          <div>
            <p className={taxiStyles.locationLabel}>Origem</p>
            <p className={taxiStyles.locationValue}>{formatPlaceLabel(DEFAULT_ORIGIN)}</p>
          </div>
        </div>

        <div className={taxiStyles.locationCard}>
          <span className={taxiStyles.dotRed} />
          <div className={taxiStyles.destField}>
            <p className={taxiStyles.locationLabel}>Destino</p>
            <DestinationSearch
              variant="inline"
              mode="edit"
              initialValue={destination}
              onQueryChange={(q) => setDestination(q)}
            />
            {destination.trim() && (
              <p className={taxiStyles.destPreview}>
                {destPlace ? `📍 ${destPlace.name} · ${destPlace.district}` : `📍 ${destination}`}
              </p>
            )}
          </div>
        </div>

        <div className={taxiStyles.vehicles}>
          {VEHICLE_OPTIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={selectedVehicle === v.id ? taxiStyles.vehicleSelected : taxiStyles.vehicle}
              onClick={() => setSelectedVehicle(v.id)}
            >
              <span className={taxiStyles.vehicleIcon}>{v.icon}</span>
              <span className={taxiStyles.vehicleName}>{v.name}</span>
              <span className={taxiStyles.vehiclePrice}>{formatCurrency(v.price)}</span>
            </button>
          ))}
        </div>

        <p className={taxiStyles.schedule}>Agendar Viagem</p>

        <div className={taxiStyles.summary}>
          <div>
            <p className={taxiStyles.locationLabel}>Método de Pagamento</p>
            <p className={taxiStyles.locationValue}>UriPay Wallet</p>
          </div>
          <div className={taxiStyles.summaryRight}>
            <p className={taxiStyles.locationLabel}>Preço Estimado</p>
            <p className={taxiStyles.price}>{formatCurrency(vehicle.price)}</p>
          </div>
        </div>

        {error ? <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p> : null}

        <button
          type="button"
          className={taxiStyles.confirmBtn}
          onClick={handleConfirm}
          disabled={booking}
          style={{ border: 'none', cursor: booking ? 'wait' : 'pointer', width: '100%' }}
        >
          {booking ? 'A RESERVAR…' : `CONFIRMAR ${vehicle.name.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
