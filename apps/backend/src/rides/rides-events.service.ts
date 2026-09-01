import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Ride } from '@uritech/shared';

export interface DriverLocationPayload {
  rideId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export interface RideUpdatePayload {
  rideId: string;
  ride: Ride;
  event: 'status_changed' | 'driver_assigned' | 'driver_location' | 'completed' | 'cancelled';
  driverLocation?: { lat: number; lng: number };
}

@Injectable()
export class RidesEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitRideUpdate(payload: RideUpdatePayload): void {
    this.eventEmitter.emit('ride.update', payload);
  }

  emitDriverLocation(payload: DriverLocationPayload): void {
    this.eventEmitter.emit('ride.driverLocation', payload);
  }
}
