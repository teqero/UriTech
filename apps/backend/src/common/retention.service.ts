import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { KycAuditLogEntity } from '../database/entities/kyc-audit-log.entity';
import { MulticaixaReferenceEntity } from '../database/entities/multicaixa-reference.entity';

/**
 * Política de retenção de dados — purge diário (04:23, fora de hora de ponta).
 *
 * Regras (configuráveis por env, valores em dias):
 *  - RETENTION_AUDIT_DAYS=365      audit_logs → hard delete
 *  - RETENTION_KYC_AUDIT_DAYS=730  kyc_audit_logs → hard delete
 *  - RETENTION_MCX_DAYS=90         referências Multicaixa expiradas/canceladas → soft delete
 *
 * wallet_transactions NUNCA são purgadas (ledger append-only).
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  private readonly auditDays = Number(process.env.RETENTION_AUDIT_DAYS || 365);
  private readonly kycAuditDays = Number(process.env.RETENTION_KYC_AUDIT_DAYS || 730);
  private readonly mcxDays = Number(process.env.RETENTION_MCX_DAYS || 90);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(KycAuditLogEntity)
    private readonly kycAuditRepo: Repository<KycAuditLogEntity>,
    @InjectRepository(MulticaixaReferenceEntity)
    private readonly mcxRepo: Repository<MulticaixaReferenceEntity>,
  ) {}

  @Cron('23 4 * * *')
  async purgeOldData(): Promise<void> {
    this.logger.log('A executar retenção de dados...');

    const auditCutoff = this.daysAgo(this.auditDays);
    const auditDeleted = await this.auditRepo.delete({ createdAt: LessThan(auditCutoff) });
    if (auditDeleted.affected) {
      this.logger.log(`audit_logs purgados: ${auditDeleted.affected} (>${this.auditDays}d)`);
    }

    const kycCutoff = this.daysAgo(this.kycAuditDays);
    const kycDeleted = await this.kycAuditRepo.delete({ createdAt: LessThan(kycCutoff) });
    if (kycDeleted.affected) {
      this.logger.log(`kyc_audit_logs purgados: ${kycDeleted.affected} (>${this.kycAuditDays}d)`);
    }

    const mcxCutoff = this.daysAgo(this.mcxDays);
    const mcxDeleted = await this.mcxRepo.softDelete({
      status: 'expired',
      createdAt: LessThan(mcxCutoff),
    });
    if (mcxDeleted.affected) {
      this.logger.log(`multicaixa_references expiradas purgadas: ${mcxDeleted.affected} (>${this.mcxDays}d)`);
    }

    this.logger.log('Retenção de dados concluída');
  }

  private daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
}
