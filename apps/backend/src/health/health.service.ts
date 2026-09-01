import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    postgres: { status: 'up' | 'down'; responseTimeMs: number; details?: string };
    redis: { status: 'up' | 'down'; responseTimeMs: number; details?: string };
    storage: { status: 'up' | 'down'; responseTimeMs: number; details?: string };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [postgres, redis, storage] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const allUp = postgres.status === 'up' && redis.status === 'up' && storage.status === 'up';
    const anyDown = postgres.status === 'down' || redis.status === 'down' || storage.status === 'down';

    const status = anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks: { postgres, redis, storage },
    };
  }

  private async checkPostgres() {
    const start = Date.now();
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource não inicializado');
      }
      await this.dataSource.query('SELECT 1');
      return { status: 'up' as const, responseTimeMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Postgres health check failed: ${message}`);
      return { status: 'down' as const, responseTimeMs: Date.now() - start, details: message };
    }
  }

  private async checkRedis() {
    const start = Date.now();
    try {
      await this.redisService.healthCheck();
      return { status: 'up' as const, responseTimeMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Redis health check failed: ${message}`);
      return { status: 'down' as const, responseTimeMs: Date.now() - start, details: message };
    }
  }

  private async checkStorage() {
    const start = Date.now();
    try {
      await this.storageService.healthCheck();
      return { status: 'up' as const, responseTimeMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Storage health check failed: ${message}`);
      return { status: 'down' as const, responseTimeMs: Date.now() - start, details: message };
    }
  }
}
