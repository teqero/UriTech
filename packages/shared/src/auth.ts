import {
  type AppProfileId,
  type ProfileTheme,
  type VendorSubtype,
  getProfileConfig,
  resolveProfileId,
} from './profiles';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  vendorSubtype?: VendorSubtype;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  role: AppProfileId;
  permissions: string[];
  theme: ProfileTheme;
  modules: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

function readAuthUser(raw: Record<string, unknown>): AuthUser {
  const u = (raw.user ?? raw) as Record<string, unknown>;
  const firstName = u.firstName ?? u.first_name;
  const lastName = u.lastName ?? u.last_name;
  const email = String(u.email ?? raw.email ?? '');
  const name = String(
    u.name ??
      ([firstName, lastName].filter(Boolean).join(' ') ||
        email ||
        'Utilizador UriGo'),
  );

  return {
    id: String(u.id ?? ''),
    name,
    email,
    phone: typeof u.phone === 'string' ? u.phone : undefined,
    role: String(u.role ?? 'user'),
    avatar: typeof u.avatar === 'string' ? u.avatar : undefined,
    vendorSubtype: u.vendorSubtype as VendorSubtype | undefined,
  };
}

/** Adapta respostas NestJS, Supabase Edge e outros formatos legados. */
export function coerceAuthApiResponse(raw: Record<string, unknown>): {
  accessToken: string;
  user: AuthUser;
} {
  const accessToken = String(raw.accessToken ?? raw.access_token ?? raw.token ?? '');
  const user = readAuthUser(raw);

  if (!accessToken) {
    throw new Error('Resposta de autenticação inválida');
  }

  return { accessToken, user };
}

export function buildAuthSession(
  accessToken: string,
  user: AuthUser,
): AuthSession {
  const profileId = resolveProfileId(user.role, { vendorSubtype: user.vendorSubtype });
  const profile = getProfileConfig(profileId);

  return {
    accessToken,
    user: { ...user, role: user.role },
    role: profileId,
    permissions: profile.permissions,
    theme: profile.theme,
    modules: profile.modules,
  };
}

/** Garante theme/role quando a API (ex. Supabase Edge) devolve só token + user. */
export function normalizeAuthSession(
  raw: Record<string, unknown> | (Partial<AuthSession> & { user?: AuthUser }),
): AuthSession {
  const payload =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const { accessToken, user } = coerceAuthApiResponse(payload);
  const built = buildAuthSession(accessToken, user);
  const partial = raw as Partial<AuthSession>;

  return {
    accessToken,
    refreshToken: partial.refreshToken ?? (payload.refreshToken as string | undefined) ?? (payload.refresh_token as string | undefined),
    user,
    role: partial.role ?? built.role,
    permissions: partial.permissions ?? built.permissions,
    theme: partial.theme?.primary ? partial.theme : built.theme,
    modules: partial.modules ?? built.modules,
  };
}

export const AUTH_STORAGE_KEY = 'urigo_auth_session';

/** Cookie HTTP-only usado pelo middleware Next.js (web-user / web-admin). */
export const AUTH_COOKIE = 'urigo_token';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const DEMO_ACCOUNTS: { email: string; password: string; label: string }[] = [
  { email: 'joao@uritech.com', password: 'demo123', label: 'Cliente' },
  { email: 'budi@uritech.com', password: 'demo123', label: 'Motorista' },
  { email: 'warung@uritech.com', password: 'demo123', label: 'Vendor' },
  { email: 'admin@uritech.com', password: 'demo123', label: 'Admin' },
  { email: 'entregador@uritech.com', password: 'demo123', label: 'Entregador' },
];
