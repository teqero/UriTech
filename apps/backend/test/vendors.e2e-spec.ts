import { INestApplication, Module, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { VendorsController } from '~/vendors/vendors.controller';
import { VendorsService } from '~/vendors/vendors.service';
import { UsersService } from '~/users/users.service';
import { JwtAuthGuard } from '~/auth/jwt-auth.guard';
import { RolesGuard } from '~/auth/roles.guard';
import { RedisService } from '~/redis/redis.service';
import { MockRedisService } from './utils/mock-redis.service';

const mockAdmin = { sub: 'admin-1', userId: 'admin-1', email: 'admin@uritech.com', role: 'admin' };

@Module({
  controllers: [VendorsController],
  providers: [
    { provide: VendorsService, useValue: null },
    { provide: UsersService, useValue: null },
    { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
    { provide: RolesGuard, useValue: { canActivate: () => true } },
    { provide: RedisService, useValue: null },
  ],
})
class TestVendorsModule {}

describe('VendorsController (e2e)', () => {
  let app: INestApplication;
  let vendorsService: any;
  let usersService: any;
  let request: ReturnType<typeof supertest>;
  let jwtService: JwtService;

  const mockVendor: any = {
    id: 'vendor-1',
    userId: 'user-vendor-1',
    businessName: 'Kero Kilamba',
    address: 'Rua Principal, Kilamba',
    city: 'Luanda',
    country: 'Angola',
    isOpen: true,
  };

  beforeAll(async () => {
    const vendorsServiceMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      toggleOpen: jest.fn(),
    };

    const usersServiceMock = {
      create: jest.fn().mockResolvedValue({ id: 'user-vendor-1', name: 'Kero Kilamba' }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [TestVendorsModule],
    })
      .overrideProvider(VendorsService)
      .useValue(vendorsServiceMock)
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

    vendorsService = app.get(VendorsService);
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

  describe('GET /api/v1/vendors', () => {
    it('lista todos os lojistas (público)', async () => {
      vendorsService.findAll.mockResolvedValue([mockVendor]);

      const res = await request.get('/api/v1/vendors').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/vendors/:id', () => {
    it('devolve detalhes do lojista', async () => {
      vendorsService.findById.mockResolvedValue(mockVendor);

      const res = await request.get('/api/v1/vendors/vendor-1').expect(200);

      expect(res.body.businessName).toBe('Kero Kilamba');
    });
  });

  describe('POST /api/v1/vendors', () => {
    it('admin cria lojista', async () => {
      vendorsService.create.mockResolvedValue(mockVendor);

      const res = await request
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${jwtService.sign(mockAdmin)}`)
        .send({
          storeName: 'Kero Kilamba',
          email: 'kero@uritech.com',
          phone: '+244923333444',
          storeAddress: 'Rua Principal, Kilamba',
        })
        .expect(201);

      expect(res.body.businessName).toBe('Kero Kilamba');
    });
  });

  describe('PATCH /api/v1/vendors/:id/toggle', () => {
    it('admin abre/fecha loja', async () => {
      vendorsService.toggleOpen.mockResolvedValue({ ...mockVendor, isOpen: false } as any);

      const res = await request
        .patch('/api/v1/vendors/vendor-1/toggle')
        .set('Authorization', `Bearer ${jwtService.sign(mockAdmin)}`)
        .expect(200);

      expect(res.body.isOpen).toBe(false);
    });
  });
});
