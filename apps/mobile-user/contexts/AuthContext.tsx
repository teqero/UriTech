import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import {
  type AuthSession,
  type LoginCredentials,
  getMobileHomeRoute,
  getProfileTheme,
  normalizeAuthSession,
  type AppProfileId,
} from '@uritech/shared';
import { getApiBaseUrl } from '../lib/api';
import { clearAuthSession, getRefreshToken, loadAuthSession, saveAuthSession } from '../lib/auth-storage';
import { enablePushNotifications } from '../lib/push-notifications';

interface AuthContextValue {
  session: AuthSession | null;
  profileId: AppProfileId | null;
  theme: ReturnType<typeof getProfileTheme> | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = await loadAuthSession();
    setSession(stored);
    setLoading(false);
    if (stored) void enablePushNotifications();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const apiUrl = getApiBaseUrl();
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      let msg = 'Credenciais inválidas';
      try {
        const err = await res.json();
        if (err.message) msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const session = normalizeAuthSession(data);
    await saveAuthSession(session);
    setSession(session);
    void enablePushNotifications();
    router.replace(getMobileHomeRoute(session.role) as never);
  }, []);

  const logout = useCallback(async () => {
    try {
      const apiUrl = getApiBaseUrl();
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      /* ignore backend errors on logout */
    }
    await clearAuthSession();
    setSession(null);
    router.replace('/(auth)/login' as never);
  }, []);

  const profileId = session?.role ?? null;
  const theme = profileId ? getProfileTheme(profileId) : null;

  const value = useMemo(
    () => ({ session, profileId, theme, loading, login, logout, refresh }),
    [session, profileId, theme, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
