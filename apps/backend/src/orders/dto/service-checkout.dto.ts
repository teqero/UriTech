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

class ServiceItemDto {
  @ApiProperty({ example: 'Taxi Standard' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 2500, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  menuItemId?: string;
}

export class ServiceCheckoutDto {
  @ApiProperty({ example: 'taxi-standard', description: 'Chave do serviço' })
  @IsString()
  serviceKey!: string;

  @ApiProperty({ example: 'Taxi Standard' })
  @IsString()
  serviceName!: string;

  @ApiProperty({ type: [ServiceItemDto], description: 'Itens do serviço' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  items!: ServiceItemDto[];

  @ApiProperty({ example: 2500, minimum: 1 })
  @IsNumber()
  @Min(1)
  total!: number;

  @ApiProperty({ required: false, example: 500, description: 'Taxa de entrega' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiProperty({ required: false, example: 'Rua 123, Luanda' })
  @IsOptional()
  @IsString()
  destinationLabel?: string;

  @ApiProperty({ required: false, example: true, description: 'Pagar com saldo da carteira' })
  @IsOptional()
  @IsBoolean()
  payWithWallet?: boolean;
}
