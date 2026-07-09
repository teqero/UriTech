export type UserRole =
  | 'user'
  | 'driver'
  | 'vendor'
  | 'admin'
  | 'delivery_rider'
  | 'service_provider'
  | 'corporate'
  | 'restaurant'
  | 'pharmacy'
  | 'supermarket'
  | 'store';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type RideStatus =
  | 'searching'
  | 'driver_found'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TaxiMode = 'fixed' | 'bid' | 'rent';

export type VehicleClass =
  | 'moto'
  | 'standard'
  | 'premium'
  | 'tuktuk'
  | 'van'
  | 'minibus';

export type ServiceType =
  | 'taxi'
  | 'envio'
  | 'lojas'
  | 'servicos'
  | 'medico'
  | 'beleza'
  | 'imoveis'
  | 'carros'
  | 'petcare'
  | 'partilha'
  | 'genie'
  | 'marketplace'
  | 'pay'
  | 'securepay'
  | 'uriprova';

export type PaymentProvider =
  | 'multicaixa'
  | 'pagasam'
  | 'unitel_money'
  | 'bai_direto'
  | 'paypal'
  | 'card'
  | 'cash'
  | 'wallet';

export type StoreCategory = 'supermercado' | 'farmacia' | 'flores' | 'agua';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

export interface Driver extends User {
  role: 'driver';
  vehicleType: VehicleClass;
  vehiclePlate: string;
  rating: number;
  isOnline: boolean;
  currentLocation?: Location;
}

export interface Vendor extends User {
  role: 'vendor';
  storeName: string;
  storeAddress: string;
  rating: number;
  isOpen: boolean;
  categories: string[];
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
}

export interface Service {
  id: string;
  type: ServiceType;
  name: string;
  icon: string;
  color: string;
  description: string;
  route?: string;
  featured?: boolean;
}

export interface VehicleOption {
  id: string;
  type: VehicleClass;
  name: string;
  icon: string;
  price: number;
  eta?: string;
  capacity?: number;
}

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image?: string;
}

export interface OnDemandProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  priceFrom: number;
  providersCount: number;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  type: 'venda' | 'aluguer';
  category: 'imoveis' | 'carros' | 'itens';
  price: number;
  location: string;
  image?: string;
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  status: RideStatus;
  mode: TaxiMode;
  pickup: Location;
  destination: Location;
  fare: number;
  distance: number;
  duration: number;
  vehicleType: VehicleClass;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  vendorId?: string;
  driverId?: string;
  serviceType: ServiceType;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  pickupLocation: Location;
  deliveryLocation: Location;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface PaymentMethod {
  id: string;
  type: PaymentProvider;
  label: string;
  isDefault: boolean;
}

export interface WalletInfo {
  balance: number;
  currency: string;
  mask?: string;
}

export type WalletTransactionType = 'topup' | 'transfer_in' | 'transfer_out' | 'withdraw' | 'payment' | 'escrow';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  counterpartyEmail?: string;
  createdAt: string;
}

export interface WalletSummary extends WalletInfo {
  transactions: WalletTransaction[];
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  link?: string;
}

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ApiIntegrationType = 'payment' | 'maps' | 'sms' | 'email' | 'analytics' | 'push' | 'other';

export type ApiIntegrationStatus = 'active' | 'inactive' | 'unstable';

export interface WhiteLabelConfig {
  appName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  primaryDark: string;
  primaryLight: string;
  secondaryColor: string;
  fontFamily: string;
  supportEmail?: string;
  supportPhone?: string;
  defaultCity: string;
  defaultCountry: string;
  currencySymbol: string;
}

export interface ApiIntegration {
  id: string;
  name: string;
  type: ApiIntegrationType;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  merchantId?: string;
  environment: 'sandbox' | 'production';
  status: ApiIntegrationStatus;
  enabled: boolean;
  config?: Record<string, string>;
  updatedAt: string;
}

export type ClaimMediaType = 'photo' | 'video' | 'audio';

export type ClaimEvidenceStatus =
  | 'draft'
  | 'submitted'
  | 'received_by_insurer'
  | 'under_review'
  | 'accepted'
  | 'rejected';

export type IncidentType =
  | 'colisao'
  | 'capotamento'
  | 'atropelamento'
  | 'incendio'
  | 'roubo'
  | 'vidros'
  | 'outro';

export interface Insurer {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  apiWebhookUrl?: string;
  /** Taxa UriGo por sinistro reportado (Kz) */
  platformFeePerClaim: number;
  /** Licença mensal da plataforma (Kz) — opcional */
  platformFeeMonthly: number;
  active: boolean;
  mandatedForClients: boolean;
  clientsCount: number;
  claimsThisMonth: number;
  createdAt: string;
}

export interface ClaimMediaItem {
  id: string;
  type: ClaimMediaType;
  label: string;
  uri?: string;
  /** Base64 data URI enviado ao backend para entrega à seguradora */
  base64?: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  durationSec?: number;
}

export interface ClaimEvidenceReport {
  id: string;
  reference: string;
  insurerId: string;
  insurerName: string;
  policyNumber: string;
  insuredName: string;
  insuredPhone: string;
  incidentType: IncidentType;
  incidentDescription?: string;
  location: Location;
  media: ClaimMediaItem[];
  status: ClaimEvidenceStatus;
  integrityHash: string;
  submittedAt?: string;
  createdAt: string;
}
