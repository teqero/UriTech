'use client';

import {
  AUTH_STORAGE_KEY,
  type AuthSession,
  type LoginCredentials,
  buildAuthSession,
  getWebHomeRoute,
  normalizeAuthSession,
} from '@uritech/shared';

function readStoredToken(parsed: Record<string, unknown>): string | null {
  const token = parsed.accessToken ?? parsed.access_token ?? parsed.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

function readRefreshToken(parsed: Record<string, unknown>): string | undefined {
  return typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

export async function loginRequest(credentials: LoginCredentials): Promise<AuthSession & { refreshToken?: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Credenciais inválidas');
  }
  return res.json();
}

export interface StoredSession extends AuthSession {
  refreshToken?: string;
}

export function saveSession(session: StoredSession | Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const normalized = normalizeAuthSession(session as Record<string, unknown>);
  const stored: StoredSession = {
    ...normalized,
    refreshToken: readRefreshToken(session as Record<string, unknown>),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
  document.documentElement.style.setProperty('--profile-primary', normalized.theme.primary);
  document.documentElement.style.setProperty('--profile-accent', normalized.theme.accent);
}

export function loadSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!readStoredToken(parsed) || !parsed.user) return null;
    return {
      ...normalizeAuthSession(parsed),
      refreshToken: readRefreshToken(parsed),
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getPostLoginPath(session: AuthSession | Record<string, unknown>): string {
  const normalized = normalizeAuthSession(session as Record<string, unknown>);
  return getWebHomeRoute(normalized.role);
}

export { API_BASE, buildAuthSession };
