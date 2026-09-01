import { API_BASE_URL, type ApiIntegration, type WhiteLabelConfig, type OnDemandCatalogItem, type StoreCategoryItem, type UserRole, type Insurer, type ClaimEvidenceReport, AUTH_STORAGE_KEY, type AuthSession } from '@uritech/shared';

function getStoredSession(): (AuthSession & { refreshToken?: string }) | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession & { refreshToken?: string };
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession & { refreshToken?: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const session = getStoredSession();
  if (!session?.refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!res.ok) {
      clearStoredSession();
      return null;
    }

    const data = (await res.json()) as AuthSession & { refreshToken?: string };
    setStoredSession(data);
    return data.accessToken;
  } catch {
    clearStoredSession();
    return null;
  }
}

async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getStoredSession();
  const token = session?.accessToken ?? null;

  const makeRequest = (accessToken: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      },
      ...options,
    });

  let res = await makeRequest(token);

  if (res.status === 401 && token) {
    const newToken = await refreshToken();
    if (newToken) {
      res = await makeRequest(newToken);
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const settingsApi = {
  getBrand: () => request<WhiteLabelConfig>('/settings/brand'),
  updateBrand: (data: Partial<WhiteLabelConfig>) =>
    request<WhiteLabelConfig>('/settings/brand', { method: 'PUT', body: JSON.stringify(data) }),
  getIntegrations: (type?: string) =>
    request<ApiIntegration[]>(`/settings/integrations${type ? `?type=${type}` : ''}`),
  createIntegration: (data: Partial<ApiIntegration>) =>
    request<ApiIntegration>('/settings/integrations', { method: 'POST', body: JSON.stringify(data) }),
  updateIntegration: (id: string, data: Partial<ApiIntegration>) =>
    request<ApiIntegration>(`/settings/integrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleIntegration: (id: string) =>
    request<ApiIntegration>(`/settings/integrations/${id}/toggle`, { method: 'PATCH' }),
  testIntegration: (id: string) =>
    request<{ success: boolean; message: string }>(`/settings/integrations/${id}/test`, { method: 'POST' }),
  deleteIntegration: (id: string) =>
    request<{ success: boolean }>(`/settings/integrations/${id}`, { method: 'DELETE' }),
};

export const catalogApi = {
  getOnDemand: () => request<OnDemandCatalogItem[]>('/services/on-demand'),
  getStoreCategories: () => request<StoreCategoryItem[]>('/services/store-categories'),
  toggleOnDemand: (id: string) =>
    request<OnDemandCatalogItem | null>(`/services/on-demand/${id}/toggle`, { method: 'PATCH' }),
  toggleStoreCategory: (id: string) =>
    request<StoreCategoryItem | null>(`/services/store-categories/${id}/toggle`, { method: 'PATCH' }),
};

export const paymentsApi = {
  getMulticaixaStatus: () =>
    request<{
      configured: boolean;
      enabled: boolean;
      status: string;
      webhookUrl: string;
      recentTransactions: unknown[];
    }>('/payments/multicaixa/status'),
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface AdminDriver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car';
  vehiclePlate: string;
  rating: number;
  isOnline: boolean;
  totalRides: number;
  totalEarnings: number;
}

export interface AdminVendor {
  id: string;
  userId: string;
  storeName: string;
  storeAddress: string;
  rating: number;
  isOpen: boolean;
  categories: string[];
  totalOrders: number;
}

export const usersApi = {
  list: (params?: { search?: string; role?: UserRole }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.role) qs.set('role', params.role);
    const query = qs.toString();
    return request<AdminUser[]>(`/users${query ? `?${query}` : ''}`);
  },
  create: (data: { name: string; email: string; phone: string; role: UserRole; password?: string }) =>
    request<AdminUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
};

export const driversApi = {
  list: () => request<AdminDriver[]>('/drivers'),
  create: (data: {
    name: string;
    email: string;
    phone: string;
    vehicleType: 'motorcycle' | 'car';
    vehiclePlate: string;
    isOnline?: boolean;
  }) => request<AdminDriver>('/drivers', { method: 'POST', body: JSON.stringify(data) }),
};

export const vendorsApi = {
  list: () => request<AdminVendor[]>('/vendors'),
  create: (data: {
    storeName: string;
    email: string;
    phone: string;
    storeAddress: string;
    categories: string[];
    isOpen?: boolean;
  }) => request<AdminVendor>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
};

export type AdminInsurer = Insurer;

export interface InsurerPlatformStats {
  totalInsurers: number;
  activeInsurers: number;
  totalClaimsThisMonth: number;
  estimatedRevenueThisMonth: number;
}

export const insurersApi = {
  list: (activeOnly?: boolean) =>
    request<AdminInsurer[]>(`/insurers${activeOnly ? '?active=true' : ''}`),
  stats: () => request<InsurerPlatformStats>('/insurers/stats'),
  create: (data: {
    name: string;
    code: string;
    contactEmail: string;
    contactPhone: string;
    apiWebhookUrl?: string;
    platformFeePerClaim: number;
    platformFeeMonthly?: number;
    active?: boolean;
    mandatedForClients?: boolean;
  }) => request<AdminInsurer>('/insurers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AdminInsurer>) =>
    request<AdminInsurer>(`/insurers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggle: (id: string) => request<AdminInsurer>(`/insurers/${id}/toggle`, { method: 'PATCH' }),
};

export const claimEvidenceApi = {
  list: (insurerId?: string) =>
    request<ClaimEvidenceReport[]>(`/claim-evidence${insurerId ? `?insurerId=${insurerId}` : ''}`),
};
