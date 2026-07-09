import { Injectable } from '@nestjs/common';
import type { Location } from '@uritech/shared';

export interface DriverEntity {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car';
  vehiclePlate: string;
  rating: number;
  isOnline: boolean;
  currentLocation?: Location;
  totalRides: number;
  totalEarnings: number;
}

export type CreateDriverInput = Omit<DriverEntity, 'id' | 'rating' | 'totalRides' | 'totalEarnings' | 'currentLocation'>;

@Injectable()
export class DriversService {
  private drivers: DriverEntity[] = [
    {
      id: '1',
      userId: '5',
      name: 'Budi Santoso',
      phone: '+5511999990005',
      vehicleType: 'motorcycle',
      vehiclePlate: 'B 1234 XYZ',
      rating: 4.9,
      isOnline: true,
      currentLocation: { latitude: -6.2088, longitude: 106.8456 },
      totalRides: 1250,
      totalEarnings: 45000,
    },
    {
      id: '2',
      userId: '6',
      name: 'Andi Wijaya',
      phone: '+5511999990006',
      vehicleType: 'car',
      vehiclePlate: 'B 5678 ABC',
      rating: 4.7,
      isOnline: false,
      totalRides: 890,
      totalEarnings: 62000,
    },
  ];

  findAll() {
    return this.drivers;
  }

  findById(id: string) {
    return this.drivers.find((d) => d.id === id);
  }

  findOnline() {
    return this.drivers.filter((d) => d.isOnline);
  }

  toggleOnline(id: string) {
    const driver = this.drivers.find((d) => d.id === id);
    if (!driver) return null;
    driver.isOnline = !driver.isOnline;
    return driver;
  }

  updateLocation(id: string, location: Location) {
    const driver = this.drivers.find((d) => d.id === id);
    if (!driver) return null;
    driver.currentLocation = location;
    return driver;
  }

  create(data: CreateDriverInput) {
    const driver: DriverEntity = {
      ...data,
      id: String(this.drivers.length + 1),
      rating: 5,
      totalRides: 0,
      totalEarnings: 0,
    };
    this.drivers.push(driver);
    return driver;
  }
}
