import { INestApplication, Module, ExecutionContext, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { WalletController } from '~/wallet/wallet.controller';
import { WalletService } from '~/wallet/wallet.service';
import { JwtAuthGuard } from '~/auth/jwt-auth.guard';
import { FinancialThrottlerGuard } from '~/common/guards/financial-throttler.guard';
import { RedisService } from '~/redis/redis.service';
import { MockRedisService } from './utils/mock-redis.service';

const mockUser = { sub: 'user-1', userId: 'user-1', email: 'teste@uritech.com', role: 'user' };

@Module({
  controllers: [WalletController],
  providers: [
    { provide: WalletService, useValue: null },
    { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
    { provide: FinancialThrottlerGuard, useValue: { canActivate: () => true } },
    { provide: RedisService, useValue: null },
  ],
})
class TestWalletModule {}

describe('WalletController (e2e)', () => {
  let app: INestApplication;
  let mockRedis: MockRedisService;
  let walletService: jest.Mocked<WalletService>;
  let jwtService: JwtService;
  let request: ReturnType<typeof supertest>;
  let accessToken: string;

  beforeAll(async () => {
    mockRedis = new MockRedisService();

    const walletServiceMock = {
      getSummary: jest.fn(),
      getTransactions: jest.fn(),
      topUp: jest.fn().mockImplementation((_userId: string, amount: number) => {
        if (amount <= 0) throw new BadRequestException('Valor inválido');
        return Promise.resolve({ balance: 15000, currency: 'AOA', mask: '**** 4291', transactions: [] });
      }),
      transfer: jest.fn(),
      pay: jest.fn(),
      withdraw: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [TestWalletModule],
    })
      .overrideProvider(WalletService)
      .useValue(walletServiceMock)
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideProvider(FinancialThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use((req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    });
    await app.init();

    walletService = app.get(WalletService) as any;
    jwtService = new JwtService({ secret: 'test-secret' });
    request = supertest(app.getHttpServer());

    accessToken = jwtService.sign(mockUser);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    mockRedis.clear();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/wallet', () => {
    it('devolve resumo da carteira', async () => {
      walletService.getSummary.mockResolvedValue({
        balance: 10000,
        currency: 'AOA',
        mask: '**** 4291',
        transactions: [],
      });

      const res = await request
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.balance).toBe(10000);
      expect(res.body.currency).toBe('AOA');
    });
  });

  describe('POST /api/v1/wallet/topup', () => {
    it('carrega saldo com sucesso', async () => {
      const res = await request
        .post('/api/v1/wallet/topup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 5000 })
        .expect(201);

      expect(res.body.balance).toBe(15000);
    });

    it('rejeita valor inválido', async () => {
      await request
        .post('/api/v1/wallet/topup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: -100 })
        .expect(400);
    });
  });

  describe('POST /api/v1/wallet/transfer', () => {
    it('transfere saldo com sucesso', async () => {
      walletService.transfer.mockResolvedValue({
        balance: 8000,
        currency: 'AOA',
        mask: '**** 4291',
        transactions: [],
      });

      const res = await request
        .post('/api/v1/wallet/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ toEmail: 'maria@uritech.com', amount: 2000 })
        .expect(201);

      expect(res.body.balance).toBe(8000);
    });
  });

  describe('POST /api/v1/wallet/withdraw', () => {
    it('saca saldo com sucesso', async () => {
      walletService.withdraw.mockResolvedValue({
        balance: 5000,
        currency: 'AOA',
        mask: '**** 4291',
        transactions: [],
      });

      const res = await request
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 5000 })
        .expect(201);

      expect(res.body.balance).toBe(5000);
    });
  });

  describe('POST /api/v1/wallet/pay', () => {
    it('efectua pagamento com sucesso', async () => {
      walletService.pay.mockResolvedValue({
        balance: 7000,
        currency: 'AOA',
        mask: '**** 4291',
        transactions: [],
      });

      const res = await request
        .post('/api/v1/wallet/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 3000, description: 'Pagamento teste' })
        .expect(201);

      expect(res.body.balance).toBe(7000);
    });
  });
});
