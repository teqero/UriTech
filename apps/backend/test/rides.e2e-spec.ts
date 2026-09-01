import { INestApplication, Module, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { RidesController } from '~/rides/rides.controller';
import { RidesService } from '~/rides/rides.service';
import { WalletService } from '~/wallet/wallet.service';
import { JwtAuthGuard } from '~/auth/jwt-auth.guard';
import { NotificationsService } from '~/notifications/notifications.service';
import { RedisService } from '~/redis/redis.service';
import { MockRedisService } from './utils/mock-redis.service';

const mockUser = { sub: 'user-1', userId: 'user-1', email: 'joao@uritech.com', role: 'user' };
const mockDriver = { sub: 'driver-1', userId: 'driver-1', email: 'budi@uritech.com', role: 'driver' };

@Module({
  controllers: [RidesController],
  providers: [
    { provide: RidesService, useValue: null },
    { provide: WalletService, useValue: null },
    { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
    { provide: NotificationsService, useValue: { notifyRideUpdate: jest.fn(), sendToUser: jest.fn() } },
    { provide: RedisService, useValue: null },
  ],
})
class TestRidesModule {}

describe('RidesController (e2e)', () => {
  let app: INestApplication;
  let ridesService: any;
  let walletService: any;
  let request: ReturnType<typeof supertest>;
  let jwtService: JwtService;

  const mockRide: any = {
    id: 'ride-1',
    userId: 'user-1',
    driverId: undefined,
    status: 'searching',
    mode: 'taxi',
    pickup: { latitude: -8.8368, longitude: 13.2343, address: 'Talatona' },
    destination: { latitude: -8.8147, longitude: 13.2302, address: 'Benfica' },
    fare: 2500,
    distance: 5000,
    duration: 900,
    vehicleType: 'standard',
    createdAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const ridesServiceMock = {
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findByDriver: jest.fn(),
      findByStatus: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };

    const walletServiceMock = {
      pay: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [TestRidesModule],
    })
      .overrideProvider(RidesService)
      .useValue(ridesServiceMock)
      .overrideProvider(WalletService)
      .useValue(walletServiceMock)
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = req.headers['x-mock-role'] === 'driver' ? mockDriver : mockUser;
          return true;
        },
      })
      .overrideProvider(RedisService)
      .useValue(new MockRedisService())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    ridesService = app.get(RidesService);
    walletService = app.get(WalletService);
    jwtService = new JwtService({ secret: 'test-secret' });
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/rides', () => {
    it('lista corridas do utilizador', async () => {
      ridesService.findByUser.mockResolvedValue([mockRide]);

      const res = await request
        .get('/api/v1/rides')
        .set('Authorization', `Bearer ${jwtService.sign(mockUser)}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(ridesService.findByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /api/v1/rides/:id', () => {
    it('devolve detalhes da corrida', async () => {
      ridesService.findById.mockResolvedValue(mockRide);

      const res = await request.get('/api/v1/rides/ride-1').expect(200);

      expect(res.body.id).toBe('ride-1');
    });
  });

  describe('POST /api/v1/rides', () => {
    it('solicita corrida com sucesso', async () => {
      ridesService.create.mockResolvedValue(mockRide);

      const res = await request
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${jwtService.sign(mockUser)}`)
        .send({
          mode: 'taxi',
          pickup: { latitude: -8.8368, longitude: 13.2343, address: 'Talatona' },
          destination: { latitude: -8.8147, longitude: 13.2302, address: 'Benfica' },
          fare: 2500,
          distance: 5000,
          duration: 900,
          vehicleType: 'standard',
        })
        .expect(201);

      expect(res.body.status).toBe('searching');
    });
  });

  describe('PATCH /api/v1/rides/:id/status', () => {
    it('driver aceita corrida searching', async () => {
      ridesService.findById.mockResolvedValue(mockRide);
      ridesService.updateStatus.mockResolvedValue({ ...mockRide, status: 'driver_found', driverId: 'driver-1' } as any);

      const res = await request
        .patch('/api/v1/rides/ride-1/status')
        .set('Authorization', `Bearer ${jwtService.sign(mockDriver)}`)
        .set('x-mock-role', 'driver')
        .send({ status: 'driver_found' })
        .expect(200);

      expect(res.body.status).toBe('driver_found');
    });

    it('utilizador cancela corrida', async () => {
      ridesService.findById.mockResolvedValue(mockRide);
      ridesService.updateStatus.mockResolvedValue({ ...mockRide, status: 'cancelled' } as any);

      const res = await request
        .patch('/api/v1/rides/ride-1/status')
        .set('Authorization', `Bearer ${jwtService.sign(mockUser)}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(res.body.status).toBe('cancelled');
    });

    it('rejeita driver a aceitar corrida já atribuída', async () => {
      ridesService.findById.mockResolvedValue({ ...mockRide, driverId: 'outro-driver' } as any);

      await request
        .patch('/api/v1/rides/ride-1/status')
        .set('Authorization', `Bearer ${jwtService.sign(mockDriver)}`)
        .set('x-mock-role', 'driver')
        .send({ status: 'driver_found' })
        .expect(403);
    });
  });
});
