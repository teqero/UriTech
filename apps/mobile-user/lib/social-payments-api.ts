import type { SocialPaymentReceipt, SocialPaymentRecord } from '@uritech/shared';
import { apiFetch } from './api-fetch';
import { getApiBaseUrl } from './api';

/** CDN das redes sociais bloqueiam hotlink — servimos via proxy da API. */
export function proxyImageUrl(imageUrl: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}/social-payments/image?url=${encodeURIComponent(imageUrl)}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string | string[] };
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function importSocialProduct(url: string): Promise<SocialPaymentRecord> {
  const res = await apiFetch('/social-payments/import', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return parseJson(res);
}

export async function fetchSocialPayment(id: string): Promise<SocialPaymentRecord> {
  const res = await apiFetch(`/social-payments/${id}`);
  return parseJson(res);
}

export async function prepareSocialCheckout(
  id: string,
  options: {
    quantity?: number;
    deliveryOption?: 'pickup' | 'urigo' | 'none';
    couponCode?: string;
  },
): Promise<SocialPaymentRecord> {
  const res = await apiFetch(`/social-payments/${id}/checkout`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
  return parseJson(res);
}

export async function paySocialProduct(
  id: string,
  options: {
    quantity?: number;
    deliveryOption?: 'pickup' | 'urigo' | 'none';
    couponCode?: string;
    payWithWallet?: boolean;
  },
): Promise<SocialPaymentReceipt> {
  const res = await apiFetch(`/social-payments/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
  return parseJson(res);
}

export async function listSocialPayments(): Promise<SocialPaymentRecord[]> {
  const res = await apiFetch('/social-payments');
  return parseJson(res);
}

export async function syncSocialPayment(id: string): Promise<SocialPaymentRecord> {
  const res = await apiFetch(`/social-payments/${id}/sync`, { method: 'POST' });
  return parseJson(res);
}

export const PLATFORM_ICONS: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  tiktok: '🎵',
  whatsapp: '💬',
  olx: '🏷️',
  mercadolivre: '🛍️',
  ebay: '🌐',
  alibaba: '🏭',
  aliexpress: '📦',
  pinterest: '📌',
  linkedin: '💼',
  other: '🔗',
};

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: 'Facebook Marketplace',
    instagram: 'Instagram',
    tiktok: 'TikTok Shop',
    whatsapp: 'WhatsApp Business',
    olx: 'OLX',
    mercadolivre: 'Mercado Livre',
    ebay: 'eBay',
    alibaba: 'Alibaba',
    aliexpress: 'AliExpress',
    pinterest: 'Pinterest',
    linkedin: 'LinkedIn',
    twitter: 'X (Twitter)',
    youtube: 'YouTube',
    other: 'Rede Social',
  };
  return labels[platform] ?? platform;
}
