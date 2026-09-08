import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type EscrowStatus = 'held' | 'released' | 'refunded';

/**
 * Escrow de pagamentos de serviços/pedidos.
 *
 * O valor é debitado da wallet do cliente no checkout e fica RETIDO
 * (status 'held') até:
 *  - 'released': entrega confirmada → valor creditado ao vendor/driver
 *  - 'refunded': pedido cancelado → valor devolvido ao cliente
 *
 * Registo financeiro — sem soft delete (append-style: estado muda, linha fica).
 */
@Entity('escrow_holds')
@Index('idx_escrow_order', ['orderId'])
@Index('idx_escrow_user_status', ['userId', 'status'])
@Index('idx_escrow_status_created', ['status', 'createdAt'])
export class EscrowHoldEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id' })
  orderId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ default: 'AOA' })
  currency!: string;

  @Column({ default: 'held' })
  status!: EscrowStatus;

  @Column()
  description!: string;

  @Column({ name: 'resolution_reason', nullable: true })
  resolutionReason?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
