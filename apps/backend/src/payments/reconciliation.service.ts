import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { MulticaixaReferenceEntity } from '../database/entities/multicaixa-reference.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';

export interface ReconciliationReport {
  ranAt: string;
  expiredReferences: number;
  stuckPending: MulticaixaReferenceEntity[];
  paidWithoutWalletCredit: Array<{
    reference: string;
    userId: string;
    amount: number;
    paidAt: Date;
  }>;
}

/**
 * Reconciliação diária Multicaixa <-> UriPay.
 *
 * Verifica 3 classes de discrepância:
 *  1. Referências 'pending' já expiradas → marca como 'expired'
 *  2. Referências 'pending' há mais de 24h sem expirar (anomalia) → reporta
 *  3. Referências 'paid' sem crédito correspondente na wallet → reporta (CRÍTICO)
 *
 * Quando existir API de consulta do Multicaixa (EMIS GPO), este serviço
 * deve também comparar o estado remoto com o estado interno.
 */
@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);
  private lastReport: ReconciliationReport | null = null;

  constructor(
    @InjectRepository(MulticaixaReferenceEntity)
    private readonly mcxRepo: Repository<MulticaixaReferenceEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,
  ) {}

  /** Todos os dias às 03:17 (fora de hora de ponta). */
  @Cron('17 3 * * *')
  async runDailyReconciliation(): Promise<ReconciliationReport> {
    this.logger.log('A iniciar reconciliação Multicaixa...');
    const now = new Date();

    // 1. Expirar referências pendentes fora de prazo
    const expired = await this.mcxRepo.update(
      { status: 'pending', expiresAt: LessThan(now) },
      { status: 'expired' },
    );
    const expiredCount = expired.affected ?? 0;
    if (expiredCount > 0) {
      this.logger.log(`${expiredCount} referência(s) pendente(s) marcadas como expiradas`);
    }

    // 2. Referências presas em 'pending' há >24h mas ainda não expiradas (anomalia)
    const stuckPending = await this.mcxRepo.find({
      where: { status: 'pending' },
      take: 100,
    });
    const anomalous = stuckPending.filter(
      (r) => now.getTime() - r.createdAt.getTime() > 24 * 60 * 60 * 1000,
    );
    for (const ref of anomalous) {
      this.logger.warn(
        `ANOMALIA: referência ${ref.reference} pendente há >24h (criada ${ref.createdAt.toISOString()}, expira ${ref.expiresAt.toISOString()})`,
      );
    }

    // 3. Referências pagas sem crédito na wallet (CRÍTICO — dinheiro recebido não creditado)
    const paid = await this.mcxRepo.find({ where: { status: 'paid' }, take: 1000 });
    const paidWithoutWalletCredit: ReconciliationReport['paidWithoutWalletCredit'] = [];

    for (const ref of paid) {
      // Procurar topup do mesmo valor para o mesmo user numa janela de ±10 min
      const windowStart = new Date(ref.updatedAt.getTime() - 10 * 60 * 1000);
      const windowEnd = new Date(ref.updatedAt.getTime() + 10 * 60 * 1000);

      const credit = await this.txRepo
        .createQueryBuilder('tx')
        .where('tx.user_id = :userId', { userId: ref.userId })
        .andWhere('tx.type = :type', { type: 'topup' })
        .andWhere('tx.amount = :amount', { amount: Number(ref.amount) })
        .andWhere('tx.created_at BETWEEN :start AND :end', {
          start: windowStart,
          end: windowEnd,
        })
        .getOne();

      if (!credit) {
        paidWithoutWalletCredit.push({
          reference: ref.reference,
          userId: ref.userId,
          amount: Number(ref.amount),
          paidAt: ref.updatedAt,
        });
        this.logger.error(
          `DISCREPÂNCIA CRÍTICA: ref ${ref.reference} paga (${ref.amount} AOA, user ${ref.userId}) SEM crédito UriPay correspondente`,
        );
      }
    }

    const report: ReconciliationReport = {
      ranAt: now.toISOString(),
      expiredReferences: expiredCount,
      stuckPending: anomalous,
      paidWithoutWalletCredit,
    };
    this.lastReport = report;

    this.logger.log(
      `Reconciliação concluída: ${expiredCount} expiradas, ${anomalous.length} presas, ${paidWithoutWalletCredit.length} discrepâncias críticas`,
    );
    return report;
  }

  /** Último relatório (para endpoint admin / métricas). */
  getLastReport(): ReconciliationReport | null {
    return this.lastReport;
  }
}
