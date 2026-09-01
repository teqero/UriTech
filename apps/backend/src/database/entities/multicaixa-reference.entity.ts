import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('multicaixa_references')
export class MulticaixaReferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'reference', unique: true })
  reference!: string;

  @Column({ name: 'merchant_ref' })
  merchantRef!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ default: 'AOA' })
  currency!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'paid' | 'expired' | 'cancelled';

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
