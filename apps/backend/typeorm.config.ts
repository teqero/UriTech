import { DataSource } from 'typeorm';
import { isSQLite } from './src/database/database.config';

/**
 * Configuração TypeORM para o CLI (geração de migrações).
 * Usar via: npx typeorm migration:generate -d apps/backend/typeorm.config.ts
 */
const url = process.env.DATABASE_URL || '';
const useSQLite = isSQLite(url);

export default new DataSource({
  type: useSQLite ? 'better-sqlite3' : 'postgres',
  database: useSQLite ? url.replace(/^sqlite:\/\//, '') : undefined,
  url: useSQLite ? undefined : url,
  entities: ['apps/backend/src/database/entities/*.entity.ts'],
  migrations: ['apps/backend/src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  ssl: useSQLite ? false : (process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false),
  logging: ['error', 'warn', 'schema'],
});
