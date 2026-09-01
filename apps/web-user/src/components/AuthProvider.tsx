'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type AuthSession, type LoginCredentials, getProfileTheme, normalizeAuthSession, type AppProfileId } from '@uritech/shared';
import { clearSession, getPostLoginPath, loadSession, saveSession, type StoredSession } from '@/lib/auth';
import { enableWebPush } from '@/lib/web-push';

interface AuthContextValue {
  session: StoredSession | null;
  profileId: AppProfileId | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    if (stored) {
      const theme = stored.theme ?? getProfileTheme(stored.role ?? 'customer');
      document.documentElement.style.setProperty('--profile-primary', theme.primary);
      void enableWebPush(stored.accessToken);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Credenciais inválidas');
    }
    const data = (await res.json()) as Record<string, unknown>;
    const session = normalizeAuthSession(data);
    const stored: StoredSession = {
      ...session,
      refreshToken: typeof data.refreshToken === 'string' ? data.refreshToken : undefined,
    };
    saveSession(stored);
    setSession(stored);
    void enableWebPush(session.accessToken);
    router.replace(getPostLoginPath(session));
  }, [router]);

  const logout = useCallback(async () => {
    const refreshToken = session?.refreshToken;
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
    clearSession();
    setSession(null);
    router.replace('/login');
  }, [router, session]);

  const profileId = session?.role ?? null;
  const value = useMemo(
    () => ({ session, profileId, loading, login, logout }),
    [session, profileId, loading, login, logout],
  );

  const Provider = AuthContext.Provider as unknown as React.ComponentType<{
    value: AuthContextValue | null;
    children?: React.ReactNode;
  }>;

  return <Provider value={value}>{children}</Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth within AuthProvider');
  return ctx;
}

export function useProfileTheme() {
  const { profileId } = useAuth();
  return getProfileTheme(profileId ?? 'customer');
}
