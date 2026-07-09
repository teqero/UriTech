import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import type { TaxiMode, VehicleClass } from '@uritech/shared';

class LocationDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateRideDto {
  @IsEnum(['fixed', 'bid', 'rent'])
  mode!: TaxiMode;

  @IsObject()
  pickup!: LocationDto;

  @IsObject()
  destination!: LocationDto;

  @IsNumber()
  @Min(0)
  fare!: number;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsString()
  @IsNotEmpty()
  vehicleType!: VehicleClass;
}
