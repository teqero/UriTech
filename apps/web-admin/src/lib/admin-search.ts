export interface AdminSearchItem {
  label: string;
  href: string;
  keywords: string[];
  section?: string;
}

export const ADMIN_SEARCH_INDEX: AdminSearchItem[] = [
  { label: 'Visão Geral', href: '/', keywords: ['dashboard', 'painel', 'inicio', 'home'], section: 'Menu' },
  { label: 'Pedidos', href: '/orders', keywords: ['pedido', 'order', 'entrega', 'transacao'], section: 'Menu' },
  { label: 'Motoristas', href: '/drivers', keywords: ['motorista', 'driver', 'taxi', 'carro', 'moto'], section: 'Menu' },
  { label: 'Comerciantes', href: '/vendors', keywords: ['comerciante', 'vendor', 'loja', 'restaurante'], section: 'Menu' },
  { label: 'Utilizadores', href: '/users', keywords: ['utilizador', 'usuario', 'user', 'conta'], section: 'Menu' },
  { label: 'Finanças', href: '/financas', keywords: ['financas', 'pagamento', 'multicaixa', 'gateway', 'receita'], section: 'Menu' },
  { label: 'Serviços', href: '/servicos', keywords: ['servico', 'catalogo', 'on-demand', 'modulo'], section: 'Menu' },
  { label: 'IA & Monitoramento', href: '/ia', keywords: ['ia', 'ai', 'fraude', 'surge', 'whatsapp'], section: 'Menu' },
  { label: 'Integrações API', href: '/settings/integracoes', keywords: ['integracao', 'api', 'webhook', 'stripe'], section: 'Configurações' },
  { label: 'Identidade Visual', href: '/settings/marca', keywords: ['marca', 'logo', 'white-label', 'cor'], section: 'Configurações' },
  { label: 'Configurações', href: '/settings', keywords: ['configuracao', 'settings', 'taxa', 'comissao'], section: 'Configurações' },
];

export function searchAdminRoutes(query: string): AdminSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ADMIN_SEARCH_INDEX.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q) || q.includes(k)),
  ).slice(0, 8);
}
