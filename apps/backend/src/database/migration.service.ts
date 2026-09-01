import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './database.config';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const config = getDatabaseConfig();

    // Se synchronize=true (dev), o TypeORM gere o schema automaticamente
    // Nesse caso não precisamos de correr migrações
    if (config.synchronize) {
      this.logger.log('synchronize=true — migrações automáticas ignoradas (dev mode)');
      return;
    }

    // Em produção/staging, synchronize=false → correr migrações pendentes
    this.logger.log('A verificar migrações pendentes...');

    try {
      const pending = await this.dataSource.showMigrations();
      if (!pending) {
        this.logger.log('Base de dados está atualizada — nenhuma migração pendente');
        return;
      }

      this.logger.log('Migrações pendentes encontradas. A executar...');
      const migrations = await this.dataSource.runMigrations({ transaction: 'each' });

      if (migrations.length === 0) {
        this.logger.log('Nenhuma migração foi executada');
      } else {
        for (const migration of migrations) {
          this.logger.log(`✓ Migração executada: ${migration.name}`);
        }
        this.logger.log(`${migrations.length} migração(ões) executada(s) com sucesso`);
      }
    } catch (error) {
      this.logger.error('Falha ao executar migrações', error);
      throw error;
    }
  }
}
