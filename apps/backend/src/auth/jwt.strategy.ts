import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  vendorSubtype?: string;
  kycTier?: string;
  type?: 'access' | 'refresh';
  jti?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'uritech-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    // Garantir que refresh tokens não podem ser usados como access tokens
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Sessão inválida');

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      vendorSubtype: payload.vendorSubtype,
      kycTier: payload.kycTier,
      jti: payload.jti,
    };
  }
}
