import { ConflictException, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { UserRole, VendorSubtype } from '@uritech/shared';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { UserEntity } from '../database/entities/user.entity';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  vendorSubtype?: VendorSubtype;
  avatar?: string;
  createdAt: string;
}

export interface UserQuery {
  search?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private memoryUsers: UserRecord[] = [];
  private ready = false;

  constructor(
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepo?: Repository<UserEntity>,
  ) {}

  private get useDb() {
    return isDatabaseEnabled() && !!this.usersRepo;
  }

  async onModuleInit() {
    if (this.useDb) {
      this.ready = true;
      return;
    }

    const hash = await bcrypt.hash('demo123', 10);
    this.memoryUsers = [
      { id: '1', name: 'Admin UriTech', email: 'admin@uritech.com', phone: '+244923900000001', password: hash, role: 'admin', createdAt: new Date().toISOString() },
      { id: '2', name: 'João Silva', email: 'joao@uritech.com', phone: '+244923456789', password: hash, role: 'user', createdAt: new Date().toISOString() },
      { id: '3', name: 'Maria Santos', email: 'maria@uritech.com', phone: '+244912345678', password: hash, role: 'user', createdAt: new Date().toISOString() },
      { id: '4', name: 'Budi Santoso', email: 'budi@uritech.com', phone: '+244912111222', password: hash, role: 'driver', createdAt: new Date().toISOString() },
      { id: '5', name: 'Kero Kilamba', email: 'warung@uritech.com', phone: '+244923333444', password: hash, role: 'vendor', vendorSubtype: 'supermarket', createdAt: new Date().toISOString() },
      { id: '6', name: 'Carlos Entregador', email: 'entregador@uritech.com', phone: '+244923555666', password: hash, role: 'delivery_rider', createdAt: new Date().toISOString() },
    ];
    this.ready = true;
  }

  private ensureReady() {
    if (!this.ready) throw new Error('UsersService not initialized');
  }

  private stripPassword(user: UserRecord | UserEntity) {
    const { password: _, ...safe } = user;
    return {
      ...safe,
      createdAt: typeof safe.createdAt === 'string' ? safe.createdAt : safe.createdAt.toISOString(),
    };
  }

  async findAll(query?: UserQuery) {
    this.ensureReady();

    if (this.useDb) {
      let qb = this.usersRepo!.createQueryBuilder('u');
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

    let result = this.memoryUsers.map(({ password, ...user }) => ({
      ...user,
      createdAt: user.createdAt,
    }));

    if (query?.role) result = result.filter((u) => u.role === query.role);
    if (query?.search) {
      const q = query.search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q),
      );
    }
    return result;
  }

  async findById(id: string) {
    this.ensureReady();

    if (this.useDb) {
      const user = await this.usersRepo!.findOne({ where: { id } });
      return user ? this.stripPassword(user) : null;
    }

    const user = this.memoryUsers.find((u) => u.id === id);
    if (!user) return null;
    return this.stripPassword(user);
  }

  async findByEmail(email: string) {
    this.ensureReady();

    if (this.useDb) {
      return this.usersRepo!.findOne({ where: { email } });
    }

    return this.memoryUsers.find((u) => u.email === email) || null;
  }

  async create(data: Omit<UserRecord, 'id' | 'createdAt'>) {
    this.ensureReady();
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email já registado');

    if (this.useDb) {
      const saved = await this.usersRepo!.save(this.usersRepo!.create(data));
      return this.stripPassword(saved);
    }

    const user: UserRecord = {
      ...data,
      id: String(this.memoryUsers.length + 1),
      createdAt: new Date().toISOString(),
    };
    this.memoryUsers.push(user);
    return this.stripPassword(user);
  }
}
