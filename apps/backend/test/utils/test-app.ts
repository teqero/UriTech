import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import supertest from 'supertest';
import { AuthModule } from '~/auth/auth.module';
import { RedisModule } from '~/redis/redis.module';
import { RedisService } from '~/redis/redis.service';
import { UsersService } from '~/users/users.service';
import { UserEntity } from '~/database/entities/user.entity';
import { MockRedisService } from './mock-redis.service';

export interface TestContext {
  app: INestApplication;
  mockRedis: MockRedisService;
  request: ReturnType<typeof supertest>;
}

export async function createTestApp(): Promise<TestContext> {
  const mockRedis = new MockRedisService();

  const usersServiceMock = {
    findByEmail: jest.fn(),
    findByEmailWithSecurity: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    recordFailedLogin: jest.fn().mockResolvedValue(undefined),
    recordSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
  };

  // Mock do repositório UserEntity — evita precisar de DataSource/BD real
  // (AuthModule usa TypeOrmModule.forFeature([UserEntity]) para os serviços
  // de verificação de email, 2FA, password reset e phone OTP)
  const userRepoMock = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((entity) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    create: jest.fn((data) => data),
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AuthModule, RedisModule],
  })
    .overrideProvider(RedisService)
    .useValue(mockRedis)
    .overrideProvider(UsersService)
    .useValue(usersServiceMock)
    .overrideProvider(getRepositoryToken(UserEntity))
    .useValue(userRepoMock)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api/v1');

  await app.init();

  return {
    app,
    mockRedis,
    request: supertest(app.getHttpServer()),
  };
}
