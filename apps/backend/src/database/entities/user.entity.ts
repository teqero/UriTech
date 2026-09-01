import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { UserRole, VendorSubtype } from '@uritech/shared';

export type KycTier = 'unverified' | 'basic' | 'verified' | 'premium';
export type KycStatus = 'pending' | 'approved' | 'rejected' | 'expired';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column()
  password!: string;

  @Column()
  role!: UserRole;

  @Column({ name: 'vendor_subtype', nullable: true })
  vendorSubtype?: VendorSubtype;

  @Column({ nullable: true })
  avatar?: string;

  // ── Email Verification ──
  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'email_verification_token', nullable: true, length: 64 })
  emailVerificationToken?: string;

  @Column({ name: 'email_verification_expires_at', nullable: true, type: 'timestamptz' })
  emailVerificationExpiresAt?: Date;

  // ── 2FA / MFA ──
  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled!: boolean;

  @Column({ name: 'two_factor_secret', nullable: true, length: 64 })
  twoFactorSecret?: string;

  @Column({ name: 'two_factor_backup_codes', nullable: true, type: 'simple-array' })
  twoFactorBackupCodes?: string[];

  // ── KYC / AML ──
  @Column({ name: 'kyc_tier', default: 'unverified' })
  kycTier!: KycTier;

  @Column({ name: 'kyc_status', default: 'pending' })
  kycStatus!: KycStatus;

  @Column({ name: 'kyc_document_number', nullable: true })
  kycDocumentNumber?: string;

  @Column({ name: 'kyc_document_type', nullable: true })
  kycDocumentType?: 'bi' | 'passport' | 'driving_license';

  @Column({ name: 'kyc_document_front_url', nullable: true })
  kycDocumentFrontUrl?: string;

  @Column({ name: 'kyc_document_back_url', nullable: true })
  kycDocumentBackUrl?: string;

  @Column({ name: 'kyc_selfie_url', nullable: true })
  kycSelfieUrl?: string;

  @Column({ name: 'kyc_submitted_at', nullable: true, type: 'timestamptz' })
  kycSubmittedAt?: Date;

  @Column({ name: 'kyc_verified_at', nullable: true, type: 'timestamptz' })
  kycVerifiedAt?: Date;

  @Column({ name: 'kyc_verified_by', nullable: true })
  kycVerifiedBy?: string;

  @Column({ name: 'kyc_rejection_reason', nullable: true })
  kycRejectionReason?: string;

  @Column({ name: 'kyc_expires_at', nullable: true, type: 'timestamptz' })
  kycExpiresAt?: Date;

  @Column({ name: 'nationality', nullable: true })
  nationality?: string;

  @Column({ name: 'date_of_birth', nullable: true, type: 'date' })
  dateOfBirth?: Date;

  @Column({ name: 'address_line', nullable: true })
  addressLine?: string;

  @Column({ name: 'city', nullable: true })
  city?: string;

  @Column({ name: 'province', nullable: true })
  province?: string;

  @Column({ name: 'country', nullable: true, default: 'Angola' })
  country?: string;

  // ── Account Security ──
  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', nullable: true, type: 'timestamptz' })
  lockedUntil?: Date;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamptz' })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', nullable: true, length: 45 })
  lastLoginIp?: string;

  // ── Soft Delete ──
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
