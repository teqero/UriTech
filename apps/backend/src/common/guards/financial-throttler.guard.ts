import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/** Rate limit específico para operações financeiras.
 *  Máximo 5 requests por minuto por utilizador.
 */
@Injectable()
export class FinancialThrottlerGuard implements CanActivate {
  private readonly ttlSeconds = 60;
  private readonly limit = 5;

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string; sub?: string } | undefined;
    const userId = user?.userId ?? user?.sub ?? request.ip ?? 'anonymous';

    const key = `rate_limit:finance:${userId}`;
    const count = await this.redisService.increment(key, this.ttlSeconds);

    if (count > this.limit) {
      const ttl = await this.redisService.getTtl(key);
      throw new HttpException(
        `Demasiadas operações financeiras. Tente novamente em ${Math.max(1, ttl)} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
