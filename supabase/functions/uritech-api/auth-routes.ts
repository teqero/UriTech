import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { hashPassword, isBcryptHash, verifyPasswordHash } from './bcrypt-lite.ts';
import { ensureAuthSchema } from './ensure-auth-schema.ts';

function demoAuthAllowed(): boolean {
  const v = (Deno.env.get('ALLOW_DEMO_AUTH') ?? '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function mapUser(user: Record<string, unknown>) {
  const name = String(user.name ?? '');
  return {
    id: user.id,
    firstName: user.first_name ?? name.split(' ')[0],
    lastName: user.last_name ?? name.split(' ').slice(1).join(' '),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

function issueTokens(userId: string) {
  return {
    access_token: `demo-${userId}`,
    refresh_token: `refresh-${userId}`,
  };
}

async function verifyPassword(
  plain: string,
  stored: string,
): Promise<{ ok: boolean; upgradeHash?: string }> {
  if (!plain || !stored) return { ok: false };

  if (isBcryptHash(stored)) {
    return { ok: verifyPasswordHash(plain, stored) };
  }

  if (plain === stored) {
    return { ok: true, upgradeHash: hashPassword(plain) };
  }

  return { ok: false };
}

export async function handleAuthRoutes(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
): Promise<{ status: number; body: unknown } | null> {
  if (path === '/auth/login' && method === 'POST') {
    await ensureAuthSchema();

    const body = await req.json().catch(() => ({}));
    const email = String((body as { email?: string }).email ?? '').trim().toLowerCase();
    const password = String((body as { password?: string }).password ?? '');

    if (!email) return { status: 400, body: { message: 'Email obrigatório' } };
    if (!password) return { status: 400, body: { message: 'Password obrigatória' } };

    const { data: user, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    if (error || !user) return { status: 401, body: { message: 'Credenciais inválidas' } };

    const stored = String(user.password ?? '');
    let accepted = false;
    let upgradeHash: string | undefined;
    let authMode: 'demo' | 'password' = 'password';

    if (demoAuthAllowed() && password === 'demo123') {
      accepted = true;
      authMode = 'demo';
      const alreadyDemoHash = isBcryptHash(stored) && verifyPasswordHash('demo123', stored);
      if (!alreadyDemoHash) upgradeHash = hashPassword('demo123');
    } else {
      const result = await verifyPassword(password, stored);
      accepted = result.ok;
      upgradeHash = result.upgradeHash;
    }

    if (!accepted) return { status: 401, body: { message: 'Credenciais inválidas' } };

    if (upgradeHash) {
      const { error: upErr } = await supabase
        .from('users')
        .update({ password: upgradeHash })
        .eq('id', user.id);
      if (upErr) console.error('[auth] password upgrade failed', upErr.message);
    }

    return {
      status: 200,
      body: {
        ...issueTokens(String(user.id)),
        user: mapUser(user as Record<string, unknown>),
        authMode,
      },
    };
  }

  if (path === '/auth/refresh' && method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const token = String(
      (body as { refreshToken?: string; refresh_token?: string }).refreshToken
        ?? (body as { refresh_token?: string }).refresh_token
        ?? '',
    );
    const match = token.match(/^refresh-(.+)$/);
    if (!match) return { status: 401, body: { message: 'Refresh token inválido' } };

    const userId = match[1];
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, name, phone')
      .eq('id', userId)
      .maybeSingle();
    if (!user) return { status: 401, body: { message: 'Utilizador não encontrado' } };

    return {
      status: 200,
      body: {
        ...issueTokens(userId),
        user: mapUser(user as Record<string, unknown>),
      },
    };
  }

  return null;
}

export function authModeInfo() {
  return {
    demoAuth: demoAuthAllowed(),
    passwordAuth: true,
  };
}
