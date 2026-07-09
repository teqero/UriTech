import type { Ride, RideStatus, TaxiMode, VehicleClass } from '@uritech/shared';
import { DEFAULT_ORIGIN } from '@uritech/shared';
import { apiFetch } from './api-fetch';

async function parseError(res: Response, fallback: string): Promise<never> {
  let msg = fallback;
  try {
    const err = await res.json();
    if (err.message) msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
  } catch {
    /* ignore */
  }
  throw new Error(msg);
}

export async function createRide(input: {
  mode: TaxiMode;
  destination: import('@uritech/shared').Location;
  fare: number;
  vehicleType: VehicleClass;
}): Promise<Ride> {
  const res = await apiFetch('/rides', {
    method: 'POST',
    body: JSON.stringify({
      mode: input.mode,
      pickup: DEFAULT_ORIGIN,
      destination: input.destination,
      fare: input.fare,
      distance: 5000,
      duration: 900,
      vehicleType: input.vehicleType,
    }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível reservar a corrida');
  return res.json() as Promise<Ride>;
}

export async function fetchRide(id: string): Promise<Ride | null> {
  const res = await apiFetch(`/rides/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) return parseError(res, 'Corrida não encontrada');
  return res.json() as Promise<Ride>;
}

export function isApiRideId(ref?: string | null): boolean {
  if (!ref) return false;
  const clean = ref.replace(/^#/, '');
  return clean.length > 10 && clean.includes('-');
}

export function rideStepIndex(status: RideStatus): number {
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

export function rideStatusLabel(status: RideStatus): string {
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

export function rideEtaHint(status: RideStatus, service: string): string {
  if (status === 'searching') return 'A procurar motorista disponível';
  if (status === 'driver_found') return 'Motorista a preparar-se';
  if (status === 'cancelled') return 'Pedido cancelado';
  return service === 'taxi' ? 'O motorista está a caminho' : 'O estafeta está a esta distância';
}
