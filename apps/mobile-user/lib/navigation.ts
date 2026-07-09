import type { Href } from 'expo-router';
import { router } from 'expo-router';

/** Expo Router paths — never use `/(tabs)/index` (breaks on web). */
export const routes = {
  home: '/(tabs)' as Href,
  activity: '/(tabs)/activity' as Href,
  payment: '/(tabs)/payment' as Href,
  wallet: '/wallet' as Href,
  profile: '/(tabs)/profile' as Href,
  onboarding: '/onboarding' as Href,
  login: '/(auth)/login' as Href,
  taxi: '/taxi' as Href,
  lojas: '/lojas' as Href,
  securepay: '/securepay' as Href,
  notificacoes: '/notificacoes' as Href,
} as const;

export function generateOrderRef(): string {
  return `URI-${Math.floor(10000 + Math.random() * 90000)}`;
}

export function goHome() {
  router.replace(routes.home);
}

/** Supports `/path?tab=foo&store=1` — query strings become Expo Router params. */
export function navigateTo(path: string) {
  const qIndex = path.indexOf('?');
  if (qIndex === -1) {
    router.push(path as Href);
    return;
  }
  const pathname = path.slice(0, qIndex);
  const params = Object.fromEntries(new URLSearchParams(path.slice(qIndex + 1)));
  router.push({ pathname, params } as Href);
}

export function navigateToTaxi(destination?: string) {
  if (destination) {
    router.push({ pathname: '/taxi', params: { dest: destination } } as Href);
  } else {
    router.push(routes.taxi);
  }
}

export function navigateToOrderConfirmed(params: {
  service: string;
  dest?: string;
  ref?: string;
  label?: string;
  amount?: string;
}) {
  router.push({
    pathname: '/pedido-confirmado',
    params: {
      service: params.service,
      dest: params.dest ?? '',
      ref: params.ref ?? generateOrderRef(),
      label: params.label ?? '',
      amount: params.amount ?? '',
    },
  } as Href);
}

export function navigateToTracking(params: {
  dest?: string;
  service?: string;
  ref?: string;
}) {
  router.push({
    pathname: '/rastreamento',
    params: {
      dest: params.dest ?? '',
      service: params.service ?? 'taxi',
      ref: params.ref ?? generateOrderRef(),
    },
  } as Href);
}

export function navigateToLicitar(serviceName?: string) {
  router.push({
    pathname: '/licitar',
    params: serviceName ? { service: serviceName } : {},
  } as Href);
}
