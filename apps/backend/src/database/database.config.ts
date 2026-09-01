interface DatabaseConfig {
  type: 'postgres' | 'better-sqlite3';
  url: string;
  synchronize: boolean;
  ssl: boolean | { rejectUnauthorized: false };
  logging: false | 'all' | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[];
}

export function isSQLite(url: string): boolean {
  return url.startsWith('sqlite:') || url.endsWith('.db') || url.endsWith('.sqlite') || url.endsWith('.sqlite3');
}

export function getDatabaseConfig(): DatabaseConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error(
      'DATABASE_URL não definido. Configure a variável de ambiente para conectar ao Postgres ou SQLite.'
    );
  }

  const useSQLite = isSQLite(url);

  if (isProd && useSQLite) {
    throw new Error('SQLite não é suportado em produção. Use PostgreSQL.');
  }

  return {
    type: useSQLite ? 'better-sqlite3' : 'postgres',
    url: useSQLite ? url.replace(/^sqlite:\/\//, '') : url,
    synchronize: !isProd && process.env.TYPEORM_SYNC !== 'false',
    ssl: useSQLite ? false : (process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false),
    logging: isProd ? ['error', 'warn', 'schema'] : ['query', 'error', 'warn', 'schema'],
  };
}

/** @deprecated Use getDatabaseConfig() instead */
export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** @deprecated Use getDatabaseConfig().url instead */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL não definido');
  return url;
}
