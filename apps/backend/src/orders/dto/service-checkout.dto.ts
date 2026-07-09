import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ServiceItemDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  menuItemId?: string;
}

export class ServiceCheckoutDto {
  @IsString()
  serviceKey!: string;

  @IsString()
  serviceName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  items!: ServiceItemDto[];

  @IsNumber()
  @Min(1)
  total!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  destinationLabel?: string;

  @IsOptional()
  @IsBoolean()
  payWithWallet?: boolean;
}
