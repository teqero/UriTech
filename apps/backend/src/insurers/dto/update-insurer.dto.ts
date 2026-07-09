import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class UpdateInsurerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  contactPhone?: string;

  @IsOptional()
  @IsUrl()
  apiWebhookUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFeePerClaim?: number;

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
