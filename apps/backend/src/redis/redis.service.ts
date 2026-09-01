import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Mock de Redis em memória para desenvolvimento local sem Docker.
 * Usa Map com TTL para simular o comportamento do Redis.
 */
class InMemoryRedis {
  private store = new Map<string, { value: string; expiresAt: number }>();

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async exists(key: string): Promise<number> {
    this.cleanup();
    const entry = this.store.get(key);
    return entry && entry.expiresAt > Date.now() ? 1 : 0;
  }

  async del(...keys: string[]): Promise<void> {
    for (const key of keys) {
      this.store.delete(key);
    }
  }

  async incr(key: string): Promise<number> {
    this.cleanup();
    const entry = this.store.get(key);
    const newValue = entry ? parseInt(entry.value, 10) + 1 : 1;
    this.store.set(key, { value: String(newValue), expiresAt: entry?.expiresAt || Date.now() + 60000 });
    return newValue;
  }

  async expire(_key: string, _ttlSeconds: number): Promise<void> {
    // TTL já é gerido no setex/incr
  }

  async ttl(key: string): Promise<number> {
    this.cleanup();
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  pipeline(): any {
    const commands: (() => Promise<any>)[] = [];
    const self = this;
    return {
      incr(key: string) { commands.push(() => self.incr(key)); return this; },
      expire(key: string, ttl: number) { commands.push(() => self.expire(key, ttl)); return this; },
      async exec() {
        const results: any[] = [];
        for (const cmd of commands) {
          try { results.push([null, await cmd()]); } catch (e) { results.push([e, null]); }
        }
        return results;
      },
    };
  }

  scanStream(_options?: any): any {
    return {
      [Symbol.asyncIterator]: async function* () {
        yield [];
      },
    };
  }

  async quit(): Promise<void> {
    this.store.clear();
  }
}

function createRedisClient(): Redis | InMemoryRedis {
  const url = process.env.REDIS_URL;
  const useMemory = !url || url === 'memory:' || url === 'memory';

  if (useMemory) {
    console.log('[Redis] Usando mock em memória (defina REDIS_URL para conectar a Redis real)');
    return new InMemoryRedis();
  }

  if (url) {
    return new Redis(url, { maxRetriesPerRequest: 3 });
  }
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: 3,
  });
}

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: any;
  private readonly isMock: boolean;

  constructor() {
    this.redis = createRedisClient();
    this.isMock = this.redis instanceof InMemoryRedis;
    if (!this.isMock) {
      this.logger.log('Redis client configurado');
    }
  }

  async onApplicationShutdown() {
    this.logger.log('A fechar conexão Redis...');
    await this.redis.quit();
    this.logger.log('Conexão Redis fechada.');
  }

  // ── Token Blacklist (revogação de access tokens) ──

  async addToBlacklist(jti: string, ttlSeconds: number): Promise<void> {
    const key = `blacklist:${jti}`;
    await this.redis.setex(key, ttlSeconds, '1');
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const key = `blacklist:${jti}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  // ── Refresh Token Store ──

  async storeRefreshToken(
    userId: string,
    tokenId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    await this.redis.setex(key, ttlSeconds, '1');
  }

  async isRefreshTokenValid(userId: string, tokenId: string): Promise<boolean> {
    const key = `refresh:${userId}:${tokenId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    await this.redis.del(key);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    if (this.isMock) {
      // Mock não suporta scan pattern — limpar manualmente
      const keysToDelete: string[] = [];
      for (const key of this.redis.store?.keys() || []) {
        if (key.startsWith(`refresh:${userId}:`)) {
          keysToDelete.push(key);
        }
      }
      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
      }
      return;
    }
    const pattern = `refresh:${userId}:*`;
    const stream = this.redis.scanStream({ match: pattern, count: 100 });

    for await (const keys of stream) {
      if (Array.isArray(keys) && keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // ── Rate Limit helpers (opcional — ThrottlerModule já cobre a maioria) ──

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttlSeconds);
    const [, count] = await pipeline.exec() as [unknown, [null, number]];
    return count[1];
  }

  async getTtl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async healthCheck(): Promise<void> {
    await this.redis.ping();
  }
}
