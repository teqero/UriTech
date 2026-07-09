import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('insurers')
export class InsurerEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column({ name: 'contact_email' })
  contactEmail!: string;

  @Column({ name: 'contact_phone' })
  contactPhone!: string;

  @Column({ name: 'api_webhook_url', nullable: true })
  apiWebhookUrl?: string;

  @Column({ name: 'platform_fee_per_claim', type: 'decimal', precision: 12, scale: 2 })
  platformFeePerClaim!: number;

  @Column({ name: 'platform_fee_monthly', type: 'decimal', precision: 12, scale: 2, default: 0 })
  platformFeeMonthly!: number;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'mandated_for_clients', default: false })
  mandatedForClients!: boolean;

  @Column({ name: 'clients_count', default: 0 })
  clientsCount!: number;

  @Column({ name: 'claims_this_month', default: 0 })
  claimsThisMonth!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
