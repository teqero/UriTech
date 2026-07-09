export type VendorOrderStatus = 'novos' | 'preparando' | 'prontos' | 'historico';

export interface VendorOrder {
  id: string;
  time: string;
  customer: string;
  items: string;
  total: number;
  status: VendorOrderStatus;
}

export const VENDOR_ORDER_TABS: { key: VendorOrderStatus; label: string }[] = [
  { key: 'novos', label: 'Novos' },
  { key: 'preparando', label: 'Preparando' },
  { key: 'prontos', label: 'Prontos' },
  { key: 'historico', label: 'Histórico' },
];

export const INITIAL_VENDOR_ORDERS: VendorOrder[] = [
  { id: 'URI-98452', time: '10 min atrás', customer: 'Maria Júlia', items: 'Arroz Tio João (5kg), Óleo Fula (1L)', total: 4850, status: 'novos' },
  { id: 'URI-98451', time: '12 min atrás', customer: 'Pedro Santos', items: 'Leite Mimosa (6un), Pão', total: 2200, status: 'novos' },
  { id: 'URI-98450', time: '25 min atrás', customer: 'António Carlos', items: 'Frango Congelado (2kg)', total: 2100, status: 'novos' },
  { id: 'URI-98449', time: '30 min atrás', customer: 'Sandra Lopes', items: 'Água Pura (pack 12)', total: 1800, status: 'novos' },
  { id: 'URI-98448', time: '35 min atrás', customer: 'Ricardo M.', items: 'Cerveja Cuca, Snacks', total: 5600, status: 'preparando' },
  { id: 'URI-98447', time: '40 min atrás', customer: 'Ana Costa', items: 'Fraldas, Leite em pó', total: 8900, status: 'preparando' },
  { id: 'URI-98446', time: '50 min atrás', customer: 'João Pedro', items: 'Detergente, Esponjas', total: 3200, status: 'prontos' },
  { id: 'URI-98440', time: 'Ontem', customer: 'Carlos Neto', items: 'Carne, Legumes', total: 12500, status: 'historico' },
  { id: 'URI-98438', time: 'Ontem', customer: 'Elisa B.', items: 'Café, Açúcar', total: 4100, status: 'historico' },
];

export function countByStatus(orders: VendorOrder[], status: VendorOrderStatus): number {
  return orders.filter((o) => o.status === status).length;
}

export function nextStatus(current: VendorOrderStatus): VendorOrderStatus | null {
  if (current === 'novos') return 'preparando';
  if (current === 'preparando') return 'prontos';
  if (current === 'prontos') return 'historico';
  return null;
}

export function actionLabel(status: VendorOrderStatus): string {
  if (status === 'novos') return 'ACEITAR';
  if (status === 'preparando') return 'MARCAR PRONTO';
  if (status === 'prontos') return 'ENTREGUE';
  return '';
}
