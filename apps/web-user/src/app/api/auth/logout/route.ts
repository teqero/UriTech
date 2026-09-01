import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, AUTH_STORAGE_KEY } from '@uritech/shared';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  // Ler refreshToken do body (enviado pelo cliente)
  let refreshToken: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : undefined;
  } catch {
    // ignore
  }

  // Se tem token, notificar backend para blacklist
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
    } catch {
      // Silencioso — logout é idempotente
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // Instruir cliente a limpar localStorage
  response.headers.set('X-Clear-Auth', '1');

  return response;
}
