import type { Service, ServiceType, OnboardingSlide, PaymentMethod, Store, VehicleOption } from './types';
import { colors } from './theme';

export const APP_NAME = 'UriGo';
export const APP_TAGLINE = 'A sua cidade na palma da mão';
export const DEFAULT_CITY = 'Luanda';
export const DEFAULT_COUNTRY = 'Angola';
export const DEFAULT_PROVINCE = 'Luanda';
export const PHONE_PREFIX = '+244';
export const CURRENCY = 'AOA';
export const CURRENCY_SYMBOL = 'Kz';

export const COUNTRIES = [
  'Angola',
  'Portugal',
  'Brasil',
  'Moçambique',
  'Cabo Verde',
  'Guiné-Bissau',
  'São Tomé e Príncipe',
  'Namíbia',
  'África do Sul',
];

export const CURRENCY_OPTIONS = [
  { symbol: 'Kz', code: 'AOA', label: 'Kwanza angolano (Kz)' },
  { symbol: '€', code: 'EUR', label: 'Euro (€)' },
  { symbol: 'R$', code: 'BRL', label: 'Real brasileiro (R$)' },
  { symbol: '$', code: 'USD', label: 'Dólar americano ($)' },
  { symbol: 'MT', code: 'MZN', label: 'Metical moçambicano (MT)' },
  { symbol: 'CVE', code: 'CVE', label: 'Escudo cabo-verdiano (CVE)' },
];

export const HOMEPAGE_SERVICES = ['taxi', 'envio', 'lojas', 'servicos', 'medico', 'beleza', 'uriprova'] as const;

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Táxi Rápido e Seguro em Angola',
    subtitle: 'Escolha entre preço fixo ou licite a sua corrida com motoristas profissionais.',
  },
  {
    id: '2',
    title: 'Tudo Entregue em Minutos',
    subtitle: 'Compras de supermercado, farmácia, flores e muito mais à distância de um toque.',
  },
  {
    id: '3',
    title: 'Pague com Segurança',
    subtitle: 'Multicaixa Express, Pagasam, Unitel Money, BAI Direto e PayPal. Tudo integrado.',
  },
];

export const SERVICES: Service[] = [
  { id: '1', type: 'taxi', name: 'Taxi', icon: '🚕', color: colors.ride, description: 'Transporte rápido e seguro', route: '/taxi' },
  { id: '2', type: 'envio', name: 'Envio', icon: '📦', color: colors.send, description: 'Envio de encomendas', route: '/envio' },
  { id: '3', type: 'lojas', name: 'Lojas', icon: '🛒', color: colors.mart, description: 'Lojas e entregas', route: '/lojas' },
  { id: '4', type: 'servicos', name: 'Serviços', icon: '🔧', color: colors.bills, description: 'Serviços sob demanda', route: '/servicos' },
  { id: '5', type: 'medico', name: 'Médico', icon: '🏥', color: colors.health, description: 'Consultas e saúde', route: '/medico' },
  { id: '6', type: 'beleza', name: 'Beleza', icon: '💇', color: '#E91E8C', description: 'Beleza e cuidados', route: '/beleza' },
  { id: '7', type: 'imoveis', name: 'Imóveis', icon: '🏠', color: '#6C63FF', description: 'Marketplace imóveis', route: '/marketplace?tab=imoveis' },
  { id: '8', type: 'carros', name: 'Carros', icon: '🚗', color: '#1A73E8', description: 'Compra e venda de carros', route: '/marketplace?tab=carros' },
  { id: '9', type: 'petcare', name: 'Pet Care', icon: '🐾', color: '#FF6B6B', description: 'Cuidados para pets', route: '/beleza?tab=pet' },
  { id: '10', type: 'partilha', name: 'Partilha', icon: '👥', color: colors.secondary, description: 'Partilha de viagem', route: '/partilha' },
  { id: '11', type: 'genie', name: 'Genie', icon: '✨', color: colors.mart, description: 'Assistente de compras', route: '/genie' },
  {
    id: '12',
    type: 'securepay',
    name: 'SecurePay',
    icon: '🔒',
    color: '#6C63FF',
    description: 'Pagar com Segurança',
    route: '/securepay',
    featured: true,
  },
  {
    id: '13',
    type: 'uriprova',
    name: 'UriProva',
    icon: '📋',
    color: '#0D47A1',
    description: 'Evidências de sinistro certificadas',
    route: '/uriprova',
    featured: true,
  },
];

