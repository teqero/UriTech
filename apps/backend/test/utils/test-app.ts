import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AuthModule } from '~/auth/auth.module';
import { RedisModule } from '~/redis/redis.module';
import { RedisService } from '~/redis/redis.service';
import { UsersService } from '~/users/users.service';
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
    findById: jest.fn(),
    create: jest.fn(),
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AuthModule, RedisModule],
  })
    .overrideProvider(RedisService)
    .useValue(mockRedis)
    .overrideProvider(UsersService)
    .useValue(usersServiceMock)
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
