import { getApiBaseUrl } from './api';
import { loadAuthSession } from './auth-storage';

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

  return fetch(url, { ...init, headers });
}
