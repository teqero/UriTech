import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycFields1724500000000 implements MigrationInterface {
  name = 'AddKycFields1724500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campos KYC/AML à tabela users
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS kyc_tier VARCHAR(20) NOT NULL DEFAULT 'unverified',
        ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS kyc_document_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS kyc_document_type VARCHAR(30),
        ADD COLUMN IF NOT EXISTS kyc_document_front_url TEXT,
        ADD COLUMN IF NOT EXISTS kyc_document_back_url TEXT,
        ADD COLUMN IF NOT EXISTS kyc_selfie_url TEXT,
        ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS kyc_verified_by UUID,
        ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS kyc_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS date_of_birth DATE,
        ADD COLUMN IF NOT EXISTS address_line TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS province VARCHAR(100),
        ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Angola';
    `);

    // Criar índice para queries frequentes de KYC
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS kyc_tier,
        DROP COLUMN IF EXISTS kyc_status,
        DROP COLUMN IF EXISTS kyc_document_number,
        DROP COLUMN IF EXISTS kyc_document_type,
        DROP COLUMN IF EXISTS kyc_document_front_url,
        DROP COLUMN IF EXISTS kyc_document_back_url,
        DROP COLUMN IF EXISTS kyc_selfie_url,
        DROP COLUMN IF EXISTS kyc_submitted_at,
        DROP COLUMN IF EXISTS kyc_verified_at,
        DROP COLUMN IF EXISTS kyc_verified_by,
        DROP COLUMN IF EXISTS kyc_rejection_reason,
        DROP COLUMN IF EXISTS kyc_expires_at,
        DROP COLUMN IF EXISTS nationality,
        DROP COLUMN IF EXISTS date_of_birth,
        DROP COLUMN IF EXISTS address_line,
        DROP COLUMN IF EXISTS city,
        DROP COLUMN IF EXISTS province,
        DROP COLUMN IF EXISTS country;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_kyc_status;
    `);
  }
}
