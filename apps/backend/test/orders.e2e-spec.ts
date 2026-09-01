import { INestApplication, Module, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { OrdersController } from '~/orders/orders.controller';
import { OrdersService } from '~/orders/orders.service';
import { JwtAuthGuard } from '~/auth/jwt-auth.guard';
import { NotificationsService } from '~/notifications/notifications.service';
import { RedisService } from '~/redis/redis.service';
import { MockRedisService } from './utils/mock-redis.service';

const mockUser = { sub: 'user-1', userId: 'user-1', email: 'joao@uritech.com', role: 'user' };
const mockVendor = { sub: 'vendor-1', userId: 'vendor-1', email: 'kero@uritech.com', role: 'vendor' };
const mockAdmin = { sub: 'admin-1', userId: 'admin-1', email: 'admin@uritech.com', role: 'admin' };

@Module({
  controllers: [OrdersController],
  providers: [
    { provide: OrdersService, useValue: null },
    { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
    { provide: NotificationsService, useValue: { notifyOrderUpdate: jest.fn() } },
    { provide: RedisService, useValue: null },
  ],
})
class TestOrdersModule {}

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let ordersService: any;
  let request: ReturnType<typeof supertest>;
  let jwtService: JwtService;

  const mockOrder: any = {
    id: 'order-1',
    userId: 'user-1',
    vendorId: 'vendor-1',
    status: 'novos',
    total: 7500,
    items: [{ name: 'Hambúrguer', quantity: 2, price: 3500 }],
    createdAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const ordersServiceMock = {
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findByVendor: jest.fn(),
      findById: jest.fn(),
      checkoutStore: jest.fn(),
      checkoutService: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [TestOrdersModule],
    })
      .overrideProvider(OrdersService)
      .useValue(ordersServiceMock)
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = req.headers['x-mock-role'] === 'vendor' ? mockVendor : req.headers['x-mock-role'] === 'admin' ? mockAdmin : mockUser;
          return true;
        },
      })
      .overrideProvider(RedisService)
      .useValue(new MockRedisService())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    ordersService = app.get(OrdersService);
    jwtService = new JwtService({ secret: 'test-secret' });
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/orders', () => {
    it('lista pedidos do utilizador autenticado', async () => {
      ordersService.findByUser.mockResolvedValue([mockOrder]);

      const res = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${jwtService.sign(mockUser)}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(ordersService.findByUser).toHaveBeenCalledWith('user-1');
    });

    it('lista todos os pedidos para admin', async () => {
      ordersService.findAll.mockResolvedValue([mockOrder]);

      const res = await request
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${jwtService.sign(mockAdmin)}`)
        .set('x-mock-role', 'admin')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('devolve detalhes do pedido', async () => {
      ordersService.findById.mockResolvedValue(mockOrder);

      const res = await request.get('/api/v1/orders/order-1').expect(200);

      expect(res.body.id).toBe('order-1');
    });

    it('devolve 404 para pedido inexistente', async () => {
      ordersService.findById.mockResolvedValue(null);

      await request.get('/api/v1/orders/nao-existe').expect(404);
    });
  });

  describe('POST /api/v1/orders/checkout', () => {
    it('cria pedido de loja com sucesso', async () => {
      ordersService.checkoutStore.mockResolvedValue(mockOrder);

      const res = await request
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${jwtService.sign(mockUser)}`)
        .send({
          storeId: 'store-123',
          storeName: 'Kero Kilamba',
          items: [{ name: 'Hambúrguer', quantity: 2, price: 3500, menuItemId: 'item-1' }],
          deliveryFee: 500,
          total: 7500,
        })
        .expect(201);

      expect(res.body.id).toBe('order-1');
    });

    it('rejeita checkout por não-cliente', async () => {
      const res = await request
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${jwtService.sign(mockVendor)}`)
        .set('x-mock-role', 'vendor')
        .send({
          storeId: 'store-123',
          storeName: 'Kero Kilamba',
          items: [{ name: 'Hambúrguer', quantity: 2, price: 3500 }],
          deliveryFee: 500,
          total: 7500,
        })
        .expect(403);

      expect(res.body.message).toContain('Apenas clientes');
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('vendor actualiza estado do seu pedido', async () => {
      ordersService.findById.mockResolvedValue({ ...mockOrder, vendorId: 'vendor-1' } as any);
      ordersService.updateStatus.mockResolvedValue({ ...mockOrder, status: 'preparando' } as any);

      const res = await request
        .patch('/api/v1/orders/order-1/status')
        .set('Authorization', `Bearer ${jwtService.sign(mockVendor)}`)
        .set('x-mock-role', 'vendor')
        .send({ status: 'preparando' })
        .expect(200);

      expect(res.body.status).toBe('preparando');
    });

    it('rejeita vendor a actualizar pedido de outra loja', async () => {
      ordersService.findById.mockResolvedValue({ ...mockOrder, vendorId: 'outro-vendor' } as any);

      await request
        .patch('/api/v1/orders/order-1/status')
        .set('Authorization', `Bearer ${jwtService.sign(mockVendor)}`)
        .set('x-mock-role', 'vendor')
        .send({ status: 'preparando' })
        .expect(403);
    });
  });
});
