/**
 * Configuração central de perfis UriGo.
 * Toda a navegação, tema e permissões derivam deste módulo.
 */

export type AppProfileId =
  | 'customer'
  | 'driver'
  | 'delivery_rider'
  | 'vendor'
  | 'restaurant'
  | 'pharmacy'
  | 'supermarket'
  | 'store'
  | 'service_provider'
  | 'corporate'
  | 'admin';

export type VendorSubtype = 'restaurant' | 'pharmacy' | 'supermarket' | 'store' | 'generic';

export interface ProfileTheme {
  primary: string;
  primaryLight?: string;
  accent: string;
  headerBg: string;
  tabBarActive: string;
  label: string;
}

export interface ProfileNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  mobileRoute?: string;
}

export interface ProfileConfig {
  id: AppProfileId;
  label: string;
  description: string;
  theme: ProfileTheme;
  permissions: string[];
  modules: string[];
  mobile: {
    homeRoute: string;
    tabGroup: string;
    stackRoutes: string[];
  };
  web: {
    homeRoute: string;
    layout: 'customer' | 'driver' | 'vendor' | 'delivery' | 'admin' | 'corporate';
    nav: ProfileNavItem[];
  };
  /** Tipos de vendor que usam este perfil */
  vendorSubtypes?: VendorSubtype[];
}

const CUSTOMER_NAV: ProfileNavItem[] = [
  { id: 'home', label: 'Início', href: '/', icon: 'home', mobileRoute: '/(tabs)' },
  { id: 'activity', label: 'Atividade', href: '/tracking', icon: 'list', mobileRoute: '/(tabs)/activity' },
  { id: 'payment', label: 'Pagamento', href: '/profile', icon: 'wallet', mobileRoute: '/(tabs)/payment' },
  { id: 'profile', label: 'Perfil', href: '/profile', icon: 'person', mobileRoute: '/(tabs)/profile' },
];

const DRIVER_NAV: ProfileNavItem[] = [
  { id: 'home', label: 'Início', href: '/driver', icon: 'home', mobileRoute: '/(driver-tabs)' },
  { id: 'earnings', label: 'Ganhos', href: '/driver/earnings', icon: 'wallet', mobileRoute: '/(driver-tabs)/earnings' },
  { id: 'history', label: 'Histórico', href: '/driver/history', icon: 'time', mobileRoute: '/(driver-tabs)/history' },
  { id: 'profile', label: 'Perfil', href: '/driver/profile', icon: 'person', mobileRoute: '/(driver-tabs)/profile' },
];

const DELIVERY_NAV: ProfileNavItem[] = [
  { id: 'deliveries', label: 'Entregas', href: '/delivery', icon: 'bicycle', mobileRoute: '/(delivery-tabs)' },
  { id: 'routes', label: 'Rotas', href: '/delivery/routes', icon: 'map', mobileRoute: '/(delivery-tabs)/routes' },
  { id: 'earnings', label: 'Ganhos', href: '/delivery/earnings', icon: 'wallet', mobileRoute: '/(delivery-tabs)/earnings' },
  { id: 'history', label: 'Histórico', href: '/delivery/history', icon: 'time', mobileRoute: '/(delivery-tabs)/history' },
];

const VENDOR_BASE_NAV: ProfileNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/vendor', icon: 'home', mobileRoute: '/(vendor-tabs)' },
  { id: 'orders', label: 'Pedidos', href: '/vendor/orders', icon: 'receipt', mobileRoute: '/(vendor-tabs)/orders' },
  { id: 'menu', label: 'Produtos', href: '/vendor/menu', icon: 'restaurant', mobileRoute: '/(vendor-tabs)/menu' },
  { id: 'profile', label: 'Mais', href: '/vendor/profile', icon: 'ellipsis', mobileRoute: '/(vendor-tabs)/profile' },
];

const ADMIN_NAV: ProfileNavItem[] = [
  { id: 'dashboard', label: 'Visão Geral', href: '/admin', icon: 'grid' },
  { id: 'orders', label: 'Pedidos', href: '/admin/orders', icon: 'bag' },
  { id: 'drivers', label: 'Motoristas', href: '/admin/drivers', icon: 'car' },
  { id: 'vendors', label: 'Parceiros', href: '/admin/vendors', icon: 'store' },
  { id: 'seguradoras', label: 'Seguradoras', href: '/admin/seguradoras', icon: 'shield' },
  { id: 'users', label: 'Utilizadores', href: '/admin/users', icon: 'users' },
  { id: 'financas', label: 'Finanças', href: '/admin/financas', icon: 'chart' },
  { id: 'settings', label: 'Configurações', href: '/admin/settings', icon: 'settings' },
];

