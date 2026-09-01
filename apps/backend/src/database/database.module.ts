import { DynamicModule, Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './database.config';
import { DbSeedService } from './db-seed.service';
import { MigrationService } from './migration.service';
import { AddKycFields1724500000000 } from './migrations/1724500000000-AddKycFields';
import { AuditLogEntity } from './entities/audit-log.entity';
import { MulticaixaReferenceEntity } from './entities/multicaixa-reference.entity';
import { ClaimEvidenceEntity } from './entities/claim-evidence.entity';
import { DriverEntity } from './entities/driver.entity';
import { InsurerEntity } from './entities/insurer.entity';
import { OrderEntity } from './entities/order.entity';
import { RideEntity } from './entities/ride.entity';
import { SocialPaymentEntity } from './entities/social-payment.entity';
import { UserEntity } from './entities/user.entity';
import { VendorEntity } from './entities/vendor.entity';
import { WalletEntity } from './entities/wallet.entity';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity';

const ENTITIES = [
  UserEntity,
  RideEntity,
  OrderEntity,
  InsurerEntity,
  ClaimEvidenceEntity,
  WalletEntity,
  WalletTransactionEntity,
  SocialPaymentEntity,
  DriverEntity,
  VendorEntity,
  MulticaixaReferenceEntity,
  AuditLogEntity,
];

@Global()
@Module({})
export class DatabaseModule implements OnModuleInit {
  private static readonly logger = new Logger(DatabaseModule.name);

  static register(): DynamicModule {
    const config = getDatabaseConfig();
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd && config.synchronize) {
      DatabaseModule.logger.error('CRITICAL: synchronize=true em produção. A abortar.');
      throw new Error('TypeORM synchronize não pode estar ativo em produção. Use migrations.');
    }

    return {
      module: DatabaseModule,
      global: true,
      imports: [
        TypeOrmModule.forRoot({
          type: config.type as any,
          database: config.type === 'better-sqlite3' ? config.url : undefined,
          url: config.type === 'postgres' ? config.url : undefined,
          entities: ENTITIES,
          synchronize: config.synchronize,
          ssl: config.type === 'postgres' ? config.ssl : undefined,
          logging: config.logging,
          retryAttempts: 5,
          retryDelay: 3000,
          connectTimeoutMS: 10000,
          // Migrações — desativamos auto-run (controlamos via MigrationService)
          migrationsRun: false,
          migrations: config.type === 'postgres' ? [AddKycFields1724500000000] : [],
          migrationsTableName: 'typeorm_migrations',
        }),
        TypeOrmModule.forFeature(ENTITIES),
      ],
      providers: [DbSeedService, MigrationService],
      exports: [TypeOrmModule],
    };
  }

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      DatabaseModule.logger.error('Falha ao conectar à base de dados');
      throw new Error('Database connection failed');
    }
    const options = this.dataSource.options as any;
    if (options.type === 'better-sqlite3') {
      DatabaseModule.logger.log(`SQLite conectado: ${options.database}`);
    } else {
      DatabaseModule.logger.log(`Postgres conectado: ${options.host}:${options.port}/${options.database}`);
    }
  }
}
