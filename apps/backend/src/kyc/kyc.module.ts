import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycAuditLogService } from './kyc-audit-log.service';
import { KycCronService } from './kyc-cron.service';
import { UserEntity } from '../database/entities/user.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { KycAuditLogEntity } from '../database/entities/kyc-audit-log.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, WalletTransactionEntity, KycAuditLogEntity]),
    AuthModule,
    NotificationsModule,
    StorageModule,
  ],
  controllers: [KycController],
  providers: [KycService, KycAuditLogService, KycCronService],
  exports: [KycService, KycAuditLogService],
})
export class KycModule {}
