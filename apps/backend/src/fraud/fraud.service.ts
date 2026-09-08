import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { AuditLogService } from '../common/audit-log.service';

export interface FraudCheckResult {
  allowed: boolean;
  score: number; // 0-100 (>= threshold → bloqueia)
  reasons: string[];
}

/**
 * Deteção de fraude baseada em regras de velocidade e volume.
 *
 * Regras (hard block quando score >= 100):
 *  - Mais de 10 operações na última hora
 *  - Mais de 3 levantamentos nas últimas 24h
 *  - Volume diário acima de 500.000 AOA
 *  - Transferências para 5+ destinatários distintos na última hora
 *
 * Regras soft (score += 40, alerta mas não bloqueia sozinho):
 *  - Operação individual acima de 100.000 AOA
 *  - Primeira operação da conta nas últimas 24h com valor elevado
 */
@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  private readonly MAX_OPS_PER_HOUR = 10;
  private readonly MAX_WITHDRAWALS_PER_DAY = 3;
  private readonly MAX_DAILY_VOLUME_AOA = 500_000;
  private readonly MAX_DISTINCT_RECIPIENTS_PER_HOUR = 5;
  private readonly LARGE_AMOUNT_AOA = 100_000;
  private readonly BLOCK_SCORE = 100;

  constructor(
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async checkWalletOperation(
    userId: string,
    type: string,
    amount: number,
    counterpartyEmail?: string,
  ): Promise<FraudCheckResult> {
    let score = 0;
    const reasons: string[] = [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [opsLastHour, opsLastDay] = await Promise.all([
      this.txRepo
        .createQueryBuilder('tx')
        .where('tx.user_id = :userId', { userId })
        .andWhere('tx.created_at >= :oneHourAgo', { oneHourAgo })
        .getMany(),
      this.txRepo
        .createQueryBuilder('tx')
        .where('tx.user_id = :userId', { userId })
        .andWhere('tx.created_at >= :oneDayAgo', { oneDayAgo })
        .getMany(),
    ]);

    // Velocity: operações por hora
    if (opsLastHour.length >= this.MAX_OPS_PER_HOUR) {
      score += 100;
      reasons.push(`Mais de ${this.MAX_OPS_PER_HOUR} operações na última hora (${opsLastHour.length})`);
    }

    // Velocity: levantamentos por dia
    if (type === 'withdraw') {
      const withdrawalsToday = opsLastDay.filter((tx) => tx.type === 'withdraw').length;
      if (withdrawalsToday >= this.MAX_WITHDRAWALS_PER_DAY) {
        score += 100;
        reasons.push(`Mais de ${this.MAX_WITHDRAWALS_PER_DAY} levantamentos nas últimas 24h`);
      }
    }

    // Volume diário (apenas saídas)
    const dailyOutflow = opsLastDay
      .filter((tx) => Number(tx.amount) < 0)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    if (dailyOutflow + Math.abs(amount) > this.MAX_DAILY_VOLUME_AOA) {
      score += 100;
      reasons.push(
        `Volume diário de saídas excede ${this.MAX_DAILY_VOLUME_AOA.toLocaleString('pt-AO')} AOA`,
      );
    }

    // Distinct recipients na última hora (padrão de mule/smurfing)
    if (counterpartyEmail) {
      const recipients = new Set(
        opsLastHour
          .map((tx) => tx.counterpartyEmail)
          .filter((email): email is string => Boolean(email)),
      );
      recipients.add(counterpartyEmail);
      if (recipients.size > this.MAX_DISTINCT_RECIPIENTS_PER_HOUR) {
        score += 100;
        reasons.push(
          `Transferências para ${recipients.size} destinatários distintos na última hora`,
        );
      }
    }

    // Montante individual elevado (soft signal)
    if (Math.abs(amount) > this.LARGE_AMOUNT_AOA) {
      score += 40;
      reasons.push(`Operação de valor elevado: ${Math.abs(amount).toLocaleString('pt-AO')} AOA`);
    }

    // Conta nova com valor elevado (soft signal)
    if (opsLastDay.length === 0 && Math.abs(amount) > this.LARGE_AMOUNT_AOA) {
      score += 40;
      reasons.push('Primeira operação da conta com valor elevado');
    }

    const allowed = score < this.BLOCK_SCORE;

    if (!allowed || score >= 40) {
      this.logger.warn(
        `Fraud check user=${userId} type=${type} amount=${amount} score=${score} allowed=${allowed} reasons=[${reasons.join('; ')}]`,
      );
      void this.auditLogService.log({
        userId,
        action: 'payment',
        amount: -Math.abs(amount),
        description: `FRAUD CHECK score=${score} allowed=${allowed}: ${reasons.join('; ')}`,
      });
    }

    return { allowed, score, reasons };
  }
}
