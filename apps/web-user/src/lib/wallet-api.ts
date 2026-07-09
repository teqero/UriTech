'use client';

import { AUTH_STORAGE_KEY, type AuthSession, type WalletSummary } from '@uritech/shared';
import { API_BASE } from './auth';

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== 'undefined'
      ? (() => {
          const raw = localStorage.getItem(AUTH_STORAGE_KEY);
          if (!raw) return null;
          try {
            return (JSON.parse(raw) as AuthSession).accessToken ?? null;
          } catch {
            return null;
          }
        })()
      : null;

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

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
  const res = await authFetch('/wallet');
  if (!res.ok) return parseError(res, 'Não foi possível carregar a carteira');
  return res.json() as Promise<WalletSummary>;
}

export async function topUpWallet(amount: number): Promise<WalletSummary> {
  const res = await authFetch('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) });
  if (!res.ok) return parseError(res, 'Carregamento falhou');
  return res.json() as Promise<WalletSummary>;
}

export async function transferWallet(toEmail: string, amount: number): Promise<WalletSummary> {
  const res = await authFetch('/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify({ toEmail, amount }),
  });
  if (!res.ok) return parseError(res, 'Transferência falhou');
  return res.json() as Promise<WalletSummary>;
}

export async function withdrawWallet(amount: number): Promise<WalletSummary> {
  const res = await authFetch('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) });
  if (!res.ok) return parseError(res, 'Levantamento falhou');
  return res.json() as Promise<WalletSummary>;
}

export async function initiateMulticaixaTopup(amount: number) {
  const res = await authFetch('/payments/multicaixa/initiate', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) return parseError(res, 'Não foi possível iniciar Multicaixa');
  return res.json();
}

export async function simulateMulticaixaTopup(reference: string) {
  const res = await authFetch('/payments/multicaixa/simulate', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) return parseError(res, 'Simulação falhou');
  return res.json();
}
