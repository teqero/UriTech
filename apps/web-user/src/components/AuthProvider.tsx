'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type AuthSession, type LoginCredentials, getProfileTheme, type AppProfileId } from '@uritech/shared';
import { clearSession, getPostLoginPath, loadSession, saveSession } from '@/lib/auth';
import { enableWebPush } from '@/lib/web-push';

interface AuthContextValue {
  session: AuthSession | null;
  profileId: AppProfileId | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    if (stored) {
      document.documentElement.style.setProperty('--profile-primary', stored.theme.primary);
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
    const data = (await res.json()) as AuthSession;
    saveSession(data);
    setSession(data);
    void enableWebPush(data.accessToken);
    router.replace(getPostLoginPath(data));
  }, [router]);

  const logout = useCallback(() => {
    void fetch('/api/auth/logout', { method: 'POST' });
    clearSession();
    setSession(null);
    router.replace('/login');
  }, [router]);

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
  return profileId ? getProfileTheme(profileId) : getProfileTheme('customer');
}
