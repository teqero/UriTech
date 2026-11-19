import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ImportProductDto {
  @IsString()
  url!: string;
}

export class UpdateSocialPaymentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
}

export class CheckoutSocialPaymentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsOptional()
  @IsString()
  deliveryOption?: 'pickup' | 'urigo' | 'none';

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  payWithWallet?: boolean;
}

export class PaySocialPaymentDto extends CheckoutSocialPaymentDto {}
