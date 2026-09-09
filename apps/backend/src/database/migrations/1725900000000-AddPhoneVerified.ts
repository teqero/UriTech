import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona o campo phone_verified (verificação via SMS OTP).
 */
export class AddPhoneVerified1725900000000 implements MigrationInterface {
  name = 'AddPhoneVerified1725900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS phone_verified;
    `);
  }
}
