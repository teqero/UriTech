import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '~/users/users.service';
import { createTestApp, TestContext } from './utils/test-app';

describe('AuthController (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById' | 'create'>>;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    usersService = app.get(UsersService) as any;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    ctx.mockRedis.clear();
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('autentica com credenciais válidas e devolve access + refresh tokens', async () => {
      const password = await bcrypt.hash('senha123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Teste',
        email: 'teste@uritech.com',
        phone: '+244999999999',
        password,
        role: 'user',
      } as any);

      const res = await ctx.request
        .post('/api/v1/auth/login')
        .send({ email: 'teste@uritech.com', password: 'senha123' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('teste@uritech.com');
    });

    it('rejeita login com email inexistente', async () => {
      usersService.findByEmail.mockResolvedValue(null as any);

      await ctx.request
        .post('/api/v1/auth/login')
        .send({ email: 'inexistente@uritech.com', password: 'senha123' })
        .expect(401);
    });

    it('rejeita login com password errada', async () => {
      const password = await bcrypt.hash('senha123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Teste',
        email: 'teste@uritech.com',
        phone: '+244999999999',
        password,
        role: 'user',
      } as any);

      await ctx.request
        .post('/api/v1/auth/login')
        .send({ email: 'teste@uritech.com', password: 'errada' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('troca refresh token por novo par de tokens (rotação)', async () => {
      const password = await bcrypt.hash('senha123', 10);
      const user = {
        id: 'user-1',
        name: 'Teste',
        email: 'teste@uritech.com',
        phone: '+244999999999',
        password,
        role: 'user',
      };
      usersService.findByEmail.mockResolvedValue(user as any);
      usersService.findById.mockResolvedValue(user as any);

      const loginRes = await ctx.request
        .post('/api/v1/auth/login')
        .send({ email: 'teste@uritech.com', password: 'senha123' });

      const refreshToken = loginRes.body.refreshToken;

      const res = await ctx.request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('rejeita refresh token inválido', async () => {
      await ctx.request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'token-invalido' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('faz logout e adiciona access token à blacklist', async () => {
      const password = await bcrypt.hash('senha123', 10);
      const user = {
        id: 'user-1',
        name: 'Teste',
        email: 'teste@uritech.com',
        phone: '+244999999999',
        password,
        role: 'user',
      };
      usersService.findByEmail.mockResolvedValue(user as any);
      usersService.findById.mockResolvedValue(user as any);

      const loginRes = await ctx.request
        .post('/api/v1/auth/login')
        .send({ email: 'teste@uritech.com', password: 'senha123' });

      const accessToken = loginRes.body.accessToken;
      const refreshToken = loginRes.body.refreshToken;

      await ctx.request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(201);

      // Verificar que o access token está na blacklist
      const jwtService = app.get(JwtService);
      const payload = jwtService.decode(accessToken) as { jti: string };
      const isBlacklisted = await ctx.mockRedis.isBlacklisted(payload.jti);
      expect(isBlacklisted).toBe(true);
    });
  });
});
