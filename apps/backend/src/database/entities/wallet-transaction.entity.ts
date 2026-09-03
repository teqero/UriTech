import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { WalletTransactionType } from '@uritech/shared';

/**
 * Ledger de transações da wallet — APPEND-ONLY.
 * Não tem soft delete nem updates: qualquer correção faz-se com
 * uma transação de reversão (nova linha), nunca alterando histórico.
 * A imutabilidade é reforçada por triggers na BD (migration 1725700000000).
 */
@Entity('wallet_transactions')
@Index('idx_wallet_tx_user_created', ['userId', 'createdAt'])
@Index('idx_wallet_tx_wallet_created', ['walletId', 'createdAt'])
@Index('idx_wallet_tx_type', ['type'])
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
