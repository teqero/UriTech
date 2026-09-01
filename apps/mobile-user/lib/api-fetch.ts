import { getApiBaseUrl } from './api';
import { getRefreshToken, loadAuthSession, saveAuthSession } from './auth-storage';

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const base = getApiBaseUrl().replace(/\/$/, '');
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const res = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

      const data = (await res.json()) as Record<string, unknown>;
      const newAccessToken = String(data.accessToken ?? data.access_token ?? data.token ?? '');
      const newRefreshToken = String(data.refreshToken ?? data.refresh_token ?? refreshToken);
      const existing = await loadAuthSession();

      if (!newAccessToken || !existing) throw new Error('Invalid refresh response');

      const updated = {
        ...existing,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
      await saveAuthSession(updated);
      return newAccessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  let authToken = token;
  if (authToken === undefined) {
    const session = await loadAuthSession();
    authToken = session?.accessToken ?? null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    const noRetry = (init.headers && typeof init.headers === 'object' && 'X-No-Retry' in init.headers) ? true : false;
    if (!noRetry) {
      try {
        const newToken = await doRefresh();
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(url, { ...init, headers });
      } catch {
        // Refresh failed — let the caller handle 401
      }
    }
  }

  return res;
}
