import type { Order, OrderStatus } from '@uritech/shared';
import { apiFetch } from './api-fetch';

export async function fetchOrder(id: string): Promise<Order | null> {
  const res = await apiFetch(`/orders/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<Order>;
}

export function isApiOrderId(ref?: string | null): boolean {
  if (!ref) return false;
  const clean = ref.replace(/^#/, '');
  if (/^URI-\d{5}$/i.test(clean)) return false;
  return clean.length > 10 && clean.includes('-');
}

export function orderStepIndex(status: OrderStatus): number {
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

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'PENDENTE',
    confirmed: 'CONFIRMADO',
    preparing: 'A PREPARAR',
    ready: 'PRONTO',
    picked_up: 'RECOLHIDO',
    in_transit: 'A CAMINHO',
    delivered: 'ENTREGUE',
    cancelled: 'CANCELADO',
  };
  return labels[status] ?? status.toUpperCase();
}

export function orderEtaHint(status: OrderStatus, service: string): string {
  if (status === 'pending' || status === 'confirmed') return 'Pedido confirmado — a processar';
  if (status === 'preparing') return 'O prestador está a preparar o seu pedido';
  if (status === 'ready' || status === 'picked_up' || status === 'in_transit') {
    return service === 'lojas' ? 'O estafeta está a caminho' : 'O prestador está a caminho';
  }
  if (status === 'delivered') return 'Pedido entregue';
  if (status === 'cancelled') return 'Pedido cancelado';
  return 'A acompanhar o seu pedido';
}
