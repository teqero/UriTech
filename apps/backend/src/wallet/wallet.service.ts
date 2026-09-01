import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WalletSummary, WalletTransaction, WalletTransactionType } from '@uritech/shared';
import { Repository } from 'typeorm';
import { AuditLogService } from '../common/audit-log.service';
import { WalletEntity } from '../database/entities/wallet.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { KycService } from '../kyc/kyc.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
    private readonly kycService: KycService,
    @InjectRepository(WalletEntity)
    private readonly walletsRepo: Repository<WalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,
  ) {}

  private maskForUser(userId: string): string {
    const tail = userId.replace(/-/g, '').slice(-4);
    return `**** ${tail || '4291'}`;
  }

  private toTransaction(row: WalletTransactionEntity): WalletTransaction {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      amount: Number(row.amount),
      balanceAfter: Number(row.balanceAfter),
      description: row.description,
      counterpartyEmail: row.counterpartyEmail,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async ensureWallet(userId: string, initialBalance = 0) {
    let row = await this.walletsRepo.findOne({ where: { userId } });
    if (!row) {
      row = await this.walletsRepo.save(
        this.walletsRepo.create({ userId, balance: initialBalance, currency: 'AOA' }),
      );
    }
    return row;
  }

  async getSummary(userId: string, txLimit = 20): Promise<WalletSummary> {
    const wallet = await this.ensureWallet(userId);
    const transactions = await this.getTransactions(userId, txLimit);
    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      mask: this.maskForUser(userId),
      transactions,
    };
  }

  async getTransactions(userId: string, limit = 20): Promise<WalletTransaction[]> {
    const rows = await this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((r) => this.toTransaction(r));
  }

  private async recordTx(
    manager: Repository<WalletTransactionEntity>['manager'],
    userId: string,
    walletId: string,
    type: WalletTransactionType,
    amount: number,
    balanceAfter: number,
    description: string,
    counterpartyEmail?: string,
  ): Promise<WalletTransaction> {
    const saved = await manager.save(WalletTransactionEntity, {
      userId,
      walletId,
      type,
      amount,
      balanceAfter,
      description,
      counterpartyEmail,
    });
    return this.toTransaction(saved);
  }

  async topUp(userId: string, amount: number): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');

    // Validar KYC
    await this.kycService.validateTransaction(userId, 'topup', amount);

    const result = await this.walletsRepo.manager.transaction(async (manager) => {
      const walletRepo = manager.getRepository(WalletEntity);
      let wallet = await walletRepo.findOne({ where: { userId } });
      if (!wallet) {
        wallet = await walletRepo.save(walletRepo.create({ userId, balance: 0, currency: 'AOA' }));
      }
      const nextBalance = Number(wallet.balance) + amount;

      // Validar saldo máximo
      await this.kycService.validateMaxBalance(userId, nextBalance);

      await walletRepo.update({ userId }, { balance: nextBalance });
      await this.recordTx(manager, userId, wallet.id, 'topup', amount, nextBalance, 'Carregamento UriPay');
      return this.getSummary(userId);
    });

    void this.auditLogService.log({
      userId,
      action: 'topup',
      amount,
      balanceAfter: result.balance,
      description: 'Carregamento UriPay',
    });

    return result;
  }

  async transfer(fromUserId: string, toEmail: string, amount: number): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');

    // Validar KYC
    await this.kycService.validateTransaction(fromUserId, 'transfer', amount);

    const recipient = await this.usersService.findByEmail(toEmail);
    if (!recipient) throw new NotFoundException('Destinatário não encontrado');
    if (recipient.id === fromUserId) throw new BadRequestException('Não pode transferir para si');

    const result = await this.walletsRepo.manager.transaction(async (manager) => {
      const walletRepo = manager.getRepository(WalletEntity);

      const fromWallet = await walletRepo.findOne({ where: { userId: fromUserId } });
      if (!fromWallet) throw new BadRequestException('Carteira de origem não encontrada');
      if (Number(fromWallet.balance) < amount) throw new BadRequestException('Saldo insuficiente');

      let toWallet = await walletRepo.findOne({ where: { userId: recipient.id } });
      if (!toWallet) {
        toWallet = await walletRepo.save(walletRepo.create({ userId: recipient.id, balance: 0, currency: 'AOA' }));
      }

      const fromBalance = Number(fromWallet.balance) - amount;
      const toBalance = Number(toWallet.balance) + amount;

      await walletRepo.update({ userId: fromUserId }, { balance: fromBalance });
      await walletRepo.update({ userId: recipient.id }, { balance: toBalance });

      await this.recordTx(
        manager,
        fromUserId,
        fromWallet.id,
        'transfer_out',
        -amount,
        fromBalance,
        `Transferência para ${toEmail}`,
        toEmail,
      );
      await this.recordTx(
        manager,
        recipient.id,
        toWallet.id,
        'transfer_in',
        amount,
        toBalance,
        `Transferência recebida`,
        toEmail,
      );

      return this.getSummary(fromUserId);
    });

    // Notificar destinatário fora da transação para não bloquear
    void this.notificationsService.sendToUser(recipient.id, {
      title: 'Transferência recebida',
      body: `Recebeu ${amount.toLocaleString('pt-AO')} Kz de ${toEmail}`,
      data: { type: 'wallet_transfer', amount: String(amount), fromEmail: toEmail },
    });

    // Audit log — remetente
    void this.auditLogService.log({
      userId: fromUserId,
      action: 'transfer_out',
      amount: -amount,
      balanceAfter: result.balance,
      description: `Transferência para ${toEmail}`,
      counterpartyEmail: toEmail,
    });

    // Audit log — destinatário
    void this.auditLogService.log({
      userId: recipient.id,
      action: 'transfer_in',
      amount,
      balanceAfter: result.balance + amount,
      description: 'Transferência recebida',
      counterpartyEmail: toEmail,
    });

    return result;
  }

  async pay(userId: string, amount: number, description: string): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');

    // Validar KYC
    await this.kycService.validateTransaction(userId, 'payment', amount);

    const result = await this.walletsRepo.manager.transaction(async (manager) => {
      const walletRepo = manager.getRepository(WalletEntity);
      const wallet = await walletRepo.findOne({ where: { userId } });
      if (!wallet) throw new BadRequestException('Carteira não encontrada');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Saldo UriPay insuficiente');

      const nextBalance = Number(wallet.balance) - amount;
      await walletRepo.update({ userId }, { balance: nextBalance });
      await this.recordTx(manager, userId, wallet.id, 'payment', -amount, nextBalance, description);
      return this.getSummary(userId);
    });

    void this.auditLogService.log({
      userId,
      action: 'payment',
      amount: -amount,
      balanceAfter: result.balance,
      description,
    });

    return result;
  }

  async withdraw(userId: string, amount: number): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');

    // Validar KYC
    await this.kycService.validateTransaction(userId, 'withdraw', amount);

    const result = await this.walletsRepo.manager.transaction(async (manager) => {
      const walletRepo = manager.getRepository(WalletEntity);
      const wallet = await walletRepo.findOne({ where: { userId } });
      if (!wallet) throw new BadRequestException('Carteira não encontrada');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Saldo insuficiente');

      const nextBalance = Number(wallet.balance) - amount;
      await walletRepo.update({ userId }, { balance: nextBalance });
      await this.recordTx(manager, userId, wallet.id, 'withdraw', -amount, nextBalance, 'Levantamento Multicaixa');
      return this.getSummary(userId);
    });

    void this.auditLogService.log({
      userId,
      action: 'withdraw',
      amount: -amount,
      balanceAfter: result.balance,
      description: 'Levantamento Multicaixa',
    });

    return result;
  }
}
