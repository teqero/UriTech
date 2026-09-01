import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorEntity } from '../database/entities/vendor.entity';

export interface VendorProfile {
  id: string;
  userId: string;
  storeName: string;
  storeAddress?: string;
  rating: number;
  isOpen: boolean;
  categories: string[];
  image?: string;
  totalOrders: number;
}

export type CreateVendorInput = {
  userId: string;
  businessName: string;
  businessType?: string;
  address?: string;
  city?: string;
  country?: string;
};

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorsRepo: Repository<VendorEntity>,
  ) {}

  private toProfile(entity: VendorEntity): VendorProfile {
    return {
      id: entity.id,
      userId: entity.userId,
      storeName: entity.businessName,
      storeAddress: entity.address,
      rating: Number(entity.rating),
      isOpen: entity.isOpen,
      categories: [entity.businessType],
      image: entity.logoUrl,
      totalOrders: entity.totalOrders,
    };
  }

  async findAll() {
    const rows = await this.vendorsRepo.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toProfile(r));
  }

  async findById(id: string) {
    const row = await this.vendorsRepo.findOne({ where: { id } });
    return row ? this.toProfile(row) : null;
  }

  async toggleOpen(id: string) {
    const row = await this.vendorsRepo.findOne({ where: { id } });
    if (!row) return null;
    row.isOpen = !row.isOpen;
    const saved = await this.vendorsRepo.save(row);
    return this.toProfile(saved);
  }

  async create(data: CreateVendorInput) {
    const saved = await this.vendorsRepo.save(
      this.vendorsRepo.create({
        userId: data.userId,
        businessName: data.businessName,
        businessType: data.businessType ?? 'restaurant',
        address: data.address,
        city: data.city ?? 'Luanda',
        country: data.country ?? 'Angola',
        rating: 5,
        totalOrders: 0,
        totalRevenue: 0,
        isOpen: true,
      }),
    );
    return this.toProfile(saved);
  }
}
