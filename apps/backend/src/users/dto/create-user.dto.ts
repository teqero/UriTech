import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '@uritech/shared';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsIn(['user', 'driver', 'vendor', 'admin'])
  role!: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
