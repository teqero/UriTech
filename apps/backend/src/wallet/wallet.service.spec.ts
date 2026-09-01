import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { AuditLogService } from '../common/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { WalletEntity } from '../database/entities/wallet.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';

describe('WalletService', () => {
  let service: WalletService;
  let walletStore: Map<string, WalletEntity>;

  const mockWalletRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn((data) => data),
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockTxRepo = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const usersService = {
    findByEmail: jest.fn(),
  };

  const notificationsService = {
    sendToUser: jest.fn().mockResolvedValue({ sent: 1 }),
  };

  const auditLogService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  function mockTransaction() {
    return jest.fn(async (cb: (mgr: unknown) => Promise<unknown>) => {
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === WalletEntity) return mockWalletRepo;
          if (entity === WalletTransactionEntity) return mockTxRepo;
          return {};
        }),
        save: jest.fn((entity: unknown, data: unknown) => {
          if (entity === WalletTransactionEntity) return mockTxRepo.save(data);
          return mockWalletRepo.save(data);
        }),
      };
      return cb(manager);
    });
  }

  beforeEach(async () => {
    walletStore = new Map();
    mockWalletRepo.manager.transaction = mockTransaction();
    mockWalletRepo.findOne.mockImplementation(({ where }: { where: { userId: string } }) => {
      const w = walletStore.get(where.userId);
      return Promise.resolve(w ? { ...w } : undefined);
    });
    mockWalletRepo.save.mockImplementation((data: WalletEntity) => {
      if (!data.id) data.id = `w-${Date.now()}`;
      walletStore.set(data.userId, { ...data });
      return Promise.resolve({ ...data });
    });
    mockWalletRepo.update.mockImplementation(({ userId }: { userId: string }, { balance }: { balance: number }) => {
      const w = walletStore.get(userId);
      if (w) w.balance = balance;
      return Promise.resolve({});
    });
    mockTxRepo.find.mockResolvedValue([]);
    mockTxRepo.save.mockImplementation((tx) => Promise.resolve({ ...tx, id: 'tx-1', createdAt: new Date() }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: UsersService, useValue: usersService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: getRepositoryToken(WalletEntity), useValue: mockWalletRepo },
        { provide: getRepositoryToken(WalletTransactionEntity), useValue: mockTxRepo },
      ],
    }).compile();

    service = module.get(WalletService);
  });

  it('pay debita saldo', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 10000, currency: 'AOA' } as WalletEntity);

    const before = await service.getSummary('2');
    const after = await service.pay('2', 1500, 'Teste UriPay');
    expect(after.balance).toBe(before.balance - 1500);
  });

  it('pay falha com saldo insuficiente', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 100, currency: 'AOA' } as WalletEntity);

    await expect(service.pay('2', 999_999_999, 'Teste')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('topUp aumenta saldo', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 5000, currency: 'AOA' } as WalletEntity);

    const before = await service.getSummary('2');
    const after = await service.topUp('2', 500);
    expect(after.balance).toBe(before.balance + 500);
  });
});
