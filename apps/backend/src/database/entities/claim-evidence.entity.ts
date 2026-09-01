import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import type { ClaimMediaItem, ClaimEvidenceStatus, IncidentType, Location } from '@uritech/shared';

@Entity('claim_evidence')
export class ClaimEvidenceEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column({ name: 'insurer_id' })
  insurerId!: string;

  @Column({ name: 'insurer_name' })
  insurerName!: string;

  @Column({ name: 'policy_number' })
  policyNumber!: string;

  @Column({ name: 'insured_name' })
  insuredName!: string;

  @Column({ name: 'insured_phone' })
  insuredPhone!: string;

  @Column({ name: 'incident_type' })
  incidentType!: IncidentType;

  @Column({ name: 'incident_description', nullable: true })
  incidentDescription?: string;

  @Column({ type: 'jsonb' })
  location!: Location;

  @Column({ type: 'jsonb', default: [] })
  media!: ClaimMediaItem[];

  @Column({ default: 'submitted' })
  status!: ClaimEvidenceStatus;

  @Column({ name: 'integrity_hash' })
  integrityHash!: string;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
