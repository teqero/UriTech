import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { walletPay } from './wallet.ts';

const DEFAULT_LOC = {
  latitude: -8.8383,
  longitude: 13.2344,
  address: 'Luanda',
  city: 'Luanda',
  country: 'Angola',
};

function mapOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    vendorId: row.vendor_id ?? undefined,
    driverId: row.driver_id ?? undefined,
    serviceType: row.service_type,
    status: row.status,
    items: row.items ?? [],
    total: Number(row.total),
    deliveryFee: Number(row.delivery_fee ?? 0),
    pickupLocation: row.pickup_location ?? DEFAULT_LOC,
    deliveryLocation: row.delivery_location ?? DEFAULT_LOC,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

async function insertOrder(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
) {
  const items = (body.items as unknown[]) ?? [];
  const total = Number(body.total ?? 0);
  const deliveryFee = Number(body.deliveryFee ?? body.delivery_fee ?? 0);
  const serviceType = String(body.serviceKey ?? body.serviceType ?? 'food');
  const destLabel = String(body.destinationLabel ?? body.storeName ?? 'Entrega UriGo');

  const row = {
    user_id: userId,
    service_type: serviceType,
    status: 'confirmed',
    items,
    total,
    delivery_fee: deliveryFee,
    pickup_location: DEFAULT_LOC,
    delivery_location: { ...DEFAULT_LOC, address: destLabel },
    updated_at: new Date().toISOString(),
  };

  if (body.payWithWallet !== false && total > 0) {
    await walletPay(supabase, userId, total + deliveryFee, `Pedido ${destLabel}`.slice(0, 80));
  }

  const { data, error } = await supabase.from('orders').insert(row).select().single();
  if (error) throw error;
  return mapOrder(data);
}

export async function handleOrderRoutes(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string | null,
): Promise<{ status: number; body: unknown } | null> {
  const url = new URL(req.url);

  if (path === '/orders/checkout' && method === 'POST') {
    if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };
    const body = await req.json();
    return { status: 201, body: await insertOrder(supabase, userId, body) };
  }

  if (path === '/orders/service-checkout' && method === 'POST') {
    if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };
    const body = await req.json();
    return { status: 201, body: await insertOrder(supabase, userId, body) };
  }

  if (path === '/orders' && method === 'GET') {
    const available = url.searchParams.get('available') === 'true';
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (userId) q = q.or(`user_id.eq.${userId},driver_id.eq.${userId}`);
    const { data, error } = await q;
    if (error) throw error;
    let rows = (data ?? []).map(mapOrder);
    if (available) rows = rows.filter((o) => o.status === 'ready' || o.status === 'confirmed');
    return { status: 200, body: rows };
  }

  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'orders' && parts[1]) {
    const id = parts[1];

    if (parts[2] === 'status' && method === 'PATCH') {
      if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };
      const { status } = await req.json();
      const { data, error } = await supabase
        .from('orders')
        .update({ status: String(status), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return { status: 404, body: { message: 'Pedido não encontrado' } };
      return { status: 200, body: mapOrder(data) };
    }

    if (!parts[2] && method === 'GET') {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error || !data) return { status: 404, body: { message: 'Pedido não encontrado' } };
      return { status: 200, body: mapOrder(data) };
    }
  }

  return null;
}