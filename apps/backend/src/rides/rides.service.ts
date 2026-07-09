import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Ride, RideStatus } from '@uritech/shared';
import { Repository } from 'typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { RideEntity } from '../database/entities/ride.entity';

@Injectable()
export class RidesService {
  private memoryRides: Ride[] = [
    {
      id: '1',
      userId: '2',
      driverId: '4',
      status: 'completed',
      mode: 'fixed',
      pickup: { latitude: -8.8383, longitude: 13.2344, address: 'Luanda Sul' },
      destination: { latitude: -8.8167, longitude: 13.2344, address: 'Talatona' },
      fare: 1200,
      distance: 5400,
      duration: 1080,
      vehicleType: 'standard',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(
    @Optional()
    @InjectRepository(RideEntity)
    private readonly ridesRepo?: Repository<RideEntity>,
  ) {}

  private get useDb() {
    return isDatabaseEnabled() && !!this.ridesRepo;
  }

  private toRide(entity: RideEntity): Ride {
    return {
      id: entity.id,
      userId: entity.userId,
      driverId: entity.driverId,
      status: entity.status,
      mode: entity.mode,
      pickup: entity.pickup,
      destination: entity.destination,
      fare: Number(entity.fare),
      distance: entity.distance,
      duration: entity.duration,
      vehicleType: entity.vehicleType,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  async findAll() {
    if (this.useDb) {
      const rows = await this.ridesRepo!.find({ order: { createdAt: 'DESC' } });
      return rows.map((r) => this.toRide(r));
    }
    return this.memoryRides;
  }

  async findByStatus(status: RideStatus) {
    if (this.useDb) {
      const rows = await this.ridesRepo!.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });
      return rows.map((r) => this.toRide(r));
    }
    return this.memoryRides.filter((r) => r.status === status);
  }

  async findById(id: string) {
    if (this.useDb) {
      const row = await this.ridesRepo!.findOne({ where: { id } });
      return row ? this.toRide(row) : undefined;
    }
    return this.memoryRides.find((r) => r.id === id);
  }

  async findByUser(userId: string) {
    if (this.useDb) {
      const rows = await this.ridesRepo!.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      return rows.map((r) => this.toRide(r));
    }
    return this.memoryRides.filter((r) => r.userId === userId);
  }

  async findByDriver(driverId: string) {
    if (this.useDb) {
      const rows = await this.ridesRepo!.find({
        where: { driverId },
        order: { createdAt: 'DESC' },
      });
      return rows.map((r) => this.toRide(r));
    }
    return this.memoryRides.filter((r) => r.driverId === driverId);
  }

  async create(data: Omit<Ride, 'id' | 'createdAt'>) {
    if (this.useDb) {
      const saved = await this.ridesRepo!.save(
        this.ridesRepo!.create({
          ...data,
          status: data.status ?? 'searching',
        }),
      );
      return this.toRide(saved);
    }

    const ride: Ride = {
      ...data,
      id: String(this.memoryRides.length + 1),
      createdAt: new Date().toISOString(),
    };
    this.memoryRides.unshift(ride);
    return ride;
  }

  async updateStatus(id: string, status: RideStatus, driverId?: string) {
    if (this.useDb) {
      const row = await this.ridesRepo!.findOne({ where: { id } });
      if (!row) return null;
      row.status = status;
      if (driverId) row.driverId = driverId;
      const saved = await this.ridesRepo!.save(row);
      return this.toRide(saved);
    }

    const ride = this.memoryRides.find((r) => r.id === id);
    if (!ride) return null;
    ride.status = status;
    if (driverId) ride.driverId = driverId;
    return ride;
  }
}
