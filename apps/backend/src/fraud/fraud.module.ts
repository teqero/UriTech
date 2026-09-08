import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { AuditLogService } from '../common/audit-log.service';
import { FraudService } from './fraud.service';

@Module({
  imports: [
    ...(isDatabaseEnabled()
      ? [TypeOrmModule.forFeature([WalletTransactionEntity, AuditLogEntity])]
      : []),
  ],
  providers: [FraudService, AuditLogService],
  exports: [FraudService],
})
export class FraudModule {}
