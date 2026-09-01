import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendors')
export class VendorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @Column({ name: 'business_name' })
  businessName!: string;

  @Column({ name: 'business_type', default: 'restaurant' })
  businessType!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: 'Luanda' })
  city!: string;

  @Column({ default: 'Angola' })
  country!: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating!: number;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders!: number;

  @Column({ name: 'total_revenue', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalRevenue!: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.15 })
  commissionRate!: number;

  @Column({ name: 'is_open', default: true })
  isOpen!: boolean;

  @Column({ name: 'opening_hours', type: 'jsonb', default: {} })
  openingHours!: Record<string, unknown>;

  @Column({ name: 'documents_verified', default: false })
  documentsVerified!: boolean;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
