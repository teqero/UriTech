import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycAuditLogs1725000000000 implements MigrationInterface {
  name = 'AddKycAuditLogs1725000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS kyc_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        action VARCHAR(30) NOT NULL,
        performed_by UUID,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_user_id ON kyc_audit_logs(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_action ON kyc_audit_logs(action);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_created_at ON kyc_audit_logs(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS kyc_audit_logs;`);
  }
}
