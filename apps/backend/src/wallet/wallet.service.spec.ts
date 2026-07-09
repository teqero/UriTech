import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UsersService } from '../users/users.service';

describe('WalletService', () => {
  let service: WalletService;
  const usersService = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(WalletService);
    await service.onModuleInit();
  });

  it('pay debita saldo demo do João', async () => {
    const before = await service.getSummary('2');
    const after = await service.pay('2', 1500, 'Teste UriPay');
    expect(after.balance).toBe(before.balance - 1500);
  });

  it('pay falha com saldo insuficiente', async () => {
    await expect(service.pay('2', 9_999_999_999, 'Teste')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('topUp aumenta saldo', async () => {
    const before = await service.getSummary('2');
    const after = await service.topUp('2', 500);
    expect(after.balance).toBe(before.balance + 500);
  });
});
