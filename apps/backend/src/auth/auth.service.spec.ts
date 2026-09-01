import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorAuthService } from './two-factor-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmailWithSecurity: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    recordFailedLogin: jest.fn(),
    recordSuccessfulLogin: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('test-jwt-token'),
    decode: jest.fn().mockReturnValue({ jti: 'test-jti' }),
    verify: jest.fn(),
  };
  const redisService = {
    storeRefreshToken: jest.fn(),
    isRefreshTokenValid: jest.fn(),
    deleteRefreshToken: jest.fn(),
    addToBlacklist: jest.fn(),
  };
  const emailVerificationService = {
    sendVerificationEmail: jest.fn(),
  };
  const twoFactorAuthService = {
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
        { provide: EmailVerificationService, useValue: emailVerificationService },
        { provide: TwoFactorAuthService, useValue: twoFactorAuthService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejeita login com email desconhecido', async () => {
    usersService.findByEmailWithSecurity.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@uritech.com', password: 'demo123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita login com password incorrecta', async () => {
    const hash = await bcrypt.hash('demo123', 10);
    usersService.findByEmailWithSecurity.mockResolvedValue({
      id: '2',
      name: 'João',
      email: 'joao@uritech.com',
      phone: '+244',
      password: hash,
      role: 'user',
      twoFactorEnabled: false,
    });

    await expect(
      service.login({ email: 'joao@uritech.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('devolve sessão com token em login válido (sem 2FA)', async () => {
    const hash = await bcrypt.hash('demo123', 10);
    usersService.findByEmailWithSecurity.mockResolvedValue({
      id: '2',
      name: 'João Silva',
      email: 'joao@uritech.com',
      phone: '+244923456789',
      password: hash,
      role: 'user',
      twoFactorEnabled: false,
      emailVerified: true,
    });

    const session = await service.login({ email: 'joao@uritech.com', password: 'demo123' });
    expect('accessToken' in session).toBe(true);
    expect('user' in session && (session as any).user.email).toBe('joao@uritech.com');
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: '2', role: 'user' }),
      expect.any(Object),
    );
  });

  it('devolve partialToken quando 2FA está activo', async () => {
    const hash = await bcrypt.hash('demo123', 10);
    usersService.findByEmailWithSecurity.mockResolvedValue({
      id: '2',
      name: 'João Silva',
      email: 'joao@uritech.com',
      phone: '+244923456789',
      password: hash,
      role: 'user',
      twoFactorEnabled: true,
      emailVerified: true,
    });

    const session = await service.login({ email: 'joao@uritech.com', password: 'demo123' });
    expect('requiresTwoFactor' in session).toBe(true);
    expect((session as any).requiresTwoFactor).toBe(true);
    expect((session as any).partialToken).toBe('test-jwt-token');
  });
});
