import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MulticaixaReferenceEntity } from '../database/entities/multicaixa-reference.entity';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import type { InitiateMulticaixaDto, MulticaixaWebhookDto } from './dto/multicaixa.dto';

export interface PaymentTransaction {
  id: string;
  provider: 'multicaixa';
  reference: string;
  amount: number;
  currency: string;
  status: string;
  merchantRef?: string;
  userId?: string;
  receivedAt: string;
}

export interface MulticaixaInitiation {
  reference: string;
  merchantRef: string;
  amount: number;
  currency: string;
  provider: 'multicaixa';
  instructions: string;
  expiresInMinutes: number;
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  /** In-memory cache de transações processadas (só para GET /status /transactions rápidas). Não é fonte de verdade. */
  private transactions: PaymentTransaction[] = [];

  constructor(
    private readonly settingsService: SettingsService,
    private readonly walletService: WalletService,
    @InjectRepository(MulticaixaReferenceEntity)
    private readonly mcxRepo: Repository<MulticaixaReferenceEntity>,
  ) {}

  onModuleInit() {
    this.settingsService.applyMulticaixaFromEnv();
    this.settingsService.applyFirebaseFromEnv();
    const status = this.getMulticaixaStatus();
    if (status.configured) {
      this.logger.log(`Multicaixa configurado (${status.webhookUrl})`);
    }
  }

  async initiateWalletTopup(userId: string, dto: InitiateMulticaixaDto): Promise<MulticaixaInitiation> {
    const status = this.getMulticaixaStatus();
    if (process.env.NODE_ENV === 'production' && !status.configured) {
      throw new BadRequestException('Multicaixa não configurado. Defina MULTICAIXA_API_KEY e MULTICAIXA_MERCHANT_ID.');
    }
    const reference = `MCX-${Date.now().toString(36).toUpperCase()}`;
    const merchantRef = `wallet-topup:${userId}:${reference}`;
    const expiresAt = new Date(Date.now() + 15 * 60_000);

    await this.mcxRepo.save(
      this.mcxRepo.create({
        reference,
        merchantRef,
        userId,
        amount: dto.amount,
        currency: 'AOA',
        status: 'pending',
        expiresAt,
      }),
    );

    return {
      reference,
      merchantRef,
      amount: dto.amount,
      currency: 'AOA',
      provider: 'multicaixa',
      instructions:
        'Abra o Multicaixa Express, escolha Pagamentos e introduza a referência. O saldo UriPay é creditado após confirmação.',
      expiresInMinutes: 15,
    };
  }

  async simulateWalletTopup(userId: string, reference: string) {
    const pending = await this.mcxRepo.findOne({ where: { reference } });
    if (!pending) throw new NotFoundException('Referência não encontrada ou expirada');
    if (pending.userId !== userId) throw new BadRequestException('Referência de outro utilizador');
    if (pending.status !== 'pending') throw new BadRequestException('Referência já processada');

    return this.handleMulticaixaWebhook({
      reference,
      amount: Number(pending.amount),
      status: 'paid',
      merchantRef: pending.merchantRef,
      currency: 'AOA',
    });
  }

  async handleMulticaixaWebhook(payload: MulticaixaWebhookDto): Promise<PaymentTransaction> {
    this.verifyWebhookSignature(payload);

    const normalized = payload.status.toLowerCase();
    const success = ['paid', 'success', 'completed', 'approved', 'pago'].includes(normalized);

    const userId = this.parseWalletUserId(payload.merchantRef);

    /** Idempotência: se já existe referência processada com sucesso, não creditar de novo. */
    const existing = await this.mcxRepo.findOne({ where: { reference: payload.reference } });
    if (existing && existing.status === 'paid') {
      this.logger.warn(`Webhook duplicado ignorado: ref=${payload.reference}`);
      return {
        id: existing.id,
        provider: 'multicaixa',
        reference: payload.reference,
        amount: Number(payload.amount),
        currency: payload.currency ?? 'AOA',
        status: 'already_paid',
        merchantRef: payload.merchantRef,
        userId: existing.userId,
        receivedAt: new Date().toISOString(),
      };
    }

    const tx: PaymentTransaction = {
      id: existing?.id ?? `mcx-${Date.now().toString(36)}`,
      provider: 'multicaixa',
      reference: payload.reference,
      amount: payload.amount,
      currency: payload.currency ?? 'AOA',
      status: payload.status,
      merchantRef: payload.merchantRef,
      userId: userId ?? existing?.userId,
      receivedAt: new Date().toISOString(),
    };
    this.transactions.unshift(tx);
    this.logger.log(`Multicaixa webhook: ref=${payload.reference} status=${payload.status} amount=${payload.amount}`);

    if (success) {
      this.activateMulticaixaIntegration();
      const creditUserId = userId ?? existing?.userId;
      if (creditUserId) {
        await this.walletService.topUp(creditUserId, payload.amount);
        if (existing) {
          existing.status = 'paid';
          await this.mcxRepo.save(existing);
        }
        this.logger.log(`UriPay creditado: user=${creditUserId} amount=${payload.amount}`);
      }
    }

    return tx;
  }

  private parseWalletUserId(merchantRef?: string): string | undefined {
    if (!merchantRef?.startsWith('wallet-topup:')) return undefined;
    const parts = merchantRef.split(':');
    return parts[1] || undefined;
  }

  getMulticaixaTransactions(limit = 20): PaymentTransaction[] {
    return this.transactions.slice(0, limit);
  }

  getMulticaixaStatus() {
    const integrations = this.settingsService.getIntegrations('payment');
    const multicaixa = integrations.find((i) => i.provider === 'multicaixa');
    const publicUrl = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
    const webhookUrl =
      multicaixa?.webhookUrl ??
      (publicUrl
        ? `${publicUrl}/api/v1/payments/multicaixa/webhook`
        : '/api/v1/payments/multicaixa/webhook');
    return {
      configured: Boolean(multicaixa?.apiKey || multicaixa?.merchantId || process.env.MULTICAIXA_API_KEY),
      enabled: multicaixa?.enabled ?? Boolean(process.env.MULTICAIXA_API_KEY),
      status: multicaixa?.status ?? 'inactive',
      environment: multicaixa?.environment ?? process.env.MULTICAIXA_ENV ?? 'sandbox',
      webhookUrl,
      recentTransactions: this.getMulticaixaTransactions(5),
    };
  }

  private verifyWebhookSignature(payload: MulticaixaWebhookDto) {
    const secret = this.settingsService.getMulticaixaWebhookSecret();
    if (!secret) return;
    if (!payload.signature || payload.signature !== secret) {
      throw new UnauthorizedException('Assinatura webhook Multicaixa inválida');
    }
  }

  private activateMulticaixaIntegration() {
    const integrations = this.settingsService.getIntegrations('payment');
    const multicaixa = integrations.find((i) => i.provider === 'multicaixa');
    if (multicaixa && !multicaixa.enabled) {
      this.settingsService.updateIntegration(multicaixa.id, { enabled: true });
      this.logger.log('Multicaixa Express activado após webhook confirmado');
    }
  }
}
