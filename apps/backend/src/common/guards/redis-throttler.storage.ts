import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../../redis/redis.service';

interface StorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    _limit: number,
    _blockDuration: number,
    _throttlerName: string,
  ): Promise<StorageRecord> {
    const count = await this.redisService.increment(key, ttl);
    const now = Date.now();
    return {
      totalHits: count,
      timeToExpire: now + ttl * 1000,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
