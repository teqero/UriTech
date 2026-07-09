import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import type { UserRole } from '@uritech/shared';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(['user', 'driver', 'vendor', 'admin', 'delivery_rider', 'service_provider', 'corporate', 'restaurant', 'pharmacy', 'supermarket', 'store'])
  role!: UserRole;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
