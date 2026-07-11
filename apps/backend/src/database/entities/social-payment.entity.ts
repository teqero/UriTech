import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  SocialPaymentStatus,
  SocialPaymentSyncStatus,
  SocialPlatform,
} from '@uritech/shared';

@Entity('social_payments')
export class SocialPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'buyer_id' })
  buyerId!: string;

  @Column({ name: 'seller_id', nullable: true })
  sellerId?: string;

  @Column()
  platform!: SocialPlatform;

  @Column({ name: 'original_url', type: 'text' })
  originalUrl!: string;

  @Column({ length: 512 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  price!: number;

  @Column({ length: 8, default: 'AOA' })
  currency!: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  condition?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ type: 'jsonb', default: [] })
  images!: string[];

  @Column({ type: 'jsonb', default: [] })
  videos!: string[];

  @Column({ name: 'seller_name', nullable: true })
  sellerName?: string;

  @Column({ default: 'imported' })
  status!: SocialPaymentStatus;

  @Column({ name: 'payment_status', default: 'pending' })
  paymentStatus!: 'pending' | 'paid' | 'failed';

  @Column({ name: 'transaction_id', nullable: true })
  transactionId?: string;

  @Column({ name: 'checkout_id', nullable: true })
  checkoutId?: string;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Column({ name: 'sync_status', default: 'pending' })
  syncStatus!: SocialPaymentSyncStatus;

  @Column({ name: 'sync_message', type: 'text', nullable: true })
  syncMessage?: string;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 14, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({ name: 'service_fee', type: 'decimal', precision: 14, scale: 2, default: 0 })
  serviceFee!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
