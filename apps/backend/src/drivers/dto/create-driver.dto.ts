import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsIn(['motorcycle', 'car'])
  vehicleType!: 'motorcycle' | 'car';

  @IsString()
  @MinLength(3)
  vehiclePlate!: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
