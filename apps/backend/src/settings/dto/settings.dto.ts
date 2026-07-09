import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import type { ApiIntegrationType } from '@uritech/shared';

export class UpdateBrandDto {
  @IsOptional() @IsString() appName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() faviconUrl?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() primaryDark?: string;
  @IsOptional() @IsString() primaryLight?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() fontFamily?: string;
  @IsOptional() @IsString() supportEmail?: string;
  @IsOptional() @IsString() supportPhone?: string;
  @IsOptional() @IsString() defaultCity?: string;
  @IsOptional() @IsString() defaultCountry?: string;
  @IsOptional() @IsString() currencySymbol?: string;
}

export class CreateIntegrationDto {
  @IsString() name!: string;
  @IsString() type!: ApiIntegrationType;
  @IsString() provider!: string;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsString() apiSecret?: string;
  @IsOptional() @IsUrl() webhookUrl?: string;
  @IsOptional() @IsString() merchantId?: string;
  @IsOptional() @IsEnum(['sandbox', 'production']) environment?: 'sandbox' | 'production';
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsObject() config?: Record<string, string>;
}

export class UpdateIntegrationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() type?: ApiIntegrationType;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsString() apiSecret?: string;
  @IsOptional() @IsUrl() webhookUrl?: string;
  @IsOptional() @IsString() merchantId?: string;
  @IsOptional() @IsEnum(['sandbox', 'production']) environment?: 'sandbox' | 'production';
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsObject() config?: Record<string, string>;
}
