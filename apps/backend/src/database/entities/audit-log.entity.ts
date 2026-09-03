import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  action!: 'topup' | 'transfer_out' | 'transfer_in' | 'payment' | 'withdraw' | 'multicaixa_webhook' | 'reversal';

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 14, scale: 2, nullable: true })
  balanceAfter?: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'counterparty_email', nullable: true })
  counterpartyEmail?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'request_id', nullable: true })
  requestId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
