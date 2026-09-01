'use client';

import { AUTH_STORAGE_KEY, type AuthSession } from '@uritech/shared';
import { API_BASE } from './auth';

interface StoredSession extends AuthSession {
  refreshToken?: string;
}

function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function setStoredSession(session: StoredSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const session = getStoredSession();
  if (!session?.refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!res.ok) {
      clearStoredSession();
      return null;
    }

    const data = (await res.json()) as StoredSession;
    setStoredSession(data);
    return data.accessToken;
  } catch {
    clearStoredSession();
    return null;
  }
}

async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getStoredSession();
  const token = session?.accessToken ?? null;

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const makeRequest = (accessToken: string | null) =>
    fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });

  let response = await makeRequest(token);

  // Se 401, tentar refresh e reenviar
  if (response.status === 401 && token) {
    const newToken = await refreshToken();
    if (newToken) {
      response = await makeRequest(newToken);
    }
  }

  return response;
}
