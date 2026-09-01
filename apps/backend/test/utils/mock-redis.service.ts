import { Injectable } from '@nestjs/common';

@Injectable()
export class MockRedisService {
  private store = new Map<string, { value: string; expiresAt: number }>();

  private now() {
    return Math.floor(Date.now() / 1000);
  }

  private isExpired(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return true;
    return entry.expiresAt > 0 && entry.expiresAt <= this.now();
  }

  private cleanup() {
    for (const [key] of this.store) {
      if (this.isExpired(key)) this.store.delete(key);
    }
  }

  async addToBlacklist(jti: string, ttlSeconds: number): Promise<void> {
    this.cleanup();
    this.store.set(`blacklist:${jti}`, {
      value: '1',
      expiresAt: this.now() + ttlSeconds,
    });
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    this.cleanup();
    const key = `blacklist:${jti}`;
    return this.store.has(key) && !this.isExpired(key);
  }

  async storeRefreshToken(
    userId: string,
    tokenId: string,
    ttlSeconds: number,
  ): Promise<void> {
    this.cleanup();
    this.store.set(`refresh:${userId}:${tokenId}`, {
      value: '1',
      expiresAt: this.now() + ttlSeconds,
    });
  }

  async isRefreshTokenValid(userId: string, tokenId: string): Promise<boolean> {
    this.cleanup();
    const key = `refresh:${userId}:${tokenId}`;
    return this.store.has(key) && !this.isExpired(key);
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    this.store.delete(`refresh:${userId}:${tokenId}`);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(`refresh:${userId}:`)) {
        this.store.delete(key);
      }
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const existing = this.store.get(key);
    const count = existing ? parseInt(existing.value, 10) + 1 : 1;
    this.store.set(key, {
      value: String(count),
      expiresAt: this.now() + ttlSeconds,
    });
    return count;
  }

  async getTtl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt <= 0) return -1;
    return Math.max(0, entry.expiresAt - this.now());
  }

  /** Limpar tudo (útil entre testes) */
  clear(): void {
    this.store.clear();
  }
}
