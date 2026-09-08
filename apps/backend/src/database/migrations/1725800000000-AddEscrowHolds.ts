import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela de escrow (fundos retidos entre pagamento e entrega).
 */
export class AddEscrowHolds1725800000000 implements MigrationInterface {
  name = 'AddEscrowHolds1725800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS escrow_holds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        user_id UUID NOT NULL,
        vendor_id UUID,
        amount DECIMAL(14,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'AOA',
        status VARCHAR(20) NOT NULL DEFAULT 'held',
        description TEXT NOT NULL,
        resolution_reason TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_escrow_order ON escrow_holds(order_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_escrow_user_status ON escrow_holds(user_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_escrow_status_created ON escrow_holds(status, created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS escrow_holds;`);
  }
}