export const PROMO_BANNERS = [
  {
    id: '1',
    title: 'Desconto no Taxi',
    subtitle: 'Use o código TAXI24 para 20% off',
    backgroundColor: colors.primary,
  },
  {
    id: '2',
    title: '40% de desconto',
    subtitle: 'Em farmácias selecionadas esta semana',
    backgroundColor: colors.health,
  },
];

export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: '1', type: 'moto', name: 'Moto', icon: '🏍️', price: 800, eta: '5 min' },
  { id: '2', type: 'standard', name: 'Standard', icon: '🚗', price: 1500, eta: '8 min' },
  { id: '3', type: 'premium', name: 'Premium', icon: '🚙', price: 2800, eta: '10 min' },
  { id: '4', type: 'tuktuk', name: 'Tuk-tuk', icon: '🛺', price: 1000, eta: '7 min' },
];

export const INTERCITY_CLASSES: VehicleOption[] = [
  { id: '1', type: 'standard', name: 'Standard', icon: '🚗', price: 15000, capacity: 4 },
  { id: '2', type: 'premium', name: 'Premium', icon: '🚙', price: 25000, capacity: 4 },
  { id: '3', type: 'van', name: 'Van', icon: '🚐', price: 45000, capacity: 7 },
  { id: '4', type: 'minibus', name: 'Minibus', icon: '🚌', price: 80000, capacity: 14 },
];

export const NEARBY_STORES: Store[] = [
  { id: '1', name: 'Supermercado Kilamba', category: 'supermercado', rating: 4.8, deliveryTime: '15-25 min', deliveryFee: 500 },
  { id: '2', name: 'Farmácia Luanda', category: 'farmacia', rating: 4.6, deliveryTime: '10-20 min', deliveryFee: 200 },
  { id: '3', name: 'Flores de Angola', category: 'flores', rating: 4.9, deliveryTime: '40-50 min', deliveryFee: 800 },
  { id: '4', name: 'Água Pura', category: 'agua', rating: 4.5, deliveryTime: '15-25 min', deliveryFee: 300 },
];

/** Email do vendedor UriGo associado a cada loja (demo + produção). */
export const STORE_VENDOR_EMAIL: Record<string, string> = {
  '1': 'warung@uritech.com',
  '2': 'warung@uritech.com',
  '3': 'warung@uritech.com',
  '4': 'warung@uritech.com',
};

export const STORE_PICKUP_LOCATIONS: Record<string, { latitude: number; longitude: number; address: string }> = {
  '1': { latitude: -8.918, longitude: 13.303, address: 'Supermercado Kilamba, Talatona' },
  '2': { latitude: -8.916, longitude: 13.31, address: 'Farmácia Luanda, Talatona' },
  '3': { latitude: -8.92, longitude: 13.305, address: 'Flores de Angola, Talatona' },
  '4': { latitude: -8.917, longitude: 13.308, address: 'Água Pura, Talatona' },
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: '1', type: 'wallet', label: 'UriPay Wallet', isDefault: true },
  { id: '2', type: 'multicaixa', label: 'Multicaixa Express', isDefault: false },
  { id: '3', type: 'pagasam', label: 'Pagasam', isDefault: false },
  { id: '4', type: 'unitel_money', label: 'Unitel Money', isDefault: false },
  { id: '5', type: 'bai_direto', label: 'BAI Direto', isDefault: false },
  { id: '6', type: 'paypal', label: 'PayPal', isDefault: false },
  { id: '7', type: 'card', label: 'Visa / Mastercard', isDefault: false },
  { id: '8', type: 'cash', label: 'Dinheiro', isDefault: false },
];

