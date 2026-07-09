'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { type AuthSession, type LoginCredentials } from '@uritech/shared';
import { clearSession, loadSession, loginRequest, saveSession } from '@/lib/auth';

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(loadSession());
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
    if (data.role !== 'admin') {
      throw new Error('Acesso reservado a administradores');
    }
    saveSession(data);
    setSession(data);
    router.replace('/');
  }, [router]);

  const logout = useCallback(() => {
    void fetch('/api/auth/logout', { method: 'POST' });
    clearSession();
    setSession(null);
    router.replace('/login');
  }, [router]);

  const value = useMemo(
    () => ({ session, loading, login, logout }),
    [session, loading, login, logout],
  );

  const Provider = AuthContext.Provider as unknown as React.ComponentType<{
    value: AuthContextValue | null;
    children?: ReactNode;
  }>;

  return <Provider value={value}>{children}</Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth within AuthProvider');
  return ctx;
}
