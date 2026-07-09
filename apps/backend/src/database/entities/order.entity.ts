import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Location, OrderItem, OrderStatus, ServiceType } from '@uritech/shared';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId?: string;

  @Column({ name: 'driver_id', nullable: true })
  driverId?: string;

  @Column({ name: 'service_type' })
  serviceType!: ServiceType;

  @Column()
  status!: OrderStatus;

  @Column({ type: 'jsonb', default: [] })
  items!: OrderItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({ name: 'pickup_location', type: 'jsonb' })
  pickupLocation!: Location;

  @Column({ name: 'delivery_location', type: 'jsonb' })
  deliveryLocation!: Location;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
