import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(2)
  storeName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(5)
  storeAddress!: string;

  @IsArray()
  @IsString({ each: true })
  categories!: string[];

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
