import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEY, type AuthSession, normalizeAuthSession } from '@uritech/shared';

export async function loadAuthSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.accessToken || !parsed.user) return null;
    return normalizeAuthSession(parsed as AuthSession);
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  const normalized = normalizeAuthSession(session);
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}
