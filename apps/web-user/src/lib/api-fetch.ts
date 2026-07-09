'use client';

import { AUTH_STORAGE_KEY, type AuthSession } from '@uritech/shared';
import { API_BASE } from './auth';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw) as AuthSession & { access_token?: string };
        token = session.accessToken ?? session.access_token ?? null;
      } catch {
        token = null;
      }
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}
