import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { KycAuditLogEntity } from '../database/entities/kyc-audit-log.entity';
import { MulticaixaReferenceEntity } from '../database/entities/multicaixa-reference.entity';
import { RetentionService } from './retention.service';

@Module({
  imports: [
    ...(isDatabaseEnabled()
      ? [TypeOrmModule.forFeature([AuditLogEntity, KycAuditLogEntity, MulticaixaReferenceEntity])]
      : []),
  ],
  providers: [RetentionService],
})
export class RetentionModule {}
