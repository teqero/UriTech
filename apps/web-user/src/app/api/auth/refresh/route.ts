import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, normalizeAuthSession } from '@uritech/shared';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
  const refreshToken = body.refreshToken;

  if (!refreshToken) {
    return NextResponse.json(
      { message: 'Refresh token não fornecido' },
      { status: 401 },
    );
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: err.message || 'Sessão expirada' },
      { status: 401 },
    );
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const session = normalizeAuthSession(raw);
  const newRefreshToken = typeof raw.refreshToken === 'string' ? raw.refreshToken : undefined;

  const response = NextResponse.json({
    ...session,
    refreshToken: newRefreshToken,
  });

  // Atualizar cookie com novo access token
  response.cookies.set(AUTH_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}
