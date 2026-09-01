import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditLogService } from '../common/audit-log.service';
import { isDatabaseEnabled } from '../database/database.config';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { WalletEntity } from '../database/entities/wallet.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { KycModule } from '../kyc/kyc.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    NotificationsModule,
    KycModule,
    ...(isDatabaseEnabled()
      ? [TypeOrmModule.forFeature([WalletEntity, WalletTransactionEntity, AuditLogEntity])]
      : []),
  ],
  controllers: [WalletController],
  providers: [WalletService, AuditLogService],
  exports: [WalletService],
})
export class WalletModule {}
