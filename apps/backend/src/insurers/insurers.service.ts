import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Insurer } from '@uritech/shared';
import { Repository } from 'typeorm';
import { InsurerEntity } from '../database/entities/insurer.entity';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';

@Injectable()
export class InsurersService {
  constructor(
    @InjectRepository(InsurerEntity)
    private readonly insurersRepo: Repository<InsurerEntity>,
  ) {}

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
    const rows = await this.insurersRepo.find({ order: { name: 'ASC' } });
    const list = rows.map((r) => this.toInsurer(r));
    return activeOnly ? list.filter((i) => i.active) : list;
  }

  async findById(id: string) {
    const row = await this.insurersRepo.findOne({ where: { id } });
    return row ? this.toInsurer(row) : undefined;
  }

  async create(dto: CreateInsurerDto) {
    const saved = await this.insurersRepo.save(
      this.insurersRepo.create({
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
      }),
    );
    return this.toInsurer(saved);
  }

  async update(id: string, dto: UpdateInsurerDto) {
    const row = await this.insurersRepo.findOne({ where: { id } });
    if (!row) return null;
    Object.assign(row, {
      ...dto,
      code: dto.code ? dto.code.toUpperCase() : row.code,
    });
    const saved = await this.insurersRepo.save(row);
    return this.toInsurer(saved);
  }

  async toggleActive(id: string) {
    const insurer = await this.findById(id);
    if (!insurer) return null;
    return this.update(id, { active: !insurer.active });
  }

  async incrementClaimCount(insurerId: string) {
    await this.insurersRepo.increment({ id: insurerId }, 'claimsThisMonth', 1);
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
