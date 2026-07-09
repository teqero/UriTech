import { IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  platform?: string;
}
