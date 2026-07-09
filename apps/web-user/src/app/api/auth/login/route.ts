import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_COOKIE,
  AUTH_COOKIE_MAX_AGE,
  type AuthSession,
  type LoginCredentials,
} from '@uritech/shared';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const credentials = (await request.json()) as LoginCredentials;

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: err.message || 'Credenciais inválidas' },
      { status: res.status },
    );
  }

  const session = (await res.json()) as AuthSession;
  const response = NextResponse.json(session);
  response.cookies.set(AUTH_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  return response;
}
