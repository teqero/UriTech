import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/** Rate limit específico para submissões KYC.
 *  Máximo 3 requests por hora por utilizador.
 */
@Injectable()
export class KycThrottlerGuard implements CanActivate {
  private readonly ttlSeconds = 3600; // 1 hora
  private readonly limit = 3;

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string; sub?: string } | undefined;
    const userId = user?.userId ?? user?.sub ?? request.ip ?? 'anonymous';

    const key = `rate_limit:kyc_submit:${userId}`;
    const count = await this.redisService.increment(key, this.ttlSeconds);

    if (count > this.limit) {
      const ttl = await this.redisService.getTtl(key);
      throw new HttpException(
        `Demasiadas submissões KYC. Tente novamente em ${Math.max(1, ttl)} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
