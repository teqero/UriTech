import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WalletSummary, WalletTransaction, WalletTransactionType } from '@uritech/shared';
import { Repository } from 'typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { WalletEntity } from '../database/entities/wallet.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { UsersService } from '../users/users.service';

type MemoryWallet = { id: string; userId: string; balance: number; currency: string };

@Injectable()
export class WalletService implements OnModuleInit {
  private memoryWallets = new Map<string, MemoryWallet>();
  private memoryTransactions: WalletTransaction[] = [];

  constructor(
    private readonly usersService: UsersService,
    @Optional()
    @InjectRepository(WalletEntity)
    private readonly walletsRepo?: Repository<WalletEntity>,
    @Optional()
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo?: Repository<WalletTransactionEntity>,
  ) {}

  private get useDb() {
    return isDatabaseEnabled() && !!this.walletsRepo && !!this.txRepo;
  }

  async onModuleInit() {
    if (this.useDb) return;
    await this.ensureWallet('2', 124500);
    this.memoryTransactions.push(
      {
        id: 'tx-demo-1',
        userId: '2',
        type: 'payment',
        amount: -1200,
        balanceAfter: 123300,
        description: 'Corrida - Centro',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tx-demo-2',
        userId: '2',
        type: 'escrow',
        amount: 45000,
        balanceAfter: 124500,
        description: 'Liberação Escrow',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    );
  }

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

  async ensureWallet(userId: string, initialBalance = 0): Promise<MemoryWallet> {
    if (this.useDb) {
      let row = await this.walletsRepo!.findOne({ where: { userId } });
      if (!row) {
        row = await this.walletsRepo!.save(
          this.walletsRepo!.create({ userId, balance: initialBalance, currency: 'AOA' }),
        );
      }
      return {
        id: row.id,
        userId: row.userId,
        balance: Number(row.balance),
        currency: row.currency,
      };
    }

    let wallet = this.memoryWallets.get(userId);
    if (!wallet) {
      wallet = {
        id: `w-${userId.slice(0, 8)}`,
        userId,
        balance: initialBalance,
        currency: 'AOA',
      };
      this.memoryWallets.set(userId, wallet);
    }
    return wallet;
  }

  async getSummary(userId: string, txLimit = 20): Promise<WalletSummary> {
    const wallet = await this.ensureWallet(userId);
    const transactions = await this.getTransactions(userId, txLimit);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
      mask: this.maskForUser(userId),
      transactions,
    };
  }

  async getTransactions(userId: string, limit = 20): Promise<WalletTransaction[]> {
    if (this.useDb) {
      const rows = await this.txRepo!.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
      return rows.map((r) => this.toTransaction(r));
    }
    return this.memoryTransactions
      .filter((t) => t.userId === userId)
      .slice(0, limit);
  }

  private async recordTx(
    userId: string,
    walletId: string,
    type: WalletTransactionType,
    amount: number,
    balanceAfter: number,
    description: string,
    counterpartyEmail?: string,
  ): Promise<WalletTransaction> {
    if (this.useDb) {
      const saved = await this.txRepo!.save(
        this.txRepo!.create({
          userId,
          walletId,
          type,
          amount,
          balanceAfter,
          description,
          counterpartyEmail,
        }),
      );
      return this.toTransaction(saved);
    }

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      type,
      amount,
      balanceAfter,
      description,
      counterpartyEmail,
      createdAt: new Date().toISOString(),
    };
    this.memoryTransactions.unshift(tx);
    return tx;
  }

  async topUp(userId: string, amount: number): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');
    const wallet = await this.ensureWallet(userId);
    const nextBalance = wallet.balance + amount;

    if (this.useDb) {
      await this.walletsRepo!.update({ userId }, { balance: nextBalance });
    } else {
      wallet.balance = nextBalance;
    }

    await this.recordTx(userId, wallet.id, 'topup', amount, nextBalance, 'Carregamento UriPay');
    return this.getSummary(userId);
  }

  async transfer(fromUserId: string, toEmail: string, amount: number): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');
    const recipient = await this.usersService.findByEmail(toEmail);
    if (!recipient) throw new NotFoundException('Destinatário não encontrado');
    if (recipient.id === fromUserId) throw new BadRequestException('Não pode transferir para si');

    const fromWallet = await this.ensureWallet(fromUserId);
    if (fromWallet.balance < amount) throw new BadRequestException('Saldo insuficiente');

    const toWallet = await this.ensureWallet(recipient.id);
    const fromBalance = fromWallet.balance - amount;
    const toBalance = toWallet.balance + amount;

    if (this.useDb) {
      await this.walletsRepo!.update({ userId: fromUserId }, { balance: fromBalance });
      await this.walletsRepo!.update({ userId: recipient.id }, { balance: toBalance });
    } else {
      fromWallet.balance = fromBalance;
      toWallet.balance = toBalance;
    }

    await this.recordTx(
      fromUserId,
      fromWallet.id,
      'transfer_out',
      -amount,
      fromBalance,
      `Transferência para ${toEmail}`,
      toEmail,
    );
    await this.recordTx(
      recipient.id,
      toWallet.id,
      'transfer_in',
      amount,
      toBalance,
      `Transferência recebida`,
      toEmail,
    );

    return this.getSummary(fromUserId);
  }

  async pay(userId: string, amount: number, description: string): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');
    const wallet = await this.ensureWallet(userId);
    if (wallet.balance < amount) throw new BadRequestException('Saldo UriPay insuficiente');

    const nextBalance = wallet.balance - amount;
    if (this.useDb) {
      await this.walletsRepo!.update({ userId }, { balance: nextBalance });
    } else {
      wallet.balance = nextBalance;
    }

    await this.recordTx(userId, wallet.id, 'payment', -amount, nextBalance, description);
    return this.getSummary(userId);
  }

  async withdraw(userId: string, amount: number): Promise<WalletSummary> {
    if (amount <= 0) throw new BadRequestException('Valor inválido');
    const wallet = await this.ensureWallet(userId);
    if (wallet.balance < amount) throw new BadRequestException('Saldo insuficiente');

    const nextBalance = wallet.balance - amount;
    if (this.useDb) {
      await this.walletsRepo!.update({ userId }, { balance: nextBalance });
    } else {
      wallet.balance = nextBalance;
    }

    await this.recordTx(userId, wallet.id, 'withdraw', -amount, nextBalance, 'Levantamento Multicaixa');
    return this.getSummary(userId);
  }

  seedDemoWallet(userId: string, balance: number) {
    if (this.useDb) return;
    const wallet = this.memoryWallets.get(userId);
    if (wallet) {
      wallet.balance = balance;
      return;
    }
    this.memoryWallets.set(userId, {
      id: `w-${userId.slice(0, 8)}`,
      userId,
      balance,
      currency: 'AOA',
    });
  }
}
