export type NotificationType = 'order' | 'driver' | 'payment' | 'system' | 'ia';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  href: string;
  read: boolean;
  time: string;
  type: NotificationType;
}

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  city: string;
}

const PROFILE_KEY = 'urigo-admin-profile';
const NOTIFICATIONS_KEY = 'urigo-admin-notifications';

export const DEFAULT_PROFILE: AdminProfile = {
  name: 'Admin UriGo',
  email: 'admin@uritech.com',
  phone: '+244 923 900 000 001',
  role: 'Gestor Operações',
  city: 'Luanda HQ',
};

export const DEFAULT_NOTIFICATIONS: AdminNotification[] = [
  {
    id: '1',
    title: 'Motorista online',
    message: 'Carlos Manuel ficou online em Talatona.',
    href: '/drivers',
    read: false,
    time: 'há 5 min',
    type: 'driver',
  },
  {
    id: '2',
    title: 'Pagamento Multicaixa',
    message: 'Transação REF123 confirmada — 5.000 Kz.',
    href: '/financas',
    read: false,
    time: 'há 12 min',
    type: 'payment',
  },
  {
    id: '3',
    title: 'Pedido pendente',
    message: 'ORD-002 aguarda entrega na Maianga.',
    href: '/orders',
    read: false,
    time: 'há 1 h',
    type: 'order',
  },
  {
    id: '4',
    title: 'Alerta IA — Fraude',
    message: 'Anomalia GPS detectada no motorista #004.',
    href: '/ia',
    read: true,
    time: 'há 3 h',
    type: 'ia',
  },
  {
    id: '5',
    title: 'Novo comerciante',
    message: 'Restaurante Kilamba aguarda aprovação.',
    href: '/vendors',
    read: true,
    time: 'ontem',
    type: 'system',
  },
];

export function loadProfile(): AdminProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: AdminProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadNotifications(): AdminNotification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATIONS;
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotifications(items: AdminNotification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
}

export function clearAdminSession() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(NOTIFICATIONS_KEY);
}
