'use client';

import {
  AUTH_STORAGE_KEY,
  type AuthSession,
  type LoginCredentials,
} from '@uritech/shared';

function readRefreshToken(parsed: Record<string, unknown>): string | undefined {
  return typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

export interface StoredSession extends AuthSession {
  refreshToken?: string;
}

export async function loginRequest(credentials: LoginCredentials): Promise<StoredSession> {
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

export function saveSession(session: StoredSession | Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export { API_BASE };
