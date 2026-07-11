export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp'
  | 'olx'
  | 'mercadolivre'
  | 'ebay'
  | 'alibaba'
  | 'aliexpress'
  | 'pinterest'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'other';

export type SocialPaymentStatus =
  | 'imported'
  | 'checkout'
  | 'paid'
  | 'failed'
  | 'cancelled';

export type SocialPaymentSyncStatus =
  | 'pending'
  | 'manual_required'
  | 'synced'
  | 'unsupported';

export interface ImportedSocialProduct {
  platform: SocialPlatform;
  platformLabel: string;
  originalUrl: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category?: string;
  condition?: string;
  brand?: string;
  city?: string;
  country?: string;
  images: string[];
  videos: string[];
  sellerName?: string;
  completeness: number;
  aiEnriched: boolean;
}

export interface SocialPaymentCheckout {
  productSubtotal: number;
  quantity: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
}

export interface SocialPaymentRecord {
  id: string;
  buyerId: string;
  sellerId?: string;
  platform: SocialPlatform;
  originalUrl: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category?: string;
  condition?: string;
  brand?: string;
  city?: string;
  country?: string;
  images: string[];
  videos: string[];
  sellerName?: string;
  status: SocialPaymentStatus;
  paymentStatus: 'pending' | 'paid' | 'failed';
  transactionId?: string;
  checkoutId?: string;
  orderId?: string;
  syncStatus: SocialPaymentSyncStatus;
  syncMessage?: string;
  quantity: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPaymentReceipt {
  payment: SocialPaymentRecord;
  receiptCode: string;
  buyerName: string;
  paidAt: string;
}
