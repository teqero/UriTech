import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { buildAuthSession } from '@uritech/shared';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorAuthService } from './two-factor-auth.service';

const ACCESS_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias
const PARTIAL_AUTH_TTL_SECONDS = 5 * 60; // 5 min para completar 2FA

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  vendorSubtype?: string;
  kycTier?: string;
  type: 'access' | 'refresh' | 'partial';
  jti: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private emailVerificationService: EmailVerificationService,
    private twoFactorAuthService: TwoFactorAuthService,
  ) {}

  private signAccessToken(payload: Omit<TokenPayload, 'jti' | 'type' | 'exp'>): string {
    const jti = randomUUID();
    return this.jwtService.sign(
      { ...payload, type: 'access', jti },
      { expiresIn: ACCESS_TTL_SECONDS },
    );
  }

  private signRefreshToken(payload: Omit<TokenPayload, 'jti' | 'type' | 'exp'>): string {
    const jti = randomUUID();
    return this.jwtService.sign(
      { ...payload, type: 'refresh', jti },
      { expiresIn: REFRESH_TTL_SECONDS },
    );
  }

  private signPartialToken(userId: string): string {
    const jti = randomUUID();
    return this.jwtService.sign(
      { sub: userId, type: 'partial', jti },
      { expiresIn: PARTIAL_AUTH_TTL_SECONDS },
    );
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithSecurity(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    // Verificar se conta está locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Conta temporariamente bloqueada. Tente novamente após ${user.lockedUntil.toISOString()}`
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      await this.usersService.recordFailedLogin(user.id);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Reset failed attempts
    await this.usersService.recordSuccessfulLogin(user.id);

    // Verificar email
    const requireVerifiedEmail = process.env.REQUIRE_VERIFIED_EMAIL === 'true';
    if (requireVerifiedEmail && !user.emailVerified) {
      throw new UnauthorizedException(
        'Email não verificado. Por favor verifique o seu email antes de fazer login.'
      );
    }

    // Se 2FA está activo, devolver partial token
    if (user.twoFactorEnabled) {
      const partialToken = this.signPartialToken(user.id);
      return {
        requiresTwoFactor: true,
        partialToken,
        message: 'Introduza o código de autenticação de dois factores.',
      };
    }

    // Login completo (sem 2FA)
    return this.completeLogin(user);
  }

  /**
   * Completa o login após verificação de 2FA.
   */
  async verifyTwoFactor(partialToken: string, code: string) {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify(partialToken) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    if (payload.type !== 'partial') {
      throw new UnauthorizedException('Token inválido.');
    }

    const valid = await this.twoFactorAuthService.verifyToken(payload.sub, code);
    if (!valid) {
      throw new UnauthorizedException('Código 2FA inválido. Tente novamente.');
    }

    const user = await this.usersService.findByEmailWithSecurity(payload.sub);
    if (!user) throw new UnauthorizedException('Utilizador não encontrado');

    return this.completeLogin(user);
  }

  private async completeLogin(user: any) {
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorSubtype: user.vendorSubtype,
      kycTier: user.kycTier,
    };

    const accessToken = this.signAccessToken(tokenPayload);
    const refreshToken = this.signRefreshToken(tokenPayload);
    const refreshJti = this.jwtService.decode(refreshToken) as { jti: string };

    await this.redisService.storeRefreshToken(
      user.id,
      refreshJti.jti,
      REFRESH_TTL_SECONDS,
    );

    const { password: _, emailVerificationToken: __, emailVerificationExpiresAt: ___, twoFactorSecret: ____, twoFactorBackupCodes: _____, ...safeUser } = user;

    return {
      ...buildAuthSession(accessToken, {
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        phone: safeUser.phone,
        role: safeUser.role,
        avatar: safeUser.avatar,
        vendorSubtype: safeUser.vendorSubtype,
      }),
      refreshToken,
      emailVerified: safeUser.emailVerified,
      twoFactorEnabled: safeUser.twoFactorEnabled,
      kycTier: safeUser.kycTier,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new UnauthorizedException('Email já cadastrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    // Enviar email de verificação
    try {
      await this.emailVerificationService.sendVerificationEmail(user as any);
    } catch (err) {
      this.logger.warn(`Falha ao enviar email de verificação: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Em produção, não fazer login automático — exigir verificação de email primeiro
    const autoLogin = process.env.AUTO_LOGIN_AFTER_REGISTER === 'true';
    if (!autoLogin) {
      return {
        message: 'Registo bem-sucedido. Por favor verifique o seu email para activar a conta.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        emailVerificationSent: true,
      };
    }

    // Auto-login (modo dev apenas)
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorSubtype: user.vendorSubtype,
      kycTier: user.kycTier,
    };

    const accessToken = this.signAccessToken(tokenPayload);
    const refreshToken = this.signRefreshToken(tokenPayload);
    const refreshJti = this.jwtService.decode(refreshToken) as { jti: string };

    await this.redisService.storeRefreshToken(
      user.id,
      refreshJti.jti,
      REFRESH_TTL_SECONDS,
    );

    return {
      ...buildAuthSession(accessToken, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        vendorSubtype: user.vendorSubtype,
      }),
      refreshToken,
      emailVerified: false,
      kycTier: user.kycTier,
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify(refreshToken) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token inválido');
    }

    const isValid = await this.redisService.isRefreshTokenValid(
      payload.sub,
      payload.jti,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token revogado');
    }

    // Rotação de refresh token (security best practice)
    await this.redisService.deleteRefreshToken(payload.sub, payload.jti);

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Utilizador não encontrado');

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorSubtype: user.vendorSubtype,
      kycTier: user.kycTier,
    };

    const newAccessToken = this.signAccessToken(tokenPayload);
    const newRefreshToken = this.signRefreshToken(tokenPayload);
    const newRefreshJti = this.jwtService.decode(newRefreshToken) as {
      jti: string;
    };

    await this.redisService.storeRefreshToken(
      user.id,
      newRefreshJti.jti,
      REFRESH_TTL_SECONDS,
    );

    return {
      ...buildAuthSession(newAccessToken, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        vendorSubtype: user.vendorSubtype,
      }),
      refreshToken: newRefreshToken,
      kycTier: user.kycTier,
    };
  }

  async logout(accessToken: string, refreshToken?: string) {
    try {
      const accessPayload = this.jwtService.decode(accessToken) as
        | TokenPayload
        | null;
      if (accessPayload?.jti) {
        const remainingTtl = Math.max(
          1,
          ACCESS_TTL_SECONDS - Math.floor(Date.now() / 1000) + (accessPayload.exp ?? 0),
        );
        await this.redisService.addToBlacklist(
          accessPayload.jti,
          remainingTtl,
        );
      }

      if (refreshToken) {
        const refreshPayload = this.jwtService.decode(refreshToken) as
          | TokenPayload
          | null;
        if (refreshPayload?.sub && refreshPayload?.jti) {
          await this.redisService.deleteRefreshToken(
            refreshPayload.sub,
            refreshPayload.jti,
          );
        }
      }
    } catch {
      // Silencioso — logout é idempotente
    }

    return { success: true };
  }
}
