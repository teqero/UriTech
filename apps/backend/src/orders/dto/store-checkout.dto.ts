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

class CheckoutItemDto {
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

export class StoreCheckoutDto {
  @IsString()
  storeId!: string;

  @IsString()
  storeName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsNumber()
  @Min(0)
  deliveryFee!: number;

  @IsNumber()
  @Min(1)
  total!: number;

  @IsOptional()
  @IsBoolean()
  payWithWallet?: boolean;
}
