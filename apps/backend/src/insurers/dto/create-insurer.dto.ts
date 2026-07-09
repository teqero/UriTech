import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class CreateInsurerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @MinLength(8)
  contactPhone!: string;

  @IsOptional()
  @IsUrl()
  apiWebhookUrl?: string;

  @IsNumber()
  @Min(0)
  platformFeePerClaim!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFeeMonthly?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  mandatedForClients?: boolean;
}
