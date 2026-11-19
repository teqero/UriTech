import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

function placeLabel(value: unknown): string {
  if (!value) return 'Luanda';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'address' in value) {
    const address = (value as { address?: string }).address;
    if (address) return address;
  }
  return JSON.stringify(value);
}

export function mapRide(row: Record<string, unknown>) {
  const pickupRaw = row.pickup as Record<string, unknown> | string | null;
  const destRaw = row.destination as Record<string, unknown> | string | null;
  const origin = row.origin as string | null;

  const pickup =
    typeof pickupRaw === 'object' && pickupRaw !== null
      ? pickupRaw
      : {
        latitude: -8.8383,
        longitude: 13.2344,
        address: origin ?? (typeof pickupRaw === 'string' ? pickupRaw : 'Origem'),
        city: 'Luanda',
        country: 'Angola',
      };

  const destination =
    typeof destRaw === 'object' && destRaw !== null
      ? destRaw
      : {
        latitude: -8.8583,
        longitude: 13.2312,
        address: typeof destRaw === 'string' ? destRaw : 'Destino',
        city: 'Luanda',
        country: 'Angola',
      };

  return {
    id: row.id,
    userId: row.user_id,
    driverId: row.driver_id ?? undefined,
    status: row.status,
    mode: row.mode,
    pickup,
    destination,
    fare: Number(row.fare ?? row.price ?? 0),
    distance: Number(row.distance ?? 5000),
    duration: Number(row.duration ?? 900),
    vehicleType: row.vehicle_type,
    createdAt: row.created_at,
  };
}

export async function handleRideRoutes(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string | null,
): Promise<{ status: number; body: unknown } | null> {
  const url = new URL(req.url);

  if (path === '/rides' && method === 'GET') {
    const status = url.searchParams.get('status');
    let q = supabase.from('rides').select('*').order('created_at', { ascending: false }).limit(50);
    if (status) q = q.eq('status', status);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    return { status: 200, body: (data ?? []).map(mapRide) };
  }

  if (path === '/rides' && method === 'POST') {
    const body = await req.json();
    let uid = userId ?? body.userId ?? null;
    if (!uid) {
      const { data: fallback } = await supabase.from('users').select('id').eq('email', 'joao@uritech.com').single();
      uid = fallback?.id ?? null;
    }
    if (!uid) return { status: 401, body: { message: 'Utilizador não autenticado' } };

    const pickup = body.pickup ?? { latitude: -8.8383, longitude: 13.2344, address: 'Origem', city: 'Luanda', country: 'Angola' };
    const destination = body.destination ?? { latitude: -8.8583, longitude: 13.2312, address: 'Destino', city: 'Luanda', country: 'Angola' };

    const row = {
      user_id: uid,
      status: 'searching',
      mode: body.mode ?? 'fixed',
      vehicle_type: body.vehicleType ?? body.vehicle_type ?? 'standard',
      pickup,
      destination,
      fare: body.fare ?? body.price ?? 0,
      distance: body.distance ?? 5000,
      duration: body.duration ?? 900,
    };

    const { data, error } = await supabase.from('rides').insert(row).select().single();
    if (error) throw error;
    return { status: 201, body: mapRide(data) };
  }

  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'rides' && parts[1]) {
    const id = parts[1];

    if (parts[2] === 'status' && method === 'PATCH') {
      const { status } = await req.json();
      const { data, error } = await supabase.from('rides').update({ status: String(status) }).eq('id', id).select().single();
      if (error || !data) return { status: 404, body: { message: 'Corrida não encontrada' } };
      return { status: 200, body: mapRide(data) };
    }

    if (!parts[2] && method === 'GET') {
      const { data, error } = await supabase.from('rides').select('*').eq('id', id).single();
      if (error) return { status: 404, body: { message: 'Corrida não encontrada' } };
      return { status: 200, body: mapRide(data) };
    }
  }

  return null;
}