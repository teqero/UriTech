'use client';

import {
  AUTH_STORAGE_KEY,
  type AuthSession,
  type LoginCredentials,
  buildAuthSession,
  getWebHomeRoute,
  normalizeAuthSession,
} from '@uritech/shared';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

export async function loginRequest(credentials: LoginCredentials): Promise<AuthSession> {
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

export function saveSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  const normalized = normalizeAuthSession(session);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
  document.documentElement.style.setProperty('--profile-primary', normalized.theme.primary);
  document.documentElement.style.setProperty('--profile-accent', normalized.theme.accent);
}

export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.accessToken || !parsed.user) return null;
    return normalizeAuthSession(parsed as AuthSession);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getPostLoginPath(session: AuthSession): string {
  return getWebHomeRoute(session.role);
}

export { API_BASE, buildAuthSession };
