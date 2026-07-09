import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Insurer } from '@uritech/shared';
import { DEMO_INSURERS } from '@uritech/shared';
import { Repository } from 'typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { InsurerEntity } from '../database/entities/insurer.entity';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';

@Injectable()
export class InsurersService {
  private memoryInsurers: Insurer[] = DEMO_INSURERS.map((i) => ({ ...i }));

  constructor(
    @Optional()
    @InjectRepository(InsurerEntity)
    private readonly insurersRepo?: Repository<InsurerEntity>,
  ) {}

  private get useDb() {
    return isDatabaseEnabled() && !!this.insurersRepo;
  }

  private toInsurer(row: InsurerEntity): Insurer {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      apiWebhookUrl: row.apiWebhookUrl,
      platformFeePerClaim: Number(row.platformFeePerClaim),
      platformFeeMonthly: Number(row.platformFeeMonthly),
      active: row.active,
      mandatedForClients: row.mandatedForClients,
      clientsCount: row.clientsCount,
      claimsThisMonth: row.claimsThisMonth,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(activeOnly = false) {
    if (this.useDb) {
      const rows = await this.insurersRepo!.find({ order: { name: 'ASC' } });
      const list = rows.map((r) => this.toInsurer(r));
      return activeOnly ? list.filter((i) => i.active) : list;
    }
    return activeOnly ? this.memoryInsurers.filter((i) => i.active) : this.memoryInsurers;
  }

  async findById(id: string) {
    if (this.useDb) {
      const row = await this.insurersRepo!.findOne({ where: { id } });
      return row ? this.toInsurer(row) : undefined;
    }
    return this.memoryInsurers.find((i) => i.id === id);
  }

  async create(dto: CreateInsurerDto) {
    const payload = {
      id: `ins-${Date.now()}`,
      name: dto.name,
      code: dto.code.toUpperCase(),
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      apiWebhookUrl: dto.apiWebhookUrl,
      platformFeePerClaim: dto.platformFeePerClaim,
      platformFeeMonthly: dto.platformFeeMonthly ?? 0,
      active: dto.active ?? true,
      mandatedForClients: dto.mandatedForClients ?? false,
      clientsCount: 0,
      claimsThisMonth: 0,
      createdAt: new Date().toISOString(),
    };

    if (this.useDb) {
      const saved = await this.insurersRepo!.save(this.insurersRepo!.create({
        id: payload.id,
        name: payload.name,
        code: payload.code,
        contactEmail: payload.contactEmail,
        contactPhone: payload.contactPhone,
        apiWebhookUrl: payload.apiWebhookUrl,
        platformFeePerClaim: payload.platformFeePerClaim,
        platformFeeMonthly: payload.platformFeeMonthly,
        active: payload.active,
        mandatedForClients: payload.mandatedForClients,
      }));
      return this.toInsurer(saved);
    }

    this.memoryInsurers.push(payload);
    return payload;
  }

  async update(id: string, dto: UpdateInsurerDto) {
    if (this.useDb) {
      const row = await this.insurersRepo!.findOne({ where: { id } });
      if (!row) return null;
      Object.assign(row, {
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : row.code,
      });
      const saved = await this.insurersRepo!.save(row);
      return this.toInsurer(saved);
    }

    const idx = this.memoryInsurers.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    const current = this.memoryInsurers[idx];
    const updated: Insurer = {
      ...current,
      ...dto,
      code: dto.code ? dto.code.toUpperCase() : current.code,
    };
    this.memoryInsurers[idx] = updated;
    return updated;
  }

  async toggleActive(id: string) {
    const insurer = await this.findById(id);
    if (!insurer) return null;
    return this.update(id, { active: !insurer.active });
  }

  async incrementClaimCount(insurerId: string) {
    if (this.useDb) {
      await this.insurersRepo!.increment({ id: insurerId }, 'claimsThisMonth', 1);
      return;
    }
    const insurer = this.memoryInsurers.find((i) => i.id === insurerId);
    if (insurer) insurer.claimsThisMonth += 1;
  }

  async getPlatformStats() {
    const insurers = await this.findAll();
    const active = insurers.filter((i) => i.active);
    return {
      totalInsurers: insurers.length,
      activeInsurers: active.length,
      totalClaimsThisMonth: active.reduce((s, i) => s + i.claimsThisMonth, 0),
      estimatedRevenueThisMonth: active.reduce(
        (s, i) => s + i.claimsThisMonth * i.platformFeePerClaim + i.platformFeeMonthly,
        0,
      ),
    };
  }
}
