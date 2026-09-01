import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Location, RideStatus, TaxiMode, VehicleClass } from '@uritech/shared';

@Entity('rides')
export class RideEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'driver_id', nullable: true })
  driverId?: string;

  @Column()
  status!: RideStatus;

  @Column()
  mode!: TaxiMode;

  @Column({ type: 'jsonb' })
  pickup!: Location;

  @Column({ type: 'jsonb' })
  destination!: Location;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  fare!: number;

  @Column({ type: 'int', default: 0 })
  distance!: number;

  @Column({ type: 'int', default: 0 })
  duration!: number;

  @Column({ name: 'vehicle_type' })
  vehicleType!: VehicleClass;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
