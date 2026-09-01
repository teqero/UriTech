import { INestApplication, Module, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { DriversController } from '~/drivers/drivers.controller';
import { DriversService } from '~/drivers/drivers.service';
import { UsersService } from '~/users/users.service';
import { JwtAuthGuard } from '~/auth/jwt-auth.guard';
import { RolesGuard } from '~/auth/roles.guard';
import { RedisService } from '~/redis/redis.service';
import { MockRedisService } from './utils/mock-redis.service';

const mockAdmin = { sub: 'admin-1', userId: 'admin-1', email: 'admin@uritech.com', role: 'admin' };

@Module({
  controllers: [DriversController],
  providers: [
    { provide: DriversService, useValue: null },
    { provide: UsersService, useValue: null },
    { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
    { provide: RolesGuard, useValue: { canActivate: () => true } },
    { provide: RedisService, useValue: null },
  ],
})
class TestDriversModule {}

describe('DriversController (e2e)', () => {
  let app: INestApplication;
  let driversService: any;
  let usersService: any;
  let request: ReturnType<typeof supertest>;
  let jwtService: JwtService;

  const mockDriver: any = {
    id: 'driver-1',
    userId: 'user-driver-1',
    name: 'Budi Santoso',
    phone: '+244912111222',
    vehicleType: 'moto',
    vehiclePlate: 'LD-123-AB',
    isOnline: true,
  };

  beforeAll(async () => {
    const driversServiceMock = {
      findAll: jest.fn(),
      findOnline: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      toggleOnline: jest.fn(),
      updateLocation: jest.fn(),
    };

    const usersServiceMock = {
      create: jest.fn().mockResolvedValue({ id: 'user-driver-1', name: 'Budi Santoso' }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [TestDriversModule],
    })
      .overrideProvider(DriversService)
      .useValue(driversServiceMock)
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .overrideProvider(RolesGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          return req.user?.role === 'admin';
        },
      })
      .overrideProvider(RedisService)
      .useValue(new MockRedisService())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    driversService = app.get(DriversService);
    usersService = app.get(UsersService);
    jwtService = new JwtService({ secret: 'test-secret' });
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/drivers', () => {
    it('lista todos os motoristas (público)', async () => {
      driversService.findAll.mockResolvedValue([mockDriver]);

      const res = await request.get('/api/v1/drivers').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/drivers/online', () => {
    it('lista motoristas online (público)', async () => {
      driversService.findOnline.mockResolvedValue([mockDriver]);

      const res = await request.get('/api/v1/drivers/online').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/drivers', () => {
    it('admin cria motorista', async () => {
      driversService.create.mockResolvedValue(mockDriver);

      const res = await request
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${jwtService.sign(mockAdmin)}`)
        .send({
          name: 'Budi Santoso',
          email: 'budi@uritech.com',
          phone: '+244912111222',
          vehicleType: 'moto',
          vehiclePlate: 'LD-123-AB',
        })
        .expect(201);

      expect(res.body.name).toBe('Budi Santoso');
    });
  });

  describe('PATCH /api/v1/drivers/:id/toggle', () => {
    it('admin alterna estado online', async () => {
      driversService.toggleOnline.mockResolvedValue({ ...mockDriver, isOnline: false } as any);

      const res = await request
        .patch('/api/v1/drivers/driver-1/toggle')
        .set('Authorization', `Bearer ${jwtService.sign(mockAdmin)}`)
        .expect(200);

      expect(res.body.isOnline).toBe(false);
    });
  });
});
