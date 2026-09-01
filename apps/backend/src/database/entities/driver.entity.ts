import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('drivers')
export class DriverEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @Column({ name: 'license_number', nullable: true })
  licenseNumber?: string;

  @Column({ name: 'license_expiry', type: 'date', nullable: true })
  licenseExpiry?: Date;

  @Column({ name: 'vehicle_type', default: 'standard' })
  vehicleType!: string;

  @Column({ name: 'vehicle_plate', nullable: true })
  vehiclePlate?: string;

  @Column({ name: 'vehicle_model', nullable: true })
  vehicleModel?: string;

  @Column({ name: 'vehicle_color', nullable: true })
  vehicleColor?: string;

  @Column({ name: 'vehicle_year', nullable: true })
  vehicleYear?: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating!: number;

  @Column({ name: 'total_rides', default: 0 })
  totalRides!: number;

  @Column({ name: 'total_earnings', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalEarnings!: number;

  @Column({ name: 'is_online', default: false })
  isOnline!: boolean;

  @Column({ name: 'current_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLatitude?: number;

  @Column({ name: 'current_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLongitude?: number;

  @Column({ name: 'current_location_updated_at', type: 'timestamptz', nullable: true })
  currentLocationUpdatedAt?: Date;

  @Column({ name: 'documents_verified', default: false })
  documentsVerified!: boolean;

  @Column({ name: 'background_check_passed', default: false })
  backgroundCheckPassed!: boolean;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
