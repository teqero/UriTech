import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Location } from '@uritech/shared';
import { Repository } from 'typeorm';
import { DriverEntity } from '../database/entities/driver.entity';

export interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehiclePlate?: string;
  rating: number;
  isOnline: boolean;
  currentLocation?: Location;
  totalRides: number;
  totalEarnings: number;
}

export type CreateDriverInput = {
  userId: string;
  name: string;
  phone: string;
  vehicleType?: string;
  vehiclePlate?: string;
};

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driversRepo: Repository<DriverEntity>,
  ) {}

  private toProfile(entity: DriverEntity): DriverProfile {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.userId, // populado pelo controller/service superior se necessário
      phone: entity.userId,
      vehicleType: entity.vehicleType,
      vehiclePlate: entity.vehiclePlate,
      rating: Number(entity.rating),
      isOnline: entity.isOnline,
      currentLocation:
        entity.currentLatitude != null && entity.currentLongitude != null
          ? {
              latitude: Number(entity.currentLatitude),
              longitude: Number(entity.currentLongitude),
            }
          : undefined,
      totalRides: entity.totalRides,
      totalEarnings: Number(entity.totalEarnings),
    };
  }

  async findAll() {
    const rows = await this.driversRepo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toProfile(r));
  }

  async findById(id: string) {
    const row = await this.driversRepo.findOne({ where: { id } });
    return row ? this.toProfile(row) : null;
  }

  async findOnline() {
    const rows = await this.driversRepo.find({
      where: { isOnline: true, active: true },
      order: { currentLocationUpdatedAt: 'DESC' },
    });
    return rows.map((r) => this.toProfile(r));
  }

  async toggleOnline(id: string) {
    const row = await this.driversRepo.findOne({ where: { id } });
    if (!row) return null;
    row.isOnline = !row.isOnline;
    const saved = await this.driversRepo.save(row);
    return this.toProfile(saved);
  }

  async updateLocation(id: string, location: Location) {
    const row = await this.driversRepo.findOne({ where: { id } });
    if (!row) return null;
    row.currentLatitude = location.latitude;
    row.currentLongitude = location.longitude;
    row.currentLocationUpdatedAt = new Date();
    const saved = await this.driversRepo.save(row);
    return this.toProfile(saved);
  }

  async create(data: CreateDriverInput) {
    const saved = await this.driversRepo.save(
      this.driversRepo.create({
        userId: data.userId,
        vehicleType: data.vehicleType ?? 'standard',
        vehiclePlate: data.vehiclePlate,
        rating: 5,
        totalRides: 0,
        totalEarnings: 0,
        isOnline: false,
      }),
    );
    return this.toProfile(saved);
  }
}