export const ON_DEMAND_SERVICES_LEGACY = [
  { id: '1', name: 'DJ', category: 'Entretenimento', providersCount: 12, priceFrom: 15000 },
  { id: '2', name: 'Segurança', category: 'Segurança', providersCount: 45, priceFrom: 8000 },
  { id: '3', name: 'Fisioterapeuta', category: 'Saúde', providersCount: 8, priceFrom: 12500 },
  { id: '4', name: 'Técnico Móvel', category: 'Tecnologia', providersCount: 28, priceFrom: 3500 },
  { id: '5', name: 'Babysitter', category: 'Cuidados', providersCount: 15, priceFrom: 4500 },
  { id: '6', name: 'Empregada', category: 'Doméstico', providersCount: 60, priceFrom: 2500 },
  { id: '7', name: 'Limpeza', category: 'Doméstico', providersCount: 34, priceFrom: 3000 },
  { id: '8', name: 'Eletricista', category: 'Reparações', providersCount: 19, priceFrom: 5000 },
  { id: '9', name: 'Canalizador', category: 'Reparações', providersCount: 22, priceFrom: 5000 },
  { id: '10', name: 'Pintor', category: 'Reparações', providersCount: 14, priceFrom: 6000 },
  { id: '11', name: 'Mecânico', category: 'Automóvel', providersCount: 41, priceFrom: 7500 },
  { id: '12', name: 'Fotógrafo', category: 'Entretenimento', providersCount: 18, priceFrom: 10000 },
];

/** @deprecated use ON_DEMAND_SERVICES from catalog.ts */
export { ON_DEMAND_SERVICES, getEnabledOnDemandServices } from './catalog';

export const FAMILY_MEMBERS = [
  { name: 'Ana Silva', status: 'Agora', battery: 84, distance: '200m' },
  { name: 'João Pedro', status: 'há 5 min', battery: 12, distance: '1.2km' },
  { name: 'Carlos', status: 'há 20 min', battery: 95, distance: '5.6km' },
];

export const NEARBY_BUSINESSES = [
  { name: 'Puru - Café & Bistro', category: 'Cafés', distance: '450m', rating: 4.9, open: true },
  { name: 'Studio 24 Beleza', category: 'Salões', distance: '1.2km', rating: 4.7, open: false },
  { name: 'Grelha do Zango', category: 'Restaurantes', distance: '800m', rating: 4.5, open: true },
];

export const CAR_CARE_SERVICES = [
  { name: 'Lavagem Carro', price: 2500, duration: '45 min', icon: '🚗' },
  { name: 'Lavagem Moto', price: 1500, duration: '30 min', icon: '🏍️' },
  { name: 'Arranque Bateria', price: 4000, duration: '15 min', icon: '🔋' },
  { name: 'Abastecimento', price: 0, duration: '20 min', icon: '⛽' },
  { name: 'Troca de Óleo', price: 8500, duration: '60 min', icon: '🛢️' },
  { name: 'Carreg. Elétrico', price: 5000, duration: '40 min', icon: '⚡' },
  { name: 'Assis. Pneu', price: 3500, duration: '20 min', icon: '🛞' },
  { name: 'Destrancar', price: 6000, duration: '15 min', icon: '🔑' },
];

export const ROADSIDE_PROBLEMS = [
  { id: 'tire', label: 'Pneu Furado', icon: '🛞' },
  { id: 'fuel', label: 'Sem Combustível', icon: '⛽' },
  { id: 'locked', label: 'Bloqueado', icon: '🔒' },
  { id: 'tow', label: 'Reboque Emerg.', icon: '🚛' },
  { id: 'platform', label: 'Plataforma', icon: '📦' },
  { id: 'recovery', label: 'Recuperação', icon: '🔧' },
];

