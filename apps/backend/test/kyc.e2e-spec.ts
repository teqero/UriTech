import { INestApplication, ExecutionContext, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { KycController } from '~/kyc/kyc.controller';
import { KycService } from '~/kyc/kyc.service';
import { StorageService } from '~/storage/storage.service';
import { RedisService } from '~/redis/redis.service';
import { JwtAuthGuard } from '~/auth/jwt-auth.guard';
import { RolesGuard } from '~/auth/roles.guard';

const UUID_USER = '550e8400-e29b-41d4-a716-446655440001';
const UUID_ADMIN = '550e8400-e29b-41d4-a716-446655440002';
const UUID_TARGET = '550e8400-e29b-41d4-a716-446655440003';

const mockUser = { sub: UUID_USER, userId: UUID_USER, email: 'teste@uritech.com', role: 'user', kycTier: 'verified' };
const mockAdmin = { sub: UUID_ADMIN, userId: UUID_ADMIN, email: 'admin@uritech.com', role: 'admin', kycTier: 'verified' };

describe('KycController (e2e)', () => {
  let app: INestApplication;
  let kycService: jest.Mocked<KycService>;
  let storageService: jest.Mocked<StorageService>;
  let jwtService: JwtService;
  let request: ReturnType<typeof supertest>;
  let userToken: string;
  let adminToken: string;
  let redisCounters: Map<string, number>;

  beforeAll(async () => {
    redisCounters = new Map();

    const kycServiceMock = {
      getAllLimits: jest.fn().mockReturnValue([
        { tier: 'unverified', dailyTopUpLimit: 0, dailyTransferLimit: 0, dailyPaymentLimit: 0, dailyWithdrawLimit: 0, maxBalance: 0, requiresKyc: true },
        { tier: 'basic', dailyTopUpLimit: 50_000, dailyTransferLimit: 25_000, dailyPaymentLimit: 25_000, dailyWithdrawLimit: 25_000, maxBalance: 200_000, requiresKyc: true },
        { tier: 'verified', dailyTopUpLimit: 500_000, dailyTransferLimit: 250_000, dailyPaymentLimit: 500_000, dailyWithdrawLimit: 250_000, maxBalance: 2_000_000, requiresKyc: true },
        { tier: 'premium', dailyTopUpLimit: 5_000_000, dailyTransferLimit: 2_500_000, dailyPaymentLimit: 5_000_000, dailyWithdrawLimit: 2_500_000, maxBalance: 50_000_000, requiresKyc: true },
      ]),
      getUserKycStatus: jest.fn().mockResolvedValue({
        userId: UUID_USER,
        name: 'Teste',
        email: 'teste@uritech.com',
        tier: 'verified',
        status: 'approved',
        limits: { dailyTopUpLimit: 500_000 },
      }),
      submitKyc: jest.fn().mockResolvedValue(undefined),
      renewKyc: jest.fn().mockResolvedValue(undefined),
      approveKyc: jest.fn().mockResolvedValue(undefined),
      rejectKyc: jest.fn().mockResolvedValue(undefined),
      findPendingKycs: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }),
    };

    const storageServiceMock = {
      generateKey: jest.fn().mockReturnValue('kyc/user-1/1234567890-abc123-test.jpg'),
      uploadFile: jest.fn().mockResolvedValue({
        key: 'kyc/user-1/1234567890-abc123-test.jpg',
        url: 'https://storage.uritech.com/uritech-kyc/kyc/user-1/1234567890-abc123-test.jpg',
        bucket: 'uritech-kyc',
        size: 1024,
        mimeType: 'image/jpeg',
      }),
    };

    const redisServiceMock = {
      increment: jest.fn().mockImplementation((key: string) => {
        const current = redisCounters.get(key) || 0;
        redisCounters.set(key, current + 1);
        return Promise.resolve(current + 1);
      }),
      getTtl: jest.fn().mockResolvedValue(3600),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [KycController],
      providers: [
        { provide: KycService, useValue: kycServiceMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const roles = Reflect.getMetadata('roles', context.getHandler()) || Reflect.getMetadata('roles', context.getClass());
          if (!roles || roles.length === 0) return true;
          return roles.includes(req.user?.role);
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    // Middleware para injectar user mock (evita problemas com CurrentUser decorator)
    app.use((req: any, _res: any, next: any) => {
      if (req.headers['x-mock-user'] === 'admin') {
        req.user = mockAdmin;
      } else {
        req.user = mockUser;
      }
      next();
    });

    await app.init();

    kycService = app.get(KycService) as any;
    storageService = app.get(StorageService) as any;
    jwtService = new JwtService({ secret: 'test-secret' });
    request = supertest(app.getHttpServer());

    userToken = jwtService.sign(mockUser);
    adminToken = jwtService.sign(mockAdmin);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    redisCounters.clear();
  });

  describe('GET /api/v1/kyc/limits', () => {
    it('retorna todos os limites por tier', async () => {
      const res = await request.get('/api/v1/kyc/limits').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(4);
      expect(res.body[0].tier).toBe('unverified');
      expect(res.body[2].tier).toBe('verified');
    });
  });

  describe('GET /api/v1/kyc/status', () => {
    it('retorna status KYC do utilizador autenticado', async () => {
      const res = await request
        .get('/api/v1/kyc/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.tier).toBe('verified');
      expect(res.body.status).toBe('approved');
      expect(kycService.getUserKycStatus).toHaveBeenCalledWith(UUID_USER);
    });
  });

  describe('POST /api/v1/kyc/submit', () => {
    it('submete documentos KYC com sucesso', async () => {
      const res = await request
        .post('/api/v1/kyc/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          documentType: 'bi',
          documentNumber: '006546782LA045',
          documentFrontUrl: 'https://storage.uritech.com/front.jpg',
          documentBackUrl: 'https://storage.uritech.com/back.jpg',
          selfieUrl: 'https://storage.uritech.com/selfie.jpg',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(kycService.submitKyc).toHaveBeenCalled();
    });

    it('rejeita payload incompleto', async () => {
      await request
        .post('/api/v1/kyc/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ documentType: 'bi' })
        .expect(400);
    });

    it('bloqueia após 3 submissões (rate limit)', async () => {
      const payload = {
        documentType: 'bi',
        documentNumber: '006546782LA045',
        documentFrontUrl: 'https://storage.uritech.com/front.jpg',
        documentBackUrl: 'https://storage.uritech.com/back.jpg',
        selfieUrl: 'https://storage.uritech.com/selfie.jpg',
      };

      // 3 submissões OK
      for (let i = 0; i < 3; i++) {
        await request
          .post('/api/v1/kyc/submit')
          .set('Authorization', `Bearer ${userToken}`)
          .send(payload)
          .expect(201);
      }

      // 4ª submissão deve ser bloqueada
      await request
        .post('/api/v1/kyc/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload)
        .expect(429);
    });
  });

  describe('POST /api/v1/kyc/renew', () => {
    it('renova KYC expirado com sucesso', async () => {
      const res = await request
        .post('/api/v1/kyc/renew')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          documentType: 'passport',
          documentNumber: 'AA123456',
          documentFrontUrl: 'https://storage.uritech.com/front.jpg',
          documentBackUrl: 'https://storage.uritech.com/back.jpg',
          selfieUrl: 'https://storage.uritech.com/selfie.jpg',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(kycService.renewKyc).toHaveBeenCalled();
    });

    it('rejeita payload incompleto na renovação', async () => {
      await request
        .post('/api/v1/kyc/renew')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ documentType: 'passport' })
        .expect(400);
    });
  });

  describe('POST /api/v1/kyc/upload-document', () => {
    it('faz upload de documento KYC com sucesso', async () => {
      const res = await request
        .post('/api/v1/kyc/upload-document')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'document.jpg')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.url).toBeDefined();
      expect(res.body.key).toBeDefined();
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('rejeita upload sem ficheiro', async () => {
      await request
        .post('/api/v1/kyc/upload-document')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('rejeita ficheiro demasiado grande', async () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
      await request
        .post('/api/v1/kyc/upload-document')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', bigBuffer, 'huge.jpg')
        .expect(400);
    });

    it('rejeita tipo de ficheiro não permitido', async () => {
      await request
        .post('/api/v1/kyc/upload-document')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake-pdf'), 'document.pdf')
        .expect(400);
    });
  });

  describe('GET /api/v1/kyc/admin/pending', () => {
    it('admin lista KYCs pendentes', async () => {
      const res = await request
        .get('/api/v1/kyc/admin/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-mock-user', 'admin')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(kycService.findPendingKycs).toHaveBeenCalledWith(1, 20);
    });

    it('admin lista KYCs pendentes com paginação customizada', async () => {
      await request
        .get('/api/v1/kyc/admin/pending?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-mock-user', 'admin')
        .expect(200);

      expect(kycService.findPendingKycs).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('PUT /api/v1/kyc/admin/:userId/approve', () => {
    it('admin aprova KYC com tier default', async () => {
      const res = await request
        .put(`/api/v1/kyc/admin/${UUID_TARGET}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-mock-user', 'admin')
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(kycService.approveKyc).toHaveBeenCalledWith(UUID_TARGET, UUID_ADMIN, 'verified');
    });

    it('admin aprova KYC com tier premium', async () => {
      await request
        .put(`/api/v1/kyc/admin/${UUID_TARGET}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-mock-user', 'admin')
        .send({ tier: 'premium' })
        .expect(200);

      expect(kycService.approveKyc).toHaveBeenCalledWith(UUID_TARGET, UUID_ADMIN, 'premium');
    });
  });

  describe('PUT /api/v1/kyc/admin/:userId/reject', () => {
    it('admin rejeita KYC com razão', async () => {
      const res = await request
        .put(`/api/v1/kyc/admin/${UUID_TARGET}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-mock-user', 'admin')
        .send({ reason: 'Documento ilegível' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(kycService.rejectKyc).toHaveBeenCalledWith(UUID_TARGET, UUID_ADMIN, 'Documento ilegível');
    });

    it('rejeita rejeição sem razão', async () => {
      await request
        .put(`/api/v1/kyc/admin/${UUID_TARGET}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-mock-user', 'admin')
        .send({})
        .expect(400);
    });
  });
});
