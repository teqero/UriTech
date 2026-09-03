import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Torna wallet_transactions append-only (ledger imutável):
 * - remove a coluna deleted_at (soft delete não é permitido num ledger)
 * - cria triggers que bloqueiam UPDATE e DELETE ao nível da BD
 *
 * Correções fazem-se sempre com transações de reversão (novas linhas).
 */
export class WalletLedgerAppendOnly1725700000000 implements MigrationInterface {
  name = 'WalletLedgerAppendOnly1725700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallet_transactions DROP COLUMN IF EXISTS deleted_at;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION wallet_transactions_immutable()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'wallet_transactions é append-only: operação % não permitida', TG_OP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_wallet_tx_no_update ON wallet_transactions;
      CREATE TRIGGER trg_wallet_tx_no_update
      BEFORE UPDATE ON wallet_transactions
      FOR EACH ROW EXECUTE FUNCTION wallet_transactions_immutable();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_wallet_tx_no_delete ON wallet_transactions;
      CREATE TRIGGER trg_wallet_tx_no_delete
      BEFORE DELETE ON wallet_transactions
      FOR EACH ROW EXECUTE FUNCTION wallet_transactions_immutable();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_wallet_tx_no_update ON wallet_transactions;
      DROP TRIGGER IF EXISTS trg_wallet_tx_no_delete ON wallet_transactions;
      DROP FUNCTION IF EXISTS wallet_transactions_immutable;
    `);
    await queryRunner.query(`
      ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);
  }
}