export const NOTIFICATIONS = [
  { id: '1', title: 'Corrida Confirmada', message: 'O motorista João Pedro está a caminho.', time: '2 min ago', group: 'today' },
  { id: '2', title: 'Pagamento Escrow Libertado', message: 'O valor de 45.000 Kz foi creditado no seu saldo.', time: '1h ago', group: 'today' },
  { id: '3', title: 'Promoção 20% Desconto', message: 'Use o código GOFOOD24 no seu próximo pedido.', time: 'Ontem', group: 'earlier' },
  { id: '4', title: 'Entregador a Caminho', message: 'Sua encomenda da Loja Kilamba saiu para entrega.', time: '2 dias ago', group: 'earlier' },
];

export const ESCROW_TRANSACTIONS = [
  { id: '1', product: 'iPhone 15 Pro', role: 'Comprador', amount: 1200000, status: 'EM TRÂNSITO' },
  { id: '2', product: 'Sapatos Nike', role: 'Vendedor', amount: 45000, status: 'CONFIRMADO' },
  { id: '3', product: 'Tablet Samsung', role: 'Comprador', amount: 150000, status: 'DEPOSITADO' },
];

export const WALLET_TRANSACTIONS = [
  { id: '1', desc: 'Corrida - Centro', date: 'Hoje, 14:20', amount: -1200 },
  { id: '2', desc: 'Liberação Escrow', date: 'Ontem, 09:15', amount: 45000 },
  { id: '3', desc: 'GoFood - Pizza Hut', date: '22 Mai, 18:30', amount: -5400 },
];

export const ADMIN_MODULES = [
  { id: 'taxi', name: 'UriTaxi', users: '12k', revenue: '14.2M Kz' },
  { id: 'moto', name: 'UriMoto', users: '8.4k', revenue: '5.6M Kz' },
  { id: 'envio', name: 'UriEnvio', users: '4.5k', revenue: '2.1M Kz' },
  { id: 'lojas', name: 'UriLojas', users: '2.1k', revenue: '8.4M Kz' },
  { id: 'med', name: 'UriMed', users: '150', revenue: '450k Kz' },
  { id: 'beleza', name: 'UriBeleza', users: '80', revenue: '120k Kz' },
];

export const ANGOLA_PROVINCES = [
  'Luanda', 'Benguela', 'Huíla', 'Huambo', 'Cabinda', 'Cuanza Norte',
  'Cuanza Sul', 'Cunene', 'Lunda Norte', 'Lunda Sul', 'Malanje',
  'Moxico', 'Namibe', 'Uíge', 'Zaire', 'Bengo', 'Bié', 'Cuando Cubango',
];

export function getServiceByType(type: ServiceType): Service | undefined {
  return SERVICES.find((s) => s.type === type);
}

export function formatCurrency(value: number): string {
  return `${value.toLocaleString('pt-AO')} ${CURRENCY_SYMBOL}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

export const DEFAULT_API_INTEGRATIONS = [
  { provider: 'multicaixa', name: 'Multicaixa Express', type: 'payment' as const },
  { provider: 'pagasam', name: 'Pagasam', type: 'payment' as const },
  { provider: 'unitel_money', name: 'Unitel Money', type: 'payment' as const },
  { provider: 'bai_direto', name: 'BAI Direto', type: 'payment' as const },
  { provider: 'paypal', name: 'PayPal', type: 'payment' as const },
  { provider: 'stripe', name: 'Visa / Mastercard (Stripe)', type: 'payment' as const },
  { provider: 'google_maps', name: 'Google Maps', type: 'maps' as const },
  { provider: 'twilio', name: 'Twilio SMS', type: 'sms' as const },
  { provider: 'sendgrid', name: 'SendGrid Email', type: 'email' as const },
  { provider: 'firebase', name: 'Firebase Push', type: 'push' as const },
  { provider: 'mixpanel', name: 'Mixpanel Analytics', type: 'analytics' as const },
];

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';
