import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { AuditLogService } from '../common/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { KycService } from '../kyc/kyc.service';
import { WalletEntity } from '../database/entities/wallet.entity';
import { EscrowHoldEntity } from '../database/entities/escrow-hold.entity';
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
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
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

  const kycService = {
    validateTransaction: jest.fn().mockResolvedValue(undefined),
    validateMaxBalance: jest.fn().mockResolvedValue(undefined),
  };

  const mockEscrowRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ ...data, id: 'esc-1' })),
    create: jest.fn((data) => data),
  };

  function mockTransaction() {
    return jest.fn(async (cb: (mgr: unknown) => Promise<unknown>) => {
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === WalletEntity) return mockWalletRepo;
          if (entity === WalletTransactionEntity) return mockTxRepo;
          if (entity === EscrowHoldEntity) return mockEscrowRepo;
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
        { provide: KycService, useValue: kycService },
        { provide: getRepositoryToken(WalletEntity), useValue: mockWalletRepo },
        { provide: getRepositoryToken(WalletTransactionEntity), useValue: mockTxRepo },
        { provide: getRepositoryToken(EscrowHoldEntity), useValue: mockEscrowRepo },
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

  it('reverse cria entrada compensatória e ajusta saldo', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 5000, currency: 'AOA' } as WalletEntity);
    mockTxRepo.findOne.mockResolvedValue({
      id: 'tx-original',
      userId: '2',
      walletId: 'w-1',
      type: 'payment',
      amount: -1500,
      balanceAfter: 5000,
      description: 'Pagamento teste',
      createdAt: new Date(),
    });
    // Nenhuma reversão existente
    mockTxRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });

    const before = await service.getSummary('2');
    const after = await service.reverse('2', 'tx-original', 'Fraude confirmada');
    expect(after.balance).toBe(before.balance + 1500);
  });

  it('reverse falha se a transação já foi revertida', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 5000, currency: 'AOA' } as WalletEntity);
    mockTxRepo.findOne.mockResolvedValue({
      id: 'tx-original',
      userId: '2',
      walletId: 'w-1',
      type: 'payment',
      amount: -1500,
      balanceAfter: 5000,
      description: 'Pagamento teste',
      createdAt: new Date(),
    });
    // Já existe reversão
    mockTxRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'tx-reversal' }),
    });

    await expect(service.reverse('2', 'tx-original', 'Tentativa dupla')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('holdInEscrow debita o cliente e cria hold', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 10000, currency: 'AOA' } as WalletEntity);
    mockEscrowRepo.findOne.mockResolvedValue(null);

    const hold = await service.holdInEscrow('2', 'order-1', 3000, 'Pedido teste', 'vendor-9');

    expect(hold.status).toBe('held');
    expect(hold.amount).toBe(3000);
    expect(hold.vendorId).toBe('vendor-9');
    const wallet = walletStore.get('2');
    expect(Number(wallet?.balance)).toBe(7000);
  });

  it('holdInEscrow falha com saldo insuficiente', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 100, currency: 'AOA' } as WalletEntity);
    mockEscrowRepo.findOne.mockResolvedValue(null);

    await expect(service.holdInEscrow('2', 'order-2', 9999, 'Pedido caro')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('releaseEscrow credita o vendor e marca released', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 7000, currency: 'AOA' } as WalletEntity);
    const held = {
      id: 'esc-1',
      orderId: 'order-1',
      userId: '2',
      vendorId: 'vendor-9',
      amount: 3000,
      currency: 'AOA',
      status: 'held',
      description: 'Pedido teste',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockEscrowRepo.findOne.mockResolvedValue({ ...held });

    const result = await service.releaseEscrow('order-1');

    expect(result.status).toBe('released');
    const vendorWallet = walletStore.get('vendor-9');
    expect(Number(vendorWallet?.balance)).toBe(3000);
  });

  it('refundEscrow devolve o valor ao cliente e marca refunded', async () => {
    walletStore.set('2', { id: 'w-1', userId: '2', balance: 7000, currency: 'AOA' } as WalletEntity);
    const held = {
      id: 'esc-1',
      orderId: 'order-1',
      userId: '2',
      vendorId: 'vendor-9',
      amount: 3000,
      currency: 'AOA',
      status: 'held',
      description: 'Pedido teste',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockEscrowRepo.findOne.mockResolvedValue({ ...held });

    const result = await service.refundEscrow('order-1', 'Pedido cancelado');

    expect(result.status).toBe('refunded');
    const wallet = walletStore.get('2');
    expect(Number(wallet?.balance)).toBe(10000);
  });
});
