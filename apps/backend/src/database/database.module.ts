import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseUrl, isDatabaseEnabled } from './database.config';
import { DbSeedService } from './db-seed.service';
import { OrderEntity } from './entities/order.entity';
import { RideEntity } from './entities/ride.entity';
import { UserEntity } from './entities/user.entity';
import { InsurerEntity } from './entities/insurer.entity';
import { ClaimEvidenceEntity } from './entities/claim-evidence.entity';
import { WalletEntity } from './entities/wallet.entity';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity';

const ENTITIES = [UserEntity, RideEntity, OrderEntity, InsurerEntity, ClaimEvidenceEntity, WalletEntity, WalletTransactionEntity];

@Global()
@Module({})
export class DatabaseModule {
  private static readonly logger = new Logger(DatabaseModule.name);

  static register(): DynamicModule {
    if (!isDatabaseEnabled()) {
      this.logger.warn('DATABASE_URL não definido — a usar armazenamento em memória');
      return { module: DatabaseModule, global: true };
    }

    this.logger.log('Postgres activo via DATABASE_URL');

    return {
      module: DatabaseModule,
      global: true,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: getDatabaseUrl(),
          entities: ENTITIES,
          synchronize: process.env.NODE_ENV !== 'production',
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        }),
        TypeOrmModule.forFeature(ENTITIES),
      ],
      providers: [DbSeedService],
      exports: [TypeOrmModule],
    };
  }
}
