import { IsArray, IsEnum, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { ClaimMediaType, IncidentType } from '@uritech/shared';

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

class ClaimMediaDto {
  @IsString()
  id!: string;

  @IsEnum(['photo', 'video', 'audio'])
  type!: ClaimMediaType;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  uri?: string;

  @IsOptional()
  @IsString()
  base64?: string;

  @IsString()
  capturedAt!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  durationSec?: number;
}

export class SubmitClaimDto {
  @IsString()
  insurerId!: string;

  @IsString()
  @MinLength(3)
  policyNumber!: string;

  @IsString()
  @MinLength(2)
  insuredName!: string;

  @IsString()
  @MinLength(8)
  insuredPhone!: string;

  @IsEnum(['colisao', 'capotamento', 'atropelamento', 'incendio', 'roubo', 'vidros', 'outro'])
  incidentType!: IncidentType;

  @IsOptional()
  @IsString()
  incidentDescription?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimMediaDto)
  media!: ClaimMediaDto[];
}
