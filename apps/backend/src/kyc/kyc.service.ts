import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, KycTier, KycStatus } from '../database/entities/user.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { EmailService } from '../common/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KycAuditLogService } from './kyc-audit-log.service';

export interface KycLimit {
  tier: KycTier;
  dailyTopUpLimit: number;
  dailyTransferLimit: number;
  dailyPaymentLimit: number;
  dailyWithdrawLimit: number;
  maxBalance: number;
  requiresKyc: boolean;
}

export interface KycSubmission {
  documentType: 'bi' | 'passport' | 'driving_license';
  documentNumber: string;
  documentFrontUrl: string;
  documentBackUrl: string;
  selfieUrl: string;
  nationality?: string;
  dateOfBirth?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  country?: string;
}

const KYC_LIMITS: Record<KycTier, KycLimit> = {
  unverified: {
    tier: 'unverified',
    dailyTopUpLimit: 0,
    dailyTransferLimit: 0,
    dailyPaymentLimit: 0,
    dailyWithdrawLimit: 0,
    maxBalance: 0,
    requiresKyc: true,
  },
  basic: {
    tier: 'basic',
    dailyTopUpLimit: 50_000,
    dailyTransferLimit: 25_000,
    dailyPaymentLimit: 25_000,
    dailyWithdrawLimit: 25_000,
    maxBalance: 200_000,
    requiresKyc: true,
  },
  verified: {
    tier: 'verified',
    dailyTopUpLimit: 500_000,
    dailyTransferLimit: 250_000,
    dailyPaymentLimit: 500_000,
    dailyWithdrawLimit: 250_000,
    maxBalance: 2_000_000,
    requiresKyc: true,
  },
  premium: {
    tier: 'premium',
    dailyTopUpLimit: 5_000_000,
    dailyTransferLimit: 2_500_000,
    dailyPaymentLimit: 5_000_000,
    dailyWithdrawLimit: 2_500_000,
    maxBalance: 50_000_000,
    requiresKyc: true,
  },
};

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: KycAuditLogService,
  ) {}

  getLimits(tier: KycTier): KycLimit {
    return KYC_LIMITS[tier];
  }

  getAllLimits(): KycLimit[] {
    return Object.values(KYC_LIMITS);
  }

  async getUserKycStatus(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: [
        'id', 'name', 'email', 'kycTier', 'kycStatus', 'kycDocumentNumber',
        'kycDocumentType', 'kycSubmittedAt', 'kycVerifiedAt', 'kycVerifiedBy',
        'kycRejectionReason', 'kycExpiresAt', 'nationality', 'dateOfBirth',
        'addressLine', 'city', 'province', 'country',
      ],
    });

    if (!user) throw new BadRequestException('Utilizador não encontrado');

    const limits = this.getLimits(user.kycTier);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      tier: user.kycTier,
      status: user.kycStatus,
      limits,
      submittedAt: user.kycSubmittedAt,
      verifiedAt: user.kycVerifiedAt,
      verifiedBy: user.kycVerifiedBy,
      rejectionReason: user.kycRejectionReason,
      expiresAt: user.kycExpiresAt,
      profile: {
        nationality: user.nationality,
        dateOfBirth: user.dateOfBirth,
        address: {
          line: user.addressLine,
          city: user.city,
          province: user.province,
          country: user.country,
        },
      },
    };
  }

  async submitKyc(userId: string, submission: KycSubmission): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');

    if (user.kycStatus === 'approved' && user.kycTier !== 'unverified') {
      throw new BadRequestException('KYC já aprovado. Contacte suporte para actualização.');
    }

    if (!submission.documentNumber || submission.documentNumber.length < 5) {
      throw new BadRequestException('Número de documento inválido');
    }

    await this.usersRepo.update(userId, {
      kycDocumentType: submission.documentType,
      kycDocumentNumber: submission.documentNumber,
      kycDocumentFrontUrl: submission.documentFrontUrl,
      kycDocumentBackUrl: submission.documentBackUrl,
      kycSelfieUrl: submission.selfieUrl,
      nationality: submission.nationality,
      dateOfBirth: submission.dateOfBirth ? new Date(submission.dateOfBirth) : undefined,
      addressLine: submission.addressLine,
      city: submission.city,
      province: submission.province,
      country: submission.country || 'Angola',
      kycStatus: 'pending',
      kycSubmittedAt: new Date(),
      kycRejectionReason: undefined,
    });

    this.logger.log(`KYC submetido: user=${userId} doc=${submission.documentType}`);

    await this.auditLogService.log({
      userId,
      action: 'kyc_submit',
      metadata: {
        documentType: submission.documentType,
        documentNumber: submission.documentNumber,
      },
    });
  }

  async renewKyc(userId: string, submission: KycSubmission): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');

    const allowedStatuses: KycStatus[] = ['expired', 'rejected', 'approved'];
    if (!allowedStatuses.includes(user.kycStatus)) {
      throw new BadRequestException('Não é possível renovar KYC neste estado. Aguarde a verificação actual.');
    }

    if (!submission.documentNumber || submission.documentNumber.length < 5) {
      throw new BadRequestException('Número de documento inválido');
    }

    await this.usersRepo.update(userId, {
      kycDocumentType: submission.documentType,
      kycDocumentNumber: submission.documentNumber,
      kycDocumentFrontUrl: submission.documentFrontUrl,
      kycDocumentBackUrl: submission.documentBackUrl,
      kycSelfieUrl: submission.selfieUrl,
      nationality: submission.nationality,
      dateOfBirth: submission.dateOfBirth ? new Date(submission.dateOfBirth) : undefined,
      addressLine: submission.addressLine,
      city: submission.city,
      province: submission.province,
      country: submission.country || 'Angola',
      kycStatus: 'pending',
      kycSubmittedAt: new Date(),
      kycVerifiedAt: undefined,
      kycVerifiedBy: undefined,
      kycExpiresAt: undefined,
      kycRejectionReason: undefined,
    });

    this.logger.log(`KYC renovado: user=${userId} doc=${submission.documentType}`);

    await this.auditLogService.log({
      userId,
      action: 'kyc_renew',
      metadata: {
        documentType: submission.documentType,
        previousStatus: user.kycStatus,
      },
    });
  }

  async approveKyc(userId: string, adminId: string, tier: KycTier = 'verified'): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');

    if (user.kycStatus !== 'pending') {
      throw new BadRequestException('Não há submissão KYC pendente para este utilizador');
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await this.usersRepo.update(userId, {
      kycTier: tier,
      kycStatus: 'approved',
      kycVerifiedAt: new Date(),
      kycVerifiedBy: adminId,
      kycExpiresAt: expiresAt,
      kycRejectionReason: undefined,
    });

    await this.notifyKycApproved(user, tier);

    await this.auditLogService.log({
      userId,
      action: 'kyc_approve',
      performedBy: adminId,
      metadata: { tier, expiresAt: expiresAt.toISOString() },
    });

    this.logger.log(`KYC aprovado: user=${userId} tier=${tier} by=${adminId}`);
  }

  async rejectKyc(userId: string, adminId: string, reason: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');

    await this.usersRepo.update(userId, {
      kycStatus: 'rejected',
      kycVerifiedBy: adminId,
      kycRejectionReason: reason,
    });

    await this.notifyKycRejected(user, reason);

    await this.auditLogService.log({
      userId,
      action: 'kyc_reject',
      performedBy: adminId,
      metadata: { reason },
    });

    this.logger.warn(`KYC rejeitado: user=${userId} by=${adminId} reason=${reason}`);
  }

  async expireKyc(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    await this.usersRepo.update(userId, {
      kycStatus: 'expired',
    });

    if (user) {
      await this.notifyKycExpired(user);

      await this.auditLogService.log({
        userId,
        action: 'kyc_expire',
        metadata: { previousTier: user.kycTier },
      });
    }

    this.logger.warn(`KYC expirado: user=${userId}`);
  }

  async findPendingKycs(page: number, limit: number) {
    const [items, total] = await this.usersRepo.findAndCount({
      where: { kycStatus: 'pending' },
      select: [
        'id', 'name', 'email', 'phone', 'kycTier', 'kycStatus',
        'kycDocumentType', 'kycDocumentNumber', 'kycSubmittedAt',
        'nationality', 'dateOfBirth', 'addressLine', 'city', 'province', 'country',
      ],
      order: { kycSubmittedAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async validateTransaction(
    userId: string,
    type: 'topup' | 'transfer' | 'payment' | 'withdraw',
    amount: number,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'kycTier', 'kycStatus', 'kycExpiresAt'],
    });

    if (!user) throw new BadRequestException('Utilizador não encontrado');

    if (user.kycExpiresAt && user.kycExpiresAt < new Date()) {
      await this.expireKyc(userId);
      throw new ForbiddenException('KYC expirado. Por favor renovar a verificação.');
    }

    const limits = this.getLimits(user.kycTier);

    if (limits.requiresKyc && user.kycStatus !== 'approved') {
      throw new ForbiddenException(
        'Verificação de identidade (KYC) necessária. Por favor submeta os seus documentos.'
      );
    }

    let limit: number;
    let txTypes: string[];
    switch (type) {
      case 'topup':
        limit = limits.dailyTopUpLimit;
        txTypes = ['topup'];
        break;
      case 'transfer':
        limit = limits.dailyTransferLimit;
        txTypes = ['transfer_out'];
        break;
      case 'payment':
        limit = limits.dailyPaymentLimit;
        txTypes = ['payment'];
        break;
      case 'withdraw':
        limit = limits.dailyWithdrawLimit;
        txTypes = ['withdraw'];
        break;
      default:
        throw new BadRequestException('Tipo de transação inválido');
    }

    if (amount > limit) {
      throw new ForbiddenException(
        `Limite diário excedido. O seu tier (${user.kycTier}) permite até ${limit.toLocaleString('pt-AO')} Kz por dia para ${type}.`
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyTotal = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(ABS(tx.amount)), 0)', 'total')
      .where('tx.user_id = :userId', { userId })
      .andWhere('tx.type IN (:...txTypes)', { txTypes })
      .andWhere('tx.created_at >= :startOfDay', { startOfDay })
      .getRawOne();

    const accumulated = Number(dailyTotal?.total || 0);
    if (accumulated + amount > limit) {
      const remaining = Math.max(0, limit - accumulated);
      throw new ForbiddenException(
        `Limite diário de ${type} excedido. Já utilizou ${accumulated.toLocaleString('pt-AO')} Kz hoje. Limite: ${limit.toLocaleString('pt-AO')} Kz. Restante: ${remaining.toLocaleString('pt-AO')} Kz.`
      );
    }
  }

  async validateMaxBalance(userId: string, newBalance: number): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'kycTier'],
    });

    if (!user) throw new BadRequestException('Utilizador não encontrado');

    const limits = this.getLimits(user.kycTier);

    if (newBalance > limits.maxBalance) {
      throw new ForbiddenException(
        `Saldo máximo excedido. O seu tier (${user.kycTier}) permite até ${limits.maxBalance.toLocaleString('pt-AO')} Kz.`
      );
    }
  }

  // ── Notificações KYC ──

  private async notifyKycApproved(user: UserEntity, tier: KycTier): Promise<void> {
    const limits = this.getLimits(tier);

    try {
      await this.emailService.send({
        to: user.email,
        subject: 'KYC Aprovado — UriTech',
        text: `Olá ${user.name},\n\nA sua verificação de identidade (KYC) foi aprovada com sucesso!\n\nTier atribuído: ${tier.toUpperCase()}\nLimite diário de top-up: ${limits.dailyTopUpLimit.toLocaleString('pt-AO')} Kz\nLimite diário de transferência: ${limits.dailyTransferLimit.toLocaleString('pt-AO')} Kz\nSaldo máximo: ${limits.maxBalance.toLocaleString('pt-AO')} Kz\n\nObrigado por usar a UriTech.`,
        html: this.buildKycEmailHtml(
          user.name,
          'Verificação Aprovada',
          `A sua verificação de identidade (KYC) foi aprovada com sucesso!`,
          [
            { label: 'Tier', value: tier.toUpperCase() },
            { label: 'Top-up diário', value: `${limits.dailyTopUpLimit.toLocaleString('pt-AO')} Kz` },
            { label: 'Transferência diária', value: `${limits.dailyTransferLimit.toLocaleString('pt-AO')} Kz` },
            { label: 'Pagamento diário', value: `${limits.dailyPaymentLimit.toLocaleString('pt-AO')} Kz` },
            { label: 'Levantamento diário', value: `${limits.dailyWithdrawLimit.toLocaleString('pt-AO')} Kz` },
            { label: 'Saldo máximo', value: `${limits.maxBalance.toLocaleString('pt-AO')} Kz` },
          ],
          '#10B981',
        ),
      });
    } catch (err) {
      this.logger.warn(`Falha ao enviar email de KYC aprovado: ${err}`);
    }

    try {
      await this.notificationsService.sendToUser(user.id, {
        title: 'KYC Aprovado',
        body: `A sua verificação foi aprovada! Tier: ${tier.toUpperCase()}`,
        data: { type: 'kyc_approved', tier },
      });
    } catch (err) {
      this.logger.warn(`Falha ao enviar push de KYC aprovado: ${err}`);
    }
  }

  private async notifyKycRejected(user: UserEntity, reason: string): Promise<void> {
    try {
      await this.emailService.send({
        to: user.email,
        subject: 'KYC Rejeitado — UriTech',
        text: `Olá ${user.name},\n\nLamentamos informar que a sua verificação de identidade (KYC) foi rejeitada.\n\nMotivo: ${reason}\n\nPor favor submeta novamente os seus documentos através da app.`,
        html: this.buildKycEmailHtml(
          user.name,
          'Verificação Rejeitada',
          `Lamentamos informar que a sua verificação de identidade (KYC) foi rejeitada.`,
          [{ label: 'Motivo', value: reason }],
          '#EF4444',
        ),
      });
    } catch (err) {
      this.logger.warn(`Falha ao enviar email de KYC rejeitado: ${err}`);
    }

    try {
      await this.notificationsService.sendToUser(user.id, {
        title: 'KYC Rejeitado',
        body: `Motivo: ${reason}. Por favor submeta novamente.`,
        data: { type: 'kyc_rejected', reason },
      });
    } catch (err) {
      this.logger.warn(`Falha ao enviar push de KYC rejeitado: ${err}`);
    }
  }

  private async notifyKycExpired(user: UserEntity): Promise<void> {
    try {
      await this.emailService.send({
        to: user.email,
        subject: 'KYC Expirado — UriTech',
        text: `Olá ${user.name},\n\nA sua verificação de identidade (KYC) expirou.\n\nPara continuar a usar todos os serviços, por favor renove a sua verificação através da app.`,
        html: this.buildKycEmailHtml(
          user.name,
          'Verificação Expirada',
          `A sua verificação de identidade (KYC) expirou.`,
          [{ label: 'Acção necessária', value: 'Renove a sua verificação através da app' }],
          '#F59E0B',
        ),
      });
    } catch (err) {
      this.logger.warn(`Falha ao enviar email de KYC expirado: ${err}`);
    }

    try {
      await this.notificationsService.sendToUser(user.id, {
        title: 'KYC Expirado',
        body: 'A sua verificação expirou. Renove agora para continuar a usar os serviços.',
        data: { type: 'kyc_expired' },
      });
    } catch (err) {
      this.logger.warn(`Falha ao enviar push de KYC expirado: ${err}`);
    }
  }

  private buildKycEmailHtml(
    name: string,
    title: string,
    message: string,
    details: { label: string; value: string }[],
    accentColor: string,
  ): string {
    const detailsHtml = details
      .map((d) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">${d.label}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${d.value}</td></tr>`)
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 40px 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #4F46E5; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; color: #fff; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin-bottom: 12px; color: #111; }
    p { color: #444; line-height: 1.6; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">UriTech</div>
    <div class="badge" style="background:${accentColor};">${title}</div>
    <h1>Olá, ${name}!</h1>
    <p>${message}</p>
    <table>${detailsHtml}</table>
    <div class="footer">
      UriTech — Tecnologia para Angola<br>
      Se não solicitou esta verificação, contacte o suporte.
    </div>
  </div>
</body>
</html>`;
  }
}
