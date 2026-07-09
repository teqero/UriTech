import type { Order, OrderStatus } from '@uritech/shared';
import { apiFetch } from './api-fetch';
import type { VendorOrder, VendorOrderStatus } from './orders';

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

export async function fetchOrder(id: string): Promise<Order | null> {
  const res = await apiFetch(`/orders/${id}`, {}, null);
  if (!res.ok) return null;
  return res.json() as Promise<Order>;
}

export interface StoreCheckoutPayload {
  storeId: string;
  storeName: string;
  items: { name: string; quantity: number; price: number; menuItemId?: string }[];
  deliveryFee: number;
  total: number;
  payWithWallet?: boolean;
}

export async function createStoreOrder(payload: StoreCheckoutPayload): Promise<Order> {
  const res = await apiFetch('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res, 'Não foi possível confirmar o pedido');
  return res.json() as Promise<Order>;
}

export async function fetchRiderActiveOrders(): Promise<Order[]> {
  const res = await apiFetch('/orders');
  if (!res.ok) return parseError(res, 'Não foi possível carregar as rotas');
  const orders = (await res.json()) as Order[];
  return orders.filter((o) => o.status === 'picked_up' || o.status === 'in_transit');
}

export async function fetchVendorOrders(): Promise<Order[]> {
  const res = await apiFetch('/orders');
  if (!res.ok) return parseError(res, 'Não foi possível carregar pedidos');
  return res.json() as Promise<Order[]>;
}

export async function fetchDeliveryOrders(): Promise<Order[]> {
  const res = await apiFetch('/orders');
  if (!res.ok) return parseError(res, 'Não foi possível carregar entregas');
  const orders = (await res.json()) as Order[];
  return orders.filter((o) => o.status === 'ready' || o.status === 'picked_up' || o.status === 'in_transit');
}

export async function fetchAvailableDeliveries(): Promise<Order[]> {
  const res = await apiFetch('/orders?available=true');
  if (!res.ok) return parseError(res, 'Não foi possível carregar entregas disponíveis');
  return res.json() as Promise<Order[]>;
}

export async function acceptDeliveryOrder(id: string): Promise<Order> {
  const res = await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'picked_up' }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível aceitar a entrega');
  return res.json() as Promise<Order>;
}

export async function advanceDeliveryOrder(id: string, status: OrderStatus): Promise<Order> {
  const res = await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível actualizar a entrega');
  return res.json() as Promise<Order>;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível actualizar o pedido');
  return res.json() as Promise<Order>;
}

export function orderStatusToVendorTab(status: OrderStatus): VendorOrderStatus {
  if (status === 'pending' || status === 'confirmed') return 'novos';
  if (status === 'preparing') return 'preparando';
  if (status === 'ready' || status === 'picked_up') return 'prontos';
  return 'historico';
}

export function vendorActionToOrderStatus(tab: VendorOrderStatus): OrderStatus | null {
  if (tab === 'novos') return 'preparing';
  if (tab === 'preparando') return 'ready';
  if (tab === 'prontos') return 'delivered';
  return null;
}

export function mapApiOrderToVendor(order: Order): VendorOrder {
  const created = new Date(order.createdAt);
  const diffMin = Math.max(1, Math.round((Date.now() - created.getTime()) / 60000));
  const time =
    diffMin < 60
      ? `${diffMin} min atrás`
      : created.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });

  return {
    id: order.id.length > 12 ? `URI-${order.id.slice(0, 8).toUpperCase()}` : order.id,
    apiId: order.id,
    time,
    customer: 'Cliente UriGo',
    items: order.items.map((i) => i.name).join(', ') || 'Itens da loja',
    total: Number(order.total),
    status: orderStatusToVendorTab(order.status),
  };
}
