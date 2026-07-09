import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { WalletTransactionType } from '@uritech/shared';

@Entity('wallet_transactions')
export class WalletTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'wallet_id' })
  walletId!: string;

  @Column()
  type!: WalletTransactionType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 14, scale: 2 })
  balanceAfter!: number;

  @Column()
  description!: string;

  @Column({ name: 'counterparty_email', nullable: true })
  counterpartyEmail?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
