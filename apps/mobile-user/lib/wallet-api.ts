import type { WalletSummary, WalletTransactionType } from '@uritech/shared';
import { apiFetch } from './api-fetch';

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

export async function fetchWallet(): Promise<WalletSummary> {
  const res = await apiFetch('/wallet');
  if (!res.ok) return parseError(res, 'Não foi possível carregar a carteira');
  return res.json() as Promise<WalletSummary>;
}

export async function topUpWallet(amount: number): Promise<WalletSummary> {
  const res = await apiFetch('/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) return parseError(res, 'Carregamento falhou');
  return res.json() as Promise<WalletSummary>;
}

export async function transferWallet(toEmail: string, amount: number): Promise<WalletSummary> {
  const res = await apiFetch('/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify({ toEmail, amount }),
  });
  if (!res.ok) return parseError(res, 'Transferência falhou');
  return res.json() as Promise<WalletSummary>;
}

export async function withdrawWallet(amount: number): Promise<WalletSummary> {
  const res = await apiFetch('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) return parseError(res, 'Levantamento falhou');
  return res.json() as Promise<WalletSummary>;
}

export interface MulticaixaInitiation {
  reference: string;
  merchantRef: string;
  amount: number;
  currency: string;
  provider: 'multicaixa';
  instructions: string;
  expiresInMinutes: number;
}

export async function initiateMulticaixaTopup(amount: number): Promise<MulticaixaInitiation> {
  const res = await apiFetch('/payments/multicaixa/initiate', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível iniciar pagamento Multicaixa');
  return res.json() as Promise<MulticaixaInitiation>;
}

export async function simulateMulticaixaTopup(reference: string): Promise<unknown> {
  const res = await apiFetch('/payments/multicaixa/simulate', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) return parseError(res, 'Simulação falhou');
  return res.json();
}

export function txIcon(type: WalletTransactionType): 'car' | 'lock-open' | 'bag-handle' | 'add' | 'wallet-outline' {
  if (type === 'payment') return 'car';
  if (type === 'escrow') return 'lock-open';
  if (type === 'topup' || type === 'transfer_in') return 'add';
  if (type === 'withdraw' || type === 'transfer_out') return 'wallet-outline';
  return 'bag-handle';
}
