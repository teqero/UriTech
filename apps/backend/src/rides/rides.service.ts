import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Ride, RideStatus } from '@uritech/shared';
import { Repository } from 'typeorm';
import { RideEntity } from '../database/entities/ride.entity';
import { RidesEventsService, type RideUpdatePayload } from './rides-events.service';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(RideEntity)
    private readonly ridesRepo: Repository<RideEntity>,
    private readonly eventsService: RidesEventsService,
  ) {}

  private toRide(entity: RideEntity): Ride {
    return {
      id: entity.id,
      userId: entity.userId,
      driverId: entity.driverId ?? undefined,
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
    const rows = await this.ridesRepo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toRide(r));
  }

  async findByStatus(status: RideStatus) {
    const rows = await this.ridesRepo.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toRide(r));
  }

  async findById(id: string) {
    const row = await this.ridesRepo.findOne({ where: { id } });
    return row ? this.toRide(row) : undefined;
  }

  async findByUser(userId: string) {
    const rows = await this.ridesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toRide(r));
  }

  async findByDriver(driverId: string) {
    const rows = await this.ridesRepo.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toRide(r));
  }

  async create(data: Omit<Ride, 'id' | 'createdAt'>) {
    const saved = await this.ridesRepo.save(
      this.ridesRepo.create({
        ...data,
        status: data.status ?? 'searching',
      }),
    );
    const ride = this.toRide(saved);

    this.eventsService.emitRideUpdate({
      rideId: ride.id,
      ride,
      event: 'status_changed',
    });

    return ride;
  }

  async updateStatus(id: string, status: RideStatus, driverId?: string) {
    const row = await this.ridesRepo.findOne({ where: { id } });
    if (!row) return null;

    const previousStatus = row.status;
    row.status = status;
    if (driverId) row.driverId = driverId;

    const saved = await this.ridesRepo.save(row);
    const ride = this.toRide(saved);

    let event: RideUpdatePayload['event'] = 'status_changed';
    if (status === 'driver_found' && previousStatus === 'searching') {
      event = 'driver_assigned';
    } else if (status === 'completed') {
      event = 'completed';
    } else if (status === 'cancelled') {
      event = 'cancelled';
    }

    this.eventsService.emitRideUpdate({
      rideId: ride.id,
      ride,
      event,
    });

    return ride;
  }
}
