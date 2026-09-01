import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEY, type AuthSession, normalizeAuthSession } from '@uritech/shared';

export async function loadAuthSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const token = parsed.accessToken ?? parsed.access_token ?? parsed.token;
    if (!token || !parsed.user) return null;
    return normalizeAuthSession(parsed);
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthSession | Record<string, unknown>): Promise<void> {
  const normalized = normalizeAuthSession(session);
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return (parsed.refreshToken as string) ?? (parsed.refresh_token as string) ?? null;
  } catch {
    return null;
  }
}