export const PROFILE_REGISTRY: Record<AppProfileId, ProfileConfig> = {
  customer: {
    id: 'customer',
    label: 'Cliente',
    description: 'Experiência do utilizador final',
    theme: {
      primary: '#00AA13',
      primaryLight: '#E8F5E9',
      accent: '#F06400',
      headerBg: '#00AA13',
      tabBarActive: '#00AA13',
      label: 'Cliente',
    },
    permissions: ['orders:read', 'rides:book', 'wallet:use', 'services:use'],
    modules: ['home', 'services', 'map', 'search', 'cart', 'orders', 'rides', 'wallet', 'profile'],
    mobile: { homeRoute: '/(tabs)', tabGroup: '(tabs)', stackRoutes: ['taxi', 'lojas', 'envio', 'uriprova'] },
    web: { homeRoute: '/', layout: 'customer', nav: CUSTOMER_NAV },
  },
  driver: {
    id: 'driver',
    label: 'Motorista',
    description: 'Corridas e ganhos',
    theme: {
      primary: '#1A73E8',
      primaryLight: '#E3F2FD',
      accent: '#00AA13',
      headerBg: '#1A73E8',
      tabBarActive: '#1A73E8',
      label: 'Motorista',
    },
    permissions: ['rides:accept', 'rides:complete', 'earnings:read', 'vehicle:manage'],
    modules: ['online', 'rides', 'earnings', 'history', 'wallet', 'vehicle', 'ratings', 'profile'],
    mobile: { homeRoute: '/(driver-tabs)', tabGroup: '(driver-tabs)', stackRoutes: ['driver/ride-request', 'driver/navigation', 'driver/trip-complete'] },
    web: { homeRoute: '/driver', layout: 'driver', nav: DRIVER_NAV },
  },
  delivery_rider: {
    id: 'delivery_rider',
    label: 'Entregador',
    description: 'Entregas e rotas',
    theme: {
      primary: '#F06400',
      primaryLight: '#FFF3E8',
      accent: '#00AA13',
      headerBg: '#F06400',
      tabBarActive: '#F06400',
      label: 'Entregador',
    },
    permissions: ['deliveries:accept', 'routes:view', 'earnings:read'],
    modules: ['deliveries', 'routes', 'earnings', 'history', 'availability'],
    mobile: { homeRoute: '/(delivery-tabs)', tabGroup: '(delivery-tabs)', stackRoutes: ['delivery/delivery-request'] },
    web: { homeRoute: '/delivery', layout: 'delivery', nav: DELIVERY_NAV },
  },
  vendor: {
    id: 'vendor',
    label: 'Parceiro',
    description: 'Painel comercial genérico',
    theme: {
      primary: '#EE2737',
      primaryLight: '#FFEBEE',
      accent: '#00AA13',
      headerBg: '#EE2737',
      tabBarActive: '#EE2737',
      label: 'Parceiro',
    },
    permissions: ['orders:manage', 'products:manage', 'stock:manage', 'reports:read'],
    modules: ['dashboard', 'products', 'stock', 'orders', 'promos', 'finance', 'reports'],
    mobile: { homeRoute: '/(vendor-tabs)', tabGroup: '(vendor-tabs)', stackRoutes: [] },
    web: { homeRoute: '/vendor', layout: 'vendor', nav: VENDOR_BASE_NAV },
    vendorSubtypes: ['generic'],
  },
  restaurant: {
    id: 'restaurant',
    label: 'Restaurante',
    description: 'Gestão de restaurante',
    theme: {
      primary: '#EE2737',
      primaryLight: '#FFEBEE',
      accent: '#F06400',
      headerBg: '#EE2737',
      tabBarActive: '#EE2737',
      label: 'Restaurante',
    },
    permissions: ['orders:manage', 'menu:manage', 'kitchen:view'],
    modules: ['dashboard', 'menu', 'orders', 'promos', 'finance'],
    mobile: { homeRoute: '/(vendor-tabs)', tabGroup: '(vendor-tabs)', stackRoutes: [] },
    web: { homeRoute: '/vendor', layout: 'vendor', nav: VENDOR_BASE_NAV },
    vendorSubtypes: ['restaurant'],
  },
  pharmacy: {
    id: 'pharmacy',
    label: 'Farmácia',
    description: 'Gestão de farmácia',
    theme: {
      primary: '#1B5E20',
      primaryLight: '#E8F5E9',
      accent: '#00AA13',
      headerBg: '#1B5E20',
      tabBarActive: '#1B5E20',
      label: 'Farmácia',
    },
    permissions: ['orders:manage', 'prescriptions:view', 'stock:manage'],
    modules: ['dashboard', 'products', 'stock', 'orders', 'prescriptions'],
    mobile: { homeRoute: '/(vendor-tabs)', tabGroup: '(vendor-tabs)', stackRoutes: [] },
    web: { homeRoute: '/vendor', layout: 'vendor', nav: VENDOR_BASE_NAV },
    vendorSubtypes: ['pharmacy'],
  },
  supermarket: {
    id: 'supermarket',
    label: 'Supermercado',
    description: 'Gestão de supermercado',
    theme: {
      primary: '#6A1B9A',
      primaryLight: '#F3E5F5',
      accent: '#00AA13',
      headerBg: '#6A1B9A',
      tabBarActive: '#6A1B9A',
      label: 'Supermercado',
    },
    permissions: ['orders:manage', 'inventory:manage', 'reports:read'],
    modules: ['dashboard', 'products', 'stock', 'orders', 'promos', 'finance'],
    mobile: { homeRoute: '/(vendor-tabs)', tabGroup: '(vendor-tabs)', stackRoutes: [] },
    web: { homeRoute: '/vendor', layout: 'vendor', nav: VENDOR_BASE_NAV },
    vendorSubtypes: ['supermarket'],
  },
  store: {
    id: 'store',
    label: 'Loja',
    description: 'Gestão de loja',
    theme: {
      primary: '#EE2737',
      primaryLight: '#FFEBEE',
      accent: '#1A73E8',
      headerBg: '#EE2737',
      tabBarActive: '#EE2737',
      label: 'Loja',
    },
    permissions: ['orders:manage', 'products:manage'],
    modules: ['dashboard', 'products', 'orders', 'finance'],
    mobile: { homeRoute: '/(vendor-tabs)', tabGroup: '(vendor-tabs)', stackRoutes: [] },
    web: { homeRoute: '/vendor', layout: 'vendor', nav: VENDOR_BASE_NAV },
    vendorSubtypes: ['store'],
  },
  service_provider: {
    id: 'service_provider',
    label: 'Prestador',
    description: 'Serviços profissionais',
    theme: {
      primary: '#00838F',
      primaryLight: '#E0F7FA',
      accent: '#00AA13',
      headerBg: '#00838F',
      tabBarActive: '#00838F',
      label: 'Prestador',
    },
    permissions: ['bookings:manage', 'services:manage', 'earnings:read'],
    modules: ['dashboard', 'bookings', 'services', 'earnings', 'profile'],
    mobile: { homeRoute: '/(tabs)', tabGroup: '(tabs)', stackRoutes: ['servicos'] },
    web: { homeRoute: '/provider', layout: 'customer', nav: CUSTOMER_NAV },
  },
  corporate: {
    id: 'corporate',
    label: 'Empresa',
    description: 'Conta corporativa',
    theme: {
      primary: '#37474F',
      primaryLight: '#ECEFF1',
      accent: '#00AA13',
      headerBg: '#37474F',
      tabBarActive: '#37474F',
      label: 'Empresa',
    },
    permissions: ['employees:manage', 'billing:read', 'reports:read'],
    modules: ['dashboard', 'employees', 'billing', 'reports'],
    mobile: { homeRoute: '/(tabs)', tabGroup: '(tabs)', stackRoutes: ['negocios'] },
    web: { homeRoute: '/corporate', layout: 'corporate', nav: CUSTOMER_NAV },
  },
  admin: {
    id: 'admin',
    label: 'Administrador',
    description: 'Painel administrativo',
    theme: {
      primary: '#212121',
      primaryLight: '#F5F5F5',
      accent: '#00AA13',
      headerBg: '#212121',
      tabBarActive: '#212121',
      label: 'Admin',
    },
    permissions: ['*'],
    modules: ['users', 'partners', 'settings', 'reports', 'monitoring', 'audit'],
    mobile: { homeRoute: '/(admin-portal)', tabGroup: '(admin-portal)', stackRoutes: [] },
    web: { homeRoute: '/admin', layout: 'admin', nav: ADMIN_NAV },
  },
};

