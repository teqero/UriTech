import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@uritech/shared';

/** URL da API acessível no telemóvel (LAN, USB adb reverse ou env). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (Platform.OS === 'web') return API_BASE_URL;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra
      ?.expoClient?.hostUri;

  if (hostUri) {
    const host = hostUri.split(':')[0]?.replace(/^https?:\/\//, '');
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api/v1`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://127.0.0.1:4000/api/v1';
  }

  return API_BASE_URL;
}

export async function checkApiHealth(): Promise<{ ok: boolean; url: string; message?: string }> {
  const url = getApiBaseUrl();
  try {
    const res = await fetch(`${url}/insurers?active=true`, { method: 'GET' });
    if (!res.ok) return { ok: false, url, message: `HTTP ${res.status}` };
    return { ok: true, url };
  } catch (e) {
    return { ok: false, url, message: e instanceof Error ? e.message : 'Sem ligação' };
  }
}
