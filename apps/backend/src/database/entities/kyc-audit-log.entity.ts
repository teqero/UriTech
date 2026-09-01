import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type KycAuditAction = 'kyc_submit' | 'kyc_renew' | 'kyc_approve' | 'kyc_reject' | 'kyc_expire' | 'kyc_upload_document';

@Entity('kyc_audit_logs')
export class KycAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  action!: KycAuditAction;

  @Column({ name: 'performed_by', nullable: true })
  performedBy?: string; // ID do admin ou do próprio utilizador

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // tier, reason, documentType, etc.

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