/** Mapeia role do backend + subtipo opcional para perfil da app */
export function resolveProfileId(
  role: string,
  options?: { vendorSubtype?: VendorSubtype },
): AppProfileId {
  if (role === 'user') return 'customer';
  if (role in PROFILE_REGISTRY) return role as AppProfileId;

  if (role === 'vendor' && options?.vendorSubtype) {
    const match = (Object.values(PROFILE_REGISTRY) as ProfileConfig[]).find((p) =>
      p.vendorSubtypes?.includes(options.vendorSubtype!),
    );
    if (match) return match.id;
  }

  if (role === 'vendor') return 'vendor';
  if (role === 'driver') return 'driver';
  if (role === 'admin') return 'admin';

  return 'customer';
}

export function getProfileConfig(profileId: AppProfileId): ProfileConfig {
  return PROFILE_REGISTRY[profileId] ?? PROFILE_REGISTRY.customer;
}

export function getProfileTheme(profileId: AppProfileId): ProfileTheme {
  return getProfileConfig(profileId).theme;
}

export function getMobileHomeRoute(profileId: AppProfileId): string {
  return getProfileConfig(profileId).mobile.homeRoute;
}

export function getWebHomeRoute(profileId: AppProfileId): string {
  return getProfileConfig(profileId).web.homeRoute;
}

export function profileHasPermission(profileId: AppProfileId, permission: string): boolean {
  const perms = getProfileConfig(profileId).permissions;
  return perms.includes('*') || perms.includes(permission);
}
