import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona indexes de performance nas tabelas de maior volume.
 * Todos os indexes usam IF NOT EXISTS para serem idempotentes.
 */
export class AddPerformanceIndexes1725600000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1725600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // wallet_transactions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created
      ON wallet_transactions(user_id, created_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created
      ON wallet_transactions(wallet_id, created_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_tx_type
      ON wallet_transactions(type);
    `);

    // rides
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rides_user_status
      ON rides(user_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rides_driver_status
      ON rides(driver_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rides_created_at
      ON rides(created_at DESC);
    `);

    // orders
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_status
      ON orders(user_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_vendor_status
      ON orders(vendor_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_driver_status
      ON orders(driver_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at
      ON orders(created_at DESC);
    `);

    // multicaixa_references
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_multicaixa_user_status
      ON multicaixa_references(user_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_multicaixa_status_expires
      ON multicaixa_references(status, expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      'idx_wallet_tx_user_created',
      'idx_wallet_tx_wallet_created',
      'idx_wallet_tx_type',
      'idx_rides_user_status',
      'idx_rides_driver_status',
      'idx_rides_created_at',
      'idx_orders_user_status',
      'idx_orders_vendor_status',
      'idx_orders_driver_status',
      'idx_orders_created_at',
      'idx_multicaixa_user_status',
      'idx_multicaixa_status_expires',
    ];
    for (const idx of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${idx};`);
    }
  }
}
