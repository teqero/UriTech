import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { ClaimEvidenceEntity } from '../database/entities/claim-evidence.entity';
import { InsurersModule } from '../insurers/insurers.module';
import { ClaimEvidenceController } from './claim-evidence.controller';
import { ClaimEvidenceService } from './claim-evidence.service';

@Module({
  imports: [
    InsurersModule,
    ...(isDatabaseEnabled() ? [TypeOrmModule.forFeature([ClaimEvidenceEntity])] : []),
  ],
  controllers: [ClaimEvidenceController],
  providers: [ClaimEvidenceService],
})
export class ClaimEvidenceModule {}
