import { API_BASE_URL, type ApiIntegration, type WhiteLabelConfig, type OnDemandCatalogItem, type StoreCategoryItem, type UserRole, type Insurer, type ClaimEvidenceReport, AUTH_STORAGE_KEY, type AuthSession } from '@uritech/shared';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as AuthSession).accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
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
