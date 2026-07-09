import type { Ride, RideStatus, TaxiMode, VehicleClass } from '@uritech/shared';
import { DEFAULT_ORIGIN } from '@uritech/shared';
import { apiFetch } from './api-fetch';

export interface CreateRideInput {
  mode: TaxiMode;
  pickup?: Location;
  destination: Location;
  fare: number;
  distance?: number;
  duration?: number;
  vehicleType: VehicleClass;
}

type Location = import('@uritech/shared').Location;

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

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const res = await apiFetch('/rides', {
    method: 'POST',
    body: JSON.stringify({
      mode: input.mode,
      pickup: input.pickup ?? DEFAULT_ORIGIN,
      destination: input.destination,
      fare: input.fare,
      distance: input.distance ?? 5000,
      duration: input.duration ?? 900,
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

export async function fetchSearchingRides(): Promise<Ride[]> {
  const res = await apiFetch('/rides?status=searching');
  if (!res.ok) return parseError(res, 'Não foi possível listar corridas');
  return res.json() as Promise<Ride[]>;
}

export async function updateRideStatus(
  id: string,
  status: RideStatus,
): Promise<Ride> {
  const res = await apiFetch(`/rides/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível actualizar a corrida');
  return res.json() as Promise<Ride>;
}

export async function acceptRide(id: string): Promise<Ride> {
  return updateRideStatus(id, 'driver_found');
}
