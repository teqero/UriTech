import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('test-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejeita login com email desconhecido', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@uritech.com', password: 'demo123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita login com password incorrecta', async () => {
    const hash = await bcrypt.hash('demo123', 10);
    usersService.findByEmail.mockResolvedValue({
      id: '2',
      name: 'João',
      email: 'joao@uritech.com',
      phone: '+244',
      password: hash,
      role: 'user',
    });

    await expect(
      service.login({ email: 'joao@uritech.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('devolve sessão com token em login válido', async () => {
    const hash = await bcrypt.hash('demo123', 10);
    usersService.findByEmail.mockResolvedValue({
      id: '2',
      name: 'João Silva',
      email: 'joao@uritech.com',
      phone: '+244923456789',
      password: hash,
      role: 'user',
    });

    const session = await service.login({ email: 'joao@uritech.com', password: 'demo123' });
    expect(session.accessToken).toBe('test-jwt-token');
    expect(session.user.email).toBe('joao@uritech.com');
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: '2', role: 'user' }),
    );
  });
});
