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
  raw: Partial<AuthSession> & Pick<AuthSession, 'accessToken'> & { user: AuthUser },
): AuthSession {
  const built = buildAuthSession(raw.accessToken, raw.user);
  return {
    ...built,
    ...raw,
    accessToken: raw.accessToken,
    user: raw.user,
    role: raw.role ?? built.role,
    permissions: raw.permissions ?? built.permissions,
    theme: raw.theme?.primary ? raw.theme : built.theme,
    modules: raw.modules ?? built.modules,
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
