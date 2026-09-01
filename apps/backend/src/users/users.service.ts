import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { UserRole, VendorSubtype } from '@uritech/shared';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity, KycTier, KycStatus } from '../database/entities/user.entity';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  vendorSubtype?: VendorSubtype;
  avatar?: string;
  kycTier?: KycTier;
  kycStatus?: KycStatus;
  createdAt: string;
}

export interface UserQuery {
  search?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  private stripPassword(user: UserEntity) {
    const { password: _, ...safe } = user;
    return {
      ...safe,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findAll(query?: UserQuery) {
    let qb = this.usersRepo.createQueryBuilder('u')
      .where('u.deleted_at IS NULL');

    if (query?.role) qb = qb.andWhere('u.role = :role', { role: query.role });
    if (query?.search) {
      const q = `%${query.search.trim().toLowerCase()}%`;
      qb = qb.andWhere(
        '(LOWER(u.name) LIKE :q OR LOWER(u.email) LIKE :q OR LOWER(u.phone) LIKE :q)',
        { q },
      );
    }
    const rows = await qb.orderBy('u.created_at', 'DESC').getMany();
    return rows.map((u) => this.stripPassword(u));
  }

  async findById(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
    });
    return user ? this.stripPassword(user) : null;
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({
      where: { email },
    });
  }

  /** Retorna user completo com campos de segurança (para auth) */
  async findByEmailWithSecurity(email: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({
      where: { email },
    });
  }

  async create(data: Omit<UserRecord, 'id' | 'createdAt'>) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email já registado');
    const entity = this.usersRepo.create(data as any);
    const saved = await this.usersRepo.save(entity) as any;
    return this.stripPassword(saved);
  }

  // ── Brute Force Protection ──

  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  async recordFailedLogin(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const attempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = attempts >= this.MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000)
      : user.lockedUntil;

    await this.usersRepo.update(userId, {
      failedLoginAttempts: attempts,
      lockedUntil,
    });

    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      this.logger.warn(`Conta bloqueada após ${attempts} tentativas falhadas: user=${userId}`);
    }
  }

  async recordSuccessfulLogin(userId: string, ip?: string): Promise<void> {
    await this.usersRepo.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: new Date(),
      lastLoginIp: ip || undefined,
    });
  }

  // ── Soft Delete ──

  async softDelete(userId: string): Promise<void> {
    await this.usersRepo.update(userId, {
      deletedAt: new Date(),
      email: `deleted-${Date.now()}-${userId}@deleted.local`,
    });
    this.logger.log(`User soft-deleted: ${userId}`);
  }

  async restore(userId: string): Promise<void> {
    await this.usersRepo.update(userId, {
      deletedAt: undefined,
    });
  }
}
