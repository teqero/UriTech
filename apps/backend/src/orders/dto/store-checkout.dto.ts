import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Hambúrguer' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 3500, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  menuItemId?: string;
}

export class StoreCheckoutDto {
  @ApiProperty({ example: 'store-123', description: 'ID da loja' })
  @IsString()
  storeId!: string;

  @ApiProperty({ example: 'Kero Kilamba' })
  @IsString()
  storeName!: string;

  @ApiProperty({ type: [CheckoutItemDto], description: 'Itens do pedido' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiProperty({ example: 500, minimum: 0 })
  @IsNumber()
  @Min(0)
  deliveryFee!: number;

  @ApiProperty({ example: 7500, minimum: 1 })
  @IsNumber()
  @Min(1)
  total!: number;

  @ApiProperty({ required: false, example: false, description: 'Pagar com saldo da carteira' })
  @IsOptional()
  @IsBoolean()
  payWithWallet?: boolean;
}
